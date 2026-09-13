#define cxxrtl_design_create cxxrtl_design_create_mix
#include "vchip_mix.cc"
#undef cxxrtl_design_create
#include "vchip_top.cc"
#include <cstdio>
using cxxrtl_design::p_vchip__top;

static unsigned arml(p_vchip__top &t) { return t.p_arm__latched.get<uint32_t>(); }
static unsigned st(p_vchip__top &t) { return t.p_lock__state.get<uint32_t>(); }

int main() {
  // Pattern A: current driver order.
  { p_vchip__top t; t.p_clk.set(0); t.step(); t.p_rst__n.set(1); t.step(); printf("A arml:");
    for (int c = 0; c < 4; c++) { t.p_rst__n.set(1); t.p_arm.set(1); t.p_clk.set(1); t.step(); printf(" %u", arml(t)); t.p_clk.set(0); t.step(); }
    printf("\n"); }
  // Pattern B: explicit low-phase commit after applying inputs.
  { p_vchip__top t; t.p_clk.set(0); t.step(); t.p_rst__n.set(1); t.step(); printf("B arml:");
    for (int c = 0; c < 4; c++) { t.p_rst__n.set(1); t.p_arm.set(1); t.p_clk.set(0); t.step(); t.p_clk.set(1); t.step(); printf(" %u", arml(t)); t.p_clk.set(0); t.step(); }
    printf("\n"); }
  // Pattern C: double step on the rising phase.
  { p_vchip__top t; t.p_clk.set(0); t.step(); t.p_rst__n.set(1); t.step(); printf("C arml:");
    for (int c = 0; c < 4; c++) { t.p_rst__n.set(1); t.p_arm.set(1); t.p_clk.set(1); t.step(); t.step(); printf(" %u", arml(t)); t.p_clk.set(0); t.step(); }
    printf("\n"); }
  // Pattern D: three steps on the rising phase (settle fully).
  { p_vchip__top t; t.p_clk.set(0); t.step(); t.p_rst__n.set(1); t.step(); printf("D arml:");
    for (int c = 0; c < 4; c++) { t.p_rst__n.set(1); t.p_arm.set(1); t.p_clk.set(1); t.step(); t.step(); t.step(); printf(" %u", arml(t)); t.p_clk.set(0); t.step(); }
    printf("\n"); }
  // Pattern E: one step per phase, twice around (two full clocks per cycle).
  { p_vchip__top t; t.p_clk.set(0); t.step(); t.p_rst__n.set(1); t.step(); printf("E arml:");
    for (int c = 0; c < 4; c++) { t.p_rst__n.set(1); t.p_arm.set(1); t.p_clk.set(1); t.step(); t.p_clk.set(0); t.step(); t.p_clk.set(1); t.step(); printf(" %u", arml(t)); t.p_clk.set(0); t.step(); }
    printf("\n"); }
  return 0;
}
