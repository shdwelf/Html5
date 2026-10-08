/**
 * replacement-parts.mjs — what to fit when the part on the BOM is not available,
 * and what "drop-in" actually means for each of them.
 *
 * Every entry carries:
 *   confidence  datasheet | vendor-page | open-hardware | third-party | unverified
 *   verdict     drop-in        same package, same pins, same electrical role
 *               re-rated      same pins, different rating — check the numbers
 *               redesign      does the job, but the schematic or layout changes
 *               alternative   a different way to solve the same problem
 *               not-a-substitute  listed because people reach for it and it is wrong
 *   source      where the claim comes from (URL, repo path, or document §)
 *
 * Rules this file is held to by tests/24-substitutes.mjs:
 *   · every option names a maker, a package and a source;
 *   · a `drop-in` must state the same package as the fitted part, or say why the
 *     package does not matter;
 *   · `unverified` entries must carry a `verify` note telling the reader what to
 *     check before fitting one;
 *   · every design name must be a real design in tools/build-wallplug-eagle.mjs.
 *
 * What was NOT sourced this round is marked `unverified` rather than dropped: a
 * part number everybody uses but whose datasheet was not read here is a part that
 * needs reading before it goes on a board.
 */

export const DESIGNS = ['lantronix-wallplug', 'wimax-cpe', 'pi-wall-socket', 'plc-bridge'];

