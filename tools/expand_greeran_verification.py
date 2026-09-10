#!/usr/bin/env python3
"""Apply the src-68 independent-verification session (31 August 2026).

Records an independent research session that acted on Chapter XII's open
task: free public primary/near-primary records were pulled to test the
contested seize-quartiers slots *independently* of the subject-supplied
files. This session complements "Session 11" (src-64..src-67, already in
main): Session 11 worked the Morin/Daisy slots via city directories and
negative Find A Grave results; this session independently confirms the
contested **Hewett and Carey quarters** against FamilySearch census/vitals,
the Find a Grave chain, and the official NSDAR patriot database, and
confirms the immediate family via a published obituary.

Adds:
  * resources/session-12-independent-verification.md  (already present)
  * a verification band in Chapter VII (after the Session-11 band)
  * source-register entry src-68 + a short companion note
  * an evidence-ladder rung
  * a "Status after the independent verification" note in Chapter XII

Deterministic, assert-guarded edits. Run from the repository root:

    python3 tools/expand_greeran_verification.py
"""
import io
import sys

BOOK = "greeran-book.html"


def sub(s, old, new, label):
    n = s.count(old)
    if n != 1:
        sys.exit("ANCHOR FAIL [%s]: found %d occurrences" % (label, n))
    return s.replace(old, new, 1)


