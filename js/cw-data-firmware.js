/* CHIPWRIGHT · cw-data-firmware.js — the math coprocessor, the POST card and
 * the CPU substitution decision.
 *
 * Three things that look unrelated and are not: the x87 is the oldest
 * still-shipping coprocessor interface in personal computing and its probe
 * instruction is the shortest possible proof that a chip on the board is a real
 * processor; a POST card is the cheapest diagnostic instrument ever made and
 * its codes are the one place a firmware failure explains itself; and CPU
 * substitution is the repair where "compatible" and "interchangeable" diverge
 * hardest.
 *
 * Evidence tags: std / tool / report / recall.
 */

import { hex } from "./cw-data.js";

/* ------------------------------------------------------------------ *
 * 1. The x87 math coprocessor
 *    ev: "std" (Intel SDM Vol. 1 ch. 8 and the AMD64 ABI). This is the part
 *    that makes a *diagnostic* possible rather than a guess.
 * ------------------------------------------------------------------ */

export const X87 = {
  history: [
    "The 8087 (1980) was a separate chip on the same bus as the 8086/8088, and it was the first: every later x87 is register-compatible with it, which is why a 387 works in a 486-era design that only ever expected an 80387.",
    "From the 486DX onward the FPU is inside the CPU die. The 486SX shipped with a disabled FPU and an upgrade socket for a 487SX, which was in fact a complete 486DX that took over the machine and disabled the original CPU. That is the single strangest socket-to-board relationship in PC history and it is exactly the kind of thing a substitution guide has to warn about.",
    "Since the Pentium the x87 has been architecturally retained but is not the fast path: SSE2 scalar doubles are faster for almost everything and are mandatory in the x86-64 baseline. A board that has lost its FPU has still lost real capability, but you find out from software that probes rather than from software that computes.",
  ],
  registerModel: [
    "Eight 80-bit registers arranged as a circular stack, addressed ST(0)-ST(7) relative to a moving top pointer. The physical register number is (TOP + i) mod 8, so 'ST(0)' is not a fixed register.",
    "Each 80-bit register is a 15-bit sign-extended exponent (bias 16383) plus an EXPLICIT leading significand bit and a 64-bit fraction. That explicit bit is the whole difference from IEEE double: it gives 64 bits of precision, ~18.5 significant decimal digits, and no denormal gap at the same scale.",
    "The extended range is the practical reason the x87 still exists: the largest finite value is about 1.19e4932 and the smallest normal about 3.36e-4932. A double overflows at 1.8e308. Code that computes factorials, iterated exponentials or long-running integrals can genuinely need the headroom.",
    "The tag word holds two bits per register: 00 valid, 01 zero, 10 special (denormal, NaN or infinity), 11 empty. An exception that says 'stack fault' means the code pushed onto a full stack or popped an empty one, and it is a software bug far more often than a hardware one.",
  ],
  controlWord: {
    note: "16 bits, loaded by FLDCW. Bits 0-5 are exception masks, bits 8-9 precision control, bits 10-11 rounding control.",
    fields: [
      { bits: "0", name: "IM", meaning: "Invalid operation mask" },
      { bits: "1", name: "DM", meaning: "Denormal mask" },
      { bits: "2", name: "ZM", meaning: "Divide-by-zero mask" },
      { bits: "3", name: "OM", meaning: "Overflow mask" },
      { bits: "4", name: "UM", meaning: "Underflow mask" },
      { bits: "5", name: "PM", meaning: "Precision mask" },
      { bits: "8-9", name: "PC", meaning: "00 = single (24-bit), 10 = double (53-bit), 11 = extended (64-bit). Setting PC to double is what makes x87 arithmetic agree bit-for-bit with SSE2, and is why some numeric libraries do it deliberately." },
      { bits: "10-11", name: "RC", meaning: "00 = round to nearest, 01 = round down, 10 = round up, 11 = truncate. Reading this tells you whether a rounding discrepancy is the chip or the software." },
    ],
    defaultAfterReset: 0x037f,
    defaultMeaning: "All six exception masks set, precision = extended, rounding = nearest. This is the value FNINIT leaves behind and it is a usable fingerprint: a working x87 that has just been initialised returns exactly 0x037F from FNSTCW.",
    ev: "std",
  },
  statusWord: {
    note: "16 bits, readable by FNSTSW. Bits 0-5 are the exception flags, bits 8-10 are C0-C2 condition codes, bits 11-13 are TOP, bit 14 is C3, bit 15 is the busy/error summary.",
    fields: [
      { bits: "0", name: "IE", meaning: "Invalid operation" },
      { bits: "1", name: "DE", meaning: "Denormal" },
      { bits: "2", name: "ZE", meaning: "Divide by zero" },
      { bits: "3", name: "OE", meaning: "Overflow" },
      { bits: "4", name: "UE", meaning: "Underflow" },
      { bits: "5", name: "PE", meaning: "Precision" },
      { bits: "6", name: "SF", meaning: "Stack fault — the register stack over- or under-ran." },
      { bits: "7", name: "ES", meaning: "Error summary status" },
      { bits: "8", name: "C0", meaning: "Condition code 0" },
      { bits: "9", name: "C1", meaning: "Set on stack overflow; also the sign bit for FPREM and FROUND results." },
      { bits: "10", name: "C2", meaning: "Set by FPREM when the reduction is incomplete, and by FCOM for unordered operands." },
      { bits: "11-13", name: "TOP", meaning: "The stack top pointer. Reading this before and after a single FLD tells you whether the load actually happened." },
      { bits: "14", name: "C3", meaning: "Equality flag for FCOM/FUCOM." },
      { bits: "15", name: "B", meaning: "Busy — an operation is in progress or an unmasked error is pending." },
    ],
    ev: "std",
  },
  probe: {
    name: "The x87 presence probe",
    why: "Before a BIOS can decide whether to install FPU support it has to know whether the coprocessor exists at all. On a 386/486SX board the FPU is a separate chip in a socket and may simply be absent, so the test has to distinguish 'not there' from 'there but broken' without a CPUID instruction.",
    sequence: [
      { step: 1, asm: "fninit", what: "Initialise the FPU without checking for pending exceptions. On a board with no coprocessor this is a no-op that does not fault on modern CPUs (the #NM would be handled by firmware) — it just has no effect." },
      { step: 2, asm: "fnstcw  word [buf]", what: "Store the control word to memory. With no FPU, the store does not happen and the buffer keeps whatever was there." },
      { step: 3, asm: "mov ax, [buf] / cmp ax, 0x037f", what: "The decision. 0x037F means a coprocessor responded and initialised correctly. Anything else — and in particular the byte pattern you deliberately pre-filled the buffer with — means there is no working FPU." },
      { step: 4, asm: "fnstsw ax  (after fninit)", what: "A second, independent confirmation: the status word should read 0x0000 after FNINIT, with TOP = 0 and every flag clear." },
    ],
    prefillTrick: "The probe only works if the buffer is pre-filled with something that is NOT 0x037F — commonly 0x55AA or 0xFFFF. A buffer that happens to contain 0x037F because of leftover stack content produces a false positive, and this is the classic bug in hand-written coprocessor tests.",
    stronger: [
      "Write and read back a distinctive control word: FLDCW with 0x137F (precision = double), then FNSTCW and check for 0x137F. A dead or absent FPU cannot produce it, and a stuck-bits FPU will produce something else.",
      "Round-trip a known value: FLD the double 1.0, FSTP it into an 80-bit slot, FLD it back, FSUB against itself and check the status word for exact zero. This exercises the load/store path, the significand and the compare.",
      "The classic precision discriminator: compute 1.0 + 2^-53 and compare against 1.0. With precision = extended the two differ; with precision = double they do not. That single test distinguishes a genuine 64-bit-significand FPU from a 53-bit one, which is a real substitution question when a vendor part is a re-branded or reduced die.",
    ],
    ev: "std",
  },
  instructions: [
    { bytes: "9B DB E3", mnem: "finit / wait; finit", what: "The waiting form; the FN form (DB E3) skips the pending-exception check." },
    { bytes: "9B D9 3C 24", mnem: "fnstcw [esp]", what: "Store control word (the FN form is D9 3C 24)." },
    { bytes: "66 9B D9 3C 24", mnem: "fnstcw (16-bit operand-size prefix variant)", what: "Operand-size prefixes change the encoding of some x87 memory forms." },
    { bytes: "9B DF E0", mnem: "fnstsw ax", what: "Store the status word into AX. The form that fits in a register-only probe." },
    { bytes: "D9 E8", mnem: "fld1", what: "Push +1.0." },
    { bytes: "D9 EE", mnem: "fldz", what: "Push +0.0." },
    { bytes: "D9 E9", mnem: "fldl2e", what: "Push log2(e) — one of the seven built-in irrational constants, and a fast way to load a value with a long non-repeating significand for a stuck-bit test." },
    { bytes: "DD C0", mnem: "ffree st(0)", what: "Mark the top register empty." },
    { bytes: "D8 E1", mnem: "fsub st, st(1)", what: "" },
    { bytes: "DE D9", mnem: "fcompp", what: "Compare and pop twice." },
  ],
  ev: "std",
};

