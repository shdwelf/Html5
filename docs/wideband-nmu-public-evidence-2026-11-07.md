# WideBand nMU public evidence — 2026-11-07

## Scope

This note separates three things that can be confused: (1) the public resume's undated “Wideband NMU” training entry, (2) WideBand Corporation's Network Management Unit product, and (3) a separate “Wide-Band Systems” barbed-wire Ethernet story. It uses public pages only. It does not disclose or rely on the private Drive/Dropbox backup. The direct sources below establish that a product existed; they do **not** independently establish an individual's course attendance or certificate.

## What the resume says

The self-published [Steven Greeran resume](https://standardresume.co/r/sgreeran), retrieved 2026-11-07, lists under Education:

- International Academy of Science — “Technical Training Wideband NMU”
- “Kansas State Education System, Gallatin, Mo”; `science.edu` / `wideband.com`; Roger Billings
- “Wideband NMU” again in the skills list

The entry has **no date**, course title beyond that phrase, syllabus, provider contact, credential number, or completion certificate. The resume itself says its education list is a register, not a dated transcript. Keep it as a self-reported training/skill entry; do not turn it into a degree, certification, or verified attendance.

## Direct product evidence

- WideBand Corporation's [2 May 2006 launch announcement](https://www.wband.com/2006/05/wideband-corp-announces-launch-of-network-management-product/) says it launched the **Network Management Unit (nMU)** at INTEROP 2006 in Las Vegas. It describes the nMU as a hardware device for monitoring and managing WideBand switches/networks, and names the integrated “S-Key technology.” The announcement places WideBand Corporation in Gallatin, Missouri.
- The current [WideBand nMU product page](https://www.wband.com/products/gigabit-ethernet-networking/professional-network-management-unit-nmu/) identifies the product as WBNMUPRO and a slave unit as WBNMUPRO-S; the page says they manage up to 128 and 64 switches respectively. It describes cable tests, monitoring, updates, alerts, firewall/NAT, a browser interface, and console ports. It prints `19.0 × 7.3 × 4.3 inch (2U)`; because a standard 2U panel is 3.5 inches high, those figures are not reconciled here.
- The [WBNMUPRO datasheet](https://www.wband.com/resources/datasheets/WBNMUPRO.pdf) describes S-Key as hardware multi-factor authentication for users/administrators and says remote management uses 256-bit AES. This is vendor product documentation, not an independent cryptographic review; it does not identify a protocol, standard, key format, or the course curriculum.
- The [WBNMUPRO manual](https://www.wband.com/resources/manuals/WBNMUPRO.pdf), whose file title identifies a 2.15 manual from June 2006, describes a browser-managed hardware unit for WideBand switches. It documents user management, VLAN/topology controls, monitoring, updates, and cable testing. It is product documentation, not a training roster.
- The current [IAS history page](https://www.science.edu/ias-history/) identifies Roger Billings as a founder and says he founded WideBand Corporation. It does not identify a course named “Technical Training Wideband NMU” or confirm the resume entry.

**Date implication:** the nMU launch announcement gives a public product milestone on 2006-05-02. The resume entry is undated and should not be placed in the 1997–2001 high-school era merely because of its position in the resume. The announcement does not prove no prototype or predecessor existed earlier, so it is a lower bound only for the named public launch, not a definitive training date.

## Separate Ethernet claims — not PLC evidence

- The [WideBand Professional switch page](https://www.wband.com/products/gigabit-ethernet-networking/professional-101001000-switches/) and [data sheet](https://www.wband.com/resources/datasheets/WB8GMPRO_WB16GM3PRO_WB28GM3PRO.pdf) describe 8/16/28-port 10/100/1000 Ethernet switches and advertise extended reach over existing Category 5 and Category 3 cabling. The same product literature also lists 100 Mbps and 1000 Mbps cable support as Category 5 or greater. That is an internal qualification/wording tension; absent a controlled independent test, treat the long-reach statements as vendor claims. These are Ethernet products, not HomePlug Green PHY PLC modems or a 24 V DC coupler.
- Howard Johnson's [“So Good, it works on Barbed Wire”](https://www.sigcon.com/Pubs/edn/SoGoodBarbedWire.htm) says it was first printed in *EDN*, 2001-07-05. Its text describes a 1998 demonstration of **100BASE-T4**, 100 Mbps divided over four differential pairs (25 Mbps per pair), across deliberately spaced barbed-wire pairs. The caption uses “Wide-Band Systems” and the body discusses Broadcom's T4 demonstration. No source checked here establishes that “Wide-Band Systems” is the same company as WideBand Corporation or the resume's training provider. The article is a transmission-line anecdote, not a 24 V, RJ11, telephone-pair, or HomePlug Green PHY design.

## Search result and conclusion

Exact-phrase searches for “Wideband NMU,” `site:science.edu Wideband NMU`, and the International Academy/Wideband phrase returned the public resume and product/company material, but no independent course syllabus, training roster, certificate, or attendance record. This is a bounded search result, not proof that no such records exist.

**Use in the Greeran chronology:** preserve the item as undated, self-reported technical training/skill; remove it from the 1997–2001 placement unless a dated source appears. A public product launch corroborates the meaning of “nMU” and the relationship to WideBand Corporation, not the individual training claim.

**Use in the adapter review:** do not use the WideBand Ethernet products or the barbed-wire article to select a PLC transformer, coupling network, conductor spacing, 24 V feed, or protection component. The 24 V DC two-wire RJ11 adapter remains blocked pending the I2PLCTR-2 and PLC Stamp micro 2 questions in [`24v-rj11-homeplug-greenphy-i2plctr-2-review-2026-11-07.md`](24v-rj11-homeplug-greenphy-i2plctr-2-review-2026-11-07.md).

## Sources and observation date

Pages and PDFs fetched 2026-11-07:

- [Public resume](https://standardresume.co/r/sgreeran)
- WideBand [nMU launch announcement](https://www.wband.com/2006/05/wideband-corp-announces-launch-of-network-management-product/), [nMU product page](https://www.wband.com/products/gigabit-ethernet-networking/professional-network-management-unit-nmu/), [nMU datasheet](https://www.wband.com/resources/datasheets/WBNMUPRO.pdf), and [manual](https://www.wband.com/resources/manuals/WBNMUPRO.pdf)
- WideBand [Professional switch page](https://www.wband.com/products/gigabit-ethernet-networking/professional-101001000-switches/) and [Professional Series datasheet](https://www.wband.com/resources/datasheets/WB8GMPRO_WB16GM3PRO_WB28GM3PRO.pdf)
- [IAS history](https://www.science.edu/ias-history/)
- Howard Johnson, [“So Good, it works on Barbed Wire”](https://www.sigcon.com/Pubs/edn/SoGoodBarbedWire.htm)
