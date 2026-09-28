# Z39.50 server deep dive — 2026-09-28

## Outcome

The repository now includes `tools/z3950-terminal.php`, a PHP/YAZ-backed HTML5 terminal. It keeps Z39.50 on the server side, exposes an allow-listed target directory, provides TCP health checks, and uses a dice button to select a target at random.

A browser cannot open arbitrary TCP connections to port 210. The PHP endpoint is therefore an adapter rather than a browser implementation of ASN.1/BER. It requires PHP 8+, the PECL YAZ extension, and the YAZ toolkit.

## Targets investigated

| Target | Host / port | Database | Evidence | Workspace TCP check |
|---|---|---|---|---|
| Library of Congress | `lx2.loc.gov:210` | `LCDB` | [official LC configuration](https://www.loc.gov/z3950/lcserver.html) | OPEN |
| OCLC WorldCat | `zcat.oclc.org:210` | `OLUCWorldCat` | [OCLC configuration guide](https://help.oclc.org/Metadata_Services/Z3950_Cataloging/Get_started/Configuration_guide_for_OCLC_Z39.50_Cataloging) | OPEN |
| Deutsche Nationalbibliothek | `z3950.dnb.de:210` | `dnb` | [Koha server directory](https://kohasupport.com/knowledge-base/z3950-server-directory/) | OPEN |
| Bibliothèque nationale de France | `z3950.bnf.fr:2100` | `BNF-SECO` | [Koha server directory](https://kohasupport.com/knowledge-base/z3950-server-directory/) | OPEN |
| CSIC Library & Archive Network | `eu00.alma.exlibrisgroup.com:210` | `34CSIC_INST` | [CSIC official page](https://bibliotecas.csic.es/en/servidor-z3950) | OPEN |

The checks were TCP reachability checks from the development workspace on 2026-09-28. They are not proof that an unauthenticated Initialize, Search, or Present operation will succeed. OCLC documentation specifically indicates that authorization is needed for its cataloging service.

The Library of Congress testing page is useful for discovery, but much of its directory is old. Entries marked as old, stale, or lacking a current provider page should not be treated as production targets. The implementation intentionally starts with five documented targets rather than scraping arbitrary hosts.

## PHP/YAZ request path

1. The terminal selects a server from the allow-list.
2. `z_search()` constructs `host:port/database` for `yaz_connect()`.
3. The term is constrained to 160 characters and mapped to a small Bib-1 field set: title (`use=4`), author (`use=1`), or any (`use=1016`).
4. A quoted RPN query is queued with `yaz_search()`.
5. `yaz_wait()` completes the asynchronous request; `yaz_error()`, `yaz_errno()`, and `yaz_addinfo()` are checked.
6. A bounded Present range retrieves at most 20 records.
7. The response is JSON to the same HTML5 terminal; record values are escaped before rendering.

YAZ PHP reference: [PHP manual](https://www.php.net/manual/en/ref.yaz.php). `yaz_connect()` is non-blocking and the connection is actually progressed by `yaz_wait()`; this is why the adapter does not use a raw PHP socket as a substitute for the protocol.

## Deployment notes

- Install PECL YAZ plus the YAZ toolkit before running the PHP file.
- Run from the repository root with `php -S 127.0.0.1:8080 tools/z3950-terminal.php` for local testing.
- Put the adapter behind HTTPS and authentication for non-local use.
- Keep the target list allow-listed; never accept arbitrary hostnames from a public form.
- Do not log passwords or raw authenticated connection options.
- Rate-limit and cap result windows. Respect catalog policies and provider terms.
- Preserve target, database, query, syntax, timestamp, and diagnostics with each imported record.
- Treat `OPEN` as transport evidence only. The application still has to handle rejected associations, missing databases, unsupported syntax, diagnostics, and encoding differences such as MARC-8 versus UTF-8.

## Files

- `tools/z3950-terminal.php` — PHP/YAZ adapter and HTML5 terminal
- `apps/z3950-interface.html` — standalone browser/SRU interface and protocol explainer
