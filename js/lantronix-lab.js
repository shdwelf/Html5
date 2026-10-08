/**
 * lantronix-lab.js — controller for lantronix-lab.html.
 *
 * Six panels, all client-side:
 *   device   the Lantronix serial-to-Ethernet families and the silicon behind them
 *   ghidra   firmware triage: magic → container → architecture → Ghidra language
 *   uclinux  what Lantronix's Linux SDK actually ships, and what could replace it
 *   java     JVM vs Java Card VM, the jar-wiki, ACME's tiny web servers, and a
 *            real .class/.cap reader (js/jvmdis.js)
 *   eda      the generated xPort Wallplug EAGLE design, rendered to SVG from
 *            tools/wallplug-model.mjs, with the DRC re-run in the browser
 *   sources  every URL and repository path the claims come from
 *
 * Nothing is uploaded: dropped files are read with FileReader and parsed here.
 */

import {
  BOARD, PACKAGES, SYMBOLS, DEVICESETS, PARTS, NETS, PLACEMENT, UNCONNECTED,
  SCHEM_PLACEMENT, SCHEM_NOTES, BOARD_NOTES, SHEET, BARRIER,
  rotPt, padAbs, courtAbs, symbolBBox, stubDir, pinAbsolute, STUB,
} from '../tools/wallplug-model.mjs';
import { checkGeometry, checkSchematicLayout, collectPads } from '../tools/wallplug-drc.mjs';
import { triage, parseClass, parseCap, sniff, describe } from './jvmdis.js';

const $ = (id) => document.getElementById(id);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ============================================================ 1. devices */

export const DEVICES = [
  {
    id: 'xpp-lnx', name: 'xPort Pro (Linux)', part: 'XPP1003000-04R / XPP100300S-04R',
    cpu: 'DSTni-FX — Freescale 32-bit ColdFire', cpuDetail: '166 MHz internal bus / 83 MHz external (Mouser); CNX Software identifies the part as MCF5208-class. Lantronix only ever says "32-bit Freescale ColdFire".',
    os: 'Linux (µClinux)', osKind: 'linux', kernel: '2.6.30, CONFIG_MMU=n', flash: '16 MB parallel flash', ram: '8 or 16 MB SDRAM',
    serial: '1 × 3.3 V CMOS, 300–921600 bps (460800 unsupported), 3 CP pins',
    ghidra: '68000:BE:32:Coldfire',
    boot: 'read-only Lantronix first stage → dBUG (second stage)',
    artifacts: 'linux.bin · image.bin (kernel+ROMFS) · imagez.bin (gzip) · romfs.img · rootfs.img (JFFS2) · dbug-R<ver>.romz',
    flashmap: 'dBUG image header 128 B; kernel partition 0x180000; /dev/mtd4 3.5 MB; /dev/mtd5 4 MB JFFS2 (erase: fl e 0x00400000 0x00C00000)',
    tags: ['coldfire', 'linux', '16 mb', 'module'],
    note: 'This is the "16 MB RS-232 → RJ45" device the wallplug in the EDA tab is built around. Linux option = the µClinux SDK; Evolution option = the same silicon with Lantronix\'s own OS.',
  },
  {
    id: 'xpp-lx6', name: 'xPort Pro Lx6', part: 'XPP1004000-02R / XPP100400S-02R',
    cpu: 'DSTni-FX — Freescale 32-bit ColdFire', cpuDetail: 'Same family as the xPort Pro; Lx6 adds dual-stack IPv6.',
    os: 'Linux (µClinux)', osKind: 'linux', kernel: '2.6.x / 3.x per SDK release', flash: '16 MB', ram: '16 MB SDRAM',
    serial: '1 × 3.3 V CMOS, 300–921600 bps', ghidra: '68000:BE:32:Coldfire',
    boot: 'Lantronix first stage → dBUG',
    artifacts: 'Linux SDK images (as xPort Pro) · IPv6-ready firmware',
    flashmap: 'as xPort Pro',
    tags: ['coldfire', 'linux', '16 mb', 'ipv6'],
    note: 'PCN-485 (2017) literally lists this part number as "XPort Pro (uClinux)" — the vendor\'s own name for the Linux line.',
  },
  {
    id: 'xpp-evo', name: 'xPort Pro (Evolution OS)', part: 'XPP1002000-02R / XPP100200S-02R',
    cpu: 'DSTni-FX — Freescale 32-bit ColdFire', cpuDetail: 'Same silicon as the Linux variant; different firmware image.',
    os: 'Evolution OS', osKind: 'evolution', kernel: 'not Linux — Lantronix RTOS-style OS, 5.4.0.2R2', flash: '16 MB', ram: '8 or 16 MB SDRAM',
    serial: '1 × 3.3 V CMOS', ghidra: '68000:BE:32:Coldfire',
    boot: 'Lantronix first stage (read-only); recovery loader RecovLoader_*.rom over serial',
    artifacts: 'xport_pro_*.rom / .romz firmware · web content (≤1 MB) · XML configuration records',
    flashmap: 'dual-bank flash ("bootbank"/"safebank"), wear levelling and erase-cycle counters',
    tags: ['coldfire', 'evolution', '16 mb', 'module'],
    note: 'Do not flash Linux firmware onto an Evolution part number or vice versa: the SDK and PCN both warn that mixing images bricks the unit.',
  },
  {
    id: 'mpar', name: 'MatchPort AR', part: 'MPB/MPDK1000-LNX-01',
    cpu: 'DSTni-FX — 32-bit, 166 MHz (159 MIPS Dhrystone 2.1)', cpuDetail: 'Vendor product brief; the Linux SDK covers it alongside the xPort Pro.',
    os: 'Linux (µClinux) or Evolution OS', osKind: 'linux', kernel: '2.6.26 with uClibc 0.9.29, based on uClinux-dist 20080808',
    flash: '4 MB (8 MB on the Linux dev kit)', ram: '8 MB SDRAM',
    serial: '2 × COM (CON1 = console), to 230400 bps; RS-232 and RS-485', ghidra: '68000:BE:32:Coldfire',
    boot: 'Lantronix first stage → dBUG; BDM debug connector on the -02 kit',
    artifacts: 'linux.bin · image.bin · romfs.img · dbug-*.romz',
    flashmap: 'kernel partition 0x1C0000; JFFS2 erase: fl e 0x00400000 0x00400000',
    tags: ['coldfire', 'linux', 'evolution', '2-port'],
    note: 'Seven CP/GPIO pins instead of three, and a second serial port — the "AR" is not an ARM: the brief names the same DSTni-FX ColdFire.',
  },
  {
    id: 'eds', name: 'EDS1100 / EDS2100 (Linux)', part: 'ED1100002-LNX-01 / ED2100002-LNX-01',
    cpu: 'ColdFire-class (same SDK family)', cpuDetail: 'The Linux SDK user guide lists EDS1100/EDS2100 with MatchPort AR and xPort Pro.',
    os: 'Linux (µClinux) or Evolution OS 7.1.0.0R1', osKind: 'linux', kernel: '2.6.30 (SDK 900-548)',
    flash: '8 MB', ram: '8 MB',
    serial: 'EDS1100: 1 × RS-232; EDS2100: 2 × RS-232, to 921600 bps', ghidra: '68000:BE:32:Coldfire',
    boot: 'Lantronix first stage → dBUG', artifacts: 'eds*.rom / .romz · edspsboot.romz (EDSxPS line)',
    flashmap: 'shared "MatchPort AR, EDS1100 and EDS2100" flash map in the SDK guide',
    tags: ['coldfire', 'linux', 'evolution', 'boxed'],
    note: 'The boxed sibling of the module: 100–240 VAC internal supply, DB9/DM25 serial, RJ45 — i.e. the product the wallplug reimplements from a bare module.',
  },
  {
    id: 'xport', name: 'xPort (classic)', part: 'XP100100-01',
    cpu: 'DSTni-EX "186" — x86-class 16-bit', cpuDetail: 'Data sheet 910-815: 256 KB zero-wait-state SRAM, 16 KB boot ROM, MAC with integrated 10/100 PHY.',
    os: 'Evolution OS', osKind: 'evolution', kernel: 'not Linux', flash: '512 KB', ram: '256 KB SRAM',
    serial: '1 × 3.3 V CMOS, 5 V-tolerant pins', ghidra: 'x86:LE:16:Real Mode',
    boot: '16 KB on-chip boot ROM; firmware by TFTP or serial',
    artifacts: 'xport_*.rom firmware · internal web pages (built-in web server)',
    flashmap: 'single 512 KB flash image, no filesystem',
    tags: ['dstni', 'x86', 'evolution', '16-bit'],
    note: 'The footprint-compatible ancestor of the xPort Pro — and a completely different Ghidra language. This is the trap: same RJ45, same 8-pin header, different ISA.',
  },
  {
    id: 'xpico', name: 'xPico', part: 'XPC100100B-01',
    cpu: 'DSTni-EX Enhanced 16-bit x86', cpuDetail: 'Lantronix product page states the architecture outright.',
    os: 'Evolution OS', osKind: 'evolution', kernel: 'not Linux', flash: '512 KB', ram: '256 KB SRAM',
    serial: '2 × serial, to 921 kbps', ghidra: 'x86:LE:16:Real Mode',
    boot: 'boot ROM; TFTP/serial upgrade', artifacts: 'xpico_*.rom · 384 KB of web-page storage',
    flashmap: 'chip-sized module (24 × 16.5 mm), no filesystem',
    tags: ['dstni', 'x86', 'evolution', 'chip'],
    note: 'The "chip-sized" DSTni part: still x86-class, still Evolution OS, still no MMU and no Linux.',
  },
  {
    id: 'xp485', name: 'xPort-485', part: 'XP100485-01',
    cpu: 'DSTni-EX "186"', cpuDetail: 'Data sheet 910-463: 256 KB SRAM, 512 KB flash, 16 KB boot ROM.',
    os: 'Evolution OS', osKind: 'evolution', kernel: 'not Linux', flash: '512 KB', ram: '256 KB SRAM',
    serial: 'RS-485 (the module integrates the transceiver side)', ghidra: 'x86:LE:16:Real Mode',
    boot: 'boot ROM; TFTP/serial', artifacts: 'xport485_*.rom', flashmap: 'single image',
    tags: ['dstni', 'x86', 'evolution', 'rs485'],
    note: 'Same hole pattern and pinout as the xPort — the wallplug\'s optional SP3485 front end follows the xPort Pro Integration Guide appendix A instead.',
  },
];

const DEVICE_FILTERS = [
  { id: 'all', label: 'ALL' },
  { id: 'linux', label: 'LINUX / µCLINUX' },
  { id: 'evolution', label: 'EVOLUTION OS' },
  { id: 'coldfire', label: 'COLDFIRE' },
  { id: 'dstni', label: 'DSTni-EX (x86)' },
  { id: '16 mb', label: '16 MB FLASH' },
];

let deviceFilter = 'all';
let deviceQuery = '';
let selectedDevice = 'xpp-lnx';

function renderDeviceFilters() {
  const box = $('deviceFilters');
  box.innerHTML = '';
  for (const f of DEVICE_FILTERS) {
    const b = el('button', `chip${deviceFilter === f.id ? ' is-on' : ''}`, f.label);
    b.type = 'button';
    b.addEventListener('click', () => { deviceFilter = f.id; renderDeviceFilters(); renderDevices(); });
    box.appendChild(b);
  }
}

function deviceMatches(d) {
  if (deviceFilter !== 'all') {
    const inTags = d.tags.includes(deviceFilter);
    const inKind = d.osKind === deviceFilter;
    if (!inTags && !inKind) return false;
  }
  if (!deviceQuery) return true;
  const q = deviceQuery.toLowerCase();
  return [d.name, d.part, d.cpu, d.os, d.kernel, d.flash, d.ram, d.serial, d.ghidra, d.note, d.tags.join(' ')]
    .join(' ').toLowerCase().includes(q);
}

function renderDevices() {
  const tbody = $('deviceBody');
  tbody.innerHTML = '';
  const rows = DEVICES.filter(deviceMatches);
  $('deviceCount').textContent = `${rows.length} / ${DEVICES.length} entries`;
  for (const d of rows) {
    const tr = el('tr', `clickable${d.id === selectedDevice ? ' is-on' : ''}`);
    tr.innerHTML = `<td><b>${esc(d.name)}</b><small>${esc(d.part)}</small></td>
      <td>${esc(d.cpu)}<small>${esc(d.osKind === 'linux' ? 'ColdFire / 32-bit' : '16-bit x86 class')}</small></td>
      <td><span class="pill ${d.osKind === 'linux' ? 'linux' : 'evo'}">${esc(d.os.split(' (')[0])}</span></td>
      <td class="mono">${esc(d.kernel)}</td>
      <td>${esc(d.flash)}<small>${esc(d.ram)}</small></td>
      <td class="mono">${esc(d.ghidra)}</td>`;
    tr.dataset.device = d.id;
    tr.addEventListener('click', () => { selectedDevice = d.id; renderDevices(); });
    tbody.appendChild(tr);
  }
  const d = DEVICES.find((x) => x.id === selectedDevice) ?? rows[0];
  $('deviceDetail').innerHTML = d ? `
    <div class="card">
      <h3>${esc(d.name)} — ${esc(d.part)}</h3>
      <div class="kv">
        <b>Processor</b><span>${esc(d.cpu)} — ${esc(d.cpuDetail)}</span>
        <b>Operating system</b><span>${esc(d.os)} · kernel ${esc(d.kernel)}</span>
        <b>Boot chain</b><span>${esc(d.boot)}</span>
        <b>Memory</b><span>${esc(d.flash)} flash · ${esc(d.ram)}</span>
        <b>Serial</b><span>${esc(d.serial)}</span>
        <b>Flash layout</b><span>${esc(d.flashmap)}</span>
        <b>Firmware artifacts</b><span class="mono">${esc(d.artifacts)}</span>
        <b>Ghidra language</b><span class="mono">${esc(d.ghidra)}</span>
      </div>
      <p>${esc(d.note)}</p>
    </div>` : '';
}

