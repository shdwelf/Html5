/* CHIPWRIGHT · cw-probe.js — device discovery, identification and the dossier.
 *
 * This module starts from a refusal. The premise it was asked to implement was
 * an omniscient agent promiscuously sniffing the network and detecting devices.
 * A web page cannot do that, and the honest engineering response is to say so
 * precisely — what the platform blocks, why, and what remains — and then build
 * the thing that does work: identification of hardware the user physically
 * hands the page.
 *
 * So the unit of knowledge here is the DOSSIER. You open one for a device you
 * own, every probe adds evidence to it, and every later tool (substitution,
 * dump analysis, disassembly) operates on that dossier. Discovery feeds the
 * dossier; it does not replace it.
 */

import { hex, parseHexInt, decodeIdcode, decodeRdid, IDCODES, SPI_VENDOR_BY_ID, SPI_VENDORS, CONNECTORS } from "./cw-data.js";
import { decodeRom, FAMILY_CODES, crc8 } from "./cw-data-onewire.js";
import { idcodeToArchitecture } from "./cw-arch.js";

/* ------------------------------------------------------------------ *
 * 1. What a browser can actually do
 *    ev: "std" — every row is a platform capability or a platform block, and
 *    each says how to check it at runtime.
 * ------------------------------------------------------------------ */

export const BROWSER_CAPABILITIES = [
  {
    id: "raw-sockets", available: false, ev: "std",
    name: "Raw sockets / promiscuous capture",
    why: "No web API exposes a raw socket, a packet capture handle, or promiscuous mode on an interface. There is nothing to feature-detect because nothing was ever shipped.",
    consequence: "An ARP sweep, a subnet scan, a passive sniff and a device fingerprint from traffic are all impossible from a page. Any page claiming to do them is drawing a picture, not reading a network.",
  },
  {
    id: "local-ip", available: false, ev: "std",
    name: "Your own LAN address",
    why: "Chromium has hidden local IPs behind mDNS ICE candidates since M86 (enable-webrtc-hide-local-ips-with-mdns, default on) and Firefox does the same via media.peerconnection.ice.obfuscate_host_addresses. A WebRTC gather returns something like a7f3b2c1-4e5d-6f70-8192-a3b4c5d6e7f8.local instead of 192.168.1.40.",
    consequence: "The page cannot even learn which subnet it is on, so it cannot compute a scan range. This is deliberate and is the reason the DISCOVER view has no scan button.",
    check: () => typeof RTCPeerConnection !== "undefined",
  },
  {
    id: "port-timing", available: "degraded", ev: "std",
    name: "Port inference from load timing",
    why: "Fetching http://host:port/ and measuring the failure mode can distinguish refused from filtered from open on some browsers. It is not a scan: it needs a candidate host, it is defeated by mDNS obfuscation, it races the browser's own connection pool, and the timings are noisy enough that a negative result means nothing.",
    consequence: "Included here as a documented dead end rather than a feature. Building a 'network scanner' on it produces a tool that reports whatever the user hoped to find.",
  },
  {
    id: "web-serial", available: typeof navigator !== "undefined" && "serial" in navigator, ev: "std",
    name: "Web Serial",
    why: "navigator.serial.requestPort() with a user gesture and a chooser. Full duplex byte stream at any baud rate the adapter supports.",
    consequence: "This is the real entry point. It drives a JTAG adapter, an SPI programmer, an FTDI cable on a UART, or a 1-Wire bridge — everything in this workbench that touches hardware goes through a bridge like this.",
    targets: ["JTAG/SWD adapter", "SPI flash programmer", "UART console", "1-Wire bridge (DS2482)", "POST-card reader on a serial header"],
  },
  {
    id: "web-usb", available: typeof navigator !== "undefined" && "usb" in navigator, ev: "std",
    name: "WebUSB",
    why: "navigator.usb.requestDevice({filters:[…]}) with a user gesture. Bulk, interrupt and control transfers; the page implements the protocol.",
    consequence: "Covers vendor adapters that are not CDC-ACM: Maxim/Dallas iButton readers, OpenOCD-compatible probes, programmer dongles with a proprietary protocol.",
  },
  {
    id: "web-bluetooth", available: typeof navigator !== "undefined" && "bluetooth" in navigator, ev: "std",
    name: "Web Bluetooth",
    why: "GATT only. Classic Bluetooth profiles (SPP, HID) are not exposed, so a serial-over-Bluetooth module is generally not reachable.",
    consequence: "Useful for a device that is genuinely a GATT peripheral — many BLE sensor nodes and some debug probes — and useless for everything else.",
  },
  {
    id: "web-hid", available: typeof navigator !== "undefined" && "hid" in navigator, ev: "std",
    name: "WebHID",
    why: "navigator.hid.requestDevice(). Chromium-only; not in Firefox or Safari.",
    consequence: "Some JTAG probes and programmer dongles present as HID rather than CDC.",
  },
  {
    id: "web-nfc", available: typeof navigator !== "undefined" && "nfc" in navigator, ev: "std",
    name: "Web NFC",
    why: "navigator.nfc — Android Chrome only. NDEF read/write and, on some devices, ISO-DEP.",
    consequence: "Enough to read a Type 4 tag or a Java Card speaking ISO 14443-A over ISO-DEP. Not enough to run a full GlobalPlatform secure channel in every case, and the APDU framing has to be built by the page.",
  },
  {
    id: "file-access", available: typeof FileReader !== "undefined", ev: "std",
    name: "Reading a dump the user has already taken",
    why: "File input or drag-and-drop. No hardware needed.",
    consequence: "This is what most of the workbench runs on in practice: the dump was taken with a programmer on a bench somewhere else, and the analysis happens here.",
  },
];

