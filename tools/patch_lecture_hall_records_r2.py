#!/usr/bin/env python3
"""
patch_lecture_hall_records_r2.py — the 2026-09-20 pass over the Intelligence
Lecture Hall.

Status: **already applied** to the bundle on 2026-09-20. Kept for the same
reason tools/patch_lecture_hall_records.py is kept: the records otherwise exist
only as tens of kilobytes of text spliced into a 1 MB minified file, and this is
the reviewable source of that text plus the only way to re-derive the edit
against a clean copy. Re-running it against the patched bundle fails loudly
(every anchor must resolve exactly once, and every new string must be absent),
so it cannot double-apply.

What this pass does
  * adds two records — `cicada-3301` and `f5-blackhat-2018` (hall: 8 -> 10)
  * rewrites four facts and one summary in the 2026-09-14 records, and appends
    thirteen more, closing six open threads from
    docs/lecture-hall-research-2026-09-14.md
  * widens the hall's own scope line to cover internet puzzle hunts

Unlike the first pass this tool does not match 300-character literals. It
locates a record by id, then a field by name, then a string inside that field by
a short unique substring, and replaces the whole quoted string. That is stricter,
not looser: a substring that is not unique inside the record aborts the run.

See docs/lecture-hall-research-2026-09-20.md for the research and
tools/verify_lecture_hall.mjs for the proofs the records rest on.
"""
import json
import os
import re
import subprocess
import sys
import tempfile

APP = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "apps",
    "Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html",
)


def js(value):
    """A JS string literal from a Python str (single-quote-safe, no raw quotes).

    Straight apostrophes are promoted to U+2019 so the new prose matches the
    typography of the rest of the hall. URLs are passed through untouched, since
    an apostrophe in a URL is data, not punctuation.
    """
    if value.startswith(("http://", "https://")):
        return json.dumps(value, ensure_ascii=False)
    return json.dumps(value.replace("'", "\u2019"), ensure_ascii=False)


def record(rid, title, period, location, confidence, summary, facts, links, caution):
    parts = [
        f'id:"{rid}"',
        f"title:{js(title)}",
        f"period:{js(period)}",
        f"location:{js(location)}",
        f"confidence:{js(confidence)}",
        f"summary:{js(summary)}",
        "facts:[" + ",".join(js(f) for f in facts) + "]",
        "sourceLinks:["
        + ",".join("{" + f"label:{js(l)},url:{js(u)}" + "}" for l, u in links)
        + "]",
        f"caution:{js(caution)}",
    ]
    return "{" + ",".join(parts) + "}"


# --------------------------------------------------------------- locating help


def find_record(src, rid):
    """Byte range of one record object inside the Pc array."""
    marker = f'id:"{rid}"'
    if src.count(marker) != 1:
        sys.exit(f"FAIL: record id {rid} occurs {src.count(marker)} times (need exactly 1)")
    start = src.rfind("{", 0, src.index(marker))
    # bracket-match forward from `start`, skipping string contents
    depth = 0
    quote = None
    i = start
    while i < len(src):
        c = src[i]
        if quote:
            if c == "\\":
                i += 2
                continue
            if c == quote:
                quote = None
        elif c in "\"'`":
            quote = c
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return start, i + 1
        i += 1
    sys.exit(f"FAIL: could not bracket-match record {rid}")


def field_range(src, rid, field):
    """Byte range of one array-valued field (`facts` or `sourceLinks`)."""
    lo, hi = find_record(src, rid)
    marker = f"{field}:["
    pos = src.find(marker, lo, hi)
    if pos < 0:
        sys.exit(f"FAIL: {rid} has no {field} array")
    open_at = pos + len(marker) - 1
    depth = 0
    quote = None
    i = open_at
    while i < hi:
        c = src[i]
        if quote:
            if c == "\\":
                i += 2
                continue
            if c == quote:
                quote = None
        elif c in "\"'`":
            quote = c
        elif c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                return open_at, i + 1
        i += 1
    sys.exit(f"FAIL: could not bracket-match {rid}.{field}")


def string_bounds(src, lo, hi, needle):
    """Bounds of the quoted string containing `needle`, which must be unique."""
    hits = []
    pos = lo
    while True:
        pos = src.find(needle, pos, hi)
        if pos < 0:
            break
        hits.append(pos)
        pos += 1
    if len(hits) != 1:
        sys.exit(f"FAIL: needle {needle[:60]!r} occurs {len(hits)} times in range (need 1)")
    at = hits[0]
    a = src.rfind('"', lo, at)
    b = src.find('"', at, hi)
    if a < 0 or b < 0:
        sys.exit("FAIL: could not find the quotes around the needle")
    inner = src[a + 1 : b]
    if '\\"' in inner:
        sys.exit("FAIL: target string contains an escaped quote; refusing to guess its bounds")
    return a, b + 1


def replace_string(src, rid, needle, new_text):
    """Replace the whole quoted string that contains `needle`."""
    lo, hi = find_record(src, rid)
    a, b = string_bounds(src, lo, hi, needle)
    if js(new_text) in src:
        sys.exit(f"FAIL: replacement for {needle[:48]!r} is already present — this looks applied")
    return src[:a] + js(new_text) + src[b:]


def replace_summary(src, rid, new_text):
    lo, hi = find_record(src, rid)
    marker = 'summary:"'
    pos = src.find(marker, lo, hi)
    if pos < 0:
        sys.exit(f"FAIL: {rid} has no summary")
    a = pos + len(marker) - 1  # the opening quote
    b = src.find('"', a + 1, hi)
    if b < 0:
        sys.exit(f"FAIL: could not find the closing quote of {rid}.summary")
    if '\\"' in src[a + 1 : b]:
        sys.exit("FAIL: summary contains an escaped quote")
    if js(new_text) in src:
        sys.exit("FAIL: new summary already present — this looks applied")
    return src[:a] + js(new_text) + src[b + 1 :]