/* ============================================================ 2. ghidra */

export const SIGNATURES = [
  { bytes: '27 05 19 56', what: 'uImage (U-Boot legacy image) header', tells: 'Offset 28 = OS (5 = Linux), offset 29 = IH_ARCH (2 ARM, 3 I386, 5 MIPS, 7 PPC, 12 M68K), offsets 16/20 = load & entry addresses, 12 = data size, 32..63 = image name. Read the arch byte before trusting the filename.' },
  { bytes: '7F 45 4C 46', what: 'ELF', tells: 'e_machine at +18: 3 = EM_386, 4 = EM_M68K (68k *and* ColdFire), 8 = EM_MIPS, 40 = EM_ARM, 62 = EM_X86_64. EM_M68K alone does not distinguish 68000 from ColdFire — check the instruction mix.' },
  { bytes: '1F 8B 08', what: 'gzip member', tells: 'The SDK\'s imagez.bin / linuz.bin are gzip\'d kernel(+romfs). Inflate, then triage again — the payload is what names the CPU.' },
  { bytes: '2D 72 6F 6D 31 66 73 2D', what: '"-rom1fs-" ROMFS superblock', tells: 'µClinux\'s default read-only root. Volume name and size follow; the kernel banner is usually just below it in image.bin.' },
  { bytes: '85 19 …/ 19 85 …', what: 'JFFS2 node magic (LE / BE)', tells: 'The writable partition: rootfs.img, mounted from /dev/mtdblock5 with rootfstype=jffs2.' },
  { bytes: '45 3D CD 28 / 28 CD 3D 45', what: 'CRAMFS magic (LE / BE)', tells: 'Not in the Lantronix SDK (it says cramfs/squashfs "are not part of the standard Linux kernel as of 2.6.30"), so seeing one means a third-party rebuild.' },
  { bytes: '68 73 71 73 ("hsqs")', what: 'SquashFS (LE)', tells: 'Modern rebuilds (Buildroot/Yocto) rather than the 2009 vendor tree.' },
  { bytes: '53 EF at offset 1080', what: 'ext2/3/4 superblock magic', tells: 'Block-device filesystem — on 16 MB of parallel flash this usually means an SD/USB build, not the stock device.' },
  { bytes: 'CA FE BA BE', what: 'Java class file (or Mach-O FAT — same magic)', tells: 'Class: bytes 4-7 are the minor/major version (52 = Java 8, 49 = Java Card-era). Ghidra language JVM:BE:32:default.' },
  { bytes: 'DE CA FF ED', what: 'Java Card CAP package', tells: 'Off-card converter output for the JCVM: components Header/Directory/Applet/Import/ConstantPool/Class/Method/StaticField/Export/Descriptor.' },
  { bytes: '50 4B 03 04', what: 'ZIP / JAR', tells: 'A jar is a zip of class files; the MANIFEST and the first .class name the application (see the JAVA tab).' },
  { bytes: '55 AA at offset 510', what: 'MBR / boot sector signature', tells: 'x86 real-mode boot — the DSTni-EX world, not the ColdFire one.' },
  { bytes: '"dBUG" / "Linux version 2.6.30" / "uClinux" / "ColdFire" / "MCF52" / "Lantronix" / "Evolution"', what: 'ASCII strings', tells: 'The cheapest processor-and-kernel match there is: the kernel banner carries version, toolchain and build host; "dBUG" names the second-stage loader; "Evolution" means it is not Linux at all.' },
  { bytes: 'first 8 bytes: two big-endian words in 0x40000000…', what: 'ColdFire/m68k vector table', tells: 'MCF5208-class SDRAM starts at 0x40000000 (the SDK\'s own dBUG download address is 0x4001FF80). A raw image whose first word is an initial SP in that range is a big-endian m68k/ColdFire image.' },
];

export const LANGUAGES = [
  { blob: 'xPort Pro / Lx6 / MatchPort AR / EDS Linux firmware (ColdFire)', lang: '68000:BE:32:Coldfire', notes: 'Ghidra/Processors/68000/data/languages/coldfire.slaspec; IDA external name "colfire". Big-endian, 32-bit. Load a raw blob at its dBUG load address (SDRAM 0x40000000) or let the ELF loader place it.' },
  { blob: 'Classic 68000-family images (68020/68030/68040/CPU32)', lang: '68000:BE:32:MC68020 · MC68030 · default (68040) · CPU32', notes: 'Same module, four more slaspecs. Pick the variant or the decompiler will accept illegal ColdFire-only encodings.' },
  { blob: 'xPort / xPico / xPort-485 firmware (DSTni-EX, x86-class 16-bit)', lang: 'x86:LE:16:Real Mode', notes: 'The language this repo\'s Ghidra Lab already loads for DOS boot-sector viruses — same trick, different device.' },
  { blob: 'ELF userland binaries from the µClinux rootfs', lang: 'ELF loader → 68000:BE:32:Coldfire', notes: 'e_machine = 4 (EM_M68K). uClibc-linked, FLAT or ELF depending on the SDK release; nommu means no shared mmap of text.' },
  { blob: 'Java class files (a jar served by the module\'s web server)', lang: 'JVM:BE:32:default', notes: 'Ghidra/Processors/JVM with ghidra.javaclass.format.ClassFileJava — Ghidra reads .class files natively; Dalvik has its own module for Android DEX.' },
  { blob: 'Java Card applets (.class before conversion, .cap after)', lang: 'JVM:BE:32:default (class) · no CAP loader', notes: 'Disassemble the pre-conversion .class; a .cap is a component archive, not an instruction stream — parse it structurally instead.' },
];

export const WORKFLOW = [
  ['Get the bytes honestly.', 'Lantronix firmware is upgradeable by TFTP, FTP, the web manager and serial recovery (DeviceInstaller → Tools → Advanced → Recover Firmware). dBUG also runs a TFTP server (<code>set tftpsvr on</code>) and a UDP console (<code>netcon</code>), so a device on the bench can be read without desoldering flash.'],
  ['Name the container.', 'gzip? inflate. uImage? strip 64 bytes and read the arch/load/entry words. ELF? read e_machine. Raw? look for the vector table. The triage panel on the left does exactly this.'],
  ['Find the filesystem.', '<code>-rom1fs-</code> for the read-only root, JFFS2 <code>0x1985</code> for the writable one, cramfs/squashfs if somebody rebuilt it. Carve with <code>dd</code> at the offsets the SDK documents (XPort Pro: kernel partition 0x180000, JFFS2 at 0x00400000).'],
  ['Read the kernel banner.', '<code>strings image.bin | grep "Linux version"</code> gives version, compiler and build date in one line. <code>scripts/extract-ikconfig</code> pulls the built-in .config when CONFIG_IKCONFIG was set — that is the definitive kernel↔CPU match, because it lists CONFIG_COLDFIRE / CONFIG_MMU=n / CONFIG_MTD_* directly.'],
  ['Confirm the ISA in Ghidra.', 'Import with the language the header named, then sanity-check the first instructions: ColdFire prologues are <code>lea (-N,%sp),%sp</code> / <code>movem.l</code>; x86 real mode is <code>push bp; mov bp,sp</code>; ARM is <code>push {lr}</code>. A wrong language yields decodable but nonsensical instructions — that mismatch is the tell.'],
  ['Match to a source tree.', 'Version + config pins the tree: 2.6.30 with uClibc and BusyBox 1.13.3 is uClinux-dist-20090618 plus the vendor patch set (Lantronix\'s SDK ships exactly that). 2.6.26 with uClibc 0.9.29 is the MatchPort AR kit\'s uClinux-dist-20080808.'],
  ['Name the userland and the vendor app.', 'BusyBox applet list, dropbear vs axTLS/axhttpd vs boa, and the vendor binaries (<code>s2e</code>, <code>cpm</code>, <code>dbug-config</code>, <code>netcon</code>) tell you which product and which feature set you are looking at — the last step from "some ColdFire Linux" to "an xPort Pro running the serial-to-Ethernet app".'],
];

function renderGhidraTables() {
  const sig = $('sigBody');
  sig.innerHTML = SIGNATURES.map((s) => `<tr><td class="mono">${esc(s.bytes)}</td><td><b>${esc(s.what)}</b></td><td>${s.tells}</td></tr>`).join('');
  $('sigCount').textContent = `${SIGNATURES.length} signatures`;
  const lang = $('langBody');
  lang.innerHTML = LANGUAGES.map((l) => `<tr><td>${esc(l.blob)}</td><td class="mono">${esc(l.lang)}</td><td>${l.notes}</td></tr>`).join('');
  $('workflow').innerHTML = WORKFLOW.map(([t, b], i) => `<li><b>${i + 1}. ${t}</b> ${b}</li>`).join('');
}

/* ------------------------------------------------------- triage machinery */

const MAGIC = [
  { at: 0, bytes: [0x27, 0x05, 0x19, 0x56], id: 'uimage', label: 'uImage (U-Boot legacy)' },
  { at: 0, bytes: [0x7f, 0x45, 0x4c, 0x46], id: 'elf', label: 'ELF' },
  { at: 0, bytes: [0x1f, 0x8b], id: 'gzip', label: 'gzip' },
  { at: 0, bytes: [0xca, 0xfe, 0xba, 0xbe], id: 'class', label: 'Java class (CAFEBABE)' },
  { at: 0, bytes: [0xde, 0xca, 0xff, 0xed], id: 'cap', label: 'Java Card CAP (DECAFFED)' },
  { at: 0, bytes: [0x50, 0x4b, 0x03, 0x04], id: 'zip', label: 'ZIP / JAR' },
  { at: 0, bytes: [0x2d, 0x72, 0x6f, 0x6d, 0x31, 0x66, 0x73, 0x2d], id: 'romfs', label: 'ROMFS (-rom1fs-)' },
  { at: 0, bytes: [0x68, 0x73, 0x71, 0x73], id: 'squashfs', label: 'SquashFS (hsqs)' },
  { at: 0, bytes: [0x45, 0x3d, 0xcd, 0x28], id: 'cramfs', label: 'CRAMFS' },
];

const IH_ARCH = { 0: 'invalid', 1: 'Alpha', 2: 'ARM', 3: 'I386', 4: 'IA64', 5: 'MIPS', 6: 'MIPS64', 7: 'PowerPC', 8: 'S390', 9: 'SuperH', 10: 'Sparc', 11: 'Sparc64', 12: 'M68K (incl. ColdFire)', 13: 'Nios', 14: 'MicroBlaze', 15: 'Nios2', 16: 'Blackfin', 17: 'AVR32', 22: 'x86_64', 24: 'RISC-V' };
const EM = { 0: 'none', 3: 'EM_386 (x86)', 4: 'EM_M68K (68k / ColdFire)', 8: 'EM_MIPS', 20: 'EM_PPC', 40: 'EM_ARM', 43: 'EM_SPARC_V9', 62: 'EM_X86_64', 247: 'EM_BPF' };

const be = (b, o, n) => { let v = 0; for (let k = 0; k < n; k++) v = v * 256 + (b[o + k] ?? 0); return v; };
const le = (b, o, n) => { let v = 0; for (let k = n - 1; k >= 0; k--) v = v * 256 + (b[o + k] ?? 0); return v; };
const hexs = (b, o, n) => Array.from(b.slice(o, o + n)).map((x) => x.toString(16).padStart(2, '0')).join(' ');

function scanFor(bytes, seq, limit, align = 1) {
  const end = Math.min(bytes.length - seq.length, limit);
  for (let i = 0; i <= end; i += align) {
    let ok = true;
    for (let k = 0; k < seq.length; k++) if (bytes[i + k] !== seq[k]) { ok = false; break; }
    if (ok) return i;
  }
  return -1;
}