export function detectCapabilities() {
  const rows = BROWSER_CAPABILITIES.map((c) => {
    let available = c.available;
    if (typeof c.check === "function") { try { available = c.check() && available !== false; } catch { available = false; } }
    return { id: c.id, name: c.name, available: !!available || available === "degraded" ? available : false, ev: c.ev, why: c.why, consequence: c.consequence, targets: c.targets ?? null };
  });
  const usable = rows.filter((r) => r.available === true);
  return {
    rows,
    usable,
    secureContext: typeof isSecureContext !== "undefined" ? isSecureContext : null,
    verdict: usable.length
      ? `This browser exposes ${usable.map((u) => u.name).join(", ")}. Each requires a user gesture and a device chooser, and none of them can enumerate a network — they can only talk to hardware the user physically selects.`
      : "This browser exposes none of the hardware APIs. The workbench still runs: every analysis tool here operates on bytes the user supplies, which is the normal case anyway.",
    note: typeof isSecureContext !== "undefined" && !isSecureContext
      ? "Not a secure context. Web Serial, WebUSB, WebHID and Web NFC all require HTTPS or localhost, so none of them will appear even in a browser that supports them."
      : null,
  };
}

/* ------------------------------------------------------------------ *
 * 2. The dossier
 * ------------------------------------------------------------------ */

let dossierSeq = 0;

export function createDossier({ name, kind = "device", notes = "" } = {}) {
  dossierSeq++;
  return {
    id: `dossier-${Date.now().toString(36)}-${dossierSeq}`,
    created: new Date().toISOString(),
    name: name || `Untitled device ${dossierSeq}`,
    kind,
    notes,
    identity: [],   // things the device reported about itself
    markings: [],   // things read off the package (weaker evidence)
    evidence: [],   // dumps, captures, measurements
    decisions: [],  // substitutions considered and their verdicts
    provenance: { owned: null, authorised: null, source: null },
  };
}

/**
 * Append a finding. `tier` is the honesty knob: a value the device reported
 * about itself outranks a marking on its package, which outranks an inference.
 */
export function addFinding(dossier, { tier, what, value, ev = "report", source = null }) {
  const TIERS = { reported: 0, marking: 1, inferred: 2 };
  if (!(tier in TIERS)) return { ok: false, note: `tier must be one of ${Object.keys(TIERS).join(", ")}` };
  const rec = {
    at: new Date().toISOString(),
    tier, tierRank: TIERS[tier], what, value, ev, source,
    tierNote: tier === "reported"
      ? "Read from the device itself. Strongest evidence available."
      : tier === "marking"
        ? "Read off the package. Markings are remarked, re-lasered and counterfeited; a marking is a hypothesis to confirm, not an identification."
        : "Inferred from other evidence. Weakest — never let an inference drive a destructive action on its own.",
  };
  (tier === "marking" ? dossier.markings : tier === "reported" ? dossier.identity : dossier.evidence).push(rec);
  return { ok: true, record: rec, dossier };
}

/**
 * What the dossier currently believes, ranked. Where a marking contradicts a
 * reported value, the contradiction is surfaced rather than resolved silently —
 * a remarked part is exactly that contradiction.
 */
