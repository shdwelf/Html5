# VCHIP — a virtual chipset that locks the boot path

`vchip` is a synthesizable Verilog chipset model that refuses to hand control to a
boot stage it has not measured. It exists to answer a narrow question with real
artifacts instead of prose: *can a storage controller be made to enforce a measured
boot chain, refuse to be talked out of it, and refuse to let an attacker destroy
the evidence?*

Everything in this document is reproducible from the repository. Numbers quoted
below were produced by `python3 tools/verify_rtl.py` on the current tree.

---

## 1. What problem this solves

The threat model is physical access without a trusted operator:

* the disk, the ESP, or the firmware image can be swapped or edited by hand;
* the host can issue ATA commands (that is what `hdparm` is) including the
  destructive ones: `SECURITY ERASE UNIT`, vendor reflash;
* the host can be rebooted at will, so any state a reboot clears is not a defence.

The chipset therefore:

1. measures each boot stage in order and extends a running vector;
2. compares the running vector against a provisioned golden vector *per stage*;
3. hands control onward only when every stage matched, in order;
4. on any mismatch, out-of-order or repeated measurement: latches a tamper flag,
   drops to `LOCKED`, and denies *all* capability — including the destructive ATA
   commands that would let the attacker re-image the box and try again;
5. keeps denying until a power-on reset, and never re-opens the chain.

## 2. Files

| file | role |
| --- | --- |
| `rtl/vchip_pkg.vh` | widths, stage/state/boot-mode/abort encodings, ATA opcodes |
| `rtl/vchip_mix.v` | the extend/mix function (4×16-bit lanes, 4 rounds) |
| `rtl/boot_vector_lock.v` | measurement chain, golden compare, tamper latch, lock state |
| `rtl/ata_security_fsm.v` | ATA security command set + capability gates |
| `rtl/vchip_top.v` | integration, boot-mode policy, recovery strap, status word |
| `rtl/formal/vchip_formal_top.v` | 20 invariants over the design, for SAT proofs |
| `js/vchip-model.js` | the reference model — the specification, in JS |
| `rtl/scenarios/vchip_scenarios.json` | 8 scenarios / 101 cycles, the conformance corpus |
| `tools/gen_vchip_vectors.mjs` | scenario file → `rtl/golden/vchip_vectors.{json,h}` |
| `tools/sim/vchip_driver.cc` | CXXRTL driver: runs the RTL, prints the transcript |
| `tools/verify_rtl.py` | orchestrates synthesis, build, transcript diff, SAT proofs, boot-chain checks |
| `tools/bootchain.py` | boot-chain requirement checker (disk structures + platform status word) |
| `js/bootchain.js` | the browser half of the same rules, verified against the RTL layout |
| `chipset-lab.html` + `js/chipset-lab.js` | the page: decode a status word, see the requirements and ATA gates |
| `tools/verify_bootchain.mjs`, `tests/11-chipset-lab.mjs` | keep the JS mirror and the page honest |
| `js/avrdis.js`, `js/avrhex.js` | classic-AVR instruction decoder + Intel HEX parser (the firmware walkthrough) |
| `tools/ghidra_avr.mjs`, `tools/verify_avrdis.mjs` | walk an AVR image from its reset vector; check the decoder against upstream's own `avr-objdump` listing |
| `avr-lab.html` + `js/avr-lab.js`, `tests/13-avr-lab.mjs` | the page: decode a bootloader, see dead flash-write sites and the symbol names |
| `tools/setup_rtl.sh` | installs the Yosys toolchain (user-space) and runs the verification |

The simulation path is **yosys Yosys 0.69 `write_cxxrtl` → g++ → `sim/vchip_rtl`**.
There is no event-driven Verilog simulator in this environment (no iverilog, no
`sim` command, no java for a real Ghidra); CXXRTL is a compiled simulator, which
turned out to be an advantage: the transcript is produced by C++ that also
asserts the status word (section 6).

## 3. The measurement chain

`vchip_mix(acc, digest)` is a 64-bit vector function over four 16-bit lanes:

```
for r in 0..3:
  for each lane i:
    acc[i] = rotl16(acc[i] ^ dig[(i + r)     % 4], 5)
           + dig[(i + r + 1) % 4]
           + (0xACE1 + r * 0x1B3F)
```

`js/vchip-model.js` is the normative definition; `rtl/vchip_mix.v` must agree with
it bit-for-bit, and `tools/sim/vchip_driver.cc` checks exactly that against 107
vectors (edges first — all-zeros, all-ones, single-bit lanes, lane-swap patterns —
then a seeded xorshift sequence) before it runs a single scenario. A mismatch is a
non-zero exit, not a warning.

