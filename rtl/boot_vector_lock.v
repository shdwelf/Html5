// boot_vector_lock.v — the boot-chain measurement lock.
//
// Semantics, in the order the block enforces them:
//
//   1. ARMING. The lock does nothing until `arm` is asserted. The first
//      assertion latches `arm_latched`, and that latch is sticky until power-on
//      reset, so an attacker that drops the strap mid-boot cannot disarm a
//      running chain.
//
//   2. PROVISIONING. While the chain is untouched (`lock_state == LCK_IDLE`)
//      a golden cumulative vector may be written per stage index through the
//      `prov_*` port. The first accepted measurement closes provisioning
//      forever; a later provision attempt raises `prov_violation` and, when
//      `policy_prov_latches` is set, latches tamper. This models a one-time
//      fuse: the reference vector can never be rewritten by the host it is
//      supposed to police.
//
//   3. EXTEND. Each accepted measurement must arrive in stage order starting at
//      STAGE_MBR. On acceptance: vector <= mix(vector, digest). Out-of-order,
//      repeated, or skipped stages are an attack: they latch immediately.
//
//   4. MATCH. The extended vector is compared with the golden vector for that
//      stage. A mismatch latches LOCKED on the spot (fail closed at the first
//      bad stage, which is also what makes the transcript useful: the failing
//      stage index is recorded in stage_ok_mask / last_stage).
//
//   5. UNLOCK. Only after the final stage matches, with every earlier stage
//      marked ok, does chain_ok assert.
//
// Once `tamper_latch` is set, chain_ok stays 0, no further measurement can
// change the vector or the counters, and the only exit is rst_n.
//
// Limitations that matter in the real world (see docs/VCHIP.md):
//   * `rst_n` here is power-on reset. In silicon the tamper state must live in
//     a battery-backed register or OTP, otherwise pulling reset clears the
//     evidence. Every property proved here is conditional on that assumption.
//   * A digest arriving on `meas_digest` is trusted. The whole scheme collapses
//     if the CPU can drive that bus, which is why production needs the hash
//     core on a path the CPU cannot write.

`include "vchip_pkg.vh"

module boot_vector_lock #(
  parameter VEC_W = `VCHIP_VEC_W,
  parameter LANES = `VCHIP_LANES,
  parameter ROUNDS = `VCHIP_MIX_ROUNDS
) (
  input  wire              clk,
  input  wire              rst_n,          // power-on reset

  // Arming strap
  input  wire              arm,

  // One-time provisioning of the golden vectors
  input  wire              prov_en,
  input  wire              prov_valid,
  input  wire [1:0]        prov_idx,
  input  wire [VEC_W-1:0]  prov_vec,
  input  wire              policy_prov_latches,

  // Measurement interface (fed by the chipset's hash/DMA path)
  input  wire              meas_valid,
  input  wire [1:0]        meas_stage,
  input  wire [VEC_W-1:0]  meas_digest,

  // Status
  output wire              chain_ok,
  output reg               tamper_latch,
  output reg  [1:0]        lock_state,
  output reg  [VEC_W-1:0]  vector,
  output reg  [3:0]        stage_ok_mask,
  output reg  [1:0]        expected_stage,
  output reg  [2:0]        ext_count,
  output reg               arm_latched,
  output reg               prov_done,
  output reg               prov_violation,
  output reg  [1:0]        last_stage,
  output reg               last_stage_ok,
  output reg  [3:0]        ignored_measurements   // refused because the lock is closed
);

  localparam SEED = {VEC_W{1'b0}} ^ {LANES{16'h5A5A}};

  reg [VEC_W-1:0] golden0, golden1, golden2;
  reg             meas_seen;   // any measurement accepted ever (post-POR)

  wire [VEC_W-1:0] mix_acc;
  wire [VEC_W-1:0] mix_next;

  vchip_mix #(.VEC_W(VEC_W), .LANES(LANES), .ROUNDS(ROUNDS)) u_mix (
    .acc (vector),
    .dig (meas_digest),
    .mix (mix_next)
  );

  // Golden vector selected by stage index.
  reg [VEC_W-1:0] golden_sel;
  always @* begin
    case (meas_stage)
      2'd0:    golden_sel = golden0;
      2'd1:    golden_sel = golden1;
      default: golden_sel = golden2;
    endcase
  end

  wire stage_match = (mix_next == golden_sel);
  wire armed       = arm_latched;

  // A provisioning attempt that has to be treated as an attack, resolved
  // combinationally so that it can also poison a measurement arriving in the
  // same cycle. The SAT solver found this race: with the two blocks merely
  // ordered, a valid measurement in the same cycle as a provisioning violation
  // overwrote LOCKED while tamper_latch stayed set, i.e. "tampered but not
  // locked" for a cycle. See docs/VCHIP.md.
  wire prov_write_ok      = prov_en & ~prov_done & ~meas_seen & ~closed;
  wire prov_attack        = prov_valid & ~prov_write_ok;
  wire prov_attack_latches = prov_attack & policy_prov_latches
                           & (prov_done | meas_seen | closed);
  wire closed_now         = closed | prov_attack_latches;
  // Once unlocked the chain is complete: a further "stage" is not a stage, it
  // is either a late duplicate or an attempt to roll the vector. Treat the
  // lock as closed so it can never be re-opened or re-extended.
  wire closed      = tamper_latch | (lock_state == `LCK_LOCKED)
                                 | (lock_state == `LCK_UNLOCKED);
  wire in_order    = (meas_stage == expected_stage);