export function dossierSummary(dossier) {
  const reported = dossier.identity;
  const marked = dossier.markings;
  const contradictions = [];
  for (const m of marked) {
    for (const r of reported) {
      if (m.what === r.what && String(m.value).toUpperCase() !== String(r.value).toUpperCase()) {
        contradictions.push({ what: m.what, marking: m.value, reported: r.value });
      }
    }
  }
  return {
    name: dossier.name,
    bestIdentity: reported.length ? reported[reported.length - 1] : null,
    reportedCount: reported.length,
    markingCount: marked.length,
    evidenceCount: dossier.evidence.length,
    decisions: dossier.decisions,
    contradictions,
    verdict: contradictions.length
      ? `CONTRADICTION: ${contradictions.map((c) => `${c.what} — the package says ${c.marking} but the device reports ${c.reported}`).join("; ")}. This is the signature of a remarked, re-labelled or counterfeit part, and it is the reason a workbench identifies from what a device reports rather than from what is printed on it. Do not order a replacement based on the marking.`
      : reported.length
        ? `Identified from ${reported.length} value(s) the device reported about itself. No contradiction with the package markings.`
        : marked.length
          ? `Only package markings on file (${marked.length}). That is a hypothesis, not an identification — get the device to report something about itself before acting on it.`
          : "Empty dossier. Nothing has been observed yet.",
  };
}

/* ------------------------------------------------------------------ *
 * 3. Identify anything — the multi-format parser
 *
 *    Paste whatever you have. The parser tries every identification format
 *    the workbench knows and reports every plausible reading, ranked. It never
 *    returns a single confident answer for an ambiguous input, because the
 *    ambiguity is the information.
 * ------------------------------------------------------------------ */

const HEX_BYTES_RE = /\b(?:[0-9a-fA-F]{2}[\s:_-]){1,15}[0-9a-fA-F]{2}\b/;
const HEX_INT_RE = /\b(?:0x)?[0-9a-fA-F]{6,10}\b/;
const PART_RE = /\b([A-Z]{1,5}[\d]{1,4}[A-Z]{0,4}[\d]{0,4}[A-Z0-9\/\-]{0,6})\b/;

