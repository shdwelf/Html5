/* CHIPWRIGHT · cw-data-uefi.js — UEFI / BIOS ROM structure.
 *
 * A platform-firmware dump is a nested container format with three layers that
 * people routinely conflate: the *flash* (what the SPI chip holds), the
 * *regions* (what the descriptor carves it into), and the *volumes* (what the
 * firmware itself parses). Getting the layer wrong is how a repair writes a
 * per-board MAC address over a different board's, or bricks a Management
 * Engine that was fine to begin with.
 *
 * Evidence tags: std / tool / report / recall.
 */

/* ------------------------------------------------------------------ *
 * 1. Intel Flash Descriptor — the thing that decides whether the rest
 *    of the dump is even yours to write.
 *    ev: "tool" (flashrom / coreboot's ifdtool implement exactly this).
 * ------------------------------------------------------------------ */

export const IFD_SIGNATURE = 0x0ff0a55a; // little-endian at descriptor offset 0x10

export const IFD_REGIONS = [
  { index: 0, name: "Descriptor", what: "The descriptor itself. Contains the flash geometry and, on many platforms, the LAN MAC. Never write this from another board's dump." },
  { index: 1, name: "BIOS", what: "The actual firmware volumes. This is the only region a normal firmware update touches." },
  { index: 2, name: "ME (Management Engine)", what: "A separate processor's firmware with its own flash region. Carries per-platform state and, on vPro parts, provisioning data. Writing another board's ME region can break boot or leave the platform in an unprovisioned state." },
  { index: 3, name: "GbE (Gigabit Ethernet)", what: "Holds the MAC address and the GbE configuration. This is the region that makes a cloned dump clone a network identity." },
  { index: 4, name: "PDR (Platform Data)", what: "Optional, board-specific." },
  { index: 5, name: "Region 5", what: "Vendor-defined on newer platforms." },
  { index: 6, name: "Region 6", what: "Vendor-defined." },
  { index: 7, name: "EC (Embedded Controller)", what: "On laptops, a separate controller's firmware. Usually not in the main SPI flash at all." },
];

export const IFD_LAYOUT = {
  signatureOffset: 0x10,
  signature: IFD_SIGNATURE,
  mapOffset: 0x04, // within the descriptor *map*, which itself starts at 0x10
  note: "The descriptor's first 0x10 bytes are a reserved/ffilled preamble; the signature 5A A5 F0 0F sits at 0x10 and is the only reliable way to find it. Region base/limit pairs are 12-bit block numbers scaled by the component's erase granularity, so a region's byte offset is (base << 12) and its length is ((limit << 12) | 0xFFF) - (base << 12) + 1.",
  ev: "tool",
};

/* ------------------------------------------------------------------ *
 * 2. UEFI Firmware Volume — the container inside the BIOS region
 *    ev: "std" (PI Specification, Volume 3: Firmware Volume header).
 * ------------------------------------------------------------------ */

/** The FFS "file system" GUID that starts every UEFI firmware volume. */
export const FV_FILESYSTEM_GUID = "7a9354d9-0468-444a-81ce-0bf617d890df";
export const FV_FILESYSTEM_GUID_BYTES = [0xd9, 0x54, 0x93, 0x7a, 0x68, 0x04, 0x4a, 0x44, 0x81, 0xce, 0x0b, 0xf6, 0x17, 0xd8, 0x90, 0xdf];
export const FV_FILESYSTEM2_GUID = "8c8ce578-8a3d-4f1c-9935-896185c32dd3";
export const FV_FILESYSTEM2_GUID_BYTES = [0x78, 0xe5, 0x8c, 0x8c, 0x3d, 0x8a, 0x1c, 0x4f, 0x99, 0x35, 0x89, 0x61, 0x85, 0xc3, 0x2d, 0xd3];

