// dtmf_tone_gen.v — dual-tone generator and Goertzel detector for DTMF.
//
// This is the legitimate shared core of telephony tone work: dial out, and read
// back what the far end pressed. A call centre needs both, and neither belongs
// in floating point on a host when an 8 kHz sample clock is right there.
//
// Data flow:
//
//   key[3:0] ──► two DDS cores ──► 50% mix ──► saturate ──► sample[11:0]
//                     │
//                     └─ 32-bit phase accumulator, 1024 x 12-bit sine table
//
//   sample ──► Hann window ──► Goertzel recurrence ──► |X|^2 per bin ──► digit
//
// Every constant here is mirrored in js/dtmf-model.js and frozen into
// rtl/golden/ by tools/gen_dtmf_vectors.mjs. tests/dtmf-rtl.test.mjs parses this
// file and compares the constants against the model, so a constant that drifts
// on one side fails the suite.
//
// NOT SIMULATED IN THIS REPOSITORY. There is no Icarus, Verilator or GHDL in the
// sandbox; the JS model is the executable specification and the golden vectors
// in rtl/golden/dtmf_vectors.json are the contract. rtl/dtmf_tb.v drives this
// file from those vectors if you have a simulator.
//
// Three numbers below were measured rather than chosen, and each one is a bug
// that was actually hit on the model side:
//
//   1. ACC_W = 21. The Goertzel recurrence has a pole on the unit circle, so s
//      grows with block length. Measured peak |s| over a 205-sample windowed
//      block is 100,416 — 18 bits. 21 leaves guard for a louder input. A 32-bit
//      intermediate silently truncated the model at N=300 and cost it 5 of 16
//      keys, which looked like a windowing problem and was not one.
//
//   2. Each tone is mixed at 50% (the >> 1). Two full-scale sines clipped at
//      +-2048 put harmonics on other DTMF bins: 2 x 697 = 1394 Hz sits 4% from
//      1336 and 1477. Full-scale mixing decoded 5 of 16 keys.
//
//   3. The Hann window is not optional. 205 samples at 8 kHz resolve about
//      39 Hz, and the closest DTMF pair (697/770) is 73 Hz apart. Rectangular
//      windowing decoded 7 of 16; windowed, 16 of 16.

