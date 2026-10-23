# T9.1 — boot-chain + AES pass-through dongle: research note (2026-10-23)

The S9 strand's sketch: a smartcard/dongle that sits in the boot path
and releases disk-encryption key material only after the card is
satisfied (PIN, presence), turning a passphrase-only LUKS volume into
a two-factor boot. This note records what the boot chain actually
offers, and where the concept is sound vs theatrical.

## What exists in the wild

- **cryptsetup + tokens.** LUKS2 carries a token subsystem; the
  systemd stack (`systemd-cryptenroll`) can enrol FIDO2
  (hmac-secret), TPM2, and PKCS#11 tokens, and `systemd-cryptsetup`
  releases the volume key at boot once the token answers. A
  smartcard via PKCS#11 (OpenSC-compatible, i.e. the 7816-4 profile
  chosen in docs/smartcard-filesystem-choice-2026-10-23.md) is
  therefore a *supported* second factor today, not a research
  prototype.
- **GRUB2** can itself open LUKS (grub's `cryptomount`, LUKS1 widely,
  LUKS2 with caveats) so the kernel/initramfs need not sit on a
  plaintext /boot — at the price of GRUB's deliberately small crypto
  surface and slow unlocks.
- **LILO** is the historical control case: it predates all of this,
  has no encryption support, and belongs in the note only as the
  reminder that the boot chain's oldest links cannot be retrofitted —
  the dongle concept starts at GRUB/EFI, full stop.

## The "AES pass-through" shape, honestly assessed

Passing bulk AES traffic *through* a smartcard is a non-starter and
the strand should not pursue it: card APDU channels are kilobytes per
second, so the only sane design is **key release, not data path** —
the card unwraps (or signs a challenge that unwraps) the LUKS key
slot material inside its own secure element, and the host does bulk
AES-NI at full speed. Stated that way, the concept is exactly what
PKCS#11-token unlock already implements; the research value is in
saying so, with this repo's card profile (PIN retry + sticky lockout,
js/cardreader.js) as the enrolment-time model.

## Residual risks the note has to keep

- **Evil maid.** Key release without measured boot proves possession,
  not platform integrity; pairing the card factor with TPM2 PCR
  policy (sealed to boot measurements) is what closes the tampering
  gap, and is a two-token enrolment in the systemd model.
- **Presence ≠ consent.** A card left inserted authenticates every
  boot; PIN entry on a trusted path (reader with its own PIN pad,
  class-3) is the differentiator between a dongle and a token.
- **Recovery.** Any dongle-gated volume needs a passphrase slot kept
  as the offline recovery path, or the first lost card is data loss.

## Status

Research note only; no boot tooling is built. The strand's follow-on,
if any, is an enrolment walkthrough against the virtual reader
(PKCS#11 surface over the 7816-4 profile), not code against real
hardware from this sandbox.
