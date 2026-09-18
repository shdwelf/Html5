/* CHIPWRIGHT · cw-data-onewire.js — Dallas/Maxim 1-Wire, iButton and the
 * 1-Wire file structure.
 *
 * Why this belongs in a hardware repair workbench: a weather station is the
 * single most common piece of field equipment whose sensors are not on I2C or
 * SPI but on a one-wire bus with parasitic power, a 48-bit serial number per
 * device, and a filesystem defined in an application note rather than a
 * datasheet. When one dies you are not debugging a chip, you are debugging a
 * pull-up resistor, a cable length and a CRC.
 *
 * Evidence tags: std / tool / report / recall.
 */

import { u32 } from "./cw-data.js";

/* ------------------------------------------------------------------ *
 * 1. ROM commands — the six defined by the standard
 *    ev: "std" (Dallas/Maxim application notes; corroborated by Microchip's
 *    AVR318 1-Wire master app note, which lists exactly these six).
 * ------------------------------------------------------------------ */

export const ROM_COMMANDS = [
  { code: 0x33, name: "READ ROM", ev: "std", use: "Returns the 64-bit ROM id. Only valid when exactly one device is on the bus — with several, their open-drain outputs collide and you read garbage that still looks like data." },
  { code: 0xf0, name: "SEARCH ROM", ev: "std", use: "The enumeration algorithm. Per bit the master reads the true value and its complement; a (0,0) pair means devices disagree, and the master records the branch point so it can walk the whole tree." },
  { code: 0x55, name: "MATCH ROM", ev: "std", use: "Followed by 64 bits of ROM id. Only the matching device responds. This is what you use once you have enumerated." },
  { code: 0xcc, name: "SKIP ROM", ev: "std", use: "Addresses every device at once. Fine for a single sensor; on a multi-drop bus with a power-hungry command it collapses the rail, because every device converts at the same time and the pull-up cannot hold the bus high." },
  { code: 0xec, name: "ALARM SEARCH", ev: "std", use: "Like SEARCH ROM but only devices in an alarm condition answer. The fast way to poll a large bus for out-of-range temperatures." },
  { code: 0x3c, name: "OVERDRIVE SKIP ROM", ev: "std", use: "Switches the bus to overdrive speed (~10× faster) and skips addressing." },
  { code: 0x69, name: "OVERDRIVE MATCH ROM", ev: "std", use: "Overdrive plus addressing." },
  { code: 0xa5, name: "RESUME", ev: "report", use: "Re-addresses the last device matched, without re-sending 64 bits. Not implemented by every family." },
];

/* ------------------------------------------------------------------ *
 * 2. The 64-bit ROM id
 *    ev: "std". Family code | 48-bit serial | 8-bit CRC over the first 56 bits.
 * ------------------------------------------------------------------ */

export function decodeRom(bytes) {
  if (!bytes || bytes.length < 8) return null;
  const family = bytes[0];
  const crcByte = bytes[7];
  const calc = crc8(bytes, 0, 7);
  const known = FAMILY_CODES.find((f) => f.code === family);
  return {
    raw: Array.from(bytes.slice(0, 8)),
    hex: Array.from(bytes.slice(0, 8)).map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" "),
    family,
    familyName: known ? known.name : `unrecognised family 0x${family.toString(16).toUpperCase().padStart(2, "0")}`,
    familyEv: known ? known.ev : "none",
    what: known ? known.what : "",
    serial: Array.from(bytes.slice(1, 7)).map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(""),
    crc: crcByte,
    crcCalc: calc,
    crcOk: crcByte === calc,
    note: crcByte === calc
      ? "CRC-8 over the first seven bytes agrees. The id is intact."
      : `CRC mismatch: the ROM says 0x${crcByte.toString(16).toUpperCase().padStart(2, "0")}, the calculation gives 0x${calc.toString(16).toUpperCase().padStart(2, "0")}. A bad CRC on a ROM read means a bus problem, not a device problem — check the pull-up and the cable before condemning anything.`,
  };
}

