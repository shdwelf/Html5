// vchip_mix.v — the vector mixer that implements the extend operation.
//
//     vector' = mix(vector, digest)
//
// This is the "vector processor" half of the vector-lock: LANES parallel
// 16-bit lanes, ROUNDS mixing rounds, each round combining the accumulator
// lane with two rotated digest lanes and a round constant. It is the same
// arithmetic the JavaScript reference model (js/vchip-model.js) performs, so a
// simulation transcript from this RTL and a trace from the reference model are
// comparable byte for byte (tools/verify_vchip_conformance.mjs).
//
// ---------------------------------------------------------------------------
// THIS IS NOT A CRYPTOGRAPHIC HASH.
//
// The mixer is invertible-ish, linear in places, and trivially collidable. It
// exists so the extend/match *logic* can be simulated cycle-accurately and
// proven with SAT, on a vector narrow enough for bounded model checking to
// finish. Production silicon must instantiate a vetted hash core (SHA-256 /
// SHA-3 / SM3) behind this same two-input/one-output interface, and must feed
// it from a DMA path the CPU cannot interpose. Anything else is theatre.
// ---------------------------------------------------------------------------

`include "vchip_pkg.vh"

module vchip_mix #(
  parameter VEC_W = `VCHIP_VEC_W,
  parameter LANES = `VCHIP_LANES,
  parameter ROUNDS = `VCHIP_MIX_ROUNDS
) (
  input  wire [VEC_W-1:0] acc,   // running measurement vector (PCR analogue)
  input  wire [VEC_W-1:0] dig,   // this stage's digest, supplied by the engine
  output wire [VEC_W-1:0] mix    // acc extended with dig
);

  localparam LANE_W = VEC_W / LANES;

  function [LANE_W-1:0] rotl;
    input [LANE_W-1:0] v;
    input integer k;
    begin
      rotl = (v << k) | (v >> (LANE_W - k));
    end
  endfunction

  // Round constants. Fixed, published, and identical in the JS model.
  function [LANE_W-1:0] rconst;
    input integer r;
    begin
      rconst = 16'hACE1 + (r * 16'h1B3F);
    end
  endfunction

  wire [VEC_W-1:0] rnd [0:ROUNDS];
  assign rnd[0] = acc;

  genvar r, i;
  generate
    for (r = 0; r < ROUNDS; r = r + 1) begin : g_round
      for (i = 0; i < LANES; i = i + 1) begin : g_lane
        wire [LANE_W-1:0] a  = rnd[r][i*LANE_W +: LANE_W];
        wire [LANE_W-1:0] d0 = dig[((i + r) % LANES)*LANE_W +: LANE_W];
        wire [LANE_W-1:0] d1 = dig[((i + r + 1) % LANES)*LANE_W +: LANE_W];
        assign rnd[r+1][i*LANE_W +: LANE_W] = rotl(a ^ d0, 5) + d1 + rconst(r);
      end
    end
  endgenerate

  assign mix = rnd[ROUNDS];

endmodule