**This mixer is not a cryptographic hash and does not claim to be.** It is a
stand-in so that the *chain arithmetic and lock policy* can be verified
cycle-accurately and reproduced independently in JS. The interface is what
matters: swap in a vetted SHA-256 core with the same `acc/dig/mix` shape and
nothing else in the design changes. The measurement digests in the scenario file
(`1122334455667788`, `99aabbccddeeff00`, `0123456789abcdef`, `deadbeefcafebabe`)
are 64-bit stand-ins for real stage measurements, for the same reason.

Stages, mapped to things a real boot chain has:

| stage | encoding | artifact |
| --- | --- | --- |
| `STAGE_MBR` | `2'd0` | LBA0: DOS/MBR label written by `fdisk`, or the GPT protective MBR |
| `STAGE_EFI` | `2'd1` | the ESP boot application (`\EFI\BOOT\BOOTX64.EFI`, PE32+) |
| `STAGE_LOADER` | `2'd2` | second stage: GRUB `core.img`, LILO, `elilo` |

Unlock is *not* "the final vector matched". Each stage's running vector is
compared against a golden vector for that stage, and success requires the final
stage to match while stages 0 and 1 are already marked matched:

```
if (!stage_match)                         -> tamper_latch, LOCKED
else if (meas_stage == STAGES-1)
     if (stage_ok_mask[0] && stage_ok_mask[1]) -> LCK_UNLOCKED
     else                                      -> tamper_latch, LOCKED
```

Everything else about the lock is a guard on that path:

* `arm_latched` — measuring before the platform asserts `arm` is refused, and
  `arm` itself is sticky until power-on reset, so deasserting it later cannot
  switch enforcement off;
* `in_order` — `meas_stage` must equal `expected_stage`; a loader that claims to be
  the MBR, or a replayed stage, latches tamper;
* `closed` — once `LOCKED` **or** `UNLOCKED`, the chain is complete. A later
  "stage" is a duplicate or an attempt to roll the vector, so it is refused and
  counted (`ignored_measurements`), never accepted;
* provisioning is only writable before the first measurement; any other attempt
  sets `prov_violation` and (with `policy_prov_latches`, default on) the tamper
  latch.

### The race the SAT solver found

An earlier revision merely ordered the provisioning block before the measurement
block. A provisioning violation and a valid measurement in the *same* cycle then
left `tamper_latch = 1` with `lock_state = UNLOCKED` for one cycle — a
tampered-but-not-locked window, found by bounded SAT, not by review. The attack
signal is now resolved combinationally (`prov_attack_latches`, `closed_now`) so it
poisons a measurement arriving in that same cycle, and scenario `prov_race` pins
the behaviour so it cannot come back:

```
prov_race#006 ... chain=0 tamper=1 state=3 mask=0001 ext=1 ign=1
prov_race#007 ... chain=0 tamper=1 state=3 mask=0001 ext=2 ign=2
```

`chain_ok` is deliberately **not** a register:

```verilog
assign chain_ok = (lock_state == `LCK_UNLOCKED) & ~tamper_latch;
```

Registered, it would still have read 1 in the cycle the latch was set. Derived,
`tamper_latch -> ~chain_ok` holds in *every* cycle, which is one of the proved
properties (`inv_tamper_no_chain`). The same reasoning applies to every ATA
capability gate — see section 5.

## 4. Lock states and the enforcement matrix

| state | encoding | meaning |
| --- | --- | --- |
| `LCK_IDLE` | `2'd0` | nothing measured; provisioning open |
| `LCK_MEASURING` | `2'd1` | at least one stage extended, chain still open |
| `LCK_UNLOCKED` | `2'd2` | every stage matched, in order |
| `LCK_LOCKED` | `2'd3` | fail-closed; only power-on reset clears it |

| capability | RTL expression | refused when |
| --- | --- | --- |
| `cpu_release` | `chain_ok & mode_ok & (boot_kind != BOOT_NONE) & ~tamper_latch` | chain incomplete, wrong boot source for policy, no source, tampered |
| `media_write_allow` | `chain_ok & ~tamper_latch & ~sec_locked` | unverified chain, tamper, ATA-locked |
| `media_read_allow` | same as write | as above |
| `erase_grant` | `erase_req & chain_ok & ~tamper_latch & allow_destructive` | unverified chain, tamper, policy |
| `reflash_grant` | `reflash_req & chain_ok & ~tamper_latch` (+ `recovery_ok` strap at accept time) | unverified chain, tamper, no physical presence |