/**
 * Dallas CRC-8, polynomial X^8 + X^5 + X^4 + 1 (0x31 normal, 0x8C reflected).
 * ev: "std" — Maxim application note 27 and every datasheet that carries the
 * CRC diagram. Shift register initialised to zero, LSB first.
 */
export function crc8(bytes, start = 0, end = bytes.length) {
  let crc = 0;
  for (let i = start; i < end; i++) {
    let inbyte = bytes[i];
    for (let j = 0; j < 8; j++) {
      const mix = (crc ^ inbyte) & 0x01;
      crc >>>= 1;
      if (mix) crc ^= 0x8c;
      inbyte >>>= 1;
    }
  }
  return crc & 0xff;
}

/**
 * Dallas CRC-16, polynomial X^16 + X^15 + X^2 + 1 (0x8005 normal, 0xA001
 * reflected). Register initialised to zero, data shifted in LSB-first — the
 * same convention as the CRC-8. This is CRC-16/ARC == CRC-16/MAXIM; its
 * published check value for the ASCII string "123456789" is 0xBB3D.
 *
 * The property that makes it self-verifying on a real bus: after the master has
 * shifted in the data, the CRC and its COMPLEMENT (LSB first), the running
 * register reads 0xB001. That is the number Maxim documents and the one to
 * assert against in a test. ev: "std".
 */
export function crc16(bytes, start = 0, end = bytes.length) {
  let crc = 0;
  for (let i = start; i < end; i++) {
    let value = bytes[i];
    for (let j = 0; j < 8; j++) {
      const mix = (crc ^ value) & 0x01;
      crc >>>= 1;
      if (mix) crc ^= 0xa001;
      value >>>= 1;
    }
  }
  return crc & 0xffff;
}

/** The Maxim check word: run this over data + ~CRC (LSB first) and expect 0xB001. */
export const CRC16_CHECK_WORD = 0xb001;
export const CRC16_CHECK_STRING = 0xbb3d;

/* ------------------------------------------------------------------ *
 * 3. Family codes
 *    ev: "tool" where the code appears in owfs / the Linux w1 driver family
 *    tables and in Microchip/Maxim application notes; "report" for the ones
 *    that are only in a datasheet I could not re-read this session.
 * ------------------------------------------------------------------ */