export const FV_HEADER = [
  { off: 0x00, size: 16, field: "ZeroVector", meaning: "Sixteen 0x00 bytes. A useful anchor when scanning a dump: 16 zeros followed by the filesystem GUID." },
  { off: 0x10, size: 16, field: "FileSystemGuid", meaning: "EFI_FIRMWARE_FILE_SYSTEM2_GUID for everything modern; FIRMWARE_FILE_SYSTEM_GUID on the oldest volumes." },
  { off: 0x20, size: 8, field: "FvLength", meaning: "Bytes, including this header." },
  { off: 0x28, size: 4, field: "Signature", meaning: "'_FVH' = 5F 46 56 48. The second reliable anchor." },
  { off: 0x2c, size: 4, field: "Attributes", meaning: "Bit0 READ_DISABLED, bit1 READ_ENABLED, bit2 WRITE_DISABLED, bit3 WRITE_ENABLED, bit4 LOCK_CAPABLE, bit5 LOCKED, bit11 STICKY_WRITE, bit12 MEMORY_MAPPED, bit13 ERASE_POLARITY (1 = erased state is 0xFF), bit16 ALIGN_TOP." },
  { off: 0x30, size: 2, field: "HeaderLength", meaning: "Almost always 0x48." },
  { off: 0x32, size: 2, field: "Checksum", meaning: "Sum of all 16-bit words in the header equals zero." },
  { off: 0x34, size: 2, field: "ExtHeaderOffset", meaning: "Offset to the extended header, which carries the volume's name GUID." },
  { off: 0x38, size: 4, field: "Revision", meaning: "Usually 2." },
  { off: 0x3c, size: "n×8", field: "BlockMap", meaning: "Pairs of (NumBlocks, BlockLength), terminated by a zero pair. Gives the erase geometry the volume expects." },
];

export const FV_FILE_TYPES = [
  { type: 0xf0, name: "EFI_FV_FILETYPE_ALL", what: "Wildcard used in some tooling, not in real volumes." },
  { type: 0xf1, name: "RAW", what: "Opaque bytes. Often the microcode capsule or a blob the firmware loads by address." },
  { type: 0xf2, name: "FREEFORM", what: "No structure the firmware parses; usually a GUID-named data blob." },
  { type: 0x03, name: "SECURITY_CORE", what: "The very first code that runs — the reset vector's target." },
  { type: 0x04, name: "PEI_CORE", what: "The Pre-EFI Initialization core." },
  { type: 0x05, name: "DXE_CORE", what: "The Driver Execution Environment core." },
  { type: 0x06, name: "PEIM", what: "A PEI module. Runs before RAM is fully up." },
  { type: 0x07, name: "DRIVER", what: "A DXE driver." },
  { type: 0x08, name: "COMBINED_PEIM_DRIVER", what: "Both." },
  { type: 0x09, name: "APPLICATION", what: "A UEFI application — the shell, a diagnostic, or the firmware update capsule." },
  { type: 0x0a, name: "MM_STANDALONE", what: "System Management Mode standalone." },
  { type: 0x0b, name: "MM_CORE_STANDALONE", what: "SMM core." },
  { type: 0x0c, name: "FIRMWARE_VOLUME_IMAGE", what: "A nested volume. Volumes nest, and a parser that stops at the first one misses most of the firmware." },
  { type: 0x0d, name: "COMBINED_MM_DXE", what: "Both MM and DXE." },
  { type: 0x0e, name: "MM_CORE", what: "SMM core." },
  { type: 0x0f, name: "MM", what: "SMM module." },
];

export const FV_SECTION_TYPES = [
  { type: 0x02, name: "GUID_DEFINED", what: "A wrapper carrying a GUID, an offset and attributes. This is where compression and signing live — the section data is not the payload, it is a described container of it." },
  { type: 0x09, name: "FIRMWARE_VOLUME_IMAGE", what: "A nested FV image." },
  { type: 0x10, name: "PE32", what: "A PE/COFF image. The actual executable." },
  { type: 0x11, name: "PIC", what: "Position-independent code image." },
  { type: 0x12, name: "TE", what: "Terse Executable — a PE image with its DOS/NT headers replaced by a 40-byte TE header, saving flash space. Adjust the base by the StrippedSize field before loading." },
  { type: 0x13, name: "DXE_DEPEX", what: "The driver's dispatch dependency expression — a small bytecode saying which other drivers must be present first." },
  { type: 0x14, name: "VERSION", what: "A version string." },
  { type: 0x15, name: "USER_INTERFACE", what: "The human-readable file name, as UCS-2. This is the section that makes a volume readable to a person." },
  { type: 0x17, name: "FIRMWARE_IMAGE", what: "—" },
  { type: 0x18, name: "RAW", what: "Undifferentiated bytes." },
  { type: 0x1b, name: "PEI_DEPEX", what: "PEI dispatch dependency." },
  { type: 0x1c, name: "MM_DEPEX", what: "SMM dispatch dependency." },
];

