# xPort Wallplug — a mains-powered RS-232 ↔ Ethernet adapter around a Lantronix xPort Pro

Generated EAGLE design. **Do not edit these files by hand** — they are emitted from
[`tools/wallplug-model.mjs`](../../tools/wallplug-model.mjs) by
[`tools/build-wallplug-eagle.mjs`](../../tools/build-wallplug-eagle.mjs), and every claim below is re-checked by
that generator.

```bash
node tools/build-wallplug-eagle.mjs            # regenerate .lbr/.sch/.brd + BOM.md
node tools/build-wallplug-eagle.mjs --check    # regenerate, then verify (non-zero exit on failure)
node tests/20-wallplug.mjs                     # 276 assertions over the generated files and the model
```

Current state of `--check`:

```
lantronix-wallplug.lbr: 46381 bytes, 21 packages, 19 symbols, 21 devicesets
lantronix-wallplug.sch: 86035 bytes, 1 sheet, 42 instances, 41 nets
lantronix-wallplug.brd: 71843 bytes, 46 elements, 147 pads
worst mains↔SELV creepage: 10.04 mm (MOV1.2 ↔ PS1.4), limit 6.4 mm
schematic: 42 instances on a 480 × 300 mm sheet, no overlapping label boxes
OK — XML well-formed, every reference resolves, connectivity matches the model, geometry clean.
```

