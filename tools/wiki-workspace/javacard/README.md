# JavaCardOS / JavaCard Classic digest service — source prototype

**Not built as a CAP, installed, simulated, or tested on hardware.** A JDK parser
check is not JavaCard SDK type-checking. JavaCardOS tools manage cards and APDUs;
they do not make the standard desktop JVM or ACME server run on a smart card.

The feasible split is:

1. Host JVM: ACME HTTP, repository bytes, filesystem, encryption envelopes and GUI.
2. Browser: HTML5/TiddlyWiki, WebCrypto and DjVu WASM rendering.
3. Card: optionally store an integrity anchor or mediate a narrowly specified key
   operation. This prototype only stores the **32-byte catalog snapshot digest**.

`VaultDigestApplet.java` uses the JavaCard Classic API and short APDUs. It does
not store the repository, decrypt files, use a BIP-39 mnemonic, implement a web
server, or prove confidentiality. A digest on a card is only useful if the
reader and the card provisioning/update workflow are trusted.

## Installation and APDU contract

Experimental instance AID: `F048544D4C3501`. This is **not** a registered production
AID. The standard install parameter container is parsed as instance-AID length
and bytes, control-info length and bytes, then application-data length and bytes.
Application data must be:

```text
snapshotDigest[32] | pinLength[1] | pin[8..16]
```

There is no built-in/default PIN. Provision a card-specific random PIN through
an authenticated GlobalPlatform secure channel. Do not put a production PIN in
test vectors, source control, a URL, or the chat. Commands have P1=P2=0:

| CLA / INS | Input | Output / behavior |
| --- | --- | --- |
| `00 A4 04 00` | instance AID | ISO SELECT, performed by host client |
| `80 10 00 00` | no data; Le=32 | returns snapshot digest, then `9000` |
| `80 20 00 00` | PIN bytes | validates PIN; failure returns `63Cx` with remaining tries |
| `80 30 00 00` | new 32-byte digest | requires validated PIN; atomic persistent update; resets validation |

The PIN retry limit is three. Deselect resets validation. There is no unblock,
change-PIN or recovery command in this prototype. A production design needs a
reviewed lifecycle/recovery procedure; do **not** deploy it on a valuable card.
The host CLI intentionally implements only SELECT and READ, not provisioning or
PIN submission. No HTTP endpoint forwards arbitrary APDUs to a reader.

## Validation boundaries and next steps

Completed: parse-only check with the real JDK parser:

```sh
java tools/verify_javacard_parse.java tools/wiki-workspace/javacard/VaultDigestApplet.java
```

Pending: choose a specific card/JavaCard SDK version, compile against that API,
run CAP conversion and verification, then simulate APDU fragmentation, wrong
CLA/INS/P1/P2/length, retries, deselect, transaction abort and power loss. Finally
test SELECT/READ and PIN-gated updates on a disposable card with explicit user
approval. An actual secure-element encryption/key-wrapping service would need a
separate threat model and cryptographic design; it is not implemented here.

A WASM emulator can help test host logic, but it does not inherit a physical
secure element's tamper resistance. QEMU's qcow2 format and its LUKS encryption
metadata are a different storage/runtime problem, not a JavaCard filesystem.