/** The GUID_DEFINED section wrappers you actually meet. ev: "tool"/"report". */
export const GUID_DEFINED_WRAPPERS = [
  { guid: "ee4e5898-3914-4259-9d6e-dc7bd79403cf", name: "LZMA_CUSTOM_DECOMPRESS_GUID", what: "The commonest compression in a BIOS region. A 5-byte LZMA alone header follows the GUID_DEFINED section header, then the compressed body." },
  { guid: "a31280ad-481e-41b6-95e8-127f4c984779", name: "TIANO_DECOMPRESS_GUID", what: "The older EFI/Tiano custom compression. Still present on older AMI and Phoenix volumes." },
  { guid: "fc1bcdb0-7d31-49aa-936a-a4600d9a475a", name: "CRC32_GUIDED_SECTION", what: "Wraps a section with a CRC-32 in the section data." },
  { guid: "98709870-9870-9870-9870-987098709870", name: "(placeholder — verify)", what: "Do not trust this row; the vendor-specific signing GUIDs differ between AMI, Insyde and Phoenix and must be read off a known-good dump.", ev: "recall" },
];

export const TE_HEADER = [
  { off: 0x00, size: 2, field: "Signature", meaning: "'VZ' = 56 5A. Not 'MZ' — this is the whole point of the format." },
  { off: 0x02, size: 2, field: "Machine", meaning: "Same values as PE: 0x014C x86, 0x8664 x64, 0xAA64 AArch64." },
  { off: 0x04, size: 1, field: "NumberOfSections", meaning: "" },
  { off: 0x05, size: 1, field: "Subsystem", meaning: "10 = EFI application, 11 = EFI boot service driver, 12 = EFI runtime driver." },
  { off: 0x06, size: 2, field: "StrippedSize", meaning: "How many bytes of the original PE headers were removed. Every RVA in the TE image must have this added back to become a PE RVA — forgetting it is the classic 'I decompiled it and the addresses are all wrong' bug." },
  { off: 0x08, size: 4, field: "AddressOfEntryPoint", meaning: "" },
  { off: 0x0c, size: 4, field: "BaseOfCode", meaning: "" },
];

export const PE_MACHINES = [
  { id: 0x014c, name: "IMAGE_FILE_MACHINE_I386", ev: "std" },
  { id: 0x0200, name: "IMAGE_FILE_MACHINE_IA64", ev: "std" },
  { id: 0x8664, name: "IMAGE_FILE_MACHINE_AMD64", ev: "std" },
  { id: 0x01c0, name: "IMAGE_FILE_MACHINE_ARM", ev: "std" },
  { id: 0xaa64, name: "IMAGE_FILE_MACHINE_ARM64", ev: "std" },
  { id: 0x01c4, name: "IMAGE_FILE_MACHINE_ARMNT (Thumb-2)", ev: "std" },
  { id: 0x5064, name: "IMAGE_FILE_MACHINE_RISCV64", ev: "report" },
];

export const PE_SUBSYSTEMS = [
  { id: 1, name: "NATIVE" }, { id: 2, name: "WINDOWS_GUI" }, { id: 3, name: "WINDOWS_CUI" },
  { id: 10, name: "EFI_APPLICATION" }, { id: 11, name: "EFI_BOOT_SERVICE_DRIVER" },
  { id: 12, name: "EFI_RUNTIME_DRIVER" }, { id: 13, name: "EFI_ROM" },
];

/* ------------------------------------------------------------------ *
 * 3. The NVRAM / variable store — where "the settings" live
 *    ev: "std" for the UEFI variable format; "tool" for the legacy signatures.
 * ------------------------------------------------------------------ */

export const VARIABLE_STORE_SIGNATURES = [
  { sig: "5fa836df-8d1e-4cd4-a1e0-b1f0b1e0b1e0", name: "(placeholder)", ev: "recall", what: "Do not use this row. The UEFI variable store header signature is the EFI_SYSTEM_RESOURCE_TABLE-style GUID and varies by implementation; read it off a known-good dump of the same platform." },
  { sig: "$VSS", name: "Authenticated variable store (UEFI)", ev: "tool", what: "Four ASCII bytes 'VSS$' reversed. The header is 28 bytes: signature, size, format (0xFE = initialised), state (0xFE), reserved, reserved." },
  { sig: "$EVSA", name: "Extended variable store (Phoenix/Insyde)", ev: "tool", what: "Vendor variant of the same idea with a different record layout." },
  { sig: "NVRAM", name: "Legacy Phoenix NVRAM", ev: "report", what: "Older Phoenix BIOSes; record format is vendor-specific." },
  { sig: "LVS", name: "Legacy variable store", ev: "report", what: "—" },
];