const STRINGS_WANTED = [
  /Linux version [0-9][^\x00]{0,120}/, /uClinux[^\x00]{0,60}/i, /ColdFire[^\x00]{0,40}/i, /MCF5[0-9]{3}[^\x00]{0,30}/,
  /dBUG[^\x00]{0,40}/, /Lantronix[^\x00]{0,60}/i, /Evolution[^\x00]{0,40}/i, /BusyBox v[0-9.]+[^\x00]{0,40}/,
  /uClibc[^\x00]{0,30}/i, /axhttpd[^\x00]{0,30}/i, /\bboa\b[^\x00]{0,30}/i, /dropbear[^\x00]{0,30}/i,
  /rom1fs[^\x00]{0,30}/, /jffs2[^\x00]{0,30}/i, /rootfstype=[a-z0-9]+/, /mtdpart[^\x00]{0,40}/,
  /javacard[^\x00]{0,40}/i, /JVM[^\x00]{0,20}/, /Java\([^\x00]{0,20}\)/,
];

function asciiStrings(bytes, limit = 1 << 20, min = 5) {
  const out = [];
  let cur = [];
  const end = Math.min(bytes.length, limit);
  for (let i = 0; i < end; i++) {
    const c = bytes[i];
    if (c >= 0x20 && c < 0x7f) cur.push(c);
    else {
      if (cur.length >= min) out.push({ at: i - cur.length, text: String.fromCharCode(...cur) });
      cur = [];
    }
  }
  if (cur.length >= min) out.push({ at: end - cur.length, text: String.fromCharCode(...cur) });
  return out;
}

export function triageBytes(bytes) {
  const lines = [];
  const push = (cls, text) => lines.push({ cls, text });
  push('', `size ${bytes.length.toLocaleString()} bytes · first 16: ${hexs(bytes, 0, 16)}`);

  let id = null;
  for (const m of MAGIC) {
    if (m.at + m.bytes.length <= bytes.length && m.bytes.every((v, k) => bytes[m.at + k] === v)) { id = m.id; push('good', `magic at 0x0: ${m.label}`); break; }
  }
  if (!id) push('warn', 'no container magic at offset 0 — treating this as a raw image');

  let arch = null;
  let kernel = null;

  if (id === 'elf') {
    const cls = bytes[4] === 2 ? 'ELF64' : 'ELF32';
    const endn = bytes[5] === 2 ? 'big' : 'little';
    const rd = endn === 'big' ? be : le;
    const machine = rd(bytes, 18, 2);
    const entry = rd(bytes, 24, cls === 'ELF64' ? 8 : 4);
    arch = EM[machine] ?? `e_machine ${machine}`;
    push('', `${cls} ${endn}-endian · e_machine = ${machine} → ${arch} · entry 0x${entry.toString(16)}`);
    if (machine === 4) {
      arch = 'EM_M68K — 68k or ColdFire';
      push('warn', 'EM_M68K covers both 68000 and ColdFire: Ghidra language 68000:BE:32:Coldfire is the µClinux-device bet, 68000:BE:32:default (68040) the workstation bet. Confirm from the instruction mix.');
    }
  }

  if (id === 'uimage') {
    // image_header_t: magic(0) hcrc(4) time(8) size(12) load(16) ep(20)
    // dcrc(24) os(28) arch(29) type(30) comp(31) name(32..63)
    const os = bytes[28];
    const a = bytes[29];
    const load = be(bytes, 16, 4);
    const entry = be(bytes, 20, 4);
    const size = be(bytes, 12, 4);
    const name = String.fromCharCode(...bytes.slice(32, 64).filter((c) => c >= 0x20 && c < 0x7f));
    arch = IH_ARCH[a] ?? `IH_ARCH ${a}`;
    push('', `uImage: os=${os} (5 = Linux) · arch=${a} → ${arch} · data ${size} bytes · load 0x${load.toString(16)} · entry 0x${entry.toString(16)} · name "${name}"`);
    push('good', `Ghidra: strip the 64-byte header, load the payload at 0x${load.toString(16)}, language ${a === 12 ? '68000:BE:32:Coldfire' : a === 2 ? 'ARM:LE:32:v7' : a === 3 ? 'x86:LE:32:default' : a === 5 ? 'MIPS:BE:32:default' : 'per IH_ARCH'}.`);
  }

  if (id === 'gzip') push('warn', 'gzip member: inflate before drawing conclusions (the SDK ships imagez.bin / linuz.bin as gzip\'d kernel+romfs).');

  if (id === 'class' || id === 'cap' || id === 'zip') {
    const t = triage(bytes);
    push(t.error ? 'bad' : 'good', t.verdict);
    if (t.class) push('', `class ${t.class.thisClass} extends ${t.class.superClass} · version ${t.class.version} (${t.class.java}) · ${t.class.methods.length} methods`);
    if (t.cap) push('', `CAP components: ${t.cap.components.map((c) => `${c.name}(${c.size})`).join(', ')}`);
  }

  // romfs / jffs2 anywhere in the first megabyte
  const romfs = id === 'romfs' ? 0 : scanFor(bytes, [0x2d, 0x72, 0x6f, 0x6d, 0x31, 0x66, 0x73, 0x2d], 1 << 20);
  if (romfs >= 0) {
    const size = be(bytes, romfs + 8, 4);
    const name = String.fromCharCode(...bytes.slice(romfs + 16, romfs + 48).filter((c) => c >= 0x20 && c < 0x7f));
    push('good', `ROMFS superblock at 0x${romfs.toString(16)} · size ${size} bytes · volume "${name}" → µClinux read-only root`);
  }
  const jffs2 = scanFor(bytes, [0x85, 0x19], 1 << 20, 4);
  if (jffs2 >= 0) push('good', `JFFS2 magic (LE) at 0x${jffs2.toString(16)} → writable partition (rootfs.img / /dev/mtdblock5)`);
  const jffs2be = scanFor(bytes, [0x19, 0x85], 1 << 20, 4);
  if (jffs2be >= 0 && jffs2 < 0) push('good', `JFFS2 magic (BE) at 0x${jffs2be.toString(16)}`);
  const ext2 = bytes.length > 1082 && bytes[1080] === 0x53 && bytes[1081] === 0xef;
  if (ext2) push('warn', 'ext2/3/4 superblock magic at 1080 — a block-device filesystem, not the stock 16 MB parallel-flash layout');
  if (bytes.length > 512 && bytes[510] === 0x55 && bytes[511] === 0xaa) push('warn', '0x55AA at offset 510 — MBR/boot-sector signature (x86 real mode, i.e. DSTni-EX territory)');

  // strings: the cheapest kernel ↔ CPU match
  const found = [];
  for (const s of asciiStrings(bytes)) {
    for (const re of STRINGS_WANTED) {
      const m = s.text.match(re);
      if (m) { found.push({ at: s.at, text: m[0].slice(0, 140) }); break; }
    }
    if (found.length > 40) break;
  }
  if (found.length) {
    push('', `version / vendor strings:`);
    for (const f of found.slice(0, 12)) lines.push({ cls: 'mono', text: `  0x${f.at.toString(16).padStart(6, '0')}  ${f.text}` });
    const lv = found.find((f) => /^Linux version/.test(f.text));
    if (lv) kernel = lv.text;
    if (found.some((f) => /ColdFire|MCF5/i.test(f.text))) arch = arch ?? 'ColdFire (from strings)';
    if (found.some((f) => /Evolution/i.test(f.text))) push('warn', '"Evolution" in the strings: this is Lantronix Evolution OS, not Linux — no kernel banner to match, no /proc, and no ELF userland.');
    if (found.some((f) => /uClinux/i.test(f.text))) push('good', 'µClinux named in the image: expect CONFIG_MMU=n, uClibc, ROMFS/JFFS2 and FLAT binaries.');
  } else {
    push('warn', 'no version/vendor strings in the first megabyte — encrypted, compressed, or a bootloader-only region.');
  }

  // raw-image vector-table heuristic (m68k / ColdFire)
  if (!id || id === 'romfs') {
    const sp = be(bytes, 0, 4);
    const pc = be(bytes, 4, 4);
    if ((sp & 0xff000000) === 0x40000000 || (pc & 0xff000000) === 0x40000000) {
      arch = arch ?? 'ColdFire (MCF5208-class SDRAM at 0x40000000)';
      push('good', `first two big-endian words look like an m68k/ColdFire vector table: SSP 0x${sp.toString(16)}, PC 0x${pc.toString(16)} — the SDK's own dBUG download address is 0x4001FF80.`);
    }
  }

  if (!arch) {
    push('warn', 'architecture not determined from headers or strings — fall back to the vector table, the compiler prologues, or the vendor documentation.');
  } else {
    const lang = /ColdFire|M68K|MCF5/i.test(arch) ? '68000:BE:32:Coldfire'
      : /ARM/i.test(arch) ? 'ARM:LE:32:v7'
        : /x86_64/i.test(arch) ? 'x86:LE:64:default'
          : /I386|x86/i.test(arch) ? 'x86:LE:16:Real Mode or x86:LE:32:default'
            : /MIPS/i.test(arch) ? 'MIPS:BE:32:default' : 'see the language table';
    push('good', `verdict → ${arch}${kernel ? ` · ${kernel}` : ''} · Ghidra language ${lang}`);
  }
  return lines;
}

function renderTriage(lines) {
  const box = $('triageResult');
  box.innerHTML = '';
  for (const l of lines) box.appendChild(el('div', `line ${l.cls}`, esc(l.text)));
}

function parseHex(text) {
  const clean = text.replace(/0x/gi, ' ').replace(/[^0-9a-fA-F]/g, ' ').trim().split(/\s+/).filter(Boolean);
  const bytes = new Uint8Array(clean.length);
  clean.forEach((h, i) => { bytes[i] = parseInt(h.length > 2 ? h.slice(-2) : h, 16) & 0xff; });
  return bytes;
}

/** A synthetic blob that exercises every branch of the triage: uImage header
 *  for M68K, gzip payload marker, romfs superblock, JFFS2 node and the kernel
 *  banner + vendor strings a µClinux image really carries. */
export function demoBlob() {
  const out = [];
  const push = (...b) => out.push(...b);
  const be32 = (v) => [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff];
  const be16 = (v) => [(v >>> 8) & 0xff, v & 0xff];
  // n > 0 pads/truncates to a fixed field; n = 0 means "just the bytes".
  const str = (t, n) => {
    const b = [...new TextEncoder().encode(t)];
    if (!n) return b;
    while (b.length < n) b.push(0);
    return b.slice(0, n);
  };
  push(0x27, 0x05, 0x19, 0x56);          // magic
  push(...be32(0x603126f3));             // hcrc
  push(...be32(0));                      // time
  push(...be32(0));                      // size
  push(...be32(0x40020000));             // load
  push(...be32(0x40020000));             // entry
  push(...be32(0));                      // dcrc
  push(5);                               // os = Linux
  push(12);                              // arch = IH_ARCH_M68K
  push(3);                               // type = kernel
  push(0);                               // comp
  push(...str('uClinux-2.6.30-xportpro', 32));
  // payload
  push(...str('Linux version 2.6.30 (ltrx@build) (gcc version 4.2.x (Sourcery G++ Lite)) #1 PREEMPT\n', 0));
  push(...str('dBUG: Lantronix second stage loader, netcon on\n', 0));
  push(...str('ColdFire MCF5208 family, 16 MB flash, ROMFS root\n', 0));
  push(...str('BusyBox v1.13.3 (uClibc 0.9.29)\n', 0));
  push(...str('axhttpd/boa web manager, dropbear SSH\n', 0));
  push(...str('mtdpart kernel command line: rootfstype=romfs\n', 0));
  while (out.length < 0x1000) out.push(0);
  push(...[0x2d, 0x72, 0x6f, 0x6d, 0x31, 0x66, 0x73, 0x2d]);   // -rom1fs-
  push(...be32(0x400000));                                    // size
  push(...be32(0));                                           // checksum
  push(...str('rom1fs-xportpro', 28));
  while (out.length < 0x2000) out.push(0);
  push(0x85, 0x19, ...be16(0x2003), ...be16(0xe000));         // JFFS2 cleanmarker-ish node
  return new Uint8Array(out);
}

/* ============================================================ 3. uclinux */

