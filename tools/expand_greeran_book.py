#!/usr/bin/env python3
"""Apply the fifth-batch (src-54…src-63) additions to greeran-book.html.

Deterministic, assert-guarded edits so the book can be rebuilt safely if the
working copy is ever lost. Run from the repository root:

    python3 tools/expand_greeran_book.py
"""
import io
import os
import sys

BOOK = "greeran-book.html"


def sub(s, old, new, label):
    """Replace exactly one occurrence, asserting the anchor exists."""
    n = s.count(old)
    if n != 1:
        sys.exit("ANCHOR FAIL [%s]: found %d occurrences" % (label, n))
    return s.replace(old, new, 1)


def main():
    with io.open(BOOK, encoding="utf-8") as fh:
        s = fh.read()

    # ── 1. Book map: insert Chapter X, renumber the tail ──────────────────
    s = sub(
        s,
        '          <a href="#html5-workshop">IX. The HTML5 workshop</a>\n'
        '          <a href="#public-record">X. Official legal record</a>\n'
        '          <a href="#open-questions">XI. Gaps &amp; private prompts</a>\n'
        '          <a href="#book-sources">XII. Sources</a>',
        '          <a href="#html5-workshop">IX. The HTML5 workshop</a>\n'
        '          <a href="#enso-line">X. The ensō line</a>\n'
        '          <a href="#public-record">XI. Official legal record</a>\n'
        '          <a href="#open-questions">XII. Gaps &amp; private prompts</a>\n'
        '          <a href="#book-sources">XIII. Sources</a>',
        "book-map",
    )

    # ── 2. Evidence ladder: widen the self-published-works rung ───────────
    s = sub(
        s,
        '<li><b>Self-published works:</b> the standalone HTML5 tools of Chapter IX '
        'extend the technical record; each is citable as an artifact but remains '
        'author-attributed.<a class="cite" href="#src-12">12</a></li>',
        '<li><b>Self-published works:</b> the standalone HTML5 tools of Chapters IX and X '
        'extend the technical record — cryptography, genealogy, aviation, security training, '
        'software preservation, and a line of ensō-and-haiku generators; each is citable as an '
        'artifact but remains author-attributed.<a class="cite" href="#src-12">12</a>'
        '<a class="cite" href="#src-54">54</a></li>',
        "evidence-ladder",
    )

    # ── 3. Chapter IX: append the five new artifact families ──────────────
    ch9 = s.find('<h2>The HTML5 workshop')
    if ch9 < 0:
        sys.exit("ANCHOR FAIL: chapter IX heading not found")
    ul = s.find('<ul class="thread-list">', ch9)
    ul_end = s.find('</ul>', ul)
    if ul < 0 or ul_end < 0:
        sys.exit("ANCHOR FAIL: chapter IX thread-list not found")

    new_items = (
        '          <li><b>Procedural Ensō Generator:</b> a seed-driven brush circle with a '
        'random-terrain mode and PNG export; a second build adds an optional '
        '<b>custom seed</b> field, so any phrase can determine the stroke. Five artifacts of '
        'this batch carry the ensō motif from drawing to key — they are gathered in Chapter '
        'X.<a class="cite" href="#src-54">54</a><a class="cite" href="#src-55">55</a></li>\n'
        '          <li><b>Banano Scanned Wallets Report:</b> the output side of the paper-wallet '
        'generator — 100 generated wallets scanned against the MonKey accessory tables, returning '
        '<b>23 rare hits (23.0%)</b>, among them a Flamethrower (0.1% overall) and a Jester Hat '
        '(0.07% overall). The archive copy of this report reproduces the statistics but not the '
        '100 private seeds the original table prints.<a class="cite" href="#src-59">59</a></li>\n'
        '          <li><b>Purple Team Training Suite — SecOps Simulation Lab:</b> a '
        'defensive-training console built entirely from synthetic data: a red-vs-blue scoreboard '
        '(Red 1,260 / Blue 1,385; detections 7/7; MTTR 4.2 min), a MITRE ATT&amp;CK kill-chain '
        'navigator, simulated RF spectrum and BLE surveys, three synthetic PCAPs, and NIST CSF '
        '2.0-aligned blue-team playbooks. Every panel repeats the same disclaimer — no live '
        'capture, no offensive tooling, authorized lab use only.<a class="cite" href="#src-60">60</a></li>\n'
        '          <li><b>ADS-B Radar Scope:</b> a radar-scope view of live aircraft traffic drawn '
        'from public aggregators (OpenSky, ads.fi, airplanes.live, adsb.lol) with classic, '
        'military, ATC, retro, and stealth display modes, a 100 NM range ring, and full target '
        'records — ICAO24, squawk, baro/geo altitude, vertical rate. The adsb.lol feed is the same '
        'source this repository\'s GODSEYE globe uses for its aircraft layer: the flat panel to '
        'that sphere.<a class="cite" href="#src-61">61</a></li>\n'
        '          <li><b>Rodger Ramrod — HTML5 App:</b> a preservation wrapper rather than a '
        'game: a single-file page that loads the eXoDOS package for a 1996 MS-DOS title from the '
        'Internet Archive into a browser DOSBox runtime, extracts it locally, and boots the '
        'original <span class="k">RRR.BAT</span>. The page prints the package manifest '
        '(RRR.DAT 22.2 MB, MAIN.EXE 642 KB) and states that it "does not alter the DOS binaries." '
        'A second build adds a quine download and a "What is a Quine?" explainer.<a class="cite" '
        'href="#src-62">62</a><a class="cite" href="#src-63">63</a></li>\n'
    )
    s = s[:ul_end] + new_items + "        " + s[ul_end:]

    # ── 4. Chapter IX: five new mini-cards ────────────────────────────────
    s = sub(
        s,
        '<div class="mini-card"><span>Unified Suite</span><small>Curated open-source shelf — '
        'Ensō, GCWizard, SSTV, TiddlyWiki — plus github.com/sgreeran.</small></div>\n'
        '        </div>\n'
        '      </section>',
        '<div class="mini-card"><span>Unified Suite</span><small>Curated open-source shelf — '
        'Ensō, GCWizard, SSTV, TiddlyWiki — plus github.com/sgreeran.</small></div>\n'
        '          <div class="mini-card"><span>Ensō Line</span><small>Five builds: circle → seed '
        '→ haiku → key. See Chapter X.<a class="cite" href="#src-54">54</a></small></div>\n'
        '          <div class="mini-card"><span>Banano Scan Report</span><small>100 wallets '
        'scanned, 23 rare (23.0%). Seeds redacted in the archive.<a class="cite" '
        'href="#src-59">59</a></small></div>\n'
        '          <div class="mini-card"><span>Purple Team Lab</span><small>Synthetic SecOps '
        'range — ATT&amp;CK navigator, sim RF/PCAP, NIST playbooks.<a class="cite" '
        'href="#src-60">60</a></small></div>\n'
        '          <div class="mini-card"><span>ADS-B Scope</span><small>Live traffic on a radar; '
        'shares the GODSEYE feed.<a class="cite" href="#src-61">61</a></small></div>\n'
        '          <div class="mini-card"><span>Rodger Ramrod</span><small>eXoDOS → browser '
        'DOSBox, unmodified binaries. Quine build.<a class="cite" '
        'href="#src-62">62</a></small></div>\n'
        '        </div>\n'
        '      </section>',
        "chapter-ix-cards",
    )

    # ── 5. Insert Chapter X ahead of the official-record chapter ──────────
    chapter_x = u'''      <section class="page" id="enso-line">
        <div class="chapter-no">X</div>
        <div class="page-kicker">Self-published works · a motif and what it became</div>
        <h2>The ensō line: a brushstroke that became a key</h2>
        <p class="label-row" style="margin:0 0 8px;color:var(--accent-2);">◆ Self-published works — author-attributed. The artifacts are citable; the reading of them below is editorial, not a sourced claim about the subject's beliefs.</p>
        <p>
          Five artifacts supplied with the fifth resource batch share one figure. The <b>ensō</b> — the
          circle brushed in a single stroke in Zen calligraphy, traditionally left open, the gap part of
          the form rather than a flaw in it — appears first as a drawing and ends as a
          key.<a class="cite" href="#src-54">54</a><a class="cite" href="#src-55">55</a><a class="cite" href="#src-56">56</a><a class="cite" href="#src-57">57</a><a class="cite" href="#src-58">58</a>
        </p>
        <p>
          The progression is visible build by build. The first generator draws a circle from a
          <b>seed ID</b> and exports it as a PNG; a "random terrain" control sets the same stroke against
          a generated landscape.<a class="cite" href="#src-54">54</a> The second build adds one field —
          <b>custom seed (optional)</b> — and with it the ensō stops being only an image: any phrase can
          now determine the circle.<a class="cite" href="#src-55">55</a> That is the hinge of the whole
          line.
        </p>
        <p>
          The next three builds walk through the opened door. <b>BIP-39 Haiku Wallet &amp; Ensō Forge</b>
          mines for a seed phrase that is simultaneously a checksum-valid BIP-39 mnemonic and a
          metrically exact 5-7-5 haiku, and draws the ensō from the same parameters — "mining ensures
          exact 5-7-5 syllables with a valid BIP39 SHA-256 checksum."<a class="cite" href="#src-56">56</a>
          <b>Ensō Haiku Wallet Forge</b> instruments every variable — haiku, mnemonic, BIP-44 path, xpub,
          P2PKH address, SHA-256 wallet fingerprint, ensō parameters — and collapses the whole set into
          a single printable <b>Ensō Reference Number, base-62 encoded</b>: "unique seed encoding all
          parameters." The circle becomes the record.<a class="cite" href="#src-57">57</a> The last build
          makes the line offline: rather than fetching the wordlist, the user pastes the official 2048
          words once and they are "permanently committed to your browser's local sandbox storage so that
          all cryptographic operations can run fully offline," behind an AES-256-GCM vault and a batch
          miner with a grammar filter that "automatically skips awkward poetic line
          breaks."<a class="cite" href="#src-58">58</a>
        </p>
        <div class="margin-grid">
          <div class="mini-card"><span>src-54 · Ensō Generator</span><small>Seed ID → circle. Random terrain. PNG export.<a class="cite" href="#src-54">54</a></small></div>
          <div class="mini-card"><span>src-55 · Custom-seed build</span><small>Any phrase can drive the stroke — the hinge of the line.<a class="cite" href="#src-55">55</a></small></div>
          <div class="mini-card"><span>src-56 · Haiku &amp; Ensō Forge</span><small>5-7-5 haiku that is also a valid BIP-39 phrase; AES-256 local storage.<a class="cite" href="#src-56">56</a></small></div>
          <div class="mini-card"><span>src-57 · Ensō Haiku Wallet Forge</span><small>Base-62 Ensō Reference Number encodes every parameter.<a class="cite" href="#src-57">57</a></small></div>
          <div class="mini-card"><span>src-58 · Poetic Wallet Suite</span><small>Offline wordlist, AES-256-GCM vault, batch mine, grammar filter.<a class="cite" href="#src-58">58</a></small></div>
        </div>
        <p>
          Two readings are available and the record does not settle between them. The first is
          mechanical: a workshop that needed a deterministic, offline, human-memorable seed found that
          poetry — five, seven, five syllables — makes a better mnemonic than twelve arbitrary words,
          and that a brush circle makes a better fingerprint than a hex string. The second is
          temperamental, and it has a thread back through this book: Chapter VI records volunteer
          entries at meditation centers — <b>Dhammakaya</b>, <b>Sunnataram</b> — and the same subject who
          put that practice on a resume later spent five builds on the signature figure of Zen
          calligraphy.<a class="cite" href="#src-9">9</a><a class="cite" href="#src-54">54</a> This
          edition states the first as artifact and the second as interpretation; it does not claim the
          tools were made as practice, because nothing published says so. The motif's persistence across
          five independent builds is the only evidence offered here.
        </p>
        <p>
          The same figure runs through the workshop's other output: the repository this book ships in
          carries an art studio whose own build name is <b>Ensō Forge</b>, and the Unified Utility Suite
          catalogues an Ensō generator alongside the open-source tools it
          curates.<a class="cite" href="#src-46">46</a> Like everything in Chapters IX and X, these are
          artifacts, not endorsements: the cryptographic properties are as-implemented and unaudited,
          and the tools say so themselves — "for educational/demonstration purposes. Do not use for
          storing real funds without independent verification."<a class="cite" href="#src-57">57</a>
        </p>
        <blockquote>
          The stroke that is not closed is still the stroke. In this workshop the circle with a gap in
          it became the thing that closes a key.
        </blockquote>
      </section>

'''
    s = sub(
        s,
        '      <section class="page" id="public-record">\n'
        '        <div class="chapter-no">X</div>',
        chapter_x + '      <section class="page" id="public-record">\n'
        '        <div class="chapter-no">XI</div>',
        "insert-chapter-x",
    )

    # ── 6. Renumber the remaining chapters ────────────────────────────────
    s = sub(
        s,
        '      <section class="page" id="open-questions">\n'
        '        <div class="chapter-no">XI</div>',
        '      <section class="page" id="open-questions">\n'
        '        <div class="chapter-no">XII</div>',
        "renumber-open-questions",
    )
    s = sub(
        s,
        '      <section class="page sources-page" id="book-sources">\n'
        '        <div class="chapter-no">XII</div>',
        '      <section class="page sources-page" id="book-sources">\n'
        '        <div class="chapter-no">XIII</div>',
        "renumber-sources",
    )

    # ── 7. Cross-reference fix (gaps chapter moved XI → XII) ──────────────
    s = sub(
        s,
        "and the disagreement itself is filed as an open\n            research task in Chapter XI.",
        "and the disagreement itself is filed as an open\n            research task in Chapter XII.",
        "chapter-xi-crossref",
    )

    # ── 8. Source register: append src-54 … src-63 ────────────────────────
    sources = [
        (54, "Procedural Ensō Generator", "self-published standalone HTML5 tool; seed-ID brush "
             "circle with random-terrain mode and PNG export.", "x1ymbo",
             "src-54-enso-generator.md"),
        (55, "Procedural Ensō Generator (custom-seed build)", "self-published standalone HTML5 "
             "tool; adds an optional custom-seed field so any phrase can determine the stroke.",
             "ynkc9c", "src-55-enso-generator-custom-seed.md"),
        (56, "BIP-39 Haiku Wallet &amp; Ensō Forge", "self-published standalone HTML5 tool; mines "
             "5-7-5 haiku that are also checksum-valid BIP-39 phrases and draws the ensō from the "
             "same parameters, with AES-256 encrypted local storage behind a master password.",
             "lcagd1", "src-56-bip39-haiku-enso-forge.md"),
        (57, "Ensō Haiku Wallet Forge", "self-published standalone HTML5 tool; full parameter "
             "readout (haiku, mnemonic, BIP-44 path, xpub, P2PKH address, SHA-256 fingerprint) "
             "collapsed into a base-62 Ensō Reference Number, with spell-check and skip-haiku "
             "controls.", "lahh89", "src-57-enso-haiku-wallet-forge.md"),
        (58, "BIP-39 Haiku Wallet Engine — Poetic Wallet Suite", "self-published standalone HTML5 "
             "tool; user-supplied 2048-word list committed to browser storage so operations run "
             "offline, AES-256-GCM vault, batch mining, grammar filter.", "7zv3d1",
             "src-58-bip39-haiku-wallet-engine.md"),
        (59, "Banano Scanned Wallets Report", "self-published HTML5 scan output; 100 generated "
             "paper wallets scanned for rare MonKey accessories — 23 rare found (23.0% hit rate). "
             "<b>The 100 private seeds printed in the original are deliberately omitted from the "
             "local extract.</b>", "6r478t", "src-59-banano-scanned-wallets-report.md"),
        (60, "Purple Team Training Suite — SecOps Simulation Lab", "self-published standalone "
             "HTML5 tool (v4.2, build ptl-sim-4.2.1); defensive-training console built from "
             "synthetic data — MITRE ATT&amp;CK navigator, simulated RF/PCAP, NIST CSF 2.0 "
             "playbooks; no live capture and no offensive tooling included.", "tmkcep",
             "src-60-purple-team-training-suite.md"),
        (61, "ADS-B Radar Scope", "self-published standalone HTML5 tool; live aircraft traffic on "
             "a radar scope from public aggregators (OpenSky, ads.fi, airplanes.live, adsb.lol) "
             "with five display modes and full target records.", "fexily",
             "src-61-adsb-radar-scope.md"),
        (62, "Rodger Ramrod — HTML5 App", "self-published standalone HTML5 preservation wrapper; "
             "loads the eXoDOS package for a 1996 MS-DOS title from the Internet Archive into a "
             "browser DOSBox runtime and boots the original launcher unmodified.", "2tv852",
             "src-62-rodger-ramrod-html5-app.md"),
        (63, "Rodger Ramrod — HTML5 App (quine build)", "self-published standalone HTML5 "
             "preservation wrapper; second build adding a quine download and a \"What is a "
             "Quine?\" explainer.", "u891yp", "src-63-rodger-ramrod-quine-build.md"),
    ]

    rows = ""
    for num, title, desc, uid, fname in sources:
        rows += (
            '          <li id="src-%d"><b>%s</b>, %s '
            '<a href="https://bashupload.app/%s.htm" rel="noopener" target="_blank">%s</a> · '
            '<a href="./resources/%s">Local extract</a></li>\n'
            % (num, title, desc, uid,
               "Tool" if num not in (59, 62, 63) else ("Report" if num == 59 else "App"),
               fname)
        )

    anchor = ('<li id="src-53"><b>Unidentified resource</b> (bashupload.app/5h8cmz.htm), supplied '
              'with the fourth resource batch; the host returned a server error (HTTP 500) on every '
              'access attempt, so its contents could not be reviewed or cited. '
              '<a href="https://bashupload.app/5h8cmz.htm" rel="noopener" target="_blank">'
              'Unavailable link</a></li>\n')
    s = sub(s, anchor, anchor + rows, "source-register")

    # ── 9. Closing note: widen the range and note the redaction ───────────
    s = sub(
        s,
        "Sources 10–53 are hosted on a temporary file-sharing service and may expire",
        "Sources 10–63 are hosted on a temporary file-sharing service and may expire",
        "closing-note-range",
    )
    s = sub(
        s,
        "directory. Entries 12–33, 36–42, and 44–52 are author-attributed works",
        "directory. Entries 12–33, 36–42, 44–52, and 54–63 are author-attributed works",
        "closing-note-attribution",
    )
    s = sub(
        s,
        "all are cited as artifacts, not as third-party verification.\n        </p>",
        "all are cited as artifacts, not as third-party verification. Entry 59's extract omits the "
        "100 private seeds printed in the original table: the statistics the book cites are "
        "preserved, the keys are not.\n        </p>",
        "closing-note-redaction",
    )

    with io.open(BOOK, "w", encoding="utf-8") as fh:
        fh.write(s)

    print("OK — %s is now %d bytes" % (BOOK, os.path.getsize(BOOK)))


if __name__ == "__main__":
    main()
