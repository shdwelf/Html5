#!/usr/bin/env python3
"""
Status: **already applied** to the bundle on 2026-09-14. Kept because the four
new lecture-hall records otherwise exist only as 17 kB of text spliced into a
1 MB minified file: this is the reviewable source of that text, and it is the
only way to re-derive the edit against a clean copy of the bundle. Re-running it
against the patched file fails loudly (every anchor is asserted to occur exactly
once), so it cannot double-apply.

See docs/lecture-hall-research-2026-09-14.md for the research, and
tools/verify_lecture_hall.mjs for the proofs the records rest on.
"""
import json
import sys

import os

APP = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "apps",
    "Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html",
)


def js(value):
    """A JS string literal from a Python str (single-quote-safe, no raw quotes)."""
    return json.dumps(value, ensure_ascii=False)


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


# ------------------------------------------------------------------ the records

R_F5 = record(
    "f5-blackhat-2016",
    "F5’s Black Hat 2016 cipher challenge: layering classical ciphers to starve an online solver",
    "August 2016",
    "Black Hat USA, Las Vegas · F5 DevCentral post-mortem",
    "Primary archive",
    "F5 published the ciphertexts, the hints, the solutions and the generator source for its booth puzzle, so the whole design is checkable. Every byte re-derives from the described mechanism, which makes this the hall’s benchmark case: the difficulty came from nesting, not from the mathematics.",
    [
        "Four artefacts, quoted verbatim from the DevCentral post-mortem (pliam, 11 Aug 2016): card #1 “HSHRZQHCCKD”, card #2 “DIZKKVWRMZNBHGVIB”, card #3 in pigpen glyphs, and the T-shirt “SF PS DS IY FR CS MB DM IN QN NP HR FV EI BX YG WF QW XC WY SM LK” (22 digrams, 44 characters)",
        "Stated design goal: “a puzzle which could be broken by hand with pencil and paper, but which would still resist sophisticated cryptographic techniques.” The adversary being designed against was a solver pasting ciphertext into a web form",
        "The two alphabetic layers: card #1 is ROT1 of “IT IS A RIDDLE”, card #2 is Atbash of “WRAPPED IN A MYSTERY”, card #3 is a pigpen variant of “INSIDE AN ENIGMA”. The F5 logo was itself the hint: under their ROT1, F encrypts to the fifth letter, E",
        "The master puzzle’s Playfair key was the concatenation of the three card solutions — “ITISARIDDLEWRAPPEDINAMYSTERYINSIDEANENIGMA”, 42 characters — giving the published key square ITSAR / DLEWP / NMYGB / CFHKO / QUVXZ. “Hackers don’t play fair. Why should you?” was the in-text hint",
        "Construction from the published generator: the third clause was Atbash-ed, clauses two and three were then ROT1-ed together, and the whole string went through Playfair. A solver therefore peels Playfair, then ROT1, then Atbash, and F5’s walk-through prints all three intermediates",
        "Answer: “THERE IS NOTHING MORE DECEPTIVE THAN AN OBVIOUS FACT” — an aphorism chosen for its fit to the puzzle, not attributed in the post-mortem",
        "A detail the generator comments on: the Caesar layer “can only be {1, 7, 9, 13, 18} if we want no j”, because a shift landing on J would collide with Playfair’s I/J merge and leak structure. The engineering is in the corners",
        "F5 says its own experiments showed online Playfair solvers are “very effective indeed and they do NOT need the key” — they exploit plaintext redundancy; a 44-character plaintext fell quickly to Playfair alone, which is exactly why the input and the output were both obfuscated. The solvers they name are a password-guessing tool (quinapalus.com) and a hill-climbing tool (bionsgadgets.appspot.com)",
        "The article frames the result with Shannon (1949): plaintext redundancy feeds directly into the unicity distance, so a classical cipher on long natural-language text is a puzzle and never a secret",
        "The series continued: F5 ran #F5CipherChallenge again at Black Hat 2019 and published a JSON model of the T-shirt’s data structure for solvers who preferred code to cardboard (DevCentral 291348, 7 Aug 2019)",
        "Verified in this repository: tools/verify_lecture_hall.mjs rebuilds the key square from the key phrase, re-encrypts the plaintext and reproduces the published T-shirt ciphertext digram-for-digram, then re-peels the three published intermediates. Nothing here is taken on trust — see js/lecture-ciphers.js",
    ],
    [
        ("F5 DevCentral — BlackHat 2016 F5 Cipher Challenge (post-mortem, generator source)", "https://community.f5.com/kb/technicalarticles/blackhat-2016-f5-cipher-challenge/275036"),
        ("F5 DevCentral — #F5CipherChallenge at Black Hat 2019", "https://community.f5.com/kb/technicalarticles/can-you-solve-the-f5cipherchallenge-at-black-hat-2019/291348"),
        ("Playfair cipher (the digraphic system used for the master layer)", "https://en.wikipedia.org/wiki/Playfair_cipher"),
        ("Quinapalus Playfair solver — the password-guessing tool F5 tested against", "http://www.quinapalus.com/playfair.html"),
        ("Bion’s Gadgets hill-climbing Playfair solver — the redundancy attack F5 tested against", "http://bionsgadgets.appspot.com/ww_forms/playfair_ph_web_worker3.html"),
    ],
    "One claim circulates in AI-written summaries of this contest — that the hardest layer fell to solvers who guessed F5 product terminology such as BIG-IP or ASM. The operator’s writeup says the opposite: the key was the three card solutions concatenated, and no F5 product name appears anywhere in it. The legend is corrected here; do not repeat it.",
)