export const SDK_STACK = [
  ['Boot stage 1', 'Lantronix boot loader, present on both Evolution OS and Linux products and marked read-only so it cannot be overwritten by accident.', 'Serial recovery banner: "Using new Evolution serial load: RecovLoader_MatchPort.rom"; DeviceInstaller → Tools → Advanced → Recover Firmware.'],
  ['Boot stage 2', 'dBUG — a Freescale ROM monitor, customised by Lantronix: TFTP/serial download, flash write/erase, dual-bank boot, boot-failure counter, UDP console.', 'Commands dnfl / dn / fl w|e / gfl / go / set / show / reset; options autoboot, bootbank single|1|2, safebank, maxbootfc, kcl, romfs_flash; 128-byte dBUG image header; host tool <install>/host/usr/sbin/netcon.'],
  ['Kernel', 'Linux 2.6.30, "custom µClinux distribution" (MatchPort AR kit: 2.6.26 with uClibc 0.9.29 from uClinux-dist 20080808).', 'SDK guide §1: "OS: custom µClinux distribution / Linux Kernel: 2.6.30"; kernel command line rootfstype=romfs|jffs2, noinitrd, mptpart; linux-2.6.x/ in the installed tree.'],
  ['C library', 'uClibc, in the SDK tree as linux/uClibc.', 'Directory listing in the SDK guide §2; "uClibc 0.9.29" in the MatchPort AR dev-kit brief.'],
  ['Root filesystem', 'ROMFS (default, read-only, XIP-able via romfs_flash on) plus an optional JFFS2 writable partition; cramfs/squashfs explicitly unsupported "since they are not part of the standard Linux kernel as of version 2.6.30".', 'Pre-built images romfs.img (romfs) and rootfs.img (JFFS2); dBUG> fl e 0x00400000 0x00C00000 (xPort Pro) / 0x00400000 0x00400000 (MatchPort AR, EDS1100/2100).'],
  ['Flash map', '16 MB parallel flash on the xPort Pro, 8 MB on MatchPort AR and EDS1100/2100; dual-bank firmware upgrade with a safe bank.', 'xPort Pro: kernel partition 0x180000 (MatchPort AR 0x1C0000), /dev/mtd4 3.5 MB, /dev/mtd5 4 MB; dBUG show → bootbank / safebank; "Flash wear leveling and erase cycle statistics".'],
  ['Userland', 'BusyBox 1.13.3, inetd/telnetd/ftpd, dropbear 0.52 (SSH), boa 0.94.14rc21 + axTLS 1.2.4 (axhttpd), mDNSResponder-214.3 / avahi 0.6.25, mii-tool, tcpdump 3.9.8 + libpcap, iperf 2.0.4, openssl 0.9.8k / libgcrypt / libssh, mbus (Modbus TCP↔RTU gateway).', 'SDK CD file table (§2 Table 2-1) — every one of those tarballs is on the disc; §8 lists inetd, telnetd, ftpd, dropbear, axhttpd, mii-tool, ifconfig, mDNSResponder as the shipped networking set.'],
  ['Vendor apps', 's2e (serial-to-Ethernet), s2e-ssh, s2e-ssl, s2e-gpio, cpm (configurable-pin manager), LED demo, dbug-config, netcon, VIP Access bootstrap.', 'SDK §10 sample applications and §11 VIP Access; user/lantronix/ in the installed tree.'],
  ['Toolchain', 'CodeSourcery freescale-coldfire-* cross toolchain (env_m68k-uclinux), host tools, uClinux-dist-20090618 plus a Lantronix patch collection.', 'CD table: freescale-coldfire-*.bz2, uClinux-dist-20090618.tar.bz2, uClinux-dist-20090618-20091129.patch.gz, uClinux-linux_sdk-patch-R*.tar.gz, linux_sdk_host.tar.bz2; installed tree ends with env_m68k-uclinux.'],
  ['Build profiles', 'LTRX_PROFILE_DEFAULT, _DEVELOP, _NO_IPV6, _COMPACT, _AUFS, _SHARED, selected from a menuconfig-style front end.', 'SDK §6 "Configuration Profiles" and the Kernel/Library/Defaults menu screenshot text.'],
  ['Debug', 'gdbserver for remote debugging, syslog, iperf, tcpdump; BDM connector on the MatchPort AR -02 kit.', 'SDK §12 "Profiling & Debugging"; dev-kit product brief lists gdbserver / iperf 2.0.4 / tcpdump 3.9.8.'],
];

export const ALTERNATIVES = [
  ['Lantronix Linux SDK (µClinux-dist 20090618 + vendor patches)', '2.6.30 (MatchPort AR kit: 2.6.26)', 'yes — native, this is the reference', 'Keep it if you want the device to behave like the device. Cost: a 2009 host stack (the guide validates Fedora 9–12 / Ubuntu 8.04–10.04) and a CodeSourcery toolchain that no longer ships.'],
  ['Mainline Linux, arch/m68k with CONFIG_MMU=n', '6.x', 'yes — ColdFire nommu is maintained upstream', 'The honest modern target. You rebuild the board file (SDRAM at 0x40000000, 16 MB parallel flash MTD map, UART, FEC MAC) and lose the vendor apps, which you then rewrite against the SDK\'s own s2e/cpm sources.'],
  ['Buildroot', 'current (kernel version is your choice)', 'yes — the tree ships configs/qemu_m68k_mcf5208_defconfig and arch/Config.in.m68k', 'The fastest reproducible replacement for µClinux-dist, and the defconfig is literally this device\'s silicon class. Bootlin publishes m68k-uclinux toolchains, so the SDK\'s env_m68k-uclinux habit survives.'],
  ['Yocto / OpenEmbedded', 'current', 'partial — m68k layers exist, MCF5208-class BSPs are historical', 'Worth it only if you already run Yocto. Expect to carry the ColdFire nommu patches yourself and to hand-write the machine configuration.'],
  ['OpenWrt', 'current', 'no — ARM / MIPS / x86 / aarch64 targets, no ColdFire nommu', 'Not a port target. It is still the best *feature* reference for a serial-to-Ethernet box (dropbear, uhttpd, firewall, sysupgrade with dual images — the same idea as dBUG\'s bootbank/safebank).'],
  ['DistroWatch-tracked distributions (Alpine, Tiny Core, DSL, SliTaz, DietPi, Debian, …)', 'current', 'no — x86/ARM builds; m68k is not a release architecture anywhere in that list (Debian keeps m68k only as a community port)', 'This is the trap in the original question: DistroWatch is a catalogue of installable general-purpose distributions, and none of them boot on a 16 MB-flash MMU-less ColdFire. Use it for the VM-image half of the research (see distro-dossier.html), and use build systems for this half.'],
  ['RTEMS 6', 'n/a — RTOS, not Linux', 'yes — 20 m68k BSPs including mcf5206elite, mcf5235, mcf5225x, mcf5329, genmcf548x', 'The right answer if you want determinism and a maintained ColdFire BSP instead of an MMU-less Linux. You keep TCP/IP (and the Modbus story), you lose the Linux userland and every ELF tool.'],
  ['FreeRTOS (+TCP) / Zephyr', 'n/a — RTOS', 'ColdFire ports are historical (FreeRTOS demo code for MCF52259); Zephyr has no ColdFire port', 'Realistic only with a hardware re-spin onto Cortex-M — at which point the device is a new product, not this one.'],
  ['SnapGear / Arcturus / Lineo era µClinux distributions', '2.0–2.6', 'yes — the commercial ancestors of the same tree', 'Dead as products, valuable as documentation: SnapGear\'s David McCullough and Greg Ungerer are the two names behind the 2.5.46 nommu merge, and Arcturus sold the ColdFire µClinux modules this SDK descends from.'],
];

const DW_NOTE = 'DistroWatch does expose an "OS Type: Embedded" search and per-distribution Architecture and kernel columns — that is exactly the right shape of question ("which distribution, which kernel, which CPU?"). It just has no answers for this silicon: nothing in its catalogue ships an m68k/ColdFire nommu image. The alternatives that matter here are <b>build systems and kernels</b>, listed below with the evidence for each.';

export const TIMELINE = [
  ['1998', 'D. Jeff Dionne and Kenneth Albanowski port Linux 2.0.33 to Motorola\'s DragonBall 68EZ328 — the PalmPilot\'s CPU. µClinux ("MicroController Linux", pronounced "you-see-Linux") exists to run Linux where there is no MMU.'],
  ['1999', 'Greg Ungerer adds ColdFire support and publishes the first µClinux-dist as the "µClinux-coldfire" package — the ancestor of the tree Lantronix\'s SDK still ships a decade later.'],
  ['November 2002 (Linux 2.5.46)', 'No-MMU support merges into mainline (David McCullough of SnapGear, Greg Ungerer). µClinux stops being a fork and becomes CONFIG_MMU=n; from here "µClinux" names a configuration and a distribution, not a kernel.'],
  ['2009 (uClinux-dist 20090618 + Linux 2.6.30)', 'The exact baseline of Lantronix\'s Linux SDK 900-548 for MatchPort AR, xPort Pro and EDS1100/2100: uClibc, BusyBox 1.13.3, ROMFS + JFFS2, dBUG, CodeSourcery m68k-uclinux toolchain.'],
  ['September 2016', 'The last µClinux-dist release (2.6 plus newer 3.x/4.x-based trees); uclinux.org goes offline. ColdFire nommu lives on in mainline arch/m68k, and Buildroot keeps an mcf5208 defconfig.'],
];

function renderUclinux() {
  $('sdkBody').innerHTML = SDK_STACK
    .map(([a, b, c]) => `<tr><td><b>${esc(a)}</b></td><td>${b}</td><td><small>${c}</small></td></tr>`).join('');
  $('altBody').innerHTML = ALTERNATIVES
    .map(([a, b, c, d]) => `<tr><td><b>${a}</b></td><td class="mono">${esc(b)}</td><td>${c}</td><td>${d}</td></tr>`).join('');
  $('altCount').textContent = `${ALTERNATIVES.length} candidates`;
  $('dwNote').innerHTML = DW_NOTE;
  $('uclinuxTimeline').innerHTML = TIMELINE
    .map(([y, t]) => `<li><b>${esc(y)}</b> — ${t}</li>`).join('');
}

/* =============================================================== 4. java */

export const JVM_ROWS = [
  ['Container', '<code>.class</code> (CAFEBABE) inside a <code>.jar</code> (ZIP)', '<code>.cap</code> (DECAFFED): a component archive the off-card <i>converter</i> builds from the same <code>.class</code> files'],
  ['Instruction set', '202 opcodes — the whole 0x00–0xC9 space is assigned, plus <code>breakpoint</code>, <code>impdep1/2</code>', 'A subset: no <code>long</code>/<code>float</code>/<code>double</code> arithmetic, a reduced <code>ldc</code> family, and short/token operand encodings to fit a 16-bit card VM'],
  ['Types', 'byte short int long float double char boolean + references', 'byte short int boolean + object references (classic JCVM has no 64-bit or FP types at all)'],
  ['Strings', '<code>java.lang.String</code>, interned, UTF-8 in the constant pool', 'No String class in classic Java Card: text is <code>byte[]</code>. This is why the applets in <code>samples/javacard/</code> never mention String'],
  ['Memory model', 'Heap + generational GC, virtual memory, large stacks', 'Tiny persistent heap, transient object deletion (JCRE), transaction-backed commits via <code>JCSystem</code>, and an APDU-sized stack'],
  ['Concurrency', 'Many threads, monitors, <code>synchronized</code>', 'One applet selected at a time; <code>monitorenter</code>/<code>monitorexit</code> are meaningless on a card'],
  ['Isolation', 'Class loaders + security manager', 'Applet firewalls, AID-based selection, sharing only through <code>Shareable</code> interfaces'],
  ['Entry point', '<code>public static void main(String[])</code>', '<code>Applet.install()</code> / <code>select()</code> / <code>process(APDU)</code>, driven by ISO 7816-4 command APDUs'],
  ['Toolchain', '<code>javac</code> → <code>java</code>', '<code>javac</code> → <code>converter</code> → <code>.cap</code> → GlobalPlatform install; the JavaCardOS community ships JCIDE and pyApduTool for exactly this loop'],
  ['Ghidra', '<code>JVM:BE:32:default</code> ("Generic JVM", <code>JVM.sla</code>) with the <code>ghidra.javaclass</code> class-file reader', 'Same language for the pre-conversion <code>.class</code>; a <code>.cap</code> has no loader — parse the components instead (the reader on the left does)'],
];

export const ACME_ROWS = [
  ['thttpd', 'C, single process, throttling + CGI (ACME Labs, Jef Poskanzer)', 'The classic tiny HTTP server for embedded boxes. Its own javadoc for Acme.Serve calls it "the other one is called thttpd, it\'s written in C, and is also pretty small although much more featureful than this."'],
  ['micro_httpd / mini_httpd', 'C, inetd-sized / IPv6-capable', 'Same author, same design point: a few hundred KB of HTTP for a device that has no room for Apache.'],
  ['js_httpd', 'Server-side JavaScript, runs from inetd', 'The curiosity entry: ACME\'s "really small HTTP server in JavaScript", written before Node existed.'],
  ['Acme.Serve', 'Java, ~1500 lines, implements the Servlet API', '"A very small embeddable HTTP server … provides only the functionality necessary to deliver an Applet\'s .class files and then start up a Servlet talking to the Applet." That sentence is the whole link between this panel and the xPort Pro, whose internal web server "serves static web pages and Java applets".'],
  ['What the µClinux device actually runs', 'boa 0.94.14rc21 + axTLS 1.2.4 (axhttpd), BusyBox httpd', 'From the SDK\'s own CD table and §8 networking list. Neither ACME server ships on the device — but they are the same engineering answer to the same 1 MB web-content budget the xPort Pro Integration Guide quotes.'],
];

const ACME_NOTE = '"ACME web server" is Jef Poskanzer\'s <b>ACME Labs</b> family (thttpd, micro_httpd, mini_httpd, js_httpd in C/JS, and <b>Acme.Serve</b> in Java) — the same ACME whose Unix utilities this repo already rebuilt in <a href="./apps/acme_suite_quine.html">apps/acme_suite_quine.html</a>. The Java one matters here because a device this small serves its own web UI <i>and</i> Java applets: the xPort Pro Integration Guide lists the internal web server as "Serves static web pages and Java applets · Storage capacity: 1 MB".';

