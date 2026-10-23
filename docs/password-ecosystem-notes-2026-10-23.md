# T1.3 — password ecosystem: notes only (2026-10-23)

Standing decision F4 bounds this task: **cracking tooling is
notes-only**. This brief is the delivery for T1.3's survey strand
(Elcomsoft / John the Ripper / rainbow tables / HaveIBeenPwned) and
the terminal record for its "ARJ & SFX password recipes" strand,
which will not be built — the cookbook's password content stays at
identification (docs/zipcrypto-identification-notes-2026-10-23.md,
docs/arj-lha-ace-password-notes-2026-10-21.md), never attack
procedure. Nothing below is a how-to for recovering a password that
is not yours.

## The named tools, at survey altitude

- **Elcomsoft** (commercial, Moscow-founded) sells forensic password
  recovery: distributed/GPU-accelerated cracking aimed at law-
  enforcement and corporate-forensic customers, plus phone/backup
  extraction tooling. Its legitimate context is authorised forensic
  examination; its catalogue is also the most convenient map of
  which formats have weak password KDFs, which is a defensive
  reading: formats Elcomsoft advertises high speeds against are
  formats not to store anything under.
- **John the Ripper** (open source, Solar Designer) is the canonical
  password *auditor*: Unix-crypt origins, a "jumbo" community build
  covering hundreds of hash/container formats. Legitimate use:
  auditing your own user base's password strength before an attacker
  does, CTF/research, format archaeology. Its mode names (wordlist,
  incremental, mask) are the vocabulary of the field — noted here as
  vocabulary, not as a recipe: this repo ships no modes, rules, or
  wordlists.
- **Rainbow tables** are Hellman's time–memory tradeoff made
  practical (Oechslin's chains; Ophcrack popularised them against
  Windows LM/NTLM). The historically important fact is their
  *obsolescence*: a per-password salt makes precomputation
  per-salt (economically dead), and slow/memory-hard KDFs (bcrypt,
  scrypt, Argon2) raise the per-guess cost that remains. Any system
  still storing unsalted fast hashes (MD5/SHA-1/NTLM without salt)
  is rainbow-table prey — that is the audit finding rainbow tables
  exist to teach.
- **HaveIBeenPwned / Pwned Passwords** (Troy Hunt) is the defensive
  half of the ecosystem: a corpus of 800M+ breached passwords exposed
  through a **k-anonymity range API** co-designed with Cloudflare.
  The client SHA-1-hashes the candidate locally, sends only the
  first **5 hex characters**, receives every suffix sharing that
  prefix with counts, and matches locally — the service never learns
  the password or its full hash (SHA-1 here is a lookup index, not
  a storage recommendation). Responses can be padded so bucket size
  leaks nothing further.

## The defender's distillation (what to actually do)

NIST SP 800-63B-4 (published 2025-07-31) is the current reference:

- single-factor passwords **SHALL** be at least **15 characters**
  (8 only as one factor of several); verifiers **SHOULD** allow at
  least 64, spaces, printing ASCII, and Unicode;
- every new/changed password **SHALL** be screened against a
  blocklist of commonly used / expected / **compromised** passwords
  (the requirement Pwned Passwords was built, in 2017, to make
  implementable), with the rejection reason given;
- composition rules (mandatory symbol/digit mixes) **SHALL NOT** be
  imposed, and periodic forced rotation **SHALL NOT** be required
  absent evidence of compromise — length and breach-screening beat
  complexity theatre;
- storage side (the rainbow-table lesson): salted, slow, memory-hard
  hashing — Argon2id first choice, bcrypt/PBKDF2 where compliance
  dictates — makes both rainbow tables and GPU rigs economically
  boring.

## Verdict for T1.3

- Survey strand: **delivered as these notes.** The ecosystem divides
  cleanly into recovery/audit tooling (Elcomsoft, John — authorised
  contexts), a precomputation attack retired by salting and slow
  KDFs (rainbow tables), and defensive screening infrastructure
  (HIBP k-anonymity + NIST 800-63B-4 blocklists). The repo's correct
  posture is to cite the defensive half and implement none of the
  offensive half.
- ARJ/SFX recipe strand: **closed by standing decision F4**, with
  its identification-only notes already in the repo. No password-
  attack recipes will enter the cookbook from this line.

## Sources

NIST SP 800-63B-4, §3.1.1.2 (pages.nist.gov/800-63-4/sp800-63b.html;
final PDF nvlpubs.nist.gov, 2025); haveibeenpwned.com/API/V3 and
/Passwords and /NIST (k-anonymity design, corpus scale, the 2017
800-63B origin story); Hellman (1980) / Oechslin (2003) rainbow-table
lineage and Ophcrack as the populariser — standard references, cited
for the obsolescence argument rather than construction detail.