export const FAMILY_CODES = [
  { code: 0x01, name: "DS1990A / DS2401", what: "Serial-number-only iButton. No memory, no function — the 'presence' device. The Blue Touch Memory Key.", ev: "tool" },
  { code: 0x02, name: "DS1991", what: "1152-byte multi-key iButton with three password-protected fields. The old software-dongle form factor.", ev: "report" },
  { code: 0x04, name: "DS1994 / DS2404", what: "4 Kbit NVRAM plus a real-time clock and interval timer.", ev: "tool" },
  { code: 0x05, name: "DS2405", what: "Single addressable switch. Controls a relay or a MOSFET from the bus.", ev: "tool" },
  { code: 0x06, name: "DS1993", what: "4 Kbit NVRAM iButton.", ev: "tool" },
  { code: 0x08, name: "DS1992", what: "1 Kbit NVRAM iButton.", ev: "tool" },
  { code: 0x09, name: "DS1982 / DS2502", what: "1 Kbit add-only (EPROM) memory. The 'write once per bit' family — bits can only go 1→0.", ev: "tool" },
  { code: 0x0a, name: "DS1995", what: "16 Kbit NVRAM iButton.", ev: "tool" },
  { code: 0x0b, name: "DS1985 / DS2505", what: "16 Kbit add-only memory.", ev: "tool" },
  { code: 0x0c, name: "DS1996", what: "64 Kbit NVRAM iButton.", ev: "tool" },
  { code: 0x0d, name: "DS2408", what: "1-Wire variant numbering; see 0x29 for the switch device.", ev: "report" },
  { code: 0x0f, name: "DS1986 / DS2506", what: "64 Kbit add-only memory.", ev: "tool" },
  { code: 0x10, name: "DS18S20 / DS1920", what: "High-precision digital thermometer, 9-bit. The older sibling of the DS18B20; the scratchpad layout and the count-remain/count-per-degree trick are different, so the two are not code-compatible.", ev: "tool" },
  { code: 0x12, name: "DS2406 / DS2407", what: "Dual addressable switch with 1 Kbit memory. The workhorse for controlling two loads from one bus pin.", ev: "tool" },
  { code: 0x14, name: "DS1971 / DS2430A", what: "256-bit EEPROM plus a 64-bit register.", ev: "tool" },
  { code: 0x1a, name: "DS2423", what: "4 Kbit memory with two 32-bit hardware counters. Used for utility metering and for counting events without a CPU.", ev: "tool" },
  { code: 0x1d, name: "DS2421", what: "—", ev: "recall" },
  { code: 0x1f, name: "DS2409", what: "1-Wire coupler / microLAN coupler. Switches sub-buses onto the main one; the device that makes a large installation possible.", ev: "tool" },
  { code: 0x20, name: "DS2450", what: "Quad A/D converter, 16-bit, with programmable ranges. The sensor front-end in a lot of DIY weather stations.", ev: "tool" },
  { code: 0x21, name: "DS1921 / DS2421-class", what: "Thermochron — a temperature logger with 2048 samples in its own clock. The iButton that started the whole logging market.", ev: "report" },
  { code: 0x22, name: "DS1822", what: "Econo digital thermometer. Same command set as the DS18B20 with a wider tolerance; the family code is the only reliable way to tell them apart.", ev: "tool" },
  { code: 0x23, name: "DS2433", what: "4 Kbit EEPROM.", ev: "tool" },
  { code: 0x24, name: "DS1904 / DS2415", what: "RTC iButton.", ev: "tool" },
  { code: 0x26, name: "DS2438", what: "Smart Battery Monitor: 8-bit ADC on two channels, temperature sensor, current accumulator, and 40 bytes of user EEPROM. This is the humidity-sensor interface in the classic Hobby Boards / AAG design — the humidity element is a resistive or capacitive sensor read through the DS2438's ADC.", ev: "tool" },
  { code: 0x27, name: "DS2417", what: "RTC with interrupt.", ev: "report" },
  { code: 0x28, name: "DS18B20", what: "Programmable-resolution digital thermometer, 9-12 bits. By a wide margin the most common 1-Wire device in existence, and the one in nearly every DIY weather station.", ev: "tool" },
  { code: 0x29, name: "DS2408", what: "8-channel addressable switch with open-drain outputs. Used to drive relays, to read a matrix keypad, and to bit-bang anything that needs eight outputs from one pin.", ev: "tool" },
  { code: 0x2c, name: "DS2890", what: "256-step linear digital potentiometer.", ev: "tool" },
  { code: 0x2d, name: "DS2431", what: "1 Kbit EEPROM in four 256-bit pages, each with its own write cycle. The common 'small config blob' device.", ev: "tool" },
  { code: 0x30, name: "DS2436", what: "Battery monitor / ID, the predecessor of the DS2438.", ev: "report" },
  { code: 0x31, name: "DS1961S / DS2432", what: "1 Kbit EEPROM with a SHA-1 engine. The authenticated-memory device: it answers a challenge with a MAC, which is how a host proves it is talking to a genuine accessory.", ev: "tool" },
  { code: 0x32, name: "DS2413", what: "Dual addressable switch, the smaller successor to the DS2406.", ev: "tool" },
  { code: 0x33, name: "DS2433", what: "Also seen as the family code for the 4 Kbit EEPROM depending on revision — verify with the datasheet for the part in hand.", ev: "report" },
  { code: 0x36, name: "DS2437", what: "Smart battery monitor, the DS2438's sibling without the current accumulator.", ev: "report" },
  { code: 0x37, name: "DS1977", what: "32 Kbit password-protected EEPROM iButton.", ev: "report" },
  { code: 0x3a, name: "DS2413-class", what: "—", ev: "recall" },
  { code: 0x41, name: "DS2439", what: "Dual battery monitor with current measurement.", ev: "report" },
  { code: 0x42, name: "DS28EA00", what: "Digital thermometer with two extra PIO pins, designed so a chain of them can be read without a search — each device forwards to the next. This is the family that makes a daisy-chained multi-point temperature string practical.", ev: "tool" },
  { code: 0x43, name: "DS28EC20", what: "20 Kbit EEPROM with a SHA-256 engine. The modern authenticated-memory part.", ev: "tool" },
];