def append_items(src, rid, field, items):
    """Append already-serialised items to a record's `facts` or `sourceLinks`."""
    a, b = field_range(src, rid, field)
    close = b - 1  # the "]"
    for it in items:
        if it in src:
            sys.exit(f"FAIL: item already present in {rid}.{field} — this looks applied")
    sep = "," if src[close - 1] != "[" else ""
    return src[:close] + sep + ",".join(items) + src[close:]


def append_links(src, rid, links):
    items = ["{" + f"label:{js(l)},url:{js(u)}" + "}" for l, u in links]
    return append_items(src, rid, "sourceLinks", items)


def append_facts(src, rid, facts):
    return append_items(src, rid, "facts", [js(f) for f in facts])


def replace_literal(src, old, new):
    n = src.count(old)
    if n != 1:
        sys.exit(f"FAIL: literal anchor found {n} times (need exactly 1): {old[:70]!r}")
    if new in src:
        sys.exit("FAIL: literal replacement already present — this looks applied")
    return src.replace(old, new)


# ============================================================== the new records

R_CICADA = record(
    "cicada-3301",
    "Cicada 3301 — the puzzle that made signature verification its first rule",
    "2012–2014 · three rounds; signed messages to April 2017",
    "4chan, imgur, Twitter and Tor · paper posters on five continents · one OpenPGP key",
    "Community archive",
    "Three rounds of puzzles posted under the name 3301 between 2012 and 2014, never attributed to anyone, and in the third round still unsolved. What earns it a place in this hall is not the mystery but the discipline it imposed: every clue was signed with a single OpenPGP key, and the puzzle's own instructions told solvers to distrust anything that was not. That rule is checkable offline from the published signature bytes, and this record checks it — then corrects a keyserver hostname that has begun to circulate.",
    [
        "Chronology: the first round was posted to 4chan on 4 January 2012 and ran for nearly a month; the second began on 4 January 2013; the third was posted to Twitter on 4 January 2014 as the Liber Primus and was never finished. A further clue appeared on 5 January 2016, and the last verified signed message in April 2017.",
        "The OutGuess payload of the 2012 welcome image is the founding document of the verification rule, quoted verbatim: “- From here on out, we will cryptographically sign all messages with this key. It is available on the mit keyservers.  Key ID 7A35090F, as posted in a2e7j6ic78h0j. Patience is a virtue. Good luck. 3301”",
        "Verified in this repository with no keyserver and no GnuPG: base64-decoding the published signature block puts an OpenPGP issuer subpacket at byte 19 — 0a 09 10 181f01e57a35090f — whose eight bytes are the signer’s long key ID, and whose low 32 bits are 7A35090F. The key ID Cicada asks you to trust is readable out of the signature itself, so it does not have to be taken on faith from any server.",
        "The v4 fingerprint gpg prints, 6D85 4CD7 9333 22A6 01C3 286D 181F 01E5 7A35 090F, is 40 hex digits = 160 bits of SHA-1. Per RFC 4880 the long key ID is its last 16 digits (181F01E57A35090F) and the short key ID its last 8, which is why “7A35090F” and the fingerprint are one claim at two lengths — and why the subpacket above agrees with both.",
        "A correction this record owes the next reader. Cicada named no host: “the mit keyservers” is the whole of its claim. The MIT keyserver is pgp.mit.edu, which DNS shows to be a CNAME of cryptonomicon.mit.edu — both resolve to 18.9.60.141. A claim that the key sits on a “cryptomomicon.mit.edu” keyserver is one letter off, and that host does not resolve at all (getaddrinfo ENOTFOUND). It is recorded here as a corruption of cryptonomicon, the hostname MIT gave its keyserver after Stephenson’s novel, so it cannot be re-propagated as fact.",
        "gpg’s own output on the 2016 message is the lesson, quoted rather than paraphrased: “Good signature from “Cicada 3301 (845145127)””, immediately followed by “WARNING: This key is not certified with a trusted signature! There is no indication that the signature belongs to the owner.” A signature proves which key wrote a message; it never proves who holds the key.",
        "The 2012 round also shipped a deliberately weak RSA sub-puzzle: a Crypt::RSA::ES::OAEP message (Version 1.99) with e = 65537 and a modulus the note described as having “a low bit modulus and is therefore breakable”. Each solver received a unique message and was told not to collaborate — “Sharing your message or key will result in not receiving the next step.”",
        "Not factored here, and the record says so. Measured, the published modulus is 112 decimal digits = 372 bits, and e = 65537 = 2^16 + 1, the Fermat prime F4. This pass attempted trial division to 97, Fermat’s method (2×10^6 iterations), Pollard rho (2.4×10^7) and Pollard p−1 (B1 = 10^6), and found no factor; there is no small prime factor to find. “Breakable” is Cicada’s framing of its own puzzle, not a result this repository reproduces.",
        "Imposture was the operative hazard and Cicada legislated against it twice. When an unrelated group calling itself “3301” intruded on Planned Parenthood’s database in July 2015, Cicada signed a denial: it “are not associated with this group in any way, nor do [we] condone their use of our name, number, or symbolism”. In 2012 Chile’s investigative police (PDI, Los Andes Province) called it a hacker group, and Cicada signed a denial of illegal activity then too.",
        "An anomaly recorded rather than resolved: the April 2017 message is signed with the same key, but its armour reads “Version: CicadaPG v.3301” — a string no GnuPG release ever printed — and its hash header is SHA512 where every earlier message said SHA1. It is nonetheless the last message the public record treats as verified, and it says only “Beware false paths. Always verify PGP signature from 7A35090F.”",
        "The numbers, kept as arithmetic and nothing more: 3301 is prime; the public exponent 65537 is 2^16 + 1 and the Fermat prime F4; 65536 is 2^16; and the periodical cicada’s broods run on 13- and 17-year cycles, both prime. Why this insect and why this number are not published, so the hall does not invent a reason.",
        "Two of the three rounds were finished — Marcus Wanner is credited with the first puzzle of 2013 — and those who finished were asked about their support for information freedom, online privacy and the rejection of censorship, then invited to a private forum and told to devise and complete a project. The third round, the Liber Primus, remains unsolved.",
        "The method outlived the puzzle: the United States Navy based its 2014 Project Architeuthis recruitment challenge on the Cicada format, and the 2015 Person of Interest episode “Nautilus” names it as inspiration. Texts used inside the rounds include Agrippa (A Book of the Dead), the Mabinogion and The Book of the Law.",
    ],
    [
        ("Uncovering Cicada — What Happened (2012), the community’s message-by-message record", "https://uncovering-cicada.fandom.com/wiki/What_Happened_(2012)"),
        ("Welcome.txt — the OutGuess payload of the 2012 welcome image, verbatim", "https://github.com/aadishgoel/Cicada-3301/blob/master/Welcome.txt"),
        ("Uncovering Cicada — 2016 Message, with the gpg --verify output quoted above", "https://uncovering-cicada.fandom.com/wiki/2016_Message"),
        ("Uncovering Cicada — PGP Signed Message April 2017 (the “CicadaPG v.3301” armour)", "https://uncovering-cicada.fandom.com/wiki/PGP_Signed_Message_April_2017"),
        ("BoxenTriq — Cicada 3301 First Puzzle Walkthrough (the RSA sub-puzzle and its modulus)", "https://www.boxentriq.com/guides/cicada-3301-first-puzzle-walkthrough"),
        ("Wikipedia — Cicada 3301 (chronology, resolution, legacy, and the impersonations)", "https://en.wikipedia.org/wiki/Cicada_3301"),
        ("Rolling Stone — Cicada: Solving the Web’s Deepest Mystery (David Kushner, 2015)", "https://www.rollingstone.com/culture/features/cicada-solving-the-webs-deepest-mystery-20150115"),
        ("Threat Stack — Cicadas & Security, Part 2: When a Verified PGP Key Takes You on a Trip to the Desert", "https://blog.threatstack.com/cicadas-security-part-2-when-a-verified-pgp-key-takes-you-on-a-trip-to-the-desert"),
        ("MIT PGP keyserver — the host Cicada’s “mit keyservers” refers to", "https://pgp.mit.edu/"),
    ],
    "Cicada 3301 has no owner, no institutional archive and no attributed author, so nearly everything about it arrives through community mirrors and secondary reporting; the signed messages are the only primary source, and even those reach us as transcriptions of images. This record treats the OpenPGP material as primary because it is checkable byte-for-byte offline, and treats every story about who ran the puzzle as unattributed speculation. A verified signature is not an identity — gpg’s warning is quoted above for exactly that reason. Nothing here endorses the guess that any intelligence agency was behind it, and the third round is recorded as unfinished rather than as a mystery with a withheld ending.",
)

