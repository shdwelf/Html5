#!/usr/bin/env python3
"""Build a reflowable EPUB from the public-domain WEB JSON source.

The input is the `data/web` directory from the `kuris/bible` repository. The
builder intentionally reads only the English WEB files and ignores the other
translation present in that upstream repository.

Example:
  python3 tools/build_world_english_bible_epub.py \
    --source-dir /path/to/kuris-bible/data/web
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "assets/greeran/world-english-bible.epub"
UPSTREAM_COMMIT = "433550675f7a7680ebf7426902984d524d96b207"
FIXED_ZIP_TIME = (2026, 10, 16, 0, 0, 0)
EXPECTED_BOOKS = 66
EXPECTED_VERSES = 31_103

CSS = """html { font-family: Georgia, 'Times New Roman', serif; line-height: 1.58; }
body { max-width: 46rem; margin: 0 auto; padding: 1.2rem; }
h1, h2 { line-height: 1.2; }
h1 { text-align: center; margin: 2rem 0 1.5rem; }
h2 { margin-top: 2.2rem; break-after: avoid; }
p.scripture { text-align: justify; }
.verse { display: inline; }
.verse + .verse { margin-left: .15em; }
.verse-number { font-size: .72em; font-weight: bold; vertical-align: super; color: #5b4a20; }
.title-page { min-height: 75vh; display: flex; flex-direction: column; justify-content: center; text-align: center; }
.subtitle { font-variant: small-caps; letter-spacing: .08em; }
.note { border-left: .2rem solid #9a7b32; padding-left: 1rem; }
"""

CONTAINER_XML = """<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/package.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
"""


def xhtml_document(title: str, body: str) -> str:
    safe_title = html.escape(title)
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en">
<head>
  <meta charset="utf-8"/>
  <title>{safe_title}</title>
  <link rel="stylesheet" type="text/css" href="stylesheet.css"/>
</head>
<body>
{body}
</body>
</html>
'''


def make_zip_info(name: str, compression: int) -> zipfile.ZipInfo:
    info = zipfile.ZipInfo(name, FIXED_ZIP_TIME)
    info.compress_type = compression
    info.create_system = 3
    info.external_attr = 0o100644 << 16
    return info


def build_epub(source_dir: Path, output: Path) -> tuple[int, int, str]:
    source_dir = source_dir.resolve()
    metadata_path = source_dir.parent / "index.json"
    if not metadata_path.is_file():
        raise FileNotFoundError(f"Expected WEB JSON directory with sibling index.json: {source_dir}")
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    books_meta = sorted(metadata.get("books", []), key=lambda book: book["order"])

    if len(books_meta) != EXPECTED_BOOKS:
        raise ValueError(f"Expected {EXPECTED_BOOKS} book records, found {len(books_meta)}")

    books: list[dict] = []
    source_digest = hashlib.sha256()
    total_verses = 0
    for order, book_meta in enumerate(books_meta, start=1):
        code = book_meta["code"]
        source_file = source_dir / f"{code.lower()}.json"
        raw = source_file.read_bytes()
        source_digest.update(code.encode("ascii"))
        source_digest.update(b"\0")
        source_digest.update(raw)
        data = json.loads(raw)
        if data.get("version") != "web" or data.get("language") != "en":
            raise ValueError(f"Unexpected translation/language in {source_file.name}")
        if data.get("book") != code:
            raise ValueError(f"Book code mismatch in {source_file.name}")
        chapters = data.get("chapters")
        if not isinstance(chapters, list) or not chapters:
            raise ValueError(f"Missing chapters in {source_file.name}")
        verse_count = sum(len(chapter) for chapter in chapters)
        total_verses += verse_count
        books.append({
            "order": order,
            "code": code,
            "title": data["bookName"],
            "chapters": chapters,
            "verse_count": verse_count,
        })

    if total_verses != EXPECTED_VERSES:
        raise ValueError(f"Expected {EXPECTED_VERSES} WEB verses, found {total_verses}")

    source_hash = source_digest.hexdigest()
    identifier = f"urn:sha256:{source_hash}"
    item_manifest = [
        '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
        '<item id="css" href="stylesheet.css" media-type="text/css"/>',
        '<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>',
        '<item id="about" href="about.xhtml" media-type="application/xhtml+xml"/>',
    ]
    spine_items = ['<itemref idref="title"/>', '<itemref idref="about"/>']
    toc_items = [
        '<li><a href="title.xhtml">Title page</a></li>',
        '<li><a href="about.xhtml">About this edition</a></li>',
    ]
    payloads: dict[str, bytes] = {
        "META-INF/container.xml": CONTAINER_XML.encode("utf-8"),
        "OEBPS/stylesheet.css": CSS.encode("utf-8"),
    }

    for book in books:
        book_id = f"book-{book['order']:02d}"
        filename = f"{book_id}-{book['code'].lower()}.xhtml"
        safe_title = html.escape(book["title"])
        sections: list[str] = [f'<h1>{safe_title}</h1>']
        for chapter_no, verses in enumerate(book["chapters"], start=1):
            verse_markup = " ".join(
                f'<span class="verse" id="c{chapter_no}-v{verse_no}">'
                f'<span class="verse-number" aria-label="Verse {verse_no}">{verse_no}</span> '
                f'{html.escape(str(verse), quote=False)}</span>'
                for verse_no, verse in enumerate(verses, start=1)
            )
            sections.append(
                f'<section id="chapter-{chapter_no}" epub:type="chapter">'
                f'<h2>Chapter {chapter_no}</h2><p class="scripture">{verse_markup}</p></section>'
            )
        payloads[f"OEBPS/{filename}"] = xhtml_document(
            f"{book['title']} — World English Bible", "\n".join(sections)
        ).encode("utf-8")
        item_manifest.append(
            f'<item id="{book_id}" href="{filename}" media-type="application/xhtml+xml"/>'
        )
        spine_items.append(f'<itemref idref="{book_id}"/>')
        toc_items.append(f'<li><a href="{filename}">{safe_title}</a></li>')

    title_body = '''<main class="title-page" epub:type="titlepage">
  <p class="subtitle">The complete Bible in English</p>
  <h1>World English Bible</h1>
  <p>(WEB)</p>
  <p>Public-domain text · 66 books</p>
  <p>Prepared as an offline, reflowable EPUB for the Greeran Family Tree keepsake.</p>
</main>'''
    about_body = '''<main epub:type="frontmatter">
  <h1>About this edition</h1>
  <p class="note">This EPUB contains the unmodified text of the World English Bible (WEB), a public-domain translation. The conversion adds EPUB navigation, chapter structure, verse labels, and presentation markup; it does not rewrite or paraphrase the Bible text.</p>
  <p>The English source files were obtained from the <a href="https://github.com/kuris/bible/tree/433550675f7a7680ebf7426902984d524d96b207/data/web">WEB JSON collection</a>, which identifies eBible.org's <code>engwebp</code> edition as its source. Only the English WEB files were used.</p>
  <p>Official source: <a href="https://ebible.org/pdf/eng-web/eng-web_all.pdf">eBible.org World English Bible PDF</a>.</p>
  <p>“World English Bible” is a trademark of eBible.org. This edition preserves the translation text unchanged and uses the name only to identify that text.</p>
  <p>Contents: 66 books and 31,103 verses.</p>
</main>'''
    nav_body = '''<nav epub:type="toc" id="toc">
  <h1>Contents</h1>
  <ol>
''' + "\n".join(f"    {item}" for item in toc_items) + '''
  </ol>
</nav>'''
    payloads["OEBPS/title.xhtml"] = xhtml_document(
        "World English Bible (WEB)", title_body
    ).encode("utf-8")
    payloads["OEBPS/about.xhtml"] = xhtml_document(
        "About this edition", about_body
    ).encode("utf-8")
    payloads["OEBPS/nav.xhtml"] = xhtml_document(
        "Contents", nav_body
    ).encode("utf-8")

    manifest_xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id" xml:lang="en">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">{identifier}</dc:identifier>
    <dc:title>World English Bible (WEB)</dc:title>
    <dc:language>en</dc:language>
    <dc:creator>World English Bible Project</dc:creator>
    <dc:publisher>eBible.org</dc:publisher>
    <dc:description>The complete 66-book World English Bible in a reflowable offline EPUB.</dc:description>
    <dc:rights>Public-domain translation text; unmodified in this edition. “World English Bible” is a trademark of eBible.org.</dc:rights>
    <meta property="dcterms:modified">2026-10-16T00:00:00Z</meta>
    <meta property="rendition:layout">reflowable</meta>
    <meta property="rendition:orientation">auto</meta>
    <meta property="rendition:spread">auto</meta>
  </metadata>
  <manifest>
    {''.join(item_manifest)}
  </manifest>
  <spine>
    {''.join(spine_items)}
  </spine>
</package>
'''
    payloads["OEBPS/package.opf"] = manifest_xml.encode("utf-8")

    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w") as epub:
        epub.writestr(make_zip_info("mimetype", zipfile.ZIP_STORED), b"application/epub+zip")
        for name in ["META-INF/container.xml", "OEBPS/package.opf", "OEBPS/nav.xhtml", "OEBPS/stylesheet.css", "OEBPS/title.xhtml", "OEBPS/about.xhtml"]:
            epub.writestr(make_zip_info(name, zipfile.ZIP_DEFLATED), payloads[name], compresslevel=9)
        for book in books:
            book_id = f"book-{book['order']:02d}"
            filename = f"OEBPS/{book_id}-{book['code'].lower()}.xhtml"
            epub.writestr(make_zip_info(filename, zipfile.ZIP_DEFLATED), payloads[filename], compresslevel=9)

    return len(books), total_verses, source_hash


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source-dir",
        required=True,
        type=Path,
        help="Path to the upstream data/web directory (English WEB only)",
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--source-revision", default=UPSTREAM_COMMIT)
    args = parser.parse_args()

    books, verses, source_hash = build_epub(args.source_dir, args.output)
    file_hash = hashlib.sha256(args.output.read_bytes()).hexdigest()
    size = args.output.stat().st_size
    print(f"EPUB: {args.output} ({size:,} bytes)")
    print(f"  books: {books}; verses: {verses}")
    print(f"  upstream: https://github.com/kuris/bible/tree/{args.source_revision}/data/web")
    print(f"  source sha256: {source_hash}")
    print(f"  epub sha256: {file_hash}")


if __name__ == "__main__":
    main()
