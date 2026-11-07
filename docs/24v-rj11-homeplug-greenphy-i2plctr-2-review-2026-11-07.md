# 24 V RJ11 HomePlug Green PHY — I2PLCTR-2 datasheet review (2026-11-07)

## Design boundary

The target remains two identical Ethernet endpoints on a two-wire RJ11 bus carrying both 24 V DC power and HomePlug Green PHY PLC. The bus is not PSTN and must never connect to telephone service or mains. This note reviews the Chargebyte transformer source; it is **not** a validated coupler design, safety assessment, CAD package, or hardware test.

## What the I2PLCTR-2 source establishes

The public [I2PLCTR-2 datasheet, revision 2](https://chargebyte.com/assets/downloads/transformator-i2plctr-2-datasheet-rev.-2.pdf), dated July 25, 2023, identifies MPN `I2PLCTR-2` and gives these properties:

| Property | Datasheet statement | Design meaning / limit |
| --- | --- | --- |
| Winding arrangement | Title calls it a `2:2:2 PLC Transformer`; the winding table lists winding 1 and ratios W1/W2 and W1/W3. | Chargebyte's PLC Stamp micro 2 datasheet classifies I2PLCTR-2 as the nominal 1:1:1 external transformer for PEV/EVSE use. The ratio table allows ±20%; do not assume a tighter ratio. |
| Inductance | Winding 1: 4.36 µH ±30%, measured at 0.1 MHz. | This one point does not give the complete MHz-band insertion loss, impedance, bandwidth, or coupling response on the proposed RJ11 cable. |
| Ratios | W1/W2 = 1.09 ±20%; W1/W3 = 1.09 ±20%. | Does not, by itself, identify the pin-by-pin phase/dot orientation needed to wire TX and RX correctly. |
| Dielectric test | Winding 1 to windings 2 and 3: 4.0 kVAC for 2 seconds at 50 Hz; the sheet prints `cr = 8 mm, cl = 6.5 mm`. | A short withstand test is not a continuous working-voltage, surge, or end-product isolation rating. Do not treat it as approval for an arbitrary 24 V product or transient environment. |
| Temperature/package | The PDF text prints `-40 °C ±125 °C`, maximum soldering temperature 260 °C for 10 s, and a surface-mount outline/footprint drawing. | Confirm the temperature notation and use the controlled mechanical drawing before footprint work. The text extraction does not preserve the winding/pin diagram well enough to sign off polarity or pin mapping. |

The micro 2 datasheet lists I2PLCTR-2 for EV/EVSE coupling and shows it in Figure 7's automotive/pilot reference. That circuit is not a validated 24 V DC RJ11 circuit. In particular, its 1 nF coupling capacitor, 10 Ω resistor, and 12 V-standoff TVS are not transferable as-is to the target 24 V bus. The datasheet itself says coupling capacitors must be selected for the environment. AN11 discusses CP/PE wiring layout; it does not specify a two-wire 24 V coupling network.

## Source-version caution

The [Chargebyte product URL whose slug says I2PLCTR-2](https://chargebyte.com/products/controllers-modules/evse-controllers/signal-transformer-1-1-1-i2plctr-2) currently renders a page headed **I2PLCTR-6** and links to an I2PLCTR-6 datasheet. That is not the same MPN as I2PLCTR-2; its current page specifications must not be substituted for the I2PLCTR-2 sheet. The legacy URL/content mismatch should be resolved with Chargebyte before ordering or freezing a BOM.

## What remains unproven for the 24 V bus

The I2PLCTR-2 datasheet is a component sheet, not a full PLC-plus-power reference design. It does not validate:

- continuous 24 V DC operation, polarity reversal, power-feed/current path, endpoint source/load roles, or bus current;
- the coupling-capacitor and series-network values for the target cable, protection network, or PLC impedance;
- transient, ESD, EFT/surge, or isolation requirements for the complete RJ11 product;
- winding pin mapping and polarity against the micro 2 TX/RX differential pins, as used on a new board;
- communication performance across the proposed cable length, connectors, power supply, and load.

Do not place the 24 V load current through a PLC transformer winding. The power path and the AC-coupled PLC path need to be defined separately and validated together. No coupling values, protection component, or CAD design are selected here.

## Questions to resolve with Chargebyte before CAD

No support request has been sent. The following confirmations are needed before a schematic or BOM is frozen:

1. Confirm the current controlled I2PLCTR-2 datasheet, part availability, operating-temperature range, pin-1 orientation, winding pin map, and phase/dot marks. Confirm the intended connections to micro 2 `TXOUT_P/N` and `RXIN_P/N`.
2. Confirm whether I2PLCTR-2 is appropriate for HomePlug Green PHY over a constant 24 V DC pair (not CP/PE or mains), including polarity reversal and the expected 24 V transients.
3. Provide or approve a reference coupler for this 24 V use: coupling capacitor type/value/rating, resistor/impedance network, TVS or other protection and standoff, and the bus power-feed path/current limits.
4. Clarify the required micro 2 variant/pin configuration for a two-wire DC bus, including `ZC_IN` handling. The PEV instruction in the micro 2 datasheet must not be generalized to this different interface without confirmation.
5. State the intended insulation/working-voltage and test requirements for the full assembly; the transformer’s 4 kVAC/2 s dielectric test alone is insufficient to establish them.

## Adjacent WideBand/Ethernet evidence does not clear the PLC gate

The [WideBand Professional Series switch page](https://www.wband.com/products/gigabit-ethernet-networking/professional-101001000-switches/) and [datasheet](https://www.wband.com/resources/datasheets/WB8GMPRO_WB16GM3PRO_WB28GM3PRO.pdf) describe proprietary-signaling Ethernet switches and advertise extended reach over existing Category 5/Category 3 cabling. The same literature also lists 100 Mbps and 1000 Mbps cable support as Category 5 or greater. Treat the reach statements as vendor claims, not as an independently verified PLC coupler specification.

Howard Johnson's [“So Good, it works on Barbed Wire”](https://www.sigcon.com/Pubs/edn/SoGoodBarbedWire.htm) (first printed 2001-07-05) describes a 1998 **100BASE-T4** demonstration: 100 Mbps split over four deliberately spaced differential pairs. The caption uses “Wide-Band Systems,” while the body describes a Broadcom T4 demonstration; no source checked here establishes that this is the same company as WideBand Corporation or the resume's WideBand nMU. Neither the Ethernet product page nor the barbed-wire story demonstrates HomePlug Green PHY over a two-wire RJ11 pair while carrying 24 V DC. They do not justify selecting a transformer, coupling capacitor, protection network, wire spacing, or power-feed topology.

Until the component and 24 V coupler questions above are answered, adapter CAD and hardware claims remain blocked. The user’s endpoint identity, RJ11-only/no-PSTN boundary, and 24 V PLC-plus-power requirement are unchanged.

## Sources

- [Chargebyte I2PLCTR-2 datasheet, revision 2](https://chargebyte.com/assets/downloads/transformator-i2plctr-2-datasheet-rev.-2.pdf)
- [Chargebyte PLC Stamp micro 2 datasheet, revision 14](https://chargebyte.com/assets/downloads/datasheet_plcstampmicro2-rev14-1-1719229970.pdf)
- [Chargebyte AN11](https://chargebyte.com/assets/downloads/an11_rev1.pdf)
- [Chargebyte product URL now rendering I2PLCTR-6](https://chargebyte.com/products/controllers-modules/evse-controllers/signal-transformer-1-1-1-i2plctr-2)