export function identifyAnything(input) {
  const text = String(input ?? "").trim();
  const candidates = [];
  const add = (kind, confidence, value, detail, ev = "tool", caveat = null) => candidates.push({ kind, confidence, value, detail, ev, caveat });
  if (!text) return { ok: false, candidates: [], note: "Nothing to identify." };

  // --- 1. A run of hex bytes: 1-Wire ROM, SPI RDID, MAC, or a signature.
  const bm = text.match(HEX_BYTES_RE);
  if (bm) {
    const bytes = bm[0].split(/[\s:_-]+/).filter(Boolean).map((b) => parseInt(b, 16));
    if (bytes.length === 8) {
      const rom = decodeRom(bytes);
      add("1-Wire ROM id", rom.crcOk ? "high" : "low", rom.hex,
        `Family 0x${rom.family.toString(16).toUpperCase().padStart(2, "0")} = ${rom.familyName}. Serial ${rom.serial}. CRC ${rom.crcOk ? "valid" : `INVALID (computed 0x${rom.crcCalc.toString(16).toUpperCase().padStart(2, "0")})`}.`,
        rom.familyEv === "none" ? "report" : "tool",
        rom.crcOk ? (rom.what || null) : "A bad CRC on a ROM read is a bus problem, not a device problem — check the pull-up resistor and the cable length before condemning the device.");
    }
    if (bytes.length === 3) {
      const r = decodeRdid(bytes[0], bytes[1], bytes[2]);
      if (r) add("SPI NOR RDID", r.known ? "high" : "medium", bytes.map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" "),
        r.note ?? `${r.vendor ?? "unknown vendor"} — ${r.capacityLabel ?? "?"}`, "tool",
        r.known ? null : "Vendor byte not in the table. The capacity rule (2^byte2 bits) still holds for most manufacturers, but a non-power-of-two part breaks it — read the datasheet.");
    }
    if (bytes.length === 6) {
      add("MAC address (EUI-48)", "medium", bytes.map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(":"),
        `${(bytes[0] & 0x02) ? "locally administered" : "universally administered (OUI-assigned)"}, ${(bytes[0] & 0x01) ? "multicast" : "unicast"}. OUI ${bytes.slice(0, 3).map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(":")}.`,
        "std",
        "Six bytes is also a plausible fragment of a firmware blob. If this came out of a dump rather than off a label, treat the MAC reading as a guess.");
    }
    if (bytes.length === 4) {
      const v = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
      const le = ((bytes[3] << 24) | (bytes[2] << 16) | (bytes[1] << 8) | bytes[0]) >>> 0;
      for (const [label, val] of [["big-endian", v], ["little-endian", le]]) {
        const d = decodeIdcode(val);
        if (d.structurallyValid) add(`JTAG IDCODE (${label})`, "high", hex(val), `${idcodeToArchitecture(val).verdict}`, "std");
      }
      add("32-bit word", "low", hex(v), `Also readable as ${hex(le)} in the other endianness. Four bytes alone cannot be attributed to a format.`, "std",
        "This is why a dump's byte order has to be established before any four-byte value in it is interpreted.");
    }
  }

  // --- 2. A single hex integer: IDCODE, or a magic number.
  if (!bm) {
    const im = text.match(HEX_INT_RE);
    if (im) {
      const v = parseHexInt(im[0]);
      if (v !== null) {
        const d = decodeIdcode(v);
        const known = IDCODES.find((k) => k.id === d.raw);
        if (d.structurallyValid || known) {
          add("JTAG IDCODE", known ? "high" : d.structurallyValid ? "medium" : "low", hex(v),
            known ? `${known.family}. ${known.note}` : idcodeToArchitecture(v).verdict,
            known ? known.ev : "std");
        } else {
          add("32-bit constant", "low", hex(v),
            `Not a structurally valid IDCODE (LSB must be 1 and the JEP106 identity byte must have odd parity — here LSB=${d.lsbIsOne ? 1 : 0}, parity ${d.parityIsOdd ? "odd" : "EVEN"}).`,
            "std", "Could be a magic number, an address, a CRC or plain data. A single constant with no context is not identifiable.");
        }
        if (v === 0x27051956) add("U-Boot image magic", "high", hex(v), "IH_MAGIC from U-Boot's include/image.h — a legacy uImage header starts here.", "tool");
        if (v === 0xcafebabe) add("Java class / Mach-O fat binary magic", "high", hex(v), "0xCAFEBABE is BOTH the Java class-file magic and the Mach-O universal-binary magic. The collision is real and `file` guesses wrong sometimes; disambiguate by the four bytes that follow (a class file has a plausible major_version at +6, a fat binary has a small nfat_arch count).", "std");
        if (v === 0xdecaffed) add("Java Card CAP magic", "high", hex(v), "The CAP file Header component. Confirms a Java Card converted-applet package rather than a desktop class file.", "std");
      }
    }
  }

  // --- 3. A part marking.
  const pms = text.match(new RegExp(PART_RE.source, "g")) || [];
  for (const p of pms.slice(0, 6)) {
    const upper = p.toUpperCase();
    // SPI NOR part numbers are the ones this workbench can actually resolve.
    const spiHit = resolveSpiPartMarking(upper);
    if (spiHit) add("SPI NOR part marking", spiHit.confidence, upper, spiHit.detail, spiHit.ev, spiHit.caveat);
    else if (/^(STM32|GD32|AT32|CS32|APM32|CH32)/i.test(upper)) add("MCU part marking", "medium", upper,
      `${upper.split(/[A-Z0-9]{4,}/i)[0].toUpperCase()} family. The marking gives the vendor and roughly the density; the flash and RAM sizes have to be read from the device's own ID register, not from the marking.`, "report",
      "This family is heavily cloned. An STM32F103C8T6 and a CS32F103C8T6 are pin- and largely code-compatible but present DIFFERENT JTAG IDCODEs (0x1BA01477 vs 0x2BA01477) and have different errata. Identify from the IDCODE and the device ID register.");
    else if (/^(W25|GD25|MX25|EN25|XT25|P25Q|ZB25|M25P|N25Q|S25FL|AT25|IS25)/i.test(upper)) add("SPI NOR part marking", "medium", upper,
      "A recognisable SPI NOR prefix, but this exact part number is not in the workbench's table. Read RDID (0x9F) — the three bytes it returns are authoritative where a marking is not.", "report");
    else if (/^DS(18|19|24|25|28)/i.test(upper)) {
      const fam = FAMILY_CODES.find((f) => upper.startsWith("DS" + f.name.replace(/^DS/, "").replace(/[^0-9].*$/, "")));
      add("1-Wire part marking", "medium", upper,
        fam ? `Dallas/Maxim 1-Wire family. ${fam.name} = family code 0x${fam.code.toString(16).toUpperCase().padStart(2, "0")}: ${fam.what}` : "Dallas/Maxim 1-Wire part. Read the ROM id (READ ROM 0x33) — the first byte is the family code and the eighth is its CRC-8.",
        fam ? fam.ev : "report");
    } else if (/^(74|SN74|CD74|MC74)/.test(upper)) add("74-series logic marking", "medium", upper,
      "The digits after the family letters define the function and pinout; the letters between 74 and the number are the manufacturer's process family and change the electrical envelope, not the truth table. That is the whole basis of a 74-series substitution.", "std");
    else if (upper.length >= 5) add("unrecognised marking", "low", upper,
      "No rule in this workbench recognises this string as a part number. It may be a date code, a lot code, a factory marking or a re-labelled part.", "none",
      "A marking is the weakest form of identification. Get the device to report something about itself.");
  }

  // --- 4. Free text that names a family.
  const lower = text.toLowerCase();
  for (const kw of [["jtag", "JTAG interface"], ["swd", "Serial Wire Debug"], ["uart", "UART console"], ["spi", "SPI bus"], ["1-wire", "1-Wire bus"], ["onewire", "1-Wire bus"], ["ibutton", "iButton"], ["javacard", "Java Card"], ["cap file", "Java Card CAP"], ["smart", "S.M.A.R.T."], ["nvme", "NVMe"], ["uefi", "UEFI firmware"], ["post", "POST codes"]]) {
    if (lower.includes(kw[0])) add("topic keyword", "low", kw[0], `The text mentions ${kw[1]}. That selects a tool, it does not identify a device.`, "none");
  }

  const rank = { high: 0, medium: 1, low: 2 };
  candidates.sort((a, b) => (rank[a.confidence] ?? 9) - (rank[b.confidence] ?? 9));
  const high = candidates.filter((c) => c.confidence === "high");
  return {
    ok: true, input: text, candidates,
    verdict: candidates.length === 0
      ? "Nothing in this input matches any identification format the workbench knows. That is a normal result for a date code, a lot number or free text."
      : high.length === 1
        ? `One high-confidence reading: ${high[0].kind} = ${high[0].value}. ${high[0].detail}`
        : high.length > 1
          ? `${high.length} high-confidence readings, and they are not mutually exclusive — the same bytes can be a valid 1-Wire ROM id AND a plausible four-byte word. Use the context (where the bytes came from) to choose, not the parser.`
          : `Best reading is ${candidates[0].confidence}-confidence: ${candidates[0].kind} = ${candidates[0].value}. Confirm it against the device before acting on it.`,
    ambiguous: candidates.filter((c) => c.confidence === "high").length > 1 || candidates.length > 3,
  };
}