export function decodeX87ControlWord(w) {
  const masks = ["IM", "DM", "ZM", "OM", "UM", "PM"];
  return {
    word: w,
    hex: hex(w, 4),
    exceptionMasks: masks.filter((_, i) => (w >> i) & 1),
    exceptionsEnabled: masks.filter((_, i) => !((w >> i) & 1)),
    precision: { 0: "single (24-bit)", 2: "double (53-bit)", 3: "extended (64-bit)" }[(w >> 8) & 3] || `reserved (${(w >> 8) & 3})`,
    rounding: { 0: "nearest", 1: "down (toward -inf)", 2: "up (toward +inf)", 3: "truncate (toward zero)" }[(w >> 10) & 3],
    isResetDefault: w === 0x037f,
    verdict: w === 0x037f
      ? "0x037F — the value FNINIT leaves behind. A coprocessor that returns this after initialisation is present and responding."
      : "Not the reset default. Either the software has deliberately set precision or rounding (check PC and RC above), or the store did not come from a working FPU.",
  };
}

export function decodeX87StatusWord(w) {
  const flags = ["IE", "DE", "ZE", "OE", "UE", "PE", "SF", "ES"];
  return {
    word: w,
    hex: hex(w, 4),
    flags: flags.filter((_, i) => (w >> i) & 1),
    conditionCodes: { C0: (w >> 8) & 1, C1: (w >> 9) & 1, C2: (w >> 10) & 1, C3: (w >> 14) & 1 },
    top: (w >> 11) & 7,
    busy: (w >> 15) & 1,
    stackFault: (w >> 6) & 1,
    clean: w === 0,
    verdict: w === 0
      ? "0x0000 — no flags, TOP = 0, not busy. This is the expected status word immediately after FNINIT."
      : (w >> 6) & 1
        ? "Stack fault set. The code pushed onto a full stack or popped an empty one. That is a software defect in nine cases out of ten, not a broken FPU."
        : `Exception flags set: ${flags.filter((_, i) => (w >> i) & 1).join(", ") || "none"}. With the masks set (the default) these accumulate silently and do not stop execution.`,
  };
}

