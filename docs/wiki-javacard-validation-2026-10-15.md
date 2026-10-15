# Wiki digest applet — real API compilation and scoped simulation, 2026-10-15

This continues the [repository wiki research](wiki-workspace-research-2026-10-15.md)
and [JavaCard protocol contract](../tools/wiki-workspace/javacard/README.md).
**It is not a CAP build, vendor-SDK certification, physical-card test or secure
filesystem implementation.**

## Backup first

Before editing, commit `7e5a1c35cb01971879373b48ca72950d0ee21d76` was confirmed as
both the local and open PR #116 head. The existing
[Drive backup](https://drive.google.com/drive/folders/1yZhxIeQDNTgO5UXdhttAsiID2On_Eqgr)
already covered it. The continuation Git bundle, overlay and TSV were downloaded
again; their SHA-256 values, advertised Git ref/prerequisite and all 18 changed
paths matched the committed source. The large objects remained present with the
recorded sizes/MD5 values; they were not downloaded or uploaded again. A fresh
`CHECKPOINT-7e5a1c3-20261015.json` was saved before this continuation. No merge or
sharing-permission change was made.

## Dependency decision and provenance

The current jCardSim README describes an in-memory JavaCard 3.0.5 implementation,
not an ordinary JVM running on a physical card. Its POM requires an Oracle
`JC_CLASSIC_HOME` API JAR plus external Maven dependencies. Those sources were
inspected; that build was not reproduced or substituted with homemade API stubs.
[1](https://github.com/licel/jcardsim/blob/41511ec2a3d3dfa7a5fe2d07f5b4e56bc9c8dd56/README.md)
[2](https://github.com/licel/jcardsim/blob/41511ec2a3d3dfa7a5fe2d07f5b4e56bc9c8dd56/pom.xml)

The same official repository retains a `jc2.2.2` branch containing actual
`javacard.framework` source and a self-contained test JAR. The source headers and
POM identify the simulator as Apache-2.0; its Bouncy Castle components have a
separate MIT-style notice. This older implementation was used **only** for
bounded, synthetic in-memory tests, not deployed, installed globally, added to
the wiki's runtime classpath or exposed as an APDU service.
[3](https://github.com/licel/jcardsim/tree/cd479018d16b1467f075d2c5d9a1064d724269cb)
[4](https://github.com/licel/jcardsim/blob/cd479018d16b1467f075d2c5d9a1064d724269cb/src/main/java/javacard/framework/OwnerPIN.java)
[5](https://github.com/licel/jcardsim/blob/cd479018d16b1467f075d2c5d9a1064d724269cb/NOTICE)

| Pin | Value |
| --- | --- |
| Source repository | `licel/jcardsim` |
| Commit | `cd479018d16b1467f075d2c5d9a1064d724269cb` |
| File | `jcardsim-2.2.2-all.jar` |
| Bytes | 394,661 |
| Git blob | `0ac10c0143f06fb4b256dc5877010450351b7812` |
| SHA-256 | `33c167e9bf989c3fca692f8053b8032280a1cbca79df818e131c486dd174746a` |

The runner verifies both SHA-256 and the Git blob identity before compilation or
execution. It retains the publisher's exact JAR bytes; no signatures or
certificate checks are stripped. This is pinned-source provenance, not a claim
that its old signatures or crypto implementation meet modern security standards.
Missing/altered dependencies fail closed, and `--offline` never downloads or
substitutes another version.

An SDK mirror was also inspected. Its README attributes the binaries to Oracle
and distinguishes SDK/API versions; its distribution notice has additional
conditions. No Oracle SDK binaries were downloaded, terms accepted, CAP converter
run or SDK redistributed in this pass. Selecting a licensed vendor/Oracle SDK
is still a separate target decision.
[6](https://github.com/martinpaljak/oracle_javacard_sdks/blob/700ec80afdda210a0e62fb6a151a9cddc1acd244/README.md)
[7](https://github.com/martinpaljak/oracle_javacard_sdks/blob/700ec80afdda210a0e62fb6a151a9cddc1acd244/jc305u4_kit/legal/Distribution_ReadME.txt)

## What actually ran

```sh
npm run test:wiki-javacard
npm run test:wiki-javacard -- --offline
```

- The production applet source was type-checked with `javac --release 8` against
  the pinned simulator's real API classes, producing JVM class-file version 52.
- The host harness was compiled separately with `--release 11` to use JDK
  `CommandAPDU`/`ResponseAPDU` value objects. It uses no `TerminalFactory`, reader,
  network adapter, GlobalPlatform install command or physical device.
- Both the initial dependency-fetch run and the fully offline rerun succeeded.
- Actual JVM disassembly and a machine-readable report are emitted into ignored
  `build/wiki-javacard/`. The compiled `.class` is **not** an installable CAP.
- Three ordinary Node tests check the pinned scope and reject a missing/altered
  JAR before Java lookup, without deleting a prior report.

[Full before/after evidence](../research/wiki-workspace/javacard-validation-20261015.json)
records source/class hashes, toolchain, dependency pin and every case. Its 28
checks are deliberately separated by scope:

| Scope | Checks | Meaning |
| --- | ---: | --- |
| Applet behavior | 19 | select/read, 8–16-byte PINs, update authorization, retries/lockout, malformed commands, selection/reset workflow and transaction-start failure |
| Installation parser | 6 | null/bounds/short-wrap handling, container lengths and PIN constraints; direct parser calls, not secure provisioning |
| Host framing | 1 | the JDK rejects a truncated APDU before simulation |
| Simulator characterization | 2 | confirms missing rollback and incorrect Le modeling; **not** successful conformance tests for those features |

## Changes justified by the checks

The original source passed 17/28 under the new requirements. That does not mean
there were eleven proven hardware vulnerabilities: several cases specify a
stricter failure policy, and the reset case exposes a simulator limitation.

1. **Installation parser:** validate null/negative/out-of-range inputs and avoid
   short arithmetic overflow before reading fields. Invalid lengths now produce
   intentional ISO status exceptions instead of escaping null/array exceptions.
2. **VERIFY:** revoke an earlier authorization before receiving any new PIN
   attempt, including a malformed one. Wrong valid-size candidates still consume
   the three-attempt PIN budget; successful verification resets that budget.
3. **SET ROOT:** consume one grant before receiving data or starting a transaction.
   A malformed update or transaction-start failure cannot leave an old grant
   usable. A caught failure within an applet-started transaction attempts abort;
   a failed begin does not make the applet explicitly abort a pre-existing transaction.
4. **Rejected headers/commands:** invalid CLA, P1/P2 or INS processed by the applet
   revoke a prior grant. Public reads do not replenish retries.
5. **Selection:** explicitly clear validation on selection as well as deselection.
   Failed/blocked PINs are not unblocked by this reset. This is defense in depth,
   not a replacement for a correct JCRE reset implementation.
6. **Receive loop:** reject negative/oversized counts and counts beyond the
   remaining declared data. Fragmented transport itself is still unvalidated.

All 28 checks then passed. The wire AID, valid command shapes, public 32-byte
anchor and lack of a default PIN are unchanged. All test PINs are synthetic;
none are provisioning defaults or actual user secrets.

## Why simulation is not the remaining proof

The pinned `SimulatorRuntime` copies complete commands into an APDU buffer. Its
`SimulatorSystem` transaction methods change a depth counter, not a persistent
memory journal. The abort probe observes a copied byte remaining changed after
abort. Its outgoing Le helper reports 256 even when the host requested 1. The
simplified reset path also must not be treated as proof of transient-memory or
power-loss behavior.
[8](https://github.com/licel/jcardsim/blob/cd479018d16b1467f075d2c5d9a1064d724269cb/src/main/java/com/licel/jcardsim/base/SimulatorRuntime.java)
[9](https://github.com/licel/jcardsim/blob/cd479018d16b1467f075d2c5d9a1064d724269cb/src/main/java/com/licel/jcardsim/base/SimulatorSystem.java)
[10](https://github.com/licel/jcardsim/blob/cd479018d16b1467f075d2c5d9a1064d724269cb/src/main/java/javacard/framework/APDU.java)

Still required: a chosen card/API/SDK target, licensed SDK compilation and CAP
conversion/verification, fragmented T=0/T=1 and Le behavior, transaction-buffer
exhaustion and EEPROM power interruption, secure provisioning and PIN-channel
protection, side-channel/security review, and explicitly approved tests on a
disposable card. No physical card, card PIN, wallet seed, cloud wiki or sharing
setting was touched. Ghidra/native conversion and historical More Wiki 0.9.9
recovery are independent outstanding work, not implied by these results.