const WIKI_CARD = `
<h3>Wiki in a Jar — verified from the jar, not from memory</h3>
<div class="kv">
  <b>Project</b><span>"Wiki in a Jar" (SourceForge <code>wiki-in-a-jar</code>), author <code>rico_g</code>, GPLv2, Java, web UI. Latest release <code>WikiInAJar-0.8-20081128-bin.zip</code> (123.4 kB). Pitch: a wiki small enough to live on a USB stick, replacing a paper notebook and address book.</span>
  <b>Runs as</b><span>a server on <code>http://localhost:3003/wiki</code> — MediaWiki-syntax subset, tag trees, vCards, calendar; no access control (anyone who knows the port can read it).</span>
  <b>Embedded server</b><span><b>Not</b> Acme.Serve. The mirror <code>astecenko/Wiki-in-a-Jar</code> carries <code>lib/xrays.jar</code> (26,107 bytes); unzipped, it contains <code>net.sf.wikiinajar.xrays.NanoHTTPD</code>, <code>NanoHTTPD$HTTPSession</code>, <code>NanoHTTPD$Response</code> and <code>HttpServer</code> — a NanoHTTPD-derived single-file Java HTTP server, relocated into the project's package.</span>
  <b>Structure</b><span><code>org.rgse.wikiinajar.server.Server</code> registers eight controllers (Wiki, Vcard, Tag, Find, Index, Admin, Calendar, Tab), defaults the port to 3003, and renders through XSL skins (<code>master.xsl</code>, <code>root.xsl</code>, per-view <code>.xml</code>) — XML views plus a template, all in one jar.</span>
  <b>Why it belongs here</b><span>It is the "application on the device" archetype for this whole page: one jar, its own HTTP server, no container, no database server — the same trick a µClinux device pulls with boa/axhttpd, and the same trick Acme.Serve was written for in 1997.</span>
</div>`;

function renderJava() {
  $('jvmBody').innerHTML = JVM_ROWS
    .map(([a, b, c]) => `<tr><td><b>${esc(a)}</b></td><td>${b}</td><td>${c}</td></tr>`).join('');
  $('acmeBody').innerHTML = ACME_ROWS
    .map(([a, b, c]) => `<tr><td><b>${esc(a)}</b></td><td>${b}</td><td>${c}</td></tr>`).join('');
  $('acmeNote').innerHTML = ACME_NOTE;
  $('wikiCard').innerHTML = WIKI_CARD;
}

/* ---------------------------------------------------- class/CAP inspector */

function renderJavaResult(bytes, name) {
  const box = $('javaResult');
  const listing = $('javaListing');
  box.innerHTML = '';
  listing.hidden = true;
  listing.textContent = '';
  const add = (cls, text) => box.appendChild(el('div', `line ${cls}`, esc(text)));

  const s = sniff(bytes);
  add('', `${name || 'blob'} · ${bytes.length.toLocaleString()} bytes · magic ${s.magic ?? hexs(bytes, 0, 4)} → ${s.kind}`);

  if (s.kind === 'class') {
    let c;
    try { c = parseClass(bytes); } catch (e) { add('bad', `parse failed: ${e.message}`); return; }
    add('good', `${c.thisClass} extends ${c.superClass ?? '—'} · version ${c.version} (${c.javaVersion}) · ${c.flags.join(' ') || 'no flags'}`);
    add('', `constant pool: ${c.constantPoolCount} entries · fields: ${c.fields.length} · methods: ${c.methods.length} · interfaces: ${c.interfaces.join(', ') || '—'}`);
    const kinds = {};
    for (const e of c.pool) if (e && e.kind) kinds[e.kind] = (kinds[e.kind] ?? 0) + 1;
    add('', `pool mix: ${Object.entries(kinds).map(([k, v]) => `${k}×${v}`).join(' ')}`);
    const out = [];
    out.push(`${c.thisClass}  (version ${c.version}, ${c.javaVersion})`);
    out.push(`extends ${c.superClass ?? '—'}${c.interfaces.length ? ` implements ${c.interfaces.join(', ')}` : ''}`);
    out.push('');
    for (const f of c.fields) {
      out.push(`  field ${f.flags.join(' ')} ${f.descriptor} ${f.name}`);
    }
    for (const m of c.methods) {
      out.push(`  method ${m.flags.join(' ')} ${m.name}${m.descriptor}`);
      const code = m.attributes.find((a) => a.name === 'Code');
      if (!code) { out.push('    (no Code attribute — abstract or native)'); continue; }
      out.push(`    Code: max_stack=${code.maxStack} max_locals=${code.maxLocals} code_length=${code.codeLength}`);
      for (const ins of code.instructions) {
        const [mn, cm] = ins.text.split(' // ');
        out.push(`      ${String(ins.pc).padStart(4, ' ')}: ${hexs(new Uint8Array(ins.bytes), 0, ins.bytes.length).padEnd(12, ' ')} ${mn}${cm ? `   // ${cm}` : ''}`);
      }
      if (code.exceptionTable.length) {
        out.push(`    Exception table: ${code.exceptionTable.map((e) => `[${e.start}..${e.end}) → ${e.handler}${e.catchType ? ` catch #${e.catchType}` : ''}`).join(', ')}`);
      }
      const lnt = code.attributes?.find((a) => a.name === 'LineNumberTable');
      if (lnt) out.push(`    LineNumberTable: ${lnt.lines.map((l) => `${l.pc}→${l.line}`).join(' ')}`);
    }
    for (const a of c.attributes) {
      out.push(`  attribute ${a.name}${a.file ? ` = ${a.file}` : ''}`);
    }
    listing.textContent = out.join('\n');
    listing.hidden = false;
    add('good', `disassembled ${c.methods.reduce((n, m) => n + (m.attributes.find((a) => a.name === 'Code')?.instructions?.length ?? 0), 0)} instructions — Ghidra would load this with JVM:BE:32:default`);
    return;
  }

  if (s.kind === 'cap') {
    let c;
    try { c = parseCap(bytes); } catch (e) { add('bad', `parse failed: ${e.message}`); return; }
    add('good', `Java Card CAP package v${c.version} · declared package length ${c.packageLength} bytes · ${c.components.length} components`);
    for (const comp of c.components) add('', `  component ${comp.name} (tag ${comp.tag}, ${comp.size} bytes)  ${comp.hex}`);
    return;
  }

  if (s.kind === 'zip') {
    add('warn', 'ZIP/JAR: use the in-tab unzip below (DecompressionStream) or extract one .class and drop it again.');
    void unpackJar(bytes).then((entry) => {
      if (!entry) { add('bad', 'no .class entry found, or this browser cannot inflate raw deflate streams.'); return; }
      add('good', `jar entry ${entry.name} (${entry.data.length} bytes) — parsing it now`);
      renderJavaResult(entry.data, entry.name);
    }).catch((e) => add('bad', `jar handling failed: ${e.message}`));
    return;
  }

  add('warn', 'not a Java container. The triage panel in the GHIDRA MATCH tab handles firmware blobs; this one reads class/CAP/jar.');
}

/** Minimal ZIP reader: central directory → first .class → inflate if needed. */
async function unpackJar(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0 && i > bytes.length - 66000; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) return null;
  const count = dv.getUint16(eocd + 10, true);
  let off = dv.getUint32(eocd + 16, true);
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(off, true) !== 0x02014b50) break;
    const method = dv.getUint16(off + 10, true);
    const compSize = dv.getUint32(off + 20, true);
    const nameLen = dv.getUint16(off + 28, true);
    const extraLen = dv.getUint16(off + 30, true);
    const commentLen = dv.getUint16(off + 32, true);
    const lho = dv.getUint32(off + 42, true);
    const name = new TextDecoder().decode(bytes.slice(off + 46, off + 46 + nameLen));
    if (name.endsWith('.class')) {
      const lNameLen = dv.getUint16(lho + 26, true);
      const lExtraLen = dv.getUint16(lho + 28, true);
      const dataStart = lho + 30 + lNameLen + lExtraLen;
      const raw = bytes.slice(dataStart, dataStart + compSize);
      if (method === 0) return { name, data: raw };
      if (method === 8) {
        if (typeof DecompressionStream === 'undefined') return null;
        const ds = new DecompressionStream('deflate-raw');
        const stream = new Blob([raw]).stream().pipeThrough(ds);
        const buf = new Uint8Array(await new Response(stream).arrayBuffer());
        return { name, data: buf };
      }
      return null;
    }
    off += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

/* ================================================================= 5. eda */

const EDA_NOTES = `
<h3>What the board is</h3>
<p>A 110 × 64 mm two-layer wallplug that turns a bare <b>Lantronix xPort Pro</b> module into a mains-powered
RS-232 ↔ Ethernet adapter: fused AC input → isolated 3.3 V AC/DC → the module's 8-pin header, with a MAX3232
giving a real DE-9, a DTE/DCE solder strap, an optional modem-control transceiver and an optional RS-485 front
end wired exactly like the Integration Guide's appendix A.</p>
<h3>Layout rules the generator enforces</h3>
<ul>
  <li><b>Creepage 6.4 mm / clearance 4.0 mm</b> between every mains pad and every SELV pad, measured
      pad-edge to pad-edge. The AC/DC module's own pads are zone-tagged individually, so its 3.3 V output is
      allowed to sit close to the logic while its AC pins are not.</li>
  <li><b>No courtyard may overlap</b> another (0.2 mm tolerance) or leave the outline, except parts flagged
      <code>edge</code> — the DE-9 and the module's RJ45 nose both mate through the board edge.</li>
  <li><b>Pad-to-pad ≥ 0.35 mm</b> unless the pads share a net or a package (a 1.27 mm SOIC pitch is legal,
      a 1.27 mm solder-jumper pitch is intentional).</li>
  <li><b>Ground pour is confined</b> to the SELV half of the board (x ≥ 52 mm) so the copper cannot bridge the
      barrier; the barrier itself is drawn on tPlace and tRestrict.</li>
  <li><b>Mounting holes</b> keep 3.2 mm from every pad.</li>
</ul>
<h3>Routing (left to the builder, deliberately)</h3>
<ul>
  <li>Mains: ≥ 2.5 mm tracks, class 1 net rules, L through F1 then to PS1 pin 1, N straight to PS1 pin 2,
      MOV1 last (after the fuse) so a varistor failure opens the fuse.</li>
  <li>3.3 V: ≥ 1.0 mm from FB1 to the module pin 2, with C1/C2/C3/C4 as close to the pin field as they fit;
      the module draws 200 mA typical / 270 mA max at 100Base-TX, so the HLK-PM03's 600 mA continuous rating
      has real margin but no slack for a long thin trace.</li>
  <li>Serial: keep the DE-9's TXD/RXD pair away from the switching node of PS1; the RS-232 swings ±5 V, so
      route it on the far side of the module from the AC/DC converter.</li>
  <li>Shield tabs: at least 1 in² (6.45 cm²) of copper on the two shield-tab pads — the Integration Guide
      calls them "an important source of heat sinking", and the module is rated to +85 °C only with it.</li>
</ul>
<h3>Safety, honestly</h3>
<ul>
  <li>This is a <b>design study</b>: it has not been certified, and mains-connected PCBs need an
      IEC/EN 62368-1 (or 60950-1) assessment plus a properly rated enclosure before anyone plugs one in.</li>
  <li>The AC/DC module is the isolation barrier. The budget HLK-PM03 is 3 kV-rated but not safety-certified;
      for a user-accessible product use a certified part (RECOM RAC03-3.3SK, MEAN WELL IRM-03-3.3) in the same
      footprint role.</li>
  <li>Fuse in the line conductor only, MOV after the fuse, no reliance on the PCB for basic insulation,
      class-II (all-insulated) enclosure, and the module's chassis connected through the 10 nF / 200 V caps the
      Integration Guide recommends rather than bolted to signal ground.</li>
</ul>
<h3>Assembly and bring-up</h3>
<ul>
  <li>Fit the power section first. With no module installed, check 3.3 V ±2 % and ≤ 2 % ripple at the module
      header (the IG's recommended operating conditions), then check the reset threshold behaviour: the module
      resets below 2.85–3.00 V and holds an internal 140 ms power-up reset.</li>
  <li>Fit the module, connect a 3.3 V-logic serial adapter to the TTL header J4 (3V3/GND/TXD/RXD/CP1/CP2/CP3/RESET)
      and watch for the dBUG banner at 115200 8N1 before trusting the DE-9.</li>
  <li>Then fit U2 and the DE-9, and check DTE versus DCE with JP1/JP2: strapped 1-2 the board is a DTE
      (EDS2100 style), strapped 2-3 a DCE (UDS1100 style).</li>
  <li>Only one front end at a time: populate U2 (RS-232) or U4 + R8/R9/R10 (RS-485). Both share the module's
      TTL pins.</li>
</ul>`;