/* ------------------------------------------------------------------ *
 * 2. The POST card — a virtual model of a real one
 *    ev: "tool"/"report". Codes are vendor-specific; the *mechanism* is not.
 * ------------------------------------------------------------------ */

export const POST_CARD = {
  what: "A card that plugs into ISA, PCI, PCI-X, LPC, Mini-PCIe or M.2 and displays the byte the BIOS writes to I/O port 0x80. Some also latch the four LED groups: power rails, reset, clock and frame.",
  portNote: "Port 0x80 is the conventional POST-code port on x86, but it is a convention and nothing more. AMI writes 0x80; Phoenix writes 0x80 on some products and 0x84 or a vendor-specific port on others; coreboot's default is 0x80. If the display never changes, the first thing to check is the port, not the board.",
  lspNote: "On LPC and eSPI there is no legacy ISA I/O decode in the same sense — the code port is routed by the PCH and the card must be in a slot the firmware actually drives. An LPC POST card on a board whose firmware never touches 0x80 shows a frozen value and means nothing.",
  leds: [
    { name: "+3.3V / +5V / +12V / Vcore", meaning: "Rail presence. A card whose Vcore LED never lights while the others do is telling you the CPU power stage is not coming up, which is a VRM problem and not a firmware problem." },
    { name: "RESET / RST#", meaning: "Asserted low during reset. If it never de-asserts, the platform is held in reset — check the PCH's reset sources, the RTC well and any chassis-intrusion switch that is wired into the reset chain." },
    { name: "CLK", meaning: "The bus clock. No clock and nothing else matters." },
    { name: "FRAME / OSC", meaning: "Bus activity. A card showing a code with no frame activity has latched a stale value." },
    { name: "BIOS / IRQ", meaning: "Varies by card." },
  ],
  interpretation: [
    "A frozen code means execution stopped there. That is information, not failure — find the vendor's table for that exact code.",
    "A code that cycles repeatedly means a retry loop: memory training, PCIe link training, or a device that will not answer.",
    "No code at all with rails present means the CPU is not fetching, or is fetching from a flash that is not answering. Attach a logic analyser to the SPI CS#/CLK and see whether there is any traffic.",
    "A code in the 0x00-0x0F range on an AMI board usually means the very earliest SEC phase; a code in the 0xE0-0xEF range usually means the firmware has handed off and the OS is running.",
    "Codes are NOT portable between vendors. An AMI 0x2C and a Phoenix 0x2C are unrelated. The vendor table for the board in front of you is the only authority.",
  ],
  ev: "report",
};