function resolveSpiPartMarking(upper) {
  // Capacity is encoded in the trailing digits for most vendors: W25Q32 → 32 Mbit.
  const m = upper.match(/^(W25[QXPS]|GD25[QXL]|MX25[LUV]|EN25[QTSX]|XT25[FQ]|P25Q|ZB25[VQ]|M25P|N25Q|S25FL|AT25|IS25[LPS])(\d{2,3})([A-Z0-9]*)/);
  if (!m) return null;
  const mbit = parseInt(m[2], 10);
  const cap = mbit >= 16 && mbit <= 512 && (mbit & (mbit - 1)) === 0 ? (mbit << 17) : null; // Mbit → bytes
  const vendorPrefix = { W25: "Winbond", GD25: "GigaDevice", MX25: "Macronix", EN25: "EON", XT25: "XTX", P25Q: "Puya", ZB25: "Zbit", M25P: "Micron/ST (legacy)", N25Q: "Micron", S25FL: "Spansion/Infineon/Cypress", AT25: "Atmel/Microchip", IS25: "ISSI" };
  const vk = Object.keys(vendorPrefix).find((k) => m[1].startsWith(k));
  return {
    confidence: cap ? "medium" : "low",
    detail: cap
      ? `Prefix ${m[1]} → ${vendorPrefix[vk] ?? "unknown vendor"}; capacity digits ${m[2]} → ${mbit} Mbit = ${cap >>> 20} MiB. The capacity-in-the-part-number convention is vendor-specific and breaks on non-power-of-two parts, so confirm with RDID (0x9F): byte 2 gives 2^n bits directly.`
      : `Prefix ${m[1]} → ${vendorPrefix[vk] ?? "unknown vendor"}, but the capacity digits ${m[2]} are not a power of two in Mbit. Either the convention does not apply to this vendor or the part is a non-power-of-two capacity — which is exactly the case where the marking misleads and RDID must be read.`,
    ev: "tool",
    caveat: "This is a marking, and markings are remarked. RDID is authoritative; a part number is a hypothesis.",
  };
}

