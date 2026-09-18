/* CHIPWRIGHT · cw-data-storage.js — S.M.A.R.T., ATA, NVMe.
 *
 * The drive is the component that fails *gradually* and tells you about it in
 * advance, which makes it the one place in this workbench where a reading has
 * a direct, non-speculative bearing on whether a repair is worth doing.
 *
 * Evidence tags follow js/cw-data.js: std / tool / report / recall.
 */

/* ------------------------------------------------------------------ *
 * 1. S.M.A.R.T. attribute numbers
 *    The attribute *ids* are standardised across the industry (they come from
 *    the ATA/ATAPI spec's SMART attribute table and every drive vendor uses
 *    the same numbers). The *raw value encoding* is emphatically NOT: the same
 *    id means a plain count on one vendor and a packed bitfield on another.
 *    ev: "std" for the id↔name mapping, "report" for the raw-value notes.
 * ------------------------------------------------------------------ */

export const SMART_ATTRS = [
  { id: 0x01, name: "Read Error Rate", worse: "lower", raw: "vendor-specific: on Seagate the low 16 bits are a count and the high bits a total, so a huge raw value can be normal. Never compare raw values across vendors.", ev: "std" },
  { id: 0x02, name: "Throughput Performance", worse: "higher", raw: "vendor-specific", ev: "std" },
  { id: 0x03, name: "Spin-Up Time", worse: "lower", raw: "milliseconds (sometimes a vendor scale). A rising spin-up time is an early bearing/motor warning.", ev: "std" },
  { id: 0x04, name: "Start/Stop Count", worse: "context", raw: "plain count. Not a fault — but a drive rated for 50,000 cycles that shows 90,000 has been used outside its design.", ev: "std" },
  { id: 0x05, name: "Reallocated Sectors Count", worse: "lower", raw: "CRITICAL. A nonzero and *rising* value means the drive has already found bad sectors and moved them to the spare area. Once the spare area is exhausted, data loss is not hypothetical.", ev: "std" },
  { id: 0x06, name: "Read Channel Margin", worse: "higher", raw: "vendor-specific", ev: "std" },
  { id: 0x07, name: "Seek Error Rate", worse: "lower", raw: "vendor-specific, same packing caveat as 0x01", ev: "std" },
  { id: 0x08, name: "Seek Time Performance", worse: "higher", raw: "vendor-specific", ev: "std" },
  { id: 0x09, name: "Power-On Hours", worse: "context", raw: "hours on some vendors, half-hours or minutes on others. Check against 0x04 and the warranty date before believing it.", ev: "std" },
  { id: 0x0a, name: "Spin Retry Count", worse: "lower", raw: "Any nonzero value means the motor did not come up on the first attempt.", ev: "std" },
  { id: 0x0b, name: "Recalibration Retries", worse: "lower", raw: "nonzero is a mechanical warning", ev: "std" },
  { id: 0x0c, name: "Power Cycle Count", worse: "context", raw: "plain count", ev: "std" },
  { id: 0xb8, name: "End-to-End Error", worse: "lower", raw: "nonzero on a SATA drive usually means the on-board cache parity check failed. Treat as serious.", ev: "std" },
  { id: 0xbb, name: "Reported Uncorrectable Errors", worse: "lower", raw: "ECC failures that could not be corrected. The single most direct 'this drive is losing your data' counter.", ev: "std" },
  { id: 0xbc, name: "Command Timeout", worse: "lower", raw: "often a cable or link-power-management problem rather than the drive itself — check the SATA cable before condemning the drive.", ev: "report" },
  { id: 0xbd, name: "High Fly Writes", worse: "lower", raw: "head flew higher than spec during a write", ev: "std" },
  { id: 0xbe, name: "Airflow Temperature (C)", worse: "lower", raw: "degrees C, often packed with min/max in the high bytes", ev: "std" },
  { id: 0xbf, name: "G-Sense Error Rate", worse: "lower", raw: "shock events. On a laptop drive a high count plus reallocated sectors is a drop that killed it.", ev: "std" },
  { id: 0xc0, name: "Power-Off Retract Count / Emergency Retract", worse: "lower", raw: "heads parked by power loss rather than by command", ev: "std" },
  { id: 0xc1, name: "Load Cycle Count", worse: "context", raw: "head load/unload events. The famous 'parking' attribute: aggressive APM settings push this into the hundreds of thousands and wear the ramp.", ev: "std" },
  { id: 0xc2, name: "Temperature (C)", worse: "lower", raw: "degrees C", ev: "std" },
  { id: 0xc3, name: "Hardware ECC Recovered", worse: "context", raw: "vendor-specific; on many drives a large value is completely normal", ev: "std" },
  { id: 0xc4, name: "Reallocation Event Count", worse: "lower", raw: "counts *attempts*, including failed ones. Can be nonzero while 0x05 is zero.", ev: "std" },
  { id: 0xc5, name: "Current Pending Sector Count", worse: "lower", raw: "CRITICAL. Sectors that read badly and are waiting to be reallocated on the next write. Unstable data: a full-disk read now may fail on exactly these sectors.", ev: "std" },
  { id: 0xc6, name: "Uncorrectable Sector Count / Offline Uncorrectable", worse: "lower", raw: "CRITICAL. Sectors that could not be read and could not be reallocated.", ev: "std" },
  { id: 0xc7, name: "UltraDMA CRC Error Count", worse: "lower", raw: "Almost always the CABLE, not the drive. This counter increments on interface CRC failures; a rising value with a flat 0x05 means replace the SATA cable and re-measure.", ev: "report" },
  { id: 0xc8, name: "Write Error Rate / Multi-Zone Error Rate", worse: "lower", raw: "vendor-specific", ev: "std" },
  { id: 0xc9, name: "Soft Read Error Rate", worse: "lower", raw: "vendor-specific", ev: "std" },
  { id: 0xf0, name: "Head Flying Hours", worse: "context", raw: "vendor-specific", ev: "std" },
  { id: 0xf1, name: "Total LBAs Written", worse: "context", raw: "used to compute drive writes per day, the SSD wear metric that actually matters", ev: "std" },
  { id: 0xf2, name: "Total LBAs Read", worse: "context", raw: "", ev: "std" },
  { id: 0xfa, name: "Read Error Retry Rate", worse: "lower", raw: "vendor-specific", ev: "std" },
  { id: 0xfe, name: "Free Fall Protection / Growing Defect List", worse: "lower", raw: "vendor-specific", ev: "std" },
  { id: 0xad, name: "Wear Leveling Count (SSD)", worse: "higher", raw: "often 100 − percent-used; check the vendor's own tool for the exact scale", ev: "report" },
  { id: 0xae, name: "Unexpected Power Loss (SSD)", worse: "lower", raw: "", ev: "report" },
  { id: 0xb1, name: "Wear Range Delta (SSD)", worse: "lower", raw: "", ev: "report" },
  { id: 0xb5, name: "Program Fail Count (SSD)", worse: "lower", raw: "CRITICAL on an SSD — a page that would not program", ev: "report" },
  { id: 0xb6, name: "Erase Fail Count (SSD)", worse: "lower", raw: "CRITICAL on an SSD — a block that would not erase", ev: "report" },
  { id: 0xe8, name: "Available Reserved Space (SSD)", worse: "higher", raw: "percent of spare blocks remaining. When it hits the threshold the drive goes read-only.", ev: "report" },
  { id: 0xe9, name: "Media Wearout Indicator (SSD)", worse: "higher", raw: "Intel's convention: 100 at new, counts down to 0 at end of life. Other vendors use other scales — do not assume.", ev: "report" },
];