R_F5_2018 = record(
    "f5-blackhat-2018",
    "F5’s Black Hat 2018 cipher challenge: a keyed Vigenère hidden in moons and flag semaphore",
    "August 2018 · solver’s writeup 14 September 2018",
    "Black Hat USA, Las Vegas · the F5 booth · a crossword card and a two-sided t-shirt",
    "Community archive",
    "F5 published a full post-mortem of its 2016 booth puzzle and a JSON data model for 2019, but nothing at all for 2018 — so the middle year of the series survives only in one solver’s writeup. That turned the record into a test rather than a citation: the writeup names a ciphertext, an alphabet key and a passphrase, and all three are checkable against each other. They check, exactly, and in only one of six plausible index conventions.",
    [
        "The chain the card and the shirt built between them, in the order a solver had to find it: the crossword’s blue squares give “keyed / vigenere / rumking”, a pointer to rumkin.com’s Keyed Vigenère tool; its red squares give “truths / return / zero”, the passphrase; the shirt’s front shows three robots holding flags in flag-semaphore positions, spelling F5 and so naming the method; the shirt’s back shows moons, each carrying a clock-face angle that is really a pair of flag directions.",
        "The ordering rule was astronomical rather than cryptographic. The card asked: if each moon transmits one element of the key alphabet simultaneously and the planets rebroadcast, in what order does Earth receive them? Planets are ordered by distance from Earth, and within a planet its moons by distance from that planet — so Luna’s G arrives first, then Mars’s D and P, Phobos at roughly 10,000 km ahead of Deimos at roughly 20,000 km.",
        "Assembled that way, the 26 moons of seven bodies yield the alphabet key GDPQWLZIHMSONAKFYXTVJRBCEU. The harness asserts what the shirt implies: one letter per moon, a permutation of all 26 with no repeats, and the per-planet groups concatenating in distance order to the whole key.",
        "The three inputs, quoted from the writeup: ciphertext WVBYTJPYHGPBHBIRYAIBFPQUYBZILI (30 characters), alphabet key GDPQWLZIHMSONAKFYXTVJRBCEU, passphrase truthsreturnzero. Decrypted, it reads NECESSITYDISPENSETHWITHDECORUM — “NECESSITY DISPENSETH WITH DECORUM”, which the writeup attributes to Thomas Carlyle.",
        "Verified in this repository in both directions: the keyed Vigenère decrypts the published ciphertext to the published plaintext, and re-encrypting that plaintext returns the published ciphertext exactly. This is the only year of the F5 series whose entire solution re-derives from a participant’s account rather than from the operator’s own post-mortem.",
        "The convention matters and is not obvious. Of the six plausible ways to index a keyed Vigenère — ciphertext position and passphrase position each taken in either the keyed or the plain alphabet — exactly one reproduces the plaintext: both operands indexed in the keyed alphabet. The harness runs all six and asserts the other five fail, because a cipher that “works” under any convention has not been verified at all.",
        "An unkeyed Vigenère (an identity alphabet key) does not solve it, which is the point of the shirt: the moons do not carry the message, they carry the order of the tableau. Without that order the passphrase is useless, and without the passphrase the order is only an alphabet.",
        "The card carried a bonus question that was also astronomical: which planet receives all twenty-six decryption keys first, counting rounds by how many rebroadcasts a key needs rather than by distance, which changes constantly. The writeup’s result is Saturn, reached by counting 0-jump, 1-jump and 2-jump rounds — Earth collects G, then D and P from Mars, then Q, W, L and Z from Jupiter.",
        "Provenance, stated plainly: F5 published a DevCentral post-mortem for 2016 (article 275036) and a JSON model of the t-shirt’s data structure for 2019 (article 291348), but no post-mortem for 2018. The only public account is Eviatar Gerzi’s writeup of 14 September 2018 — a participant’s record, written weeks after the event, illustrated with his own photographs of the card and the shirt.",
        "That is why the arithmetic carries the record. A retelling can be wrong about the middle steps and still be right about the endpoints, and here the endpoints constrain each other: three published strings that decrypt and re-encrypt into one another exactly are very hard to invent by accident. The writeup is first-hand, partial and corrigible; the ciphertext, the key and the plaintext are not.",
        "The 2018 round therefore sits between two documented years and shows the series changing shape. 2016 layered three classical ciphers against an online solver and published everything afterwards. 2018 hid the key order in physical astronomy and made the cipher itself the easy part, publishing nothing. 2019 handed solvers a JSON tree model of the shirt and never published an answer at all.",
    ],
    [
        ("Eviatar Gerzi — Solving F5’s puzzle on Black Hat USA 2018 (the only public account)", "https://eviatargerzi.medium.com/solving-f5s-puzzle-on-black-hat-usa-2018-c991e6134886"),
        ("rumkin.com — Keyed Vigenère Cipher, the tool the crossword’s blue squares pointed at", "http://rumkin.com/tools/cipher/vigenere-keyed.php"),
        ("Flag semaphore — the system the shirt’s front used to spell F5", "https://en.wikipedia.org/wiki/Flag_semaphore"),
        ("Vigenère cipher — the tableau the keyed variant reorders", "https://en.wikipedia.org/wiki/Vigen%C3%A8re_cipher"),
        ("F5 DevCentral — BlackHat 2016 F5 Cipher Challenge (the series’ own post-mortem)", "https://community.f5.com/kb/technicalarticles/blackhat-2016-f5-cipher-challenge/275036"),
        ("F5 DevCentral — #F5CipherChallenge at Black Hat 2019 (the JSON tree, and no answer)", "https://community.f5.com/kb/technicalarticles/can-you-solve-the-f5cipherchallenge-at-black-hat-2019/291348"),
    ],
    "A participant’s reconstruction, not the operator’s. F5 never published a 2018 post-mortem, so the crossword text, the shirt artwork and the ordering rule reach this hall second-hand, through one writeup and its photographs; the physical card was not examined. What is solid is the arithmetic — ciphertext, alphabet key, passphrase and plaintext re-derive against each other in this repository, which constrains any retelling of the middle steps even where a detail of the story may be off. The astronomy should not be treated as authoritative: the moon ordering is the solver’s reading of the card’s wording, and a different reading of “rebroadcast” could have been intended. Like the rest of the F5 series this is a puzzle, not protection.",
)