/* ------------------------------------------------------------------ *
 * 4. Finding a header on a board with no schematic
 *    ev: "report" — this is bench technique, and every row says what to
 *    measure and what the reading means.
 * ------------------------------------------------------------------ */

export const PINOUT_DISCOVERY = {
  premise: "Most boards have an unlabelled or partly labelled header. With a multimeter, a scope and patience you can identify nearly every pin without a schematic. The procedure below is ordered so that no step can damage the board.",
  steps: [
    { order: 1, action: "Photograph the header and count the pins. Note the pitch (2.54 mm, 2.00 mm, 1.27 mm) and whether it is a through-hole or a test-point row.", tool: "eyes, calipers", expect: "a pin count and a pitch", why: "Pitch and count narrow the candidate pinouts enormously. The workbench's CONNECTORS table lists the standard JTAG and UART headers with their pinouts, and most unlabelled headers are one of them or a vendor variant." },
    { order: 2, action: "With the board powered, measure every pin to a known ground. Record each voltage.", tool: "multimeter, DC", expect: "0 V on ground pins; 3.3 V or 1.8 V on power and on an idle UART TX; 0 V or the rail voltage elsewhere", why: "This single pass separates ground from power from signal, and it is completely safe." },
    { order: 3, action: "Identify ground: every pin at 0 V that also shows continuity to the board's ground plane or a mounting hole.", tool: "multimeter, continuity, POWER OFF", expect: "at least one, usually several", why: "Ground is the reference for everything else. On the standard ARM 20-pin and 10-pin headers every other pin is ground, so finding it is easy — and if the header is not one of those, ground still tells you the pin numbering's parity." },
    { order: 4, action: "Look for the pin that sits at the logic rail steadily with no traffic: that is an idle UART TX (idle is mark = high).", tool: "multimeter or scope", expect: "3.3 V or 1.8 V, steady", why: "A UART idles high. A JTAG TCK idles low or floats. A reset line sits high and drops briefly at power-on. That difference identifies the bus type before you connect anything." },
    { order: 5, action: "Watch the candidate TX at power-on with a scope or a logic analyser. A burst of activity in the first few hundred milliseconds is the bootloader banner.", tool: "scope / logic analyser", expect: "a short burst, then idle", why: "Almost every embedded bootloader prints something. Seeing the burst is proof the pin is TX; not seeing it does not prove it is not." },
    { order: 6, action: "Measure the narrowest pulse in that burst. That is one bit time, and 1/bit-time is the baud rate.", tool: "scope with cursor measurement", expect: "one of the standard rates below", why: "Autobaud by measurement rather than by guessing. Trying baud rates blindly is slow and, on some bootloaders, a wrong byte at the wrong time can enter a mode you did not want." },
    { order: 7, action: "Only now connect the adapter. TX→RX, RX→TX, GND→GND. Do NOT connect the adapter's VCC to the board's power pin.", tool: "USB-serial adapter", expect: "readable text at a terminal", why: "Two supplies fighting over one rail is how boards die. The board powers itself; the adapter only carries signal and ground." },
    { order: 8, action: "For JTAG: having found ground and the rail, look for four adjacent signal pins. Clock them slowly and watch for a pin that toggles in response to another — that pair is TCK/TDO.", tool: "logic analyser or a JTAG probe in scan mode", expect: "an IDCODE after a 5-clock TMS-high reset", why: "The five-TCK TMS-high reset reaches Test-Logic-Reset from any state, so the first thing to try is always the reset, then IDCODE. The workbench's TAP simulator models exactly this." },
  ],
  never: [
    "Never inject power into a header pin to 'see what happens'. If the board has its own supply, a second one on the same rail is a short circuit through two regulators.",
    "Never assume pin 1. Look for the silk dot, the square pad among round ones, or the bevel on the shroud. Absent all three, ground continuity is what orients you.",
    "Never connect an adapter's VCC to a board that is already powered. Signal and ground only.",
    "Never probe a header while the board is in a metal enclosure with a switching supply running — measure first, then decide whether it is safe to scope.",
  ],
  ev: "report",
};