export const VARIABLE_STATE = [
  { value: 0x3f, name: "IN_DELETED_TRANSITION", meaning: "Being replaced; the new copy is being written elsewhere." },
  { value: 0x7f, name: "DELETED", meaning: "Logically gone, physically still present until reclaimed." },
  { value: 0xfe, name: "HEADER_VALID", meaning: "The header has been committed." },
  { value: 0xfd, name: "HEADER_VALID | IN_DELETED_TRANSITION", meaning: "Combined state." },
  { value: 0xfc, name: "HEADER_VALID | DELETED", meaning: "A committed-then-deleted variable." },
];

export const VARIABLE_ATTRIBUTES = [
  { bit: 0x00000001, name: "NV", meaning: "Persist across power cycles. Without it the variable is volatile." },
  { bit: 0x00000002, name: "BOOTSERVICE_ACCESS", meaning: "Readable by boot services." },
  { bit: 0x00000004, name: "RUNTIME_ACCESS", meaning: "Readable by the OS at runtime — this is how the OS sees BootOrder, Boot####, and the Secure Boot variables." },
  { bit: 0x00000008, name: "HW_ERROR_RECORD", meaning: "" },
  { bit: 0x00000020, name: "AUTHENTICATED_WRITE_ACCESS", meaning: "The write must carry a valid authentication descriptor." },
  { bit: 0x00000100, name: "TIME_BASED_AUTHENTICATED_WRITE_ACCESS", meaning: "Secure Boot's variable updates use this: the payload is signed and carries a timestamp that must not go backwards, which is what stops rollback." },
  { bit: 0x00000200, name: "APPEND_WRITE", meaning: "Append rather than replace." },
];

/* ------------------------------------------------------------------ *
 * 4. Boot sector / MBR structure — the oldest firmware on the board
 *    ev: "std". This is also where the repo's existing virus lab lives:
 *    ghidra-lab.html + js/virus-catalog.js + samples/bin/*.
 * ------------------------------------------------------------------ */

export const MBR_LAYOUT = [
  { off: 0x000, size: 440, field: "Bootstrap code", meaning: "The part a boot-sector virus replaces. On a legitimate disk it is a small loader that finds the active partition and jumps to its VBR." },
  { off: 0x1b8, size: 4, field: "Disk signature", meaning: "Windows uses it to bind registry mount points to a disk. Two disks with the same signature confuse the OS into reassigning drive letters." },
  { off: 0x1bc, size: 2, field: "Reserved (usually 0)", meaning: "" },
  { off: 0x1be, size: 64, field: "Partition table", meaning: "Four 16-byte entries." },
  { off: 0x1fe, size: 2, field: "Boot signature", meaning: "0x55 0xAA. The only thing many tools check, and the reason a zeroed MBR still 'looks like' one to a naive parser." },
];

export const PARTITION_ENTRY = [
  { off: 0, size: 1, field: "Status", meaning: "0x80 = bootable, 0x00 = not. Two entries marked bootable is a corrupt table, and some BIOSes then refuse to boot at all." },
  { off: 1, size: 3, field: "First sector CHS", meaning: "Cylinder[7:0] in byte 2's high bits plus byte 1's low 2 bits, head in byte 1, sector in byte 2's low 6 bits. A legacy encoding that survives only for compatibility." },
  { off: 4, size: 1, field: "Partition type", meaning: "0x07 NTFS/exFAT, 0x0B/0x0C FAT32, 0x83 Linux, 0xEE GPT protective, 0xEF EFI System Partition." },
  { off: 5, size: 3, field: "Last sector CHS", meaning: "" },
  { off: 8, size: 4, field: "First sector LBA", meaning: "Little-endian. On a GPT disk the protective MBR has type 0xEE and an LBA of 1." },
  { off: 12, size: 4, field: "Sector count", meaning: "" },
];