/* ------------------------------------------------------------------ *
 * 4. Memory function commands — the two families that matter
 *    ev: "std" (datasheets).
 * ------------------------------------------------------------------ */

export const DS18B20 = {
  family: 0x28,
  commands: [
    { code: 0x44, name: "CONVERT T", ev: "std", what: "Starts a temperature conversion. Takes up to 750 ms at 12-bit resolution and 93.75 ms at 9-bit. The device holds the bus low while converting if it is parasitically powered, which is how the master knows it is done without timing." },
    { code: 0xbe, name: "READ SCRATCHPAD", ev: "std", what: "Returns 9 bytes: temp LSB, temp MSB, TH, TL, configuration, reserved, reserved, reserved, CRC-8. The ninth byte is the CRC over the first eight." },
    { code: 0x4e, name: "WRITE SCRATCHPAD", ev: "std", what: "Writes TH, TL and the configuration byte (three bytes). Requires an external supply — parasitic power cannot sustain the EEPROM write." },
    { code: 0x48, name: "COPY SCRATCHPAD", ev: "std", what: "Commits TH/TL/config to EEPROM. Needs 10 ms and a strong pull-up or an external supply." },
    { code: 0xb8, name: "RECALL E²", ev: "std", what: "Copies EEPROM back into the scratchpad." },
    { code: 0xb4, name: "READ POWER SUPPLY", ev: "std", what: "A read slot after this returns 0 if any device on the bus is parasitically powered and 1 if all are externally powered. The fastest possible bus health check." },
  ],
  scratchpad: [
    { byte: 0, name: "TEMP LSB", meaning: "Low byte of the temperature. Two's complement across bytes 0-1." },
    { byte: 1, name: "TEMP MSB", meaning: "High byte, sign-extended. The five MSBs are all copies of the sign bit." },
    { byte: 2, name: "TH / user byte 1", meaning: "High alarm trigger, or general user storage if the alarm function is not used." },
    { byte: 3, name: "TL / user byte 2", meaning: "Low alarm trigger." },
    { byte: 4, name: "CONFIGURATION", meaning: "Bits 6:5 select resolution — 00 = 9-bit (0.5 °C, 93.75 ms), 01 = 10-bit (0.25 °C, 187.5 ms), 10 = 11-bit (0.125 °C, 375 ms), 11 = 12-bit (0.0625 °C, 750 ms). Bit 7 is always 0." },
    { byte: 5, name: "reserved", meaning: "Reads as 0xFF on the DS18B20. On the DS18S20 this byte does not exist, which is the cheapest way to tell a mislabelled part from a real one." },
    { byte: 6, name: "reserved", meaning: "0x0C on the DS18B20." },
    { byte: 7, name: "reserved", meaning: "0x10 on the DS18B20." },
    { byte: 8, name: "CRC", meaning: "Dallas CRC-8 over bytes 0-7." },
  ],
  resolution: [
    { bits: 9, step: 0.5, maxConvertMs: 93.75 },
    { bits: 10, step: 0.25, maxConvertMs: 187.5 },
    { bits: 11, step: 0.125, maxConvertMs: 375 },
    { bits: 12, step: 0.0625, maxConvertMs: 750 },
  ],
  decodeTemperature(lsb, msb) {
    let raw = (msb << 8) | lsb;
    if (raw & 0x8000) raw -= 0x10000;
    return raw / 16;
  },
  ev: "std",
};

