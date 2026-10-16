# JavaCardOS / JavaCard Classic digest service — validated source prototype

**API-compiled and exercised in pinned jCardSim 2.2.2; not a CAP or hardware-tested
service.** The follow-up goes beyond the initial JDK parse-only check, but uses
an old, in-memory JavaCard Classic API implementation—not an Oracle/card-vendor
SDK or a physical card. JavaCardOS tools manage cards and APDUs; they do not make
the standard desktop JVM or ACME server run on a smart card.

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
| `80 20 00 00` | PIN bytes | clears any previous grant, then validates PIN; wrong candidates return `63Cx` with remaining tries |
| `80 30 00 00` | new 32-byte digest | consumes one validated grant before receiving data; uses a JavaCard transaction to update the digest |

The PIN retry limit is three. Selection and deselection reset validation, not
failed/blocked PIN retry counters. Malformed VERIFY/SET payloads and invalid
CLA/P1/P2/INS commands processed by the applet revoke prior authorization. A
public READ does not replenish retries. Every SET attempt needs a fresh
successful VERIFY, including after an earlier malformed or failed SET.
Transport failures before the applet is invoked remain a JCRE/card validation
item; the applet cannot react to a command it never receives.

Installation ranges and length-prefixed fields are checked before array access
or short-cursor advancement. This prevents null, negative-offset, overrun and
short-wrap exceptions from escaping the parser.

There is no unblock,
change-PIN or recovery command in this prototype. A production design needs a
reviewed lifecycle/recovery procedure; do **not** deploy it on a valuable card.
The host CLI intentionally implements only SELECT and READ, not provisioning or
PIN submission. No HTTP endpoint forwards arbitrary APDUs to a reader.

## Validation boundaries and next steps

Run the optional integration suite with Node 20+, curl and JDK 11+:

```sh
npm run test:wiki-javacard
npm run test:wiki-javacard -- --offline
```

The first run fetches **only** the pinned 394,661-byte Apache-licensed historical
simulator JAR from `licel/jcardsim`, verifies its SHA-256 and Git blob id, and
caches it under `.cache/wiki-javacard/`. It is not installed globally, included
in the wiki JAR/XDC, or exposed over a network. `WIKI_JCARDSIM_JAR` can point to
an existing copy, but it must match the same pinned hash. Offline mode never
downloads or substitutes a different version. No Oracle SDK binaries or
physical reader/terminal are accessed.

The applet compiles with `--release 8` against that implementation's real
`javacard.framework` classes. The host test harness compiles separately with
`--release 11` for JDK APDU value objects. Outputs stay in `build/wiki-javacard/`:
compiled classes, `VaultDigestApplet.javap.txt` and `report.json`. These JVM class
files are **not** CAP files. Compilation does not verify the complete JavaCard
language subset or a vendor SDK's linkage rules.

The 28 scoped checks comprise **19 applet cases, 6 installation-parser cases,
1 host-framing case and 2 simulator-limit probes**. All passed after hardening;
the original source passed 17/28 under these newly specified requirements.
Separate Node tests reject altered/missing dependencies before Java lookup.
See [the validation report](../../../docs/wiki-javacard-validation-2026-10-15.md)
and [machine-readable evidence](../../../research/wiki-workspace/javacard-validation-20261015.json).

The limitation probes deliberately confirm that this old simulator **does not
roll back array changes on transaction abort** and reports `Le=256` even when
the host asks for 1. They are not successful rollback or Le-conformance tests.
Its simplified transport/reset model cannot validate fragmented T=0/T=1 I/O,
EEPROM power loss, constant-time PIN checking or cryptographic security. The
explicit selection reset is defense in depth, not a claim to repair its JCRE.

Pending: choose and review a specific card/vendor SDK and its license, compile
against that API, perform CAP conversion and verification, and test the missing
transport/persistence behavior on an appropriate simulator and disposable card
with explicit user approval. Secure provisioning and verification-channel
protection also need a design review. An actual secure-element encryption/key-
wrapping service is a separate project; it is not implemented here.

A WASM emulator can help test host logic, but it does not inherit a physical
secure element's tamper resistance. QEMU's qcow2 format and its LUKS encryption
metadata are a different storage/runtime problem, not a JavaCard filesystem.
