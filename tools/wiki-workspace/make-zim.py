#!/usr/bin/env python3
"""
Convert the repository wiki documentation corpus into a Kiwix ZIM archive.
Reads public/apps/wikiinajar/docs.json and compiles an offline,
self-contained ZIM file viewable in Kiwix / Kiwix-serve.
"""
import os
import sys
import json
import pathlib
import datetime
from libzim.writer import Creator, Item, StringProvider, Compression, Hint

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
DOCS_JSON = ROOT / "public" / "apps" / "wikiinajar" / "docs.json"
OUT_ZIM = ROOT / "dist" / "wiki" / "html5-repository.zim"

class SimpleItem(Item):
    def __init__(self, path, title, mime_type, content, is_front=False):
        super().__init__()
        self._path = path
        self._title = title
        self._mime = mime_type
        self._content = content if isinstance(content, bytes) else content.encode("utf-8")
        self._hints = {Hint.FRONT_ARTICLE: True} if is_front else {}

    def get_path(self):
        return self._path

    def get_title(self):
        return self._title

    def get_mimetype(self):
        return self._mime

    def get_contentprovider(self):
        return StringProvider(self._content.decode("utf-8", errors="replace"))

    def get_hints(self):
        return self._hints

    def should_compress(self):
        return True

def build_zim():
    if not DOCS_JSON.exists():
        print(f"Error: {DOCS_JSON} does not exist. Run build:wikiinajar first.")
        sys.exit(1)

    with open(DOCS_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    pages = data.get("pages", [])
    print(f"Loaded {len(pages)} pages from {DOCS_JSON}")

    OUT_ZIM.parent.mkdir(parents=True, exist_ok=True)
    if OUT_ZIM.exists():
        OUT_ZIM.unlink()

    creator = Creator(str(OUT_ZIM))
    creator.config_indexing(True, "eng")
    creator.set_mainpath("index.html")

    # Common HTML template
    def wrap_html(title, body_html):
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root {{ color-scheme: light dark; }}
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 24px; }}
    pre, code {{ font-family: ui-monospace, SFMono-Regular, Consolas, monospace; background: rgba(128,128,128,0.15); padding: 2px 5px; border-radius: 4px; }}
    pre {{ padding: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; }}
    table {{ border-collapse: collapse; width: 100%; margin: 16px 0; }}
    th, td {{ border: 1px solid rgba(128,128,128,0.3); padding: 8px 12px; text-align: left; }}
    th {{ background: rgba(128,128,128,0.1); }}
    hr {{ border: none; border-top: 1px solid rgba(128,128,128,0.3); margin: 24px 0; }}
    a {{ color: #0066cc; text-decoration: none; }}
    a:hover {{ text-decoration: underline; }}
    .nav {{ margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid rgba(128,128,128,0.3); font-size: 0.9em; }}
  </style>
</head>
<body>
  <div class="nav"><a href="index.html">← Wiki Index</a></div>
  <h1>{title}</h1>
  <div>{body_html}</div>
</body>
</html>"""

    # Build index page
    index_links = []
    for p in sorted(pages, key=lambda x: x["title"]):
        safe_path = p["source"].replace("/", "_").replace(".md", ".html")
        index_links.append(f'<li><a href="{safe_path}">{p["title"]}</a> <small>({p["source"]})</small></li>')

    index_html = wrap_html("Html5 Repository Wiki — Kiwix Edition", f"""
    <p>Offline Kiwix ZIM edition of the Html5 repository wiki ({len(pages)} articles).</p>
    <ul>
      {"".join(index_links)}
    </ul>
    """)

    with creator:
        # Metadata
        creator.add_metadata("Title", "Html5 Repository Wiki")
        creator.add_metadata("Description", "Html5 offline documentation, cryptography, and reverse-engineering research")
        creator.add_metadata("Creator", "shdwelf/Html5 contributors")
        creator.add_metadata("Publisher", "Kiwix")
        creator.add_metadata("Date", datetime.date.today().isoformat())
        creator.add_metadata("Language", "eng")
        creator.add_metadata("Name", "html5_en_all")

        # Add index
        creator.add_item(SimpleItem("index.html", "Html5 Repository Wiki", "text/html", index_html, is_front=True))

        # Add each page
        for p in pages:
            safe_path = p["source"].replace("/", "_").replace(".md", ".html")
            raw_body = p.get("body", "")
            escaped_body = raw_body.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            page_html = wrap_html(p["title"], f"<pre>{escaped_body}</pre>")
            creator.add_item(SimpleItem(safe_path, p["title"], "text/html", page_html))

    print(f"Successfully generated Kiwix ZIM: {OUT_ZIM} ({OUT_ZIM.stat().st_size:,} bytes)")

if __name__ == "__main__":
    build_zim()