export const DS2438 = {
  family: 0x26,
  commands: [
    { code: 0xb1, name: "RECALL MEMORY", ev: "std", what: "Copies a scratchpad page from EEPROM." },
    { code: 0x48, name: "COPY SCRATCHPAD", ev: "std", what: "Commits the scratchpad to EEPROM." },
    { code: 0xb4, name: "READ SCRATCHPAD", ev: "std", what: "Followed by a page address 0-7. Returns 8 data bytes plus a CRC byte." },
    { code: 0x4e, name: "WRITE SCRATCHPAD", ev: "std", what: "Page address then 8 bytes." },
    { code: 0xee, name: "CONVERT V", ev: "std", what: "Starts a voltage conversion on the selected channel." },
    { code: 0x44, name: "CONVERT T", ev: "std", what: "Starts a temperature conversion." },
  ],
  pages: [
    { page: 0, name: "Status / control", what: "Byte 0 is the status register: bit0 IAD (current accumulator enable), bit1 CA (current accumulator polarity), bit2 EE (current accumulator EEPROM enable), bit3 AD (voltage select: 0 = VDD, 1 = VAD), bit4 TB (temperature busy), bit5 NVB (voltage conversion busy), bit6 ADB (voltage busy), bit7 reserved." },
    { page: 1, name: "Temperature", what: "Bytes 0-1: two's complement temperature with the low 3 bits always 1 (discard them), so value = (int16 >> 3) in degrees C. Bytes 2-3: the current accumulator (ICA), a signed count that accumulates the voltage across the sense resistor." },
    { page: 2, name: "Current / voltages", what: "Bytes 0-1: instantaneous current (voltage across the sense resistor, LSB = 0.2441 mV). Bytes 2-3: VDD. Bytes 4-5: VAD. LSB for both is 10 mV." },
    { page: 3, name: "Threshold", what: "The current-accumulator threshold." },
    { page: "4-7", name: "User EEPROM", what: "32 bytes of general storage. On the classic Hobby Boards / AAG humidity sensor, page 3 and the user pages hold the calibration coefficients, which is why replacing the DS2438 without copying those pages produces a sensor that reads but reads wrongly." },
  ],
  humidityNote: "A DS2438-based humidity sensor is not a humidity chip. It is an ADC measuring a resistive or capacitive element whose impedance varies with relative humidity, plus a calibration curve stored in the device's own EEPROM. Losing the calibration page loses the sensor even though the silicon is fine — copy pages 3-7 before replacing the part.",
  ev: "std",
};

export const DS2408 = {
  family: 0x29,
  commands: [
    { code: 0xf0, name: "READ PIO REGISTERS", ev: "std", what: "Address then a stream of the current pin states." },
    { code: 0xf5, name: "READ CHANNEL ACCESS", ev: "std", what: "Continuous read of the pins, with a CRC per sample — the mode used for polling a keypad or a set of contacts fast." },
    { code: 0x5a, name: "WRITE CHANNEL ACCESS", ev: "std", what: "Drives the eight open-drain outputs. Each write is a byte of levels plus an inverted byte, and the device confirms by returning a success byte." },
    { code: 0xc3, name: "READ SEARCH ROM / DISCHARGE", ev: "std", what: "—" },
    { code: 0xcc, name: "WRITE CONTROL REGISTER", ev: "std", what: "Sets the power-on default state and the RSTZ pin behaviour (input strobe vs active-low reset). The RSTZ behaviour is set by an OTP bit, so a used DS2408 may be permanently configured the other way from what the datasheet default says — read it, do not assume it." },
  ],
  ev: "std",
};

/* ------------------------------------------------------------------ *
 * 5. Bus timing — the numbers that decide whether your adapter works
 *    ev: "std" (standard speed); "report" for the overdrive figures.
 * ------------------------------------------------------------------ */