The boot-mode policy (`policy_boot_mode`) is separate from the chain: `MODE_UEFI`
refuses a legacy/CSM handoff even with a perfect chain, and `MODE_LEGACY` refuses
a UEFI one. Denials are reported as `boot_deny_reason` (`DENY_CHAIN`, `DENY_MODE`,
`DENY_SOURCE`, `DENY_TAMPER`, `DENY_ARM`), so a refusal is diagnosable instead of
silent.

## 5. ATA security, and what `hdparm` can still do

`rtl/ata_security_fsm.v` models the ATA security command set as the drive's own
state machine, then puts the chipset's gates on top. The mapping to `hdparm`:

| opcode | ATA command | hdparm | effect in this model |
| --- | --- | --- | --- |
| `0xF1` | SECURITY SET PASSWORD | `--security-set-pass PWD` | enables security; aborts if frozen |
| `0xF2` | SECURITY UNLOCK | `--security-unlock PWD` | clears lock; bad password increments the counter |
| `0xF3` | SECURITY ERASE PREPARE | `--security-erase PWD` (part 1) | must precede ERASE UNIT |
| `0xF4` | SECURITY ERASE UNIT | `--security-erase PWD` / `--security-erase-enhanced` | destructive; gated by the chipset |
| `0xF5` | SECURITY FREEZE LOCK | `--security-freeze` | latches frozen until power-on reset |
| `0xF6` | SECURITY DISABLE PASSWORD | `--security-disable PWD` | clears security if unlocked and password ok |
| `0xC8` | READ DMA | (`dd`, reads) | gated by `media_read_allow` |
| `0xCA` | WRITE DMA | (`dd`, writes) | gated by `media_write_allow` |
| `0xFE` | vendor reflash | (vendor tool) | firmware update; needs chain + physical presence |

Behaviour that matches the standard, and is what the counter scenario exercises:
five wrong passwords set `erase_required`, after which UNLOCK is refused
(`unlock_blocked`) and only ERASE UNIT — with the correct password — can clear the
counter. The status bits mirror IDENTIFY DEVICE word 128: enabled, locked, frozen,
count-expired.

The part that is **chipset policy, not ATA**: if the chain is unverified or the
tamper latch is set, ERASE UNIT and reflash are refused *even with the correct
password* (`ABORT_POLICY`), and the refusal sets `erase_denied_tamper` /
`reflash_denied_tamper` so the transcript records the attempt. That is the
"deny destructive operations" decision taken for this design: a tampered host must
not be able to wipe the evidence or the recovery image. The honest consequence is
that a tampered box with a spent counter is not recoverable in-band — recovery
requires the physical-presence strap, which grants re-provisioning but never a
wipe.

## 6. Status word

Software reads one packed word (the boot-chain checker in `chipset-lab.html` uses
this layout; `tools/sim/vchip_driver.cc` asserts every field against the named
ports on every simulated cycle, and exits 3 on a mismatch):

| bits | field | | bits | field |
| --- | --- | --- | --- | --- |
| `[0]` | `chain_ok` | | `[27:26]` | `last_stage` |
| `[1]` | `tamper_latch` | | `[28]` | `last_stage_ok` |
| `[3:2]` | `lock_state` | | `[31:29]` | `ext_count` |
| `[5:4]` | `boot_kind` | | `[32]` | `prov_done` |
| `[7:6]` | `policy_boot_mode` | | `[33]` | `prov_violation` |
| `[8]` | `mode_ok` | | `[34]` | `recovery_active` |
| `[12:9]` | `boot_deny_reason` | | `[35]` | `cpu_release` |
| `[13]` | `sec_enabled` | | `[36]` | `arm_latched` |
| `[14]` | `sec_locked` | | `[38:37]` | reserved, 0 |
| `[15]` | `sec_frozen` | | `[43:39]` | reserved, 0 |
| `[16]` | `erase_required` | | `[47:44]` | `abort_code` |
| `[19:17]` | `fail_count` | | `[48]` | `cmd_aborted` |
| `[20]` | `media_write_allow` | | `[51:49]` | reserved, 0 |
| `[21]` | `media_read_allow` | | `[55:52]` | `ignored_measurements` |
| `[22]` | `erase_grant` | | `[63:56]` | reserved, 0 |
| `[23]` | `reflash_grant` | | | |
| `[24]` | `erase_denied_tamper` | | | |
| `[25]` | `reflash_denied_tamper` | | | |