Open it in [Lantronix Lab → WALLPLUG EDA](../../lantronix-lab.html#eda) to see the board and the schematic
rendered in the browser, with the same design rules re-run client-side.

## Files

| File | Contents |
| --- | --- |
| `lantronix-wallplug.lbr` | Design library: 21 packages (including the xPort Pro module footprint and the HLK-PM03), 19 symbols, 21 devicesets |
| `lantronix-wallplug.sch` | One sheet, 480 × 300 mm, 42 instances, label-driven wiring (every pin carries a net label and a 5.08 mm stub) |
| `lantronix-wallplug.brd` | 110 × 64 mm, two layers, 46 placed elements, 41 signals with contact refs, mains/SELV barrier on tPlace + tRestrict, ground pour confined to the SELV half |
| `BOM.md` | Bill of materials with DNP flags and zones, plus the full netlist and the safety section |

EAGLE version is written as `9.6.2`. The XML grammar follows the EAGLE DTD as documented inside KiCad's importer
(`common/io/eagle/eagle_parser.h`), so `File → Import → Non-KiCad Project → EAGLE` in a current KiCad is a
second, independent way to prove the files are real.

## What it is

A wallplug that turns a bare **Lantronix xPort Pro** module (16 MB flash, 8/16 MB SDRAM, ColdFire, Linux/µClinux
or Evolution OS) into a mains-powered serial-to-Ethernet adapter — functionally the EDS1100 in a smaller box:

```
mains ── J1 ── F1 (T500 mA, line only) ──┬── PS1 HLK-PM03 (isolated 3.3 V / 3 W) ── FB1 ── 3V3
                                          └── MOV1 (S07K275, after the fuse)              │
                                                                                          ▼
   DE-9 (J2, DTE by default) ── U2 MAX3232 ── 3.3 V CMOS ── X1 xPort Pro ── RJ45 (through the board edge)
   field terminal (J3) ────────────────────────┘              │
   TTL header (J4: 3V3 GND TXD RXD CP1 CP2 CP3 RESET DSR GND) ┘
```

Options, all DNP by default: **U3** a second MAX3232 for real ±RS-232 modem control (RTS/CTS/DTR/DCD), and
**U4** an SP3485 + three 0 Ω links for the RS-485 front end the Integration Guide's appendix A describes.
Fit one front end at a time — RS-232 and RS-485 share the module's TTL pins.

## Design rules the generator enforces

* **Creepage 6.4 mm / clearance 4.0 mm** between every mains pad and every SELV pad, measured pad-edge to
  pad-edge. The AC/DC converter's pads are zone-tagged individually, so its 3.3 V output may sit close to the
  logic while its AC pins may not.
* **No courtyard may overlap** another (0.2 mm tolerance) or leave the outline — except parts flagged `edge`
  (the DE-9 and the module's RJ45 nose both mate through the board edge).
* **Pad-to-pad ≥ 0.35 mm** edge-to-edge unless the pads share a net or a package. SMD pads are compared as
  rotation-corrected rectangles, so a legal 1.27 mm SOIC pitch is not reported as a collision, while a real
  collision between two packages is.
* **Ground pour is confined** to x ≥ 52 mm, so copper cannot bridge the barrier at x = 50 mm.
* **Mounting holes** keep 3.2 mm from every pad.
* **Sheet readability:** no two instance label boxes may overlap, and none may run off the sheet.

## Routing (left to the builder, deliberately)

The board is placed, verified and netlisted, **not routed**. On a mains board, routing is where the safety
decisions actually live, so they are written down instead of generated:

* Mains: ≥ 2.5 mm tracks, net class 1 (`mains`, 6.4 mm clearances). L through F1 then to PS1 pin 1; N straight to
  PS1 pin 2; MOV1 last, so a varistor failure opens the fuse.
* 3.3 V: ≥ 1.0 mm from FB1 to the module's pin 2 (class 2, `power`), with C1/C2/C3/C4 as close to the pin field
  as they fit. The module draws 200 mA typical / 270 mA max at 100Base-TX on Linux; the HLK-PM03's ~600 mA
  continuous rating has margin but no slack for a long thin trace.
* Serial: keep the DE-9's TXD/RXD pair on the far side of the module from PS1's switching node.
* Shield tabs: at least **1 in² (6.45 cm²)** of copper — the Integration Guide calls them "an important source of
  heat sinking", and the module is rated to +85 °C only with it.

## Assembly and bring-up

1. Fit the power section only. With no module installed, verify 3.3 V ±2 % and ≤ 2 % ripple at the module header
   (the guide's recommended operating conditions), and note the reset thresholds: 2.85–3.00 V supply reset,
   internal 140 ms power-up reset, power-drop reset at 2.95 V.
2. Fit X1. Connect a **3.3 V** USB-serial adapter to J4 — never RS-232 levels to the TTL header, and remember
   that no module pin is 5 V tolerant. Look for the dBUG banner at 115200 8N1.
3. Fit U2 and J2/J3. Check the DTE/DCE straps: JP1/JP2 at 1-2 = **DTE** (EDS2100 style, the default),
   at 2-3 = **DCE** (UDS1100 style).
4. Only then consider U3 or U4 + R8/R9/R10.

## Safety, honestly

* This is a **design study**. It has not been certified, and mains-connected PCBs need an IEC/EN 62368-1 (or
  60950-1) assessment plus a properly rated enclosure before anyone plugs one in.
* PS1 is the only isolation barrier. The budget HLK-PM03 is 3 kV-rated but not safety-certified; for a
  user-accessible product use a certified part in the same role (RECOM RAC03-3.3SK, MEAN WELL IRM-03-3.3).
* Fuse in the line conductor only, MOV after the fuse, no reliance on the PCB for basic insulation, class-II
  (all-insulated) enclosure, and the module's chassis tied through the 10 nF / 200 V capacitors the Integration
  Guide recommends rather than bolted to signal ground.
* Nothing here depends on rebuilding the module's firmware. If you do rebuild it, see
  [docs/lantronix-uclinux-deep-dive-2026-10-08.md](../../docs/lantronix-uclinux-deep-dive-2026-10-08.md) §2–§3.

## Provenance of the geometry

| Package | Source |
| --- | --- |
| `XPORTPRO` | Lantronix Integration Guide 900-557 rev K: Table 2-2 (pin functions), Figure 2-7 (hole pattern: 2 × Ø1.60 shield, 8 × Ø0.90 signal, 2 × Ø3.25; pin field 17.20 × 19.74 mm; body 33.90 × 16.26 mm) — cross-checked against `robertstarr/lbr_user lantronix.lbr` (package `XPORT`) and `tridrao/SparkFun-KiCad-Libraries XPORT.kicad_mod` |
| `HLKPM03` | Hi-Link HLK-PM03 (34 × 20 × 15 mm, 3.3 V / 3 W, 85–265 VAC, 3 kV); pin grid from two independent KiCad footprints that agree: AC pair 5.08 mm, DC pair 15.24 mm, rows 29.21 mm |
| `DB9MRA` | KiCad `Connector_Dsub.pretty/DSUB-9_Male_Horizontal_P2.77x2.84mm_EdgePinOffset7.70mm_Housed_MountingHolesOffset9.12mm` (pad grid 2.77 × 2.84, Ø3.2 mounting holes, board edge 7.70 mm from pin row 1) |
| `SO16` / `SO8` | KiCad `Package_SO.pretty/SOIC-16_3.9x9.9mm_P1.27mm` (pad centres ±2.475, pads 1.95 × 0.6) and the 8-pin equivalent |
| `SW-TACT-6MM` | KiCad `Button_Switch_THT.pretty/SW_PUSH_6mm` (pads ±3.25 / ±2.25, Ø1.1 drills) |
| the rest | standard through-hole patterns: DIN0207 axial 7.62 mm, disc capacitor 5.08 mm, radial electrolytics, 5.08 mm screw terminals, 2.54 mm headers, TR5 radial fuse, 7 mm varistor |
