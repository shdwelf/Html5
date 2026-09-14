// vchip_driver.cc — CXXRTL driver for the virtual chipset.
//
// Compiled against the C++ that `write_cxxrtl` generates from the actual RTL:
//
//     yosys -p "read_verilog -Irtl rtl/vchip_mix.v rtl/boot_vector_lock.v \
//               rtl/ata_security_fsm.v rtl/vchip_top.v; prep -top vchip_top; \
//               write_cxxrtl sim/vchip_top.cc"
//
// It does two jobs:
//
//   1. Conformance. Drive rtl/vchip_mix.v with every vector from
//      rtl/golden/vchip_vectors.h and check the RTL reproduces the JavaScript
//      reference model bit for bit. A mixer that drifts from the model would
//      silently invalidate every golden vector, so this runs first.
//
//   2. Scenarios. Drive rtl/vchip_top.v through rtl/scenarios/vchip_scenarios.json
//      and print a transcript in exactly the format js/vchip-model.js prints,
//      so tools/verify_rtl.py can diff two independent implementations.
//
// Two CXXRTL details are load-bearing here:
//
//   * CXXRTL mangles an HDL identifier by escaping underscores, so the Verilog
//     port `chain_ok` is the C++ member `p_chain__ok`. The names below were read
//     out of the generated file, not guessed.
//   * Inputs are `wire<N>`, whose `set()` writes the *next* value; outputs are
//     read with `get()`, which returns the committed one. That is why a cycle is
//     "set inputs, clk high, step, read, clk low, step".
//
// Both generated .cc files also define `cxxrtl_design_create()`, so one of them
// is renamed before inclusion rather than being edited.
//
// Build (tools/verify_rtl.py does this):
//   g++ -std=c++17 -O2 -Isim -Ivendor/cxxrtl -Irtl/golden \
//       tools/sim/vchip_driver.cc -o sim/vchip_rtl

#include <cstdint>
#include <cstdio>

#define cxxrtl_design_create cxxrtl_design_create_mix
#include "vchip_mix.cc"     // generated: cxxrtl_design::p_vchip__mix
#undef cxxrtl_design_create
#include "vchip_top.cc"     // generated: cxxrtl_design::p_vchip__top
#include "vchip_vectors.h"  // generated: vectors, scenarios, golden chain

static int mix_failures = 0;

static const char *b1(unsigned v) { return v ? "1" : "0"; }

// ---------------------------------------------------------------- conformance
static void mixerConformance() {
  cxxrtl_design::p_vchip__mix mix;
  for (int i = 0; i < VCHIP_MIX_VECTOR_COUNT; i++) {
    const VMixVec &v = VCHIP_MIX_VECTORS[i];
    mix.p_acc.set(v.acc);
    mix.p_dig.set(v.dig);
    mix.step();
    const uint64_t got = mix.p_mix.get<uint64_t>();
    if (got != v.mix) {
      if (mix_failures < 5) {
        std::fprintf(stderr,
                     "mix mismatch #%d: acc=%016llx dig=%016llx rtl=%016llx model=%016llx\n",
                     i, (unsigned long long)v.acc, (unsigned long long)v.dig,
                     (unsigned long long)got, (unsigned long long)v.mix);
      }
      mix_failures++;
    }
  }
}

// --------------------------------------------------------------- status word
//
// The transcript reports most fields twice: once from a named port and once
// inside the packed `status` word. Nothing used to check that the two agreed,
// so the status word could rot silently - and it had: bits [38:36] carried a
// second copy of ext_count, and arm_latched was not exposed at all. Software
// (and the boot-chain checker) reads the *packed* word, so the packing is
// asserted here on every cycle, against the same named ports the transcript
// prints. A layout change is now a build failure rather than a comment.
static int status_failures = 0;

#define FIELD(lo, hi, val)                                                    \
  do {                                                                        \
    const uint64_t _w = (uint64_t)((hi) - (lo) + 1);                          \
    const uint64_t _m = (_w >= 64 ? ~0ull : ((1ull << _w) - 1));              \
    const uint64_t _got = (st_word >> (lo)) & _m;                             \
    const uint64_t _exp = (uint64_t)(val) & _m;                               \
    if (_got != _exp) {                                                       \
      if (status_failures < 10)                                               \
        std::fprintf(stderr,                                                  \
                     "status[%d:%d] = 0x%llx, named ports say 0x%llx (%s#%03d)\n", \
                     (hi), (lo), (unsigned long long)_got,                    \
                     (unsigned long long)_exp, name, cycle);                  \
      status_failures++;                                                      \
    }                                                                         \
  } while (0)