NEW_RECORDS = ",".join([R_CICADA, R_F5_2018])


# ============================================================ the four rewrites

SUMMARY_AGENTS = (
    "When a notebook company hid a puzzle in each of 21 releases, the solvers were a Tumblr blog. "
    "Its “What We Know” page prints, for every stage, the wheel ciphertext, the two-letter key and "
    "the answer — which makes the archive checkable rather than folkloric. The 2026-09-14 pass "
    "could re-derive eight codes. With the complete key table in hand this pass re-derives 18 of "
    "the 21, proves a nineteenth is a permutation of its published answer, and proves the last two "
    "are corrupt rather than merely strange."
)

FACT_F5_2019 = (
    "The series, and what survived of it. F5 published a post-mortem for 2016 and, for 2019, “a "
    "JSON block which is a model of the data structure on the t-shirt” plus a zipped simplified "
    "variant of the same (DevCentral 291348, 7 Aug 2019). That article names no answer, prints no "
    "card text, and asks solvers to “avoid posting hints, answers, or spoilers here” — so no "
    "solution was ever published for 2019, and none is asserted here. The 2018 edition is the "
    "subject of the record beside this one; it has no post-mortem at all. The 2016 record was "
    "written before the 2019 article had been fetched, and the open thread it left is now closed "
    "as a documented absence rather than a gap."
)

