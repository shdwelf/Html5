// ata_security_fsm.v — ATA Security feature set, plus the chipset's gates.
//
// This models the state machine behind the open-source tooling that everyone
// actually types at a drive:
//
//     hdparm --security-set-pass p /dev/sdX      -> SECURITY SET PASSWORD
//     hdparm --security-unlock p /dev/sdX        -> SECURITY UNLOCK
//     hdparm --security-disable p /dev/sdX       -> SECURITY DISABLE PASSWORD
//     hdparm --security-freeze /dev/sdX          -> SECURITY FREEZE LOCK
//     hdparm --security-erase p /dev/sdX         -> ERASE PREPARE + ERASE UNIT
//
// Faithful bits: the enabled/locked/frozen triple, the five-attempt counter,
// "after five failures the drive will only accept ERASE UNIT", FREEZE LOCK
// being one-way until power-on reset, and ERASE UNIT requiring a preceding
// ERASE PREPARE.
//
// The added bit — the part that makes this a *chipset* rather than a drive — is
// that every destructive or capability-granting command is gated by the boot
// measurement chain and the tamper latch:
//
//     erase_grant   = prepared & pwd_ok & !frozen & chain_ok & !tamper_latch
//                     & allow_destructive
//     reflash_grant = chain_ok & !tamper_latch & recovery_ok
//     data_access   = chain_ok & !tamper_latch & !sec_locked
//
// With `allow_destructive` tied low the design refuses to erase a tampered
// device, which protects evidence and the recovery image at the cost of
// availability. That trade is deliberate and is documented in docs/VCHIP.md,
// together with the out-of-band recovery path the refusal makes mandatory.