R_HASH = record(
    "uscybercom-seal-md5",
    "The MD5 in the USCYBERCOM seal: a commitment, not a code",
    "emblem unveiled 2010 · string resolved 7 July 2010",
    "Fort Meade · the gold ring of the U.S. Cyber Command emblem · WIRED Danger Room",
    "Primary archive",
    "Thirty-two hexadecimal characters were engraved on the command’s own seal. Nothing was decoded: the string is an MD5 digest, and the public recovered it by guessing the plaintext and hashing it back. The guess checks out in one line, and this hall runs that line.",
    [
        "The string: 9ec4c12949a4f31474f299058ce2b22a — 32 hex characters set into the golden ring around the emblem, as transcribed by PCMag (9 Jul 2010) and AFCEA Signal (8 Jul 2010). Bruce Carleton, a blogger, may have been the first to notice it",
        "WIRED’s Danger Room made it a contest, offering the first solver a free T-shirt or a ticket to the International Spy Museum in Washington D.C.",
        "Who won is itself disputed: WIRED credits a Danger Room reader, jemelehill, after “a little more than three hours”; CRN credits Sean-Paul Correll of Panda Security, who said he cracked it around 10 a.m., an hour after WIRED published the string. Both accounts are preserved; the hall does not resolve primacy",
        "A hash is one-way, so this was never decryption: it was a known-plaintext guess — the command’s own published mission statement — verified by re-hashing. No key, no tool, no secret",
        "The preimage is pinned to the punctuation. Only this exact text hashes to the seal string: “USCYBERCOM plans, coordinates, integrates, synchronizes and conducts activities to: direct the operations and defense of specified Department of Defense information networks and; prepare to, and when directed, conduct full spectrum military cyberspace operations in order to enable actions in all domains, ensure US/Allied freedom of action in cyberspace and deny the same to our adversaries.” — “specified”, not “specific”; a semicolon before “prepare to”; and no trailing newline. Add a newline and the digest becomes 5a7a7c3fa0be751ed3350bb5184623ee",
        "Verified in this repository: tools/verify_lecture_hall.mjs recomputes the digest with node:crypto and asserts the near-miss variants fail. The reproduction, not the 2010 news story, is the evidence",
        "Transcription risk is not hypothetical: CRN renders the hash as 9ec4c1294a4f31474f299058ce2b22a — 31 characters, one short of a valid MD5. Copy an emblem out of an article and you can fail for a typographic reason rather than a cryptographic one",
        "Context on the algorithm, not the agency: when the emblem was designed, MD5’s collision resistance had been broken since Wang et al. (2004) and the CMU Software Engineering Institute had called it “cryptographically broken and unsuitable for further use” (Dec 2008). Preimage resistance — the only property this kind of seal relies on — was untouched. Fine for freezing a sentence; not fine for signing a certificate (2008 rogue-CA attack, 2012 Flame)",
        "What the seal actually buys is a public commitment: the wording is frozen in an image anyone can hash, and a later rewrite of the mission statement becomes detectable. The same trick as a Git object hash, worn as jewellery",
    ],
    [
        ("WIRED — Code Cracked! Cyber Command Logo Mystery Solved", "https://www.wired.com/2010/07/code-cracked-cyber-command-logos-mystery-solved/"),
        ("AFCEA Signal — UPDATE: Code in Cyber Command Logo Cracked (hash + shell one-liner reproduction)", "https://www.afcea.org/signal-media/update-code-cyber-command-logo-cracked"),
        ("PCMag — What’s the Secret Code in the U.S. Cyber Command’s Seal?", "https://uk.pcmag.com/opinion/111282/whats-the-secret-code-in-the-us-cyber-commands-seal"),
        ("CRN — Researcher Cracks Embedded Code In U.S. Cyber Command Seal", "https://www.crn.com/news/security/225702762/researcher-cracks-embedded-code-in-u-s-cyber-command-seal"),
        ("Phys.org — US Cyber Command logo contains coded message", "https://phys.org/news/2010-07-cyber-logo-coded-message.html"),
    ],
    "The Department of Defense never published the preimage, and the 32 characters reach us through photographs and press transcriptions rather than a certified datum. Treat the string as transcribed, and the match as reproduced — which is stronger than official, but only as good as the copy of the seal you started from.",
)

