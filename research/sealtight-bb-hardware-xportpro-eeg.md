# SealTight fasteners, B&B Hardware, Larry Bogatz, and an EEG → Lantronix XPort Pro path

**Research note · 2 November 2026**

**Related report:** [Margaret Ayers EEG archive and patent research](margaret-ayers-eeg-archive-patents-updated-models.md)

## Scope and limits

This report continues the EEG-design research while preserving the completed Ayers investigation. It brings together public company materials, patent records, trademark/court proceedings, Lantronix product documentation, and relevant safety/security standards.

It is **not** a legal opinion, patent freedom-to-operate analysis, medical-device design approval, clinical evaluation, or certification assessment. Company statements are identified as claims, patent databases as provisional status sources, and court outcomes as legal-record summaries. The proposed EEG/XPort architecture and latency protocol are conceptual only: **no EEG or XPort Pro hardware, authorized network endpoint, patient setup, or Internet-latency measurement was available or used.** No network scan or device test was performed.

## Executive findings

1. **SealTight mechanism:** the core product description is a captive elastomer O-ring retained in an annular groove on the underside of a fastener head (or in a nut). Tightening compresses the ring against the mating workpiece while the head rim seats metal-to-metal. Groove volume, geometry, ring size/material, torque, hole clearance, and surface finish are part of the design; this is not simply a generic screw with an added O-ring.
2. **B&B and Larry Bogatz:** SealTight’s own site says the fastener business is a wholly owned subsidiary of B&B Hardware. An Eighth Circuit opinion identifies Larry J. Bogatz as B&B’s co-founder and records his 1990 SEALTIGHT application; the original federal registration issued in 1993. Public corporate-formation history is less clear than the trademark and patent record.
3. **Patents:** the three U.S. publications B&B lists—US 5,957,641, US 6,231,286, and US 6,283,691—cover specific rivet/head-groove/nut-groove designs, not every O-ring-sealed fastener. Google Patents lists all three as **Expired—Fee Related**; this is a database indication, not a legal conclusion or freedom-to-operate opinion.
4. **Trademark case:** B&B Hardware v. Hargis is a long-running **trademark** dispute over SEALTIGHT/SEALTITE, not a patent-infringement case about the O-ring mechanism. The Supreme Court’s 2015 decision addressed when a TTAB decision can have issue-preclusive effect; it did not decide every infringement or validity question. Following remand, the Eighth Circuit affirmed judgment for Hargis in 2018. A separate, nonprecedential 2020 TTAB order sustained Hargis’s opposition to B&B’s later SEALTIGHT application on descriptiveness/issue-preclusion grounds.
5. **XPort Pro:** it can bridge compatible serial data to 10/100 Ethernet, but it is not an EEG amplifier or ADC. Its module UART is 3.3-V CMOS; RS-232/RS-485 line levels require an external transceiver. Lantronix currently labels the product **“In Production-NRFND”**; the site does not expand that code, but it is conventionally used for “not recommended for new designs.” Confirm exact model, firmware, support, and orderability with Lantronix.
6. **Security, EAL5, and ingress:** the XPort Pro documentation reviewed advertises legacy options including SSLv3, RC4, MD5, and SHA-1. No XPort Pro EAL5 Common Criteria certificate or IP ingress-protection code was located in the sources reviewed. Do not expose it directly to the public Internet or treat it as patient isolation.
7. **Latency:** none was measured. The report provides a controlled, authorized bench protocol, including serial serialization and XPort packetization effects. Internet latency is variable and has no deterministic guarantee here; any real-time EEG feedback loop should remain local.

## 1. SealTight, B&B Hardware, and Larry Bogatz

### Company and product history