export const SMART_ATTR_BY_ID = Object.fromEntries(SMART_ATTRS.map((a) => [a.id, a]));

/** Attributes where a nonzero raw value means "stop and back up before anything else". */
export const SMART_CRITICAL = [0x05, 0xbb, 0xc4, 0xc5, 0xc6, 0xb5, 0xb6, 0xb8, 0x0a];

/**
 * The 12-byte SMART attribute entry as returned by READ SMART DATA.
 * ev: "std" (ATA/ATAPI). Layout is fixed; the raw field's *meaning* is not.
 */
export const SMART_ENTRY_LAYOUT = [
  { off: 0, size: 1, field: "id", meaning: "Attribute id. 0x00 marks the start of reserved space, so it terminates a naive parse." },
  { off: 1, size: 2, field: "status", meaning: "Little-endian current normalised value (1-253; 100 is typical for 'healthy'). 0 or below the threshold means the drive has flagged itself." },
  { off: 3, size: 6, field: "raw", meaning: "48-bit vendor-specific raw value, little-endian. Six bytes, not four — parsers that read it as a u32 silently lose the top of the counter." },
];

/* ------------------------------------------------------------------ *
 * 2. ATA command set — the SMART taskfile
 *    ev: "std" (ATA/ATAPI-7 and later; corroborated by smartmontools).
 * ------------------------------------------------------------------ */