static void checkStatus(const cxxrtl_design::p_vchip__top &t, const VStep &st,
                        const char *name, int cycle) {
  const uint64_t st_word = t.p_status.get<uint64_t>();
  const uint32_t mask = t.p_stage__ok__mask.get<uint32_t>();

  FIELD(0, 0, t.p_chain__ok.get<uint32_t>());
  FIELD(1, 1, t.p_tamper__latch.get<uint32_t>());
  FIELD(2, 3, t.p_lock__state.get<uint32_t>());
  FIELD(4, 5, st.boot);                       // boot_kind is an input
  FIELD(6, 7, st.mode);                       // policy_boot_mode is an input
  FIELD(8, 8, t.p_mode__ok.get<uint32_t>());
  FIELD(9, 12, t.p_boot__deny__reason.get<uint32_t>());
  FIELD(13, 13, t.p_sec__enabled.get<uint32_t>());
  FIELD(14, 14, t.p_sec__locked.get<uint32_t>());
  FIELD(15, 15, t.p_sec__frozen.get<uint32_t>());
  FIELD(16, 16, t.p_erase__required.get<uint32_t>());
  FIELD(17, 19, t.p_fail__count.get<uint32_t>());
  FIELD(20, 20, t.p_media__write__allow.get<uint32_t>());
  FIELD(21, 21, t.p_media__read__allow.get<uint32_t>());
  FIELD(22, 22, t.p_erase__grant.get<uint32_t>());
  FIELD(23, 23, t.p_reflash__grant.get<uint32_t>());
  FIELD(24, 24, t.p_erase__denied__tamper.get<uint32_t>());
  FIELD(25, 25, t.p_reflash__denied__tamper.get<uint32_t>());
  FIELD(26, 27, t.p_last__stage.get<uint32_t>());
  FIELD(28, 28, t.p_last__stage__ok.get<uint32_t>());
  FIELD(29, 31, t.p_ext__count.get<uint32_t>());
  FIELD(32, 32, t.p_prov__done.get<uint32_t>());
  FIELD(33, 33, t.p_prov__violation.get<uint32_t>());
  FIELD(34, 34, t.p_recovery__active.get<uint32_t>());
  FIELD(35, 35, t.p_cpu__release.get<uint32_t>());
  FIELD(36, 36, t.p_arm__latched.get<uint32_t>());
  FIELD(37, 38, 0);
  FIELD(39, 43, 0);
  FIELD(44, 47, t.p_abort__code.get<uint32_t>());
  FIELD(48, 48, t.p_cmd__aborted.get<uint32_t>());
  FIELD(49, 51, 0);
  FIELD(52, 55, t.p_ignored__measurements.get<uint32_t>());
  FIELD(56, 63, 0);
  (void)mask;
}

#undef FIELD

// ------------------------------------------------------------------ transcript
static void printLine(cxxrtl_design::p_vchip__top &t, const VStep &st,
                      const char *name, int cycle) {
  checkStatus(t, st, name, cycle);
  const uint32_t mask = t.p_stage__ok__mask.get<uint32_t>() & 0xf;
  char buf[512];
  std::snprintf(buf, sizeof buf,
    "%s#%03d arm=%s arml=%s recov=%s boot=%u mode=%u meas=%u/%u prov=%u/%u "
    "cmd=%02x pwd=%s chain=%s tamper=%s state=%u mask=%d%d%d%d ext=%u vec=%016llx "
    "deny=%u rel=%s wr=%s rd=%s ers=%s rfl=%s ersd=%s rfld=%s sec=%s%s%s fail=%u "
    "abrt=%u ign=%u st=%016llx",
    name, cycle,
    b1(st.arm), b1(t.p_arm__latched.get<uint32_t>()), b1(st.recov), st.boot, st.mode,
    st.meas_valid, st.meas_stage, st.prov_valid, st.prov_idx,
    st.cmd, b1(st.pwd_ok),
    b1(t.p_chain__ok.get<uint32_t>()), b1(t.p_tamper__latch.get<uint32_t>()),
    t.p_lock__state.get<uint32_t>(),
    (mask >> 3) & 1, (mask >> 2) & 1, (mask >> 1) & 1, mask & 1,
    t.p_ext__count.get<uint32_t>(),
    (unsigned long long)t.p_vector.get<uint64_t>(),
    t.p_boot__deny__reason.get<uint32_t>(),
    b1(t.p_cpu__release.get<uint32_t>()),
    b1(t.p_media__write__allow.get<uint32_t>()),
    b1(t.p_media__read__allow.get<uint32_t>()),
    b1(t.p_erase__grant.get<uint32_t>()),
    b1(t.p_reflash__grant.get<uint32_t>()),
    b1(t.p_erase__denied__tamper.get<uint32_t>()),
    b1(t.p_reflash__denied__tamper.get<uint32_t>()),
    b1(t.p_sec__enabled.get<uint32_t>()),
    b1(t.p_sec__locked.get<uint32_t>()),
    b1(t.p_sec__frozen.get<uint32_t>()),
    t.p_fail__count.get<uint32_t>(), t.p_abort__code.get<uint32_t>(),
    t.p_ignored__measurements.get<uint32_t>(),
    (unsigned long long)t.p_status.get<uint64_t>());
  std::fputs(buf, stdout);
  std::fputc('\n', stdout);
}