SealTight’s [About page](https://www.sealtighttechnology.com/About_Sealtight.html) says “Sealtight Fastener is a wholly owned subsidiary of B&B Hardware, Inc.” The company presents SealTight as a self-sealing fastener business serving aerospace and other industrial applications. Its own materials list fasteners, self-sealing nuts, rivets, washers, multiple head styles, and adhesive-free nuts. These are company descriptions, not independent market-share or performance verification.

The public court record gives a useful, dated history: Larry J. Bogatz, described by the Eighth Circuit as a B&B co-founder, applied to register SEALTIGHT in May 1990; the PTO notified B&B in 1992 that the mark was eligible for registration; the mark was registered on the Principal Register in October 1993. The [2001 Eighth Circuit opinion](https://caselaw.findlaw.com/court/us-8th-circuit/1429943.html) also describes B&B’s self-sealing fastener business and the early Hargis dispute. Patent records identify Larry and Diana S. Bogatz as co-inventors on the three listed grants; the [2018 Eighth Circuit opinion](https://media.ca8.uscourts.gov/opndir/18/12/171570P.pdf) identifies B&B as a California corporation in that litigation. Patent assignment records use differing corporate descriptions over time; this review did not establish a complete corporate-formation, ownership, or biographical chronology. The 1990 trademark filing and the patent assignments are stronger public milestones than an unverified company “founded” date.

### How the fastener seals

The company’s [How It Works page](https://www.sealtighttechnology.com/How_It_Works.html) describes a fastener head with a formed groove underneath and an O-ring seated in that groove. When installed, the O-ring is compressed and contained while the outer rim of the head bears on the workpiece. In engineering terms, the ring seals the head/workpiece interface around the clearance opening; it does not automatically seal every possible leakage path through threads, joints, cracks, or adjoining components.

The patent descriptions emphasize that the gland and elastomer must be designed together. Relevant variables include groove depth and volume, inner/outer wall geometry, O-ring cross-section and material, amount of squeeze, fastener preload/torque, workpiece flatness and finish, hole diameter, temperature, fluid/gas compatibility, and reusability requirements. One patent description discusses a 25–40% compression range for a disclosed embodiment and an approximately 42% limit; these are inventor/patent-description statements, **not universal O-ring design rules or a recommendation for unrelated materials or applications**.

The company advertises pressure performance “greater than 20,000 psi,” leak resistance, and reusability on its own site. No part-specific, independent test report, complete test conditions, or third-party qualification package was located in the public sources reviewed. Treat these statements as **manufacturer claims** until supported by test data for the exact fastener, elastomer, material, torque, workpiece, medium, temperature, and cycle count.

### Bogatz/B&B patent record

B&B’s [Patents & Copyrights page](https://www.sealtighttechnology.com/Patents_&_Copyrights.html) lists the same three patent numbers below. Google Patents’ records show Larry J. Bogatz and Diana S. Bogatz as inventors and B&B Hardware as assignee/owner in the recorded assignment history.

| U.S. patent | Family and issue date | What the claims address (high-level summary) | Database status observed |
|---|---|---|---|
| [US 5,957,641](https://patents.google.com/patent/US5957641A/en) | 1996-07-18 priority; filed 1997-03-19; granted 1999-09-28; 15 claims | A sealed multi-part/rivet fastener with a hollow head/shank, locking collar and mandrel, and a seal between collar and mandrel; dependent claims include an optional second seal/groove under the head. | Google Patents: **Expired—Fee Related**; its events list lapse for failure to pay maintenance fees effective 2011-09-28. |
| [US 6,231,286](https://patents.google.com/patent/US6231286B1/en) | 1996-07-18 priority; granted 2001-05-15; 13 claims | A headed fastener with an annular under-head groove surrounding the shank and a sealing element/O-ring sized and positioned in relation to the groove. Claims include groove-wall and sealing-element-volume relationships. | Google Patents: **Expired—Fee Related**. |
| [US 6,283,691](https://patents.google.com/patent/US6283691B1/en) | 1998-01-27 priority; filed 1999-04-28; granted 2001-09-04; 17 claims | A sealing nut with an underside groove and outward-slanting retaining wall so the sealing element is compressed into the opening; other claims address related under-head fastener geometry. | Google Patents: **Expired—Fee Related**; its events list lapse for failure to pay maintenance fees effective 2009-09-04. |

The first two grants are related through the 1996 application family; the third is a later continuation-in-part in the same technical lineage. Their claims describe particular combinations and geometry; they should not be generalized into a monopoly on all O-ring seals, fasteners, or sealing methods. Conversely, an expired listing for these three grants does not establish freedom to operate: other patents, other jurisdictions, later filings, reinstatement records, claim interpretation, and product-specific design details still matter.

B&B’s patent page still says the featured products “are patented,” but the page carries a 2017 copyright date and does not discuss the recorded fee-related lapse events. That wording should not be treated as a current legal-status update. Google Patents expressly treats legal-status summaries as assumptions rather than legal conclusions. For any legal reliance, retrieve each file wrapper and current maintenance/status information from [USPTO Patent Center](https://patentcenter.uspto.gov/) and consult qualified patent counsel. The patent table is a research map, not a legal-status opinion.

## 2. SEALTIGHT / SEALTITE trademark and litigation timeline

**Important distinction:** this controversy concerns brand names and registration rights. It is not a court ruling on whether the SealTight O-ring geometry works, whether a particular fastener leaks, or whether a specific product infringes the Bogatz patents.

| Date | Proceeding and result |
|---|---|
| **1990–1993** | Larry Bogatz filed the SEALTIGHT application in 1990; the mark was registered in 1993 for B&B fasteners with captive O-rings used in aerospace. |
| **1996–2001** | Hargis sought SEALTITE for self-piercing/self-drilling screws for metal and post-frame buildings. In B&B’s first district-court case, a 2000 jury found SEALTIGHT merely descriptive and without secondary meaning; it did **not** reach likelihood of confusion. The Eighth Circuit affirmed in 2001. |
| **2003–2007** | B&B opposed Hargis’s SEALTITE application before the TTAB. In 2007 the Board found likelihood of confusion and sustained B&B’s opposition. The official [TTABVUE opposition 91155687 record](https://ttabvue.uspto.gov/ttabvue/v?pno=91155687) documents the proceeding. This registration decision was separate from the 2000 district-court decision about distinctiveness. |
| **2015** | In [B&B Hardware, Inc. v. Hargis Industries, 575 U.S. 138](https://supreme.justia.com/cases/federal/us/575/138/), the Supreme Court held that a TTAB decision can have issue-preclusive effect when the ordinary elements of issue preclusion are met and the uses being compared are materially the same. The Court reversed and remanded; it did not issue a blanket infringement ruling or resolve all trademark-validity questions. |
| **After remand; affirmed 2018** | In the later district-court proceedings, the jury found that Hargis infringed but did not do so willfully, awarded no profits, and found for Hargis on its counterclaims and its affirmative defense that B&B had fraudulently obtained incontestability. The district court then entered judgment for Hargis, reasoning that B&B lost the incontestability presumption and was collaterally estopped from relitigating the 2000 distinctiveness finding. The Eighth Circuit affirmed in 2018. The [official opinion](https://media.ca8.uscourts.gov/opndir/18/12/171570P.pdf) explains that the disputed affidavit failed to disclose the prior adverse jury verdict; this is a specific trademark/PTO finding, not a general accusation about B&B’s business. |
| **2016–2021** | B&B filed a new SEALTIGHT application, Serial No. 86927791. Hargis opposed it on descriptiveness/no acquired distinctiveness and issue-preclusion grounds. The TTAB’s June 30, 2020 order expressly says it is **not precedent**; it sustained Hargis’s opposition. Reconsideration was denied, and the [official TTABVUE opposition 91230220 record](https://ttabvue.uspto.gov/ttabvue/v?pno=91230220) shows termination on January 22, 2021 and the application abandoned after the inter partes decision. The decision text is available [here](https://case-law.vlex.com/vid/hargis-industries-lp-v-894189119). |

The 2007 and 2020 TTAB outcomes address different applications and issues. The earlier decision found likelihood of confusion for Hargis’s SEALTITE application; the later opposition challenged B&B’s attempt to register SEALTIGHT based on descriptiveness and the prior distinctiveness judgment. The Supreme Court’s 2015 preclusion ruling does not collapse these into one final determination of all rights.

For status context, the 2020 TTAB opinion says B&B’s original Registration No. 1,797,509 was cancelled in 2016 for failure to file a Section 8 declaration; the 2018 Eighth Circuit opinion describes the claimed period of statutory rights as ending in October 2013. The dates and labels differ across the records, and this report does not infer the legal effective date. Check the live [USPTO TSDR registration record](https://tsdr.uspto.gov/#caseNumber=1797509&caseType=US_REGISTRATION_NO&searchType=statusSearch) before relying on it. The 2016 application is also listed as abandoned in the [TSDR application record](https://tsdr.uspto.gov/#caseNumber=86927791&caseType=SERIAL_NO&searchType=statusSearch). These specific records do not establish that no common-law trademark rights could exist today, nor do they substitute for a current clearance search.

## 3. EEG → XPort Pro → network: feasibility and safe boundaries

### What the module can and cannot do

Lantronix describes XPort Pro as an embedded serial/network module. Its [current product page](https://www.lantronix.com/products/xport-pro/) lists 10/100 Ethernet and configurable serial rates up to 921,600 bps; it says the standard 460,800-bps rate is unsupported. The [Integration Guide, part 900-557 Rev. K (August 2024)](https://cdn.lantronix.com/wp-content/uploads/pdf/XPort-Pro_IG.pdf) specifies a **3.3-V CMOS UART**. For a cable or peripheral using RS-232 or RS-422/485 voltage levels, the guide says to use an external serial transceiver. The module’s serial pins are not ±RS-232 pins and are not 5-V tolerant.

An XPort Pro does not measure EEG potentials: there is no EEG electrode input, low-noise biopotential amplifier, or EEG ADC in this module. The possible use is only as a network bridge for an already-digitized serial stream produced by a suitable acquisition device, and only if that device’s manufacturer allows the interface and the electrical levels/protocol match. Do not connect electrodes or analog EEG leads to the XPort Pro. Do not treat its UART, RJ45 magnetics, or ordinary Ethernet isolation as a medical patient-protection barrier.

### Conceptual architecture (not tested)

```text
EEG electrodes
      │
      ▼
Medical EEG front end + ADC
(patient-applied part, isolation and safety designed for the intended use)
      │  manufacturer-approved isolated digital output
      ▼
Local acquisition computer / edge processor
(sample clock, timestamps, quality checks, local storage)
      ├──────────────► any real-time feedback stays local
      │
      └── optional, post-isolation serial telemetry
                  │  voltage/protocol matched; external transceiver if needed
                  ▼
           XPort Pro on a restricted lab/device VLAN
                  │
                  ▼
       Firewall + maintained VPN / modern-security gateway
                  │
                  ▼
       Authorized remote collector (not a public echo target)
```

If an EEG manufacturer offers USB/Ethernet output rather than serial, this device may not be needed. If XPort Pro is used in a proof of concept, keep it behind a firewall on a segmented network, use a maintained gateway for the remote encrypted connection, restrict inbound/outbound paths, disable unused services, change credentials, confirm the exact firmware’s patch/support state, and do not port-forward it or expose its management interfaces to the public Internet. If a supported firmware/security posture cannot be established, choose a currently supported gateway for a new design.

### Product lifecycle, cybersecurity, EAL5, and IP code

- **Lifecycle:** Lantronix’s product listings display **“In Production-NRFND”** for XPort Pro and XPort Pro Lx6. The product page’s technical overview carries a “Last Updated: 08/04/2016” date, while the Integration Guide has an August 2024 revision. The “In Production” wording means this is not necessarily discontinued; “NRFND” is not expanded on the page and should be confirmed with Lantronix as to recommended use, firmware maintenance, and support for the exact SKU.
- **Legacy cryptography:** the manufacturer’s XPort Pro page lists SSLv3, SSHv2, AES, 3DES, RC4, SHA-1, and MD5 among its security options. That list is a warning to verify exact firmware, enabled services, ciphers, certificates, and update support. It is not proof that every option is enabled on every variant, nor evidence that a given unit negotiates a modern secure connection. In the absence of vendor-confirmed and independently tested contemporary security, do not connect it directly to the Internet or use it as the sole protection for EEG data.
- **Common Criteria EAL 5:** the CC:2022 assurance package is defined for a specific evaluated Target of Evaluation and Security Target; EAL5 is an information-technology security assurance level, commonly described as “semi-formally designed and tested.” It is not a medical-safety grade, a clinical validation, an IP ingress rating, or a blanket certificate for an entire EEG system. A targeted review of Lantronix materials and the [Common Criteria certified-product index](https://www.commoncriteriaportal.org/products/index.cfm) and its [archived-product index](https://www.commoncriteriaportal.org/products/index.cfm?archived=1) did not locate an XPort Pro EAL5 certificate. This is a **non-finding, not proof that no certificate ever existed**. Any claim should be supported by the exact certificate, Security Target, hardware/firmware version, evaluated configuration, and current certificate status.
- **IP code:** IP here means the **Ingress Protection** code, not an Internet Protocol address. IEC 60529 classifies enclosure protection. No XPort Pro IP code was found in the product page or integration guide reviewed. The bare module’s enclosure, temperature range, EMI/EMC statements, or RJ45 package do not establish a finished device IP rating. If the use environment requires dust/water protection, design and test the complete enclosure—including connectors, cable exits, seams, mounting, and operating configuration—to the applicable [IEC 60529](https://webstore.iec.ch/en/publication/2452) requirements.

## 4. Workplace and medical-electrical safety

| Topic | What to apply / verify | What it does **not** establish |
|---|---|---|
| **OSHA electrical workplace rules (United States)** | [29 CFR 1910.303](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.303) addresses approved equipment, freedom from recognized employee hazards, suitability for the environment, and use according to listing/labeling instructions. [29 CFR 1910.334](https://www.ecfr.gov/current/title-29/subtitle-B/chapter-XVII/part-1910/subpart-S/subject-group-ECFRbd7903c591a5eff/section-1910.334) includes use rules for electrical equipment and conductive work locations. | OSHA workplace compliance is not a patient-connected medical-device approval, EEG performance test, IP certification, or Common Criteria certificate. These OSHA provisions are U.S.-specific; a deployment in France/EU also needs a separate review of applicable local workplace and medical-device obligations. |
| **IEC 60601-1, general medical electrical safety** | The IEC webstore identifies the consolidated [IEC 60601-1:2005+A1:2012+A2:2020, edition 3.2](https://webstore.iec.ch/en/publication/67497) as the general basic-safety/essential-performance standard; applicable national/adopted versions and regulatory editions must be checked for the intended market. | A bare network module or its Ethernet magnetics cannot be presumed to meet patient-protection requirements for a connected system. |
| **IEC 60601-1-2, EMC** | The consolidated [IEC 60601-1-2:2014+A1:2020](https://webstore.iec.ch/en/publication/67554) covers electromagnetic disturbances and emissions for medical electrical equipment/systems. The final EEG setup must be evaluated in its intended environment, including the XPort, cable, power, host, and radio/network equipment. | A module’s industrial or EMC agency marks do not demonstrate EMC compliance of the completed medical system. |
| **EEG-specific standard** | The current consolidated EEG particular standard is [IEC 80601-2-26:2019+AMD1:2024](https://webstore.iec.ch/en/publication/92074). Its scope covers EEG equipment/systems for professional healthcare, emergency medical services, and home healthcare. It excludes, among other things, standalone EEG data storage/retrieval, phono-photic stimulators, and equipment particularly intended for ECT monitoring; system-implemented safety functions still need to be specified and verified as the standard requires. | Exclusion of a standalone storage/retrieval product from this particular standard does not by itself exempt a connected medical system from other applicable requirements. This report does not claim FDA recognition or regulatory approval. |
| **Closed-loop physiological control (if intended)** | If the intended purpose goes beyond recording/telemetry and includes a physiologic closed-loop controller, assess the applicability of [IEC 60601-1-10](https://webstore.iec.ch/en/publication/67383) in addition to the EEG and general requirements. | This report does not establish that the proposed EEG/network setup is a validated treatment, neurofeedback intervention, or safe controller. |

A patient-connected EEG system requires qualified medical-electrical safety and risk-management work on the **complete system**: applied-part classification, means of patient protection, leakage current, insulation/creepage/clearance, EMC, fault conditions, software/system boundaries, and the intended clinical/home/emergency environment. A regular serial transceiver, Ethernet magnetics, VPN, EAL claim, or IP rating cannot substitute for those evaluations.

## 5. Latency: expected contributors and a bench protocol

### What can be said now

There is **no measured latency result** for this proposed system. No particular EEG model, XPort SKU/firmware, authorized endpoint, or network route was supplied. Any numeric Internet-latency claim would therefore be invented.

End-to-end EEG data latency may include EEG sample-window/filter delay, host buffering and scheduling, UART serialization, XPort gap/packing timers, Ethernet/LAN queues, VPN/firewall processing, wide-area network delay, remote server queues, and application processing. RTT is not the same as one-way application latency, and a generic `ping` result is not a substitute for measuring the actual serial/tunnel/application path.

The [XPort Pro User Guide, part 900-560 Rev. G (February 2019)](https://www.lantronix.com/wp-content/uploads/pdf/900-560e_XPort_Pro_UG_release.pdf) describes a default serial gap timer of four character periods after the last character, with a minimum of 1 ms. The guide also describes packing by byte threshold, timeout, or send character; those settings can batch data further. For an 8-N-1 UART, a character uses 10 wire bits, so a 128-byte payload takes about **11.1 ms at 115,200 bps** or **1.39 ms at 921,600 bps** just for serial wire time. At 9,600 bps, four 8-N-1 character periods are about **4.17 ms**; at 115,200 bps, four periods are below 1 ms, so the documented 1-ms minimum applies. These are arithmetic illustrations of serialization/configuration, **not measured XPort or Internet performance**.

### Suggested controlled protocol (not performed)

1. **Freeze and record the configuration.** Record the exact XPort part number, OS (Linux or Evolution), firmware/build, serial rate/data/parity/stop/flow-control settings, connection mode/protocol, packing/gap/threshold/timeout settings, power, cabling, switch/VLAN, VPN/gateway, and remote server location. Confirm firmware and support with Lantronix first.
2. **Use a non-patient source.** Generate synthetic/replayed EEG-like frames or use a manufacturer-approved test output. Do not attach a subject during network/latency testing. Keep the sample clock and timestamp source explicit.
3. **Frame the payload.** Include a session ID, monotonically increasing sequence number, acquisition/sample timestamp, payload length, and checksum. Use the same application protocol and packet sizes intended for deployment. Confirm there is no byte corruption or framing loss before measuring.
4. **Verify electrical levels.** The XPort Pro UART is 3.3-V CMOS. Use a compatible logic-level interface or the correct external RS-232/RS-485 transceiver for the attached device. Do not connect RS-232 voltage levels directly to the module pins.
5. **Establish a local baseline.** Measure acquisition-host → serial → XPort → local, authorized echo/collector on an isolated wired LAN. Then measure the exact intended authorized remote path through the planned firewall/VPN. Do not scan for targets or use an arbitrary public echo service.
6. **Separate round-trip and one-way timing.** For RTT, timestamp send and matching response using a monotonic clock on the originating host. To estimate one-way delay, synchronize source and destination clocks (e.g. a controlled PTP/NTP arrangement) and document synchronization error; otherwise report RTT only. If possible, record acquisition time, serial write time, remote application receive time, and return receive time separately.
7. **Exercise relevant conditions.** Run at least 10,000 sequence-numbered frames per configuration, including the intended payload size/rate and representative small/large frames, idle and expected background load, and a sustained run long enough to observe reconnects or queue buildup. Change one setting at a time and record it; repeat the baseline after each configuration change.
8. **Report distributions, not just averages.** Report p50/p95/p99/p99.9/max RTT, sample count, timeouts, loss, duplicates, reordering, reconnects, throughput, and an explicitly defined jitter statistic (for example, percentiles of absolute changes between successive RTTs). TCP hides some packet loss via retransmission but captures stream/application delays; if UDP loss/reordering is relevant, test UDP separately and label it as a different protocol.
9. **Set application criteria before calling the test acceptable.** No timing target was supplied, so this report sets none. A qualified design owner must define limits based on the clinical/intended use and verify that stale or delayed data cannot drive unsafe feedback. Keep any time-critical feedback/control local; remote traffic should be for telemetry/storage unless the complete control system has separately been designed and validated for that use.

The result should identify exactly what was measured—serial, local LAN, or end-to-end remote RTT—along with hardware, firmware, configuration, clock error, route, and test date. Internet path variability, congestion, failover, routing changes, and server load prevent a deterministic latency guarantee from this module or this report.

## 6. Bottom line

SealTight’s disclosed sealing idea is an engineered captive-O-ring/groove assembly whose performance depends on the particular part and test conditions. The Bogatz patents are narrow, geometry-specific records; current legal status needs official USPTO verification. The SEALTIGHT/SEALTITE dispute was trademark litigation with multiple different decisions on distinctiveness, confusion, fraud, and preclusion—not a ruling validating a particular fastener’s pressure or leak claims.

An EEG-to-XPort Pro path is technically conceivable only **after** a compliant EEG front end has digitized and safely isolated the patient-side signal, and only if the serial interface matches. The XPort Pro’s legacy protocol list and NRFND status make it a poor default for a new Internet-connected patient-data design. It has no identified EAL5 certificate or module IP rating in the reviewed records, and neither would substitute for system-level medical safety testing. Use a supported, modern security gateway and keep real-time EEG processing/feedback local.

The latency section is a repeatable proposed bench method, not a test result. To plan an actual authorized measurement, the missing inputs are the EEG/acquisition model and output interface, XPort exact SKU/firmware, authorized echo/collector endpoint, planned network/VPN route, payload/rate, and target latency/loss criteria.

## Source register

### SealTight and patents

- [SealTight — About](https://www.sealtighttechnology.com/About_Sealtight.html), [How It Works](https://www.sealtighttechnology.com/How_It_Works.html), [Patents & Copyrights](https://www.sealtighttechnology.com/Patents_&_Copyrights.html).
- Google Patents: [US 5,957,641](https://patents.google.com/patent/US5957641A/en), [US 6,231,286](https://patents.google.com/patent/US6231286B1/en), [US 6,283,691](https://patents.google.com/patent/US6283691B1/en). Official file histories: [USPTO Patent Center 08820537](https://patentcenter.uspto.gov/applications/08820537), [08683818](https://patentcenter.uspto.gov/applications/08683818), [09300879](https://patentcenter.uspto.gov/applications/09300879).

### Trademark/court record

- [B&B Hardware v. Hargis, 252 F.3d 1010 (8th Cir. 2001)](https://caselaw.findlaw.com/court/us-8th-circuit/1429943.html); [TTABVUE Opposition 91155687](https://ttabvue.uspto.gov/ttabvue/v?pno=91155687).
- [B&B Hardware v. Hargis, 575 U.S. 138 (2015)](https://supreme.justia.com/cases/federal/us/575/138/); [Eighth Circuit No. 17-1570/17-1755 (2018)](https://media.ca8.uscourts.gov/opndir/18/12/171570P.pdf).
- [TTABVUE Opposition 91230220](https://ttabvue.uspto.gov/ttabvue/v?pno=91230220); [June 30, 2020 TTAB order text](https://case-law.vlex.com/vid/hargis-industries-lp-v-894189119); [USPTO TSDR original registration](https://tsdr.uspto.gov/#caseNumber=1797509&caseType=US_REGISTRATION_NO&searchType=statusSearch) and [2016 application](https://tsdr.uspto.gov/#caseNumber=86927791&caseType=SERIAL_NO&searchType=statusSearch).

### XPort Pro and standards

- Lantronix [XPort Pro product page](https://www.lantronix.com/products/xport-pro/), [serial-to-Ethernet product listings](https://www.lantronix.com/products-class/serial-to-ethernet-wired-device-servers/), [Integration Guide 900-557 Rev. K](https://cdn.lantronix.com/wp-content/uploads/pdf/XPort-Pro_IG.pdf), [User Guide 900-560 Rev. G](https://www.lantronix.com/wp-content/uploads/pdf/900-560e_XPort_Pro_UG_release.pdf).
- [Common Criteria:2022 Part 5](https://www.commoncriteriaportal.org/files/ccfiles/CC2022PART5R1.pdf); [certified products and archives](https://www.commoncriteriaportal.org/products/index.cfm).
- IEC: [60529 IP Code](https://webstore.iec.ch/en/publication/2452); [60601-1 edition 3.2](https://webstore.iec.ch/en/publication/67497); [60601-1-2 edition 4.1](https://webstore.iec.ch/en/publication/67554); [80601-2-26 consolidated 2019+AMD1:2024](https://webstore.iec.ch/en/publication/92074); [60601-1-10](https://webstore.iec.ch/en/publication/67383).
- U.S. workplace references: [OSHA 29 CFR 1910.303](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.303) and [eCFR 29 CFR 1910.334](https://www.ecfr.gov/current/title-29/subtitle-B/chapter-XVII/part-1910/subpart-S/subject-group-ECFRbd7903c591a5eff/section-1910.334).