export const SUBSTITUTES = [
  /* ------------------------------------------------------------------ serial */
  {
    role: 'RS-232 transceiver, 3.3 V, 2 drivers + 2 receivers, 4 × 0.1 µF charge pump',
    designs: ['lantronix-wallplug'],
    fitted: { ref: 'U2/U3', mpn: 'MAX3232CSE', maker: 'Maxim (Analog Devices)', package: 'SOIC-16' },
    options: [
      {
        mpn: 'MAX3232E', maker: 'Maxim (Analog Devices)', package: 'SOIC-16', verdict: 'drop-in',
        why: 'TI\'s cross-reference calls the MAX3232E an improved direct drop-in replacement for the MAX3232: 3-5.5 V, 250 kbps, two drivers and two receivers, four 0.1 µF external capacitors, 300 µA typical supply, accepts 5 V logic on a 3.3 V supply.',
        source: 'https://www.ti.com/product/MAX3232 (product page: "The MAX3232E is an improved direct drop-in replacement for the MAX3232")',
        confidence: 'vendor-page',
      },
      {
        mpn: 'TRS3232E', maker: 'Texas Instruments', package: 'SOIC-16 / TSSOP-16', verdict: 'drop-in',
        why: 'TI lists it as the same functionality and pinout with enhanced IEC 61000-4-2 ESD protection, and recommends it for new designs. Same 3-5.5 V, 250 kbps, 4 × 0.1 µF, 300 µA.',
        source: 'https://www.ti.com/product/TRS3232E and https://www.ti.com/product/TRS3232 ("TI recommends the TRS3232E in new designs")',
        confidence: 'vendor-page',
      },
      {
        mpn: 'ST3232EBR', maker: 'STMicroelectronics', package: 'SOIC-16', verdict: 'drop-in',
        why: 'Same pinout and role as the MAX3232 family (3.0-5.5 V, 250 kbps, 0.1 µF charge-pump capacitors).',
        source: 'ST ST3232E datasheet', confidence: 'unverified',
        verify: 'Read the ST3232EBR datasheet for the pin order and the ESD rating before treating it as pin-compatible; not fetched in this round.',
      },
      {
        mpn: 'SP3232E', maker: 'MaxLinear (ex-Sipex/Exar)', package: 'SOIC-16', verdict: 'drop-in',
        why: 'Same family and pinout; the SP3485 already on this BOM is a MaxLinear part, so the vendor is unchanged.',
        source: 'MaxLinear SP3232E datasheet', confidence: 'unverified',
        verify: 'Confirm the charge-pump capacitor values from the datasheet; some SP3232E variants are specified with 0.1 µF, others with 0.22 µF.',
      },
      {
        mpn: 'ISL3232E', maker: 'Renesas (Intersil)', package: 'SOIC-16', verdict: 'drop-in',
        why: 'Pin-compatible 3.0-5.5 V RS-232 transceiver with ±15 kV ESD on the bus pins.',
        source: 'Renesas ISL3232E datasheet', confidence: 'unverified',
        verify: 'Check the temperature grade: the ISL3232E has a narrower operating range than the industrial MAX3232E.',
      },
      {
        mpn: 'ADM3202ARW', maker: 'Analog Devices', package: 'SOIC-16', verdict: 'not-a-substitute',
        why: 'Pin-compatible but it is a 5 V part (4.5-5.5 V). On this board the rail is 3.3 V from the xPort Pro\'s supply, so it will not work without a 5 V rail.',
        source: 'ADI ADM3202 datasheet (4.5 V to 5.5 V supply)', confidence: 'unverified',
        verify: 'Only usable if the board is re-worked to provide 5 V; the xPort Pro module itself has no 5 V tolerance on its serial pins.',
      },
    ],
  },
  {
    role: 'RS-485 transceiver, 3.3 V, half duplex (the IG appendix A option)',
    designs: ['lantronix-wallplug'],
    fitted: { ref: 'U4 (DNP)', mpn: 'SP3485EN', maker: 'MaxLinear', package: 'SOIC-8' },
    options: [
      {
        mpn: 'AD3485', maker: 'Analog Devices', package: 'SOIC-8', verdict: 'drop-in',
        why: 'The Lantronix Integration Guide\'s own appendix-A RS-485 circuit uses the AD3485 with CP1 driving DE, so this is the reference design\'s part.',
        source: 'Lantronix xPort Pro Integration Guide 900-557 rev K, appendix A', confidence: 'datasheet',
      },
      {
        mpn: 'MAX3485', maker: 'Maxim (Analog Devices)', package: 'SOIC-8', verdict: 'drop-in',
        why: '3.3 V, half-duplex, same 8-pin assignment (RO, !RE, DE, DI, GND, A, B, VCC).',
        source: 'Maxim MAX3485 datasheet', confidence: 'unverified',
        verify: 'Check the fail-safe behaviour: MAX3485 has no true fail-safe on an open bus, unlike the ISL/THVD parts below.',
      },
      {
        mpn: 'ISL83485', maker: 'Renesas (Intersil)', package: 'SOIC-8', verdict: 'drop-in',
        why: 'Same pin names in the same order — RO, !RE, DE, DI, GND, A/Y, B/Z, Vcc — verified from the symbol published in the PIONIX EVerest reference hardware library.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/Pionix.kicad_sym, symbol ISL83485 (pins 1 RO, 2 ~RE, 3 DE, 4 DI, 5 GND, 6 A/Y, 7 B/Z, 8 Vcc)',
        confidence: 'open-hardware',
      },
      {
        mpn: 'THVD1450DR', maker: 'Texas Instruments', package: 'SOIC-8', verdict: 're-rated',
        why: 'Same pinout role, but it is a ±12 V-bus, ESD-hardened RS-485 part; use it where the bus leaves the enclosure.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/ev-devboard.kicad_sym, symbol THVD1450DR', confidence: 'open-hardware',
      },
    ],
  },

  /* ------------------------------------------------------------------- power */
  {
    role: 'Isolated AC-DC module, 3.3 V out (the xPort wallplug supply)',
    designs: ['lantronix-wallplug'],
    fitted: { ref: 'PS1', mpn: 'HLK-PM03', maker: 'Hi-Link', package: '34 × 20 × 15 mm, 4 pins' },
    options: [
      {
        mpn: 'IRM-03-3.3', maker: 'MEAN WELL', package: '45.7 × 25.4 mm, 4-DIP', verdict: 're-rated',
        why: 'Certified (EN60950-1/UL60950-1 class) 3 W 3.3 V module; larger outline, so the footprint changes, but the pin roles are the same four (AC/L, AC/N, -Vo, +Vo).',
        source: 'MEAN WELL IRM-03 family datasheet; the IRM-05-5 sibling is on this board family with a published footprint', confidence: 'vendor-page',
      },
      {
        mpn: 'RAC03-3.3SK', maker: 'RECOM', package: '3 W PCB mount', verdict: 're-rated',
        why: 'Certified 3 W 3.3 V supply; different pin grid, so re-lay the four pads.',
        source: 'RECOM RAC03-3.3SK datasheet', confidence: 'unverified',
        verify: 'Pin spacing differs from the HLK-PM03; measure the datasheet drawing rather than reusing this footprint.',
      },
      {
        mpn: 'LS03-13B03R3', maker: 'Mornsun', package: '3 W PCB mount', verdict: 're-rated',
        why: 'Same class of part from a third certified vendor.', source: 'Mornsun LS03-13B series datasheet',
        confidence: 'unverified', verify: 'Confirm the 3.3 V suffix and the pinout from the datasheet.',
      },
      {
        mpn: 'no capacitive dropper', maker: '—', package: '—', verdict: 'not-a-substitute',
        why: 'A transformerless dropper supply is the usual cheap answer to "3.3 V from mains" and it is not isolated: everything on the SELV side, including the xPort Pro\'s RJ45 shell, becomes live.',
        source: 'this repo: hardware/lantronix-wallplug/README.md safety section; the isolation requirement is IEC 62368-1 reinforced insulation', confidence: 'this-repo',
      },
    ],
  },
  {
    role: 'Isolated AC-DC module, 5 V / 5 W (the new boards\' supply)',
    designs: ['wimax-cpe', 'pi-wall-socket', 'plc-bridge'],
    fitted: { ref: 'PS1', mpn: 'IRM-05-5', maker: 'MEAN WELL', package: '45.7 × 25.4 × 21.5 mm, 4-DIP' },
    options: [
      {
        mpn: 'HLK-5M05', maker: 'Hi-Link', package: 'DIP 38 × 23 × 18 mm', verdict: 're-rated',
        why: '5 W, 5 V / 1 A, 85-264 VAC (also 70-350 VDC), 3 kV isolation, 50 mVp-p ripple, ±0.2 %, short-circuit and over-current protection with self-recovery, 70 % efficiency, −25…+60 °C. Smaller than the IRM-05-5 but not carrying the same approval list.',
        source: 'https://jlcpcb.com/partdetail/HILINK-HLK5M05/C209907', confidence: 'vendor-page',
      },
      {
        mpn: 'IRM-05-5 (aliases LD05-23B05R2)', maker: 'MEAN WELL / Mornsun', package: 'as fitted', verdict: 'drop-in',
        why: 'DigiKey lists the Mornsun LD05-23B05R2 and LD05-23B05R2-M as part-number aliases of the IRM-05-5, so they are the same footprint and the same ratings.',
        source: 'https://www.digikey.com/en/products/detail/mean-well-usa-inc/IRM-05-5/7704652 ("Part # Aliases: LD05-23B05R2, LD05-23B05R2-M")',
        confidence: 'vendor-page',
      },
      {
        mpn: 'RAC05-05SK', maker: 'RECOM', package: '5 W PCB mount', verdict: 're-rated',
        why: 'Certified 5 W 5 V module; different outline and pin grid.',
        source: 'RECOM RAC05-05SK datasheet', confidence: 'unverified',
        verify: 'Measure the pin grid from the datasheet before reusing the IRM-05-5 footprint.',
      },
    ],
  },
  {
    role: 'Isolated AC-DC module, 12 V / 20 W (Pi and WiMAX boards)',
    designs: ['wimax-cpe', 'pi-wall-socket'],
    fitted: { ref: 'PS1', mpn: 'MPM-20-12', maker: 'MEAN WELL', package: '54.4 × 30.4 mm, 4 pins' },
    options: [
      {
        mpn: 'IRM-20-12', maker: 'MEAN WELL', package: '20 W encapsulated', verdict: 're-rated',
        why: 'Same family and same four pin roles (AC/L, AC/N, -Vo, +Vo); different outline.',
        source: 'MEAN WELL IRM-20 datasheet', confidence: 'unverified',
        verify: 'Confirm the pin grid; the MPM-20-12 footprint here comes from the PIONIX EVerest library, not from MEAN WELL.',
      },
      {
        mpn: 'MPM-20-12 pin roles', maker: '—', package: '—', verdict: 'drop-in',
        why: 'The PIONIX EVerest symbol for this exact part names the pins 1 AC/N, 2 AC/L, 3 +V, 4 -V, and the DehneEVSE/PIONIX footprint puts pads 1 and 2 at local +x. This board rotates the module 180° so the AC pins face the mains side.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/ev-devboard.kicad_sym (symbol MPM-20-12) and Yak/lib/ev-devboard.pretty/MPM2012.kicad_mod',
        confidence: 'open-hardware',
      },
    ],
  },
  {
    role: 'Step-down regulator, fixed 3.3 V / 3 A',
    designs: ['wimax-cpe', 'pi-wall-socket', 'plc-bridge'],
    fitted: { ref: 'U1/U2', mpn: 'LM2576S-3.3', maker: 'Texas Instruments / onsemi', package: 'TO-263-5 (tab = GND)' },
    options: [
      {
        mpn: 'LM2596S-3.3', maker: 'Texas Instruments / onsemi', package: 'TO-263-5', verdict: 're-rated',
        why: 'Same package and same five pin roles, but it switches at 150 kHz instead of 52 kHz, so the inductor and the catch diode values change with it.',
        source: 'KiCad official symbol library on github.com/KiCad/kicad-symbols, Regulator_Switching (LM2576S-3.3 / LM2596S-3.3 family)', confidence: 'third-party',
        verify: 'Recompute the output inductor from the LM2596 nomogram; the 100 µH fitted here is a LM2576 value.',
      },
      {
        mpn: 'AP64351', maker: 'Diodes Incorporated', package: 'SO-8EP 3.9 × 4.9 mm', verdict: 'redesign',
        why: '3.5 A synchronous buck — no catch diode, smaller magnetics, better efficiency. It is the part the PIONIX EVerest CM4 carrier uses, so both a symbol and a footprint are published.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/CM4IO.kicad_sym (symbol CM4IO:AP64351) and Yak/CM4IO.pretty/SOIC-8-1EP_3.9x4.9mm_P1.27mm_EP2.95x4.9mm_Mask2.71x3.4mm_ThermalVias.kicad_mod',
        confidence: 'open-hardware',
      },
      {
        mpn: 'TPS54394RSA', maker: 'Texas Instruments', package: 'QFN', verdict: 'redesign',
        why: '3 A synchronous step-down, also on the PIONIX CM4 carrier; needs an exposed-pad QFN footprint and a bootstrap capacitor.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/Pionix.kicad_sym (symbol TPS54394RSA)', confidence: 'open-hardware',
      },
      {
        mpn: 'MYLSM00502ERPL', maker: 'Murata Power Solutions', package: 'SMD power module', verdict: 'alternative',
        why: 'A complete 5 V/2 A non-isolated point-of-load module: fewer magnetics to design, at a higher unit price. The PIONIX devboard library carries it.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/ev-devboard.kicad.sym (symbol MYLSM00502ERPL)', confidence: 'open-hardware',
      },
    ],
  },
  {
    role: 'Linear regulator, 3.3 V (only where the load is small)',
    designs: ['pi-wall-socket', 'wimax-cpe'],
    fitted: { ref: 'U3 (DNP) / U1', mpn: 'AMS1117-3.3', maker: 'Advanced Monolithic Systems', package: 'SOT-223 (tab = VOUT)' },
    options: [
      {
        mpn: 'LD1117S33TR', maker: 'STMicroelectronics', package: 'SOT-223', verdict: 'drop-in',
        why: 'Same package, same three pin roles (GND, VOUT, VIN) plus the tab on VOUT.',
        source: 'KiCad official library on github.com/KiCad/kicad-footprints, Package_TO_SOT_SMD/SOT-223-3_TabPin2 (used here)', confidence: 'third-party',
      },
      {
        mpn: 'AP2210N-3.3TRG1', maker: 'Diodes Incorporated', package: 'SOT-23-5', verdict: 'redesign',
        why: '300 mA LDO with an enable pin; the PIONIX library publishes the 5.0 V sibling (AP2210N-5.0TRG1), so the footprint family is known.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/ev-devboard.kicad.sym (symbol AP2210N-5.0TRG1)', confidence: 'open-hardware',
      },
      {
        mpn: 'a buck instead', maker: '—', package: '—', verdict: 'alternative',
        why: 'At 0.5 A the SOT-223 dissipates (5 − 3.3) × 0.5 ≈ 0.85 W. That is why the powerline boards use the LM2576 and this LDO only appears on the WiMAX board\'s DNP 1.5 V rail, which feeds a card that may not even be fitted.',
        source: 'this repo: tools/pi-socket-model.mjs POWER_BUDGET and tools/wimax-cpe-model.mjs UNCONNECTED notes', confidence: 'this-repo',
      },
    ],
  },

  /* ------------------------------------------------------- protection, mains */
  {
    role: 'Line fuse, time-lag, in the line conductor only',
    designs: ['lantronix-wallplug', 'wimax-cpe', 'pi-wall-socket', 'plc-bridge'],
    fitted: { ref: 'F1', mpn: 'T500mA/250V or T630mA/250V', maker: 'generic TR5 radial', package: 'TR5 radial, 5.08 mm' },
    options: [
      {
        mpn: '0215005.MXP', maker: 'Littelfuse', package: '5 × 20 mm ceramic, T500 mA / 250 V', verdict: 're-rated',
        why: 'A through-hole 5 × 20 mm holder replaces the TR5 body; same time-lag characteristic and same breaking capacity class.',
        source: 'Littelfuse 215 series datasheet', confidence: 'unverified',
        verify: 'The 5 × 20 mm footprint is not the TR5 radial footprint — change the package, do not bend the leads.',
      },
      {
        mpn: 'SF-2410SP100W-2', maker: 'Bourns SinglFuse', package: 'SMD 2410', verdict: 'redesign',
        why: 'A 1 A surface-mount fuse, used on the PIONIX EVerest devboard; it moves the fuse to the SMD side of the board.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/ev-devboard.kicad.sym (symbol SF-2410SP100W-2)', confidence: 'open-hardware',
      },
    ],
  },
  {
    role: 'Varistor across L-N, after the fuse',
    designs: ['lantronix-wallplug', 'wimax-cpe', 'pi-wall-socket', 'plc-bridge'],
    fitted: { ref: 'MOV1', mpn: 'S07K275', maker: 'EPCOS (TDK)', package: '7 mm disc, 5 mm pitch' },
    options: [
      {
        mpn: 'B72207S0271K101', maker: 'TDK/EPCOS', package: '7 mm disc', verdict: 'drop-in',
        why: 'This is the full order code of the same S07K275 part: 275 Vrms, 7 mm disc body, same 5 mm lead pitch — the footprint does not change.',
        source: 'TDK/EPCOS SIOV-S07K275 datasheet', confidence: 'unverified',
        verify: 'Confirm the order-code mapping on the TDK site; the marking is S07K275.',
      },
      {
        mpn: 'a 10 mm or 14 mm disc at 275 Vrms', maker: 'Littelfuse LA / Bourns MOV-xD271K', package: '10/14 mm disc', verdict: 're-rated',
        why: 'A bigger disc absorbs more energy (higher surge current) at the same clamping voltage class; the lead pitch grows with it.',
        source: 'IEC 61051-2 / UL 1449 varistor selection practice: the disc diameter sets the surge-current rating at a given clamping voltage', confidence: 'unverified',
        verify: 'Pick the disc size from the surge current the enclosure has to survive, and re-check the 8 mm creepage around it.',
      },
    ],
  },
  {
    role: 'Terminal block for L / N / PE',
    designs: ['lantronix-wallplug', 'wimax-cpe', 'pi-wall-socket', 'plc-bridge'],
    fitted: { ref: 'J1', mpn: 'TB003-500-P03BE', maker: 'CUI Devices', package: '3-position, 5.00 mm, drill 1.4 mm' },
    options: [
      {
        mpn: '2604-1102 / 2606-1105', maker: 'WAGO', package: 'through-hole terminal, 5.0 × 8.2 mm grid', verdict: 're-rated',
        why: 'The PIONIX EVerest devboard uses these; WAGO also publishes an increased-creepage variant of the same body, which is exactly what a mains terminal wants.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/ev-devboard.pretty/{2604-1102,2606-1105_010-000,2606-1105_increased_creepage}.kicad_mod',
        confidence: 'open-hardware',
      },
      {
        mpn: 'TB001-500-02BE', maker: 'CUI Devices', package: '2-position, 5.00 mm', verdict: 're-rated',
        why: 'Same family and same 5.00 mm pitch as the fitted 3-position block, but one pole fewer, so the footprint shrinks by 5 mm and PE has to land on a spade or a chassis stud instead.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/ev-devboard.kicad_sym (symbol TB001-500-02BE)', confidence: 'open-hardware',
      },
      {
        mpn: 'bornier-2 / bornier-3', maker: 'generic (KiCad library)', package: '5.08 mm', verdict: 're-rated',
        why: 'The xPort wallplug uses the 5.08 mm bornier pattern; electrically equivalent, but the footprint pitch differs (5.08 vs 5.00 mm) and so does the field wiring plug.',
        source: 'KiCad official library on github.com/KiCad/kicad-footprints, TerminalBlock/TerminalBlock_bornier-3_P5.08mm (imported by tools/import-kicad-footprints.mjs)', confidence: 'third-party',
      },
    ],
  },
  {
    role: 'Relay for a switched socket outlet (considered, not fitted)',
    designs: ['pi-wall-socket'],
    fitted: { ref: '— (documented option)', mpn: 'AHES4291', maker: 'Panasonic (HE-S)', package: 'through-hole, 8 pins' },
    options: [
      {
        mpn: 'AHES4291', maker: 'Panasonic', package: 'as above', verdict: 'alternative',
        why: 'Its pin roles are published (1 COM_1, 2 COM_2, 3 COM_3, 4 COIL_1, 5 COIL_2, 6 NC_3, 7 NO_2, 8 NO_1) in the PIONIX EVerest symbol, so the schematic is not guesswork. But the footprint puts contact pad 3 (11.45, −16.75, Ø3.3) 7.65 mm centre-to-centre from coil pad 4 (3.8, −16.75, Ø2.4) — about 4.8 mm between pad edges, well inside the 8 mm creepage this board keeps for the powerline module (tests/23 measures both numbers).',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/ev-devboard.kicad_sym (symbol AHES4291) and Yak/lib/ev-devboard.pretty/AHES4291.kicad_mod (pad coordinates)',
        confidence: 'open-hardware',
      },
      {
        mpn: 'G5LE-1', maker: 'Omron', package: 'SPDT, through-hole, 5 pins', verdict: 'alternative',
        why: 'Geometrically the better candidate: its footprint has one pad row at y = 0/−2 and the other at y = −14.2, i.e. 12.2-15.4 mm between the rows, which clears an 8 mm creepage rule even before pad sizes are subtracted. Two of its pads are only 6.3 mm apart, so which row is the coil has to come from the Omron datasheet before it is routed.',
        source: 'KiCad official library on github.com/KiCad/kicad-footprints, Relay_THT/Relay_SPDT_Omron-G5LE-1 (imported here as package G5LE1)', confidence: 'third-party',
        verify: 'KiCad\'s G5LE-1 symbol leaves the pin names empty (coil and contacts are separate units), so read the Omron datasheet for which pad is coil+ before routing.',
      },
      {
        mpn: '3-1393789-7', maker: 'TE Connectivity', package: 'through-hole relay', verdict: 'alternative',
        why: 'Another relay from the same open-hardware library, with published pin names (C1, NC1, C2, NC, M, NO, NO1, M1).',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/ev-devboard.kicad.sym (symbol 3-1393789-7)', confidence: 'open-hardware',
      },
      {
        mpn: 'CPC1017NTR', maker: 'IXYS/Littelfuse', package: '4-pin SOP solid-state relay', verdict: 'not-a-substitute',
        why: 'A small-signal SSR: fine for signalling, not for switching a socket outlet\'s load current.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/ev-devboard.kicad.sym (symbol CPC1017NTR)', confidence: 'open-hardware',
      },
    ],
  },
  {
    role: 'Energy metering for a smart socket (documented option)',
    designs: ['pi-wall-socket'],
    fitted: { ref: '— (not fitted)', mpn: '—', maker: '—', package: '—' },
    options: [
      {
        mpn: 'ADE7932ARIZ', maker: 'Analog Devices', package: 'SOIC-16 / TSSOP', verdict: 'alternative',
        why: 'Single-phase energy-metering front end; the PIONIX EVerest devboard library publishes symbols for it and for the three-phase ADE7978ACPZ and ADE9078ACPZ.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/ev-devboard.kicad.sym (symbols ADE7932ARIZ, ADE7978ACPZ-RL, ADE9078ACPZ)', confidence: 'open-hardware',
      },
      {
        mpn: 'T60404-N4641-X920', maker: 'Vacuumschmelze', package: 'current sensor, 16 pads + 5 mounting holes', verdict: 'alternative',
        why: 'The current sensor the same board pairs with the ADE metering parts; pin roles (AC1_IN/AC1_OUT … PWM_OUT, ERROR_OUT, X6_OUT, X30_OUT) are published in that library.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/ev-devboard.kicad.sym + .pretty/T60404-N4641-X920.kicad_mod', confidence: 'open-hardware',
      },
      {
        mpn: 'HLW8032', maker: 'Hiliwi', package: 'SOP-16', verdict: 'alternative',
        why: 'The metering part most hobby smart-plug teardowns report; no datasheet was read for this table.',
        source: 'commonly cited in Sonoff POW teardowns', confidence: 'unverified',
        verify: 'Do not fit from this entry alone: get the datasheet, and remember a shunt-referenced metering part ties its low side to the mains.',
      },
    ],
  },

  /* ----------------------------------------------------------- data / RF ICs */
  {
    role: 'Powerline (Green PHY) module with integrated mains coupling',
    designs: ['plc-bridge', 'pi-wall-socket'],
    fitted: { ref: 'U2/U3', mpn: 'I2PLCBMN-ISC-004-T', maker: 'chargebyte GmbH (ex I2SE)', package: '43.5 × 22 × 6.5 mm, 25 SMD pads' },
    options: [
      {
        mpn: 'I2PLCBMN-ISC-002-T/-R', maker: 'chargebyte', package: 'same', verdict: 'drop-in',
        why: 'Same module with QCA firmware 1.1.3 instead of 1.2.5; the order-code table lists both as CE Class B, SPI, industrial, transformer I2PLCTR-1 and zero-cross on the module.',
        source: 'chargebyte PLC Stamp mini 2 datasheet rev 13, §15 tables 8 and 9', confidence: 'datasheet',
      },
      {
        mpn: 'I2PLCAMN-ISC-004-T', maker: 'chargebyte', package: 'same', verdict: 'drop-in',
        why: 'The QCA7000 version instead of the QCA7005: "the connections and dimensions are exactly the same for both chips", the difference being the QFN package and optical inspectability. Listed in §17 as not recommended for new designs.',
        source: 'chargebyte PLC Stamp mini 2 datasheet rev 13, §3 and §17', confidence: 'datasheet',
      },
      {
        mpn: 'I2PLCBMN-IUC-004-T', maker: 'chargebyte', package: 'same', verdict: 're-rated',
        why: 'The UART variant: SERIAL_0..4 become (unused), RTS, CTS, TXD, RXD at 115200 8N1 instead of SPI mode 3. The host driver changes, the board does not.',
        source: 'chargebyte datasheet rev 13, §10.2 tables 6 and 7, §15', confidence: 'datasheet',
      },
      {
        mpn: 'I2PLCBMN-ISE/ISP-004-*', maker: 'chargebyte', package: 'same', verdict: 'not-a-substitute',
        why: 'Automotive EVSE/PEV variants: transformer 1:1:1, no zero-cross detector, and the datasheet says in terms that could not be plainer — "Automotive variants of PLC Stamp mini 2 are not designed to work on mains." They tie pins 16/17 to GND and couple through pin 15 only.',
        source: 'chargebyte datasheet rev 13, §12.2', confidence: 'datasheet',
      },
      {
        mpn: 'PLC stamp micro 2', maker: 'chargebyte / in-tech smart charging', package: 'smaller module', verdict: 'redesign',
        why: 'The same QCA7000-based product line in a smaller body; a new footprint is needed.',
        source: 'https://in-tech-smartcharging.com/products/powerline-communication-modules', confidence: 'vendor-page',
      },
      {
        mpn: 'PLC Red Beet E', maker: '(PIONIX EVerest library)', package: '37 pads', verdict: 'redesign',
        why: 'A Green PHY modem that brings the analogue lines out (TXP/TXN/RXP/RXN), so the coupling network is external: the EVerest Yak pairs it with a YT-35636 transformer, two 2.7 nF / 2 kV 1210 capacitors in series and a GBLC03C TVS to ground — that is a control-pilot coupling, not a mains one.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/powerline.kicad_sch and Yak/everestCM4.xml (nets /PLC Modem/TXP,TXN,RXP,RXN; Net-(C28-Pad2); Net-(C29-Pad2))',
        confidence: 'open-hardware',
      },
      {
        mpn: 'QCA7000 / QCA7005 bare chip', maker: 'Qualcomm Atheros', package: 'QFN-68-1EP 8 × 8 mm, 0.4 mm pitch, 5.2 × 5.2 mm EP', verdict: 'redesign',
        why: 'The chip-level version of the same modem. A published hobby board shows what it takes: 25 MHz crystal (TXC 7M 3.2 × 2.5), 25Q16 SPI flash in SOP-8, 1.8 µH and 270 nH inductors, 1.5 nF and 6.8 pF capacitors, 22 Ω series and 120 Ω termination, B5819W Schottkys, a 3V9 SMA zener and BAV99 pairs. Its own author marks it "TODO Not tested".',
        source: 'github.com/Millisman/QCA7000, pcb/qca7000.csv (BOM) and README.md; KiCad package QFN-68-1EP_8x8mm_P0.4mm_EP5.2x5.2mm_ThermalVias (imported here as QFN68-8)',
        confidence: 'open-hardware',
      },
      {
        mpn: 'dLAN Green PHY module', maker: 'devolo', package: 'module with QCA7000 + LPC1758 host', verdict: 'alternative',
        why: 'A Green PHY module that brings its own host MCU; devolo published an SDK for it.',
        source: 'github.com/devolo/dlan-greenphy-sdk ("includes QCA7000 chipset and LPC1758 host processor")', confidence: 'open-hardware',
      },
    ],
  },
  {
    role: 'Ethernet controller for an SPI host',
    designs: ['pi-wall-socket', 'plc-bridge'],
    fitted: { ref: 'U4', mpn: 'WIZ850io', maker: 'WIZnet', package: 'module 23 × 25.75 × 18 mm, two 1×6 headers 20.32 mm apart' },
    options: [
      {
        mpn: 'W5500 chip', maker: 'WIZnet', package: 'LQFP-48 7 × 7 mm, 0.5 mm', verdict: 'redesign',
        why: 'The bare controller: 1 TXN/TXP, 5/6 RXN/RXP, 10 EXRES1 (12.4 kΩ ±1 % to AGND), 18 VBG (float), 20 TOCAP (4.7 µF), 22 1V2O (10 nF), 23/38-42 RSVD (tie to GND), 30/31 XI/XO (25 MHz), 32-35 SPI, 36 !INT, 37 !RST, 43-45 PMODE — then an external magnetics and RJ45.',
        source: 'KiCad official symbol library Interface_Ethernet (W5500, 48 pins; read through the github.com/deepin-community/kicad-symbols mirror) and footprint github.com/KiCad/kicad-footprints Package_QFP/LQFP-48_7x7mm_P0.5mm',
        confidence: 'third-party',
      },
      {
        mpn: 'W5500-io', maker: 'WIZnet', package: 'module with three 1×7 headers', verdict: 'alternative',
        why: 'The bigger sibling: it breaks out the magnetics side (RX_P/RX_N/RCT/TCT/TX_P/TX_N) plus LINK and ACTn status pins, so a board can put its own RJ45 anywhere.',
        source: 'https://docs.wiznet.io/Product/ioModule/W5500-io', confidence: 'vendor-page',
      },
      {
        mpn: 'ENC28J60', maker: 'Microchip', package: 'SOIC-28 / QFN-28', verdict: 'not-a-substitute',
        why: 'SPI Ethernet, but 10 Mbps only and it needs a host driver doing all the MAC work; the W5500 has the TCP/IP stack in hardware.',
        source: 'Microchip ENC28J60 datasheet', confidence: 'unverified',
        verify: 'Only worth it if the board needs 10 Mbps and nothing else.',
      },
      {
        mpn: 'WT32-ETH01', maker: 'Wireless-Tag', package: 'ESP32 + Ethernet module', verdict: 'alternative',
        why: 'An ESP32 with Ethernet on board — the exact combination a published QCA7000 bridge project uses to turn a Green PHY modem into an Ethernet device.',
        source: 'github.com/uhi22/wt32eth01-ethernet-to-qca7000-bridge', confidence: 'open-hardware',
      },
    ],
  },
  {
    role: 'RJ45 with integrated magnetics (chip-level Ethernet)',
    designs: ['pi-wall-socket', 'plc-bridge'],
    fitted: { ref: '— (inside WIZ850io)', mpn: 'HR911105A', maker: 'Hanrun', package: 'through-hole, 8 signal + 4 LED pins, 2 Ø3.25 mounting holes' },
    options: [
      {
        mpn: 'HR911105A', maker: 'Hanrun', package: 'through-hole, 8 signal + 4 LED pins, 2 Ø3.25 mounting holes', verdict: 'drop-in',
        why: '10/100Base-TX, 1500 Vrms isolation UTP-to-chip side, 350 µH minimum OCL at 100 kHz with 8 mA DC, −1.0 dB max insertion loss at 300 kHz-100 MHz; the datasheet note is "connect CHS GND to PCB ground".',
        source: 'Hanrun HR911105A datasheet, http://www.kosmodrom.com.ua/pdf/HR911105A.pdf (the URL is recorded inside the KiCad footprint); footprint Connector_RJ/RJ45_Hanrun_HR911105A',
        confidence: 'datasheet',
      },
      {
        mpn: 'TRJG0926HENL', maker: '(PIONIX EVerest carrier)', package: 'through-hole, 20 pads', verdict: 'alternative',
        why: 'The magjack used on a manufactured Raspberry Pi CM4 carrier: 8 staggered signal pins, 4 shield/LED pins, 2 LED pairs, 2 Ø2.5 shield pads and two Ø3.2 mounting holes.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/CM4IO.pretty/TRJG0926HENL.kicad_mod (descr cites globalsources spec K1160305690)',
        confidence: 'open-hardware',
      },
      {
        mpn: 'A70-112-331N126', maker: '(PIONIX CM4 IO symbol)', package: 'magjack', verdict: 'alternative',
        why: 'A third published magjack symbol from the same reference-hardware project.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/CM4IO.kicad_sym (symbol CM4IO:MagJack-A70-112-331N126)', confidence: 'open-hardware',
      },
    ],
  },
  {
    role: 'SPI host for a Green PHY modem',
    designs: ['plc-bridge'],
    fitted: { ref: 'U3', mpn: 'ESP32-WROOM-32E', maker: 'Espressif', package: '18 × 25.5 mm module, 38 castellations + ground pad' },
    options: [
      {
        mpn: 'ESP32-WROOM-32', maker: 'Espressif', package: 'same', verdict: 'drop-in',
        why: 'Pin and footprint compatible; the KiCad official library publishes the -32 footprint this design uses.',
        source: 'KiCad official library on github.com/KiCad/kicad-footprints, RF_Module/ESP32-WROOM-32 (imported here as ESP32WROOM)', confidence: 'third-party',
      },
      {
        mpn: 'STM32G431CBU6', maker: 'STMicroelectronics', package: 'LQFP-48 / UFQFPN-48', verdict: 'redesign',
        why: 'A real-time MCU instead of a Wi-Fi SoC: no radio to certify, and it is the class of part the PIONIX EVerest devboard uses alongside its PLC module.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/ev-devboard.kicad.sym (symbols STM32G431CBU6, STM32G483RET6)', confidence: 'open-hardware',
      },
      {
        mpn: 'Raspberry Pi (any)', maker: 'Raspberry Pi', package: 'SBC', verdict: 'alternative',
        why: 'The PIONIX EVerest Yak does exactly this: a Compute Module 4 carrier whose SPI bus talks to a Green PHY modem (nets PLC_SCK/PLC_MISO/PLC_MOSI/PLC_CS/PLC_INT on module pins 38/40/44/39/47). That is what the pi-wall-socket design in this repo is.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/everestCM4.xml (nets /PLC_SCK, /PLC_MISO, /PLC_MOSI, /PLC_CS, /PLC_INT)',
        confidence: 'open-hardware',
      },
    ],
  },

  /* --------------------------------------------------------------- the card */
  {
    role: 'WiMAX mini-PCIe card',
    designs: ['wimax-cpe'],
    fitted: { ref: 'U2 (socket)', mpn: 'Intel Centrino Advanced-N + WiMAX 6250 (622ANXHMW)', maker: 'Intel', package: 'PCIe Half Mini Card, 26.65 × 29.85 × 4.39 mm, 4.5 g' },
    options: [
      {
        mpn: 'Intel Centrino Wireless-N + WiMAX 6150', maker: 'Intel', package: 'Mini Card / Half-Mini Card', verdict: 'drop-in',
        why: 'The other card in Intel\'s own WiMAX/Wi-Fi adapter information guide: same 52-pin Mini Card edge connector, same 3.3 V, same Hirose U.FL-R-SMT antenna interface.',
        source: 'https://www.intel.com/content/dam/support/us/en/documents/network-and-i-o/wireless-networking/intel-wifi-adapter-information-guide.pdf',
        confidence: 'datasheet',
      },
      {
        mpn: 'any LTE mini-PCIe module', maker: 'Quectel / Sierra / Telit', package: 'Full or Half Mini Card', verdict: 're-rated',
        why: 'The realistic 2026 use for this carrier: the socket, the 3.3 V rail, W_DISABLE#, PERST# and the UIM pins are all standard, and the board already routes UIM_PWR/UIM_DATA/UIM_CLK/UIM_RESET to a DNP micro-SIM holder. An LTE card needs the SIM fitted and its own band-certified antennas.',
        source: 'PCI Express Mini Card Electromechanical Specification rev 1.2 (pin table); this repo\'s wimax-cpe netlist (UIM_* nets)',
        confidence: 'third-party',
        verify: 'Check the card\'s 3.3 V current budget against the 1100 mA this board allows, and check whether it wants the +1.5 V rail (fit U3).',
      },
      {
        mpn: 'a WiMAX network', maker: '—', package: '—', verdict: 'not-a-substitute',
        why: 'The radio is the problem, not the board: commercial 802.16e networks are gone (Sprint/Clear shut theirs down in 2015-2016), so a 6250 has nothing to join. This carrier is a museum piece or an LTE board with a WiMAX-shaped hole in it.',
        source: 'design note; see docs/wimax-pi-powerline-variants-2026-10-08.md §WiMAX', confidence: 'third-party',
        verify: 'Confirm there is a live 802.16e network in your band before building for WiMAX rather than LTE.',
      },
    ],
  },
  {
    role: 'RF connector for a mini-PCIe card',
    designs: ['wimax-cpe'],
    fitted: { ref: '— (on the card)', mpn: 'U.FL-R-SMT-1', maker: 'Hirose', package: 'SMD coax receptacle' },
    options: [
      {
        mpn: 'U.FL-LP-066 cable assembly', maker: 'Hirose', package: 'U.FL to SMA pigtail', verdict: 'alternative',
        why: 'Intel\'s own guide names the mating pair: "Antenna Interface: Hirose U.FL-R-SMT mates with cable connector U.FL-LP-066".',
        source: 'Intel WiFi Adapter Information Guide', confidence: 'datasheet',
      },
      {
        mpn: 'Amphenol 132134', maker: 'Amphenol RF', package: 'SMA jack, vertical PCB mount', verdict: 'alternative',
        why: 'A board-mounted SMA landing point if the enclosure cannot take bulkhead jacks; the KiCad official footprint is imported here.',
        source: 'KiCad official library on github.com/KiCad/kicad-footprints, Connector_Coaxial/SMA_Amphenol_132134_Vertical', confidence: 'third-party',
      },
      {
        mpn: 'chip antenna (UMTS 1.6)', maker: '(PIONIX EVerest library)', package: '2 SMD pads, 3.25 × 4.62 mm each', verdict: 'alternative',
        why: 'An on-board antenna for a module that feeds the carrier rather than its own U.FL jacks; needs a ground keep-out around it.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/ev-devboard.pretty/UMTS1.6.kicad_mod', confidence: 'open-hardware',
      },
    ],
  },
  {
    role: 'Raspberry Pi module for the wall-socket carrier',
    designs: ['pi-wall-socket'],
    fitted: { ref: 'J2', mpn: 'Raspberry Pi Zero 2 W', maker: 'Raspberry Pi', package: '65 × 30 × 5 mm, 2×20 header, four M2.5 holes at 58 × 23 mm' },
    options: [
      {
        mpn: 'Raspberry Pi Zero W / Zero', maker: 'Raspberry Pi', package: 'same outline', verdict: 'drop-in',
        why: 'The Zero 2 W is a drop-in replacement in the same 65 × 30 mm footprint with the same header and hole pattern; the earlier Zeros are slower (single-core ARMv6) but fit identically.',
        source: 'https://raspberry.tips/en/raspberrypi-tutorials/raspberry-pi-zero-2-w-overview-specs ("quad-core 64-bit chip — in the exact same footprint of 65 × 30 mm")',
        confidence: 'vendor-page',
      },
      {
        mpn: 'Raspberry Pi Compute Module 4', maker: 'Raspberry Pi', package: 'mezzanine, two 100-way 0.4 mm DF40C-100DS connectors', verdict: 'redesign',
        why: 'The industrial route: Ethernet PHY on the module (pins 3-12 are Ethernet_Pair0..3 P/N), 5 V on six pins (77/79/81/83/85/87), 3.3 V and 1.8 V outputs, PCIe, and no SD slot on the Lite variants. It needs a completely different carrier — the PIONIX EVerest Yak is a published example, footprints included.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/Pionix.kicad_sym (symbol ComputeModule4-CM4, 152 listed pins) and Yak/CM4IO.pretty/Raspberry-Pi-4-Compute-Module.kicad_mod, DF40C-100DS.stp',
        confidence: 'open-hardware',
      },
      {
        mpn: 'no Ethernet on the Zero', maker: '—', package: '—', verdict: 'alternative',
        why: 'The Zero 2 W has no Ethernet at all, which is the whole reason this carrier exists: SPI0 carries a WIZ850io and SPI1 carries a Green PHY modem. Raspberry Pi OS needs dtoverlay=spi1-3cs for the second bus.',
        source: 'https://pinouthub.com/raspberry-pi-zero-2w/ (Ethernet: not available; SPI0 = pins 19/21/23/24/26, SPI1 = pins 35/36/38/40)',
        confidence: 'vendor-page',
      },
    ],
  },

  /* ------------------------------------------------------- passives, discrete */
  {
    role: 'Ferrite bead on a supply rail',
    designs: ['lantronix-wallplug', 'wimax-cpe', 'pi-wall-socket', 'plc-bridge'],
    fitted: { ref: 'FB1', mpn: '600 Ω @ 100 MHz axial bead', maker: 'generic', package: '7.62 mm axial' },
    options: [
      {
        mpn: 'BLM18PG601SN1D', maker: 'Murata', package: '0603', verdict: 're-rated',
        why: '600 Ω at 100 MHz in an 0603 chip bead; the PIONIX library uses the 33 Ω sibling (BLM18PG330SN1D), so the footprint family is published.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/ev-devboard.kicad.sym (symbol BLM18PG330SN1D)', confidence: 'open-hardware',
        verify: 'Check the DC current rating against the rail: an 0603 bead carrying the whole 3.3 V rail of a WiMAX card is not the same job as a signal-line bead.',
      },
      {
        mpn: '744231091', maker: 'Würth Elektronik', package: 'common-mode choke', verdict: 'alternative',
        why: 'A common-mode choke instead of a single-ended bead — the right part where the rail crosses the isolation barrier or feeds an RF module.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/ev-devboard.kicad.sym (symbol 744231091)', confidence: 'open-hardware',
      },
      {
        mpn: 'LQW18CNR16J00D', maker: 'Murata', package: '0603', verdict: 'not-a-substitute',
        why: 'A 160 nH RF inductor, not a ferrite bead: it will not do the broadband suppression job.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/ev-devboard.kicad.sym', confidence: 'open-hardware',
      },
    ],
  },
  {
    role: 'ESD / TVS protection on an external line',
    designs: ['plc-bridge', 'wimax-cpe', 'pi-wall-socket'],
    fitted: { ref: '— (documented)', mpn: 'GBLC03C', maker: 'ProTek/Semtech class', package: 'SOD-323' },
    options: [
      {
        mpn: 'GBLC03C', maker: '—', package: 'SOD-323', verdict: 'drop-in',
        why: 'The TVS the PIONIX EVerest powerline sheet puts on the coupling node, between the series HV capacitors and the transformer primary.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/powerline.kicad_sch (D9 = GBLC03C) and Yak/everestCM4.xml (Net-(C29-Pad2): C29.2, D9.2, T1.1)',
        confidence: 'open-hardware',
      },
      {
        mpn: 'SP3003-02XJ', maker: 'Littelfuse', package: 'SC70-5', verdict: 'alternative',
        why: 'A multi-channel TVS array from the same library, for protecting several lines at once.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/Pionix.kicad.sym (symbol SP3003-02XJ, footprint Pionix:SC70-5)', confidence: 'open-hardware',
      },
      {
        mpn: 'TPD4EUSB30', maker: 'Texas Instruments', package: 'USON-10', verdict: 'alternative',
        why: 'Four-channel ESD protection for a USB 2.0/3.0 port — what the WiMAX carrier\'s upstream port wants.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/CM4IO.kicad_sym (symbol CM4IO:TPD4EUSB30)', confidence: 'open-hardware',
      },
    ],
  },
  {
    role: 'Catch / flyback / rectifier diode',
    designs: ['wimax-cpe', 'pi-wall-socket', 'plc-bridge'],
    fitted: { ref: 'D1/D2', mpn: 'SS34 (3 A Schottky)', maker: 'generic', package: 'DO-41 axial, 7.62 mm' },
    options: [
      {
        mpn: '1N5822', maker: 'generic', package: 'DO-41 axial, 7.62 mm', verdict: 'drop-in',
        why: '3 A 40 V Schottky, the classic LM2576 catch diode, in the same DO-41 body and 7.62 mm lead pitch as the fitted SS34.',
        source: 'TI/onsemi LM2576 datasheet application circuit', confidence: 'unverified',
        verify: 'Some vendors ship the 1N5822 in the larger DO-201 body; check the package marking before reusing this footprint.',
      },
      {
        mpn: 'B5819W', maker: 'Micro Commercial / generic', package: 'SOD-123', verdict: 'redesign',
        why: '1 A 40 V Schottky in SMD — the part the published QCA7000 board uses for its rail diodes; too small for a 3 A buck catch diode.',
        source: 'github.com/Millisman/QCA7000, pcb/qca7000.csv (D1-D4 = B5819W, SOD-123)', confidence: 'open-hardware',
      },
      {
        mpn: 'CGRM4007-G', maker: 'Comchip', package: 'SMD 1N4007 class', verdict: 'alternative',
        why: 'The rectifier the chargebyte zero-cross circuit uses (datasheet figure 6), and a part the PIONIX library carries.',
        source: 'chargebyte PLC Stamp mini 2 datasheet rev 13, figure 6; github.com/PionixPublic/reference-hardware (symbol CGRM4007-G)',
        confidence: 'datasheet',
      },
    ],
  },
  {
    role: 'Optocoupler for a mains zero-cross detector',
    designs: ['plc-bridge', 'pi-wall-socket'],
    fitted: { ref: '— (DNP circuit)', mpn: 'TCLT1000', maker: 'Vishay', package: 'SOP-4' },
    options: [
      {
        mpn: 'TCLT1000 / TCLT100x', maker: 'Vishay', package: 'SOP-4', verdict: 'drop-in',
        why: 'The exact part in the chargebyte zero-cross reference circuit, together with its component values: 2200 pF, 820 kΩ, CGRM4007-G, 100 Ω, 39 kΩ, 220 nF, 1000 pF, 1 µF.',
        source: 'chargebyte PLC Stamp mini 2 datasheet rev 13, figure 6 "Schematic Zerocross Detection"; github.com/PionixPublic/reference-hardware (symbols TCLT1000, CGRM4007-G)',
        confidence: 'datasheet',
      },
    ],
  },
  {
    role: 'Crystal for a QCA7000-class or W5500 chip-level design',
    designs: ['plc-bridge', 'pi-wall-socket'],
    fitted: { ref: '— (inside the modules)', mpn: '25 MHz, 3.2 × 2.5 mm 4-pad', maker: 'TXC', package: 'SMD 3225' },
    options: [
      {
        mpn: 'TXC 7M-25.00MEEJ-T', maker: 'TXC', package: '3.2 × 2.5 mm, 4 pads', verdict: 'drop-in',
        why: 'The published QCA7000 board uses a 25 MHz crystal in exactly this package, and the KiCad official footprint for it is imported here.',
        source: 'github.com/Millisman/QCA7000, pcb/qca7000.csv (Y1 = 25MHz, Crystal_SMD_TXC_7M-4Pin_3.2x2.5mm); KiCad Crystal/Crystal_SMD_3225-4Pin_3.2x2.5mm',
        confidence: 'open-hardware',
      },
    ],
  },
  {
    role: 'SPI flash for a bare QCA7000',
    designs: ['plc-bridge'],
    fitted: { ref: '— (on the PLC module)', mpn: '25Q16, SOP-8', maker: 'generic', package: 'SOP-8 5.28 × 5.23 mm' },
    options: [
      {
        mpn: 'W25Q16JVSSIG', maker: 'Winbond', package: 'SOIC-8', verdict: 'drop-in',
        why: 'A 16 Mbit SPI NOR flash in the same body; the published QCA7000 board lists "25Q16" in SOP-8.',
        source: 'github.com/Millisman/QCA7000, pcb/qca7000.csv (U1 = 25Q16, Package_SO:SOP-8_5.28x5.23mm_P1.27mm)',
        confidence: 'open-hardware',
      },
    ],
  },
  {
    role: 'USB receptacle for an upstream host connection',
    designs: ['wimax-cpe'],
    fitted: { ref: 'J3', mpn: 'Molex 105017-0001', maker: 'Molex', package: 'micro-USB B, SMD + shell pads' },
    options: [
      {
        mpn: 'USB4085-GF-A', maker: 'GCT', package: 'USB-C, 24 pins + 4 shell', verdict: 'redesign',
        why: 'A USB-C receptacle with published pin names (A1-A12/B1-B12 plus P1-P4 shell) — the connector the PIONIX CM4 carrier uses. USB-C on a device port needs the CC resistors, which micro-USB does not.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/lib/ev-devboard.kicad.sym (symbol USB4085-GF-A_REVA)', confidence: 'open-hardware',
      },
      {
        mpn: '67298-4090', maker: 'Molex', package: 'USB-A receptacle', verdict: 'alternative',
        why: 'A full-size USB-A socket; awkward on a device port but handy on a carrier that hosts a dongle.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/CM4IO.pretty/MOLEX_USB_67298-4090.kicad_mod', confidence: 'open-hardware',
      },
      {
        mpn: 'UCON00686', maker: 'EDAC', package: 'micro-USB B', verdict: 'drop-in',
        why: 'Another published micro-USB footprint from the same reference hardware.',
        source: 'github.com/PionixPublic/reference-hardware, Yak/CM4IO.pretty/USB_Micro-B_EDAC_UCON00686.kicad_mod', confidence: 'open-hardware',
      },
    ],
  },
  {
    role: 'SIM holder for the mini-PCIe UIM pins',
    designs: ['wimax-cpe'],
    fitted: { ref: 'J4 (DNP)', mpn: 'SF53S006VCBR2000', maker: 'JAE', package: 'micro-SIM, 6 contacts + 8 shell pads' },
    options: [
      {
        mpn: 'nano-SIM holder', maker: 'Molex / Amphenol', package: 'nano-SIM, 6 + shell', verdict: 'redesign',
        why: 'Modern LTE mini-PCIe cards use nano-SIM (4FF); the contact roles are the same C1 VCC, C2 RST, C3 CLK, C5 GND, C7 I/O, so only the footprint changes.',
        source: 'ISO 7816-3 contact assignment; KiCad footprint github.com/KiCad/kicad-footprints Connector_Card/microSIM_JAE_SF53S006VCBR2000 (imported here)', confidence: 'third-party',
      },
    ],
  },
];

