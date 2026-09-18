/* CHIPWRIGHT · cw-subst.js — the substitution and repair-planning engine.
 *
 * This is the module the whole workbench exists for. Its job is to answer one
 * question honestly: "this part is unobtainable — what can I put in its place,
 * and what will that change?"
 *
 * The design rule is that a substitution is a set of GATES, each of which is
 * either HARD (fail it and the board is damaged or dead) or SOFT (fail it and
 * something subtler breaks: a whitelist rejects the part, a status register
 * write locks the array, a calibration is lost). A gate the user cannot answer
 * is recorded as UNKNOWN and counted against confidence — it is never silently
 * treated as a pass, because that is exactly how a confident wrong substitution
 * kills a board.
 */

import { SUBSTITUTION_FAMILIES, SYMPTOMS, hex, labelSize } from "./cw-data.js";
import { FAMILY_CODES, DS18B20, DS2438 } from "./cw-data-onewire.js";
import { DRIVE_TRIAGE, SMART_ATTRS } from "./cw-data-storage.js";
import { PORTABILITY, JAVACARD_LIMITS } from "./cw-data-jvm.js";

/* ------------------------------------------------------------------ *
 * 1. Gate evaluation
 * ------------------------------------------------------------------ */

export const VERDICTS = {
  proceed: { id: "proceed", label: "Proceed", tone: "ok", meaning: "Every hard gate passes and no soft gate fails. Record what you checked and keep the original part." },
  proceedWithChecks: { id: "proceedWithChecks", label: "Proceed after verification", tone: "warn", meaning: "No hard gate fails, but one or more soft gates are unknown. Each unknown is a specific thing to measure or read before soldering." },
  doNotProceed: { id: "doNotProceed", label: "Do not proceed", tone: "bad", meaning: "At least one hard gate fails. This substitution will damage the board or the replacement part." },
  insufficient: { id: "insufficient", label: "Not enough information", tone: "neutral", meaning: "Too many hard gates are unknown to say anything. Gathering them is the next step, not the substitution." },
};

/**
 * Evaluate a substitution.
 *
 * @param family   a row from SUBSTITUTION_FAMILIES, or one of the domain tables below
 * @param answers  { gateId: "pass" | "fail" | "unknown" | true | false | null }
 * @param opts     { original, replacement } — free-text labels for the report
 */
export function evaluateSubstitution(family, answers = {}, opts = {}) {
  if (!family || !Array.isArray(family.gates)) return { ok: false, note: "No gate list for this substitution family." };
  const gates = family.gates.map((g) => {
    const raw = answers[g.id];
    const state = raw === true || raw === "pass" ? "pass" : raw === false || raw === "fail" ? "fail" : "unknown";
    return { ...g, state };
  });
  const hardFail = gates.filter((g) => g.hard && g.state === "fail");
  const softFail = gates.filter((g) => !g.hard && g.state === "fail");
  const hardUnknown = gates.filter((g) => g.hard && g.state === "unknown");
  const softUnknown = gates.filter((g) => !g.hard && g.state === "unknown");
  const answered = gates.filter((g) => g.state !== "unknown").length;

  const verdict = hardFail.length ? VERDICTS.doNotProceed
    : hardUnknown.length > Math.floor(gates.filter((g) => g.hard).length / 2) ? VERDICTS.insufficient
    : softFail.length || hardUnknown.length || softUnknown.length ? VERDICTS.proceedWithChecks
    : VERDICTS.proceed;

  // Any row whose evidence is "recall" cannot carry a decision on its own.
  const recallGates = gates.filter((g) => g.ev === "recall");

  return {
    ok: true,
    family: family.id ?? family.name,
    familyName: family.name,
    original: opts.original ?? null,
    replacement: opts.replacement ?? null,
    gates,
    counts: { total: gates.length, answered, pass: gates.filter((g) => g.state === "pass").length, fail: gates.filter((g) => g.state === "fail").length, unknown: gates.filter((g) => g.state === "unknown").length },
    hardFail, softFail, hardUnknown, softUnknown, recallGates,
    verdict,
    blockers: hardFail.map((g) => `HARD FAIL — ${g.question} ${g.why}`),
    toVerify: [...hardUnknown, ...softUnknown].map((g) => `${g.hard ? "HARD" : "SOFT"} UNKNOWN — ${g.question} ${g.why}`),
    softWarnings: softFail.map((g) => `SOFT FAIL — ${g.question} ${g.why}`),
    confidence: verdict.id === "proceed" ? (answered === gates.length ? "high" : "medium")
      : verdict.id === "proceedWithChecks" ? "low"
      : "none",
    summary: [
      verdict.meaning,
      hardFail.length ? `Blocking: ${hardFail.map((g) => g.id).join(", ")}.` : "",
      softFail.length ? `Non-blocking failures: ${softFail.map((g) => g.id).join(", ")} — these do not stop the swap but each one changes behaviour in a way you must plan for.` : "",
      (hardUnknown.length + softUnknown.length) ? `Unanswered: ${[...hardUnknown, ...softUnknown].map((g) => g.id).join(", ")}.` : "",
      recallGates.length ? `${recallGates.length} gate(s) rest on "recall" evidence and must be confirmed against a datasheet before they are relied on.` : "",
    ].filter(Boolean).join(" "),
  };
}

