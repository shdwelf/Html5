// vchip_top.v — the virtual chipset: boot source policy + measurement lock +
// ATA security gates, wired the way a platform security block would be.
//
// Data flow:
//
//   boot_kind ──► mode policy ─┐
//   meas_*   ──► vector lock ──┼──► cpu_release (hand control to the next stage)
//   cmd/pwd  ──► ATA security ─┘──► media_write_allow / erase_grant / reflash_grant
//
// The block refuses to release the CPU unless the measurement chain completed
// in order and matched, the presented boot source agrees with
// `policy_boot_mode`, and no tamper latch is set. It refuses destructive
// operations on a tampered box outright.
//
// Recovery: `strap_recovery` is a physical-presence strap honoured only before
// the first handoff. It re-opens provisioning (so a factory can re-key the
// golden vectors through a fixture) but never grants erase, never grants a
// reflash on a tampered device, and clears nothing on its own. That asymmetry
// is the point: recovery restores the ability to *re-provision*, not the
// ability to destroy evidence.

`include "vchip_pkg.vh"

module vchip_top #(
  parameter VEC_W = `VCHIP_VEC_W,
  parameter LANES = `VCHIP_LANES,
  parameter ROUNDS = `VCHIP_MIX_ROUNDS
) (
  input  wire              clk,
  input  wire              rst_n,

  // ------------------------------------------------------------- straps
  input  wire              arm,                 // "trusted boot required"
  input  wire              strap_recovery,      // physical presence, pre-boot only
  input  wire [1:0]        policy_boot_mode,    // MODE_DUAL / MODE_LEGACY / MODE_UEFI
  input  wire              policy_allow_destructive,
  input  wire              policy_prov_latches,

  // ------------------------------------------------- provisioning (fixture)
  input  wire              prov_valid,
  input  wire [1:0]        prov_idx,
  input  wire [VEC_W-1:0]  prov_vec,

  // ------------------------------------------------- measurement interface
  input  wire              meas_valid,
  input  wire [1:0]        meas_stage,
  input  wire [VEC_W-1:0]  meas_digest,

  // ------------------------------------------------- boot source descriptor
  input  wire [1:0]        boot_kind,           // BOOT_NONE / BOOT_LEGACY / BOOT_UEFI

  // ------------------------------------------------- ATA command interface
  input  wire              cmd_valid,
  input  wire [7:0]        cmd,
  input  wire              pwd_ok,

  // ------------------------------------------------- outputs
  output wire              mode_ok,             // presented boot source is allowed by policy
  output wire              cpu_release,         // hand control to the measured stage
  output wire [3:0]        boot_deny_reason,
  output wire              media_write_allow,
  output wire              media_read_allow,
  output wire              erase_grant,
  output wire              reflash_grant,
  output wire              erase_denied_tamper,
  output wire              reflash_denied_tamper,
  output wire              tamper_latch,
  output wire              chain_ok,
  output wire [1:0]        lock_state,
  output wire [VEC_W-1:0]  vector,
  output wire [3:0]        stage_ok_mask,
  output wire [2:0]        ext_count,
  output wire [1:0]        last_stage,
  output wire              last_stage_ok,
  output wire              prov_done,
  output wire              prov_violation,
  output wire              recovery_active,
  output wire              arm_latched,
  output wire [3:0]        ignored_measurements,
  output wire              sec_enabled,
  output wire              sec_locked,
  output wire              sec_frozen,
  output wire              erase_required,
  output wire [2:0]        fail_count,
  output wire [3:0]        abort_code,
  output wire              cmd_aborted,
  output wire [63:0]       status
);

  // ------------------------------------------------------------ recovery
  // Physical presence is only meaningful before the platform has handed
  // control to any measured stage.
  wire preboot = ~chain_ok & (lock_state == `LCK_IDLE);
  assign recovery_active = strap_recovery & preboot;

  wire prov_en = recovery_active;   // re-provisioning needs the fixture strap

  // -------------------------------------------------------- boot mode policy
  reg mode_ok;
  always @* begin
    case (policy_boot_mode)
      `MODE_LEGACY: mode_ok = (boot_kind == `BOOT_LEGACY);
      `MODE_UEFI:   mode_ok = (boot_kind == `BOOT_UEFI);
      default:      mode_ok = (boot_kind != `BOOT_NONE);
    endcase
  end

  // ------------------------------------------------------------- the lock
  wire [VEC_W-1:0] lock_vector;
  wire [2:0] arm_ext_count;

  boot_vector_lock #(.VEC_W(VEC_W), .LANES(LANES), .ROUNDS(ROUNDS)) u_lock (
    .clk                  (clk),
    .rst_n                (rst_n),
    .arm                  (arm),
    .prov_en              (prov_en),
    .prov_valid           (prov_valid),
    .prov_idx             (prov_idx),
    .prov_vec             (prov_vec),
    .policy_prov_latches  (policy_prov_latches),
    .meas_valid           (meas_valid),
    .meas_stage           (meas_stage),
    .meas_digest          (meas_digest),
    .chain_ok             (chain_ok),
    .tamper_latch         (tamper_latch),
    .lock_state           (lock_state),
    .vector               (lock_vector),
    .stage_ok_mask        (stage_ok_mask),
    .expected_stage       (),
    .ext_count            (arm_ext_count),
    .arm_latched          (arm_latched),
    .prov_done            (prov_done),
    .prov_violation       (prov_violation),
    .last_stage           (last_stage),
    .last_stage_ok        (last_stage_ok),
    .ignored_measurements (ignored_measurements)
  );

  assign vector    = lock_vector;
  assign ext_count = arm_ext_count;

  // ---------------------------------------------------- handoff decision
  assign cpu_release      = chain_ok & mode_ok & (boot_kind != `BOOT_NONE)
                            & ~tamper_latch;
  assign boot_deny_reason = cpu_release        ? `DENY_NONE  :
                            tamper_latch       ? `DENY_TAMPER :
                            ~chain_ok          ? `DENY_CHAIN :
                            (boot_kind == `BOOT_NONE) ? `DENY_SOURCE :
                            ~mode_ok           ? `DENY_MODE  :
                                                 `DENY_ARM;

  // --------------------------------------------------- ATA security gates
  ata_security_fsm u_ata (
    .clk                  (clk),
    .rst_n                (rst_n),
    .cmd_valid            (cmd_valid),
    .cmd                  (cmd),
    .pwd_ok               (pwd_ok),
    .chain_ok             (chain_ok),
    .tamper_latch         (tamper_latch),
    .recovery_ok          (recovery_active),
    .allow_destructive    (policy_allow_destructive),
    .data_access_allow    (media_read_allow),
    .media_write_allow    (media_write_allow),
    .erase_grant          (erase_grant),
    .reflash_grant        (reflash_grant),
    .erase_denied_tamper  (erase_denied_tamper),
    .reflash_denied_tamper(reflash_denied_tamper),
    .sec_enabled          (sec_enabled),
    .sec_locked           (sec_locked),
    .sec_frozen           (sec_frozen),
    .erase_prepared       (),
    .erase_required       (erase_required),
    .unlock_blocked       (),
    .fail_count           (fail_count),
    .abort_code           (abort_code),
    .cmd_aborted          (cmd_aborted)
  );

  // ------------------------------------------------------- status word
  // Layout is documented in docs/VCHIP.md and asserted by the driver before it
  // trusts any field read out of it.
  assign status[0]     = chain_ok;
  assign status[1]     = tamper_latch;
  assign status[3:2]   = lock_state;
  assign status[5:4]   = boot_kind;
  assign status[7:6]   = policy_boot_mode;
  assign status[8]     = mode_ok;
  assign status[12:9]  = boot_deny_reason;
  assign status[13]    = sec_enabled;
  assign status[14]    = sec_locked;
  assign status[15]    = sec_frozen;
  assign status[16]    = erase_required;
  assign status[19:17] = fail_count;
  assign status[20]    = media_write_allow;
  assign status[21]    = media_read_allow;
  assign status[22]    = erase_grant;
  assign status[23]    = reflash_grant;
  assign status[24]    = erase_denied_tamper;
  assign status[25]    = reflash_denied_tamper;
  assign status[27:26] = last_stage;
  assign status[28]    = last_stage_ok;
  assign status[31:29] = ext_count;
  assign status[32]    = prov_done;
  assign status[33]    = prov_violation;
  assign status[34]    = recovery_active;
  assign status[35]    = cpu_release;
  // [36] was a duplicate of ext_count (which already lives in [31:29]), so the
  // arming state - the single most important observable for an operator, "is
  // enforcement actually on?" - was missing from the status word entirely.
  assign status[36]    = arm_latched;
  assign status[38:37] = 2'd0;
  assign status[43:39] = 5'd0;
  assign status[47:44] = abort_code;
  assign status[48]    = cmd_aborted;
  assign status[55:52] = ignored_measurements;
  assign status[51:49] = 3'd0;
  assign status[63:56] = 8'd0;

endmodule