/**
 * "Convert for xPort Pro": the same wallplug, populated for a different Lantronix
 * part number. Nothing on the PCB moves — the module footprint is common to the
 * family — but the firmware, the flash size and the OS change, and two straps and
 * one DNP block are part of the conversion.
 *
 * Sourced from the xPort Pro User Guide 900-560 part-number matrix, the PCN-485
 * release notification, and the Integration Guide 900-557 rev K.
 */
export const XPORT_CONVERSIONS = [
  {
    mpn: 'XPP100300S-04R', os: 'Linux (uClinux 2.6.30)', flash: '16 MB', sdram: '16 MB',
    build: 'what hardware/lantronix-wallplug is populated with',
    changes: 'none — this is the reference build',
    source: 'Lantronix xPort Pro User Guide 900-560e, part-number × SDRAM × OS matrix',
  },
  {
    mpn: 'XPP100300-04R', os: 'Linux', flash: '16 MB', sdram: '16 MB',
    build: 'same board', changes: 'RoHS/packaging variant of the same Linux module; no strap or BOM change',
    source: 'xPort Pro User Guide 900-560e matrix',
  },
  {
    mpn: 'XPP100300S-01R', os: 'Linux', flash: '16 MB', sdram: '8 MB',
    build: 'same board', changes: 'half the SDRAM: keep the JFFS2 app partition small (the SDK gives /dev/mtd4 3.5 MB) and expect less headroom for boa + dropbear + a web UI',
    source: 'xPort Pro User Guide 900-560e matrix (-01R = 8 MB SDRAM); Linux SDK User Guide 900-548 §flash layout',
  },
  {
    mpn: 'XPP1002000/S-02R', os: 'Evolution OS', flash: '16 MB', sdram: '—',
    build: 'same board, different firmware',
    changes: 'Evolution OS instead of Linux: the web/CLI setup differs, the internal web server serves static pages and Java applets from 1 MB of storage, and there is no JFFS2 app partition to fill',
    source: 'xPort Pro User Guide 900-560e matrix; xPort Pro Integration Guide 900-557 rev K (internal web server: "Serves static web pages and Java applets · Storage capacity: 1MB")',
  },
  {
    mpn: 'XPP1004000/S-02R', os: 'Evolution OS', flash: '16 MB', sdram: '—',
    build: 'same board', changes: 'the part the PCN-485 release notification names for "XPort Pro (uClinux)" vs Evo firmware 5.4.0.2R2 — check which firmware the order actually ships',
    source: 'Lantronix PCN-485 XPort Pro Software Release Notification',
  },
  {
    mpn: 'XPPDK1000-*', os: 'development kit', flash: '—', sdram: '—',
    build: 'not a module: the xPort Pro development kit',
    changes: 'use it to bring the wallplug up before committing to a production module; the kit carries the same 8-pin interface',
    source: 'xPort Pro User Guide 900-560e matrix (XPPDK1000-*)',
  },
];

