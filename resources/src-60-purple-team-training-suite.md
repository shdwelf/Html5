# Purple Team Training Suite — SecOps Simulation Lab

> **Register:** src-60 · **Original:** https://bashupload.app/tmkcep.htm
> **Extracted:** 30 August 2026 · **Type:** self-published standalone HTML5 tool
> **Banner:** PURPLETEAM LAB / SecOps Suite v4.2 · **Build:** `ptl-sim-4.2.1 | 2025-06-19`

> **AUTHORIZED TRAINING USE ONLY — SIMULATED DATA** · This is an educational Purple Team UI
> mockup. No real packet capture, RF transmission, or offensive tooling is included. For use in
> isolated lab environments with proper authorization only.

A defensive-training console that stages a red-vs-blue exercise entirely out of synthetic
data. Every panel is labelled as simulated, and the suite states plainly that it contains no
offensive capability.

## Red vs. Blue — live exercise scoreboard

| | Score | Detail |
|---|---|---|
| 🔴 Red Team | 1260 | TTPs **7 / 14** · MTTD Evasion **11.4 min** |
| 🔵 Blue Team | 1385 | Detections **7 / 7** · MTTR **4.2 min** |

Scoring: MITRE ATT&CK Emulation · NIST CSF aligned.

**Event log (sample):** 09:12:04 RED — TA0001 Initial Access, phishing simulation (+150) ·
09:14:31 BLUE — EDR email gateway alert correlated (+180) · 09:22:10 RED — TA0003 Persistence,
scheduled-task emulation (+120) · 09:23:55 BLUE — host isolated via SOC playbook IR-4 (+220).

## Exercise health

Isolated Purple Range · ATT&CK coverage **7 techniques** · detection ratio **100 %** ·
MTTD **1 m 42 s** · MTTR **4 m 12 s** · log ingest healthy · containment SLA met.

## Panels

- **MITRE ATT&CK Kill Chain Navigator** — training emulation across TA0043, TA0042, TA0001,
  TA0002, TA0003, TA0004, TA0005, TA0008, TA0010; clicking a phase loads the matching
  defensive playbook
- **Live Network Topology** — draggable lab-range nodes; "a visualization aid only — no live sniffing"
- **Blue Team SOC — Detection Queue** — severity / rule / asset / status (e.g. "Canary token
  accessed — exfil sim", contained)
- **RF Spectrum Lab** — simulated 2.4 GHz / 5 GHz waterfall and BLE scanner; "No SDR attached
  — this is training visualization only." Lab AP survey: PTL-LAB-5G ch36 −42 dBm,
  PTL-LAB-2G ch6 −51 dBm, PTL-GUEST-ISO ch11 −63 dBm, PTL-IOT-SEG ch1 −68 dBm
- **Wireless Hardening Checklist** — WPA3-Enterprise/SAE enforced, PMF required, isolated
  VLANs per SSID, rogue-AP detection in monitor mode, Bluetooth LE Secure Connections,
  Wi-Fi 6E 6 GHz survey clean
- **Packet Forensics Workbench** — three synthetic captures (lab-phish-sim.pcap 1,240 packets;
  lab-lateral-smb.pcap 3,102; lab-dns-exfil-canary.pcap 842) with a packet console, stream
  view, and flow summary table
- **Visual Traceroute & Network Path Analysis** — "a simulated traceroute map for training"
- **Red Team / Blue Team Field Manuals** — authorized-emulation reference with a rules-of-engagement
  template; NIST CSF 2.0 aligned defensive manual ( Identify / Protect / Detect / Respond /
  Recover / Govern ) and IR runbook
- **Purple Team Collaboration Loop** — Plan (ROE signed) → Emulate → Detect (MTTD measured)
  → Improve (coverage +1)

## Stated limits, repeated at the foot of every panel

"All network traffic, RF data, packet captures, and adversary emulation in this UI are
**synthetic / simulated**. No offensive capabilities, exploits, or unauthorized access tools
are included. Use only for authorized defensive training, in isolated lab environments, with
proper legal approval."
