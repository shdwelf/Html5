#!/usr/bin/env python3
"""
bootchain.py — does this machine actually meet the requirements to boot, and
does the chipset agree?

Two halves, because a boot decision needs both:

  * the DISK half parses real on-disk structures — MBR written by fdisk, the
    GPT protective MBR + header + entry array, the EFI System Partition's FAT
    volume, the PE32+ boot application inside it, and the legacy second-stage
    loader (GRUB / LILO / OpenBIOS-compatible MBR bootstrap);
  * the PLATFORM half decodes the vchip status word (see rtl/vchip_top.v and
    docs/VCHIP.md) and checks the enforcement requirements: chain verified, no
    tamper latch, arm latched, boot source allowed by policy, reads permitted,
    and no destructive command granted to a tampered host.

Usage:
    python3 tools/bootchain.py --image disk.img --policy uefi
    python3 tools/bootchain.py --image disk.img --policy legacy --loader grub
    python3 tools/bootchain.py --status 0x0010000000000003 --policy uefi
    python3 tools/bootchain.py --transcript rtl/golden/vchip_transcript.txt
    python3 tools/bootchain.py --selftest          # fixtures in memory + verdicts
    python3 tools/bootchain.py --fixtures DIR      # write those fixtures out

Exit status: 0 if every REQUIRED item passes, 1 otherwise.

The status-word layout and the deny/abort constants are *parsed out of the RTL*
(`rtl/vchip_top.v`, `rtl/vchip_pkg.vh`) rather than duplicated here, so this
tool and the hardware cannot drift apart silently; `--transcript` then checks
the decoder against 101 simulated cycles of the real chipset, including the
packed word against the named ports.
"""

from __future__ import annotations

import argparse
import json
import re
import struct
import sys
import zlib
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RTL_TOP = ROOT / "rtl" / "vchip_top.v"
RTL_PKG = ROOT / "rtl" / "vchip_pkg.vh"

SECTOR = 512

# Partition type bytes and GPT type GUIDs that matter for a boot path.
MBR_TYPE_EMPTY = 0x00
MBR_TYPE_EFI_PROTECTIVE = 0xEE
GPT_UNUSED = "00000000-0000-0000-0000-000000000000"
GPT_ESP = "c12a7328-f81f-11d2-ba4b-00a0c93ec93b"
GPT_MICROSOFT_BASIC = "ebd0a0a2-b9e5-4433-87c0-68b6b72699c7"

PE_MACHINES = {0x014C: "i386", 0x8664: "x86-64", 0xAA64: "arm64", 0x01C0: "arm", 0x0200: "ia64"}
PE_SUBSYSTEMS = {
    0: "-", 1: "native", 2: "windows-gui", 3: "windows-cui", 7: "posix-cui",
    9: "windows-ce", 10: "efi-application", 11: "efi-boot-service-driver",
    12: "efi-runtime-driver", 13: "efi-rom", 14: "xbox", 16: "windows-boot",
}
EFI_SUBSYSTEMS = {10, 11, 12, 13}          # UEFI 2.10 section 4.2: EFI images
EFI_APP_SUBSYSTEM = 10                     # ... and a boot *application* is 10


# --------------------------------------------------------------- check results

REQUIRED, RECOMMENDED, INFO = "REQUIRED", "RECOMMENDED", "INFO"


@dataclass
class Check:
    id: str
    what: str
    level: str
    ok: bool | None          # None = skipped / not applicable
    detail: str = ""

    @property
    def verdict(self) -> str:
        if self.ok is None:
            return "SKIP"
        if self.ok:
            return "PASS"
        return "FAIL" if self.level == REQUIRED else "WARN"


@dataclass
class Report:
    checks: list[Check] = field(default_factory=list)

    def add(self, id, what, level, ok, detail=""):
        self.checks.append(Check(id, what, level, ok, detail))
        return self

    def failed(self):
        return [c for c in self.checks if c.level == REQUIRED and c.ok is False]

    def render(self, title):
        lines = [f"== {title} =="]
        width = max((len(c.id) for c in self.checks), default=8)
        for c in self.checks:
            mark = {"PASS": "ok  ", "FAIL": "FAIL", "WARN": "warn", "SKIP": "--  "}[c.verdict]
            lines.append(f"  [{mark}] {c.id.ljust(width)}  {c.what}")
            if c.detail and c.verdict not in ("PASS", "SKIP"):
                lines.append(f"           {c.detail}")
        return "\n".join(lines)

    def to_dict(self):
        return [
            {"id": c.id, "what": c.what, "level": c.level, "verdict": c.verdict, "detail": c.detail}
            for c in self.checks
        ]


# ------------------------------------------------------- RTL-derived constants

def status_layout(path: Path = RTL_TOP) -> list[tuple[int, int, str]]:
    """Parse `assign status[hi:lo] = signal;` out of the RTL into a layout."""
    text = path.read_text()
    layout: list[tuple[int, int, str]] = []
    for m in re.finditer(r"assign\s+status\[(\d+)(?::(\d+))?\]\s*=\s*([^;]+);", text):
        hi = int(m.group(1))
        lo = int(m.group(2)) if m.group(2) else hi
        expr = m.group(3).strip()
        if re.fullmatch(r"\d+'d0", expr):
            name = "reserved"
        else:
            name = expr.split("[")[0].split(" ")[0]
        layout.append((lo, hi, name))
    if not layout:
        raise SystemExit(f"no status[] assignments found in {path}")
    return layout


def pkg_constants(path: Path = RTL_PKG) -> dict[str, int]:
    """Parse `define NAME <width>'d<value>` (and `'h`) out of the RTL package.

    Constants whose value is an expression (e.g. ``VCHIP_LANE_W`` = ``VCHIP_VEC_W/4``)
    are resolved one level deep so callers can still compare them.
    """
    text = path.read_text()
    consts: dict[str, int] = {}
    for m in re.finditer(r"`define\s+(\w+)\s+(\d+)'([dhb])([0-9a-fA-F]+)\b", text):
        consts[m.group(1)] = int(m.group(4), {"d": 10, "h": 16, "b": 2}[m.group(3)])
    # A bare decimal, e.g. `define VCHIP_STAGES     3`
    for m in re.finditer(r"`define\s+(\w+)\s+(\d+)\s*(?:\r?\n|//|$)", text):
        consts.setdefault(m.group(1), int(m.group(2)))
    return consts


LAYOUT = status_layout()
CONSTS = pkg_constants()


def decode_status(word: int) -> dict[str, int]:
    return {name: (word >> lo) & ((1 << (hi - lo + 1)) - 1) for lo, hi, name in LAYOUT if name != "reserved"}


def reserved_bits_set(word: int) -> list[str]:
    out = []
    for lo, hi, name in LAYOUT:
        if name != "reserved":
            continue
        mask = ((1 << (hi - lo + 1)) - 1) << lo
        if word & mask:
            out.append(f"[{hi}:{lo}]=0x{(word & mask) >> lo:x}")
    return out


def deny_name(value: int) -> str:
    for k, v in CONSTS.items():
        if k.startswith("DENY_") and v == value:
            return k[5:].lower()
    return f"unknown({value})"


def abort_name(value: int) -> str:
    for k, v in CONSTS.items():
        if k.startswith("ABORT_") and v == value:
            return k[6:].lower()
    return f"unknown({value})"


# ------------------------------------------------------------------- utilities

def u16(b, off): return struct.unpack_from("<H", b, off)[0]
def u32(b, off): return struct.unpack_from("<I", b, off)[0]
def u64(b, off): return struct.unpack_from("<Q", b, off)[0]