FACT_F5_PIGPEN = (
    "Card #3 remains the one artefact in this record that cannot be re-derived. The post-mortem "
    "embeds its ciphertext as an image roughly 600 × 57 pixels and the text never transcribes the "
    "glyphs; the published Ruby generator excludes it explicitly, commenting “easy puzzles (not "
    "pigpen)” and deriving only ctx1 and ctx2. Its plaintext is documented as a pigpen variant of "
    "“INSIDE AN ENIGMA”, and it matters because those three card solutions concatenate into the "
    "Playfair key. The harness reproduces cards #1 and #2 byte-for-byte and the 42-character key "
    "square from the three plaintexts, while recording the glyph alphabet itself as unrecovered "
    "rather than redrawing a 600-pixel-wide image from a description of it."
)

FACT_SEAL_HERALDRY = (
    "Whether the seal still carries the string was an open thread in the 2026-09-14 pass, and a "
    "primary source closes it. The U.S. Army Institute of Heraldry’s official blazon for the "
    "USCYBERCOM seal (tioh.army.mil, HeraldryId 16683) still specifies the ring: “Within the blue "
    "disk is a golden circle laid with MD5 hash that ties the command back to the early days of "
    "computer networking; USCYBERCOM's mission statement is encrypted within this code”. The "
    "command was elevated to a unified combatant command in May 2018 and this heraldic record was "
    "not superseded — so the ring is not a 2010 curiosity that was quietly dropped."
)

FACT_SEAL_BLAZON_ERROR = (
    "The blazon also promotes the press’s error into an official description. An MD5 digest does "
    "not encrypt anything and cannot be decrypted, yet the command’s own heraldry says the mission "
    "statement “is encrypted within this code”. That is the reason this record keeps using the word "
    "commitment instead of cipher: the misconception is not a journalist’s shorthand that a better "
    "article could fix, it is written into the description of the insignia itself."
)

FACT_SEAL_WORDCOUNT = (
    "A third transcription, caught by counting rather than reading: Computerworld described the "
    "preimage as “Cybercom's 58-word mission statement”. The text that actually hashes to the seal "
    "string is 55 words and 392 characters. Even the length of the preimage had to be recomputed "
    "here rather than quoted, which is the same lesson as the CRN 31-character rendering in a "
    "milder key."
)

FACT_WHEEL_LINE2 = (
    "Line 2, and the two ways a perfectly legible transcription can still be wrong. Read exactly as "
    "messages.txt prints it, the ciphertext 5OWB3D6JWA1HSD3.U64 decodes under FN to "
    "F6ELDNOTESBRAND.COM — a 6 standing where an I belongs. But the wheel’s own output for the "
    "publisher’s domain is 50WB3D6JWA1HSD3.U64: the file carries a letter O in the second position "
    "where the dial emits a zero. Read that O as a 0 and the line decodes to FIELDNOTESBRAND.COM "
    "exactly. Read the file’s ASCII 1 as a lowercase l instead, and the decode becomes "
    "F6ELDNOTESVRAND.COM — which is precisely the annotation printed on the same line, "
    "“f[6]eldnotes[V]rand.com”. Both ambiguities belong to a 36-character dial that mixes letters "
    "with digits, not to the transcriber."
)

FACT_WHEEL_NOTRECOVERED = (
    "Not recovered: the four short codes in the same file (m9uuty01h4qwksq.1op and three more). The "
    "narrow sweep — all 1296 keys, both directions, the codes exactly as printed — yields no "
    "domain-shaped string. This pass tried harder and then checked whether trying harder meant "
    "anything: allowing letter/digit lookalike variants (O↔0, I↔1, S↔5, B↔8, Z↔2, G↔6, T↔7) "
    "against a 46-entry TLD list does produce 224 “domain-shaped” strings across 56 distinct "
    "outputs, and not one of their bodies contains a word. Run on the corpus’s own line 2 as a "
    "positive control the same test fires 32 times; run on 16 random strings of identical shape it "
    "produces more hits than the real codes do. The loosened test has no power, so the four are "
    "recorded as unrecovered rather than as merely hard — and the calibration is part of the "
    "record, because an uncalibrated negative is only a rumour about a search."
)

FACT_WHEEL_PORT_DEFECT = (
    "A fidelity defect this pass found in its own port. js/lecture-ciphers.js carried six lines of "
    "messages.txt; the upstream file has seven. The seventh is the publisher’s domain in the clear "
    "— fieldnotesbrand.com — and it is the corpus’s own answer key, because it is exactly what line "
    "2’s ciphertext decodes to once the O/0 ambiguity is resolved. The port now carries all seven, "
    "fetched through the GitHub API rather than retyped, and the harness asserts both the line "
    "count and the round trip."
)

FACT_WHEEL_PROVENANCE = (
    "Which also settles the provenance thread, though not in the way it was asked. messages.txt "
    "could not be checked against the physical 2018 literature, and still cannot — but it could be "
    "checked against its own contents. Line 7 in the clear and line 2 in ciphertext are the same "
    "string under one key, differing by a single ambiguous glyph, and that internal agreement is a "
    "stronger witness than a photograph of a card would have been. The upstream repository is "
    "unchanged since 6 December 2020 (25 commits, 2 stars), so the transcription is stable rather "
    "than merely old."
)