/** A model of a POST-card trace so the workbench can interpret a captured run. */
export function analysePostTrace(codes) {
  const seq = Array.isArray(codes) ? codes.map((c) => (typeof c === "string" ? parseInt(c, 16) : c)) : [];
  if (!seq.length) return { ok: false, note: "No codes captured. A trace with nothing in it is either a wrong port or a board that never got to POST." };
  const last = seq[seq.length - 1];
  const first = seq[0];
  const distinct = [...new Set(seq)];
  const tail = seq.slice(-8);
  const repeats = tail.length >= 4 && new Set(tail).size <= 2;
  const handed = last >= 0xe0 && last <= 0xef;
  return {
    ok: true,
    count: seq.length,
    first, last, distinctCount: distinct.length,
    lastHex: hex(last),
    pattern: repeats ? "retry loop" : handed ? "handoff to OS" : distinct.length === seq.length ? "monotonic — no repeats" : "mixed",
    phase: last <= 0x0f ? "SEC / earliest PEI" : last < 0x40 ? "PEI / memory init" : last < 0x80 ? "DXE / device init" : last < 0xe0 ? "BDS / boot device selection" : "OS handoff",
    verdict: repeats
      ? `The trace is stuck cycling between ${tail.map((t) => hex(t)).join(" → ")}. A repeating code is a retry, and the most common retries at this stage are memory training and PCIe link training. Do not treat it as a dead board yet.`
      : handed
        ? `Reached ${hex(last)}, which is the OS-handoff range. Firmware completed; anything wrong now is in the bootloader or the OS, not in the BIOS.`
        : `Stopped at ${hex(last)} during the ${last <= 0x0f ? "SEC" : last < 0x40 ? "PEI" : last < 0x80 ? "DXE" : "BDS"} phase, having passed ${distinct.length} distinct codes starting from ${hex(first)}. Find the vendor's table for ${hex(last)} — that is the specific question to answer.`,
  };
}

/* ------------------------------------------------------------------ *
 * 3. CPU substitution — where "compatible" stops meaning "interchangeable"
 *    ev: "report"/"std" mixed; each row says which.
 * ------------------------------------------------------------------ */