/* ------------------------------------------------------------------ *
 * 2. SPI NOR — the workbench's most-used substitution, specialised
 * ------------------------------------------------------------------ */

/**
 * Rank the members of an SPI NOR family against a target specification.
 * Everything here is arithmetic on data already in the corpus; nothing is
 * inferred from a part marking.
 */
export function rankSpiNor({ originalRdid, requiredCapacity, boardVcc = 3.3, originalSrLayout = null }) {
  const family = SUBSTITUTION_FAMILIES.find((f) => f.id === "spi-nor-3v3");
  if (!family) return { ok: false, note: "spi-nor-3v3 family missing from the corpus." };
  const rows = family.members.map((m) => {
    const capOk = requiredCapacity == null || m.cap === requiredCapacity;
    const vccOk = boardVcc >= m.v[0] && boardVcc <= m.v[1];
    const isOriginal = originalRdid && m.rdid.toLowerCase() === originalRdid.toLowerCase();
    return {
      ...m,
      capOk, vccOk, isOriginal,
      capacityLabel: labelSize(m.cap),
      vccRange: `${m.v[0]}-${m.v[1]} V`,
      blockers: [
        !vccOk ? `VCC ${boardVcc} V is outside this part's ${m.v[0]}-${m.v[1]} V range — a 1.8 V part on a 3.3 V rail is destroyed and can take the rail with it` : null,
        !capOk ? `capacity ${labelSize(m.cap)} ≠ required ${labelSize(requiredCapacity)}` : null,
      ].filter(Boolean),
      cautions: [
        m.ev === "recall" ? "part data is tagged 'recall' — confirm against the datasheet before ordering" : null,
        isOriginal ? "this is the part already on the board" : null,
        originalSrLayout ? "status-register layout differs between vendors: QE and SRP are not in the same bits. If the firmware writes the status register, a vendor change can silently disable quad mode or lock the array" : null,
      ].filter(Boolean),
      score: (vccOk ? 4 : 0) + (capOk ? 3 : 0) + (m.ev === "tool" ? 2 : m.ev === "std" ? 2 : m.ev === "report" ? 1 : 0),
    };
  }).sort((a, b) => b.score - a.score);

  const viable = rows.filter((r) => !r.blockers.length && !r.isOriginal);
  return {
    ok: true,
    requiredCapacity, boardVcc, originalRdid,
    rows, viable,
    verdict: viable.length === 0
      ? "No viable alternative in this family for the stated requirements. Either the requirements are wrong or the family is — check the board's actual VCC at the chip pin, not at the regulator, before concluding the part is unobtainable."
      : `Best candidate: ${viable[0].vendor} ${viable[0].part} (RDID ${viable[0].rdid}). ${viable.length} viable option(s) in total. Run evaluateSubstitution() over the full gate list before committing — this ranking only covers capacity, voltage and evidence quality.`,
    ev: "tool",
  };
}

/* ------------------------------------------------------------------ *
 * 3. Storage substitution — the domain where "compatible" is loosest
 * ------------------------------------------------------------------ */