FACT_AGENTS_LEDGER = (
    "Verified here, all 21 rows. Seventeen of the published codes re-derive exactly — but only once "
    "each puzzle is run through the operation the archive itself documents, instead of one uniform "
    "decode. #6 encodes rather than decodes; #5 needs a box reading after the wheel; #8 needs a "
    "book cipher; #9 is a double decode; #16 has a quartet pre-shift. #21 is the twentieth key row "
    "and re-derives too, which makes 18 of 21. A flat “decode with key i” gets 18 of the 20 letters "
    "of #21 and looks exactly like a wrong key — which is how the previous pass came to read #11 as "
    "a partial failure rather than a transposition."
)

FACT_AGENTS_COLLISION = (
    "A corruption, now proved rather than flagged. The blog prints one Code for #19 and #20 — 3STO "
    "IDV3 AIDT 7RPM PATF H04N — against two different keys (JB for J.B. Fletcher, IE for Irwin "
    "“Whistler” Emery) and two different answers. Under IE it decodes to OVERLYGODLYESCAPADE02378 "
    "and under JB to 5EVA4FX5W4FV9TR8RWVHJMQP; neither is a shop and a ZIP. This pass ran every "
    "one of the 1296 keys in both directions against both published answers in both orientations — "
    "10,368 attempts, zero successes. The code printed for #19 and #20 belongs to neither puzzle, "
    "so it is a transcription collision in the archive rather than an unsolved stage. Flagged, "
    "quantified, and still not repaired."
)

FACT_AGENTS_21 = (
    "#21 had no notebook at all — it was embedded in a Jackbox Twitch stream, and its key was “each "
    "of the previous 20 key, in order, for each of the 20 letters in the code”. Twenty letters, "
    "twenty keys, one letter each: a polyalphabetic finish line for a cipher that is otherwise "
    "monoalphabetic. Reconstructed here exactly, and only when each puzzle keeps its own documented "
    "operation — #6 encodes, #9 double-decodes VK then KS, the rest decode. The result is "
    "PLAYJACKBOXTWITCH330, twenty characters against twenty letters, which is the instruction the "
    "stream was hiding. A polyalphabetic finish line is precisely where a static wheel cipher stops "
    "being trustworthy, and whoever designed the endgame knew it."
)

FACT_AGENTS_820CHI = (
    "The query the archivist raised mid-session as “820chi” is puzzle #1, one digit off. Key SH for "
    "Sherlock Holmes — “When you have eliminated the impossible, whatever remains, however "
    "improbable, must be the truth” — decodes D7BH 0NB5 B77. to 826 CHI 60622, the clue for the "
    "Secret Agent Supply Store in Chicago. The string “820chi” itself decodes to nothing "
    "English-shaped under any of the 1296 keys in either direction, so it was never a code: it was "
    "a misremembering of a shop clue, carried into a research log and then into this hall. Answered "
    "rather than left open, and the wrong string is recorded beside the right one so neither is "
    "lost."
)

FACT_AGENTS_BOOKCIPHER = (
    "#8 is a book cipher, and its solution dates a tokenisation. Under BG for Benjamin Gates the "
    "code decodes not to letters but to fourteen digits — 70225849304224, which is why the archive’s "
    "answer is only seven characters long. Read as seven two-digit word numbers (70, 22, 58, 49, 30, "
    "42, 24) and taken as positions in the opening sentence of the Declaration of Independence, the "
    "first letters spell TTMEPLA: “TTM EP LA”, the Time Travel Mart in Echo Park, Los Angeles. The "
    "convention only works if “Nature’s” counts as one word; splitting the possessive shifts every "
    "later index and gives TTOGPLA instead. Seven independent letters agreeing is not luck, so the "
    "answer fixes the tokenisation rather than the reverse. All seven indices fall inside that one "
    "sentence, which is why the sentence and not the document is the key text."
)

FACT_AGENTS_BOX = (
    "#5 shows how much a single phrase can hide. The archive says the wheel output “had to be read "
    "as a box cipher (stacked 4x5 and read the columns left-to-right)” to give CRIMINAL RECORDS "
    "30307. The geometry that actually reproduces it is five rows of four; four rows of five gives "
    "CAR0NO3IC0ME3IRSRLD7. “4x5” meant four wide and five tall, and the harness asserts both "
    "readings so the distinction survives the next retelling."
)

FACT_AGENTS_SPIRAL = (
    "#11 is a permutation, and the permutation is the finding. Under JB for Jason Bourne the code "
    "decodes to VORTR67EI2XN41SEVUO — nineteen characters whose multiset is exactly that of "
    "VORTEXSOUVENIR67214, which is what the archive means by “via reading in a spiral”. This pass "
    "then searched every rectangular spiral on grids up to 5×5 in eight orientations, with the text "
    "laid in by rows, by columns or by spiral and read back out in any of the same orders: nothing "
    "reproduces the published answer. The geometry lives on the notebook page, which the archive "
    "does not publish, so the record proves the transposition and records the missing shape rather "
    "than guessing one. The page did publish its own ordering device — thirteen dots aligned to the "
    "letters E G F A K D H I J M B L C — but that order belongs to the licence-plate transdeletion, "
    "not to the wheel output."
)

FACT_AGENTS_POFLUKE = (
    "#17’s “fluke”, stated by the designers and then reproduced by arithmetic. In the January 2019 "
    "AMA the puzzle’s authors said solvers had read the Olivia Pope stage with key PO used in the "
    "encoding direction, but that it was meant to be read with key 54 — LIV in Roman numerals, "
    "Olivia Pope’s nickname — in the decoding direction, and that it was “just a fluke of the wheel "
    "that it worked”. The fluke is reproducible: decode(54) and encode(PO) both yield "
    "OLDFOXBOOKS21401, from two different alphabets. That is the 36×18 keyspace leaking in both "
    "directions at once, and it is exactly the collision the wheel’s own README warns about."
)

