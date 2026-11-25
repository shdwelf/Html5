# WordPress, TiddlyWiki and small-web research — 17 November 2026

## Scope and editorial boundary

The authorized destination is **ensogen.wordpress.com** and the publication
choice is **review drafts only**. This is a public-source research summary,
not a copy of the private repository wiki or a WordPress software-upgrade
receipt. Full draft bodies remain in WordPress; a status/link receipt stays in
the ignored local `google_drive/wordpress-review-2026-11-17/` workspace. That
directory name does not mean anything was uploaded to Drive. No private wiki, contact list,
manuscript, recovery material or cloud inventory was copied into WordPress.

The available WordPress connector supports content, not core/plugin/theme
maintenance, hosting entitlement, staging, backups, filesystem access or menu
and theme configuration. The earlier maintenance request is therefore **still
blocked on a maintenance-capable dashboard/connection**. Creating a post is not
a software update. Existing published About and Hello World content is retained.

The content-level UX deliverable is **five topic posts plus a linked project
index page**, all created with explicit `status: draft`. Each of the five
posts and the index was independently read back with draft status and closed
comments. The topic draft list returned five entries, and a post-write
published-content search for `HTML5` returned zero. The posts have
clear status labels, descriptive headings, short paragraphs, source links and
explicit limitations. Their full bodies remain in WordPress, not public Git.
This does not silently change live navigation, publish a homepage or install a
theme/plugin.

The public-offline corpus policy explicitly excludes this review note, the
Waves investigation, the deployment-capture note and their two source manifests
from the Wiki/SITE-K/ADL bundles. Sanitized repository research is not permission
to publish WordPress drafts or expand an offline public manual. The full draft
bodies and connector/account metadata are not part of those bundles or Git.

## TiddlyWiki on WordPress: practical choices

| Route | What it delivers | Saving and trust boundary | Recommendation |
| --- | --- | --- | --- |
| Curated WordPress pages/posts | Readable, searchable selected content in the existing theme | WordPress revisions; not TiddlyWiki round-trip synchronization | Start here with review drafts only |
| Link to a separately hosted reviewed TiddlyWiki | Full standalone wiki UI at its own approved destination | Choose and test its own saver/authentication/backup system | Optional future deployment; no destination approved here |
| Embed reviewed HTML with an iframe | Display an existing hosted wiki inside a post | Embedding is not a saver; verify plan, CSP/frame policies, authentication, mobile and keyboard behaviour | Prototype only with a tiny public fixture after entitlement is known |
| TiddlyWiki Node.js service | Tiddler-based editing/sync using a separate server | Requires authorized hosting, HTTPS, authentication, conflict handling and tested restore | Not something the content connector can provision |