export const STORAGE_SUBSTITUTION = [
  {
    id: "pata-2.5-sd", name: "2.5\" PATA (IDE) → SD/CF/DOM adapter", ev: "report",
    basis: "PATA is a parallel bus with a documented register interface. An adapter presents the same registers backed by flash. The host cannot tell the difference except through timing and geometry.",
    gates: [
      { id: "master-slave", hard: true, question: "Is the drive Master or Slave, and is the cable 40- or 80-conductor?", why: "An adapter is almost always Master-only and does not implement CSEL. On a two-device channel this collides with the other device and neither is enumerated." },
      { id: "geometry", hard: true, question: "Does the host read geometry from IDENTIFY DEVICE or does it have a translation baked in?", why: "Old BIOSes with a 504 MB / 8.4 GB barrier apply CHS translation. An adapter reporting a modern LBA48 geometry can produce a disk that appears half its size or fails to boot." },
      { id: "lba48", hard: false, question: "Does the host support 48-bit LBA?", why: "Above 128 GiB the host must use IDENTIFY DEVICE words 100-103. Many embedded PATA hosts do not, and then the visible capacity is capped at 2^28 sectors." },
      { id: "udma", hard: false, question: "Which PIO/UDMA modes does the adapter support, and which does the host require?", why: "Most adapters only do PIO 0-4. A host configured for UDMA5 will either fall back (slow, but works) or time out (looks like a dead disk)." },
      { id: "power", hard: true, question: "3.3 V or 5 V, and how much?", why: "The 2.5\" connector carries both. An adapter with a 3.3 V SD card on a 5 V-only pinout can be fine or can be destroyed depending on the adapter, and the datasheet rarely says." },
      { id: "smart", hard: false, question: "Does anything on the host depend on S.M.A.R.T.?", why: "Adapters generally return an invalid command response to SMART. A monitoring agent will report the drive as failed, or as absent, and either can trip an alert." },
      { id: "endurance", hard: false, question: "What is the write load?", why: "An SD card is not an SSD. A logging workload that a PATA disk survived for fifteen years will kill a consumer SD card in months, and the failure is silent until the filesystem corrupts." },
    ],
  },
  {
    id: "sata-ssd", name: "2.5\" SATA HDD → SATA SSD", ev: "std",
    basis: "SATA is a serial protocol with a negotiated link speed and a standard ATA command set. This is the cleanest substitution in storage.",
    gates: [
      { id: "sata-rev", hard: true, question: "SATA I / II / III, and does the host negotiate down?", why: "A SATA III SSD on a SATA I host normally negotiates to 1.5 Gb/s. Some early controllers do not, and the drive then disappears at link time — which looks like a dead drive, not a speed mismatch." },
      { id: "power", hard: true, question: "Is the 3.3 V pin populated?", why: "The SATA power connector's pin 3 is 3.3 V on old supplies and is used for PWADIS (Power Disable) on some newer drives. A modern drive in an old cable can refuse to spin up. This is a real and very common failure and the fix is a Molex-to-SATA adapter or tape over pin 3." },
      { id: "trim", hard: false, question: "Does the OS issue TRIM?", why: "Without TRIM an SSD's steady-state write performance collapses. The drive still works; it just stops being an SSD." },
      { id: "smart", hard: false, question: "Do the SMART attributes mean the same thing?", why: "No. Attribute 5 on a spinning disk is reallocated sectors from head crashes; on an SSD it is retired blocks from wear. Attribute 177/231/233 have vendor-specific meanings. Reading an SSD's SMART with HDD assumptions produces a wrong health verdict — which is why cw-data-storage.js marks per-attribute criticality rather than trusting the number alone." },
      { id: "capacity", hard: false, question: "Larger or smaller than the original?", why: "Larger is fine for the data but a partition table cloned sector-for-sector leaves the extra space unusable. Smaller cannot take a full-image clone at all." },
      { id: "thermal", hard: false, question: "Is there airflow?", why: "An NVMe-in-2.5\"-adapter or a fast SATA SSD in a sealed enclosure throttles. Throttling looks like a failing drive under load." },
    ],
  },
  {
    id: "nvme-ahci", name: "NVMe SSD ← AHCI/SATA host, or NVMe→SATA adapter", ev: "report",
    basis: "NVMe and AHCI are different command sets over different transports. There is no protocol conversion; every 'adapter' is either a mechanical re-packaging or a bridge chip with real limitations.",
    gates: [
      { id: "firmware-support", hard: true, question: "Does the platform firmware have an NVMe driver in its DXE phase?", why: "Without one the firmware cannot see the drive at all, so it cannot boot from it — even though an OS with its own driver would run fine. This is the single most common cause of 'new NVMe SSD not detected in BIOS'." },
      { id: "bridge-chip", hard: true, question: "If using an M.2-to-SATA adapter, does it contain a bridge, and which?", why: "A passive adapter cannot work: SATA carries AHCI, M.2 can carry NVMe, and the two are not electrically or logically interchangeable. Only an M.2 SATA-mode module (B+M key) works passively in a SATA port." },
      { id: "keying", hard: true, question: "B key, M key, or B+M?", why: "M key is PCIe/NVMe; B key is SATA or PCIe×2; B+M is usually SATA. A module keyed for the wrong socket will not physically insert, and forcing it breaks the connector." },
      { id: "lanes", hard: false, question: "PCIe ×2 or ×4?", why: "An ×4 drive in an ×2 slot works at half the bandwidth. A drive that expects ×4 to meet its own thermal spec may throttle harder." },
      { id: "boot-mode", hard: false, question: "UEFI or Legacy/CSM?", why: "Many firmwares only boot NVMe in UEFI mode. Switching to UEFI then requires the disk to be GPT with an ESP, which is a separate conversion." },
      { id: "namespaces", hard: false, question: "Does the host see multiple namespaces?", why: "An NVMe controller can present several namespaces; a host that expects one block device may only use NSID 1 and leave the rest invisible." },
    ],
  },
  {
    id: "m2-form-factor", name: "M.2 form-factor substitution (same protocol, different length)", ev: "std",
    basis: "M.2 lengths are 2230/2242/2260/2280/22110 — width 22 mm, length in mm. The electrical interface is unchanged; only the mounting is different.",
    gates: [
      { id: "standoff", hard: true, question: "Is there a standoff and screw at the new length?", why: "An unsupported module flexes under its own weight and cracks solder joints on the BGA. This is a mechanical failure that presents as an intermittent drive." },
      { id: "clearance", hard: true, question: "Does the longer module clear adjacent components, a heatsink, or the enclosure?", why: "A 2280 in a space designed for 2230 will not fit, and the temptation to bend it is how modules get destroyed." },
      { id: "thermal", hard: false, question: "Is there a heatsink or thermal pad in the original position?", why: "Moving to a shorter module can leave the pad pressing on nothing, or on the controller instead of the NAND, and either changes the thermal path." },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * 4. 1-Wire sensor substitution — the weather-station case
 * ------------------------------------------------------------------ */

export const ONEWIRE_SUBSTITUTION = [
  {
    id: "ds18b20-ds1822", name: "DS18B20 → DS1822 (or reverse)", ev: "tool",
    basis: "Same family command set (CONVERT T 0x44, READ SCRATCHPAD 0xBE, 9-byte scratchpad with CRC-8 in byte 9), same package options, different accuracy and different family code.",
    gates: [
      { id: "family-code", hard: true, question: "Does the host hard-code the family code?", why: "DS18B20 is 0x28, DS1822 is 0x22, DS18S20 is 0x10. Any host that filters by family code — and nearly all weather-station firmware does — will simply not see the replacement. This is the first gate and the one most often missed." },
      { id: "accuracy", hard: false, question: "Is the accuracy difference acceptable for the measurement?", why: "DS18B20 is ±0.5 °C from −10 to +85 °C; DS1822 is ±2 °C. For a weather station logging ambient temperature that is the difference between usable data and noise, and it is not recoverable in software." },
      { id: "resolution", hard: false, question: "Same resolution configuration?", why: "Both support 9-12 bit selected in scratchpad byte 4, and both take 750 ms at 12 bit. Conversion timing is compatible; the default after power-up is 12 bit on both." },
      { id: "scratchpad", hard: false, question: "Are the reserved bytes the same?", why: "The DS18B20 returns 0xFF, 0x0C, 0x10 in scratchpad bytes 5-7. Firmware that validates those bytes as a sanity check will reject a DS1822. Reading them is a legitimate anti-counterfeit check, so this gate can bite in both directions." },
      { id: "power", hard: true, question: "Parasitic or external supply?", why: "Both support parasitic power, but the strong-pull-up requirement during CONVERT T and COPY SCRATCHPAD is the same and must be provided by the master. A host that only worked because the original part was externally powered may fail with a parasitically-powered replacement." },
      { id: "package", hard: true, question: "TO-92, SOIC-8, or µSOP-8?", why: "The three are not pin-compatible with each other. A TO-92 DS18B20 replaced with a SOIC-8 DS1822 needs a board change, not a part change." },
    ],
  },
  {
    id: "ds18b20-ds18s20", name: "DS18B20 → DS18S20 (family 0x10)", ev: "tool",
    basis: "Both are digital thermometers on 1-Wire and both use CONVERT T, but the scratchpad format and the temperature arithmetic are different.",
    gates: [
      { id: "family-code", hard: true, question: "Does the host filter on family code 0x28?", why: "DS18S20 is 0x10. Same failure mode as above, and the two are routinely confused because the DS18S20 came first and much old code targets it." },
      { id: "scratchpad-format", hard: true, question: "Does the conversion code handle the DS18S20's format?", why: "The DS18S20 has a 9-bit temperature in bytes 0-1 with the LSB worth 0.5 °C, plus COUNT_REMAIN (byte 6) and COUNT_PER_C (byte 7) used for the 12-bit interpolation trick. The DS18B20's byte 0-1 is a 16-bit two's-complement value with the LSB worth 0.0625 °C and bytes 5-7 are reserved. Code written for one produces wrong numbers — not an error, wrong numbers — on the other." },
      { id: "resolution-config", hard: true, question: "Is the configuration byte used?", why: "The DS18S20 has no configurable resolution; writing scratchpad byte 4 does nothing. Firmware that sets 12-bit and then assumes the DS18B20 timing will still work by luck, but firmware that reads the config back as a check will fail." },
      { id: "accuracy", hard: false, question: "Accuracy acceptable?", why: "DS18S20 is ±0.5 °C over 0 to +70 °C, narrower range than the DS18B20's −55 to +125 °C. For outdoor weather use the range matters." },
    ],
  },
  {
    id: "ds2438-calibration", name: "DS2438 replacement (humidity / battery monitor)", ev: "report",
    basis: "The DS2438 is an ADC plus temperature sensor plus 40 bytes of EEPROM. In a humidity sensor the calibration lives in that EEPROM, not in the host.",
    gates: [
      { id: "calibration-pages", hard: true, question: "Have pages 3-7 been copied from the original device?", why: "The humidity calibration coefficients are stored in the DS2438's own EEPROM. A new DS2438 with blank pages produces a sensor that responds correctly and reads wrongly, and there is no way to recover the coefficients afterwards. Copy them BEFORE desoldering the old part." },
      { id: "family-code", hard: true, question: "Same family code 0x26?", why: "The DS2437 is close but lacks the current accumulator, and hosts that read page 1 bytes 2-3 will get meaningless values from it." },
      { id: "sensor-element", hard: false, question: "Is the humidity element itself the same part?", why: "The DS2438 measures whatever is connected to VAD. If the resistive/capacitive element is also being replaced, its characteristic curve is different and the copied calibration is wrong for it." },
      { id: "vdd-vad", hard: false, question: "Same supply and reference?", why: "Page 2 holds VDD and VAD with a 10 mV LSB. A different VDD changes the ratio the calibration was derived from." },
      { id: "write-supply", hard: true, question: "Can the bus supply enough current for an EEPROM write?", why: "COPY SCRATCHPAD needs a strong pull-up or an external supply for 10 ms. On a parasitically-powered long weather-station run this is the step that fails silently — the write appears to succeed and the page reads back unchanged." },
    ],
  },
  {
    id: "onewire-eeprom", name: "1-Wire EEPROM: DS2431 (1 Kb) / DS2433 (4 Kb) / DS1996 (64 Kb)", ev: "tool",
    basis: "Same bus, same ROM command set, different page geometry and different memory-function commands.",
    gates: [
      { id: "page-size", hard: true, question: "Same page size and write granularity?", why: "The DS2431 writes 8 bytes per page in four independent 256-bit pages; the DS2433 and DS1996 write 32 bytes per page. Code that computes a page boundary from the wrong page size writes across a boundary and the device silently ignores the part that overflowed." },
      { id: "capacity", hard: true, question: "Enough capacity for the data?", why: "An iButton logger using the 1-Wire File Structure has a directory plus its entries; 33 bytes per entry means a 1 Kb part fills up very quickly. Shrinking capacity truncates the filesystem rather than failing loudly." },
      { id: "family-code", hard: true, question: "Host filter on family code?", why: "0x2D, 0x23/0x33 and 0x0C respectively." },
      { id: "memory-commands", hard: false, question: "Same memory-function command set?", why: "READ MEMORY (0xF0) is common; WRITE SCRATCHPAD / READ SCRATCHPAD / COPY SCRATCHPAD addresses and the scratchpad sizes differ." },
      { id: "add-only", hard: true, question: "Is either part an add-only (EPROM) device?", why: "The DS1982/DS1985/DS1986 families (0x09/0x0B/0x0F) can only clear bits, never set them. Substituting one for an EEPROM is a one-way change and the data cannot be updated afterwards at all." },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * 5. Java Card / secure-element substitution
 * ------------------------------------------------------------------ */

export const JAVACARD_SUBSTITUTION = [
  {
    id: "javacard-vendor", name: "Java Card chip: vendor-to-vendor (NXP JCOP ↔ Infineon SECORA ↔ Thales/Gemalto)", ev: "report",
    basis: PORTABILITY.survives[0] + " The CAP file is manufacturer-independent because the VM specification is; everything around it is not.",
    gates: [
      { id: "jcvm-version", hard: true, question: "Same Java Card VM version (2.1 / 2.2 / 3.0 / 3.1)?", why: "A CAP built for JCVM 2.2 will not install on a 2.1 card, and the error is a bare SW 0x6A80 with no explanation. Read the card's recognition data first." },
      { id: "api-export-files", hard: true, question: "Recompiled against the target platform's API export files?", why: "Compiling against one vendor's api_export_files and loading onto another produces a CAP whose imports the target cannot resolve. The fix is a recompile, not a converter." },
      { id: "gp-keys", hard: true, question: "Do you hold the target's GlobalPlatform ISD keys (ENC/MAC/DEK)?", why: "Without them you cannot open a secure channel to load anything. The well-known default keys are the first thing a vendor changes, and three wrong attempts can lock the card manager." },
      { id: "memory", hard: true, question: "Enough EEPROM for the package plus its instance data?", why: "Two cards with the same Java Card version can differ by a factor of four in memory. SW 0x6A84 'not enough memory space' is what you get, and it appears at INSTALL time after the load has already succeeded." },
      { id: "impdep", hard: true, question: "Does the applet use impdep1/impdep2 (0xFE/0xFF) or a vendor-private APDU?", why: "That is the one place the 'same bytecode runs anywhere' promise genuinely breaks. A CAP using a vendor extension is not portable and only a recompile against the target's API fixes it." },
      { id: "fp-long", hard: false, question: "Floating point or 64-bit long arithmetic required?", why: JAVACARD_LIMITS.values[5].why + " Check the target advertises FP support; most payment cards do not." },
      { id: "preinstalled", hard: false, question: "Which applets and security domains come pre-installed?", why: "A JCOP and a SECORA card both run Java Card; neither has the other's preloaded packages, and the host application may depend on one." },
      { id: "contactless", hard: false, question: "Same contactless protocol support (ISO 14443 A/B, Type B, NFC Forum)?", why: "A card that is electrically and logically fine may not support the RF protocol the reader uses." },
      { id: "certification", hard: true, question: "Is the target certified for the deployment (EMVCo, CC EAL, FIPS)?", why: "For a payment or identity deployment this is not a technical gate. An uncertified card cannot be used regardless of whether the applet runs, and the certification belongs to whoever controls the key ceremony." },
    ],
  },
  {
    id: "ibutton-shell", name: "iButton: same family code, different package or vendor", ev: "report",
    basis: "The 1-Wire bus is open and the family codes are published, so functionally identical parts exist across vendors. The mechanical and authentication layers do not transfer.",
    gates: [
      { id: "family-code", hard: true, question: "Identical family code?", why: "The host identifies the device by the first ROM byte. A different family code means the host's driver will not attach." },
      { id: "auth", hard: true, question: "Does the application use SHA-1/SHA-256 authentication (DS1961S/DS2432 family 0x33, DS28EC20 family 0x43)?", why: "If it does, the secret is provisioned per device or per batch. A replacement without the matching secret fails the challenge-response, and there is no legitimate way around that — it is the entire purpose of the part." },
      { id: "mechanical", hard: true, question: "Same can size and contact geometry (F5 microCAN vs F3)?", why: "The reader's contacts are designed for one can diameter. A mismatch gives intermittent reads that look like a bus fault." },
      { id: "otp-state", hard: false, question: "Are the OTP/security pages already burned on the donor?", why: "A used part with locked pages cannot be personalised. Read before buying." },
      { id: "clone-parts", hard: false, question: "Genuine or clone?", why: "Clones with duplicated ROM serial numbers exist. Two devices with the same ROM id on one bus produce search results that look like corruption. Enumerate and check for duplicate ids." },
    ],
  },
];

export const ALL_SUBSTITUTION_TABLES = [
  ...STORAGE_SUBSTITUTION, ...ONEWIRE_SUBSTITUTION, ...JAVACARD_SUBSTITUTION,
];

export function substitutionTableById(id) {
  return SUBSTITUTION_FAMILIES.find((f) => f.id === id) ?? ALL_SUBSTITUTION_TABLES.find((t) => t.id === id) ?? null;
}

/** Every known substitution family, with its gate counts — the index the UI shows. */
export function substitutionIndex() {
  const rows = [
    ...SUBSTITUTION_FAMILIES.map((f) => ({ id: f.id, name: f.name, domain: "components", members: f.members?.length ?? 0, hardGates: f.gates.filter((g) => g.hard).length, softGates: f.gates.filter((g) => !g.hard).length, ev: f.ev })),
    ...STORAGE_SUBSTITUTION.map((f) => ({ id: f.id, name: f.name, domain: "storage", members: 0, hardGates: f.gates.filter((g) => g.hard).length, softGates: f.gates.filter((g) => !g.hard).length, ev: f.ev })),
    ...ONEWIRE_SUBSTITUTION.map((f) => ({ id: f.id, name: f.name, domain: "1-Wire", members: 0, hardGates: f.gates.filter((g) => g.hard).length, softGates: f.gates.filter((g) => !g.hard).length, ev: f.ev })),
    ...JAVACARD_SUBSTITUTION.map((f) => ({ id: f.id, name: f.name, domain: "secure element", members: 0, hardGates: f.gates.filter((g) => g.hard).length, softGates: f.gates.filter((g) => !g.hard).length, ev: f.ev })),
  ];
  return rows;
}

/* ------------------------------------------------------------------ *
 * 6. Repair planning
 * ------------------------------------------------------------------ */

/**
 * Turn a symptom plus whatever is known about the board into an ordered plan.
 * The plan is deliberately conservative: it puts reversible, non-destructive
 * steps first and refuses to recommend a write before a read.
 */
export function buildRepairPlan({ symptomId, familyId = null, answers = {}, known = {} }) {
  const steps = [];
  const add = (phase, kind, text, opts = {}) => steps.push({ n: steps.length + 1, phase, kind, text, ...opts });

  add("0 · record", "record", "Photograph both sides of the board and every marking on the part in question, before anything is removed. That photograph is the only schematic you are guaranteed to have.", { destructive: false });
  add("0 · record", "record", "Record the board's make, model and REVISION. Support lists, descriptor layouts and firmware are per-revision, and a plan built on the wrong revision is wrong in ways that do not show up until the board is reassembled.", { destructive: false });

  // A named symptom brings its own ordered test list from the corpus. Those
  // tests are inserted here, in the corpus's order, because that order is the
  // diagnostic result: the cheap, non-destructive checks come first by design.
  const symptom = symptomId ? SYMPTOMS.find((x) => x.id === symptomId) : null;
  if (symptomId && !symptom) {
    add("1 · non-invasive", "stop", `No symptom with id "${symptomId}". Known: ${SYMPTOMS.map((x) => x.id).join(", ")}.`, { destructive: false, tone: "bad" });
  }
  if (symptom) {
    add("1 · non-invasive", "symptom", `Symptom under investigation: "${symptom.symptom}" (evidence: ${symptom.ev}). The tests below are in the order the corpus gives them, which is cheapest-and-least-destructive first.`, { destructive: false });
    for (const t of [...symptom.tests].sort((a, b) => a.order - b.order)) {
      add("1 · non-invasive", "test", `${t.order}. ${t.action} — expect: ${t.expect}`, { destructive: false, expect: t.expect, ifFail: t.ifFail, order: t.order });
      if (t.ifFail) add("1 · non-invasive", "iffail", `   ↳ if that fails: ${t.ifFail}`, { destructive: false, tone: "warn" });
    }
  }

  add("1 · non-invasive", "measure", "Measure every rail at the component, not at the connector or the PSU output. A rail that is correct at the supply and wrong at the chip is a board fault, and no firmware action will fix it.", { destructive: false });
  add("1 · non-invasive", "read", "Read before you write, always. If the device has a dump-able memory, take two independent reads and diff them. A non-reproducible read is a signal-integrity problem, and a corrupt dump written back is how a repairable board becomes unrepairable.", { destructive: false });
  add("1 · non-invasive", "identify", "Identify the part from something the device reports about itself — RDID on SPI NOR, the ROM id on 1-Wire, the IDCODE on JTAG, IDENTIFY DEVICE on a disk, CPUID recognition data on a card. Never from a marking on the package: markings are remarked, and remarked parts are common.", { destructive: false });

  if (familyId) {
    const fam = substitutionTableById(familyId);
    if (fam) {
      add("2 · substitution", "analyse", `Evaluate the substitution against ${fam.gates.length} gates for "${fam.name}". ${fam.basis}`, { destructive: false });
      const ev = evaluateSubstitution(fam, answers, { original: known.original, replacement: known.replacement });
      if (ev.ok) {
        for (const b of ev.blockers) add("2 · substitution", "stop", b, { destructive: false, tone: "bad" });
        for (const w of ev.softWarnings) add("2 · substitution", "plan", w, { destructive: false, tone: "warn" });
        for (const t of ev.toVerify) add("2 · substitution", "verify", t, { destructive: false });
        add("2 · substitution", "verdict", `Substitution verdict: ${ev.verdict.label} (confidence ${ev.confidence}). ${ev.summary}`, { destructive: false, tone: ev.verdict.tone });
      }
    } else {
      add("2 · substitution", "stop", `No substitution table with id "${familyId}". Known ids: ${substitutionIndex().map((r) => r.id).join(", ")}.`, { destructive: false, tone: "bad" });
    }
  }

  add("3 · rework", "esd", "Ground yourself and the mat before touching the board. Gate oxides on a modern SoC are damaged well below the ~2 kV a person can feel, and ~200 V is enough for many CMOS parts.", { destructive: false });
  add("3 · rework", "profile", "Preheat to 90-120 °C across the board at ≤2 °C/s, soak 150-180 °C for 60-120 s, then reflow. Boiling moisture inside the laminate is what delaminates a board, and preheat is the step people skip.", { destructive: true });
  add("3 · rework", "alloy", "If the board is lead-free and the part is coming off, flood the joints with Sn42/Bi58 (138 °C eutectic) to make a low-melting alloy. Mixing leaded and lead-free solder produces a joint with an unpredictable, often lower, melting range.", { destructive: true });
  add("3 · rework", "bag", "Bag and label every removed part with its position designator. A repair you cannot document is a repair nobody can finish.", { destructive: false });

  add("4 · restore", "write", "Write the image only to the regions that are safe to write. On an Intel platform that is the BIOS region and nothing else — the Descriptor, GbE, ME and EC regions carry per-board identity, and cloning another board's GbE region puts two machines with the same MAC address on your network.", { destructive: true });
  add("4 · restore", "verify", "Verify by reading back and comparing bit-for-bit. A verify step inside the programmer that re-reads its own cache proves nothing.", { destructive: false });
  add("4 · restore", "boot", "Boot with the minimum attached: one known-good DIMM in the slot nearest the CPU, one display output, no expansion cards. Every extra device is another thing that can look like the fault you are chasing.", { destructive: false });
  add("5 · close", "record", "Record what was replaced, with what, from which vendor, and what the verification showed. The next person to open this board — possibly you, in two years — is relying on it.", { destructive: false });

  return {
    ok: true,
    symptomId, familyId, steps,
    destructiveCount: steps.filter((s) => s.destructive).length,
    summary: `${steps.length} steps, ${steps.filter((s) => s.destructive).length} of them irreversible. Everything before the first irreversible step is measurement, reading or identification — that ordering is deliberate.`,
  };
}

export { SUBSTITUTION_FAMILIES, SYMPTOMS, FAMILY_CODES, DS18B20, DS2438, DRIVE_TRIAGE, SMART_ATTRS, PORTABILITY, hex };