R_WHEEL = record(
    "fieldnotes-wheel",
    "The Field Notes cipher wheel (“Clandestine”, 2018) and Jurph’s model of it",
    "Fall 2018 · repository last touched 6 Dec 2020",
    "fieldnotesbrand.com · github.com/Jurph/cipherwheel (25 commits, 2 stars)",
    "Primary archive",
    "A stationery company shipped a two-rotor cipher wheel with its release literature and printed puzzles that needed it. One Python file implements the wheel, tests itself, and states plainly that you must not trust it — the design, the corpus and the limits are all public, and all three are reproducible in this hall.",
    [
        "Mechanism: a 36-character pool (A–Z then 0–9) split into two interleaved demi-alphabets. The first key letter rotates the whole wheel — a Caesar offset in radix 36 — and the second key letter shifts one demi-alphabet relative to the other, so successive second letters move by +1, +3, +5 …",
        "Consequence the author spells out and this repository verifies by enumeration: 36×36 = 1296 key pairs reach only 648 distinct alphabets (36×18). Half of all keys are duplicates of another key",
        "Two keys do nothing at all: at the model’s default hardware offsets [13, 13], the pairs XV and XW both generate the identity alphabet — “A” becomes “A”. A user who happens to set a null key believes a message is secret",
        "The author’s own threat model, quoted: it is “a monoalphabetic substitution cipher, which is a toy cipher. It encodes, rather than encrypts, your secrets … adequate for protecting television spoilers, riddles, and any other puzzle that can be solved by a high school student with fewer than ~4 hours of effort”, with a pointer to AES-256 for anything real",
        "Because the alphabet is static and monoalphabetic, keyless frequency analysis applies. The README links a substitution cracker in the same breath as the warning — documentation honest in a way commercial “crypto toys” rarely are",
        "The repository ships the release literature’s puzzle corpus (messages.txt). Exhaustively searching the 648 alphabets — done here, not copied from a solution page — the first line decrypts under the two-letter key FN: “IT’S NOT ENCRYPTED IN CODE TO DECIPHER IT LATER, IT’S ENCRYPTED IN CODE TO DECIPHER IT NOW”",
        "The corpus’s second line, under the same key, reads F6ELDNOTESBRAND.COM: the dial mixes digits and letters, so a 6 stands where I is expected. The corpus itself annotates that ambiguity as “f[6]eldnotes[V]rand.com”, and the bare line “fieldnotesbrand.com” closes the file",
        "Not recovered: the four short codes in the same file (m9uuty01h4qwksq.1op and three more). FN yields gibberish, and no key in the reachable set turns any of them into a domain-shaped string. Recorded as missing rather than filled in",
        "Upstream’s unit tests are reused here as a conformance gate for the JavaScript port in js/lecture-ciphers.js: the AA and FN alphabets, the XV/XW identity, “HELLO” → 7WBB6 under FN and “HELLO ABC 789” → “Q1UUB XKZ GVI” under A9. A port that fails one of those vectors is wrong, not the wheel",
        "A README claim, tested rather than believed: “Altering the rotors will invalidate some of the unit tests.” Because the first key letter cancels rotor 1 and the second cancels rotor 2, changing the hardware offsets only relabels keys — the reachable set stays 648 alphabets, with the nulls simply moving elsewhere on the dial",
    ],
    [
        ("Jurph/cipherwheel — README (mechanism, (in)security, 36×18 keyspace)", "https://github.com/Jurph/cipherwheel"),
        ("cipherwheel.py — the wheel and its self-tests", "https://github.com/Jurph/cipherwheel/blob/master/cipherwheel.py"),
        ("messages.txt — the Clandestine release puzzle corpus", "https://raw.githubusercontent.com/Jurph/cipherwheel/master/messages.txt"),
        ("Field Notes “Clandestine” (Fall 2018) — the release the wheel shipped with", "https://fieldnotesbrand.com/products/clandestine"),
        ("Simon Singh’s substitution cracker — the class of tool the README warns about", "https://www.simonsingh.net/The_Black_Chamber/substitutioncrackingtool.html"),
    ],
    "A stationery puzzle, kept because the code, the corpus and the honest threat model are all public. It is not COMSEC material: the wheel must never be used to protect anything with consequences. The 2018 plastic itself was not examined here — only the published model of it, and the ciphertexts the literature printed.",
)