let edaView = 'board';
let edaLayer = 'cu';
let selectedNet = null;
let selectedRef = null;
let bomFilter = 'all';

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, a = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(a)) {
    if (v === undefined || v === null) continue;
    // Blink has setAttribute; tools/dom-stub.mjs models properties, and the
    // test suite for this page adds a setAttribute shim so the geometry below
    // is asserted rather than skipped.
    if (typeof n.setAttribute === 'function') n.setAttribute(k, String(v));
    else n[k] = String(v);
  }
  return n;
};

function pkgTransform(place) {
  return (x, y) => {
    const [dx, dy] = rotPt(x, y, place.rot);
    return [place.x + dx, place.y + dy];
  };
}

function renderBoard() {
  const svg = $('edaSvg');
  svg.innerHTML = '';
  svg.setAttribute('viewBox', `${-2} ${-2} ${BOARD.w + 4} ${BOARD.h + 6}`);
  svg.setAttribute('aria-label', 'Generated EAGLE board: xPort Wallplug');
  const Y = (y) => BOARD.h - y;

  if (edaLayer === 'zones') {
    const z = BOARD.zones;
    svg.appendChild(svgEl('rect', { class: 'zone-mains', x: z.mains.x1, y: Y(z.mains.y2), width: z.mains.x2 - z.mains.x1, height: z.mains.y2 - z.mains.y1 }));
    svg.appendChild(svgEl('rect', { class: 'zone-selv', x: z.selv.x1, y: Y(z.selv.y2), width: z.selv.x2 - z.selv.x1, height: z.selv.y2 - z.selv.y1 }));
    svg.appendChild(svgEl('line', { class: 'barrier', x1: BARRIER.x1, y1: Y(BARRIER.y1), x2: BARRIER.x2, y2: Y(BARRIER.y2) }));
    const t1 = svgEl('text', { class: 'note', x: 3, y: Y(z.mains.y2) + 4 }); t1.textContent = 'MAINS ZONE (hazardous voltage)';
    const t2 = svgEl('text', { class: 'note', x: z.selv.x1 + 2, y: Y(z.selv.y2) + 4 }); t2.textContent = 'SELV ZONE';
    svg.append(t1, t2);
  }

  svg.appendChild(svgEl('rect', { class: 'outline', x: 0, y: 0, width: BOARD.w, height: BOARD.h, rx: 1.2 }));

  for (const part of PARTS) {
    const ds = DEVICESETS[part.set];
    const pkg = PACKAGES[ds.package];
    const place = PLACEMENT[part.ref];
    const T = pkgTransform(place);
    const g = svgEl('g', { class: `elem${selectedRef === part.ref ? ' sel' : ''}`, 'data-ref': part.ref });

    if (edaLayer === 'courts') {
      const c = courtAbs(pkg, place);
      g.appendChild(svgEl('rect', { class: 'court', x: c.x1, y: Y(c.y2), width: c.x2 - c.x1, height: c.y2 - c.y1 }));
    }

    for (const s of [...(pkg.silk || []), ...(pkg.leads || [])]) {
      if (s.w) {
        for (let k = 0; k < s.w.length - 1; k++) {
          const [x1, y1] = T(s.w[k].x, s.w[k].y);
          const [x2, y2] = T(s.w[k + 1].x, s.w[k + 1].y);
          g.appendChild(svgEl('line', { class: s.layer === 51 ? 'docu' : 'silk', x1, y1: Y(y1), x2, y2: Y(y2) }));
        }
      }
      if (s.c) {
        const [cx, cy] = T(s.c.x, s.c.y);
        g.appendChild(svgEl('circle', { class: s.layer === 51 ? 'docu' : 'silk', cx, cy: Y(cy), r: s.c.r }));
      }
    }
    for (const c of pkg.circles || []) {
      const [cx, cy] = T(c.x, c.y);
      g.appendChild(svgEl('circle', { class: 'silk', cx, cy: Y(cy), r: c.r }));
    }
    for (const h of pkg.holes || []) {
      const [hx, hy] = T(h.x, h.y);
      g.appendChild(svgEl('circle', { class: 'hole', cx: hx, cy: Y(hy), r: h.drill / 2 }));
    }

    const zoneOf = (padName) => part.padZones?.[padName] ?? part.zone;
    for (const pad of pkg.pads || []) {
      const [px, py] = T(pad.x, pad.y);
      const net = netForPad(part.ref, ds, pad.name);
      const cls = `pad${pad.smd ? ' smd' : ''}${zoneOf(pad.name) === 'mains' ? ' mains' : ''}${selectedNet && net === selectedNet ? ' net-hi' : ''}`;
      if (pad.smd) {
        const swap = place.rot === 'R90' || place.rot === 'R270';
        g.appendChild(svgEl('rect', {
          class: cls, x: px - (swap ? pad.smd.dy : pad.smd.dx) / 2, y: Y(py) - (swap ? pad.smd.dx : pad.smd.dy) / 2,
          width: swap ? pad.smd.dy : pad.smd.dx, height: swap ? pad.smd.dx : pad.smd.dy, rx: 0.15,
        }));
      } else {
        g.appendChild(svgEl('circle', { class: cls, cx: px, cy: Y(py), r: (pad.diameter ?? pad.drill * 2) / 2 }));
        g.appendChild(svgEl('circle', { class: 'hole', cx: px, cy: Y(py), r: pad.drill / 2 }));
      }
    }

    const c = courtAbs(pkg, place);
    const label = svgEl('text', { class: 'ref', x: c.x1, y: Y(c.y2) - 0.6 });
    label.textContent = part.ref;
    g.appendChild(label);

    const hit = svgEl('rect', { class: 'hit', x: c.x1, y: Y(c.y2), width: c.x2 - c.x1, height: c.y2 - c.y1 });
    hit.addEventListener('click', () => { selectedRef = part.ref; selectedNet = null; renderEda(); });
    g.appendChild(hit);
    svg.appendChild(g);
  }

  for (const n of BOARD_NOTES) {
    const t = svgEl('text', { class: 'note', x: n.x, y: Y(n.y) });
    t.textContent = n.text;
    svg.appendChild(t);
  }
  const dim = svgEl('text', { class: 'dim', x: 2, y: BOARD.h + 4 });
  dim.textContent = `${BOARD.w} × ${BOARD.h} mm · 2 layers · ${PARTS.length} parts · ${Object.keys(NETS).length} nets · unrouted (airwires)`;
  svg.appendChild(dim);
}

function netForPad(ref, ds, padName) {
  const pin = Object.entries(ds.connects).find(([, pad]) => pad === padName)?.[0];
  if (!pin) return null;
  for (const [net, members] of Object.entries(NETS)) {
    if (members.some(([r, p]) => r === ref && p === pin)) return net;
  }
  return null;
}

function renderSchematic() {
  const svg = $('edaSvg');
  svg.innerHTML = '';
  svg.setAttribute('viewBox', `${-4} ${-4} ${SHEET.w + 8} ${SHEET.h + 10}`);
  svg.setAttribute('aria-label', 'Generated EAGLE schematic: xPort Wallplug');
  const Y = (y) => SHEET.h - y;

  svg.appendChild(svgEl('rect', { class: 'outline', x: 0, y: 0, width: SHEET.w, height: SHEET.h }));

  // nets first, so symbols sit on top
  for (const [net, members] of Object.entries(NETS)) {
    const on = selectedNet === net;
    for (const [ref, pinName] of members) {
      const part = PARTS.find((p) => p.ref === ref);
      if (!part || part.boardOnly) continue;
      const ds = DEVICESETS[part.set];
      if (!ds.symbol) continue;
      const place = SCHEM_PLACEMENT[ref];
      if (!place) continue;
      const pa = pinAbsolute(ds.symbol, pinName, place);
      const [ux, uy] = stubDir(pa.rot);
      const x2 = pa.x + ux * STUB;
      const y2 = pa.y + uy * STUB;
      svg.appendChild(svgEl('line', {
        class: 'wire', x1: pa.x, y1: Y(pa.y), x2, y2: Y(y2),
        'stroke-width': on ? 0.8 : 0.35, opacity: on ? 1 : 0.55,
      }));
      if (on) {
        const t = svgEl('text', { class: 'label', x: x2 + (ux ? ux * 1.5 : 0.6), y: Y(y2) + (uy ? 0 : 0.9) });
        t.textContent = net;
        svg.appendChild(t);
      }
    }
  }

  for (const part of PARTS.filter((p) => !p.boardOnly)) {
    const ds = DEVICESETS[part.set];
    if (!ds.symbol) continue;
    const sym = SYMBOLS[ds.symbol];
    const place = SCHEM_PLACEMENT[part.ref];
    if (!place) continue;
    const g = svgEl('g', { class: `elem${selectedRef === part.ref ? ' sel' : ''}` });
    for (const w of sym.wires || []) {
      if (w.w) {
        for (let k = 0; k < w.w.length - 1; k++) {
          g.appendChild(svgEl('line', {
            class: 'sym', x1: place.x + w.w[k].x, y1: Y(place.y + w.w[k].y),
            x2: place.x + w.w[k + 1].x, y2: Y(place.y + w.w[k + 1].y),
            'stroke-width': w.width ?? 0.254,
          }));
        }
      }
      if (w.c) g.appendChild(svgEl('circle', { class: 'sym', cx: place.x + w.c.x, cy: Y(place.y + w.c.y), r: w.c.r }));
    }
    for (const pin of sym.pins || []) {
      const px = place.x + pin.x;
      const py = place.y + pin.y;
      const len = pin.length === 'short' ? 2.54 : 5.08;
      const [ux, uy] = stubDir(pin.rot);
      g.appendChild(svgEl('line', { class: 'pin', x1: px, y1: Y(py), x2: px - ux * len, y2: Y(py - uy * len) }));
      const t = svgEl('text', {
        class: 'pinname', x: px - ux * len + (ux ? ux * -0.6 : 1.2), y: Y(py - uy * len) + (uy ? 0 : 1.0),
      });
      t.textContent = pin.name;
      g.appendChild(t);
    }
    const bb = symbolBBox(sym);
    const nm = svgEl('text', { class: 'instname', x: place.x + bb.x1, y: Y(place.y + bb.y2) - 1.2 });
    nm.textContent = `${part.ref}${part.value ? `  ${part.value}` : ''}${part.dnp ? '  (DNP)' : ''}`;
    g.appendChild(nm);
    const hit = svgEl('rect', {
      class: 'hit', x: place.x + bb.x1 - 2, y: Y(place.y + bb.y2) - 2,
      width: bb.x2 - bb.x1 + 4, height: bb.y2 - bb.y1 + 4,
    });
    hit.addEventListener('click', () => { selectedRef = part.ref; selectedNet = null; renderEda(); });
    g.appendChild(hit);
    svg.appendChild(g);
  }

  for (const n of SCHEM_NOTES) {
    const t = svgEl('text', { class: 'note', x: n.x, y: Y(n.y), 'font-size': n.size * 0.55 });
    t.textContent = n.text;
    svg.appendChild(t);
  }
  const dim = svgEl('text', { class: 'dim', x: 2, y: SHEET.h + 5 });
  dim.textContent = `sheet ${SHEET.w} × ${SHEET.h} mm · ${PARTS.filter((p) => !p.boardOnly).length} instances · label-driven wiring (every pin carries a net label)`;
  svg.appendChild(dim);
}

function renderEda() {
  if (edaView === 'board') renderBoard(); else renderSchematic();
  $('edaTag').textContent = edaView === 'board'
    ? `${BOARD.w} × ${BOARD.h} MM · ${PARTS.length} PARTS`
    : `SHEET ${SHEET.w} × ${SHEET.h} MM · ${Object.keys(NETS).length} NETS`;
  renderEdaDetail();
}

function renderEdaDetail() {
  const box = $('edaDetail');
  if (selectedRef) {
    const part = PARTS.find((p) => p.ref === selectedRef);
    if (part) {
      const ds = DEVICESETS[part.set];
      const place = PLACEMENT[part.ref];
      const netsHere = Object.entries(NETS)
        .filter(([, m]) => m.some(([r]) => r === part.ref))
        .map(([n, m]) => `${n} (${m.filter(([r]) => r === part.ref).map(([, p]) => p).join(',')})`);
      box.innerHTML = `<div class="card">
        <h3>${esc(part.ref)} — ${esc(part.value || ds.package)}</h3>
        <div class="kv">
          <b>Package</b><span class="mono">${esc(ds.package)} — ${esc(PACKAGES[ds.package].descr)}</span>
          <b>Board position</b><span class="mono">${place.x}, ${place.y} mm · ${place.rot}${part.edge ? ` · mates through the ${part.edge} edge` : ''}</span>
          <b>Zone</b><span><span class="pill ${part.zone}">${part.zone.toUpperCase()}</span> ${part.dnp ? '<span class="pill dnp">DNP</span>' : ''}</span>
          <b>Nets</b><span class="mono">${esc(netsHere.join(' · ') || '—')}</span>
          <b>Pads</b><span class="mono">${esc((PACKAGES[ds.package].pads || []).map((p) => p.name).join(' '))}</span>
          <b>Note</b><span>${esc(part.note || '—')}</span>
        </div></div>`;
      return;
    }
  }
  if (selectedNet) {
    const members = NETS[selectedNet] ?? [];
    box.innerHTML = `<div class="card"><h3>Net ${esc(selectedNet)}</h3>
      <div class="kv"><b>Members</b><span class="mono">${esc(members.map(([r, p]) => `${r}.${p}`).join(' · '))}</span>
      <b>Pads</b><span class="mono">${esc(members.map(([r, p]) => `${r}.${DEVICESETS[PARTS.find((q) => q.ref === r).set].connects[p]}`).join(' · '))}</span>
      <b>Class</b><span>${esc({ AC_L: 'mains (2.5 mm tracks, 6.4 mm creepage)', AC_L_F: 'mains (fused line)', AC_N: 'mains (neutral)', '3V3_P': 'power (pre-bead)', '3V3': 'power', GND: 'power', CHASSIS: 'chassis/ESD' }[selectedNet] ?? 'signal')}</span></div></div>`;
    return;
  }
  box.innerHTML = '<div class="card"><p>Click a part or a net. The board view is the generated copper and silkscreen; the schematic view is the generated symbols, pin stubs and net labels. Both come from the same model the EAGLE files were written from.</p></div>';
}