def main():
    with io.open(BOOK, encoding="utf-8") as fh:
        s = fh.read()

    # ── 1. Chapter VII: add an independent-verification band right AFTER
    #        the Session-11 (legal-band) block and before the closing
    #        blockquote. Distinct band class/style (legal-band is Session
    #        11's) — reuse emergency-band for the verification block.
    anchor = (
        '        <blockquote>\n'
        '          Ten sessions, one day, free public records only — and the King hypothesis, held from the first session\n'
        '          to the last, turned out to be true all along.\n'
        '        </blockquote>\n'
    )
    band = (
        '        <div class="emergency-band">\n'
        '          <span>Independent verification — 31 August 2026: the contested quarters, tested</span>\n'
        '          <p>\n'
        '            A separate pass pulled free public records <em>independently</em> of both seize-quartiers files and\n'
        '            put the contested quarters to the test Chapter XII prescribes. The published obituary of\n'
        '            <b>Louise Francis Carey Hewitt</b> (b. 9 April 1923, Pasadena; d. 27 August 2005) names her husband of\n'
        '            sixty-six years, <b>Maurice Frederick Hewitt</b>, and her five children — including <b>Jean Belle\n'
        '            Greeran</b>; a guest-book entry signed by “<b>Jerry and Jeanie Glendora</b>” places <b>Steven</b>\n'
        '            with them. The immediate family no longer rests on the resume or the research file alone.\n'
        '          </p>\n'
        '          <p>\n'
        '            The <b>Hewett quarter is confirmed against the workbench\u2019s claim.</b> FamilySearch\u2019s census-and-vitals\n'
        '            record for <b>Clifford LeRoy Hewitt</b> (b. 21 July 1880, <b>San Francisco</b>) states his parents as\n'
        '            <b>Fred Leslie Hewett × Addie Inez Worth</b> and his wife (Maurice\u2019s mother) as <b>Leslie May\n'
        '            McFarland</b> — refuting the workbench\u2019s “William Hewitt × Sarah Jane Taylor,” and showing the\n'
        '            French-Canadian quarter does <b>not</b> enter through Maurice\u2019s parents.\n'
        '          </p>\n'
        '          <p>\n'
        '            The <b>Carey quarter and the patriot are independently confirmed.</b> Find a Grave links <b>PVT Francis\n'
        '            Gray Carey</b> (1897–1976, Forest Lawn Covina) to parents <b>Luther G. Carey × Millie Ruth Bickford</b>,\n'
        '            and Luther to parents <b>Joel Thornburg Carey × Elizabeth Stanley</b>; the Rootsweb Carey (PAF) database\n'
        '            carries the same Indiana Quaker generations — refuting the workbench\u2019s “George Daniel Carey” and\n'
        '            “William C. Carey Jr.” The <b>official NSDAR Ancestor Database</b> returns the patriot himself:\n'
        '            <b>Samuel Carey/Cary, Ancestor #A020262</b> — Pennsylvania private under Capt. Robert Gibson, Plumstead\n'
        '            Township, 1780; spouse Rachel Doane.\n'
        '          </p>\n'
        '          <p class="tiny">\n'
        '            Full research file with citations, the per-slot scoreboard, and the remaining open items: <a href="./resources/session-12-independent-verification.md">resources/session-12-independent-verification.md</a>.\n'
        '            Two slots stayed open — Daisy Beatrice\u2019s Texas parents (CA birth-index maiden-name field or her 1989\n'
        '            death certificate) and the Biddeford Morin/Houle couples (Maine parish/vital record); this pass adds no\n'
        '            French-Canadian evidence and points the verified line away from the Morins.\n'
        '          </p>\n'
        '        </div>\n'
        + anchor
    )
    s = sub(s, anchor, band, "chapter-vii-verification-band")

    # ── 2. Evidence ladder: add an independent-verification rung before
    #        the private-prompts rung.
    anchor = (
        '          <li><b>Private prompts:</b> additional memories can be drafted in the vault, but they should remain unpublished until verified or intentionally labeled personal recollection.</li>\n'
    )
    rung = (
        '          <li><b>Independent verification:</b> a 31 August 2026 pass re-checked the family-history slots against free public primary sources — the Louise Hewitt obituary and guest book, FamilySearch census/vitals, Find a Grave, the Rootsweb Carey database, and the official NSDAR database. The Hewett and Carey quarters, the Revolutionary patriot, and the immediate family are now independently confirmed; Daisy Beatrice\u2019s parents and the Morin/Houle couples remain open.<a class="cite" href="#src-68">68</a></li>\n'
        + anchor
    )
    s = sub(s, anchor, rung, "evidence-ladder-rung")

    # ── 3. Source register: add src-68 immediately after src-67.
    anchor = (
        '          <li id="src-67"><b>Ancestry</b> public community-tree aggregation for “Francois Morin” — candidate record: b. 29 Oct. 1883, Saint-Jude, Québec; d. Mar. 1963, Biddeford, York, Maine; father François Morin, mother Célanire Couture. <b>Unsourced community tree, cited as a lead only</b>; conflicts with src-45\'s ~1868 birth estimate by fifteen years. <a href="https://www.ancestry.com/genealogy/records/results?firstName=francois&amp;lastName=morin" rel="noopener" target="_blank">Record</a> · <a href="./resources/session-11-biddeford-and-daisy.md">Session 11 log</a></li>\n'
        '        </ol>\n'
    )
    entry = (
        '          <li id="src-67"><b>Ancestry</b> public community-tree aggregation for “Francois Morin” — candidate record: b. 29 Oct. 1883, Saint-Jude, Québec; d. Mar. 1963, Biddeford, York, Maine; father François Morin, mother Célanire Couture. <b>Unsourced community tree, cited as a lead only</b>; conflicts with src-45\'s ~1868 birth estimate by fifteen years. <a href="https://www.ancestry.com/genealogy/records/results?firstName=francois&amp;lastName=morin" rel="noopener" target="_blank">Record</a> · <a href="./resources/session-11-biddeford-and-daisy.md">Session 11 log</a></li>\n'
        '          <li id="src-68"><b>Independent verification session</b>, research performed for this book on 31 August 2026 — free public records pulled independently of the subject-supplied files: the San Gabriel Valley Tribune / Legacy obituary of Louise Francis Carey Hewitt (incl. the family-signed guest book), FamilySearch public person pages (U.S. census and California county birth/marriage/death records) for Clifford LeRoy Hewitt, Find a Grave memorials #94384623 / #181036078 / #7945411 with cited vital records, the Rootsweb Carey (PAF) database, and the official NSDAR Ancestor Database (patriot A020262). Independently confirms the Hewett quarter (Fred Leslie Hewett × Addie Inez Worth; Maurice\u2019s mother Leslie May McFarland), the Indiana Carey line and the Revolutionary patriot, and the immediate family; leaves Daisy Beatrice\u2019s Texas parents and the Morin/Houle couples open. <a href="./resources/session-12-independent-verification.md">Research file</a></li>\n'
        '        </ol>\n'
    )
    s = sub(s, anchor, entry, "source-register-src-68")

    # ── 4. Source-register companion note: extend the archivist-sources
    #        paragraph to cover src-68.
    anchor = (
        '          <a href="./resources/session-11-biddeford-and-daisy.md">resources/session-11-biddeford-and-daisy.md</a>\n'
        '          alongside the resource extracts. Entry 67 is an unsourced community tree and is cited as a lead only.\n'
        '        </p>\n'
    )
    note = (
        '          <a href="./resources/session-11-biddeford-and-daisy.md">resources/session-11-biddeford-and-daisy.md</a>\n'
        '          alongside the resource extracts. Entry 67 is an unsourced community tree and is cited as a lead only.\n'
        '        </p>\n'
        '        <p style="margin-top:1em;font-size:0.9em;">\n'
        '          <b>Entry 68</b> is a separate independent-verification pass, also run 31 August 2026: it tests the\n'
        '          <i>contested quarters</i> (Hewett, Carey) against primary public records rather than the Biddeford\n'
        '          directory leads Session 11 pursued. It confirms those quarters from FamilySearch census/vitals, the Find a\n'
        '          Grave parent chains, and the official NSDAR patriot database, and it independently places Steven in the\n'
        '          immediate family via a published obituary. Its open items agree with Session 11\u2019s: Daisy Beatrice\u2019s\n'
        '          parents and the Morin/Houle couples are still unproven. Working file:\n'
        '          <a href="./resources/session-12-independent-verification.md">resources/session-12-independent-verification.md</a>.\n'
        '        </p>\n'
    )
    s = sub(s, anchor, note, "source-register-note-68")

    # ── 5. Chapter XII: add a short "independent verification" status
    #        paragraph after the Session-11 status paragraph.
    anchor = (
        '          <b>Daisy Beatrice</b>\'s slots lost their cheapest route: Find A Grave has no memorial for her, and the\n'
        '          only near match is an Australian namesake.<a class="cite" href="#src-65">65</a>\n'
        '        </p>\n'
    )
    chxii = (
        '          <b>Daisy Beatrice</b>\'s slots lost their cheapest route: Find A Grave has no memorial for her, and the\n'
        '          only near match is an Australian namesake.<a class="cite" href="#src-65">65</a>\n'
        '        </p>\n'
        '        <p>\n'
        '          <b>Status after the independent verification (31 August 2026).</b> A second pass tested the quarters\n'
        '          themselves and <b>decided two of the disagreements</b> in favor of the research file: the Hewett quarter is\n'
        '          Fred Leslie Hewett × Addie Inez Worth (not the workbench\u2019s William Hewitt × Sarah Jane Taylor; Maurice\u2019s\n'
        '          mother is Leslie May McFarland), and the Carey quarter is Luther Gordon Carey × Millie Ruth Bickford and\n'
        '          Joel Thornburg Carey × Elizabeth Stanley (not George Daniel Carey or William C. Carey Jr.), with the\n'
        '          Revolutionary anchor confirmed in the official NSDAR database as Samuel Carey, #A020262.<a class="cite" href="#src-68">68</a>\n'
        '          That pass found <b>no</b> French-Canadian evidence and points the verified line away from the Morins, while\n'
        '          leaving Daisy\u2019s maiden name to the California birth-index / death-certificate records named in the queue\n'
        '          below.<a class="cite" href="#src-68">68</a>\n'
        '        </p>\n'
    )
    s = sub(s, anchor, chxii, "chapter-xii-status-68")

    with io.open(BOOK, "w", encoding="utf-8") as fh:
        fh.write(s)

    print("Applied src-68 independent-verification expansion to", BOOK)


if __name__ == "__main__":
    main()