export const ATA_SMART_TASKFILE = {
  featureRegister: 0xb0,
  subCommands: [
    { lbaMid: 0x4f, lbaHigh: 0xc2, count: 0x00, name: "SMART READ DATA", what: "30 attribute entries, 12 bytes each, starting at byte 2 of the 512-byte buffer." },
    { lbaMid: 0x4f, lbaHigh: 0xc2, count: 0x01, name: "SMART READ ATTRIBUTE THRESHOLDS", what: "The drive's own per-attribute thresholds, 12 bytes each (id, threshold, 10 reserved)." },
    { lbaMid: 0x4f, lbaHigh: 0xc2, count: 0x02, name: "SMART WRITE ATTRIBUTE VALUES", what: "Vendor service command; not something a repair bench should issue." },
    { lbaMid: 0x4f, lbaHigh: 0xc2, count: 0x04, name: "SMART EXECUTE OFF-LINE IMMEDIATE", what: "Runs the short/extended self test. The subcommand goes in the LBA-low register: 0x00 short, 0x01 extended, 0x02 abort, 0x04 conformance." },
    { lbaMid: 0x4f, lbaHigh: 0xc2, count: 0x05, name: "SMART READ LOG", what: "The self-test log and the vendor logs. Sector number in LBA-low, log address in LBA-mid/high." },
    { lbaMid: 0x4f, lbaHigh: 0xc2, count: 0xd8, name: "SMART ENABLE OPERATIONS", what: "Must be issued before any other SMART command. A drive that has SMART disabled returns ABORTED COMMAND for everything." },
    { lbaMid: 0x4f, lbaHigh: 0xc2, count: 0xd9, name: "SMART DISABLE OPERATIONS", what: "—" },
    { lbaMid: 0x4f, lbaHigh: 0xc2, count: 0xda, name: "SMART RETURN STATUS", what: "Returns 'threshold exceeded' by putting 0xF4 in LBA-mid and 0x2C in LBA-high. Any other pair means OK." },
  ],
  note: "The 0x4F/0xC2 pair in LBA-mid/LBA-high is the SMART signature; without it the drive treats 0xB0 as an unknown feature. This is the single most common reason a USB-SATA bridge 'cannot read SMART': the bridge does not forward the taskfile, and you need SAT (SCSI/ATA Translation) pass-through instead.",
  ev: "std",
};

export const ATA_IDENTIFY = {
  cmd: 0xec, cmdAtapi: 0xa1,
  fields: [
    { word: 0, name: "General configuration", what: "Bit 15 set = ATAPI. Bit 7 = removable media." },
    { word: "10-19", name: "Serial number", what: "20 ASCII characters, byte-swapped in pairs. Word 10 holds the *last* two characters of the serial as printed." },
    { word: "23-26", name: "Firmware revision", what: "8 ASCII characters, byte-swapped." },
    { word: "27-46", name: "Model number", what: "40 ASCII characters, byte-swapped." },
    { word: 47, name: "Max sectors per interrupt", what: "Low byte; 0x80 | n." },
    { word: 49, name: "Capabilities", what: "Bit 8 = DMA, bit 9 = LBA, bit 11 = IORDY." },
    { word: 53, name: "Validity of later words", what: "Bit 1 = words 64-70 valid, bit 2 = words 88+ valid." },
    { word: "60-61", name: "Total addressable sectors (28-bit LBA)", what: "0x0FFFFFFF means 'use the 48-bit field instead'." },
    { word: 76, name: "Serial ATA capabilities", what: "Bit 1 = SATA Gen1, bit 2 = Gen2, bit 3 = Gen3. Bit 2 of the NCQ field says whether NCQ is supported." },
    { word: 80, name: "Major version", what: "Bitmask of ATA-1..ATA-10 support." },
    { word: 88, name: "UDMA modes", what: "Bits 0-5 supported, bits 8-13 selected." },
    { word: "100-103", name: "Total addressable sectors (48-bit LBA)", what: "The real capacity on any drive above 128 GiB." },
    { word: 169, name: "Data Set Management (TRIM)", what: "Bit 0 = DSM supported." },
    { word: "209-217", name: "Nominal media rotation rate", what: "Word 217: 0x0001 = non-rotating (SSD), otherwise RPM." },
  ],
  ev: "std",
  note: "The byte-swapping in the string fields is not optional decoration: IDENTIFY DEVICE stores ASCII with the two characters of each word reversed, so 'WDC WD10' arrives as 'DW CW 1D0'. Every parser that forgets this prints a drive model that looks like a shuffled anagram.",
};