`include "vchip_pkg.vh"

module ata_security_fsm (
  input  wire        clk,
  input  wire        rst_n,

  // Command interface
  input  wire        cmd_valid,
  input  wire [7:0]  cmd,
  input  wire        pwd_ok,

  // From the boot chain
  input  wire        chain_ok,
  input  wire        tamper_latch,
  input  wire        recovery_ok,      // physical-presence recovery strap

  // Policy straps
  input  wire        allow_destructive, // 0 = refuse ERASE/REFLASH on a tampered box

  // Gates
  output wire        data_access_allow,
  output wire        media_write_allow,
  output wire        erase_grant,
  output wire        reflash_grant,
  output reg         erase_denied_tamper,
  output reg         reflash_denied_tamper,

  // Security state (also exposed for the lab UI and the status word)
  output reg         sec_enabled,
  output reg         sec_locked,
  output reg         sec_frozen,
  output reg         erase_prepared,
  output reg         erase_required,   // five bad passwords: only ERASE UNIT works
  output reg         unlock_blocked,
  output reg  [2:0]  fail_count,
  output reg  [3:0]  abort_code,
  output reg         cmd_aborted
);

  reg [7:0] last_cmd;
  reg erase_req, reflash_req;

  // Capability gates are combinational policy terms over registered state, so a
  // grant can never be visible in a cycle where the chain is unverified or the
  // tamper latch is set. Registering these (as an earlier revision did) creates
  // exactly one cycle of fail-open on the transition into LOCKED.
  assign data_access_allow = chain_ok & ~tamper_latch & ~sec_locked;
  assign media_write_allow = data_access_allow;
  assign erase_grant       = erase_req & chain_ok & ~tamper_latch & allow_destructive;
  assign reflash_grant     = reflash_req & chain_ok & ~tamper_latch;

  wire policy_denies_erase    = tamper_latch | ~chain_ok | ~allow_destructive;
  wire policy_denies_reflash  = tamper_latch | ~chain_ok;

// Reset policy: synchronous, so that formal tools see a well-defined initial
// state (an asynchronous reset makes yosys' SAT engine invent flops with
// undefined initial values, which silently invalidates any proof). Production
// silicon would use an async power-on reset with a reset synchroniser; what
// matters for the properties below is that the tamper latch and the chain
// state must live outside any reset domain a CPU can reach.

  // Initial state for formal verification and CXXRTL; mirrors the reset branch.
  initial begin
    erase_req = 1'b0; reflash_req = 1'b0;
    erase_denied_tamper = 1'b0; reflash_denied_tamper = 1'b0;
    sec_enabled = 1'b0; sec_locked = 1'b0; sec_frozen = 1'b0;
    erase_prepared = 1'b0; erase_required = 1'b0; unlock_blocked = 1'b0;
    fail_count = 3'd0; abort_code = `ABORT_NONE; cmd_aborted = 1'b0;
    last_cmd = 8'h00;
  end

  always @(posedge clk) begin
    if (!rst_n) begin
      // Power-on reset: FREEZE LOCK and the latch both clear here. On real
      // hardware a tamper latch must NOT live in flops that reset clears.
      erase_req             <= 1'b0;
      reflash_req           <= 1'b0;
      erase_denied_tamper   <= 1'b0;
      reflash_denied_tamper <= 1'b0;
      sec_enabled           <= 1'b0;
      sec_locked            <= 1'b0;
      sec_frozen            <= 1'b0;
      erase_prepared        <= 1'b0;
      erase_required        <= 1'b0;
      unlock_blocked        <= 1'b0;
      fail_count            <= 3'd0;
      abort_code            <= `ABORT_NONE;
      cmd_aborted           <= 1'b0;
      last_cmd              <= 8'h00;
    end else begin
      // Defaults: a command that does nothing grants nothing.
      erase_req             <= 1'b0;
      reflash_req           <= 1'b0;
      erase_denied_tamper   <= 1'b0;
      reflash_denied_tamper <= 1'b0;
      cmd_aborted           <= 1'b0;
      abort_code            <= `ABORT_NONE;

      if (cmd_valid) begin
        last_cmd <= cmd;
        case (cmd)
          // ---------------------------------------------------------- write/read
          `ATA_WRITE_DMA: begin
            if (!(chain_ok & ~tamper_latch & ~sec_locked)) begin
              cmd_aborted <= 1'b1;
              abort_code  <= sec_locked ? `ABORT_LOCKED : `ABORT_POLICY;
            end
          end
          `ATA_READ_DMA: begin
            if (sec_locked) begin
              cmd_aborted <= 1'b1;
              abort_code  <= `ABORT_LOCKED;
            end
          end

          // ---------------------------------------------------- SECURITY SET PWD
          `ATA_SEC_SET_PWD: begin
            if (sec_frozen) begin
              cmd_aborted <= 1'b1; abort_code <= `ABORT_FROZEN;
            end else if (!sec_enabled) begin
              // First password: enables security, leaves the drive unlocked.
              sec_enabled <= 1'b1;
              sec_locked  <= 1'b0;
              fail_count  <= 3'd0;
              unlock_blocked <= 1'b0;
            end else if (pwd_ok) begin
              // Changing an existing password requires the old one.
              fail_count <= 3'd0;
            end else begin
              fail_count <= fail_count + 3'd1;
              cmd_aborted <= 1'b1; abort_code <= `ABORT_PWD;
              if (fail_count == 3'd4) begin
                erase_required <= 1'b1;
                unlock_blocked <= 1'b1;
              end
            end
          end

          // ------------------------------------------------------- SECURITY UNLOCK
          `ATA_SEC_UNLOCK: begin
            if (sec_frozen) begin
              cmd_aborted <= 1'b1; abort_code <= `ABORT_FROZEN;
            end else if (!sec_enabled) begin
              cmd_aborted <= 1'b1; abort_code <= `ABORT_NOT_ENABLED;
            end else if (unlock_blocked) begin
              // Attempt counter exhausted: per ATA the only way back is
              // ERASE UNIT. Chipset policy may refuse that (see below), and
              // then the device is unrecoverable in-band by construction.
              cmd_aborted <= 1'b1; abort_code <= `ABORT_PWD;
            end else if (pwd_ok) begin
              sec_locked  <= 1'b0;
              fail_count  <= 3'd0;
            end else begin
              fail_count <= fail_count + 3'd1;
              sec_locked <= 1'b1;
              cmd_aborted <= 1'b1; abort_code <= `ABORT_PWD;
              if (fail_count == 3'd4) begin
                erase_required <= 1'b1;
                unlock_blocked <= 1'b1;
              end
            end
          end

          // ----------------------------------------------- SECURITY DISABLE PWD
          `ATA_SEC_DISABLE: begin
            if (sec_frozen) begin
              cmd_aborted <= 1'b1; abort_code <= `ABORT_FROZEN;
            end else if (!sec_enabled) begin
              cmd_aborted <= 1'b1; abort_code <= `ABORT_NOT_ENABLED;
            end else if (pwd_ok) begin
              sec_enabled <= 1'b0;
              sec_locked  <= 1'b0;
              fail_count  <= 3'd0;
              unlock_blocked <= 1'b0;
            end else begin
              fail_count <= fail_count + 3'd1;
              cmd_aborted <= 1'b1; abort_code <= `ABORT_PWD;
            end
          end

          // ------------------------------------------------ SECURITY FREEZE LOCK
          `ATA_SEC_FREEZE: begin
            // One-way until power cycle. This is the drive-side equivalent of
            // "stop changing the security configuration while I am running".
            if (sec_frozen) begin
              cmd_aborted <= 1'b1; abort_code <= `ABORT_FROZEN;
            end else begin
              sec_frozen <= 1'b1;
            end
          end

          // ---------------------------------------------------- SECURITY ERASE
          `ATA_SEC_ERASE_PREP: begin
            if (sec_frozen) begin
              cmd_aborted <= 1'b1; abort_code <= `ABORT_FROZEN;
            end else if (!sec_enabled) begin
              cmd_aborted <= 1'b1; abort_code <= `ABORT_NOT_ENABLED;
            end else begin
              erase_prepared <= 1'b1;
            end
          end

          `ATA_SEC_ERASE_UNIT: begin
            if (sec_frozen) begin
              cmd_aborted <= 1'b1; abort_code <= `ABORT_FROZEN;
              erase_prepared <= 1'b0;
            end else if (!erase_prepared) begin
              cmd_aborted <= 1'b1; abort_code <= `ABORT_NO_PREP;
            end else if (policy_denies_erase) begin
              // Refused by chipset policy, not by the drive: the platters keep
              // their contents and the refusal is latched into the transcript.
              erase_prepared <= 1'b0;
              cmd_aborted <= 1'b1; abort_code <= `ABORT_POLICY;
              if (tamper_latch) erase_denied_tamper <= 1'b1;
            end else if (pwd_ok) begin
              // Destructive and granted. Clears the attempt counter, which is
              // also the documented recovery from a spent counter.
              erase_prepared <= 1'b0;
              erase_req      <= 1'b1;
              sec_locked     <= 1'b0;
              fail_count     <= 3'd0;
              unlock_blocked <= 1'b0;
              erase_required <= 1'b0;
            end else begin
              erase_prepared <= 1'b0;
              fail_count <= fail_count + 3'd1;
              cmd_aborted <= 1'b1; abort_code <= `ABORT_PWD;
            end
          end

          // -------------------------------------------------- vendor reflash
          `ATA_VENDOR_REFLASH: begin
            if (policy_denies_reflash) begin
              cmd_aborted <= 1'b1; abort_code <= `ABORT_POLICY;
              if (tamper_latch) reflash_denied_tamper <= 1'b1;
            end else if (recovery_ok) begin
              reflash_req <= 1'b1;
            end else begin
              // Flashing firmware on a healthy box still requires physical
              // presence: an in-band updater must not be able to replace the
              // code the chain is about to measure.
              cmd_aborted <= 1'b1; abort_code <= `ABORT_POLICY;
            end
          end

          default: begin
            cmd_aborted <= 1'b1; abort_code <= `ABORT_ABRT;
          end
        endcase
      end
    end
  end

endmodule