R_AGENTS = record(
    "f1eldn0tes-agents",
    "Agents of F.I.E.L.D. — f1eldn0tes.com, the volunteer cipher bureau for a notebook ARG",
    "2018–2019 · 21 puzzles",
    "Tumblr (f1eldn0tes.com) · 21 brick-and-mortar shops, US plus London",
    "Community archive",
    "When a notebook company hid a puzzle in each of 21 releases, the solvers were a Tumblr blog. Its “What We Know” page prints, for every stage, the wheel ciphertext, the two-letter key and the answer — which makes the archive checkable rather than folkloric. Eight of the published codes re-derive exactly from the wheel modelled in the record beside this one.",
    [
        "Archive format: one entry per puzzle with a Code (wheel ciphertext in four-character groups), a quoted line from a film or series, a Key, a Solution (shop name plus ZIP) and an “Enumeration” number. Dry on purpose, and therefore testable",
        "The keys are puns on the Clandestine edition’s fictional supervisors: MB for Modesty Blaise (#14), NS for Nakia/Shuri (#13), 54 for “LIV”, Olivia Pope’s nickname (#17), BS for Sydney Bristow “reversed” (#15), H9 for HAL 9000 (#16), 06 for Number 6 of The Prisoner (#10), and VK then KS for Verbal Kint and Keyser Söze — a double decode (#9)",
        "Verified here: encoding the published answer under the published key reproduces the published Code exactly for #10, #12, #13, #14, #15, #16, #17 and #18 — key 54 yields G5XZ GHVG GCKU LWSL for OLD FOX BOOKS 21401 — and #9’s two-stage VK→KS decode is internally consistent. #11 differs only by the spiral reading the blog itself documents",
        "#16 has a second step before the wheel: “first shift each quartet by 2-0-0-1”. Apply positional offsets 2, 0, 0, 1 in the 36-character pool, then decode with H9, and the ciphertext gives TWO HANDS PAPERIE 80302. Decode without that sentence and you get RWO28ND5NAPRPIELY30F — a solver who skimmed the instructions fails in a way that looks like a wrong key",
        "A correction this archive owes the record: the blog prints the same Code for #19 and #20. That string decrypts under #20’s key IE as OVERLYGODLYESCAPADE02378, which is not #20’s published answer — so at least one of the two is a transcription collision, and #19’s own code cannot be reconstructed from the page. Flagged, not silently repaired",
        "The medium was physical: the notebooks were bought at named shops (Two Hands Paperie, Boulder; Son of a Sailor, Austin; Old Fox Books, Annapolis; Coffee Studio, Chicago; Daytrip Society, Kennebunkport; Peace Valley Dry Goods, Boise), and #20 required visiting 16 FedEx locations nationwide to collect a single printed sheet each",
        "#21 had no notebook at all — it was embedded in a Jackbox Twitch stream and keyed by “each of the previous 20 keys, in order, for each of the 20 letters in the code”. A polyalphabetic finish line is exactly the right place for a static wheel cipher to stop being trustworthy",
        "The endgame chained the 21 answers into 7 what3words coordinates over Little Free Libraries, indexed stickers against Clandestine’s “Practical Enumerations”, yielding IOBSERVEARCTURUSFREAKOUTGARRIGOUFIDELITYNITROGEN and a six-digit safe combination: 25-19-37",
        "Why it belongs beside +ORC and Fravia in this hall: the method is identical — treat an opaque system as an adversary, publish the derivation, invite strangers to attack it. The artefacts were paper and the prize was a three-pack of notebooks",
    ],
    [
        ("f1eldn0tes.com — Solutions (“What We Know”)", "https://f1eldn0tes.com/known"),
        ("f1eldn0tes.com — puzzle index", "https://f1eldn0tes.com/"),
        ("f1eldn0tes.com — intro page for new agents", "https://f1eldn0tes.com/intro"),
        ("Jurph/cipherwheel — the wheel model this hall re-derived the codes with", "https://github.com/Jurph/cipherwheel"),
        ("Field Notes “Clandestine” — the edition the puzzles shipped in", "https://fieldnotesbrand.com/products/clandestine"),
    ],
    "A community archive of a solved game, written by enthusiasts rather than historians, and demonstrably imperfect (see the #19/#20 code collision). It is the leetspeak Tumblr run by solvers, not the publisher: the brand’s own site is fieldnotesbrand.com. Both are cited so the provenance stays unblurred.",
)

