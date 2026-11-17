// Manual CKKS/FHE profiling aid: arithmetic over caller-supplied measurements,
// not an encryption backend, benchmark runner, or noise/precision estimator.
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  url: "https://example.test/apps/cyberchef/",
  pretendToBeVisual: true,
  beforeParse(window) {
    window.alert = () => undefined;
    window.confirm = () => false;
    window.prompt = () => null;
    window.TextEncoder = TextEncoder;
    window.TextDecoder = TextDecoder;
  },
});
const w = dom.window;
after(() => w.close());

function runProfile(profile) {
  const input = typeof profile === "string" ? profile : JSON.stringify(profile);
  return JSON.parse(w.eval(`OPERATIONS.find(o => o.id === 'fheArchitectureLab').run(${JSON.stringify(input)}, {})`));
}

test("manual architecture profiler is a distinct operation in its own recipe pack", () => {
  const matches = w.eval("OPERATIONS.filter(op => op.id === 'fheArchitectureLab')");
  assert.equal(matches.length, 1);
  assert.match(matches[0].name, /manual measurements only/i);
  assert.match(matches[0].desc, /runs no benchmark/i);

  const packs = JSON.parse(JSON.stringify(w.eval("RECIPE_PACKS")));
  assert.deepEqual(packs["FHE Study — CKKS architecture profile (manual data only)"], [
    ["fheArchitectureLab", {}],
  ]);
  assert.ok(packs["Full Coverage — Educational"].some(([id]) => id === "fheArchitectureLab"));
  assert.deepEqual(packs["FHE Study — F17 arithmetic oracle (plaintext only)"], [
    ["fheKitchenLab", { mode: "oracle" }],
  ]);
});

test("profile derives labeled byte/work ratios without claiming a live benchmark", () => {
  const report = runProfile({
    schema: 1,
    workload: "illustrative CKKS pipeline",
    scheme: "CKKS",
    platform: "test CPU + GPU",
    timing_model: "serial",
    stages: [
      { name: "client encode/encrypt", wall_ms: 2, host_allocation_ms: 0.5 },
      {
        name: "server NTT/evaluation",
        wall_ms: 8,
        gpu_event_ms: 6,
        host_allocation_ms: 1,
        read_bytes: 8000000,
        written_bytes: 4000000,
        work_count: 24000000,
        work_unit: "modular operations",
      },
      { name: "client decrypt/decode", wall_ms: 3 },
    ],
  });

  assert.match(report.scope, /No encryption, ciphertext evaluation/);
  assert.match(report.measurement_origin, /supplied by the user/);
  assert.equal(report.stage_wall_sum_ms, 13);
  assert.deepEqual(report.largest_wall_measurement, { name: "server NTT/evaluation", wall_ms: 8 });
  assert.equal(report.stages[1].io_bytes, 12000000);
  assert.equal(report.stages[1].apparent_io_GB_per_second, 1.5);
  assert.equal(report.stages[1].work_units_per_io_byte, 2);
  assert.equal(report.stages[1].serial_wall_share_percent, 8 / 13 * 100);
  assert.equal(report.stages[1].host_allocation_wall_ratio_percent, 12.5);
  assert.equal(report.stages[1].gpu_event_ms, 6);
  assert.equal(report.stages[0].io_bytes, null);
  assert.equal(report.stages[0].work_units_per_io_byte, null);
  assert.equal(report.research_context.length, 2);
  assert.equal(report.sources.length, 2);
  assert.equal(report.sources[0].doi, "10.1007/978-3-031-31754-5");
  assert.equal(report.sources[1].isbn, "979-8-88638-001-9");
  assert.match(report.research_context.join(" "), /memory-bound/);
  assert.match(report.research_context.join(" "), /non-production Intel GPUs/);
  assert.match(report.metric_notes.join(" "), /not DRAM bandwidth/);
});

test("overlapping and asynchronous timings are reported separately, never summed", () => {
  const report = runProfile({
    schema: 1,
    workload: "overlapping GPU stages",
    scheme: "CKKS",
    platform: "synthetic device",
    timing_model: "overlapping",
    stages: [
      { name: "GPU kernel A", wall_ms: 5, gpu_event_ms: 4.7 },
      { name: "GPU kernel B", wall_ms: 4, gpu_event_ms: 3.6 },
    ],
  });
  assert.equal(report.stage_wall_sum_ms, null);
  assert.equal(report.stages[0].serial_wall_share_percent, undefined);
  assert.equal(report.stages[0].gpu_event_ms, 4.7);
  assert.equal(report.largest_wall_measurement.wall_ms, 5);
  assert.match(report.metric_notes.join(" "), /do not add overlapping intervals/);
});

test("profile parser rejects malformed schemas, incomplete counters, and unsafe inputs", () => {
  assert.throws(() => runProfile("{"), /valid JSON/);
  assert.throws(() => runProfile([]), /must be a JSON object/);
  assert.throws(() => runProfile({}), /schema must be 1/);
  const base = {
    schema: 1,
    workload: "test",
    scheme: "CKKS",
    platform: "test",
    timing_model: "serial",
    stages: [{ name: "stage", wall_ms: 1 }],
  };
  assert.throws(() => runProfile({ ...base, timing_model: "unknown" }), /timing_model/);
  assert.throws(() => runProfile({ ...base, stages: [] }), /1 to 128 measured stages/);
  assert.throws(() => runProfile({ ...base, stages: Array(129).fill(base.stages[0]) }), /1 to 128 measured stages/);
  assert.throws(() => runProfile({ ...base, stages: [{ name: "stage", wall_ms: 0 }] }), /wall_ms/);
  assert.throws(() => runProfile({ ...base, stages: [{ name: "stage", wall_ms: 1, read_bytes: 1 }] }), /both be supplied together/);
  assert.throws(() => runProfile({ ...base, stages: [{ name: "stage", wall_ms: 1, read_bytes: 1.5, written_bytes: 2 }] }), /read_bytes/);
  assert.throws(() => runProfile({ ...base, stages: [{ name: "stage", wall_ms: 1, read_bytes: Number.MAX_SAFE_INTEGER, written_bytes: 1 }] }), /safe-integer limit/);
  assert.throws(() => runProfile({ ...base, stages: [{ name: "stage", wall_ms: 1, work_count: 3 }] }), /must be supplied together/);
  assert.throws(() => runProfile("x".repeat(65537)), /limited to 65536 UTF-8 bytes/);
});