/** Board-level conversions: the same PCB, populated for a different interface. */
export const INTERFACE_CONVERSIONS = [
  {
    name: 'RS-232 DTE → DCE',
    designs: ['lantronix-wallplug'],
    how: 'move JP1 and JP2 from 1-2 (DTE, the EDS2100 style) to 2-3 (DCE, the UDS1100 style)',
    why: 'Lantronix ships the UDS1100 as DCE and the UDS2100/EDS2100 as DTE; the wallplug can be either',
    source: 'Lantronix Confluence DTE/DCE notes (UDS1100 = DM25F DCE, UDS2100/EDS2100 = DB9M DTE); DB9 DTE pin map 1 DCD, 2 RXD, 3 TXD, 4 DTR, 5 SG, 6 DSR, 7 RTS, 8 CTS',
  },
  {
    name: 'RS-232 → RS-485',
    designs: ['lantronix-wallplug'],
    how: 'fit U4 (SP3485/AD3485), R8, R9, R10 and J5; leave the RS-232 transceiver U2 fitted or remove it — both front ends share the module\'s TTL serial pins',
    why: 'the Integration Guide\'s appendix A shows exactly this circuit, with CP1 driving DE',
    source: 'xPort Pro Integration Guide 900-557 rev K, appendix A (RS-485 with AD3485)',
  },
  {
    name: 'modem control lines',
    designs: ['lantronix-wallplug'],
    how: 'fit U3 and C11-C14 to get RTS/CTS/DTR/DCD level shifting; the module drives CP1/CP2/CP3 with internal pull-ups (10 kΩ on CP1, 100 kΩ on CP2/CP3)',
    why: 'two MAX3232 channels are not enough for data plus four modem-control lines',
    source: 'xPort Pro Integration Guide 900-557 rev K, table 2-2 notes',
  },
  {
    name: 'Green PHY mains coupling → DC-line coupling',
    designs: ['plc-bridge', 'pi-wall-socket'],
    how: 'fit R2/R7 (10 kΩ from ZC_IN to GND) and do NOT connect the module\'s L pins to mains; per the datasheet, a DC-line coupling ties ZC_IN low through 10 kΩ',
    why: 'the same module serves smart-grid DC lines and EV control pilot; only the coupling and the zero-cross wiring change',
    source: 'chargebyte PLC Stamp mini 2 datasheet rev 13, §8.2 note 2 and §12',
  },
  {
    name: 'WiMAX card → LTE card',
    designs: ['wimax-cpe'],
    how: 'fit J4 (micro-SIM on UIM_PWR/UIM_DATA/UIM_CLK/UIM_RESET) and, if the card needs it, U3 + C8 + C9 for the +1.5 V rail',
    why: 'the Intel 6250 has no SIM and runs from 3.3 V alone; an LTE mini-PCIe module usually wants both',
    source: 'PCI Express Mini Card Electromechanical Specification rev 1.2 (UIM pins 8/10/12/14/16, +1.5 V pins 6/28/48); Intel 6250 product brief (voltage 3.3 V)',
  },
];