module dtmf_tone_gen #(
  parameter PH_W     = 32,   // phase accumulator width
  parameter IDX_W    = 10,   // 1024 table entries
  parameter SAMPLE_W = 12    // signed sine amplitude
) (
  input  wire                   clk,
  input  wire                   rst_n,

  input  wire                   start,     // pulse: begin one tone burst
  input  wire [3:0]             key,       // 0..9, *, #, A..D, row-major
  input  wire [15:0]            length,    // samples to emit

  output reg                    busy,
  output reg                    valid,     // one-cycle strobe per sample
  output reg  signed [SAMPLE_W-1:0] sample
);

  /* ------------------------------------------------------------- sine table */
  // Loaded from the same file the golden model wrote, so the two cannot differ.
  reg signed [SAMPLE_W-1:0] sine [0:(1<<IDX_W)-1];
  initial $readmemh("rtl/golden/dtmf_sine.hex", sine);

  /* ------------------------------------------------------- phase increments */
  // inc = round(f * 2^32 / fs) at fs = 8000 Hz. ITU-T Q.23 frequencies.
  // Cross-checked against js/dtmf-model.js phaseInc() by the test suite.
  localparam [PH_W-1:0] INC_697  = 32'd374199026;
  localparam [PH_W-1:0] INC_770  = 32'd413390602;
  localparam [PH_W-1:0] INC_852  = 32'd457414017;
  localparam [PH_W-1:0] INC_941  = 32'd505195528;
  localparam [PH_W-1:0] INC_1209 = 32'd649076933;
  localparam [PH_W-1:0] INC_1336 = 32'd717259538;
  localparam [PH_W-1:0] INC_1477 = 32'd792958337;
  localparam [PH_W-1:0] INC_1633 = 32'd876710199;

  // key[3:2] selects the row (low group), key[1:0] the column (high group).
  // Order matches DTMF_KEYS in the model: 1 2 3 A / 4 5 6 B / 7 8 9 C / * 0 # D.
  function [PH_W-1:0] low_inc;
    input [1:0] row;
    begin
      case (row)
        2'd0:    low_inc = INC_697;
        2'd1:    low_inc = INC_770;
        2'd2:    low_inc = INC_852;
        default: low_inc = INC_941;
      endcase
    end
  endfunction

  function [PH_W-1:0] high_inc;
    input [1:0] col;
    begin
      case (col)
        2'd0:    high_inc = INC_1209;
        2'd1:    high_inc = INC_1336;
        2'd2:    high_inc = INC_1477;
        default: high_inc = INC_1633;
      endcase
    end
  endfunction

  /* -------------------------------------------------------------------- DDS */

  reg [PH_W-1:0]  phase_lo, phase_hi;
  reg [PH_W-1:0]  inc_lo, inc_hi;
  reg [15:0]      remaining;

  wire [IDX_W-1:0] idx_lo = phase_lo[PH_W-1 -: IDX_W];
  wire [IDX_W-1:0] idx_hi = phase_hi[PH_W-1 -: IDX_W];

  wire signed [SAMPLE_W-1:0] s_lo = sine[idx_lo];
  wire signed [SAMPLE_W-1:0] s_hi = sine[idx_hi];

  // 50% each: see note 2 in the header. The sum of two half-scale sines cannot
  // reach the limiter, so the >> 1 is the real headroom control and the
  // saturation below is only a safety net.
  wire signed [SAMPLE_W:0] mixed = {s_lo[SAMPLE_W-1], s_lo} + {s_hi[SAMPLE_W-1], s_hi};
  wire signed [SAMPLE_W-1:0] halved = mixed[SAMPLE_W:1];

  localparam signed [SAMPLE_W-1:0] LIM_POS =  {1'b0, {(SAMPLE_W-1){1'b1}}};
  localparam signed [SAMPLE_W-1:0] LIM_NEG = -{1'b0, {(SAMPLE_W-1){1'b1}}} - 1'b1;

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      busy      <= 1'b0;
      valid     <= 1'b0;
      sample    <= {SAMPLE_W{1'b0}};
      phase_lo  <= {PH_W{1'b0}};
      phase_hi  <= {PH_W{1'b0}};
      remaining <= 16'd0;
      inc_lo    <= {PH_W{1'b0}};
      inc_hi    <= {PH_W{1'b0}};
    end else if (start && !busy) begin
      busy      <= 1'b1;
      valid     <= 1'b0;
      inc_lo    <= low_inc(key[3:2]);
      inc_hi    <= high_inc(key[1:0]);
      phase_lo  <= {PH_W{1'b0}};
      phase_hi  <= {PH_W{1'b0}};
      remaining <= length;
    end else if (busy) begin
      if (remaining == 16'd0) begin
        busy  <= 1'b0;
        valid <= 1'b0;
      end else begin
        phase_lo  <= phase_lo + inc_lo;
        phase_hi  <= phase_hi + inc_hi;
        remaining <= remaining - 16'd1;
        valid     <= 1'b1;
        sample    <= (halved > LIM_POS) ? LIM_POS
                   : (halved < LIM_NEG) ? LIM_NEG
                   :                      halved;
      end
    end else begin
      valid <= 1'b0;
    end
  end

endmodule


// dtmf_goertzel — one bin of the detector. Instantiate eight of these, one per
// DTMF frequency, and compare the powers; that comparison is combinational and
// deliberately lives outside this module so the bin itself stays testable alone.
//
//   s[n] = x[n] + (k*s[n-1] >> 15) - s[n-2]
//   |X|^2 = s[N-1]^2 + s[N-2]^2 - k*s[N-1]*s[N-2] >> 15
//
// ACC_W is 21 because that is what the measured peak needs, not because 21 is a
// round number. See note 1 in the header above.

module dtmf_goertzel #(
  parameter ACC_W  = 21,
  parameter KW     = 16,    // Q15 coefficient, one spare sign bit
  parameter SHIFT  = 15
) (
  input  wire                       clk,
  input  wire                       rst_n,

  input  wire                       start,      // pulse: begin a block
  input  wire signed [11:0]         x,          // windowed input sample
  input  wire signed [KW-1:0]       k,          // goertzelK(f) from the model
  input  wire                       last,       // asserted with the final sample

  output reg                        done,
  output reg  signed [2*ACC_W+SHIFT-1:0] power
);

  reg signed [ACC_W-1:0] s1, s2;
  reg                    running;

  wire signed [ACC_W+KW-1:0] prod   = k * s1;
  wire signed [ACC_W-1:0]    scaled = prod >>> SHIFT;
  wire signed [ACC_W-1:0]    s0     = {{(ACC_W-12){x[11]}}, x} + scaled - s2;

  wire signed [2*ACC_W+SHIFT-1:0] sq1   = s1 * s1;
  wire signed [2*ACC_W+SHIFT-1:0] sq2   = s2 * s2;
  wire signed [2*ACC_W+KW-1:0]    cross = k * s1 * s2;

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      s1 <= {ACC_W{1'b0}};
      s2 <= {ACC_W{1'b0}};
      power  <= {(2*ACC_W+SHIFT){1'b0}};
      done   <= 1'b0;
      running <= 1'b0;
    end else begin
      done <= 1'b0;
      if (start) begin
        s1 <= {ACC_W{1'b0}};
        s2 <= {ACC_W{1'b0}};
        running <= 1'b1;
      end else if (running) begin
        s2 <= s1;
        s1 <= s0;
        if (last) begin
          running <= 1'b0;
          power   <= sq1 + sq2 - (cross >>> SHIFT);
          done    <= 1'b1;
        end
      end
    end
  end

endmodule