export const ATA_COMMANDS = [
  { cmd: 0xec, name: "IDENTIFY DEVICE", ev: "std" },
  { cmd: 0xa1, name: "IDENTIFY PACKET DEVICE (ATAPI)", ev: "std" },
  { cmd: 0xb0, name: "SMART (feature register selects the subcommand)", ev: "std" },
  { cmd: 0x20, name: "READ SECTOR(S) — 28-bit LBA, PIO", ev: "std" },
  { cmd: 0x24, name: "READ SECTOR(S) EXT — 48-bit LBA, DMA", ev: "std" },
  { cmd: 0x30, name: "WRITE SECTOR(S)", ev: "std" },
  { cmd: 0x34, name: "WRITE SECTOR(S) EXT", ev: "std" },
  { cmd: 0xca, name: "WRITE DMA", ev: "std" },
  { cmd: 0x25, name: "READ DMA EXT", ev: "std" },
  { cmd: 0xe5, name: "CHECK POWER MODE", ev: "std", note: "Returns 0x00 standby, 0x40 NV cache spun down, 0x80 idle, 0xFF active. The first thing to try when a drive seems dead but the adapter LED is lit." },
  { cmd: 0x06, name: "DATA SET MANAGEMENT (TRIM)", ev: "std" },
  { cmd: 0xf5, name: "SECURITY FREEZE LOCK", ev: "std", note: "After this, no SECURITY-unlock command is accepted until a reset. Encountered constantly on drives pulled from laptops." },
  { cmd: 0xf2, name: "SECURITY UNLOCK", ev: "std", note: "An ATA password, not a filesystem password. If you do not have it, this is a dead end by design — see the scope note in cw-data.js." },
];

/** The 32-byte self-test log descriptor (READ SMART LOG, log 0x06). ev: "std". */
export const SELFTEST_LOG = {
  logAddress: 0x06,
  entryBytes: 24,
  entries: 21,
  layout: [
    { off: 0, size: 1, field: "self-test number", meaning: "1-21; entry 1 is the most recent." },
    { off: 1, size: 1, field: "status", meaning: "High nibble = self-test code (1=short, 2=extended, 4=aborted, 5=abort by vendor request, 0xE=fatal error during test). Low nibble = completion status: 0 completed without error, 1 aborted by host, 2 interrupted by host reset, 3 unknown error, 4 test failed, 5 unknown failure, 6 failed on an unknown segment, 7 failed in the read element, 8 received a DAM error, 15 = still in progress." },
    { off: 2, size: 1, field: "completion %", meaning: "0-100 in 10% steps. 90 with a low nibble of 15 means 'running, 90% done'." },
    { off: 3, size: 1, field: "timestamp LSB", meaning: "Power-on hours, little-endian across two bytes." },
    { off: 5, size: 1, field: "failing LBA (28-bit)", meaning: "The LBA that failed, when the status says a specific sector was the problem." },
    { off: 8, size: 4, field: "failing LBA (48-bit)", meaning: "Extended; the 28-bit field is then ignored." },
  ],
  note: "A drive that reports 'completed without error' on its self-test can still have a rising 0xC5. The self-test only exercises what the drive chooses to exercise, and short tests typically cover well under 10% of the surface.",
  ev: "std",
};

/* ------------------------------------------------------------------ *
 * 3. NVMe — different transport, different log pages
 *    ev: "std" for the log identifiers, "report" for the field offsets.
 * ------------------------------------------------------------------ */