export const BAUD_RATES = [
  { baud: 1200, bitTimeUs: 833.33, use: "Old modems, some metering", ev: "std" },
  { baud: 2400, bitTimeUs: 416.67, use: "Legacy embedded, GPS at low power", ev: "std" },
  { baud: 4800, bitTimeUs: 208.33, use: "Legacy embedded", ev: "std" },
  { baud: 9600, bitTimeUs: 104.17, use: "The default for most microcontroller bootloaders and nearly all GPS receivers", ev: "std" },
  { baud: 19200, bitTimeUs: 52.08, use: "Common on ESP8266 ROM bootloader output before it switches", ev: "std" },
  { baud: 38400, bitTimeUs: 26.04, use: "Common default", ev: "std" },
  { baud: 57600, bitTimeUs: 17.36, use: "Less common", ev: "std" },
  { baud: 115200, bitTimeUs: 8.68, use: "The modern default: Linux consoles, U-Boot, most vendor bootloaders, ESP32 second-stage", ev: "std" },
  { baud: 230400, bitTimeUs: 4.34, use: "Fast consoles", ev: "std" },
  { baud: 460800, bitTimeUs: 2.17, use: "ESP32 ROM bootloader download mode default", ev: "tool" },
  { baud: 921600, bitTimeUs: 1.09, use: "Fast firmware download; needs a good adapter and short leads", ev: "std" },
  { baud: 74880, bitTimeUs: 13.35, use: "ESP8266 ROM bootloader output — a non-standard rate that exists because the ROM's crystal assumption is wrong for a 26 MHz part. If you see garbage only at power-on on an ESP8266, this is why.", ev: "tool" },
  { baud: 1500000, bitTimeUs: 0.67, use: "ESP32 ROM download mode, fast setting", ev: "tool" },
];

/**
 * Baud rate from a measured bit width, and the reverse.
 * A UART frame is start + data + optional parity + stop, so the whole-character
 * time is what you see on a scope when a full byte goes by.
 */
export function baudFromBitTime(us) {
  if (!(us > 0)) return { ok: false, note: "Bit time must be positive." };
  const baud = 1e6 / us;
  const rows = BAUD_RATES.map((r) => ({ ...r, errorPct: ((baud - r.baud) / r.baud) * 100 }));
  const best = rows.slice().sort((a, b) => Math.abs(a.errorPct) - Math.abs(b.errorPct))[0];
  return {
    ok: true, measuredUs: us, computedBaud: baud,
    best: { baud: best.baud, errorPct: best.errorPct, use: best.use },
    tolerance: Math.abs(best.errorPct) <= 3 ? "within tolerance" : Math.abs(best.errorPct) <= 8 ? "marginal" : "no match",
    verdict: Math.abs(best.errorPct) <= 3
      ? `A ${us.toFixed(2)} µs bit time is ${best.baud} baud (error ${best.errorPct.toFixed(2)}%). Standard UART receivers tolerate about ±2-3% accumulated across a frame, so this will work.`
      : Math.abs(best.errorPct) <= 8
        ? `Closest standard rate is ${best.baud} (error ${best.errorPct.toFixed(1)}%). That is outside the usual ±2-3% tolerance — either the measurement includes framing rather than a single bit, or the device genuinely uses a non-standard rate. Re-measure on the narrowest pulse you can find.`
        : `${us.toFixed(2)} µs does not correspond to any standard baud rate (nearest is ${best.baud}, off by ${best.errorPct.toFixed(0)}%). It is probably not a UART bit — it may be a JTAG TCK period, an SPI clock, or an I2C SCL.`,
    candidates: rows.slice().sort((a, b) => Math.abs(a.errorPct) - Math.abs(b.errorPct)).slice(0, 4).map((r) => ({ baud: r.baud, errorPct: Number(r.errorPct.toFixed(2)), use: r.use })),
    ev: "std",
  };
}

export function frameTime({ baud, dataBits = 8, parity = "none", stopBits = 1 }) {
  const bits = 1 /* start */ + dataBits + (parity === "none" ? 0 : 1) + stopBits;
  return { bitsPerFrame: bits, frameUs: (bits * 1e6) / baud, bytesPerSecond: 1e6 / ((bits * 1e6) / baud), baud };
}

/**
 * The wrong-baud-rate signature. Reading a console at the wrong rate produces
 * garbage, and the garbage is not random — it is diagnostic.
 */
