// Test-only independent OpenPGP reader. Not an app feature or a production CLI.
// Only fresh synthetic, unprotected secret packets enter private temporary
// directories. No account/keyserver/network API, passphrase or owner key input.
package main

import (
	"bytes"
	"crypto"
	_ "crypto/sha256"
	_ "crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"runtime/debug"
	"strings"
	"time"

	"github.com/ProtonMail/go-crypto/openpgp/armor"
	"github.com/ProtonMail/go-crypto/openpgp/packet"
	openpgp "github.com/ProtonMail/go-crypto/openpgp/v2"
)

const maximumBytes = 4 << 20
const moduleVersion = "v1.5.2"

func configuration() *packet.Config {
	return &packet.Config{
		Algorithm:              packet.PubKeyAlgoEd25519,
		V6Keys:                 true,
		DefaultHash:            crypto.SHA512,
		DefaultCipher:          packet.CipherAES256,
		DefaultCompressionAlgo: packet.CompressionNone,
		AEADConfig:             &packet.AEADConfig{DefaultMode: packet.AEADModeOCB},
		KeyLifetimeSecs:        3600,
	}
}

func boundedRead(path string) ([]byte, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil || !info.Mode().IsRegular() || info.Size() > maximumBytes {
		return nil, errors.New("invalid bounded test input")
	}
	data, err := io.ReadAll(io.LimitReader(file, maximumBytes+1))
	if err != nil || len(data) > maximumBytes {
		return nil, errors.New("oversized test input")
	}
	return data, nil
}

func writeExclusive(path string, data []byte) error {
	file, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return err
	}
	_, err = file.Write(data)
	closeErr := file.Close()
	if err != nil || closeErr != nil {
		os.Remove(path)
		return errors.New("test output write failed")
	}
	return nil
}

func fingerprint(value string) ([]byte, error) {
	if len(value) != 64 {
		return nil, errors.New("entire v6 fingerprint required")
	}
	decoded, err := hex.DecodeString(value)
	if err != nil || len(decoded) != 32 {
		return nil, errors.New("invalid v6 fingerprint")
	}
	return decoded, nil
}

// Preflight packets before ReadEntity: ReadKeyRing can otherwise skip malformed
// or unsupported certificates. This deliberately narrow test profile requires
// exactly one v6 Ed25519 primary and one v6 X25519 bound encryption subkey.
func readEntity(path string, private bool, expectedPrimary, expectedEncryption string) (*openpgp.Entity, error) {
	primary, err := fingerprint(expectedPrimary)
	if err != nil {
		return nil, err
	}
	encryption, err := fingerprint(expectedEncryption)
	if err != nil {
		return nil, err
	}
	data, err := boundedRead(path)
	if err != nil {
		return nil, err
	}
	kind := openpgp.PublicKeyType
	if private {
		kind = openpgp.PrivateKeyType
	}
	text := strings.TrimSpace(string(data))
	if !strings.HasPrefix(text, "-----BEGIN "+kind+"-----") ||
		!strings.HasSuffix(text, "-----END "+kind+"-----") ||
		strings.Count(text, "-----BEGIN") != 1 || strings.Count(text, "-----END") != 1 {
		return nil, errors.New("one complete test armor block required")
	}
	block, err := armor.Decode(strings.NewReader(text))
	if err != nil || block.Type != kind {
		return nil, errors.New("wrong test armor kind")
	}
	binary, err := io.ReadAll(io.LimitReader(block.Body, maximumBytes+1))
	if err != nil || len(binary) > maximumBytes {
		return nil, errors.New("invalid test armor contents")
	}
	reader := bytes.NewReader(binary)
	primaries, subkeys, signatures, count := 0, 0, 0, 0
	for {
		part, err := packet.Read(reader)
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		count++
		if count > 128 {
			return nil, errors.New("excessive test key packets")
		}
		var public *packet.PublicKey
		switch value := part.(type) {
		case *packet.PublicKey:
			if private {
				return nil, errors.New("mixed secret/public test packets")
			}
			public = value
		case *packet.PrivateKey:
			if !private || value.Encrypted {
				return nil, errors.New("only synthetic unprotected test secrets are accepted")
			}
			public = &value.PublicKey
		case *packet.Signature:
			if value.Version != 6 {
				return nil, errors.New("non-v6 test signature")
			}
			signatures++
		case *packet.UserId:
		default:
			return nil, errors.New("unsupported test packet")
		}
		if public != nil {
			if public.Version != 6 {
				return nil, errors.New("non-v6 test key")
			}
			if public.IsSubkey {
				subkeys++
				if public.PubKeyAlgo != packet.PubKeyAlgoX25519 || !bytes.Equal(public.Fingerprint, encryption) {
					return nil, errors.New("test encryption fingerprint/algorithm mismatch")
				}
			} else {
				primaries++
				if public.PubKeyAlgo != packet.PubKeyAlgoEd25519 || !bytes.Equal(public.Fingerprint, primary) {
					return nil, errors.New("test primary fingerprint/algorithm mismatch")
				}
			}
		}
	}
	if primaries != 1 || subkeys != 1 || signatures < 2 {
		return nil, errors.New("ambiguous or incomplete test certificate")
	}
	entity, err := openpgp.ReadEntity(packet.NewReader(bytes.NewReader(binary)))
	if err != nil {
		return nil, err
	}
	if _, err = entity.VerifyPrimaryKey(time.Now(), configuration()); err != nil {
		return nil, err
	}
	selected, err := entity.EncryptionKeyWithError(time.Now(), configuration())
	if err != nil || !bytes.Equal(selected.PublicKey.Fingerprint, encryption) {
		return nil, errors.New("no validated test encryption binding")
	}
	return entity, nil
}