export const NVME_LOG_PAGES = [
  { id: 0x01, name: "Error Information", what: "The last N command completions that ended in error, with status field, LBA and namespace." },
  { id: 0x02, name: "SMART / Health Information", what: "512 bytes. This is the NVMe equivalent of the whole SMART attribute table, and unlike ATA it is standardised down to the byte offset." },
  { id: 0x03, name: "Firmware Slot Information", what: "Which slots hold which revision, and which one is active. The first thing to read before any firmware update on an NVMe drive." },
  { id: 0x04, name: "Changed Namespace List", what: "—" },
  { id: 0x05, name: "Command Effects", what: "What each admin/IO command does to the device state. Read it before issuing anything destructive." },
  { id: 0x06, name: "Device Self-test", what: "The self-test log, with the current operation and completion percentage." },
  { id: 0x80, name: "Discovery (NVMe-oF)", what: "Only meaningful over fabrics." },
  { id: 0xc0, name: "Vendor specific", what: "0xC0-0xFF are vendor-defined. Samsung, Intel and WDC all put genuinely useful wear data here that the standard log omits." },
];

/** The standardised SMART/Health log (page 02h). Byte offsets are in the spec. ev: "std". */
export const NVME_SMART_LAYOUT = [
  { off: 0x00, size: 1, field: "critical_warning", meaning: "Bit 0 spare below threshold, bit 1 temperature above/below a threshold, bit 2 NVM subsystem reliability degraded, bit 3 media placed in read-only mode, bit 4 volatile memory backup failed, bit 5 persistent memory region read-only or unreliable. Any nonzero bit is a stop-everything flag." },
  { off: 0x01, size: 2, field: "composite_temperature", meaning: "Kelvin. Subtract 273 for Celsius." },
  { off: 0x03, size: 1, field: "available_spare", meaning: "Percent of spare blocks remaining." },
  { off: 0x04, size: 1, field: "available_spare_threshold", meaning: "The drive's own threshold. available_spare at or below this is what sets critical_warning bit 0." },
  { off: 0x05, size: 1, field: "percentage_used", meaning: "Percent of the rated write endurance consumed. Saturates at 255." },
  { off: 0x06, size: 1, field: "endurance_group_critical_warning_summary", meaning: "Newer addition; nonzero means something in the endurance group is unhappy." },
  { off: 0x20, size: 16, field: "data_units_read", meaning: "128-bit, in units of 1000 × 512 bytes." },
  { off: 0x30, size: 16, field: "data_units_written", meaning: "Same units. Divide by 2^40 for TiB written; compare against the datasheet's TBW rating." },
  { off: 0x40, size: 16, field: "host_read_commands", meaning: "128-bit" },
  { off: 0x50, size: 16, field: "host_write_commands", meaning: "128-bit" },
  { off: 0x60, size: 4, field: "controller_busy_time", meaning: "Minutes" },
  { off: 0x68, size: 4, field: "power_cycles", meaning: "" },
  { off: 0x70, size: 4, field: "power_on_hours", meaning: "" },
  { off: 0x78, size: 4, field: "unsafe_shutdowns", meaning: "Shutdowns without a proper flush. The number that matters after a power-cut corruption report." },
  { off: 0x80, size: 16, field: "media_and_data_integrity_errors", meaning: "128-bit. Nonzero means the drive itself could not return correct data. This is the NVMe equivalent of ATA 0xC6." },
  { off: 0x90, size: 16, field: "number_of_error_log_entries", meaning: "128-bit" },
  { off: 0xa0, size: 4, field: "warning_comp_temp_time", meaning: "Minutes above the warning threshold" },
  { off: 0xa4, size: 4, field: "critical_comp_temp_time", meaning: "Minutes above the critical threshold" },
];