FACT_AGENTS_AMA = (
    "The AMA supplies what no solution page could. The designers had planned 24 puzzles — three "
    "Practical Applications from each of eight editions — and cut to 21 mid-hunt; they changed "
    "entire puzzles deep into the run; they confirm the four-digit location codes in #20 were FedEx "
    "store IDs; and they note that the Scrabble-bingo puzzle used Jim and Bryan because those are "
    "Field Notes’ own people, which solvers read as a reference to the Cincinnati Reds’ managers. "
    "Asked about the character “Em Dash”, the answer recorded is “We don’t know. And we probably "
    "never will.”"
)

FACT_AGENTS_HOWTO = (
    "The operating procedure, from the archive’s own “How to Play”: a video shows a Field Notes "
    "employee quoting a line from a famous fictional character; the solvers attribute the quote; the "
    "character’s initials are that day’s wheel setting; the notebook page decodes to a shop name and "
    "a ZIP; an agent is dispatched to say the quote to an employee and is handed a notebook to "
    "photograph and post to Slack. The keys are therefore puns on fictional supervisors, the "
    "coordination was a volunteer Slack channel, and the solvers eventually wrote a bot to run the "
    "wheel for them — a monoalphabetic cipher automated by the people it was meant to slow down."
)


ADDED_IDS = ["cicada-3301", "f5-blackhat-2018"]


def pc_region(src):
    """The `Pc=[...]` array literal, bracket-matched on `"` strings only.

    The records inside it use double-quoted strings exclusively (they were
    emitted by a JSON serialiser), so `"`-only matching is exact here — and it
    avoids mistaking an apostrophe inside prose for a string delimiter, which
    is what silently mis-ranges a naive three-quote matcher.
    """
    lo = src.find("Pc=[")
    if lo < 0:
        sys.exit("FAIL: no Pc=[ array in the bundle")
    open_at = lo + 3
    depth = 0
    i = open_at
    while i < len(src):
        c = src[i]
        if c == '"':
            i = src.find('"', i + 1)
            if i < 0:
                sys.exit("FAIL: unterminated string while matching Pc")
        elif c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                return src[open_at : i + 1]
        i += 1
    sys.exit("FAIL: could not bracket-match Pc")


def pc_ids(src):
    return re.findall(r'\bid:"([^"]+)"', pc_region(src))


def validate(src, orig_ids):
    """Refuse to write a bundle that no longer parses.

    The suite is one minified inline module whose data arrays contain template
    literals with real newlines, so a single mis-spliced quote is invisible to
    the eye and fatal to the app. Parse it with node before committing to disk.
    """
    ids = pc_ids(src)
    if len(ids) != len(set(ids)):
        dupes = sorted({x for x in ids if ids.count(x) > 1})
        sys.exit(f"FAIL: duplicated record ids after patching: {dupes}")
    expected = orig_ids + ADDED_IDS
    if ids != expected:
        sys.exit(f"FAIL: record ids changed unexpectedly\n  want {expected}\n  got  {ids}")
    print(f"  record ids: {len(ids)} ({', '.join(ADDED_IDS)} appended)")

    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as fh:
        fh.write(src)
        tmp = fh.name
    probe = (
        "const fs=require('fs'),vm=require('vm');"
        "const src=fs.readFileSync(process.argv[1],'utf8');"
        "const re=/<script(?![^>]*\\bsrc=)[^>]*>([\\s\\S]*?)<\\/script>/g;"
        "let n=0;"
        "for(const m of src.matchAll(re)){if(!m[1].trim())continue;"
        "new vm.Script(m[1],{filename:'inline.js'});n++}"
        "console.log('inline scripts parsed: '+n)"
    )
    try:
        r = subprocess.run(["node", "-e", probe, tmp], capture_output=True, text=True)
    finally:
        os.unlink(tmp)
    if r.returncode != 0:
        sys.exit("FAIL: patched bundle does not parse as JavaScript — nothing was written\n"
                 + (r.stderr or "")[:2000])
    print("  validated:", r.stdout.strip())


