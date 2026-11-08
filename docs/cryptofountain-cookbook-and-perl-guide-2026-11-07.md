# CryptoFountain BBS Cookbook & Perl Porting Guide

**Date:** 2026-11-07  
**Branch:** `arena/955b61eb-html5`  
**Purpose:** Technical cookbook and Perl porting guide for CryptoFountain BBS primitives, rateless Luby Transform erasure codes, Rsync-style delta sync, and ITAR export-controlled crypto history.

---

## 1. Perl Architecture & Primitives (`tools/cryptofountain.pl`)

The complete suite of decentralized primitives has been ported and verified in standard Perl 5 (using `Math::BigInt`, `Encode`, and native bitwise math):

### 1.1 Checksums & Hashes
- **Adler-32** (modulo 65521): Matches RFC 1950 and CryptoFountain sample post (`0x6f2a22e2`).
- **Fletcher-16** (modulo 255): Two 8-bit accumulators packed into 16-bit integer (`0xe704`).
- **64-bit Dual FNV-1a**: 32-bit offset basis `2166136261` and secondary `3238371032` with prime `16777619` (`6ed10d32dac30e74`).

### 1.2 Rateless Erasure Codes & Peeling Belief Propagation
- **Robust Soliton CDF**: Precomputed over $K$ blocks balancing Ideal Soliton $\rho(d)$ and ripple support $\tau(d)$.
- **LT Packet Encoder & Decoder**: Random linear XOR combinations decoded via degree-1 ripple cascade in Perl arrays.

---

## 2. ITAR Munitions Export Laws & The Perl RSA T-Shirt as Free Speech

### 2.1 Historical Context (The 1990s Crypto Wars)
During the 1990s, the United States Department of State regulated cryptographic software with key lengths exceeding 40 bits under the **International Traffic in Arms Regulations (ITAR)** as Category XIII ("Auxiliary Military Equipment") munitions. Exporting strong crypto without a munitions license was punishable by severe criminal penalties.

### 2.2 The Protest & Breakthrough
In 1995, cryptographer Dr. Adam Back authored a terse, 3-line implementation of RSA in Perl and distributed it as an email signature:

```perl
#!/bin/perl -s-- -export-a-crypto-system-sig -RSA-3-lines-PERL
$m=unpack(H.$w,$m."\0"x$w),$_=`echo "16do$w 2+4Oi0$d*-^1[d2%Sa
2/d0<X+d*La1=z\U$n%0]SX$k"[$m*]\EszlXx++p|dc`,s/^.|\W//g,print
pack('H*',$_)while read(STDIN,$m,($w=2*$d-1+length$n&~1)/2)
```

Activists printed this Perl code alongside machine-readable Code 39 / 2D barcodes onto physical T-shirts ("The Munitions T-Shirt"). Wearing the shirt on international flights or exporting it directly confronted ITAR:
- Under ITAR, the printed shirt constituted an "unlicensed munition export".
- Under the First Amendment, the printed code was indisputably text and protected speech.

This civil protest directly influenced landmark legal victories, notably ***Bernstein v. United States* (9th Cir. 1999)**, where the federal court established the foundational legal doctrine that **source code is speech** protected by the First Amendment.
