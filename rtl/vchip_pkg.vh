// vchip_pkg.vh — shared parameters and encodings for the virtual chipset.
//
// The "virtual chipset" (vchip) is a synthesizable model of the platform
// security block that a MAKInterface-class board's firmware would have to
// satisfy: a boot-chain measurement lock, an ATA Security state machine that
// speaks the same commands hdparm drives, and the policy gates that decide
// whether a boot stage is handed control and whether the media may be written.
//
// Everything here is deliberately plain Verilog-2001 so `read_verilog` +
// `prep` + `synth` + `sat` + `write_cxxrtl` all accept it unchanged.
//
// Scope note (read this before reusing anything):
//   This is a MODEL, not a tape-out. The mixer in vchip_mix.v is a structural
//   stand-in for a hash core, the "OTP" is ordinary flops, and the tamper
//   latch is cleared by reset. See docs/VCHIP.md for the honest limitations
//   and what production silicon would have to change.

`ifndef VCHIP_PKG_VH
`define VCHIP_PKG_VH

// ---------------------------------------------------------------- geometry --
// Measurement vector: the "vector" of the vector-lock. Production would carry
// a SHA-256 digest (256 bits); the model uses 64 bits split into 4 lanes of 16
// so the extend/mix network stays small enough for bounded SAT proofs.
`define VCHIP_VEC_W      64
`define VCHIP_LANES      4
`define VCHIP_LANE_W     (`VCHIP_VEC_W/`VCHIP_LANES)
`define VCHIP_MIX_ROUNDS 4

// Boot stages, in the order a machine actually hands off control.
`define VCHIP_STAGES     3
`define STAGE_MBR        2'd0   // LBA0: DOS/MBR or GPT protective MBR (fdisk)
`define STAGE_EFI        2'd1   // ESP boot application (PE32+ EFI, BOOTX64.EFI)
`define STAGE_LOADER     2'd2   // second-stage loader: GRUB core.img, LILO, elilo

// Lock state (boot_vector_lock.v)
`define LCK_IDLE         2'd0   // no measurement accepted yet; provisioning open
`define LCK_MEASURING    2'd1   // at least one stage extended, chain still open
`define LCK_UNLOCKED     2'd2   // every stage measured and matched, in order
`define LCK_LOCKED       2'd3   // fail-closed; only power-on reset clears it

// Boot source kinds as presented by the chipset to the lock.
`define BOOT_NONE        2'd0
`define BOOT_LEGACY      2'd1   // CSM path: MBR bootstrap -> active partition VBR
`define BOOT_UEFI        2'd2   // UEFI path: GPT -> ESP -> EFI application

// Platform policy for which boot source may be handed control.
`define MODE_DUAL        2'd0   // either path permitted (today's default)
`define MODE_LEGACY      2'd1
`define MODE_UEFI        2'd2

// Why the chipset refused handoff (boot_deny_reason).
`define DENY_NONE        4'd0
`define DENY_CHAIN       4'd1   // measurement chain not complete/matched
`define DENY_MODE        4'd2   // boot source contradicts policy_boot_mode
`define DENY_SOURCE      4'd3   // no valid boot source presented
`define DENY_TAMPER      4'd4   // tamper latch set
`define DENY_ARM         4'd5   // lock never armed

// ATA Security command set (ATA-8). These are the opcodes hdparm sends for
// --security-set-pass / --security-unlock / --security-erase / --security-freeze.
`define ATA_SEC_SET_PWD     8'hF1
`define ATA_SEC_UNLOCK      8'hF2
`define ATA_SEC_ERASE_PREP  8'hF3
`define ATA_SEC_ERASE_UNIT  8'hF4
`define ATA_SEC_FREEZE      8'hF5
`define ATA_SEC_DISABLE     8'hF6
`define ATA_READ_DMA        8'hC8
`define ATA_WRITE_DMA       8'hCA
// Not a real ATA opcode: stands in for an in-band "reflash the host firmware"
// vendor command, which is what an interface board's updater would issue.
`define ATA_VENDOR_REFLASH  8'hFE

// ATA command abort reasons (subset of ATA-8 error reporting we model).
`define ABORT_NONE          4'd0
`define ABORT_ABRT          4'd1   // plain command abort
`define ABORT_FROZEN        4'd2   // SECURITY FREEZE LOCK active
`define ABORT_PWD           4'd3   // bad password / attempt counter issues
`define ABORT_LOCKED        4'd4   // security locked
`define ABORT_POLICY        4'd5   // chipset policy refused (chain/tamper)
`define ABORT_NOT_ENABLED   4'd6   // security feature not enabled
`define ABORT_NO_PREP       4'd7   // ERASE UNIT without ERASE PREPARE

`endif // VCHIP_PKG_VH
