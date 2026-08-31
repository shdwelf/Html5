# CensorBench — Censorship Testing & Sorting Benchmark Suite

> **Register:** src-17 · **Original:** https://bashupload.app/ak3q2l.htm
> **Extracted:** 30 August 2026 · **Type:** self-published standalone HTML5 tool

Tabs: 🛡️ Censorship · ⚡ Sorting · 📖 About

## Censorship Testing & Bypass Suite
"Detect and analyze internet censorship: DNS filtering, DPI, TLS interception, protocol
fingerprinting and encoding bypass techniques. Includes OONI-style probes, ECH/ESNI analysis,
V2Ray/Shadowsocks detection patterns and active probing defense."

**31 total tests · pass/fail/warning counters · pass rate.**
Categories: 🔍 All · 🌐 DNS · 📡 HTTP · 🔒 TLS/SSL · 📄 Content · 🔌 Network · 🔤 Encoding · 🔀 Protocol

## Encoding Bypass Laboratory
Input text transformed via: Base64 Encode/Decode, ROT13, Homoglyphs, Zero-Width, Reverse,
Leet Speak. "Demonstrates encoding bypass against keyword-based censorship filters."

## The 31 tests
- **DNS:** DNS Poisoning Detection (HIGH) — "GFW uses bidirectional injection"; DNS Sinkhole Detection (MED); NXDOMAIN Hijacking Test (MED); DNS Query Filtering (HIGH)
- **HTTP:** HTTP Header Injection Detection (HIGH); URL Keyword Filtering Test (CRITICAL); TCP RST Injection Detection (CRITICAL) — "RST arrives right after a forbidden SNI/keyword"; HTTP 302 Redirect Injection (HIGH)
- **TLS/SSL:** SNI Filtering Detection (CRITICAL); TLS Certificate Interception MITM (CRITICAL); TLS Downgrade Attack Test (HIGH)
- **Content:** Deep Packet Inspection (DPI) Detection (CRITICAL) — "Iran's DPI supports active probing and protocol allowlisting"; Media Content Filtering (HIGH); Keyword Pattern Matching Evasion (MED)
- **Encoding:** Base64 Encoding Bypass (LOW); Unicode Homoglyph Substitution (LOW) — "Cyrillic а/е/о/с/х, Greek ο"; Zero-Width Character Insertion (LOW) — ZWSP U+200B, ZWNJ U+200C, ZWJ U+200D; ROT13/Caesar Bypass (LOW); Punycode Domain Bypass (MED)
- **Protocol:** Protocol Obfuscation obfs4 (MED); Domain Fronting Viability (HIGH); WebSocket Tunnel Test (MED); Traffic Analysis Resistance (HIGH); V2Ray/VLESS+REALITY Detection (CRITICAL) — "≤5% GFW detection rate in 2025 — currently the most robust public transport"; Shadowsocks Active Probing Defense (CRITICAL) — "AEAD-authenticated … (documented by GFW Report, IMC '20)"; Encrypted Client Hello (ECH) Support (HIGH) — "Cloudflare enabled it network-wide Sep 2023; Russia blocked ECH Nov 2024"; Fully-Encrypted Traffic Flagging (HIGH)
- **Network:** IP Blacklist Detection (HIGH); Port Blocking Detection (MED) — SSH 22, OpenVPN 1194, WireGuard 51820, DoT 853; Bandwidth Throttling Detection (MED) — "OONI in Kazakhstan, Russia and Türkiye"; TCP/IP Fingerprint Manipulation (MED)

## 📚 Censorship Techniques Atlas
🌐 DNS Poisoning (bypass: DoH, DoT, DNSSEC) · 🔍 DPI (Iran pairs with active probing) ·
🔒 SNI Filtering (counter: ECH/ESNI; Russia blocked ECH Nov 2024) · 🚫 IP Blacklisting ·
⚡ TCP RST Injection · 🔬 Active Probing · 🐌 Targeted Throttling ·
🏛️ Regional Censorship (Henan runs 5× more domains than national GFW) ·
📱 App-Level VoIP Blocking (Saudi Arabia & UAE fingerprint STUN headers)