export const CPU_SUBSTITUTION = [
  {
    axis: "Socket / physical",
    rule: "Same pin count is not the same socket. LGA1151 v1 and v2 both have 1151 pins and are not interchangeable: v2 moves power and ground pins to support the higher core counts of 8th/9th gen, and a v1 CPU in a v2 board can be damaged.",
    howToCheck: "Read the board's chipset, not the socket name. A 100/200-series chipset means v1; 300-series means v2.",
    ev: "std",
  },
  {
    axis: "Chipset support list",
    rule: "Even in the correct socket, the CPU must be in the board vendor's support list AND the BIOS must be recent enough. A board that physically accepts a CPU but has an old microcode/AGESA will not POST, and the failure looks exactly like a dead CPU.",
    howToCheck: "Vendor CPU support list plus the BIOS revision it names. Update the BIOS with a supported CPU first, then swap.",
    ev: "std",
  },
  {
    axis: "Microcode / CPUID",
    rule: "The BIOS carries microcode patches per CPUID. A CPU whose family/model/stepping has no patch in the firmware either fails to initialise or runs unpatched against known errata. This is the failure mode that makes 'same socket, newer CPU' silently unsafe.",
    howToCheck: "CPUID family/model/stepping against the firmware's microcode list. On Intel, the microcode revision is readable from MSR 0x8B after loading.",
    ev: "std",
  },
  {
    axis: "TDP / VRM",
    rule: "A board designed for 65 W parts will run a 125 W part at reduced clocks or will overheat its VRM. The VRM phase count and the heatsink on the MOSFETs are the real limits, not the BIOS setting.",
    howToCheck: "Board vendor's max supported TDP, then look at the VRM: phase count, MOSFET part numbers, and whether there is any heatsink at all.",
    ev: "report",
  },
  {
    axis: "Voltage / VID",
    rule: "Older sockets had fixed VID tables; newer ones negotiate through SVID/PMBus. A CPU from a different generation may request a voltage the VRM controller cannot produce.",
    howToCheck: "Measure VCORE at the socket during POST. If it is absent while PWRGOOD is high, the VRM never got a valid request.",
    ev: "report",
  },
  {
    axis: "Integrated graphics",
    rule: "A CPU without an iGPU in a board with no discrete output gives you no video, which is indistinguishable from a POST failure. And the reverse: a board whose display connector is wired to the iGPU cannot use it with an F-suffix Intel part or an AMD part without a G suffix.",
    howToCheck: "Read the CPU suffix (Intel F/KF = no iGPU; AMD G/GE = iGPU present, plain = none on most AM4 parts) and trace the board's display connector to either the CPU or a discrete GPU.",
    ev: "std",
  },
  {
    axis: "Memory support",
    rule: "The memory controller is in the CPU. Swapping CPUs changes the supported memory speed, the maximum capacity per DIMM and the rank limits, even though the DIMM slots did not move.",
    howToCheck: "The new CPU's datasheet for max speed and max capacity, then the board vendor's QVL.",
    ev: "std",
  },
  {
    axis: "Instruction set / ABI",
    rule: "A substitution that drops an instruction set breaks software silently at runtime rather than at boot. AVX-512 is the live example: a chip that has it and a chip that does not can both run the same OS, and only the workload that uses it faults.",
    howToCheck: "Compare CPUID feature bits (leaf 1 ECX/EDX, leaf 7 EBX/ECX/EDX) between the original and the replacement. The repo's js/cpu-id.js does exactly this decode.",
    ev: "std",
  },
  {
    axis: "Cross-vendor",
    rule: "x86 to x86 across vendors (Intel ↔ AMD) is a socket, chipset, firmware and driver change, not a chip swap. ARM to ARM across vendors is closer but still needs a new device tree / ACPI table set and usually new firmware.",
    howToCheck: "Treat it as a board replacement that happens to reuse the chassis, and budget for the firmware work.",
    ev: "report",
  },
  {
    axis: "Counterfeit / remarked parts",
    rule: "A CPU that is physically correct and POSTs but reports a different model, or reports the right model and fails under load, is the signature of a remarked part. The lid markings are not evidence.",
    howToCheck: "CPUID before and after; microcode revision; behaviour under sustained load with power measured; and the sSPEC/OPN code decoded against the vendor's own catalogue.",
    ev: "report",
  },
];

export const CPU_SWAP_PROCEDURE = [
  "Record the original CPU's full CPUID — vendor string, family/model/stepping, brand string, feature leaves 1 and 7 — before it comes out. Without it you cannot prove the replacement is equivalent, and you cannot tell a remarked part from a genuine one afterwards.",
  "Photograph the socket, the lid and the sSPEC code. Photograph the board revision, because the support list is per-revision.",
  "Update the BIOS to the revision the vendor names for the target CPU, using a CPU that already works. Never update firmware as part of a swap you have not yet proven.",
  "Swap. Boot. Record the new CPU's CPUID and diff it against the old one, feature bit by feature bit.",
  "Load it. A CPU that idles correctly and fails under sustained load is a VRM, thermal or counterfeit problem, and none of the three show up at POST.",
  "Re-apply the thermal interface properly and record what you used. A substituted CPU with the original dried paste and a badly seated cooler produces a thermal fault that will be misdiagnosed as a bad part.",
];

export { hex };