export const NVME_ADMIN = [
  { op: 0x02, name: "Get Log Page", ev: "std" },
  { op: 0x06, name: "Identify", ev: "std", note: "CNS 01h = controller, 00h = namespace, 02h = active namespace list." },
  { op: 0x09, name: "Set Features", ev: "std" },
  { op: 0x0a, name: "Get Features", ev: "std" },
  { op: 0x10, name: "Firmware Commit", ev: "std" },
  { op: 0x11, name: "Firmware Image Download", ev: "std" },
  { op: 0x14, name: "Device Self-test", ev: "std" },
  { op: 0x80, name: "Format NVM", ev: "std", note: "Destructive. The secure-erase settings in CDW10 decide whether cryptographic erase or block erase is used." },
  { op: 0x84, name: "Sanitize", ev: "std", note: "Destructive and, once started, not abortable in the usual sense." },
];

/* ------------------------------------------------------------------ *
 * 4. Diagnostic decision table
 *    ev: "report" — these are workshop readings, not measurements from this
 *    repo, and the thresholds are deliberately conservative.
 * ------------------------------------------------------------------ */

export const DRIVE_TRIAGE = [
  {
    finding: "0x05 reallocated sectors nonzero and increasing over days",
    verdict: "FAILING — do not repair around it",
    action: "Image the drive now, read-once, no retries (a retry storm on a dying head finishes it). Then replace. The spare area is finite and it is already being spent.",
    ev: "report",
  },
  {
    finding: "0xC5 pending sectors nonzero, 0x05 zero",
    verdict: "UNSTABLE — recoverable, conditionally",
    action: "Read the whole surface once. Sectors that read cleanly get re-written and the drive clears them; sectors that do not become reallocated. Compare 0xC5 and 0x05 before and after. If 0xC5 clears to zero, the drive is usable for non-critical storage; if it does not, it is on its way out.",
    ev: "report",
  },
  {
    finding: "0xC7 CRC errors rising, everything else flat",
    verdict: "NOT THE DRIVE",
    action: "Replace the SATA cable, reseat both ends, and if the drive is behind a backplane check the backplane. Then zero the counter's baseline by noting the current value and re-measuring. Condemning a drive on 0xC7 alone is the most common misdiagnosis in this table.",
    ev: "report",
  },
  {
    finding: "0xBC command timeouts with 0xC7 flat",
    verdict: "LINK POWER MANAGEMENT or controller",
    action: "Disable ALPM/HIPM/DIPM, update the controller driver, and try a different port. If the timeouts follow the drive to a different machine, the drive's controller board is suspect — and on many drives the board can be swapped, but the adaptive data in its ROM cannot, so a board swap alone will not work.",
    ev: "report",
  },
  {
    finding: "Clicking, spin-up time (0x03) rising, 0x0A spin retries nonzero",
    verdict: "MECHANICAL — powered off, now",
    action: "Every spin-up cycle on a drive with a stuck or weak head costs head and platter. Stop testing and decide whether the data is worth a professional recovery; no software fixes a stiction or a failed spindle motor.",
    ev: "report",
  },
  {
    finding: "SSD: 0xE8 available reserved space at or near its threshold, or 0xE9 wearout near zero",
    verdict: "END OF LIFE",
    action: "Most SSD controllers switch to read-only when the spare is exhausted. That is a gift: read everything out while you still can, then replace. Do not attempt a firmware update on a drive in this state.",
    ev: "report",
  },
  {
    finding: "NVMe critical_warning nonzero",
    verdict: "STOP",
    action: "Decode which bit is set before doing anything. Bit 3 (read-only mode) means the drive has already decided; bit 2 (reliability degraded) means the error rate is climbing. Either way the first action is a full image, not a diagnosis.",
    ev: "std",
  },
  {
    finding: "Drive not detected at all, adapter LED lit",
    verdict: "CHECK POWER AND THE ADAPTER BEFORE THE DRIVE",
    action: "Measure the 5 V and 12 V rails at the connector (a 3.5\" drive needs both; a 2.5\" needs 5 V only). A USB-SATA bridge that cannot supply 12 V will silently fail on desktop drives. Then try the drive on a direct SATA port — bridges are the most common point of failure in a 'dead drive' report.",
    ev: "report",
  },
  {
    finding: "ATA SECURITY frozen / password locked",
    verdict: "DEAD END BY DESIGN",
    action: "SECURITY FREEZE LOCK blocks unlock until a hardware reset; an ATA password you do not have is not something a repair bench defeats. If it is your own drive and you have the password, a power cycle clears the freeze and then the unlock can be issued. Otherwise the drive is a donor.",
    ev: "std",
  },
];