The official [Node.js guide](https://tiddlywiki.com/static/TiddlyWiki%2520on%2520Node.js.html)
and [static-site guide](https://tiddlywiki.com/static/Generating%2520Static%2520Sites%2520with%2520TiddlyWiki.html)
support the separate-server/static-export distinction. Static exports are
read-only snapshots. The official [saving mechanism](https://tiddlywiki.com/static/SavingMechanism.html)
also distinguishes a new whole HTML file from per-tiddler server synchronization.
A browser download or local-storage cache is not proof of a remote save or backup.
The existing repository TiddlyWiki build does not grant blanket publication of
its source vault, binary attachments or private/operational material.

### Plugins and integration leads actually checked

- The [WordPress directory query](https://wordpress.org/plugins/search/tiddlywiki/)
  returned no matches in the inspected response. That is **not** proof no
  historical or third-party integration exists.
- [Advanced iFrame](https://wordpress.org/plugins/advanced-iframe/) is a generic
  embedding candidate, not a TiddlyWiki storage adapter. No installation,
  compatibility/security audit or test save was performed. A plugin cannot
  simply override another origin's frame policy or the same-origin policy.
- A [February 2024 TiddlyWiki discussion](https://talk.tiddlywiki.org/t/integrating-tw-into-a-wordpress-site/9167)
  discusses static files and iframes, not a supported WordPress save backend.
  Its same-domain suggestion is not a blanket security guarantee; sharing an
  origin also shares important trust boundaries with active wiki code.
- A genuine older lead, [TW5-Login-WP](https://gist.github.com/philwonski/cd6c8c53e71045d4a2f4a99451e9cfde),
  is an April 2021 **partial login widget**, not a complete WordPress plugin
  installation or tiddler persistence implementation. The inspected revision
  `12445b80c663c15481b2a0ff74f3986cc9a81fe4` stores response tokens in local
  storage/JavaScript cookies and manually constructs a credential POST body.
  It does not establish a safe/current authentication or saving integration.
  It was not executed, installed or given site credentials.

[WordPress.com's plugin guide](https://wordpress.com/support/plugins/) currently
lists plugin installation on paid plans. Its [Custom HTML guide](https://wordpress.com/support/wordpress-editor/blocks/custom-html-block/)
says restricted `iframe`, `script`, `style` and related tags additionally need
hosting features activated. The connected site's actual entitlement is
**unverified**; no purchase, upgrade or activation was made. Do not assume an
older Business-only rule, or assume that paying alone would complete a safe
integration.

Before any implementation: confirm the site's plan/access, choose an explicitly
approved public subset, test with a non-sensitive fixture, prove the exact save
and read-back/restore path, review embedded active code and origins, then obtain
publication approval. No unreviewed full wiki should be uploaded as a shortcut.

## Archive.org: WordPress For Dummies

Both inspected items are by **Lisa Sabin-Wilson / Wiley**:

- [2013 item](https://archive.org/details/wordpressfordumm0005sabi), ISBN
  **9781118383186**.
- [2015 seventh edition](https://archive.org/details/wordpressfordumm0000sabi),
  ISBN **9781119088578**, xi + 408 pages in the displayed metadata.

Both displayed restricted access/no suitable download. A site's generic
“download” or “borrow” wording does not remove an item's restrictions. No full
book was downloaded and no access control was bypassed. Use the item's legal
borrow/availability controls or a library. These are useful historical
introductions, not current WordPress.com entitlement, editor or security
instructions. The 2012 KansasFest “WordPress for Dummies” search lead is a
separate tutorial video, not the Wiley book.

## alt255.motd.org: what the archive actually establishes

Live HTTP/HTTPS fetches failed in this environment; that is not proof the site
is permanently offline. A [2019-08-24 root capture](https://web.archive.org/web/20190824181529/http://alt255.motd.org/)
identifies it as “A free motd.org wordpress site,” with short quotation posts,
an `admin` byline and Uncategorized categories. The January 2019 “Yes…” entry
contains an unresolved social-feed shortcode; there was no attempt to run it or
infer its missing third-party feed contents.

The [2020-12-04 RSS capture](https://web.archive.org/web/20201204085836/http://alt255.motd.org/?feed=rss2)
was inspected in full. It contains a last-build date of **1 December 2020**,
2020 William James / Mr. Han / George Bernard Shaw entries and full text for
several 2018 entries. Its WordPress 5.5.3 generator describes that historical
feed, **not** the present site's software version or security.

Two older captured pages broaden the subject beyond quotations:

- [The Raven page](https://web.archive.org/web/20180221195930/http://alt255.motd.org/?p=16),
  displayed date 11 September 2017, excerpts Poe; its title spells the surname
  “Pow” while the body says Poe.
- [Poe cryptogram solution](https://web.archive.org/web/20190301115035/http://alt255.motd.org/?p=23),
  displayed date 8 October 2017, includes ciphertext/plaintext and a substitution
  table, naming Udo Hebisch and 27.04.2011. This is a page attribution, not a
  verified transcription, newly broken cryptogram or identification of the
  blog owner.

The inspected [CDX query](https://web.archive.org/cdx/search/cdx?url=alt255.motd.org%2F*&output=json&filter=statuscode%3A200&collapse=urlkey&fl=timestamp%2Coriginal%2Cmimetype&limit=25)
is a **25-row limited URL index**, not the whole site or a recovery of each
post. Earlier attempts at individual posts 180/167 failed, but their text is
available in the root/feed; unrelated replacement quotes are unnecessary.

### Brief quotations, copied from alt255's archived content

> “The true way to soften one’s troubles is to solace those of others.”
>
> — attributed by alt255 to **Madame de Maintenon**, post dated 7 July 2018

> “Beware the fury of a patient man.”
>
> — attributed by alt255 to **John Dryden**, post dated 2 April 2018

> “Being still and doing nothing are two very different things”
>
> — attributed by alt255 to **Mr. Han**, post dated 8 November 2020

The first two are present in the root and RSS; the third is in the RSS. These
are **the site's attributions**, not independent authentication of original
authorship. No private administrator identity or owner account is inferred.

## The four named search services

| Requested site | Observed role/result | How to use the finding |
| --- | --- | --- |
| [baresearch.org](https://baresearch.org/) | SearXNG frontend; the exact-domain alt255 trial gave no useful results | Discovery lead, not evidence that the subject does not exist |
| [libresearch.space](https://libresearch.space/) | SearXNG frontend; noisy trial and malformed redirect links | Check original target URLs; malformed links were not followed |
| [utilibre.org](https://utilibre.org/en/) | Tools portal; its [search subdomain](https://search.utilibre.org/search?q=%22alt255.motd.org%22&categories=general) returned unrelated Chinese-language results in this trial | Distinguish portal from search; operator privacy/local-processing claims are not audited |
| [searx.space](https://searx.space/) | Instance directory, displaying 73 online instances in the inspected snapshot | A way to compare instances; availability/TLS/latency scores do not establish privacy, anonymity or answer accuracy |

This was one narrow public query, not a comparative benchmark or accusation of
malicious conduct. No search endpoint was added to the app. Private manuscripts,
wallet/recovery data, identifiers and credentials should not be submitted to
public metasearch instances. Results are leads; open and verify primary sources.

## Gopher servers and free shells

- **[SDF](https://sdf.org/?signup)**: credible free-shell/Gopher research lead.
  Its [membership FAQ](https://sdf.org/?faq?MEMBERS?01) displays 20 MB each for
  home/web/Gopher space and inbound SSH/SFTP after validation. It also explicitly
  lists **MOTD.ORG WordPress membership**. That documents a service-level
  connection in SDF's own material, **not** alt255's personal membership,
  administrator identity or a proven Gopher endpoint. The FAQ is undated/vintage;
  confirm current quotas, validation and acceptable-use terms before relying
  on it. Paid server privileges are not free-tier entitlements.
- **[tilde.club](https://tilde.club/wiki/faq.html)**: community shell/web lead;
  displayed 1 GB soft / 3 GB hard storage limits with a one-week grace period.
  Confirm admission, permitted services and current rules with the operators.
- **[tilde.team Gopher](https://tilde.team/wiki/gopher)**: documents
  `~/public_gopher`, `gophermap` and selectors. However its [terms](https://tilde.team/wiki/tos)
  expressly ban **cryptocurrency software and AI agents/models/services**, as
  well as proxies/VPN obfuscation and outgoing scans. It is **not a deployment
  recommendation for this crypto/agent workload**. Public text-only material
  still needs to comply with its content and acceptable-use rules.
- **[Gophernicus](https://github.com/gophernicus/gophernicus)**: a BSD-2-Clause
  server candidate for separately authorized hosting, not installed here.
  Four documentation/license files were checked both at development commit
  `a84026b5940ed1b3d012d6287630d9cb8daa59a7` and tag **3.1.1**, commit
  `0dc47480f140d2b72e751f64bdffea554b58adb9`. **Even the tagged README still
  says DEVEL**; the tag name is not a maintenance/security audit. Its documented
  `-nx` disables executable maps/scripts and `-nu` disables user spaces; start
  with static, separately curated content and least privilege rather than
  CGI/shell execution. No binary was built or daemon started.

[RFC 1436](https://www.rfc-editor.org/rfc/rfc1436) describes typed menus/selectors
and conventional TCP 70. Basic Gopher is not HTTPS, a secret store, PHP hosting
or an interactive TiddlyWiki save server. SSH/SFTP secures account access, not
the public Gopher transport. No free-shell account was registered or logged
into, no files were deployed, and no affiliation of alt255 with a particular
Gopher account was established.

## Evidence and remaining decisions

The [source manifest](research/wordpress-waves-small-web-sources-2026-11-17.json)
retains exact public URLs, archive capture times, three Waves tree checks and
fifteen immutable source-file SHA-256/size records, including the older local-use
README and both historical build recipes. Page extractions are observations,
not misrepresented as archived raw-byte hashes. The separate
[Waves implementation note](waves-paper-practice-2026-11-17.md) investigates the
clarified **save-page, rename `.hts`, serve locally** recollection. A synthetic
current-page serving control passed; the particular old saved page is still
unidentified, and a local frontend does not imply offline trading.

The [Android SSH comparison](android-ssh-apk-size-comparison-2026-11-17.md)
extends the shell-client research with size-sorted, version-pinned downloads,
separate exact/rounded evidence and maintenance, flavor, ABI and split-bundle
caveats. It does not create a shell account, install an APK or certify a device.

Open decisions are hosting/maintenance access, approved wiki subset/destination,
a proven save/restore design and any future public publication. Draft permission
does not authorize those actions. Existing backups and recipient choices are
unchanged.