# keep the bundle's single-line minified shape: no newlines inside the script body
NEW_RECORDS = ",".join([R_F5, R_HASH, R_WHEEL, R_AGENTS])

# ------------------------------------------------------------------- the edits

EDITS = [
    # 1. append the four records to the hall's data array Pc, after the Philby entry
    (
        'caution:"This is an intelligence-history record, not an endorsement of Philby’s espionage or the Stasi’s institutional narrative."}]',
        'caution:"This is an intelligence-history record, not an endorsement of Philby’s espionage or the Stasi’s institutional narrative."},'
        + ",".join(NEW_RECORDS.split("\n")) + "]",
    ),
    # 2. the filter row could not show "Community recollection"; the legend could not name "Community archive"
    (
        '["all","Primary archive","Archived directory","Community archive","Not recovered"].map(',
        '["all","Primary archive","Archived directory","Community archive","Community recollection","Not recovered"].map(',
    ),
    (
        '{label:"Community recollection",text:"A later recollection can guide research but should not be treated as established fact without corroboration."}',
        '{label:"Community archive",text:"Participants and enthusiasts preserve the material — pages, mirrors, solution logs. First-hand, partial and corrigible."},'
        '{label:"Community recollection",text:"A later recollection can guide research but should not be treated as established fact without corroboration."}',
    ),
    # 3. widen the hall's own scope line now that published puzzle engineering is in it
    (
        'children:"Preserved traces of underground computing, counterintelligence, search culture and institutional memory"',
        'children:"Preserved traces of underground computing, counterintelligence, search culture, published puzzle engineering and institutional memory"',
    ),
]


def main():
    src = open(APP, encoding="utf-8").read()
    original = src
    for i, (old, new) in enumerate(EDITS, 1):
        n = src.count(old)
        if n != 1:
            print(f"FAIL edit {i}: anchor found {n} times (need exactly 1)")
            sys.exit(1)
        src = src.replace(old, new, 1)
    open(APP, "w", encoding="utf-8").write(src)
    print(f"OK · bundle {len(original)} → {len(src)} bytes ({len(src) - len(original):+d})")


if __name__ == "__main__":
    main()