def main():
    if not os.path.exists(APP):
        sys.exit(
            "FAIL: no cipher-suite bundle at\n  " + APP + "\n"
            "This tool splices records into the single-file app, which lives in "
            "shdwelf/Html5 under apps/. It is kept beside the research corpus for "
            "reviewability, not to be run from a checkout that lacks the bundle."
        )
    src = open(APP, encoding="utf-8").read()
    original = src
    before = len(src)
    orig_ids = pc_ids(original)
    if any(rid in orig_ids for rid in ADDED_IDS):
        sys.exit(f"FAIL: this bundle already carries {ADDED_IDS} — the patch looks applied")
    steps = []

    def step(label, fn):
        nonlocal src
        n = len(src)
        src = fn(src)
        steps.append((label, len(src) - n))

    # 1. two new records, appended inside Pc so the bundle keeps its single-line shape
    step(
        "append cicada-3301 + f5-blackhat-2018",
        lambda s: replace_literal(
            s,
            'provenance stays unblurred."}],Vv=[',
            'provenance stays unblurred."},' + NEW_RECORDS + "],Vv=[",
        ),
    )

    # 2. the hall's own scope line, widened again
    step(
        "widen scope line",
        lambda s: replace_literal(
            s,
            'children:"Preserved traces of underground computing, counterintelligence, search culture, published puzzle engineering and institutional memory"',
            'children:"Preserved traces of underground computing, counterintelligence, search culture, published puzzle engineering, internet puzzle hunts and institutional memory"',
        ),
    )

    # 3. f5-blackhat-2016 — close the 2019 thread and record card #3 honestly
    step("rewrite f5-2016 series fact", lambda s: replace_string(s, "f5-blackhat-2016", "The series continued: F5 ran", FACT_F5_2019))
    step("append f5-2016 pigpen fact", lambda s: append_facts(s, "f5-blackhat-2016", [FACT_F5_PIGPEN]))

    # 4. uscybercom-seal-md5 — the blazon, its error, and the word count
    step(
        "append seal heraldry facts",
        lambda s: append_facts(s, "uscybercom-seal-md5", [FACT_SEAL_HERALDRY, FACT_SEAL_BLAZON_ERROR, FACT_SEAL_WORDCOUNT]),
    )
    step(
        "append seal heraldry link",
        lambda s: append_links(
            s,
            "uscybercom-seal-md5",
            [
                ("The Institute of Heraldry (tioh.army.mil) — official blazon of the USCYBERCOM seal", "https://tioh.army.mil/Catalog/Heraldry.aspx?HeraldryId=16683&CategoryId=9535&grp=14&menu=Uniformed+Services&ps=24"),
                ("Computerworld — Researcher cracks ‘secret’ code in U.S. Cyber Command logo (the “58-word” count)", "https://www.computerworld.com/article/1540486/researcher-cracks-secret-code-in-u-s-cyber-command-logo.html"),
            ],
        ),
    )

    # 5. fieldnotes-wheel — the O/0 and 1/l ambiguities, the seventh line, the calibrated negative
    step("rewrite wheel line-2 fact", lambda s: replace_string(s, "fieldnotes-wheel", "The corpus’s second line, under the same key", FACT_WHEEL_LINE2))
    step("rewrite wheel not-recovered fact", lambda s: replace_string(s, "fieldnotes-wheel", "Not recovered: the four short codes", FACT_WHEEL_NOTRECOVERED))
    step(
        "append wheel port-fidelity facts",
        lambda s: append_facts(s, "fieldnotes-wheel", [FACT_WHEEL_PORT_DEFECT, FACT_WHEEL_PROVENANCE]),
    )

    # 6. f1eldn0tes-agents — the full ledger
    step("rewrite agents summary", lambda s: replace_summary(s, "f1eldn0tes-agents", SUMMARY_AGENTS))
    step("rewrite agents ledger fact", lambda s: replace_string(s, "f1eldn0tes-agents", "Verified here: encoding the published answer", FACT_AGENTS_LEDGER))
    step("rewrite agents collision fact", lambda s: replace_string(s, "f1eldn0tes-agents", "A correction this archive owes the record", FACT_AGENTS_COLLISION))
    step("rewrite agents #21 fact", lambda s: replace_string(s, "f1eldn0tes-agents", "#21 had no notebook at all", FACT_AGENTS_21))
    step(
        "append agents facts",
        lambda s: append_facts(
            s,
            "f1eldn0tes-agents",
            [
                FACT_AGENTS_820CHI,
                FACT_AGENTS_BOOKCIPHER,
                FACT_AGENTS_BOX,
                FACT_AGENTS_SPIRAL,
                FACT_AGENTS_POFLUKE,
                FACT_AGENTS_AMA,
                FACT_AGENTS_HOWTO,
            ],
        ),
    )
    step(
        "append agents links",
        lambda s: append_links(
            s,
            "f1eldn0tes-agents",
            [
                ("Reddit r/FieldNuts — Agents of F.I.E.L.D. AMA with The Mystery League & Field Notes (2 Jan 2019)", "https://www.reddit.com/r/FieldNuts/comments/abuelm/agents_of_field_ama_with_the_mystery_league_field/"),
                ("f1eldn0tes.com — How to Play (the operating procedure the keys came out of)", "https://f1eldn0tes.com/how"),
                ("f1eldn0tes.com — Puzzle #11 (thirteen licence plates and the A–M dot order)", "https://f1eldn0tes.com/post/181057445677/puzzle-11"),
                ("Declaration of Independence — key text for #8’s book cipher (National Archives transcript)", "https://www.archives.gov/founding-docs/declaration"),
                ("Jurph/cipherwheel messages.txt — the corpus whose seventh line this pass restored", "https://raw.githubusercontent.com/Jurph/cipherwheel/master/messages.txt"),
            ],
        ),
    )
    step(
        "rewrite agents caution",
        lambda s: replace_string(
            s,
            "f1eldn0tes-agents",
            "A community archive of a solved game",
            "A community archive of a finished game, written by enthusiasts rather than historians, and demonstrably imperfect — the #19/#20 code collision is corrupt rather than ambiguous, and this pass proved that instead of papering over it. It is the leetspeak Tumblr run by solvers, not the publisher, whose own site is fieldnotesbrand.com; both are cited so the provenance stays unblurred. The 2019 AMA adds the designers’ own voice, the closest thing to a primary source the game has, but it is a Reddit thread moderated by the people being asked. And #8’s book cipher was checked against a GitHub-hosted transcript of the Declaration’s opening sentence rather than the National Archives page, because the build sandbox has no route to archives.gov; all seven indices fall inside that sentence, so a reader can repeat the check against a better copy.",
        ),
    )

    validate(src, orig_ids)
    open(APP, "w", encoding="utf-8").write(src)
    print(f"patched {os.path.relpath(APP)}")
    print(f"  {before:,} -> {len(src):,} bytes ({len(src) - before:+,})")
    for label, delta in steps:
        print(f"  {delta:+8,}  {label}")


if __name__ == "__main__":
    main()
