# GeoMate SG7 firmware — container and platform analysis

*2026-10-09 · `update_SG7_v1.5.2_b20260803.bin.dat` (32,320,808 bytes, from Drive)*

## What it is

A firmware **update package** for a GeoMate SG7 GNSS survey receiver (GeoMate
Positioning, geomate.sg). Not a raw flash dump — a container the device's own
updater consumes (the SG6 release note on Drive describes the same 1.5.2 line:
EU Wi-Fi-password compliance, IMU antenna height, QZSS RINEX logging).

## Container header (offset 0)

| field | value |
| --- | --- |
| magic | `02 77 00 77` |
| part / serial | `A19312435706050001` |
| build date | `20260803` |
| version line | `13.4…` / package version `1.5.2` |

Inside: **3 gzip members** and **524 jffs2 nodes** — a gzipped kernel `zImage`
plus a jffs2/tar.bz2 rootfs, first-member entropy 7.55 bits/byte (compressed).

## Platform (from the embedded update script)

- **NXP i.MX6** (ARM Cortex-A9) — the updater calls `do_update_kernel_imx6` /
  `do_update_rootfs_imx6`.
- **NOR flash** — kernel written to `/dev/mtdblock2` with `dd … bs=1K`.
- rootfs unpacked with `tar -jxv -f rootfs.bin -C /`.
- integrity by **`md5sum`** (`CHECKSUM_FIRMWARE` vs `CHECKSUM_MACHINE`), not a
  signature — the package is checksum-verified, not cryptographically signed.
- branding: `logo_geomate.zip`, "this is geomate machine".

## Encryption finder (`scripts/crypto-find.py`)

Unlike the 1993 DOS binaries (no standard crypto), this firmware **embeds a
crypto library** — five known constants:

| offset | constant |
| --- | --- |
| `0x0037FB44` | SHA-512 K[0] |
| `0x0037FB48` | SHA-256 K[0] |
| `0x00385D90` | Blowfish P[0] |
| `0x003876EE` | AES Te0[0] |
| `0x0175DB20` | Blowfish S0[0] |

The adjacent SHA-256/512 K-tables and the AES/Blowfish tables are a bundled
TLS/crypto library (OpenSSL- or mbedTLS-class), consistent with the receiver's
web interface and NTRIP/RTK correction streams. Package integrity itself is
md5, which is collision-broken and not a security boundary.

## Scope / honest deferrals

Identified the container, platform, and crypto-library presence. **Not** done:
unpacking the jffs2 rootfs and disassembling the ARM kernel/userspace (capstone
supports ARM, so this is a available next step), and no attempt was made to
defeat any device security. `java`/OpenJDK does not apply here — this is an
ARM Linux image, not a JVM target.