function renderNets() {
  const list = $('netList');
  const q = ($('netSearch').value || '').toLowerCase();
  list.innerHTML = '';
  const nets = Object.entries(NETS).filter(([n, m]) => !q || n.toLowerCase().includes(q) || m.some(([r]) => r.toLowerCase().includes(q)));
  $('netCount').textContent = `${nets.length} / ${Object.keys(NETS).length}`;
  for (const [net, members] of nets) {
    const li = el('li', selectedNet === net ? 'is-on' : '');
    li.innerHTML = `<span style="color:inherit">${esc(net)}</span><span>${members.length} pins</span>`;
    li.addEventListener('click', () => { selectedNet = selectedNet === net ? null : net; selectedRef = null; renderNets(); renderEda(); });
    list.appendChild(li);
  }
}

const BOM_FILTERS = [
  { id: 'all', label: 'ALL' },
  { id: 'fit', label: 'FIT' },
  { id: 'dnp', label: 'DNP OPTIONS' },
  { id: 'mains', label: 'MAINS ZONE' },
  { id: 'selv', label: 'SELV ZONE' },
];

function renderBom() {
  const box = $('bomFilters');
  if (!box.children.length) {
    for (const f of BOM_FILTERS) {
      const b = el('button', `chip${bomFilter === f.id ? ' is-on' : ''}`, f.label);
      b.type = 'button';
      b.addEventListener('click', () => { bomFilter = f.id; box.innerHTML = ''; renderBom(); });
      box.appendChild(b);
    }
  }
  const rows = PARTS.filter((p) => (bomFilter === 'all' ? true
    : bomFilter === 'fit' ? !p.dnp
      : bomFilter === 'dnp' ? p.dnp
        : p.zone === bomFilter));
  $('bomCount').textContent = `${rows.length} / ${PARTS.length} refs`;
  const tbody = $('bomBody');
  tbody.innerHTML = '';
  for (const p of rows) {
    const ds = DEVICESETS[p.set];
    const tr = el('tr', 'clickable');
    tr.dataset.ref = p.ref;
    tr.innerHTML = `<td><b>${esc(p.ref)}</b></td>
      <td class="mono">${esc(p.value || '—')}</td>
      <td class="mono">${esc(ds.package)}</td>
      <td><span class="pill ${p.dnp ? 'dnp' : ''}">${p.dnp ? 'DNP' : 'FIT'}</span></td>
      <td><span class="pill ${p.zone}">${p.zone.toUpperCase()}</span></td>
      <td><small>${esc(p.note || '')}</small></td>`;
    tr.addEventListener('click', () => { selectedRef = p.ref; selectedNet = null; renderEda(); });
    tbody.appendChild(tr);
  }
}

function renderDrc() {
  const box = $('drcReport');
  box.innerHTML = '';
  const add = (cls, text) => box.appendChild(el('div', `line ${cls}`, text));
  let geo;
  let sch;
  try { geo = checkGeometry(); } catch (e) { add('bad', `geometry check failed: ${esc(e.message)}`); return; }
  try { sch = checkSchematicLayout(); } catch (e) { add('bad', `sheet check failed: ${esc(e.message)}`); return; }
  const pads = collectPads();
  add(geo.errors.length ? 'bad' : 'good',
    `${geo.errors.length ? `${geo.errors.length} geometry problem(s)` : 'geometry clean'} — ${pads.length} pads, ${geo.placed.length} placed parts, ${Object.keys(NETS).length} nets`);
  add(geo.worstCreepage >= BOARD.creepageMm ? 'good' : 'bad',
    `worst mains ↔ SELV creepage ${geo.worstCreepage.toFixed(2)} mm at ${esc(geo.worstPair)} — limit ${BOARD.creepageMm} mm`);
  add(sch.errors.length ? 'bad' : 'good',
    `${sch.errors.length ? `${sch.errors.length} sheet problem(s)` : 'sheet readable'} — ${sch.boxes.length} instances, no overlapping label boxes`);
  for (const e of [...geo.errors, ...sch.errors].slice(0, 8)) add('bad', esc(e));
  for (const n of geo.notes.slice(0, 4)) add('warn', esc(n));
  add('', `unconnected by design: ${UNCONNECTED.map(([r, p]) => `${r}.${p}`).join(', ') || '—'}`);
  add('', 'board is placed and verified but unrouted: EAGLE shows the ratsnest, and the routing rules are in the notes panel.');
}

function renderDownloads() {
  const base = './hardware/lantronix-wallplug/';
  const files = [
    ['lantronix-wallplug.sch', 'SCHEMATIC .sch'],
    ['lantronix-wallplug.brd', 'BOARD .brd'],
    ['lantronix-wallplug.lbr', 'LIBRARY .lbr'],
    ['BOM.md', 'BOM.md'],
  ];
  $('downloads').innerHTML = files.map(([f, label]) => `<a class="dl" href="${base}${f}" download="${f}">${label}</a>`).join('')
    + '<a class="dl" href="./tools/wallplug-model.mjs" download>MODEL .mjs</a>';
}

function renderLegend() {
  $('edaLegend').innerHTML = [
    ['#d9a441', 'through-hole pad'],
    ['#c9cedf', 'SMD pad'],
    ['#ff8d9c', 'mains pad'],
    ['#76e2df', 'selected net'],
    ['#cfd7f2', 'silkscreen (tPlace)'],
    ['#6f7aa3', 'documentation (tDocu)'],
  ].map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join('');
}

/* =========================================================== 6. sources */

export const SOURCES = [
  ['Lantronix', 'xPort Pro Integration Guide, 900-557 rev K (August 2024)', 'https://www.lantronix.com/wp-content/uploads/pdf/XPort-Pro_IG.pdf', 'Table 2-2 pin functions (GND/3V3/Reset/Data Out/Data In/CP1/CP2/CP3), Figures 2-4..2-7 dimensions and the recommended PCB hole pattern, absolute maximum ratings, the 10 nF / 200 V chassis-capacitor ESD advice, 1 in² copper heatsink rule, and appendix A\'s RS-485 wiring.'],
  ['Lantronix', 'xPort Pro User Guide, 900-560 rev G (February 2019)', 'https://www.lantronix.com/wp-content/uploads/pdf/900-560e_XPort_Pro_UG_release.pdf', 'Part-number table (8 vs 16 MB SDRAM × Evolution vs Linux), power/reset/serial specifications, Evolution OS feature list.'],
  ['Lantronix', 'Linux Software Developer\'s Kit (SDK) User Guide, 900-548', 'https://cdn.papouch.com/data/user-content/old_eshop/files/XPORT_PRO/linux-sdk_ug.pdf', 'The µClinux evidence: "OS: custom µClinux distribution / Linux Kernel: 2.6.30", dBUG commands and options, dual-bank and netcon, ROMFS/JFFS2 chapters with the exact erase commands, the CD file table (uClinux-dist-20090618, freescale-coldfire toolchain, uClibc, boa, axTLS, dropbear, BusyBox 1.13.3, mbus…), build profiles and the sample s2e/cpm applications.'],
  ['Lantronix', 'PCN-485 xPort Pro software release notification (2017)', 'https://cdn.lantronix.com/wp-content/uploads/pdf/PCN-485-XPort-Pro_Software_Release_Notification.pdf', 'Names the Linux line "XPort Pro (uClinux)" and ties firmware 5.4.0.2R2 to a secondary dBUG bootloader update via the uClinux SDK.'],
  ['Lantronix', 'xPort Data Sheet 910-815 and xPort-485 Data Sheet 910-463', 'https://cdn.lantronix.com/wp-content/uploads/pdf/910-815J_XPort_Data_Sheet_10042022.pdf', 'DSTni-EX "186" CPU, 256 KB SRAM, 512 KB flash, 16 KB boot ROM, the 8-pin 3.3 V interface, and the classic XPort hole pattern (2.54 mm, Ø3.25 shield holes).'],
  ['Lantronix', 'xPico product page', 'https://www.lantronix.com/products/xpico/', '"CPU: Based on the DSTni-EX Enhanced 16-bit x86 Architecture · 256 KB SRAM, 512 KB flash" — the plain statement that the small parts are x86-class, not ColdFire.'],
  ['Lantronix', 'MatchPort AR product brief and Linux DevKit brief', 'https://cdn.lantronix.com/wp-content/uploads/pdf/MatchPort-AR_PB.pdf', 'DSTni-FX 32-bit 166 MHz / 159 MIPS, 8 MB SDRAM + 4 MB flash, 7 CP/GPIO; DevKit brief: kernel 2.6.26, uClibc 0.9.29, uClinux-dist 20080808, CodeSourcery toolchain, BDM connector, gdbserver/iperf/tcpdump.'],
  ['Lantronix', 'EDS1100/EDS2100 product page and EDS User Guide', 'https://www.lantronix.com/products/eds1100-eds2100/', 'The boxed RS-232↔Ethernet siblings: Linux or Evolution OS, 100–240 VAC supply, part numbers ED1100002-LNX-01 etc.'],
  ['Lantronix tech support', 'RS232 DTE/DCE connector note and cable-wiring note', 'https://ltrxdev.atlassian.net/wiki/spaces/LTRXTS/pages/106889653/RS232+-+DTE+and+DCE+connectors', 'Which Lantronix products are DTE and which are DCE (UDS1100 = DM25F DCE, UDS2100/EDS2100 = DB9M DTE) and the DB9 pin conventions the wallplug\'s JP1/JP2 strap selects between.'],
  ['CNX Software', 'Lantronix XPort Pro Lx6 is a Tiny Embedded Linux Server Fitted into an RJ45 Connector (2013)', 'https://www.cnx-software.com/2013-12-15/lantronix-xport-pro-lx6-is-a-tiny-embedded-linux-server-fitted-into-an-rj45-connector/', 'The only public naming of the silicon: "Freescale ColdFire MCF5208 up to 166.67 MHz (TBC)", 16 MB SDRAM, 16 MB flash.'],
  ['Wikipedia', 'μClinux', 'https://en.wikipedia.org/wiki/%CE%9CClinux', 'Origins (Dionne + Albanowski, 1998, DragonBall 68EZ328 on 2.0.33), mainline merge at 2.5.46 (2002), uClibc and µClinux-dist as separate deliverables, last µClinux-dist release September 2016.'],
  ['Ghidra (NationalSecurityAgency/ghidra)', 'Ghidra/Processors listing, 68000.ldefs, JVM.ldefs, Dalvik languages, javaclass package', 'https://github.com/NationalSecurityAgency/ghidra/tree/master/Ghidra/Processors', 'Processor modules present (68000, ARM, MIPS, PowerPC, x86, JVM, Dalvik, Atmel, …); language ids 68000:BE:32:Coldfire (slafile coldfire.sla, IDA name "colfire"), 68000:BE:32:MC68020/30/CPU32/default, JVM:BE:32:default ("Generic JVM", IDA name "java"); ghidra/javaclass/format/ClassFileJava.java is the class-file reader.'],
  ['Buildroot', 'configs/qemu_m68k_mcf5208_defconfig and arch/Config.in.m68k', 'https://github.com/buildroot/buildroot/tree/master/configs', 'Proof that the modern, maintained build system still targets this exact silicon class — the practical µClinux-dist replacement.'],
  ['RTEMS', 'User Manual 6.2 §8.6 m68k (Motorola 68000 / ColdFire) BSPs', 'https://docs.rtems.org/docs/6.2/user/bsps/index.html', 'av5282, csb360, gen68340, gen68360, genmcf548x, mcf5206elite, mcf52235, mcf5225x, mcf5235, mcf5329 — the maintained RTOS alternative for ColdFire.'],
  ['KiCad source mirror', 'common/io/eagle/eagle_parser.h, pcbnew/pcb_io/eagle/pcb_io_eagle.cpp, eeschema/sch_io/eagle/sch_io_eagle.cpp', 'https://github.com/KiCad/kicad-source-mirror', 'The EAGLE XML DTD (element and attribute lists for eagle/drawing/library/packages/symbols/devicesets/schematic/sheets/nets/segments/pinref/board/elements/signals/contactref) that tools/build-wallplug-eagle.mjs generates against — a real importer is the strongest available validator without a licensed copy of EAGLE.'],
  ['KiCad footprints', 'Connector_Dsub.pretty DSUB-9_Male_Horizontal_P2.77x2.84mm_EdgePinOffset7.70mm…, Package_SO.pretty SOIC-16_3.9x9.9mm_P1.27mm, Button_Switch_THT.pretty SW_PUSH_6mm', 'https://github.com/KiCad/kicad-footprints', 'Pad geometry for the DE-9 (2.77 × 2.84 grid, 3.2 mm mounting holes, board edge 7.70 mm from pin row 1), SOIC-16 (±2.475 mm, 1.95 × 0.6 pads) and the 6 mm tact switch.'],
  ['Third-party footprints', 'robertstarr/lbr_user lantronix.lbr · tridrao/SparkFun-KiCad-Libraries XPORT.kicad_mod · ranseyer/home-automatics and CarnivalBen HLK-PM01.kicad_mod', 'https://github.com/robertstarr/lbr_user', 'The xPort package (8 staggered pins, rows 2.54 mm apart, 1.27 mm stagger, 0.9144 mm drills, 1.6764 mm shield-tab drills) and the HLK pin geometry (AC pair 5.08 mm, DC pair 15.24 mm, rows 29.21 mm apart) the wallplug footprints were built from, cross-checked against each other.'],
  ['Hi-Link / distributors', 'HLK-PM03 3.3 V 3 W AC-DC module', 'https://www.lcsc.com/product-detail/ac-dc-power-modules_hi-link-hlk-pm03_C209904.html', '34 × 20 × 15 mm, 85–265 VAC, 3.3 V / 1 A peak (600 mA continuous), 3 kV isolation, short-circuit and over-current protection — the wallplug\'s power stage, with certified alternates named in the notes.'],
  ['ACME Labs', 'Class Acme.Serve.Serve javadoc and the thttpd / mini_httpd / micro_httpd / js_httpd pages', 'https://www.acme.com/java/software/Acme.Serve.Serve.html', '"Minimal Java HTTP server class … about 1500 lines … The other one is called thttpd, it\'s written in C" — the ACME web-server family, quoted rather than paraphrased.'],
  ['SourceForge + GitHub mirror', 'Wiki in a Jar (wiki-in-a-jar) and astecenko/Wiki-in-a-Jar', 'https://sourceforge.net/projects/wiki-in-a-jar/', 'Project facts (GPLv2, Java, web UI, 0.8-20081128, USB-stick PIM) plus the mirror\'s Server.java (port 3003, eight controllers), build.xml and lib/xrays.jar, which unzips to net.sf.wikiinajar.xrays.NanoHTTPD — the embedded server, verified from the bytes.'],
  ['JavaCardOS', 'javacardos.com forum: JavaCard Development Kit, Smart Card Development Quick Start Guide', 'https://javacardos.com/javacardforum/viewtopic.php?t=115', 'The JCIDE + pyApduTool toolchain, the six specifications it tells you to read first (Java Card API, JCVM, JCRE, ISO 7816-3/-4, ISO 14443-3/-4, GlobalPlatform) and the .java → .cap conversion loop; domain record shows the community dates from 2014-12-17.'],
  ['This repository', 'ghidra-lab.html · docs/GHIDRA_COOKBOOK.md · samples/javacard/ · docs/UEFI_OPENBIOS_JAVAC.md · docs/RESEARCH_SMARTCARD.md · distro-dossier.html', './ghidra-lab.html', 'The prior art this lab builds on: a browser Ghidra lab already loading x86:LE:16:Real Mode, a cookbook-vs-Ghidra verification habit, Java Card applet samples with their own test suite, and the DistroWatch-facing dossier for the VM half of the question.'],
];