export const ONEWIRE_TIMING = [
  { phase: "Reset pulse (master pulls low)", standardSpeed: "≥ 480 µs", overdrive: "≥ 48 µs", ev: "std", note: "Shorter than this and the device never sees a reset; longer is harmless." },
  { phase: "Master releases, presence window", standardSpeed: "15-60 µs then sample", overdrive: "2-6 µs", ev: "std", note: "The device pulls the bus low for 60-240 µs (standard) to signal presence. Sample inside the window; a pull-up that is too weak stretches the edges and you miss it." },
  { phase: "Write-1 slot", standardSpeed: "1-6 µs low, then release for the rest of a ≥ 60 µs slot", overdrive: "1-2 µs low", ev: "std", note: "The device samples at ~15 µs (standard) after the falling edge. Anything longer than that and the 1 is read as a 0." },
  { phase: "Write-0 slot", standardSpeed: "60-120 µs low", overdrive: "8-10 µs low", ev: "std", note: "Must be held low past the sample point." },
  { phase: "Read slot", standardSpeed: "Master pulls low 1-2 µs, releases, samples at ~15 µs", overdrive: "sample at ~2 µs", ev: "std", note: "The master always initiates a read slot; the device only holds it low for a 0." },
  { phase: "Recovery time between slots", standardSpeed: "≥ 1 µs", overdrive: "≥ 1 µs", ev: "std", note: "Skipping the recovery time is the most common cause of intermittent reads on a fast microcontroller." },
  { phase: "Pull-up resistor", standardSpeed: "4.7 kΩ to VCC (3.3 V or 5 V)", overdrive: "2.2 kΩ or an active pull-up (a MOSFET to the rail)", ev: "report", note: "4.7 kΩ works for a short bus with a handful of devices. Beyond ~5 m or ~5 devices, the bus capacitance makes the rising edge too slow and you need a stronger pull-up or a dedicated 1-Wire driver such as the DS2482 or DS28E07." },
];

export const ONEWIRE_BUS_FAULTS = [
  { symptom: "Search finds one device, then stops", cause: "A branching bus with a search algorithm that does not record the last discrepancy correctly, or two devices with the same ROM (clones exist).", fix: "Log id_bit, cmp_id_bit and last_discrepancy at every step and compare against the reference algorithm. A (0,0) pair is a fork, not an error.", ev: "report" },
  { symptom: "Reads work on the bench, fail in the field", cause: "Cable length and capacitance. A weather station's sensor run is often 10-30 m of untwisted wire.", fix: "Twisted pair with the bus on one conductor and ground on the other, a stronger pull-up at the master end, and a DS2482/DS28E07 driver with active pull-up instead of a GPIO bit-bang.", ev: "report" },
  { symptom: "Device present but every CRC fails", cause: "Rising edges too slow, or a ground offset between the master and the sensor.", fix: "Measure the bus with a scope: a rise time over ~5 µs means the pull-up is fighting the bus capacitance. Check that the sensor's ground and the master's ground are actually the same ground.", ev: "report" },
  { symptom: "Parasitically powered device works on read but fails on write", cause: "A parasitic device draws its write energy from the bus through the pull-up, and a 4.7 kΩ pull-up cannot supply it.", fix: "Either an external supply to the device's VDD, or a 'strong pull-up' — the master drives the bus hard high (through a MOSFET, never directly from a GPIO) for the duration of the write. The DS2482 does this properly.", ev: "std" },
  { symptom: "Temperature reads exactly 85 °C", cause: "85 °C is the DS18B20's power-on reset value. You are reading the scratchpad before the first CONVERT T has finished.", fix: "Issue CONVERT T and wait the resolution-dependent conversion time (750 ms at 12-bit) before reading. If the value stays 85 °C, the conversion never ran — usually a missing strong pull-up.", ev: "std" },
  { symptom: "SKIP ROM works with one sensor, breaks with two", cause: "Both devices convert at once and the bus collapses.", fix: "Enumerate with SEARCH ROM once at start-up, store the ROM ids, and address each device with MATCH ROM.", ev: "std" },
];