Bit 36 used to be a second copy of `ext_count`, which meant `arm_latched` — the
one field an operator most needs, "is enforcement actually on?" — was not
observable at all. The duplicate was invisible because the reference model
reproduced the RTL bug faithfully; the driver's new per-cycle assertion catches it
(verified by mutation: reverting the field makes the build fail with
`status[36:36] = 0x0, named ports say 0x1`).

## 7. Verification

```
python3 tools/verify_rtl.py            # everything (~2 min)
python3 tools/verify_rtl.py --quick    # skip the SAT proofs (~5 s)
python3 tools/verify_rtl.py --update   # re-baseline rtl/golden/vchip_transcript.txt
```

What it does, in order:

1. **Vectors.** `tools/gen_vchip_vectors.mjs` re-derives the golden chain from the
   stage digests and fails if the checked-in goldens disagree (that is the gate
   that stops a mixer edit from silently re-baselining the test). It also resolves
   the scenarios into `rtl/golden/vchip_vectors.h` for the driver.
2. **Build.** `yosys prep` + `write_cxxrtl` for `vchip_top` and `vchip_mix`, then
   `g++`. `synth -noabc` + `stat` writes `sim/synth.log`; the harness refuses to
   report a synthesis that did not run. Current figures, both from `stat`:

   | flow | cells | wire bits | flops |
   | --- | --- | --- | --- |
   | `prep -top vchip_top` (RTL cells) | 399 | 4907 | 29 `$dff` registers |
   | `synth -noabc -top vchip_top` (internal gates) | 3554 | 6013 | 296 enable-flop bits |

   399 = `boot_vector_lock` 139 + `ata_security_fsm` 176 + `vchip_mix` 64 +
   `vchip_top` 20. ABC is skipped because this WASI build of yosys exits 0 while
   silently truncating the log in the ABC pass, so the second row is an
   internal-gate mapping, not a technology-mapped gate count. That silent
   truncation is also why the harness hard-fails when `stat` never runs.
3. **Transcript conformance.** The CXXRTL driver prints one line per cycle;
   `node tools/run_vchip_scenarios.mjs` runs the same scenarios through the JS
   reference model. The two must be **byte-identical**, and must match
   `rtl/golden/vchip_transcript.txt`. Current: **8 scenarios, 101 cycles**, equal.
   Extra checks in the same pass: 107/107 mixer vectors, per-cycle status-word
   assertions.
4. **Formal proofs.** `rtl/formal/vchip_formal_top.v` states 20 invariants and
   `sat -seq 24 -prove <inv> 1` is asked to refute each one —
   **20/20 proved** (509,109 variables / 1,376,242 clauses per proof, ~37 s).
   The list:

   | property | claim |
   | --- | --- |
   | `inv_tamper_no_chain` | tamper latch implies `chain_ok` is cleared |
   | `inv_locked_is_tamper` | `LOCKED` state implies the latch is set |
   | `inv_tamper_is_locked` | the latch always drives the lock to `LOCKED` |
   | `inv_unlock_mask_complete` | unlock implies every stage matched (0111) |
   | `inv_unlock_state_is_unlocked` | `chain_ok` implies state `UNLOCKED` |
   | `inv_erase_needs_chain` | ERASE UNIT grant implies a verified chain |
   | `inv_erase_needs_no_tamper` | ERASE UNIT grant implies no tamper latch |
   | `inv_erase_needs_destructive_policy` | ERASE UNIT grant implies policy allows it |
   | `inv_reflash_needs_no_tamper` | reflash grant implies no tamper latch |
   | `inv_reflash_needs_chain` | reflash grant implies a verified chain |
   | `inv_write_needs_chain` | media write implies a verified chain |
   | `inv_write_needs_no_tamper` | media write implies no tamper latch |
   | `inv_grants_need_unlocked` | every capability gate implies an unlocked lock |
   | `inv_release_needs_chain` | CPU handoff implies a verified chain |
   | `inv_release_needs_no_tamper` | CPU handoff implies no tamper latch |
   | `inv_release_needs_mode` | CPU handoff implies the policy allows the source |
   | `inv_sticky_tamper` | once latched, tamper stays latched (modulo reset) |
   | `inv_sticky_locked` | once `LOCKED`, the lock stays `LOCKED` (modulo reset) |
   | `inv_locked_grants_nothing` | a `LOCKED` chipset grants nothing |
   | `inv_vector_advances_in_order` | extension count never exceeds the stage count |