static void applyInputs(cxxrtl_design::p_vchip__top &t, const VStep &st) {
  t.p_rst__n.set((uint32_t)(st.rst_n & 1));
  t.p_arm.set((uint32_t)(st.arm & 1));
  t.p_strap__recovery.set((uint32_t)(st.recov & 1));
  t.p_policy__boot__mode.set((uint32_t)(st.mode & 3));
  t.p_policy__allow__destructive.set((uint32_t)(st.allow_destr & 1));
  t.p_policy__prov__latches.set((uint32_t)(st.prov_latches & 1));
  t.p_prov__valid.set((uint32_t)(st.prov_valid & 1));
  t.p_prov__idx.set((uint32_t)(st.prov_idx & 3));
  t.p_prov__vec.set(st.prov_vec);
  t.p_meas__valid.set((uint32_t)(st.meas_valid & 1));
  t.p_meas__stage.set((uint32_t)(st.meas_stage & 3));
  t.p_meas__digest.set(st.meas_digest);
  t.p_boot__kind.set((uint32_t)(st.boot & 3));
  t.p_cmd__valid.set((uint32_t)(st.cmd_valid & 1));
  t.p_cmd.set((uint32_t)st.cmd);
  t.p_pwd__ok.set((uint32_t)(st.pwd_ok & 1));
}

static void runScenario(const VScenario &sc) {
  std::printf("# ===== %s =====\n", sc.name);
  if (sc.desc && *sc.desc) std::printf("# %s\n", sc.desc);

  cxxrtl_design::p_vchip__top top;
  top.p_clk.set(0u);
  top.step();

  for (int i = 0, cycle = 0; i < sc.count; i++, cycle++) {
    const VStep &st = sc.steps[i];
    if (st.note && *st.note) std::printf("# %s: %s\n", sc.name, st.note);

    applyInputs(top, st);
    // Two evaluations per rising phase, and both are needed:
    //   step #1 commits the values written by applyInputs();
    //   step #2 evaluates the rising edge with those inputs already in place.
    // CXXRTL's step() is `do { eval(); } while (commit() && !converged)`, so a
    // single call can stop after applying the new inputs without re-evaluating
    // the logic -- which shows up as the whole design lagging one cycle behind
    // the reference model. Observed behaviour, not theory: see the phasing note
    // in docs/VCHIP.md.
    top.p_clk.set(1u);
    top.step();
    top.step();
    printLine(top, st, sc.name, cycle);
    top.p_clk.set(0u);
    top.step();
  }
  std::printf("\n");
}

int main() {
  mixerConformance();

  std::printf("# vchip transcript\n");
  std::printf("# vector: %d bits / %d lanes / %d rounds, seed %016llx\n",
              VCHIP_VEC_W, VCHIP_LANES, VCHIP_ROUNDS, (unsigned long long)VCHIP_SEED);
  std::printf("# mixer conformance: %d/%d vectors match\n",
              VCHIP_MIX_VECTOR_COUNT - mix_failures, VCHIP_MIX_VECTOR_COUNT);
  std::printf("# golden chain: mbr=%016llx efi=%016llx loader=%016llx\n",
              (unsigned long long)VCHIP_GOLDEN_MBR,
              (unsigned long long)VCHIP_GOLDEN_EFI,
              (unsigned long long)VCHIP_GOLDEN_LOADER);
  std::printf("\n");

  for (int i = 0; i < VCHIP_SCENARIO_COUNT; i++) runScenario(VCHIP_SCENARIOS[i]);

  if (mix_failures) {
    std::fprintf(stderr, "%d/%d mixer vectors disagree with the reference model\n",
                 mix_failures, VCHIP_MIX_VECTOR_COUNT);
    return 2;
  }
  if (status_failures) {
    std::fprintf(stderr, "%d status-word fields disagree with the named ports\n",
                 status_failures);
    return 3;
  }
  return 0;
}