/* ------------------------------------------------------------------ *
 * 6. The 1-Wire File Structure (OWFS)
 *    ev: "report" — Maxim application note 114 defines it; the byte layout
 *    below is transcribed from the AN and from owfs's own implementation, and
 *    rows that could not be re-verified this session are tagged accordingly.
 * ------------------------------------------------------------------ */

export const OWFS = {
  purpose: "A filesystem that lives inside a 1-Wire memory device, so a data-logger iButton can be read by anything that speaks 1-Wire without knowing the application's own format. Defined by Maxim application note 114.",
  structure: [
    { name: "Root directory", what: "Starts with the 1-byte marker 0xB8. Followed by a fixed-size header: the directory length, a control byte, and the number of entries.", ev: "report" },
    { name: "Directory entry", what: "Each entry is 33 bytes in the classic layout: an 8-byte name field, a 3-byte extension field, then access/extension/status/offset/length bytes. The name is ASCII, space-padded, not NUL-terminated.", ev: "report" },
    { name: "Subdirectories", what: "An entry whose status marks it as a directory points at another 0xB8-rooted block elsewhere in memory.", ev: "report" },
    { name: "File data", what: "Stored at the offset given in the entry, with the length byte(s) bounding it. Files are contiguous; there is no fragmentation handling, which is why a logger that appends forever eventually has to rewrite the whole directory.", ev: "report" },
    { name: "Termination", what: "The directory's entry count, not a sentinel. A truncated read therefore produces entries that look valid but point past the end of memory — always bound-check the offset against the device's real capacity.", ev: "report" },
  ],
  devices: [
    { part: "DS1992", bits: "1 Kbit", pages: 4, ev: "tool" },
    { part: "DS1993", bits: "4 Kbit", pages: 16, ev: "tool" },
    { part: "DS1995", bits: "16 Kbit", pages: 64, ev: "tool" },
    { part: "DS1996", bits: "64 Kbit", pages: 256, ev: "tool" },
    { part: "DS2431", bits: "1 Kbit", pages: "4 × 256-bit", ev: "tool" },
    { part: "DS2433", bits: "4 Kbit", pages: 16, ev: "tool" },
  ],
  gotchas: [
    "Page size differs between families: the DS1996 writes 32 bytes per page, the DS2431 writes 8 bytes per page in four independent pages, and the DS2433 writes 32. A logger built for one will not fit the other without a rewrite.",
    "The add-only families (DS1982/DS1985/DS1986, codes 0x09/0x0B/0x0F) cannot be erased at all — bits go 1→0 permanently. An OWFS on one of those is write-once by construction.",
    "Password-protected parts (DS1991, DS1977) gate access behind a field password. Reading them without it is not possible through the documented interface, and that is the design.",
  ],
};

/* ------------------------------------------------------------------ *
 * 7. Host-side access from a browser
 *    ev: "std" for what the platform actually offers.
 * ------------------------------------------------------------------ */

export const ONEWIRE_FROM_BROWSER = {
  impossible: [
    "There is no 1-Wire API in any browser. Bit-banging a GPIO is not something a web page can do, and the timing (1-6 µs slots) is far tighter than a JavaScript timer can guarantee even with a Web Serial bridge.",
  ],
  possible: [
    "Web Serial to a real 1-Wire master: a DS2482-100 or DS2482-800 on an I2C-USB adapter, an FTDI-based OWLink, or a microcontroller running a bridge firmware. The browser sends commands, the bridge does the timing.",
    "Web USB to a vendor adapter that exposes a bulk interface (the Maxim/Dallas USB iButton readers do).",
    "Reading an exported bus dump: this workbench parses ROM ids, scratchpad bytes and CRCs from a capture taken elsewhere, which is what you usually have anyway.",
  ],
  note: "The timing-critical part belongs in hardware. A browser that tried to generate 1 µs slots would produce a bus that works sometimes and fails when the tab is backgrounded — which is worse than not working at all.",
  ev: "std",
};

export { u32 };