func identity(entity *openpgp.Entity) map[string]any {
	return map[string]any{
		"primaryFingerprint":    strings.ToUpper(hex.EncodeToString(entity.PrimaryKey.Fingerprint)),
		"encryptionFingerprint": strings.ToUpper(hex.EncodeToString(entity.Subkeys[0].PublicKey.Fingerprint)),
		"primaryVersion":        entity.PrimaryKey.Version,
		"subkeyVersion":         entity.Subkeys[0].PublicKey.Version,
		"primaryAlgorithm":      int(entity.PrimaryKey.PubKeyAlgo),
		"subkeyAlgorithm":       int(entity.Subkeys[0].PublicKey.PubKeyAlgo),
		"subkeys":               len(entity.Subkeys),
	}
}

func armored(entity *openpgp.Entity, private bool) ([]byte, error) {
	var out bytes.Buffer
	kind := openpgp.PublicKeyType
	if private {
		kind = openpgp.PrivateKeyType
	}
	writer, err := armor.EncodeWithChecksumOption(&out, kind, nil, false)
	if err != nil {
		return nil, err
	}
	if private {
		err = entity.SerializePrivateWithoutSigning(writer, configuration())
	} else {
		err = entity.Serialize(writer)
	}
	if err != nil {
		return nil, err
	}
	if err = writer.Close(); err != nil {
		return nil, err
	}
	return out.Bytes(), nil
}

// Header/framing checks are independent of JS inspection. Reading the encrypted
// body here does not authenticate it; decrypt below must also consume EOF.
func envelope(data, expectedEncryption []byte, expectedMode packet.AEADMode) error {
	reader := bytes.NewReader(data)
	first, err := packet.Read(reader)
	if err != nil {
		return err
	}
	session, ok := first.(*packet.EncryptedKey)
	if !ok || session.Version != 6 || session.KeyVersion != 6 ||
		session.Algo != packet.PubKeyAlgoX25519 || !bytes.Equal(session.KeyFingerprint, expectedEncryption) {
		return errors.New("unexpected test PKESK profile or full fingerprint")
	}
	second, err := packet.Read(reader)
	if err != nil {
		return err
	}
	body, ok := second.(*packet.SymmetricallyEncrypted)
	if !ok || !body.IntegrityProtected || body.Version != 2 || body.Cipher != packet.CipherAES256 || body.Mode != expectedMode {
		return errors.New("unexpected test SEIPD/cipher/AEAD profile")
	}
	if _, err = io.Copy(io.Discard, body.Contents); err != nil {
		return err
	}
	if _, err = packet.Read(reader); err != io.EOF {
		return errors.New("extra or malformed test envelope packets")
	}
	return nil
}