export const UART_GARBAGE_SIGNATURES = [
  { seen: "Nothing at all", meaning: "Wrong pins, no common ground, or the device is not transmitting. Check ground continuity first — a missing ground is the most common cause and the least suspected.", ev: "report" },
  { seen: "Solid blocks of ÿ (0xFF) or NUL (0x00)", meaning: "Baud rate badly wrong, or the line is being held at a level rather than driven. 0xFF specifically means the receiver sees a permanent mark, which is what an idle or disconnected RX looks like.", ev: "report" },
  { seen: "Readable text at power-on, then garbage", meaning: "Two-stage bootloader at two baud rates. The ESP8266 does exactly this: ROM output at 74880 (a 26 MHz crystal assumption that is wrong), then the application at 115200.", ev: "tool" },
  { seen: "Framing errors on every byte", meaning: "Stop-bit or parity mismatch, or a baud error large enough that the receiver samples outside the bit. Try 8N1 explicitly and re-measure the bit width.", ev: "std" },
  { seen: "Text with occasional wrong characters, worse on long lines", meaning: "Signal integrity: no common ground reference, long leads, or a 3.3 V line into a 5 V receiver (which reads fine) versus a 5 V line into a 3.3 V receiver (which may damage it). Check the levels before assuming a baud problem.", ev: "report" },
  { seen: "Inverted-looking text (lots of high-bit-set characters)", meaning: "The line is inverted — RS-232 levels rather than TTL, or a transistor-inverted debug header. Some boards deliberately invert the debug UART. Try a level-inverting adapter or invert in software.", ev: "report" },
];

/* ------------------------------------------------------------------ *
 * 5. Connector reference, resolved
 * ------------------------------------------------------------------ */

export function connectorById(id) { return CONNECTORS.find((c) => c.id === id) ?? null; }
export function connectorIndex() { return CONNECTORS.map((c) => ({ id: c.id, name: c.name, pins: c.pins.length, pitch: c.pitch, ev: c.ev })); }

/**
 * Given a set of measured pin voltages, suggest what each pin is.
 * This is a hypothesis generator, and it is labelled as one.
 */
export function suggestPinout({ pinCount, voltages, pitch = null, idleHighPins = [], togglingPins = [] }) {
  if (!Array.isArray(voltages) || voltages.length !== pinCount) return { ok: false, note: `voltages must have exactly ${pinCount} entries` };
  const rail = Math.max(...voltages.filter((v) => v > 0.5));
  const pins = voltages.map((v, i) => {
    const n = i + 1;
    let guess = "signal (unknown)", confidence = "low", why = "";
    if (v < 0.15) { guess = "GND or signal at logic 0"; confidence = "medium"; why = "Below 0.15 V. Ground and a low signal are indistinguishable by voltage alone — continuity to the ground plane (power off) settles it."; }
    else if (Math.abs(v - rail) < 0.15) { guess = togglingPins.includes(n) ? "clock or data (active)" : idleHighPins.includes(n) ? "idle-high signal — UART TX candidate" : `rail voltage (${rail.toFixed(2)} V): VCC or a signal at logic 1`; confidence = idleHighPins.includes(n) ? "medium" : "low"; why = `At the measured rail of ${rail.toFixed(2)} V.`; }
    else if (v > rail * 0.3 && v < rail * 0.7) { guess = "floating / mid-level"; confidence = "medium"; why = `Between the logic thresholds (${(rail * 0.3).toFixed(2)}-${(rail * 0.7).toFixed(2)} V). A driven pin is never here; this is an unconnected input picking up noise, or a pin with a weak pull fighting something.`; }
    else if (v > rail + 0.4) { guess = "a different, higher rail"; confidence = "medium"; why = `Above the ${rail.toFixed(2)} V rail — probably 5 V or an unregulated input.`; }
    if (togglingPins.includes(n)) { guess = "active signal (observed toggling)"; confidence = "high"; why = "Observed to change state, so it is driven."; }
    return { pin: n, voltage: v, guess, confidence, why };
  });
  const std = CONNECTORS.find((c) => c.pins.length === pinCount && (!pitch || c.pitch === pitch));
  return {
    ok: true, pinCount, rail, pins,
    standardMatch: std ? { id: std.id, name: std.name, pitch: std.pitch, ev: std.ev, note: std.note } : null,
    verdict: std
      ? `Pin count ${pinCount}${pitch ? ` at ${pitch}` : ""} matches the ${std.name} pinout in the connector table. Compare the measured voltages against its documented assignment — VTref on pin 1, every other pin ground on the ARM 20-pin. A match on count and pitch is suggestive, not conclusive: vendor headers reuse the same shell for different signals.`
      : `No standard ${pinCount}-pin connector in the table${pitch ? ` at ${pitch}` : ""}. This is a vendor-specific header. The voltage guesses above are hypotheses; confirm each with continuity and with a scope before connecting anything.`,
    ev: "report",
  };
}

export { hex, decodeIdcode, decodeRdid, SPI_VENDORS, SPI_VENDOR_BY_ID, CONNECTORS, crc8 };