def guid_bytes(text: str) -> bytes:
    """Canonical GUID text -> the mixed-endian 16-byte on-disk form."""
    h = text.replace("-", "")
    parts = bytes.fromhex(h)
    return (parts[0:4][::-1] + parts[4:6][::-1] + parts[6:8][::-1] + parts[8:16])


def guid_text(raw: bytes) -> str:
    a, b, c = raw[0:4][::-1].hex(), raw[4:6][::-1].hex(), raw[6:8][::-1].hex()
    return f"{a}-{b}-{c}-{raw[8:10].hex()}-{raw[10:16].hex()}"


@dataclass
class Partition:
    index: int
    first_lba: int
    sectors: int
    type_byte: int | None = None
    type_guid: str | None = None
    name: str | None = None
    attrs: int = 0

    @property
    def last_lba(self):
        return self.first_lba + self.sectors - 1


# ------------------------------------------------------------------ disk: MBR

def parse_mbr(img: bytes, report: Report, *, expect_gpt: bool | None = None) -> list[Partition]:
    """MBR partition table (the thing `fdisk` writes) with its requirements."""
    if len(img) < SECTOR:
        report.add("mbr_present", "image is at least one 512-byte sector", REQUIRED, False, f"{len(img)} bytes")
        return []
    report.add("mbr_present", "image is at least one 512-byte sector", REQUIRED, True)

    sig = u16(img, 510)
    report.add("mbr_signature", "LBA0 ends with the 0x55AA boot signature", REQUIRED, sig == 0x55AA,
               f"got 0x{sig:04x}")

    code = img[0:0x1BE]
    nonzero = sum(1 for b in code if b)
    protective = any(img[0x1BE + i * 16 + 4] == MBR_TYPE_EFI_PROTECTIVE for i in range(4))
    report.add("mbr_bootstrap",
               "LBA0 contains bootstrap code" if not protective
               else "protective MBR carries bootstrap code (informational: UEFI firmware reads the GPT)",
               INFO if protective else RECOMMENDED,
               nonzero > 16 if not protective else None,
               f"{nonzero} non-zero bytes in the code region")

    parts: list[Partition] = []
    for i in range(4):
        off = 0x1BE + i * 16
        status, ptype = img[off], img[off + 4]
        first, count = u32(img, off + 8), u32(img, off + 12)
        if ptype == MBR_TYPE_EMPTY and first == 0 and count == 0:
            continue
        parts.append(Partition(i, first, count, type_byte=ptype))
        # status byte is 0x00 or 0x80, nothing else
        report.add(f"mbr_entry{i}_status", f"partition {i} boot flag is 0x00 or 0x80",
                   REQUIRED, status in (0x00, 0x80), f"got 0x{status:02x}")
        report.add(f"mbr_entry{i}_bounds", f"partition {i} fits inside the image",
                   REQUIRED, first >= 1 and count > 0 and (first + count) * SECTOR <= len(img),
                   f"LBA {first}+{count} vs image {len(img) // SECTOR} sectors")

    # Non-overlap: a table that describes the same sectors twice cannot boot
    # reliably (firmware and GRUB both pick differently).
    ranges = sorted(((p.first_lba, p.last_lba, p.index) for p in parts))
    overlaps = [(a[2], b[2]) for a, b in zip(ranges, ranges[1:]) if b[0] <= a[1]]
    report.add("mbr_no_overlap", "partitions do not overlap", REQUIRED, not overlaps,
               f"overlapping pairs: {overlaps}")

    active = [p for p in parts if img[0x1BE + p.index * 16] == 0x80]
    if expect_gpt is True:
        prot = [p for p in parts if p.type_byte == MBR_TYPE_EFI_PROTECTIVE]
        covers = bool(prot) and prot[0].first_lba == 1 and prot[0].last_lba >= (len(img) // SECTOR) - 2
        report.add("protective_mbr", "GPT disk has a protective MBR covering the whole disk",
                   REQUIRED, bool(prot) and covers,
                   f"type 0xEE entries: {[(p.first_lba, p.sectors) for p in prot]}, "
                   f"image is {len(img) // SECTOR} sectors")
    elif expect_gpt is False:
        report.add("legacy_active", "exactly one partition is marked active", REQUIRED, len(active) == 1,
                   f"{len(active)} active partition(s)")
    else:
        report.add("mbr_active", "at most one partition is marked active", REQUIRED, len(active) <= 1,
                   f"{len(active)} active partition(s)")
    return parts


# ------------------------------------------------------------------ disk: GPT

def parse_gpt(img: bytes, report: Report) -> list[Partition]:
    total_sectors = len(img) // SECTOR
    if total_sectors < 34:
        report.add("gpt_header", "GPT header is readable", REQUIRED, False, "image too small")
        return []

    hdr = img[SECTOR:SECTOR + 92]
    report.add("gpt_signature", 'LBA1 starts with "EFI PART"', REQUIRED, hdr[0:8] == b"EFI PART",
               repr(hdr[0:8]))

    hdr_size = u32(hdr, 12)
    stored_crc = u32(hdr, 16)
    calc_crc = zlib.crc32(hdr[:16] + b"\0\0\0\0" + hdr[20:hdr_size]) & 0xFFFFFFFF
    report.add("gpt_header_crc", "GPT header CRC32 matches", REQUIRED, stored_crc == calc_crc,
               f"stored 0x{stored_crc:08x}, computed 0x{calc_crc:08x}")

    cur, backup = u64(hdr, 24), u64(hdr, 32)
    first_usable, last_usable = u64(hdr, 40), u64(hdr, 48)
    entry_lba, n_entries, entry_size = u64(hdr, 72), u32(hdr, 80), u32(hdr, 84)
    entries_crc = u32(hdr, 88)

    ok_bounds = cur == 1 and first_usable >= 34 and last_usable < total_sectors and entry_size >= 128
    report.add("gpt_bounds", "GPT header describes an array that fits the disk", REQUIRED, ok_bounds,
               f"current={cur} usable={first_usable}..{last_usable} entries@{entry_lba} "
               f"n={n_entries} size={entry_size} of {total_sectors} sectors")
    if not ok_bounds:
        return []

    raw_entries = img[entry_lba * SECTOR: entry_lba * SECTOR + n_entries * entry_size]
    calc = zlib.crc32(raw_entries) & 0xFFFFFFFF
    report.add("gpt_entries_crc", "partition entry array CRC32 matches", REQUIRED, calc == entries_crc,
               f"stored 0x{entries_crc:08x}, computed 0x{calc:08x}")

    # The backup header is what makes a GPT disk recoverable instead of bricked.
    if backup < total_sectors:
        bh = img[backup * SECTOR: backup * SECTOR + 92]
        b_crc = u32(bh, 16)
        b_calc = zlib.crc32(bh[:16] + b"\0\0\0\0" + bh[20:u32(bh, 12)]) & 0xFFFFFFFF if bh[0:8] == b"EFI PART" else None
        report.add("gpt_backup_header", "backup GPT header is present and valid", REQUIRED,
                   bh[0:8] == b"EFI PART" and b_crc == b_calc,
                   f"backup LBA {backup}: {'missing' if bh[0:8] != b'EFI PART' else f'crc 0x{b_crc:08x} vs 0x{b_calc:08x}'}")
    else:
        report.add("gpt_backup_header", "backup GPT header is present and valid", REQUIRED, False,
                   f"backup LBA {backup} is outside the image")

    parts = []
    for i in range(n_entries):
        e = raw_entries[i * entry_size:(i + 1) * entry_size]
        if len(e) < 128:
            break
        tguid = guid_text(e[0:16])
        if tguid == GPT_UNUSED:
            continue
        first, last = u64(e, 32), u64(e, 40)
        name = e[56:128].decode("utf-16-le", "replace").split("\0")[0]
        parts.append(Partition(i, first, last - first + 1, type_guid=tguid, name=name, attrs=u64(e, 48)))
        report.add(f"gpt_entry{i}_bounds", f"partition {i} ({tguid[:8]}) fits the disk",
                   REQUIRED, first > first_usable - 1 and last <= last_usable and last >= first,
                   f"LBA {first}..{last}, usable {first_usable}..{last_usable}")
    return parts


# ------------------------------------------------------------------ disk: FAT

def parse_fat(img: bytes, part: Partition, report: Report, prefix: str = "esp"):
    """Parse the FAT volume in a partition; returns a small volume object."""
    base = part.first_lba * SECTOR
    bpb = img[base:base + SECTOR]
    if len(bpb) < SECTOR:
        report.add(f"{prefix}_bpb", "boot sector of the EFI System Partition is readable", REQUIRED, False)
        return None
    bytes_per_sector = u16(bpb, 11)
    sectors_per_cluster = bpb[13]
    reserved = u16(bpb, 14)
    n_fats = bpb[16]
    root_entries = u16(bpb, 17)
    total16 = u16(bpb, 19)
    fat16_size = u16(bpb, 22)
    total32 = u32(bpb, 32)
    fat32_size = u32(bpb, 36)
    root_cluster = u32(bpb, 44)
    fstype = bpb[0x52:0x5A].decode("latin-1").strip()

    total_sectors = total16 or total32
    fatsz = fat16_size or fat32_size
    ok = (bytes_per_sector in (512, 1024, 2048, 4096) and sectors_per_cluster in (1, 2, 4, 8, 16, 32, 64, 128)
          and n_fats >= 1 and fatsz > 0 and total_sectors > 0)
    report.add(f"{prefix}_bpb", "FAT boot sector has a coherent BPB", REQUIRED, ok,
               f"{bytes_per_sector}B sectors, {sectors_per_cluster}/cluster, {n_fats} FATs, "
               f"root {root_entries} entries, total {total_sectors}")
    if not ok:
        return None

    root_sectors = (root_entries * 32 + bytes_per_sector - 1) // bytes_per_sector
    data_start = reserved + n_fats * fatsz + root_sectors
    cluster_count = (total_sectors - data_start) // sectors_per_cluster

    # FAT type is defined by cluster count, not by the label in the BPB. A volume
    # whose BPB disagrees is a real corruption signal (and is exactly what a
    # half-finished mkfs/fdisk leaves behind).
    if cluster_count < 4085:
        declared_fs, kind = "FAT12", 12
    elif cluster_count < 65525:
        declared_fs, kind = "FAT16", 16
    else:
        declared_fs, kind = "FAT32", 32
    report.add(f"{prefix}_fat_type", "volume is FAT12/16/32 as its cluster count implies",
               REQUIRED, fstype.upper().startswith(declared_fs) or fstype == "",
               f"cluster count {cluster_count} implies {declared_fs}, BPB says {fstype!r}")

    class Vol:
        pass
    v = Vol()
    v.img, v.base, v.bpb = img, base, bpb
    v.bytes_per_sector, v.spc, v.reserved, v.n_fats = bytes_per_sector, sectors_per_cluster, reserved, n_fats
    v.fatsz, v.root_entries, v.root_sectors, v.data_start = fatsz, root_entries, root_sectors, data_start
    v.clusters, v.kind, v.root_cluster = cluster_count, kind, root_cluster
    v.fat_off = base + reserved * bytes_per_sector
    v.root_off = base + (reserved + n_fats * fatsz) * bytes_per_sector
    v.data_off = base + data_start * bytes_per_sector
    v.fstype = fstype
    return v


def fat_next_cluster(v, cluster):
    if v.kind == 12:
        off = v.fat_off + cluster + cluster // 2
        val = u16(v.img, off)
        return (val >> 4) if cluster & 1 else (val & 0x0FFF)
    if v.kind == 16:
        return u16(v.img, v.fat_off + cluster * 2)
    return u32(v.img, v.fat_off + cluster * 4) & 0x0FFFFFFF


def fat_eoc(v, c):
    return c >= (0xFF8 if v.kind == 12 else 0xFFF8 if v.kind == 16 else 0x0FFFFFF8)


def fat_chain(v, start, limit=1 << 20):
    chain, c, seen = [], start, set()
    while c >= 2 and not fat_eoc(v, c) and c not in seen and len(chain) < limit:
        seen.add(c)
        chain.append(c)
        c = fat_next_cluster(v, c)
    if c >= 2:
        chain.append(c)
    return chain


def fat_cluster_bytes(v, cluster):
    off = v.data_off + (cluster - 2) * v.spc * v.bytes_per_sector
    return v.img[off:off + v.spc * v.bytes_per_sector]


def fat_dir_entries(v, chain_clusters):
    out = []
    for cl in chain_clusters:
        data = fat_cluster_bytes(v, cl)
        for i in range(0, len(data), 32):
            e = data[i:i + 32]
            if len(e) < 32 or e[0] == 0x00:
                return out
            if e[0] == 0xE5 or e[11] == 0x0F:          # deleted / LFN entry
                continue
            name = e[0:8].decode("latin-1").rstrip(" ")
            ext = e[8:11].decode("latin-1").rstrip(" ")
            out.append({
                "name": name + ("." + ext if ext else ""),
                "attr": e[11],
                "size": u32(e, 28),
                "cluster": (u16(e, 20) << 16) | u16(e, 26),
            })
    return out


def fat_root_entries(v):
    if v.kind == 32:
        return fat_dir_entries(v, fat_chain(v, v.root_cluster))
    out = []
    data = v.img[v.root_off:v.root_off + v.root_sectors * v.bytes_per_sector]
    for i in range(0, len(data), 32):
        e = data[i:i + 32]
        if len(e) < 32 or e[0] == 0x00:
            break
        if e[0] == 0xE5 or e[11] == 0x0F:
            continue
        name = e[0:8].decode("latin-1").rstrip(" ")
        ext = e[8:11].decode("latin-1").rstrip(" ")
        out.append({"name": name + ("." + ext if ext else ""), "attr": e[11],
                    "size": u32(e, 28), "cluster": (u16(e, 20) << 16) | u16(e, 26)})
    return out


def fat_lookup(v, path: str):
    """Case-insensitive path lookup; returns the directory entry or None."""
    parts = [p for p in re.split(r"[\\/]+", path) if p]
    entries = fat_root_entries(v)
    entry = None
    for i, want in enumerate(parts):
        entry = next((e for e in entries if e["name"].upper() == want.upper()), None)
        if entry is None:
            return None
        if i + 1 < len(parts):
            if not (entry["attr"] & 0x10):
                return None
            entries = fat_dir_entries(v, fat_chain(v, entry["cluster"]))
    return entry


def fat_read_file(v, entry) -> bytes:
    chain = fat_chain(v, entry["cluster"])
    data = b"".join(fat_cluster_bytes(v, c) for c in chain)
    return data[:entry["size"]]


# ------------------------------------------------------------- disk: EFI app

def parse_pe(data: bytes):
    """Return (machine, subsystem, magic) or None if it is not a PE image."""
    if len(data) < 0x40 or data[0:2] != b"MZ":
        return None
    pe_off = u32(data, 0x3C)
    if pe_off + 24 > len(data) or data[pe_off:pe_off + 4] != b"PE\0\0":
        return None
    machine = u16(data, pe_off + 4)
    opt_size = u16(data, pe_off + 20)
    opt = pe_off + 24
    if opt + 70 > len(data):
        return None
    magic = u16(data, opt)
    subsystem = u16(data, opt + 68)
    return {"machine": machine, "subsystem": subsystem, "magic": magic, "opt_size": opt_size}


# --------------------------------------------------------- disk: loader (legacy)

LOADER_MARKERS = {"grub": b"GRUB", "lilo": b"LILO", "syslinux": b"SYSLINUX", "ntldr": b"NTLDR"}


def check_legacy_loader(img: bytes, parts: list[Partition], report: Report, want: str | None):
    """Second-stage loader requirements for the legacy/CSM path."""
    active = [p for p in parts if p.index is not None and img[0x1BE + p.index * 16] == 0x80]
    vbr_ok = vbr_detail = None
    if active:
        p = active[0]
        off = p.first_lba * SECTOR
        vbr = img[off:off + SECTOR]
        if len(vbr) == SECTOR:
            vbr_sig = u16(vbr, 510) == 0x55AA
            jump = vbr[0] in (0xEB, 0xE9)
            vbr_ok = vbr_sig and jump
            vbr_detail = f"VBR at LBA {p.first_lba}: signature={'ok' if vbr_sig else 'missing'}, jump={'ok' if jump else 'missing'}"
            report.add("legacy_vbr", "active partition starts with a bootable volume record",
                       REQUIRED, vbr_ok, vbr_detail)
        else:
            report.add("legacy_vbr", "active partition starts with a bootable volume record",
                       REQUIRED, False, f"VBR at LBA {p.first_lba} is outside the image")

    found = {k: (img[:4096].upper().find(m) >= 0) for k, m in LOADER_MARKERS.items()}
    identified = [k for k, v in found.items() if v]
    report.add("legacy_loader_id", "first-stage bootstrap is identifiable", INFO, True,
               f"markers in the first 4 KB: {identified or 'none'}")
    if want:
        report.add("legacy_loader", f"firmware/boot loader is {want}", REQUIRED, want in identified,
                   f"looked for {LOADER_MARKERS[want]!r}; found {identified or 'nothing'}")
        # GRUB keeps core.img outside the partition table; a GPT disk must not
        # have it where the GPT entries live.
        if want == "grub" and any(p.type_guid for p in parts):
            gap_used = any(img[l * SECTOR:(l + 1) * SECTOR] for l in range(34, 2048))
            report.add("grub_coreimg_room", "core.img area between the GPT and the first partition is usable",
                       RECOMMENDED, True, "GPT reserves LBA1-33; GRUB installs core.img after that"
                       if gap_used else "gap appears empty (firmware may use its own path)")


# ------------------------------------------------------------ disk: requirements

def check_disk(img: bytes, policy: str, loader: str | None) -> Report:
    r = Report()
    need_uefi = policy in ("uefi", "dual")
    need_legacy = policy in ("legacy", "dual")

    # Which table does the disk actually have?
    has_protective = any(img[0x1BE + i * 16 + 4] == MBR_TYPE_EFI_PROTECTIVE for i in range(4)) if len(img) >= SECTOR else False
    gpt_sig = len(img) >= 2 * SECTOR and img[SECTOR:SECTOR + 8] == b"EFI PART"

    r.add("disk_present", "a disk image was provided", REQUIRED, len(img) > 0, f"{len(img)} bytes")
    parts = parse_mbr(img, r, expect_gpt=True if (need_uefi and (has_protective or gpt_sig)) else (False if need_legacy and not has_protective and not gpt_sig else None))

    gpt_parts: list[Partition] = []
    if gpt_sig or has_protective:
        gpt_parts = parse_gpt(img, r)

    esp = next((p for p in gpt_parts if p.type_guid == GPT_ESP), None)
    if need_uefi:
        r.add("esp_present", "an EFI System Partition (type C12A7328-...) exists", REQUIRED, esp is not None,
              f"partitions: {[(p.index, p.type_guid, p.name) for p in gpt_parts]}" if gpt_parts else "no GPT")
        if esp:
            v = parse_fat(img, esp, r)
            if v:
                # The removable-media path is what firmware falls back to when
                # there is no Boot#### variable: \EFI\BOOT\BOOT<ARCH>.EFI.
                app = None
                for path in (r"\EFI\BOOT\BOOTX64.EFI", r"\EFI\BOOT\BOOTIA32.EFI", r"\EFI\BOOT\BOOTAA64.EFI"):
                    app = fat_lookup(v, path)
                    if app:
                        break
                r.add("esp_boot_app", "ESP holds \\EFI\\BOOT\\BOOT{arch}.EFI (UEFI removable path)",
                      REQUIRED, app is not None,
                      "looked for BOOTX64.EFI / BOOTIA32.EFI / BOOTAA64.EFI in \\EFI\\BOOT")
                if app:
                    pe = parse_pe(fat_read_file(v, app))
                    if pe is None:
                        r.add("efi_pe_format", "boot application is a PE image", REQUIRED, False,
                              f"{app['name']}: no MZ/PE header")
                    else:
                        r.add("efi_pe_format", "boot application is a PE image", REQUIRED, True,
                              f"{app['name']}: machine 0x{pe['machine']:04x} "
                              f"({PE_MACHINES.get(pe['machine'], '?')}), subsystem "
                              f"{pe['subsystem']} ({PE_SUBSYSTEMS.get(pe['subsystem'], '?')})")
                        r.add("efi_pe32plus", "boot application is PE32+ (UEFI 2.10 s4.2)",
                              REQUIRED, pe["magic"] == 0x20B, f"magic 0x{pe['magic']:03x}")
                        r.add("efi_machine", "machine type matches the platform (x86-64 or IA32)",
                              REQUIRED, pe["machine"] in (0x8664, 0x014C, 0xAA64),
                              f"machine 0x{pe['machine']:04x} ({PE_MACHINES.get(pe['machine'], 'unknown')})")
                        r.add("efi_subsystem", "subsystem is an EFI image suitable for boot handoff",
                              REQUIRED, pe["subsystem"] in EFI_SUBSYSTEMS,
                              f"subsystem {pe['subsystem']} ({PE_SUBSYSTEMS.get(pe['subsystem'], '?')}); "
                              f"EFI_APPLICATION is {EFI_APP_SUBSYSTEM}")
    if need_legacy and not (has_protective or gpt_sig):
        check_legacy_loader(img, parts, r, loader)
    elif need_legacy:
        r.add("legacy_active", "exactly one partition is marked active", REQUIRED, False,
              "disk is GPT but the policy allows the legacy path; legacy boot needs an MBR with an active partition")
    if policy == "uefi" and not (gpt_sig or has_protective):
        r.add("uefi_table", "disk carries a GPT (with protective MBR) for the UEFI path",
              REQUIRED, False, "no protective MBR entry and no EFI PART header at LBA1")
    return r


# --------------------------------------------------------- platform: status word

def check_platform(status: int, policy: str, *, disk_capability: set[str] | None = None) -> Report:
    r = Report()
    f = decode_status(status)
    boot_mode_name = {CONSTS.get("MODE_DUAL", 0): "dual", CONSTS.get("MODE_LEGACY", 1): "legacy",
                      CONSTS.get("MODE_UEFI", 2): "uefi"}.get(f.get("policy_boot_mode", -1), "?")
    state_name = {CONSTS.get("LCK_IDLE", 0): "IDLE", CONSTS.get("LCK_MEASURING", 1): "MEASURING",
                  CONSTS.get("LCK_UNLOCKED", 2): "UNLOCKED", CONSTS.get("LCK_LOCKED", 3): "LOCKED"}.get(
        f.get("lock_state", -1), "?")

    bad_reserved = reserved_bits_set(status)
    r.add("status_reserved", "reserved status bits read as zero", REQUIRED, not bad_reserved,
          f"set: {bad_reserved}")

    r.add("platform_chain", "measurement chain is complete and matched (chain_ok)",
          REQUIRED, f.get("chain_ok") == 1, f"chain_ok={f.get('chain_ok')} state={state_name}")
    r.add("platform_arm", "enforcement was armed before measuring (arm_latched)",
          REQUIRED, f.get("arm_latched") == 1, f"arm_latched={f.get('arm_latched')}")
    r.add("platform_no_tamper", "no tamper latch is set", REQUIRED, f.get("tamper_latch") == 0,
          f"tamper_latch={f.get('tamper_latch')}")
    r.add("platform_unlocked", "lock state is UNLOCKED", REQUIRED, state_name == "UNLOCKED",
          f"lock_state={state_name}")
    r.add("platform_reads", "media reads are permitted (ATA security not blocking the boot path)",
          REQUIRED, f.get("media_read_allow") == 1,
          f"media_read_allow={f.get('media_read_allow')} sec_locked={f.get('sec_locked')} "
          f"sec_frozen={f.get('sec_frozen')} erase_required={f.get('erase_required')}")
    r.add("platform_release", "chipset released the CPU (cpu_release)",
          REQUIRED, f.get("cpu_release") == 1,
          f"cpu_release={f.get('cpu_release')} deny={deny_name(f.get('boot_deny_reason', 0))}")
    r.add("platform_mode", "presented boot source is allowed by the chipset policy",
          REQUIRED, f.get("mode_ok") == 1,
          f"mode_ok={f.get('mode_ok')} boot_kind={f.get('boot_kind')} policy={boot_mode_name}")

    # Enforcement policy: a tampered or unverified chipset must grant nothing
    # destructive, and the refusal must be visible in the status word.
    armed = f.get("chain_ok") == 1 and f.get("tamper_latch") == 0
    destructive = f.get("erase_grant", 0) or f.get("reflash_grant", 0)
    r.add("platform_no_destructive_when_untrusted",
          "no erase/reflash grant while the chain is unverified or tampered",
          REQUIRED, armed or not destructive,
          f"erase_grant={f.get('erase_grant')} reflash_grant={f.get('reflash_grant')} "
          f"chain_ok={f.get('chain_ok')} tamper={f.get('tamper_latch')}")
    # Policy vs what the disk can actually do: a UEFI-only chipset in front of an
    # MBR-only disk cannot boot, and saying so here is cheaper than failing later.
    if disk_capability is not None:
        want = boot_mode_name
        capable = disk_capability
        ok = (want == "dual" and bool(capable)) or (want == "uefi" and "uefi" in capable) or (
            want == "legacy" and "legacy" in capable)
        r.add("platform_policy_matches_disk",
              "the disk can supply the boot source the chipset policy requires",
              REQUIRED, ok, f"policy requires {want}, disk offers {sorted(capable) or 'nothing'}")
    return r


# --------------------------------------------------- platform: transcript parity

LINE_RE = re.compile(r"^(?P<name>[a-z_]+)#(?P<cycle>\d+)\s+(?P<fields>.*)$")
FIELD_RE = re.compile(r"([a-z_]+)=([0-9a-fx/]+)")
STATE_NAME = {0: "IDLE", 1: "MEASURING", 2: "UNLOCKED", 3: "LOCKED"}


def check_transcript(path: Path, verbose: bool = False) -> tuple[bool, list[str]]:
    """Check the decoder (and the documented deny table) against simulated RTL.

    Every transcript line carries the same information twice: named ports and
    the packed status word. Software reads the packed word, so this walks all
    cycles and asserts they agree, then re-derives cpu_release/boot_deny_reason
    from the named fields and compares with what the RTL produced.
    """
    problems: list[str] = []
    cycles = 0
    destructive_leaks = 0
    for line in path.read_text().splitlines():
        m = LINE_RE.match(line)
        if not m:
            continue
        fields = {k: v for k, v in FIELD_RE.findall(m.group("fields"))}
        cycles += 1
        where = f"{m.group('name')}#{m.group('cycle')}"
        word = int(fields["st"], 16)
        f = decode_status(word)

        pairs = [("chain", "chain_ok"), ("tamper", "tamper_latch"), ("arml", "arm_latched"),
                 ("ext", "ext_count"), ("rel", "cpu_release"), ("ign", "ignored_measurements"),
                 ("wr", "media_write_allow"), ("rd", "media_read_allow"),
                 ("ers", "erase_grant"), ("rfl", "reflash_grant"),
                 ("ersd", "erase_denied_tamper"), ("rfld", "reflash_denied_tamper"),
                 ("deny", "boot_deny_reason"), ("abrt", "abort_code"), ("fail", "fail_count")]
        for port, bitfield in pairs:
            if port in fields and int(fields[port]) != f.get(bitfield, -1):
                problems.append(f"{where}: status[{bitfield}]={f.get(bitfield)} but port {port}={fields[port]}")
        if "state" in fields and int(fields["state"]) != f.get("lock_state", -1):
            problems.append(f"{where}: status[lock_state]={f.get('lock_state')} but port state={fields['state']}")
        if "sec" in fields and len(fields["sec"]) == 3:
            e, b, fr = (int(c) for c in fields["sec"])
            if (e, b, fr) != (f.get("sec_enabled"), f.get("sec_locked"), f.get("sec_frozen")):
                problems.append(f"{where}: sec ports {e}{b}{fr} vs status "
                                f"{f.get('sec_enabled')}{f.get('sec_locked')}{f.get('sec_frozen')}")

        # Re-derive the handoff decision from the documented priority order in
        # rtl/vchip_top.v and require the hardware to have produced the same one.
        chain, tamper = f.get("chain_ok"), f.get("tamper_latch")
        boot, mode_ok = f.get("boot_kind"), f.get("mode_ok")
        rel_expected = 1 if (chain and mode_ok and boot) else 0
        if rel_expected != (1 if fields.get("rel") == "1" else 0):
            problems.append(f"{where}: cpu_release={fields.get('rel')} but chain/mode/boot imply {rel_expected}")
        if rel_expected:
            deny_expected = CONSTS["DENY_NONE"]
        elif tamper:
            deny_expected = CONSTS["DENY_TAMPER"]
        elif not chain:
            deny_expected = CONSTS["DENY_CHAIN"]
        elif not boot:
            deny_expected = CONSTS["DENY_SOURCE"]
        elif not mode_ok:
            deny_expected = CONSTS["DENY_MODE"]
        else:
            deny_expected = CONSTS["DENY_ARM"]
        if "deny" in fields and int(fields["deny"]) != deny_expected:
            problems.append(f"{where}: deny={fields['deny']} ({deny_name(int(fields['deny']))}) but "
                            f"documented table says {deny_expected} ({deny_name(deny_expected)})")

        # The enforcement decision the user asked for: a tampered host gets no
        # destructive command, in any cycle.
        if (tamper or not chain) and (f.get("erase_grant") or f.get("reflash_grant")):
            destructive_leaks += 1
            problems.append(f"{where}: destructive grant with chain_ok={chain} tamper={tamper}")

    if destructive_leaks:
        problems.append(f"{destructive_leaks} cycle(s) granted a destructive command to an untrusted platform")
    return (not problems), problems


# ------------------------------------------------------------------- fixtures

def build_pe32plus(machine=0x8664, subsystem=EFI_APP_SUBSYSTEM) -> bytes:
    """A minimal EFI application: DOS stub + PE32+ headers (no sections)."""
    opt = bytearray(240)
    struct.pack_into("<H", opt, 0, 0x20B)             # PE32+
    struct.pack_into("<I", opt, 16, 0x1000)           # AddressOfEntryPoint
    struct.pack_into("<Q", opt, 24, 0x400000)         # ImageBase
    struct.pack_into("<I", opt, 32, 0x1000)           # SectionAlignment
    struct.pack_into("<I", opt, 36, 0x200)            # FileAlignment
    struct.pack_into("<H", opt, 40, 2)                # MajorSubsystemVersion
    struct.pack_into("<I", opt, 56, 0x1000)           # SizeOfImage
    struct.pack_into("<I", opt, 60, 0x200)            # SizeOfHeaders
    struct.pack_into("<H", opt, 68, subsystem)        # Subsystem
    cof = struct.pack("<HHIIIHH", machine, 0, 0, 0, 0, len(opt), 0x0002)
    dos = bytearray(0x80)
    dos[0:2] = b"MZ"
    struct.pack_into("<I", dos, 0x3C, 0x80)
    body = bytes(dos) + b"PE\0\0" + cof + bytes(opt)
    return body + b"\0" * ((SECTOR - len(body) % SECTOR) % SECTOR)


def build_fat16_volume(vb: bytearray, base: int, label="EFI SYSTEM", files=None, fat_type_string="FAT16"):
    """Write a small FAT16 volume (2 KB clusters, one file) into vb at `base`."""
    files = files if files is not None else {r"\EFI\BOOT\BOOTX64.EFI": build_pe32plus()}
    bps, spc, reserved, n_fats = SECTOR, 4, 1, 2
    root_entries = 512
    clusters = 5200                                  # in the FAT16 range
    root_sectors = root_entries * 32 // bps
    fatsz = ((clusters + 2) * 2 + bps - 1) // bps
    total = reserved + n_fats * fatsz + root_sectors + clusters * spc

    bpb = vb[base:base + bps]
    bpb[0:3] = b"\xeb\x3c\x90"
    bpb[3:11] = b"MSWIN4.1"
    struct.pack_into("<H", bpb, 11, bps)
    bpb[13] = spc
    struct.pack_into("<H", bpb, 14, reserved)
    bpb[16] = n_fats
    struct.pack_into("<H", bpb, 17, root_entries)
    struct.pack_into("<H", bpb, 19, total if total < 0x10000 else 0)
    bpb[21] = 0xF8
    struct.pack_into("<H", bpb, 22, fatsz)
    struct.pack_into("<I", bpb, 28, 0)               # hidden sectors (partition)
    struct.pack_into("<I", bpb, 32, total if total >= 0x10000 else 0)
    bpb[0x36] = 0x80
    bpb[0x38] = 0x29
    struct.pack_into("<I", bpb, 0x39, 0x12345678)
    bpb[0x3D:0x48] = label.ljust(11)[:11].encode()
    bpb[0x52:0x5A] = fat_type_string.ljust(8)[:8].encode()
    struct.pack_into("<H", bpb, 510, 0x55AA)
    vb[base:base + bps] = bpb          # slice is a copy: write the sector back

    vol = base
    fat_off = vol + reserved * bps
    root_off = vol + (reserved + n_fats * fatsz) * bps
    data_off = vol + (reserved + n_fats * fatsz + root_sectors) * bps

    # FAT: reserved entries + end-of-chain for every cluster we hand out.
    for f in range(n_fats):
        off = fat_off + f * fatsz * bps
        struct.pack_into("<H", vb, off + 0, 0xFFF8)
        struct.pack_into("<H", vb, off + 2, 0xFFFF)

    # Directory tree: build it in memory, allocate clusters as needed.
    next_cluster = [2]

    def alloc():
        c = next_cluster[0]
        next_cluster[0] += 1
        return c

    def write_chain(data: bytes):
        start = alloc()
        cs = [start]
        need = max(1, (len(data) + spc * bps - 1) // (spc * bps))
        while len(cs) < need:
            cs.append(alloc())
        for i, c in enumerate(cs):
            off = data_off + (c - 2) * spc * bps
            vb[off:off + spc * bps] = data[i * spc * bps:(i + 1) * spc * bps].ljust(spc * bps, b"\0")
            nxt = cs[i + 1] if i + 1 < len(cs) else 0xFFFF
            for f in range(n_fats):
                struct.pack_into("<H", vb, fat_off + f * fatsz * bps + c * 2, nxt)
        return start

    def dirent(name8, ext3, attr, cluster, size):
        e = bytearray(32)
        e[0:8] = name8.ljust(8)[:8].encode()
        e[8:11] = ext3.ljust(3)[:3].encode()
        e[11] = attr
        struct.pack_into("<H", e, 20, (cluster >> 16) & 0xFFFF)
        struct.pack_into("<H", e, 26, cluster & 0xFFFF)
        struct.pack_into("<I", e, 28, size)
        return bytes(e)

    # Tree: \EFI (dir) -> \EFI\BOOT (dir) -> file
    tree: dict[str, list] = {}
    for path in files:
        parts = [p for p in re.split(r"[\\/]+", path) if p]
        node = tree
        for d in parts[:-1]:
            node = node.setdefault(d.upper(), {})
        node[parts[-1].upper()] = files[path]

    def emit_dir(node):
        entries = bytearray()
        subdirs_written = []
        for nm, val in node.items():
            base, _, ext = nm.partition(".")
            if isinstance(val, dict):
                c = alloc()
                entries += dirent(base, ext, 0x10, c, 0)
                subdirs_written.append((val, c))
            else:
                c = write_chain(val)
                entries += dirent(base, ext, 0x20, c, len(val))
        # '.' and '..' are not required by the checker but real volumes have them
        for val, c in subdirs_written:
            blob = emit_dir(val)
            off = data_off + (c - 2) * spc * bps
            vb[off:off + len(blob)] = blob
        return bytes(entries)

    root = emit_dir(tree)
    vb[root_off:root_off + len(root)] = root
    return ("fat16", total, next_cluster[0] - 2)


def build_mbr_disk(label=None, *, active=True, vbr_sig=True, loader_marker=b"GRUB", overlap=False,
                   partitions=None, disk_sectors=None) -> bytearray:
    """A BIOS/fdisk-style disk: MBR + one active FAT16 partition."""
    if partitions is None:
        partitions = ([(0x80, 0x0E, 2048), (0x00, 0x83, 5000)] if overlap
                      else [(0x80 if active else 0x00, 0x0E, 2048)])
    disk_sectors = disk_sectors or 2048 + len(partitions) * 6000 + 64
    img = bytearray(disk_sectors * SECTOR)
    img[0:3] = b"\xfa\x33\xc0"                       # cli; xor ax,ax
    if loader_marker:
        img[3:3 + len(loader_marker)] = loader_marker
    img[SECTOR // 2:SECTOR // 2 + 4] = b"\x90" * 4

    for i, (status, ptype, first) in enumerate(partitions[:4]):
        off = 0x1BE + i * 16
        img[off] = status
        img[off + 1:off + 4] = bytes([0xFE, 0xFF, 0xFF])          # CHS start (dummy, large disk)
        img[off + 4] = ptype
        img[off + 5:off + 8] = bytes([0xFE, 0xFF, 0xFF])
        struct.pack_into("<I", img, off + 8, first)
        struct.pack_into("<I", img, off + 12, 6000 if not overlap else 9000)
    struct.pack_into("<H", img, 510, 0x55AA)

    for i, (status, ptype, first) in enumerate(partitions[:4]):
        if ptype == MBR_TYPE_EMPTY:
            continue
        build_fat16_volume(img, first * SECTOR, label=label or "BOOT")
        if not vbr_sig:
            struct.pack_into("<H", img, first * SECTOR + 510, 0x0000)
    return img


def build_gpt_disk(*, esp=True, esp_type=GPT_ESP, boot_app=True, pe_subsystem=EFI_APP_SUBSYSTEM,
                   break_header_crc=False, break_entries_crc=False, break_backup=False,
                   break_fat_type=False, pe_machine=0x8664) -> bytearray:
    """A UEFI disk: protective MBR + GPT + FAT16 ESP with a PE32+ boot app."""
    sectors = 16384
    img = bytearray(sectors * SECTOR)

    # protective MBR
    img[0:3] = b"\xfa\x33\xc0"
    off = 0x1BE
    img[off] = 0x00
    img[off + 1:off + 4] = b"\x00\x02\x00"
    img[off + 4] = MBR_TYPE_EFI_PROTECTIVE
    img[off + 5:off + 8] = bytes([0xFF, 0xFF, 0xFF])
    struct.pack_into("<I", img, off + 8, 1)
    struct.pack_into("<I", img, off + 12, sectors - 1)
    struct.pack_into("<H", img, 510, 0x55AA)

    esp_first, esp_sectors = 2048, 8192
    entries = bytearray(128 * 128)
    if esp:
        e = entries[0:128]
        e[0:16] = guid_bytes(esp_type)
        e[16:32] = guid_bytes("11111111-2222-3333-4444-555555555555")
        struct.pack_into("<Q", e, 32, esp_first)
        struct.pack_into("<Q", e, 40, esp_first + esp_sectors - 1)
        struct.pack_into("<Q", e, 48, 0)
        e[56:56 + 2 * len("EFI System Partition")] = "EFI System Partition".encode("utf-16-le")
        entries[0:128] = e
    data_first = 10240 + 512
    if data_first + 512 < sectors - 34:
        e = entries[128:256]
        e[0:16] = guid_bytes(GPT_MICROSOFT_BASIC)
        e[16:32] = guid_bytes("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
        struct.pack_into("<Q", e, 32, data_first)
        struct.pack_into("<Q", e, 40, data_first + 511)
        e[56:56 + 2 * len("Data")] = "Data".encode("utf-16-le")
        entries[128:256] = e

    hdr = bytearray(92)
    hdr[0:8] = b"EFI PART"
    struct.pack_into("<I", hdr, 8, 0x00010000)
    struct.pack_into("<I", hdr, 12, 92)
    struct.pack_into("<I", hdr, 16, 0)
    struct.pack_into("<Q", hdr, 24, 1)
    struct.pack_into("<Q", hdr, 32, sectors - 1)
    struct.pack_into("<Q", hdr, 40, 34)
    struct.pack_into("<Q", hdr, 48, sectors - 34)
    hdr[56:72] = guid_bytes("deadbeef-0000-1111-2222-333344445555")
    struct.pack_into("<Q", hdr, 72, 2)
    struct.pack_into("<I", hdr, 80, 128)
    struct.pack_into("<I", hdr, 84, 128)
    struct.pack_into("<I", hdr, 88, zlib.crc32(entries) & 0xFFFFFFFF)
    struct.pack_into("<I", hdr, 16, zlib.crc32(bytes(hdr)) & 0xFFFFFFFF)
    if break_header_crc:
        struct.pack_into("<I", hdr, 16, 0xDEADBEEF)

    img[SECTOR:SECTOR + 92] = hdr
    img[2 * SECTOR:2 * SECTOR + len(entries)] = entries
    if break_entries_crc:
        img[2 * SECTOR + 40] ^= 0xFF

    # backup: entries then header at the last two regions
    b_entries_off = (sectors - 33) * SECTOR
    img[b_entries_off:b_entries_off + len(entries)] = entries
    bh = bytearray(hdr)
    struct.pack_into("<Q", bh, 24, sectors - 1)
    struct.pack_into("<Q", bh, 32, 1)
    struct.pack_into("<Q", bh, 72, sectors - 33)
    struct.pack_into("<I", bh, 16, 0)                      # zero before CRC, as the format requires
    struct.pack_into("<I", bh, 16, zlib.crc32(bytes(bh)) & 0xFFFFFFFF)
    img[(sectors - 1) * SECTOR:(sectors - 1) * SECTOR + 92] = bh
    if break_backup:
        img[(sectors - 1) * SECTOR:(sectors - 1) * SECTOR + 8] = b"\0" * 8

    if esp:
        files = {}
        if boot_app:
            files[r"\EFI\BOOT\BOOTX64.EFI"] = build_pe32plus(pe_machine, pe_subsystem)
        build_fat16_volume(img, esp_first * SECTOR, label="EFI SYSTEM", files=files,
                           fat_type_string="FAT32" if break_fat_type else "FAT16")
    return img


# ------------------------------------------------------------------- selftest

def selftest() -> int:
    failures = []

    def expect(name, checks: Report, want: str, should_fail: bool, policy="uefi"):
        got = {c.id: c.ok for c in checks.checks}
        if want not in got:
            failures.append(f"{name}: no check with id {want}")
            return
        if should_fail and got[want] is not False:
            failures.append(f"{name}: expected {want} to FAIL, got {Check(want, '', '', got[want]).verdict}")
        if not should_fail and got[want] is not True:
            failures.append(f"{name}: expected {want} to PASS, got {Check(want, '', '', got[want]).verdict}")

    # --- a good GPT/UEFI disk must pass everything REQUIRED
    good = build_gpt_disk()
    r = check_disk(good, "uefi", None)
    bad = [c for c in r.failed()]
    if bad:
        failures.append("good UEFI disk failed: " + "; ".join(f"{c.id}: {c.detail}" for c in bad))
    for cid in ("esp_present", "esp_boot_app", "efi_pe32plus", "efi_subsystem", "gpt_header_crc",
                "gpt_entries_crc", "gpt_backup_header", "protective_mbr"):
        expect("good UEFI disk", r, cid, False)

    # --- GPT/UEFI negatives
    expect("GPT without an ESP", check_disk(build_gpt_disk(esp=False), "uefi", None), "esp_present", True)
    expect("GPT with a data partition as ESP", check_disk(build_gpt_disk(esp_type=GPT_MICROSOFT_BASIC), "uefi", None),
           "esp_present", True)
    expect("ESP without the boot application", check_disk(build_gpt_disk(boot_app=False), "uefi", None),
           "esp_boot_app", True)
    expect("boot app is not EFI_APPLICATION", check_disk(build_gpt_disk(pe_subsystem=3), "uefi", None),
           "efi_subsystem", True)
    expect("boot app has the wrong machine type", check_disk(build_gpt_disk(pe_machine=0x01C0), "uefi", None),
           "efi_machine", True)
    expect("corrupt GPT header CRC", check_disk(build_gpt_disk(break_header_crc=True), "uefi", None),
           "gpt_header_crc", True)
    expect("corrupt GPT entry array CRC", check_disk(build_gpt_disk(break_entries_crc=True), "uefi", None),
           "gpt_entries_crc", True)
    expect("missing backup GPT header", check_disk(build_gpt_disk(break_backup=True), "uefi", None),
           "gpt_backup_header", True)
    expect("volume whose BPB lies about FAT type",
           check_disk(build_gpt_disk(break_fat_type=True), "uefi", None), "esp_fat_type", True)

    # --- legacy / fdisk disk
    legacy = build_mbr_disk()
    rl = check_disk(legacy, "legacy", "grub")
    bad = [c for c in rl.failed()]
    if bad:
        failures.append("good legacy disk failed: " + "; ".join(f"{c.id}: {c.detail}" for c in bad))
    expect("good legacy disk", rl, "mbr_signature", False)
    expect("good legacy disk", rl, "legacy_active", False)
    expect("good legacy disk", rl, "legacy_vbr", False)
    expect("good legacy disk", rl, "legacy_loader", False)
    expect("MBR with no active partition", check_disk(build_mbr_disk(active=False), "legacy", "grub"),
           "legacy_active", True)
    expect("VBR without a boot signature", check_disk(build_mbr_disk(vbr_sig=False), "legacy", "grub"),
           "legacy_vbr", True)
    expect("LILO when GRUB is expected", check_disk(build_mbr_disk(loader_marker=b"LILO"), "legacy", "grub"),
           "legacy_loader", True)
    expect("MBR without the 0x55AA signature",
           check_disk(build_mbr_disk()[:510] + b"\0\0", "legacy", "grub"), "mbr_signature", True)
    expect("overlapping partitions", check_disk(build_mbr_disk(overlap=True), "legacy", "grub"),
           "mbr_no_overlap", True)
    expect("GPT disk under a legacy-only policy", check_disk(build_gpt_disk(), "legacy", "grub"),
           "legacy_active", True)
    expect("MBR disk under a UEFI-only policy", check_disk(build_mbr_disk(), "uefi", None),
           "uefi_table", True)

    # --- platform / status word
    def st(**kw):
        word = 0
        for name, val in kw.items():
            for lo, hi, fname in LAYOUT:
                if fname == name:
                    word |= (val & ((1 << (hi - lo + 1)) - 1)) << lo
        return word

    unlocked = st(chain_ok=1, lock_state=2, arm_latched=1, mode_ok=1, media_read_allow=1,
                  media_write_allow=1, cpu_release=1, boot_kind=2, policy_boot_mode=2)
    r = check_platform(unlocked, "uefi", disk_capability={"uefi"})
    bad = [c for c in r.failed()]
    if bad:
        failures.append("healthy status word failed: " + "; ".join(f"{c.id}: {c.detail}" for c in bad))
    tampered = st(chain_ok=0, lock_state=3, tamper_latch=1, arm_latched=1, boot_kind=2, policy_boot_mode=2,
                  boot_deny_reason=CONSTS["DENY_TAMPER"])
    expect("tampered status", check_platform(tampered, "uefi", disk_capability=set()), "platform_no_tamper", True)
    expect("tampered status", check_platform(tampered, "uefi", disk_capability=set()), "platform_chain", True)
    expect("tampered status", check_platform(tampered, "uefi", disk_capability=set()), "platform_no_destructive_when_untrusted", False)
    leak = st(chain_ok=0, lock_state=3, tamper_latch=1, erase_grant=1)
    expect("destructive grant while tampered", check_platform(leak, "uefi", disk_capability=set()),
           "platform_no_destructive_when_untrusted", True)
    stealth = st(chain_ok=1, lock_state=2, arm_latched=0, mode_ok=1, media_read_allow=1, cpu_release=1,
                 boot_kind=2, policy_boot_mode=2)
    expect("enforcement never armed", check_platform(stealth, "uefi", disk_capability={"uefi"}), "platform_arm", True)
    locked = st(chain_ok=0, lock_state=3, arm_latched=1, boot_kind=1, policy_boot_mode=2,
                boot_deny_reason=CONSTS["DENY_CHAIN"])
    expect("locked chipset", check_platform(locked, "uefi", disk_capability={"legacy"}), "platform_release", True)
    # a UEFI-only chipset in front of an MBR-only disk
    expect("policy does not match the disk", check_platform(unlocked, "uefi", disk_capability={"legacy"}),
           "platform_policy_matches_disk", True)
    # reserved bits are a real failure: the layout changed under the software
    expect("set reserved bit", check_platform(unlocked | (1 << 50), "uefi", disk_capability={"uefi"}), "status_reserved", True)
    # status layout must cover the word without gaps or overlaps
    seen: dict[int, str] = {}
    for lo, hi, name in LAYOUT:
        for bit in range(lo, hi + 1):
            if bit in seen:
                failures.append(f"status layout: bit {bit} claimed by {seen[bit]} and {name}")
            seen[bit] = name
    missing = [b for b in range(64) if b not in seen]
    if missing:
        failures.append(f"status layout has no assignment for bits {missing}")

    for f in failures:
        print(f"  FAIL {f}")
    print(f"\nselftest: {'all checks behaved as expected' if not failures else f'{len(failures)} failure(s)'}")
    return 1 if failures else 0


# ----------------------------------------------------------------------- main

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--image", type=Path, help="disk image to check")
    ap.add_argument("--policy", choices=["legacy", "uefi", "dual"], default="dual",
                    help="boot-mode policy (mirrors policy_boot_mode in the RTL)")
    ap.add_argument("--loader", choices=list(LOADER_MARKERS), help="expected legacy loader")
    ap.add_argument("--status", help="vchip status word, e.g. 0x0010000000000003")
    ap.add_argument("--transcript", type=Path, help="sim/vchip transcript to check platform parity against")
    ap.add_argument("--selftest", action="store_true", help="build fixtures in memory and assert verdicts")
    ap.add_argument("--fixtures", type=Path, help="write the fixture disk images to this directory")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--layout-json", action="store_true",
                    help="print the RTL-derived status layout and constants (used by "
                         "tools/verify_bootchain.mjs to check the JS mirror)")
    args = ap.parse_args()

    if args.layout_json:
        print(json.dumps({
            "layout": [{"lo": lo, "hi": hi, "name": name} for lo, hi, name in LAYOUT],
            "consts": CONSTS,
        }, indent=2))
        return 0

    if args.selftest:
        return selftest()

    if args.fixtures:
        d = args.fixtures
        d.mkdir(parents=True, exist_ok=True)
        (d / "gpt_uefi_ok.img").write_bytes(build_gpt_disk())
        (d / "gpt_no_esp.img").write_bytes(build_gpt_disk(esp=False))
        (d / "gpt_bad_crc.img").write_bytes(build_gpt_disk(break_header_crc=True))
        (d / "mbr_legacy_ok.img").write_bytes(build_mbr_disk())
        (d / "mbr_no_active.img").write_bytes(build_mbr_disk(active=False))
        for p in sorted(d.glob("*.img")):
            print(f"wrote {p} ({p.stat().st_size // 1024} KB)")
        return 0

    reports: list[tuple[str, Report]] = []
    exit_code = 0
    capability: set[str] = set()

    if args.image:
        img = args.image.read_bytes()
        if len(img) >= 2 * SECTOR and img[SECTOR:SECTOR + 8] == b"EFI PART":
            capability.add("uefi")
        if len(img) >= SECTOR and any(img[0x1BE + i * 16 + 4] not in (0x00, MBR_TYPE_EFI_PROTECTIVE)
                                      for i in range(4)):
            capability.add("legacy")
        reports.append((f"disk: {args.image}", check_disk(img, args.policy, args.loader)))

    if args.status:
        word = int(args.status, 16)
        reports.append(("platform: status word", check_platform(word, args.policy, capability or None)))

    if args.transcript:
        ok, problems = check_transcript(args.transcript)
        r = Report()
        r.add("transcript_parity", "decoder and deny table agree with the simulated RTL on every cycle",
              REQUIRED, ok, f"{len(problems)} problem(s); first: {problems[0]}" if problems else "")
        reports.append((f"platform: {args.transcript}", r))

    if not reports:
        ap.print_help()
        return 2

    out = []
    for title, rep in reports:
        out.append(rep.render(title))
        exit_code = exit_code or (1 if rep.failed() else 0)
    if args.json:
        print(json.dumps({t: r.to_dict() for t, r in reports}, indent=2))
    else:
        print("\n\n".join(out))
        print()
        passed = sum(1 for _, r in reports for c in r.checks if c.verdict == "PASS")
        failed = sum(1 for _, r in reports for c in r.checks if c.verdict == "FAIL")
        warned = sum(1 for _, r in reports for c in r.checks if c.verdict == "WARN")
        skipped = sum(1 for _, r in reports for c in r.checks if c.verdict == "SKIP")
        print(f"{passed} passed, {failed} failed, {warned} warning(s), {skipped} skipped "
              f"(chipset policy: {args.policy})")
        if exit_code:
            print("BOOT DENIED: at least one REQUIRED requirement failed")
        else:
            print("requirements met for the requested policy")
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
