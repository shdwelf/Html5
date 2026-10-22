// dtmf_tb.v — testbench for dtmf_tone_gen.v.
//
// NOT RUN IN THIS REPOSITORY. There is no Verilog simulator in the sandbox; the
// executable specification is js/dtmf-model.js and the contract is
// rtl/golden/dtmf_vectors.json, both checked by tests/dtmf-rtl.test.mjs. This
// file exists so the RTL is checkable by anyone who does have a simulator:
//
//   iverilog -o /tmp/dtmf_tb -s dtmf_tb rtl/dtmf_tb.v rtl/dtmf_tone_gen.v
//   vvp /tmp/dtmf_tb
//
// What it does: generates each of the 16 keys, writes the samples to
// build/dtmf_actual.json, and diffs them against rtl/golden/dtmf_vectors.json.
// The comparison itself is left to the node suite — duplicating a JSON differ in
// Verilog would be more code than the design.

`timescale 1ns / 1ps

module dtmf_tb;

  reg         clk = 0;
  reg         rst_n = 0;
  reg         start = 0;
  reg  [3:0]  key = 0;
  reg  [15:0] length = 0;
  wire        busy;
  wire        valid;
  wire signed [11:0] sample;

  always #62.5 clk = ~clk;   // 8 MHz, i.e. 8 clocks per 8 kHz sample slot

  dtmf_tone_gen #(.PH_W(32), .IDX_W(10), .SAMPLE_W(12)) dut (
    .clk(clk), .rst_n(rst_n), .start(start), .key(key), .length(length),
    .busy(busy), .valid(valid), .sample(sample)
  );

  integer f;
  integer k;

  task gen_key(input [3:0] kk, input [15:0] n);
    begin
      @(negedge clk);
      key    = kk;
      length = n;
      start  = 1'b1;
      @(negedge clk);
      start  = 1'b0;
      while (busy) begin
        @(negedge clk);
        if (valid) $fwrite(f, "%0d ", sample);
      end
      $fwrite(f, "\n");
    end
  endtask

  initial begin
    f = $fopen("build/dtmf_actual.json", "w");
    if (f == 0) begin
      $display("cannot open build/dtmf_actual.json - does build/ exist?");
      $finish;
    end

    repeat (4) @(negedge clk);
    rst_n = 1'b1;
    repeat (2) @(negedge clk);

    // key encoding matches DTMF_KEYS in js/dtmf-model.js, row major:
    //   0=1 1=2 2=3 3=A  4=4 5=5 6=6 7=B  8=7 9=8 10=9 11=C  12=* 13=0 14=# 15=D
    for (k = 0; k < 16; k = k + 1) gen_key(k[3:0], 16'd64);

    $fclose(f);
    $display("wrote build/dtmf_actual.json");
    $display("compare against rtl/golden/dtmf_vectors.json with:");
    $display("  node --test tests/dtmf-rtl.test.mjs");
    $finish;
  end

  // Guard against a wedged generator: 64 samples at 8 clocks each is 512 cycles,
  // so 4096 is generous and a timeout means the FSM is stuck.
  initial begin
    #400000;
    $display("TIMEOUT: generator did not finish");
    $finish;
  end

endmodule