func operation(args []string) error {
	if len(args) == 1 && args[0] == "--version" {
		build, ok := debug.ReadBuildInfo()
		if !ok {
			return errors.New("missing Go module build identity")
		}
		for _, dependency := range build.Deps {
			if dependency.Path == "github.com/ProtonMail/go-crypto" && dependency.Version == moduleVersion && dependency.Replace == nil {
				return json.NewEncoder(os.Stdout).Encode(map[string]string{
					"reader": "ProtonMail/go-crypto/openpgp/v2", "module": moduleVersion, "go": runtime.Version(),
				})
			}
		}
		return errors.New("unexpected Go crypto module")
	}
	if len(args) == 2 && args[0] == "generate" {
		info, err := os.Stat(args[1])
		if err != nil || !info.IsDir() || info.Mode().Perm()&0077 != 0 {
			return errors.New("private synthetic directory required")
		}
		entity, err := openpgp.NewEntity("Synthetic native v6 control only", "", "", configuration())
		if err != nil {
			return err
		}
		for _, private := range []bool{false, true} {
			data, err := armored(entity, private)
			if err != nil {
				return err
			}
			name := "synthetic-public.asc"
			if private {
				name = "synthetic-private.asc"
			}
			if err = writeExclusive(filepath.Join(args[1], name), data); err != nil {
				return err
			}
		}
		return json.NewEncoder(os.Stdout).Encode(identity(entity))
	}
	if len(args) == 4 && args[0] == "inspect" {
		entity, err := readEntity(args[1], false, args[2], args[3])
		if err != nil {
			return err
		}
		return json.NewEncoder(os.Stdout).Encode(identity(entity))
	}
	if len(args) != 6 || (args[0] != "encrypt" && args[0] != "decrypt") {
		return errors.New("invalid synthetic operation")
	}
	entity, err := readEntity(args[1], args[0] == "decrypt", args[4], args[5])
	if err != nil {
		return err
	}
	input, err := boundedRead(args[2])
	if err != nil {
		return err
	}
	if args[0] == "encrypt" {
		var output bytes.Buffer
		writer, err := openpgp.Encrypt(&output, []*openpgp.Entity{entity}, nil, nil, nil, configuration())
		if err != nil {
			return err
		}
		if _, err = writer.Write(input); err != nil {
			return err
		}
		if err = writer.Close(); err != nil {
			return err
		}
		// The fresh JS control advertises GCM as well as OCB. This upstream
		// high-level writer prefers common GCM regardless of DefaultMode.
		// Assert that exact reverse-direction profile, not a forced rewrite
		// of the recipient's signed preferences. Release input stays OCB.
		if err = envelope(output.Bytes(), entity.Subkeys[0].PublicKey.Fingerprint, packet.AEADModeGCM); err != nil {
			return err
		}
		return writeExclusive(args[3], output.Bytes())
	}
	if err = envelope(input, entity.Subkeys[0].PublicKey.Fingerprint, packet.AEADModeOCB); err != nil {
		return err
	}
	message, err := openpgp.ReadMessage(bytes.NewReader(input), openpgp.EntityList{entity}, nil, configuration())
	if err != nil || !message.IsEncrypted || message.IsSymmetricallyEncrypted || message.IsSigned {
		return errors.New("unexpected synthetic encrypted message")
	}
	// Do not create a destination or expose unauthenticated prefixes. An AEAD
	// final-tag error can occur only at EOF, after earlier chunks were read.
	plaintext, err := io.ReadAll(io.LimitReader(message.UnverifiedBody, maximumBytes+1))
	if err != nil || len(plaintext) > maximumBytes {
		return errors.New("synthetic plaintext authentication/size failure")
	}
	if !bytes.Equal(message.DecryptedWith.PublicKey.Fingerprint, entity.Subkeys[0].PublicKey.Fingerprint) {
		return errors.New("unexpected synthetic decryption key")
	}
	return writeExclusive(args[3], plaintext)
}

func main() {
	if err := operation(os.Args[1:]); err != nil {
		// Never quote imported UIDs, argv, plaintext, key armor or library errors.
		fmt.Fprintln(os.Stderr, "Synthetic v6 reader operation failed.")
		os.Exit(1)
	}
}