function renderSources() {
  $('sourceList').innerHTML = SOURCES.map(([tag, what, url, why]) => `<li>
    <span class="tag">${esc(tag)}</span>
    <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(what)}</a>
    <span class="why">${esc(why)}</span>
    <a class="tag" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>
  </li>`).join('');
  $('sourceCount').textContent = `${SOURCES.length} sources`;
}

/* ============================================================== wiring */

const TABS = [
  ['tabDevice', 'device'], ['tabGhidra', 'ghidra'], ['tabUclinux', 'uclinux'],
  ['tabJava', 'java'], ['tabEda', 'eda'], ['tabSources', 'sources'],
];

function wireTabs() {
  const show = (id) => {
    for (const [, panel] of TABS) $(`panel-${panel}`).hidden = panel !== id;
    for (const [btn, panel] of TABS) $(btn).classList.toggle('is-on', panel === id);
    try { if (typeof location !== 'undefined') location.hash = id; } catch { /* file:// */ }
  };
  for (const [btn, panel] of TABS) $(btn).addEventListener('click', () => show(panel));
  const start = (typeof location !== 'undefined' ? (location.hash || '') : '').replace('#', '');
  const known = TABS.map(([, p]) => p);
  show(known.includes(start) ? start : 'device');
}

function wireTriage() {
  const drop = $('triageDrop');
  const input = $('triageFile');
  const read = (file) => {
    const fr = new FileReader();
    fr.onload = () => {
      const bytes = new Uint8Array(fr.result).slice(0, 4 << 20);
      renderTriage([{ cls: '', text: `file ${file.name} (${file.size.toLocaleString()} bytes, first 4 MB read)` }, ...triageBytes(bytes)]);
    };
    fr.readAsArrayBuffer(file.slice(0, 4 << 20));
  };
  input.addEventListener('change', () => { if (input.files[0]) read(input.files[0]); });
  for (const ev of ['dragenter', 'dragover']) drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over'); });
  for (const ev of ['dragleave', 'drop']) drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('is-over'); });
  drop.addEventListener('drop', (e) => { if (e.dataTransfer?.files?.[0]) read(e.dataTransfer.files[0]); });
  $('triageRun').addEventListener('click', () => {
    const bytes = parseHex($('triageHex').value);
    if (!bytes.length) { renderTriage([{ cls: 'warn', text: 'paste some hex first, or drop a file' }]); return; }
    renderTriage([{ cls: '', text: `pasted hex → ${bytes.length} bytes` }, ...triageBytes(bytes)]);
  });
  $('triageDemo').addEventListener('click', () => {
    const bytes = demoBlob();
    renderTriage([{ cls: '', text: `demo blob (synthetic µClinux/uImage image, ${bytes.length} bytes)` }, ...triageBytes(bytes)]);
  });
  $('triageClear').addEventListener('click', () => { $('triageResult').innerHTML = ''; $('triageHex').value = ''; });
}

function wireJava() {
  const drop = $('javaDrop');
  const input = $('javaFile');
  const read = (file) => {
    const fr = new FileReader();
    fr.onload = () => renderJavaResult(new Uint8Array(fr.result), file.name);
    fr.readAsArrayBuffer(file);
  };
  input.addEventListener('change', () => { if (input.files[0]) read(input.files[0]); });
  for (const ev of ['dragenter', 'dragover']) drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over'); });
  for (const ev of ['dragleave', 'drop']) drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('is-over'); });
  drop.addEventListener('drop', (e) => { if (e.dataTransfer?.files?.[0]) read(e.dataTransfer.files[0]); });
  $('javaDemo').addEventListener('click', () => renderJavaResult(demoClass(), 'Demo.class (built in-tab)'));
  $('javaClear').addEventListener('click', () => { $('javaResult').innerHTML = ''; $('javaListing').hidden = true; });
}

/**
 * A hand-assembled class file — the same trick tests/21-jvmdis.mjs uses, so the
 * reader has a real CAFEBABE blob to prove itself on without a JDK in the tab.
 *
 *   class XPortStatus {
 *     private boolean serialReady;
 *     public void portOpen() {
 *       if (serialReady) System.out.println("link is up");
 *       else return;      // compiled as iconst_0; ireturn below
 *     }
 *   }
 */
export function demoClass() {
  const b = [];
  const u1 = (v) => b.push(v & 0xff);
  const u2 = (v) => { b.push((v >> 8) & 0xff, v & 0xff); };
  const u4 = (v) => { b.push((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff); };
  const utf = (str) => { const x = [...new TextEncoder().encode(str)]; u1(1); u2(x.length); b.push(...x); };

  u4(0xcafebabe);
  u2(0); u2(52);                            // minor 0, major 52 → Java 8
  u2(28);                                   // constant_pool_count = 27 entries + 1
  utf('XPortStatus');                       // #1
  u1(7); u2(1);                             // #2  Class XPortStatus
  utf('java/lang/Object');                  // #3
  u1(7); u2(3);                             // #4  Class java/lang/Object
  utf('serialReady');                       // #5
  utf('Z');                                 // #6
  u1(12); u2(5); u2(6);                     // #7  NameAndType serialReady:Z
  u1(9); u2(2); u2(7);                      // #8  Fieldref XPortStatus.serialReady
  utf('portOpen');                          // #9
  utf('()V');                               // #10
  utf('Code');                              // #11
  utf('java/lang/System');                  // #12
  u1(7); u2(12);                            // #13 Class java/lang/System
  utf('out');                               // #14
  utf('Ljava/io/PrintStream;');             // #15
  u1(12); u2(14); u2(15);                   // #16 NameAndType out:Ljava/io/PrintStream;
  u1(9); u2(13); u2(16);                    // #17 Fieldref System.out
  utf('link is up');                        // #18
  u1(8); u2(18);                            // #19 String "link is up"
  utf('java/io/PrintStream');               // #20
  u1(7); u2(20);                            // #21 Class java/io/PrintStream
  utf('println');                           // #22
  utf('(Ljava/lang/String;)V');             // #23
  u1(12); u2(22); u2(23);                   // #24 NameAndType println:(Ljava/lang/String;)V
  u1(10); u2(21); u2(24);                   // #25 Methodref PrintStream.println
  utf('SourceFile');                        // #26
  utf('XPortStatus.java');                  // #27

  u2(0x0021);                               // ACC_PUBLIC | ACC_SUPER
  u2(2); u2(4);                             // this_class, super_class
  u2(0);                                    // interfaces
  u2(1);                                    // fields
  u2(0x0002); u2(5); u2(6); u2(0);           //   private boolean serialReady
  u2(1);                                    // methods
  u2(0x0001); u2(9); u2(10);                //   public void portOpen()
  const code = [
    0x2a,                                   //  0: aload_0
    0xb4, 0x00, 0x08,                       //  1: getfield #8
    0x9a, 0x00, 0x0c,                       //  4: ifeq → 16
    0xb2, 0x00, 0x11,                       //  7: getstatic #17
    0x12, 0x13,                             // 10: ldc #19
    0xb6, 0x00, 0x19,                       // 12: invokevirtual #25
    0xb1,                                   // 15: return
    0x03,                                   // 16: iconst_0
    0xac,                                   // 17: ireturn
  ];
  u2(1);                                    //   one attribute: Code
  u2(11);                                   //     attribute_name #11
  u4(2 + 2 + 4 + code.length + 2 + 2);      //     attribute_length
  u2(2); u2(1);                             //     max_stack 2, max_locals 1
  u4(code.length); b.push(...code);         //     code
  u2(0);                                    //     exception_table_length
  u2(0);                                    //     Code attributes
  u2(1);                                    // class attributes
  u2(26); u4(2); u2(27);                     //   SourceFile = XPortStatus.java
  return new Uint8Array(b);
}

const VIEWS = [['viewBoard', 'board'], ['viewSchem', 'schem']];
const LAYERS = [['layerCu', 'cu'], ['layerZones', 'zones'], ['layerCourts', 'courts']];

function wireEda() {
  for (const [id, view] of VIEWS) {
    $(id).addEventListener('click', () => {
      edaView = view;
      for (const [other, v] of VIEWS) $(other).classList.toggle('is-on', v === view);
      renderEda();
    });
  }
  for (const [id, layer] of LAYERS) {
    $(id).addEventListener('click', () => {
      edaLayer = layer;
      for (const [other, l] of LAYERS) $(other).classList.toggle('is-on', l === layer);
      renderEda();
    });
  }
  $('netSearch').addEventListener('input', renderNets);
  renderDownloads();
  renderLegend();
  renderNets();
  renderBom();
  renderDrc();
  renderEda();
  $('edaNotes').innerHTML = EDA_NOTES;
}

/* ------------------------------------------------------------------ boot */

function boot() {
  wireTabs();
  renderDeviceFilters();
  renderDevices();
  $('deviceSearch').addEventListener('input', (e) => { deviceQuery = e.target.value; renderDevices(); });
  renderGhidraTables();
  wireTriage();
  renderUclinux();
  renderJava();
  wireJava();
  wireEda();
  renderSources();
}

if (typeof document !== 'undefined' && document.getElementById('tabs')) boot();
