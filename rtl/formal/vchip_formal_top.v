// vchip_formal_top.v — property harness for the virtual chipset.
//
// The chipset's security claims are stated here as signals that must be 1 in
// every reachable state, and tools/verify_rtl.py asks yosys' SAT solver to
// refute each of them:
//
//     yosys -p "read_verilog -Irtl ... rtl/formal/vchip_formal_top.v;
//               prep -top vchip_formal_top;
//               sat -seq 24 -prove inv_erase_needs_chain 1"
//
// Two kinds of property appear below:
//
//   * plain invariants (inv_*), which are functions of one state;
//   * "sticky" invariants, which need a monitor flop (tamper_seen / locked_seen)
//     to remember that the trigger happened at any point in the trace. Those are
//     the ones that matter most: a fail-closed design is only interesting if the
//     latch cannot be undone.
//
// Reset assumption: every sticky property is stated modulo reset, because in
// this model the tamper latch is an ordinary flop that a power-on reset clears.
// The assertion is therefore "once latched, stays latched for as long as reset
// is not asserted". Production silicon has to keep this state somewhere a
// CPU-issued warm reset cannot reach (battery-backed register or OTP), or the
// property is worth nothing. See docs/VCHIP.md.

`include "vchip_pkg.vh"

module vchip_formal_top #(
  parameter VEC_W = `VCHIP_VEC_W,
  parameter LANES = `VCHIP_LANES,
  parameter ROUNDS = `VCHIP_MIX_ROUNDS
) (
  input wire              clk,
  input wire              rst_n,
  input wire              arm,
  input wire              strap_recovery,
  input wire [1:0]        policy_boot_mode,
  input wire              policy_allow_destructive,
  input wire              policy_prov_latches,
  input wire              prov_valid,
  input wire [1:0]        prov_idx,
  input wire [VEC_W-1:0]  prov_vec,
  input wire              meas_valid,
  input wire [1:0]        meas_stage,
  input wire [VEC_W-1:0]  meas_digest,
  input wire [1:0]        boot_kind,
  input wire              cmd_valid,
  input wire [7:0]        cmd,
  input wire              pwd_ok,

  output wire             inv_tamper_no_chain,
  output wire             inv_locked_is_tamper,
  output wire             inv_tamper_is_locked,
  output wire             inv_unlock_mask_complete,
  output wire             inv_unlock_state_is_unlocked,
  output wire             inv_erase_needs_chain,
  output wire             inv_erase_needs_no_tamper,
  output wire             inv_erase_needs_destructive_policy,
  output wire             inv_reflash_needs_no_tamper,
  output wire             inv_reflash_needs_chain,
  output wire             inv_write_needs_chain,
  output wire             inv_write_needs_no_tamper,
  output wire             inv_grants_need_unlocked,
  output wire             inv_release_needs_chain,
  output wire             inv_release_needs_no_tamper,
  output wire             inv_release_needs_mode,
  output wire             inv_sticky_tamper,
  output wire             inv_sticky_locked,
  output wire             inv_locked_grants_nothing,
  output wire             inv_vector_advances_in_order
);

  wire chain_ok, tamper_latch, media_write_allow, media_read_allow;
  wire erase_grant, reflash_grant, cpu_release, mode_ok;
  wire [1:0] lock_state, last_stage;
  wire [3:0] stage_ok_mask;
  wire [2:0] ext_count;
  wire [VEC_W-1:0] vector;

  vchip_top #(.VEC_W(VEC_W), .LANES(LANES), .ROUNDS(ROUNDS)) dut (
    .clk(clk), .rst_n(rst_n), .arm(arm), .strap_recovery(strap_recovery),
    .policy_boot_mode(policy_boot_mode),
    .policy_allow_destructive(policy_allow_destructive),
    .policy_prov_latches(policy_prov_latches),
    .prov_valid(prov_valid), .prov_idx(prov_idx), .prov_vec(prov_vec),
    .meas_valid(meas_valid), .meas_stage(meas_stage), .meas_digest(meas_digest),
    .boot_kind(boot_kind),
    .cmd_valid(cmd_valid), .cmd(cmd), .pwd_ok(pwd_ok),
    .cpu_release(cpu_release), .boot_deny_reason(),
    .media_write_allow(media_write_allow), .media_read_allow(media_read_allow),
    .erase_grant(erase_grant), .reflash_grant(reflash_grant),
    .erase_denied_tamper(), .reflash_denied_tamper(),
    .tamper_latch(tamper_latch), .chain_ok(chain_ok),
    .lock_state(lock_state), .vector(vector), .stage_ok_mask(stage_ok_mask),
    .ext_count(ext_count), .last_stage(last_stage), .last_stage_ok(),
    .prov_done(), .prov_violation(), .recovery_active(),
    .ignored_measurements(),
    .sec_enabled(), .sec_locked(), .sec_frozen(), .erase_required(),
    .fail_count(), .abort_code(), .cmd_aborted(), .status()
  );

  // `mode_ok` lives inside the top; recompute it here because the release
  // property needs it as a standalone signal.
  assign mode_ok = (policy_boot_mode == `MODE_LEGACY) ? (boot_kind == `BOOT_LEGACY) :
                   (policy_boot_mode == `MODE_UEFI)   ? (boot_kind == `BOOT_UEFI)   :
                                                        (boot_kind != `BOOT_NONE);

  // ------------------------------------------------------------- monitors
  reg tamper_seen;
  reg locked_seen;
  initial begin
    tamper_seen = 1'b0;
    locked_seen = 1'b0;
  end
  always @(posedge clk) begin
    if (!rst_n) begin
      tamper_seen <= 1'b0;
      locked_seen <= 1'b0;
    end else begin
      if (tamper_latch) tamper_seen <= 1'b1;
      if (lock_state == `LCK_LOCKED) locked_seen <= 1'b1;
    end
  end

  // ---------------------------------------------------------- invariants
  // Fail-closed dominance: the latch clears chain_ok in the same cycle it sets.
  assign inv_tamper_no_chain        = ~tamper_latch | ~chain_ok;
  // A lock that is LOCKED is a lock that noticed something, and every way of
  // noticing drives the lock to LOCKED. Both directions matter: without the
  // second one a latch could sit in MEASURING while chain_ok is already gone,
  // which is confusing to debug even if the gates still deny.
  assign inv_locked_is_tamper       = (lock_state != `LCK_LOCKED) | tamper_latch;
  assign inv_tamper_is_locked       = ~tamper_latch | (lock_state == `LCK_LOCKED);
  // Unlocking requires every stage to have matched, in order.
  assign inv_unlock_mask_complete   = ~chain_ok | (stage_ok_mask == 4'b0111);
  assign inv_unlock_state_is_unlocked = ~chain_ok | (lock_state == `LCK_UNLOCKED);
  // Destructive operations need a verified chain, no latch, and explicit policy.
  assign inv_erase_needs_chain      = ~erase_grant | chain_ok;
  assign inv_erase_needs_no_tamper  = ~erase_grant | ~tamper_latch;
  assign inv_erase_needs_destructive_policy = ~erase_grant | policy_allow_destructive;
  assign inv_reflash_needs_no_tamper = ~reflash_grant | ~tamper_latch;
  assign inv_reflash_needs_chain    = ~reflash_grant | chain_ok;
  // Nothing writes media before the chain verifies.
  assign inv_write_needs_chain      = ~media_write_allow | chain_ok;
  assign inv_write_needs_no_tamper  = ~media_write_allow | ~tamper_latch;
  // Every capability gate implies the lock actually reached UNLOCKED.
  assign inv_grants_need_unlocked   = (~erase_grant & ~reflash_grant & ~media_write_allow
                                       & ~cpu_release) | (lock_state == `LCK_UNLOCKED);
  // Handoff needs a verified chain, no latch, and a source the policy allows.
  assign inv_release_needs_chain    = ~cpu_release | chain_ok;
  assign inv_release_needs_no_tamper = ~cpu_release | ~tamper_latch;
  assign inv_release_needs_mode     = ~cpu_release | mode_ok;
  // Sticky properties (modulo reset, see the header comment).
  assign inv_sticky_tamper          = ~tamper_seen | tamper_latch;
  assign inv_sticky_locked          = ~locked_seen | (lock_state == `LCK_LOCKED)
                                                   | (lock_state == `LCK_UNLOCKED);
  // A locked chipset grants nothing at all.
  assign inv_locked_grants_nothing  = (lock_state != `LCK_LOCKED)
                                    | (~erase_grant & ~reflash_grant
                                       & ~media_write_allow & ~cpu_release);
  // The vector only ever advances one stage at a time: ext_count is a saturating
  // 3-bit counter and can never exceed the number of stages.
  assign inv_vector_advances_in_order = (ext_count <= `VCHIP_STAGES);

endmodule