/**
 * Parts that are documented in this repo's library but deliberately not fitted on
 * any board, with the reason. The importer fetched their real geometry, so a
 * future design can use them without new research.
 */
export const DOCUMENTED_NOT_BUILT = [
  { package: 'QFN68-8', part: 'QCA7000/QCA7005 bare chip', why: 'a chip-level PLC design needs the AFE values from the published hobby board (270 nH, 1.5 nF, 120 Ω, 22 Ω) and its author marks the board untested; the module route puts that risk inside a part with a 4000 Vac isolation spec' },
  { package: 'LQFP48-7', part: 'W5500 bare chip', why: 'the WIZ850io module carries the chip, the magnetics and the RJ45 with an official pinout; a chip-level build adds an EXRES1 12.4 kΩ ±1 %, a TOCAP 4.7 µF, a 1V2O 10 nF, a 25 MHz crystal and a magjack whose pin roles were not readable from the datasheet image' },
  { package: 'HR911105A', part: 'Hanrun RJ45 with magnetics', why: 'kept as the chip-level Ethernet option; its electrical specs are published but the pin-role table is only in the datasheet drawing' },
  { package: 'TRJG0926HENL', part: 'magjack from a manufactured CM4 carrier', why: 'same reason; the footprint is real and citable, the pin roles were not extracted' },
  { package: 'T60404', part: 'Vacuumschmelze current sensor', why: 'metering is a documented option for the Pi wall socket, not a fitted block' },
  { package: 'AHES4291', part: 'Panasonic relay', why: 'coil-to-contact spacing is inside this board family\'s 8 mm creepage rule; the Omron G5LE-1 footprint clears it' },
  { package: 'PLCREDBEET', part: 'PLC Red Beet E module', why: 'needs an external coupling network (transformer + 2.7 nF/2 kV + TVS) that is documented but not laid out here' },
  { package: 'UMTSANT', part: 'chip antenna', why: 'the WiMAX card carries its own U.FL jacks, so the carrier board has no RF path to feed' },
];

/** Flat view for the lab page: one row per option. */
export function substituteRows() {
  const rows = [];
  for (const group of SUBSTITUTES) {
    for (const opt of group.options) {
      rows.push({
        role: group.role,
        designs: group.designs,
        fitted: group.fitted.mpn,
        fittedPackage: group.fitted.package,
        mpn: opt.mpn, maker: opt.maker, package: opt.package,
        verdict: opt.verdict, why: opt.why, source: opt.source,
        confidence: opt.confidence ?? opt.verdict, verify: opt.verify ?? '',
      });
    }
  }
  return rows;
}