// Reset policy: synchronous, so that formal tools see a well-defined initial
// state (an asynchronous reset makes yosys' SAT engine invent flops with
// undefined initial values, which silently invalidates any proof). Production
// silicon would use an async power-on reset with a reset synchroniser; what
// matters for the properties below is that the tamper latch and the chain
// state must live outside any reset domain a CPU can reach.

  // Initial state for formal verification and CXXRTL: identical to the reset
  // branch below. Without this, bounded proofs would be free to start from an
  // arbitrary state (e.g. tamper already set) and would not mean what they say.
  initial begin
    tamper_latch         = 1'b0;
    lock_state           = `LCK_IDLE;
    vector               = SEED;
    stage_ok_mask        = 4'b0000;
    expected_stage       = `STAGE_MBR;
    ext_count            = 3'd0;
    arm_latched          = 1'b0;
    prov_done            = 1'b0;
    prov_violation       = 1'b0;
    last_stage           = 2'd0;
    last_stage_ok        = 1'b0;
    ignored_measurements = 4'd0;
    meas_seen            = 1'b0;
    golden0              = SEED;
    golden1              = SEED;
    golden2              = SEED;
  end

  always @(posedge clk) begin
    if (!rst_n) begin
      tamper_latch         <= 1'b0;
      lock_state           <= `LCK_IDLE;
      vector               <= SEED;
      stage_ok_mask        <= 4'b0000;
      expected_stage       <= `STAGE_MBR;
      ext_count            <= 3'd0;
      arm_latched          <= 1'b0;
      prov_done            <= 1'b0;
      prov_violation       <= 1'b0;
      last_stage           <= 2'd0;
      last_stage_ok        <= 1'b0;
      ignored_measurements <= 4'd0;
      meas_seen            <= 1'b0;
      golden0              <= SEED;
      golden1              <= SEED;
      golden2              <= SEED;
    end else begin
      // ------------------------------------------------------------- arming
      if (arm) arm_latched <= 1'b1;

      // -------------------------------------------------------- provisioning
      // A write to the golden vectors happens only inside a fixture window:
      // the provisioning strap must be asserted (prov_en), the chain must be
      // untouched, and the fuse must not already be burnt. Every other
      // provision attempt is recorded in prov_violation whether or not the
      // strap is present -- an in-band attempt to rewrite the root of trust is
      // exactly the event this block exists to notice, and staying silent about
      // it because a strap is low would hide the attack.
      if (prov_valid) begin
        if (prov_write_ok) begin
          case (prov_idx)
            2'd0:    golden0 <= prov_vec;
            2'd1:    golden1 <= prov_vec;
            default: golden2 <= prov_vec;
          endcase
          if (prov_idx == `VCHIP_STAGES - 1) prov_done <= 1'b1;
        end else begin
          prov_violation <= 1'b1;
          // Latch only when there was a root of trust to protect: before the
          // fuse is burnt (and before any stage has run) a stray write cannot
          // rewrite anything, so it is flagged rather than treated as tamper.
          if (policy_prov_latches && (prov_done | meas_seen | closed)) begin
            tamper_latch <= 1'b1;
            // Fail closed: a tamper latch always drives the lock to LOCKED, so
            // `tamper_latch -> lock_state == LCK_LOCKED` is an invariant rather
            // than something that happens to hold on the measurement paths.
            lock_state   <= `LCK_LOCKED;
          end
        end
      end

      // ---------------------------------------------------------- measurement
      if (meas_valid) begin
        if (closed_now) begin
          // After the latch (or after a successful unlock) the block is inert
          // to measurements; count them so the platform can report the attempts
          // rather than silently swallowing them.
          ignored_measurements <= ignored_measurements + 4'd1;
        end else if (!armed) begin
          // Nothing is measured before the lock is armed. Counted, not latched:
          // an unarmed platform is a configuration error, not necessarily an
          // attack, and the policy layer decides what that means.
          ignored_measurements <= ignored_measurements + 4'd1;
        end else if (!in_order) begin
          // Skip, repeat or rollback of a boot stage.
          tamper_latch   <= 1'b1;
          lock_state     <= `LCK_LOCKED;
          last_stage     <= meas_stage;
          last_stage_ok  <= 1'b0;
        end else begin
          meas_seen      <= 1'b1;
          vector         <= mix_next;
          ext_count      <= ext_count + 3'd1;
          expected_stage <= meas_stage + 2'd1;
          last_stage     <= meas_stage;
          last_stage_ok  <= stage_match;

          if (!stage_match) begin
            // First bad stage: latch immediately.
            tamper_latch  <= 1'b1;
            lock_state    <= `LCK_LOCKED;
          end else begin
            stage_ok_mask[meas_stage] <= 1'b1;
            if (ext_count == 3'd0) lock_state <= `LCK_MEASURING;

            if (meas_stage == `VCHIP_STAGES - 1) begin
              // Final stage. Unlock only if every earlier stage was also ok.
              if (stage_ok_mask[0] && stage_ok_mask[1]) begin
                lock_state <= `LCK_UNLOCKED;
              end else begin
                tamper_latch <= 1'b1;
                lock_state   <= `LCK_LOCKED;
              end
            end
          end
        end
      end

    end
  end

  // chain_ok is deliberately NOT a register.
  //
  // It used to be, and a SAT counterexample found the hole: a provisioning
  // violation latches tamper in the same edge at which a registered chain_ok
  // would still have read 1, leaving one cycle where the platform saw
  // "chain verified" and "tampered" at once. Deriving it combinatorially makes
  // `tamper_latch -> ~chain_ok` true in every cycle, not just eventually.
  assign chain_ok = (lock_state == `LCK_UNLOCKED) & ~tamper_latch;

  // Keep the formal harness honest: mix_acc is unused by design (the mixer is
  // purely combinational), referenced only so linters do not prune the port.
  assign mix_acc = mix_next;

endmodule
