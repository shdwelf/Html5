# Repository-wiki third-party notices

New repository-workspace code follows the root Unlicense. This does **not** relicense
third-party applications, documents, images or binaries catalogued in the vault.
Review their individual notices before redistributing a whole repository snapshot.

## ACME / TJWS

The actual embedded HTTP container is `Acme.Serve.Serve` from
[drogatkin/TJWS2](https://github.com/drogatkin/TJWS2/tree/33920d0e429d3271796b3fd2d838cd0a47208846),
commit `33920d0e429d3271796b3fd2d838cd0a47208846`. ACME headers credit Jef
Poskanzer (1996, 1998), with enhancements by Dmitriy Rogatkin. The source carries
its two-condition BSD-style redistribution notice. The full header is included
as `META-INF/licenses/ACME-LICENSE.txt` in each executable JAR. Compiled dependency
sources are also included under `META-INF/sources/tjws/`.

The build compiles only ACME and the necessary servlet compatibility classes.
It does not register the stock file servlet, CGI servlet, JSP engine or WAR
loader. This small application is **not** a security certification of TJWS.

## Servlet API 2.3

Source comes from the Apache Tomcat 4.1.40 `servletapi` tree, via the
[pinned xcf007/tomcat4 mirror](https://github.com/xcf007/tomcat4/tree/dbed311153d1d97d7c92534d173c853130b08fb4/apache-tomcat-4.1.40-src/servletapi).
This is a **third-party mirror**, not an Apache-hosted release verification.
The selected archive is SHA-256 pinned in `deps.mjs`; source headers and the
upstream Apache License 2.0 file are preserved in the JAR. Only servlet sources,
not JSP sources or the mirror's binary JARs, are compiled. The exact selected
sources ship under `META-INF/sources/servlet/`.

## TiddlyWiki

[TiddlyWiki 5.4.1](https://github.com/TiddlyWiki/TiddlyWiki5), Jeremy Ruston and
contributors. BSD license, retained by the generated TiddlyWiki HTML. The npm
package version and integrity are locked in the root `package-lock.json`.
Its vanilla/snowwhite themes and browser-storage plugin are used unmodified.
The repository Webxdc startup module is new code, separately visible here.

## DjVu and historical wiki

The bundled djvu-rs 0.42.0 WASM decoder is MIT-licensed. Each copy retains its
`LICENSE`. The small DjVu fixture is Unlicense; its attribution is in
[`../wikiinajar/test/fixtures/ATTRIBUTION.md`](../wikiinajar/test/fixtures/ATTRIBUTION.md).
See [`../wikiinajar/THIRD_PARTY_NOTICES.md`](../wikiinajar/THIRD_PARTY_NOTICES.md)
for the historical GPL-2.0-or-later Wiki in a Jar 0.8 patch. These new JARs do
not link that historical JVM implementation; its source is catalogued as a
repository attachment with its original notices.

## MediaWiki schema

`schema/export-0.11.xsd` is copied unchanged from
[Wikimedia MediaWiki](https://github.com/wikimedia/mediawiki/blob/4f6bde3101f3a445f01418b143e043e976b77e40/docs/export-0.11.xsd).
MediaWiki is GPL-2.0-or-later; the schema's source comments are retained.
The companion `schema/xml.xsd` is the W3C XML namespace schema as mirrored in
MediaWiki `tests/phpunit/maintenance/xml.xsd` at the same commit; its original
annotations and attribution are retained. These are validation fixtures, not
a bundled MediaWiki runtime.
The adjacent `COPYING` preserves the upstream license.

The SHA-256 values for downloaded build dependencies are in `deps.mjs` and the
JAR's `dependencies.json`. Checksums establish identity, not safety or authorship.