export const GPT_HEADER = {
  signature: "EFI PART",
  signatureBytes: [0x45, 0x46, 0x49, 0x20, 0x50, 0x41, 0x52, 0x54],
  lba: 1,
  layout: [
    { off: 0x00, size: 8, field: "Signature", meaning: "'EFI PART' at LBA 1 (byte 512 of the disk)." },
    { off: 0x08, size: 4, field: "Revision", meaning: "0x00010000 for GPT 1.0." },
    { off: 0x0c, size: 4, field: "HeaderSize", meaning: "92 bytes; the rest of the sector is reserved." },
    { off: 0x10, size: 4, field: "HeaderCRC32", meaning: "CRC-32 of the header with this field zeroed. Same rule as U-Boot's ih_hcrc." },
    { off: 0x18, size: 8, field: "MyLBA", meaning: "Should be 1." },
    { off: 0x20, size: 8, field: "AlternateLBA", meaning: "The backup header, at the last LBA. Checking that the backup agrees with the primary is the fastest way to tell a corrupt GPT from a truncated dump." },
    { off: 0x28, size: 8, field: "FirstUsableLBA", meaning: "" },
    { off: 0x30, size: 8, field: "LastUsableLBA", meaning: "" },
    { off: 0x38, size: 16, field: "DiskGUID", meaning: "" },
    { off: 0x48, size: 8, field: "PartitionEntryLBA", meaning: "Usually 2." },
    { off: 0x50, size: 4, field: "NumberOfPartitionEntries", meaning: "" },
    { off: 0x54, size: 4, field: "SizeOfPartitionEntry", meaning: "128." },
    { off: 0x58, size: 4, field: "PartitionEntryArrayCRC32", meaning: "" },
  ],
  ev: "std",
};

/* ------------------------------------------------------------------ *
 * 5. Boot-phase triage for platform firmware
 *    ev: "report" — workshop diagnostics.
 * ------------------------------------------------------------------ */

export const UEFI_TRIAGE = [
  {
    symptom: "Board powers on, fan spins, no POST code, no video, no beeps",
    order: [
      "Measure every rail at the connector, not at the PSU: 3.3 V, 5 V, 12 V, and the core/VCORE rail which should come up only after PWRGOOD.",
      "Check that the SPI flash answers RDID with an external programmer. If it does not, the SoC/PCH is not the first suspect — the flash is.",
      "Look for a BIOS-recovery jumper or a key combination (Ctrl+Esc on many HP/Dell, a USB stick named BIOS_*.ROM on others). Vendor recovery paths are real and are not a hack.",
      "Reflash only the BIOS region from a dump taken from the same board model AND the same revision. A different revision can have a different descriptor and a different ME.",
    ],
    ev: "report",
  },
  {
    symptom: "POST runs but stops at a code before memory training completes",
    order: [
      "Cross-reference the code against the vendor's POST code table — codes are vendor-specific and not portable between AMI, Insyde and Phoenix.",
      "Reseat and then substitute one known-good DIMM in the slot nearest the CPU. Memory training failure looks identical to a dead memory controller.",
      "Clear CMOS properly: jumper for 10 s with the PSU unplugged, or remove the battery and short the holder. A half-cleared NVRAM leaves the variable store in a state the firmware cannot parse.",
      "If it still fails, dump the SPI and check whether the NVRAM region is full of 0xFF (erased) or contains malformed variable records.",
    ],
    ev: "report",
  },
  {
    symptom: "Boots, but the wrong OS / no boot entries / 'No bootable device'",
    order: [
      "The boot entries are UEFI *variables* in NVRAM, not a table on the disk. A cleared CMOS removes them even though the disk is perfect.",
      "Boot a live USB and re-create the entry (efibootmgr -c -d /dev/sdX -p 1 -L linux -l '\\EFI\\boot\\bootx64.efi'). This is a two-minute fix that is routinely mistaken for a dead board.",
      "If the ESP exists but is empty, the bootloader was removed rather than the disk failing — check the filesystem before the hardware.",
    ],
    ev: "report",
  },
  {
    symptom: "Secure Boot rejects a previously working image",
    order: [
      "Read the Secure Boot variables (PK, KEK, db, dbx) and check whether dbx has been updated. A firmware update can add a revocation that invalidates an older signed bootloader.",
      "This is a security control working as designed. Rebuild or re-sign the image with a key that is in db; do not look for a way to make the check go away.",
    ],
    ev: "std",
  },
  {
    symptom: "Firmware update bricked the board mid-write",
    order: [
      "Do not power-cycle repeatedly. Dump the flash first — reading is non-destructive and the dump is the only record of what survived.",
      "Check whether the descriptor is intact (signature 5A A5 F0 0F at 0x10). If the descriptor is gone the platform cannot find its own regions and no partial recovery is possible from software.",
      "Check whether a recovery region or a second flash exists. Many laptops keep a golden copy and a boot-select mechanism.",
      "If the board has a BMC or an EC that survives independently, that is often the path back in.",
    ],
    ev: "report",
  },
];