### Reset is synchronous, on purpose

All three sequential blocks use `always @(posedge clk)` with a synchronous reset,
and each has an `initial` block mirroring the reset values. That is a *verification*
decision, not a hardware recommendation: an asynchronous reset makes yosys' SAT
engine fabricate flops with undefined initial values (`$auto$async2sync.cc:…`),
so the solver can start in impossible states and "refutations" become artifacts.
The usual workaround, `async2sync`, is not proof-sound — a refutation obtained that
way is exactly how the same-cycle provisioning race above was nearly dismissed as
a tooling artifact. With a synchronous reset the initial state is defined, and the
proofs are about states the chip can actually be in.

### What is *not* proved, and the assumptions that are doing work

* **The latch is reset-clearable.** `tamper_latch` is an ordinary flop; the sticky
  properties are stated modulo reset. Production silicon must keep the tamper latch
  and lock state somewhere a CPU-issued warm reset cannot reach — a
  battery-backed register or OTP — otherwise a reset is an unpatch. The RTL
  comments say this at each site; it is the single most important caveat here.
* **The measurement source is trusted.** `meas_digest` arrives from outside the
  lock; nothing here proves the digest describes the bytes that were actually
  executed. Real silicon gets it from a hash engine fed by the boot ROM read path
  ("the vector processor" in this design's language), and that path is not modelled
  beyond its interface.
* **The mixer is not a hash** (section 3), and the stage digests are stand-ins.
* **Bounded, not unbounded, proofs.** `-seq 24` proves no counterexample within 24
  cycles. The sticky properties (`inv_sticky_*)` are the ones where a deeper bound
  would add real strength; temporal induction over the whole design was tried and
  abandoned (900 s, no verdict).
* Nothing here is about *building* security: the lock denies boot and blocks
  destructive commands, but it does not encrypt the disk, and a host with the disk
  removed is out of scope.

## 8. The boot-chain requirement checker

`tools/bootchain.py` answers the question an operator actually asks — *may this
machine boot, and does the disk satisfy the firmware's requirements?* — with two
halves, because a boot decision needs both.

**Disk half** (parse real on-disk structures, not abstractions):

| requirement | how it is checked |
| --- | --- |
| MBR from `fdisk` | 0x55AA signature, entry status bytes (0x00/0x80), entry bounds inside the image, no overlapping partitions, bootstrap code present |
| GPT | `EFI PART` signature, header CRC32, entry-array CRC32, coherent LBA bounds, and a valid **backup** header (the difference between a recoverable disk and a brick) |
| protective MBR | for a GPT disk, a type-0xEE entry covering the whole disk |
| ESP | a partition of type `C12A7328-F81F-11D2-BA4B-00A0C93EC93B` with a coherent FAT BPB, and a FAT12/16/32 type consistent with the cluster count (a BPB that lies is a real corruption signal) |
| EFI booting requirements | `\EFI\BOOT\BOOTX64.EFI` (the removable-media path), a PE image, **PE32+** (UEFI 2.10 s4.2), an allowed machine type, and subsystem `EFI_APPLICATION` (10) |
| legacy path | active partition present, VBR with a jump instruction and signature, and the first-stage loader identifiable as GRUB/LILO/SYSLINUX/NTLDR — with a warning when `--loader grub` is requested and only LILO is found |

**Platform half** (the chipset's own decision, from a status word or a transcript
file): chain verified, enforcement armed, no tamper latch, lock state `UNLOCKED`,
media reads permitted, CPU released, boot source allowed by policy, no reserved
bits set, and — the decision this whole design exists for — **no destructive
grant to an untrusted platform**, plus a check that the policy and the disk agree
(a UEFI-only chipset in front of an MBR-only disk cannot boot, and saying so at
requirement time beats failing at handoff).

```
python3 tools/bootchain.py --image disk.img --policy uefi      # exit 1 on any REQUIRED failure
python3 tools/bootchain.py --image disk.img --policy legacy --loader grub
python3 tools/bootchain.py --status 0x000120197830a129 --policy uefi
python3 tools/bootchain.py --transcript rtl/golden/vchip_transcript.txt
python3 tools/bootchain.py --selftest                          # fixtures in memory, verdicts asserted
python3 tools/bootchain.py --fixtures out/                     # write those fixture disks out
python3 tools/bootchain.py --layout-json                       # layout parsed out of the RTL
```

Nothing in it is a hard-coded copy of the hardware: the status-field offsets and
the DENY/ABORT/LCK/BOOT/MODE constants are **parsed out of `rtl/vchip_top.v` and
`rtl/vchip_pkg.vh`**, and `--transcript` re-derives the handoff decision from the
named ports and requires the RTL to have produced the same one — 101 cycles,
field by field.

The page `chipset-lab.html` (controller `js/chipset-lab.js`, tested by
`tests/11-chipset-lab.mjs`) is the browser view of the platform half: paste a
status word, or pick one of the presets taken verbatim from
`rtl/golden/vchip_transcript.txt` (an honest boot, a tampered MBR, an erase
refused on a tampered box, a provisioning attack, a spent attempt counter), and
see the requirements and the ATA gate table. `tools/verify_bootchain.mjs` keeps
the JS mirror honest: it diffs the JS layout and constants against the RTL-derived
ones and runs both implementations over every cycle of the transcript, requiring
identical verdicts, then re-checks the crafted words (tampered, destructive leak,
unarmed, reserved-bit) that the Python selftest uses.

`tools/verify_rtl.py` runs all three of those checks as its final stage, so the
assembled RTL, the conformance corpus, the proofs and the requirement checker are
one command.

## 9. Reproducing from scratch

```sh
sh tools/setup_rtl.sh                  # installs yowasp-yosys (user-space) and verifies
python3 tools/verify_rtl.py --update   # rebuild every golden artifact
python3 tools/verify_rtl.py            # prove the tree is green
git diff --stat rtl/ sim/              # a mixer or policy change should show up here
```

The only external tool is Yosys, installed from PyPI as the WebAssembly build
(`pip install --user --break-system-packages yowasp-yosys`) — no root, no system
packages, no Java. It lands in `~/.local/bin`, which is not always on PATH and is
not part of this workspace in every environment, which is why
`tools/setup_rtl.sh` exists and why `find_yosys()` searches there before giving
up with instructions.

The transcript is the contract between three implementations: the RTL, the JS
reference model, and the golden file. If RTL and model disagree the build fails
before any proof is attempted; if both change together, the golden diff is the
review artifact.

## 10. The firmware side: walking an AVR bootloader

The lock gates firmware writes; the other half of that story is the firmware
itself, and the vendor images it would have been (MAKInterface / MAKInterface
Pro, makinterface.de) could not be retrieved — the host refuses connections from
this environment and the archives are blocked or gone. So the Atmel side is
built against code of the same class, and verified rather than asserted:

* `js/avrdis.js` decodes the whole classic-AVR instruction set.
  `tools/verify_avrdis.mjs` compares it instruction-for-instruction against the
  `avr-objdump` listing **upstream itself published** with Optiboot 8.0
  (`samples/avr/optiboot_atmega328.lst`): 225/225 instructions and 78/78 branch
  and call targets — the latter against the addresses objdump resolves and
  prints in its own comments.
* With the decoder checked, `tools/ghidra_avr.mjs` *walks* the image from the
  reset vector (following `rjmp`/`jmp`, entering `rcall`/`call` targets, taking
  both sides of conditionals and of the skip instructions) so that each
  `SPM`/`LPM`/`WDR` site can be labelled with the function it lives in and
  whether a redirect can reach it.

The result worth having: Optiboot's `do_spm` is `__attribute__((used))`, so a
working `SPM` sequence is linked into the boot region with **nothing calling it**
— two flash-write sites that are decoded, real, and provably unreachable from
the image alone. That is exactly the kind of latent primitive the vector lock
exists to measure against, and reporting "6 SPM sites" without walking them would
have missed it. The opposite check is made too: Micronucleus's five `SPM`, three
`LPM` and two `WDR` sites are all live, so "reachable" is not a verdict the walk
hands out for free.

`avr-lab.html` (controller `js/avr-lab.js`, gated by `tests/13-avr-lab.mjs`)
shows the same walk in a tab: pick a vendored image, see the disassembly with
dead instructions marked and the self-programming sites named from the listing's
symbol table. It is the firmware-side companion to `chipset-lab.html`.

What is **not** done, and is recorded rather than hidden: the vendored Ghidra-wasm
bridge cannot decompile AVR8. Its `LoadImageXml` reads outside the word-addressed
`code` space and returns `DataUnavailError`; `node tools/ghidra_avr.mjs … --probe`
reproduces that as 0/36 combinations, and there is no JVM here to run a real
Ghidra headless. So the walkthrough is done by decoding instructions and
following control flow — a smaller claim than "decompiled", and a true one.
