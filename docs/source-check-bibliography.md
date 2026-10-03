# Source-check bibliography

> **Citation policy.** This is the normalized bibliography for the repository's source-check notes. It preserves the source hierarchy already stated in those notes: primary records, first-party pages, reporting, community reconstructions, and discovery-only material are **not** treated as interchangeable evidence.

## Scope and use

This index covers the following source-check documents:

- [`docs/source-check-2026-09-28.md`](source-check-2026-09-28.md)
- [`docs/source-check-2026-09-29.md`](source-check-2026-09-29.md)
- [`docs/source-check-2026-09-29-vincennes.md`](source-check-2026-09-29-vincennes.md)
- [`docs/los-alamos-source-check-2026-09-30.md`](los-alamos-source-check-2026-09-30.md)
- [`docs/for-dummies-source-check.md`](for-dummies-source-check.md)
- [`docs/spectre-press-source-check.md`](spectre-press-source-check.md)
- [`research/jim-sanborn-source-check.md`](../research/jim-sanborn-source-check.md)
- [`public/apps/sanborn-restaurant-4dwm/research-source-check.md`](../public/apps/sanborn-restaurant-4dwm/research-source-check.md)
- [`docs/convention-venues.md`](convention-venues.md)
- [`docs/cyberchef-matrix-deep-dive.md`](cyberchef-matrix-deep-dive.md)
- [`docs/dss-casefiles-riddle-warrick.md`](dss-casefiles-riddle-warrick.md)
- [`docs/lecture-hall-research-2026-09-20.md`](lecture-hall-research-2026-09-20.md)
- [`docs/lecture-hall-research-2026-09-27.md`](lecture-hall-research-2026-09-27.md)
- [`docs/los-alamos-domain-deep-dive-2026-09-30.md`](los-alamos-domain-deep-dive-2026-09-30.md)

Entries use a compact Chicago-style web-reference form: author or responsible
organization; title; publisher or collection where useful; publication date where
the source supplies one; stable locator; and an access date. `n.d.` means that a
publication date was not displayed in the source record. The two Sanborn notes have
substantially identical source lists, so their shared references appear once here.

The bibliography has two safeguards:

1. Every distinct literal `http://` or `https://` source URL in the fourteen notes is
   represented below at least once. The current corpus contains **118 unique literal
   URLs**.
2. Sources that a note names only as a database, a source family, or an unlocatable
   record are retained in [Incomplete or family-level references](#incomplete-or-family-level-references)
   rather than silently supplied with a guessed citation.

Run `node tools/check-source-check-bibliography.mjs` after editing a source-check
note or this bibliography. It fails if a literal URL is not represented here or if
the declared source-check corpus changes.

**Citation audit date:** 3 October 2026. This is an index of sources used by the
repository; it is not a fresh fact-check and does not upgrade the authority or
publication status of any item.

## Cryptography curriculum and archive provenance

- **[CR-01]** Los Alamos National Laboratory. “Information Science and Technology Discoveries.” n.d. https://www.lanl.gov/engage/discoveries/information-science-and-technology-discoveries (accessed 3 October 2026).
- **[CR-02]** Cornell Chronicle. “Online Physics Archive Moving from Los Alamos to Cornell.” 17 July 2001. https://news.cornell.edu/stories/2001/07/online-physics-archive-moving-los-alamos-cornell (accessed 3 October 2026).
- **[CR-03]** arXiv. “Cryptography and Security (cs.CR).” Category archive. n.d. https://arxiv.org/archive/cs.CR (accessed 3 October 2026).
- **[CR-04]** Debris-Alazard, Thomas. “Code-based Cryptography: Lecture Notes.” *arXiv*, 2304.03541, 7 April 2023. https://arxiv.org/abs/2304.03541 (accessed 3 October 2026).
- **[CR-05]** De Feo, Luca. “Mathematics of Isogeny Based Cryptography.” *arXiv*, 1711.04062, 11 November 2017. https://arxiv.org/abs/1711.04062 (accessed 3 October 2026).
- **[CR-06]** Weger, Violetta, Niklas Gassner, and Joachim Rosenthal. “A Survey on Code-Based Cryptography.” *arXiv*, 2201.07119, version 5, 17 July 2024. https://arxiv.org/abs/2201.07119 (accessed 3 October 2026).
- **[CR-07]** Lyubashevsky, Vadim. “Basic Lattice Cryptography: The Concepts Behind Kyber (ML-KEM) and Dilithium (ML-DSA).” *IACR Cryptology ePrint Archive*, Paper 2024/1287, 2024. https://eprint.iacr.org/2024/1287 (accessed 3 October 2026).
- **[CR-08]** Menezes, Alfred. “A Gentle Introduction to Lattice-Based Cryptography.” *IACR Cryptology ePrint Archive*, Paper 2026/1098, 2026. https://eprint.iacr.org/2026/1098 (accessed 3 October 2026).
- **[CR-09]** International Association for Cryptologic Research. “IACR Cryptology Schools.” n.d. https://www.iacr.org/schools/ (accessed 3 October 2026).
- **[CR-10]** International Association for Cryptologic Research. “CRYPTO 2025 Program.” 2025. https://crypto.iacr.org/2025/program.php (accessed 3 October 2026).
- **[CR-11]** Tal Rabin. “Readings, W4261 Introduction to Cryptography.” Columbia University, 2019. https://www.cs.columbia.edu/~tal/4261/F19/readings.html (accessed 3 October 2026).
- **[CR-12]** Ball, Marshall. “Introduction to Cryptography, Fall 2025, CSCI-GA 3210.” New York University, 2025. https://cs.nyu.edu/~mmb586/courses/Fall25-GradCrypto/index.html (accessed 3 October 2026).
- **[CR-13]** Goyal, Vipul. “15-356/15-856: Introduction to Cryptography.” Carnegie Mellon University, n.d. https://www.cs.cmu.edu/~goyal/15356/ (accessed 3 October 2026).
- **[CR-14]** Boneh, Dan, and Victor Shoup. *A Graduate Course in Applied Cryptography*, version 0.6. January 2023. https://toc.cryptobook.us/ (accessed 3 October 2026).
- **[CR-15]** Menezes, Alfred J., Paul C. van Oorschot, and Scott A. Vanstone. *Handbook of Applied Cryptography*. CRC Press, 1996; author-hosted edition. https://cacr.uwaterloo.ca/hac/ (accessed 3 October 2026).
- **[CR-16]** International Association for Cryptologic Research. “Book Reviews.” n.d. https://iacr.org/books/ (accessed 3 October 2026).

## Kryptos / K4 recovery and reconstruction

- **[K4-01]** Scientific American. “A Solution to the CIA’s Kryptos Code Is Found After 35 Years.” 2025. https://www.scientificamerican.com/article/a-solution-to-the-cias-kryptos-code-is-found-after-35-years/ (accessed 3 October 2026).
- **[K4-02]** *Wired*. “Crypto Guys Bought the Answer to the CIA’s Mysterious Kryptos Sculpture.” 2025. https://www.wired.com/story/crypto-guys-bought-the-answer-to-the-cias-mysterious-kryptos-sculpture/ (accessed 3 October 2026).
- **[K4-03]** Cipher Museum. “Kryptos.” n.d. https://ciphermuseum.com/ciphers/kryptos.html (accessed 3 October 2026).
- **[K4-04]** Verawren. “The Answer That Isn’t a Solution.” *Substack*, 2025. https://verawren.substack.com/p/the-answer-that-isnt-a-solution (accessed 3 October 2026).
- **[K4-05]** RR Auction. “Jim Sanborn’s Complete Kryptos Archive Sells for $962,500 at Auction.” 2025. https://content.rrauction.com/jim-sanborns-complete-kryptos-archive-sells-for-962500-at-auction/ (accessed 3 October 2026).
- **[K4-06]** Washington Post. “Kryptos Auction Sale Sanborn CIA.” 21 November 2025. https://www.washingtonpost.com/entertainment/2025/11/21/kryptos-auction-sale-sanborn-cia/ (accessed 3 October 2026).
- **[K4-07]** Paradigm. “Kryptos.” 12 June 2026. https://www.paradigm.xyz/writing/kryptos (accessed 3 October 2026).
- **[K4-08]** Economic Times. “A Famous 10-Foot CIA Sculpture Just Changed Hands, and the Crypto Firm That Bought Its Last Secret Says It Hasn’t Peeked.” 2026. https://economictimes.indiatimes.com/news/international/us/a-famous-10-foot-cia-sculpture-just-changed-hands-and-the-crypto-firm-that-bought-its-last-secret-says-it-hasnt-peeked-because-the-mystery-of-kryptos-is-still-the-point/articleshow/131702353.cms (accessed 3 October 2026).
- **[K4-09]** solvekryptos.com. “Kryptos.” n.d. https://solvekryptos.com/ (accessed 3 October 2026). **Community reconstruction; not artist authentication.**
- **[K4-10]** solvekryptos.com. “About Kryptos.” n.d. https://solvekryptos.com/about (accessed 3 October 2026). **Community reconstruction; not artist authentication.**
- **[K4-11]** solvekryptos.com. “Resources.” n.d. https://solvekryptos.com/resources (accessed 3 October 2026). **Community reconstruction; not artist authentication.**
- **[K4-12]** Boxentriq. “Kryptos Cipher Solutions.” n.d. https://www.boxentriq.com/guides/kryptos-cipher-solutions (accessed 3 October 2026). **Secondary/community guide.**
- **[K4-13]** *Wired*. “Mission Impossible: The Code Even the CIA Can’t Crack.” April 2009. https://www.wired.com/2009/04/ff-kryptos/ (accessed 3 October 2026).
- **[K4-14]** Popular Mechanics. “CIA Kryptos Puzzle.” 2020. https://www.popularmechanics.com/technology/security/a30750852/cia-kryptos-puzzle/ (accessed 3 October 2026).
- **[K4-15]** Puzzling Stack Exchange. “Unsolved Mysteries: Kryptos.” n.d. https://puzzling.stackexchange.com/questions/25931/unsolved-mysteries-kryptos (accessed 3 October 2026). **Community discussion; not an authenticated text.**
- **[K4-16]** Grandi, Giangiacomo. “The International Q-Code.” n.d. https://www.giangrandi.org/electronics/radio/qcode.shtml (accessed 3 October 2026).
- **[K4-17]** In Morse Code. “Q Codes.” n.d. https://inmorsecode.com/learn/q-codes/ (accessed 3 October 2026).
- **[K4-18]** Radio Hobbyist. “Ham Radio Q Codes.” n.d. https://radio-hobbyist.com/ham-radio-q-codes/ (accessed 3 October 2026).
- **[K4-19]** Grokipedia. “Kryptos.” n.d. https://grokipedia.com/page/Kryptos (accessed 3 October 2026). **Tertiary reference; used only as corroborative context in the source check.**

## USS *Vincennes*, naval history, terrain, and DjVu

- **[VN-01]** United States Department of Defense. *Formal Investigation into the Circumstances Surrounding the Downing of Iran Air Flight 655 on 3 July 1988: Internal Report*. 1988. Wikisource transcription. https://en.wikisource.org/wiki/Formal_Investigation_into_the_Circumstances_Surrounding_the_Downing_of_Iran_Air_Flight_655_on_3_July_1988/Internal_Report (accessed 3 October 2026).
- **[VN-02]** United States Department of Defense. *Formal Investigation into the Circumstances Surrounding the Downing of Iran Air Flight 655 on 3 July 1988*. 1988. PDF mirror hosted by *Time*. https://time.com/wp-content/uploads/2014/03/dodvincennes.pdf (accessed 3 October 2026).
- **[VN-03]** Yale Journal of International Law. “Volume 16, Number 2” (PDF reproducing ICAO Figure 1 used by the reconstruction). 1991. https://openyls.law.yale.edu/server/api/core/bitstreams/6def3043-a413-4592-a489-255762a9fbf8/content (accessed 3 October 2026). **Secondary reproduction of a primary figure.**
- **[VN-04]** Islamic Republic of Iran. *Memorial: Case Concerning the Aerial Incident of 3 July 1988 (Islamic Republic of Iran v. United States of America).* International Court of Justice, 1990. https://www.icj-cij.org/public/files/case-related/79/6629.pdf (accessed 3 October 2026).
- **[VN-05]** Evans, David, Lieutenant Colonel, U.S. Marine Corps (Retired). “Vincennes: A Case Study.” *Proceedings* 119, no. 8 (August 1993). https://www.usni.org/magazines/proceedings/1993/august/vincennes-case-study (accessed 3 October 2026).
- **[VN-06]** Naval Postgraduate School. *NPS-AS-93-008* (PDF record used for the track-number account). 1993. https://apps.dtic.mil/sti/tr/pdf/ADA259045.pdf (accessed 3 October 2026). **Direct retrieval was unavailable during the original source check; retain the record locator.**
- **[VN-07]** Naval History and Heritage Command. *The Battles of Savo Island, 9 August 1942, and the Eastern Solomons, 23–25 August 1942*. *Combat Narratives*. 2017 reprint of the Office of Naval Intelligence narrative. https://www.history.navy.mil/content/dam/nhhc/browse-by-topic/War%20and%20Conflict/WWII-Pacific-Battles/Savo%20Web.pdf (accessed 3 October 2026).
- **[VN-08]** Naval History and Heritage Command. “H-Gram 038-2.” n.d. https://www.history.navy.mil/about-us/leadership/director/directors-corner/h-gram-038/h-038-2.html (accessed 3 October 2026).
- **[VN-09]** Nimitz, Chester W., and James M. Steele. *Nimitz “Graybook”: Command Summary of Fleet Admiral Chester W. Nimitz*. U.S. Naval War College Archives, digital record MSC334_01_17_01, 1941–1945. https://www.usnwcarchives.org/repositories/2/digital_objects/22 (accessed 3 October 2026).
- **[VN-10]** United States Navy. *Battle Experience: Battle of Leyte Gulf*. HyperWar transcription, n.d. https://www.ibiblio.org/hyperwar/USN/rep/Leyte/BatExp/Leyte-BE-78.1.html (accessed 3 October 2026).
- **[VN-11]** U.S. Geological Survey. “Where Can I Get Global Elevation Data?” n.d. https://www.usgs.gov/faqs/where-can-i-get-global-elevation-data (accessed 3 October 2026).
- **[VN-12]** LizardTech / Celartem. *DjVu Reference*, version 3, November 2005. Unofficial HTML transcription. https://www.sndjvu.org/spec.html (accessed 3 October 2026).
- **[VN-13]** Wikipedia contributors. “DjVu.” *Wikipedia, The Free Encyclopedia*. n.d. https://en.wikipedia.org/wiki/DjVu (accessed 3 October 2026). **Orientation only; not the format authority.**
- **[VN-14]** Wikipedia contributors. “Iran Air Flight 655.” *Wikipedia, The Free Encyclopedia*. n.d. https://en.wikipedia.org/wiki/Iran_Air_Flight_655 (accessed 3 October 2026). **Orientation only; not the primary incident record.**

## Los Alamos / Project Y badge collection

- **[PY-01]** Los Alamos National Laboratory. “Historic Badges.” n.d. https://www.lanl.gov/about/history-innovation/badges (accessed 3 October 2026). **Current first-party public doorway.**
- **[PY-02]** Los Alamos National Laboratory. “Historic Badges.” Earlier path retained in Commons metadata. n.d. https://about.lanl.gov/history-innovation/badges/ (accessed 3 October 2026). **Historical locator, not preferred canonical URL.**
- **[PY-03]** Ali, Alee Rizwan. *Project Y Badge Photo Collection [Slides]*. Technical report LA-UR-22-20541, Los Alamos National Laboratory, 24 January 2022. https://www.osti.gov/biblio/1841894; https://doi.org/10.2172/1841894 (accessed 3 October 2026).
- **[PY-04]** Piccolo, Angiola Teresina. *LANL Today Story Project Y Badge Photos*. Technical report LA-UR-23-21584, Los Alamos National Laboratory, 15 February 2023. https://www.osti.gov/biblio/1957895; https://doi.org/10.2172/1957895 (accessed 3 October 2026).
- **[PY-05]** Wikimedia Commons contributors. “Los Alamos badge file pages and media delivery records.” n.d. https://commons.wikimedia.org/; https://upload.wikimedia.org/ (accessed 3 October 2026). **Per-file catalog and delivery layer; review each file page’s metadata and rights notice.**
- **[PY-06]** Los Alamos National Laboratory. “Wartime Staff.” Historic path cited by older badge records. n.d. https://www.lanl.gov/history/wartime/staff.shtml (accessed 3 October 2026). **Now a not-found page; retained only as a provenance trail.**
- **[PY-07]** Los Alamos National Laboratory. “Before and After: Newly Restored Badge Photos from the Lab’s Original Workforce.” *The Vault*, August 2021. https://www.lanl.gov/media/publications/the-vault/0821-before-and-after (accessed 3 October 2026).
- **[PY-08]** Piccolo, Angie. “Guarding Science.” *The Vault*, Los Alamos National Laboratory, 29 August 2022. https://www.lanl.gov/media/publications/the-vault/0822-guarding-science (accessed 3 October 2026).
- **[PY-09]** Lewis, Nicholas. “The Metropolis Collection.” *The Vault*, Los Alamos National Laboratory, 29 August 2022. https://www.lanl.gov/media/publications/the-vault/0822-metropolis (accessed 3 October 2026).
- **[PY-10]** Wellerstein, Alex. “The Faces of Project Y.” *Restricted Data*, 31 August 2012. https://blog.nuclearsecrecy.com/2012/08/31/the-faces-of-project-y/ (accessed 3 October 2026). **Secondary contextual source; names were extracted from filenames.**
- **[PY-11]** Bulletin Staff. “The Faces That Made the Bomb.” *Bulletin of the Atomic Scientists*, 19 June 2013. https://thebulletin.org/multimedia/the-faces-that-made-the-bomb/ (accessed 3 October 2026). **Curated contextual montage, not a roster or rights record.**
- **[PY-12]** Linn, Mott. “LANL Badge Restorations.” *Manhattan Project National Historical Park*, National Park Service, 9 February 2021. https://www.nps.gov/mapr/learn/news/lanl-badge-restorations.htm (accessed 3 October 2026). **Archived government corroboration.**
- **[PY-13]** Los Alamos National Laboratory PhotoShelter. Badge-image asset service cited by Commons file records. n.d. https://lanl.photoshelter.com/ (accessed 3 October 2026). **Source trail only; do not make it a runtime dependency.**
- **[PY-14]** Atomic Heritage Foundation / National Museum of Nuclear Science & History. “Human Computers at Los Alamos” and named profile/oral-history pages. n.d. https://ahf.nuclearmuseum.org/ (accessed 3 October 2026). **Biographical lead, not image-rights authority.**
- **[PY-15]** PICRYL and GetArchive. Badge-image mirror/search records. n.d. https://picryl.com/; https://getarchive.net/ (accessed 3 October 2026). **Discovery-only mirrors; verify against LANL, OSTI, or Commons.**

## *For Dummies*, CES, and RSA references

- **[FD-01]** GlowScripts. “Almost 1,000 ‘For Dummies’ eBooks.” *GitHub Gist* 1177334, 2011. https://gist.github.com/GlowScripts/1177334/f2da40d3932d126bc524f191a9f8e4d66deaac34 (accessed 3 October 2026).
- **[FD-02]** Dummies Custom Solutions. “Custom For Dummies: Your Smart Content Marketing Solution.” n.d. https://www.dummies.com/custom-solutions-archive/ (accessed 3 October 2026).
- **[FD-03]** Cisco. *Phishing For Dummies, Cisco Special Edition*. 2023. https://www.cisco.com/c/dam/en/us/products/security/phishing-dummies-ebook.pdf (accessed 3 October 2026).
- **[FD-04]** Qorvo. “New Qorvo eBook Series Explains the Internet of Things (IoT).” 5 December 2016. https://www.qorvo.com/newsroom/news/2016/new-qorvo-ebook-series-explains-the-internet-of-things-iot (accessed 3 October 2026).
- **[FD-05]** Qorvo. “Internet of Things For Dummies.” Download page. n.d. https://www.qorvo.com/design-hub/ebooks/internet-of-things-for-dummies (accessed 3 October 2026).
- **[FD-06]** EDN. “New Qorvo E-Book Series Explains the Internet of Things (IoT).” 2016. https://www.edn.com/new-qorvo-e-book-series-explains-the-internet-of-things-iot/ (accessed 3 October 2026).
- **[FD-07]** RSA Conference. “Cryptography For Dummies.” n.d. https://www.rsaconference.com/library/blog/cryptography-for-dummies (accessed 3 October 2026).
- **[FD-08]** RSA Conference. “Hacking For Dummies, 5th Edition.” n.d. https://www.rsaconference.com/blogs/hacking-for-dummies-5th-edition (accessed 3 October 2026).
- **[FD-09]** Open Library. Catalog search results for custom and special-edition *For Dummies* titles. n.d. https://openlibrary.org/ (accessed 3 October 2026). **Catalog evidence only; retain ISBN and edition when citing an individual booklet.**
- **[FD-10]** Library of Congress. Library catalog / JSON API. n.d. https://www.loc.gov/ (accessed 3 October 2026). **The source check records an inconclusive search, not a negative bibliographic finding.**
- **[FD-11]** OCLC. WorldCat search interface. n.d. https://search.worldcat.org/ (accessed 3 October 2026). **The source check records a consent/API barrier, not absence of records.**
- **[FD-12]** Internet Archive. Advanced Search and text collection. n.d. https://archive.org/advancedsearch.php (accessed 3 October 2026).

## Spectre Press and kimsoft.com

- **[SP-01]** Spectre Press. “Home.” 3 June 2002 capture. *Internet Archive Wayback Machine*. https://web.archive.org/web/20020603180041/http://www.spectrepress.com/ (accessed 3 October 2026).
- **[SP-02]** Spectre Press. “Games.” 7 June 2002 capture. *Internet Archive Wayback Machine*. https://web.archive.org/web/20020607074738/http://www.spectrepress.com/games.htm (accessed 3 October 2026).
- **[SP-03]** Spectre Press. “Tools.” 7 June 2002 capture. *Internet Archive Wayback Machine*. https://web.archive.org/web/20020607074905/http://www.spectrepress.com/tools.htm (accessed 3 October 2026).
- **[SP-04]** Spectre Press. “The Official Home Of.” 17 September 2026 capture. *Internet Archive Wayback Machine*. https://web.archive.org/web/20260917035715/https://www.spectrepress.com/ (accessed 3 October 2026).
- **[SP-05]** Spectre Press. Original domain root. http://www.spectrepress.com/ (accessed 3 October 2026). **Historic original locator; use the dated captures above for evidentiary content.**
- **[SP-06]** RPGGeek. “Spectre Press.” Publisher record 21702. n.d. https://rpggeek.com/rpgpublisher/21702/spectre-press (accessed 3 October 2026). **Secondary catalog entry.**
- **[SP-07]** Korea WebWeekly / Korean Nationalists Association. “Korea WebWeekly.” 7 December 1998 capture. *Internet Archive Wayback Machine*. https://web.archive.org/web/19981207023156/http://kimsoft.com/korea.htm (accessed 3 October 2026).
- **[SP-08]** Korea WebWeekly / Korean Nationalists Association. “Korea WebWeekly.” 24 February 1999 capture. *Internet Archive Wayback Machine*. https://web.archive.org/web/19990224142042/http://www.kimsoft.com/korea.htm (accessed 3 October 2026).
- **[SP-09]** Precis Intermedia. “Welcome to Precis Intermedia.” n.d. https://www.pigames.net/store/default.php (accessed 3 October 2026). **Current domain-chain context, not a replacement for the archived Spectre pages.**

## Jim Sanborn, installation practice, and the Zola context

- **[JS-01]** Sanborn, Jim. “Main / Installations.” Official artist site. n.d. https://jimsanborn.net/main.html (accessed 3 October 2026). **Primary catalog for work titles and artist-published information.**
- **[JS-02]** Smithsonian Archives of American Art. “Oral History Interview with Jim Sanborn, 2009.” 2009. https://www.aaa.si.edu/collections/interviews/oral-history-interview-jim-sanborn-15700 (accessed 3 October 2026). **First-person process evidence.**
- **[JS-03]** Atomic Heritage Foundation / National Museum of Nuclear Science & History. “Jim Sanborn’s Interview.” Oral-history transcript. n.d. https://ahf.nuclearmuseum.org/voices/oral-histories/jim-sanborns-interview/ (accessed 3 October 2026). **First-person evidence for *Atomic Time*.**
- **[JS-04]** Lafayette College Art Galleries. “Jim Sanborn: Looted.” 12 February 2020. https://galleries.lafayette.edu/2020/02/12/jim-sanborn-looted/ (accessed 3 October 2026). **Institutional exhibition research.**
- **[JS-05]** Democrat and Chronicle. “Jim Sanborn Rochester NY Lights Memorial Art Gallery.” 8 February 2017. https://www.democratandchronicle.com/story/news/2017/02/08/jim-sanborn-rochester-ny-lights-memorial-art-gallery/97553284/ (accessed 3 October 2026).
- **[JS-06]** The Washington Times. “Zola Embraces Its Bond with New Spy Museum.” 26 September 2002. https://www.washingtontimes.com/news/2002/sep/26/20020926-090917-2487r/ (accessed 3 October 2026). **Contemporaneous restaurant-context reporting.**
- **[JS-07]** The Hill. “Zola: A Twist of Intrigue.” 3 February 2016. https://thehill.com/capital-living/cover-stories/163895-zola-a-twist-of-intrigue/ (accessed 3 October 2026). **Later restaurant-context reporting.**
- **[JS-08]** Dunin, Elonka. “Selected Works: Jim Sanborn.” n.d. https://www.elonka.com/kryptos/sanborn/old/list.html (accessed 3 October 2026). **Secondary fan-maintained lead; not a construction drawing.**
- **[JS-09]** MIT List Visual Arts Center. “Paleos, 1994.” n.d. https://listart.mit.edu/art-artists/paleos-1994 (accessed 3 October 2026).
- **[JS-10]** Atomic Heritage Foundation / National Museum of Nuclear Science & History. “Critical Assembly Exhibition Opens.” n.d. https://ahf.nuclearmuseum.org/critical-assembly-exhibition-opens/ (accessed 3 October 2026).
- **[JS-11]** Randolph-Macon College. “Kryptographer.” 2026. https://www.rmc.edu/news/kryptographer/ (accessed 3 October 2026). **Later institutional corroboration, not fabrication documentation.**

## Convention venues and event chronology

- **[CV-01]** Black Hat. “Black Hat Conference.” *Wikipedia, The Free Encyclopedia*. n.d. https://en.wikipedia.org/wiki/Black_Hat_(conference) (accessed 3 October 2026). **Orientation only; event dates are corroborated with organizer or reporting sources below.**
- **[CV-02]** Review-Journal. “Expanded Mandalay Bay Convention Center Ready to Welcome Even More Crowds.” n.d. https://www.reviewjournal.com/business/tourism/expanded-mandalay-bay-convention-center-ready-to-welcome-even-more-crowds/ (accessed 3 October 2026).
- **[CV-03]** Pro Global Events. “Mandalay Bay Convention Center.” n.d. https://www.proglobalevents.com/blog/mandalay-bay-convention-center/ (accessed 3 October 2026). **Venue-industry secondary source.**
- **[CV-04]** No Cover Vegas. “Black Hat 2026 Guide.” 2026. https://nocovervegas.com/guides/blackhat-2026 (accessed 3 October 2026). **Event-discovery source.**
- **[CV-05]** Splunk. “Black Hat and DEF CON Conference.” n.d. https://www.splunk.com/en_us/blog/learn/blackhat-defcon-conference.html (accessed 3 October 2026). **Vendor explainer.**
- **[CV-06]** No Cover Vegas. “Black Hat USA.” n.d. https://nocovervegas.com/conventions/black-hat-usa (accessed 3 October 2026). **Event-discovery source.**
- **[CV-07]** DEF CON. “DEF CON Archives.” n.d. https://defcon.org/html/links/dc-archives.html (accessed 3 October 2026). **Organizer archive.**
- **[CV-08]** News 3 Las Vegas. “Hacker Conference DEF CON Moves from Caesars to Las Vegas Convention Center.” n.d. https://news3lv.com/news/local/hacker-conference-def-con-moves-from-caesars-to-las-vegas-convention-center-lvcc-southern-nevada (accessed 3 October 2026).
- **[CV-09]** Wikiwand. “AVN Adult Entertainment Expo.” n.d. https://www.wikiwand.com/en/articles/AVN_Adult_Entertainment_Expo (accessed 3 October 2026). **Tertiary orientation source.**
- **[CV-10]** *Las Vegas Sun*. “Why Vegas Porn Convention Decided to Meet a Week After CES.” 17 January 2012. https://lasvegassun.com/news/2012/jan/17/why-vegas-porn-convention-decided-meet-week-after-/ (accessed 3 October 2026).
- **[CV-11]** *Fast Company*. “CES and AEE: The Weird Tech Trade Show / Porn Overlap.” 2022. https://www.fastcompany.com/90732919/ces-aee-weird-tech-trade-show-porn (accessed 3 October 2026).
- **[CV-12]** Grokipedia. “Venetian Expo.” n.d. https://grokipedia.com/page/Venetian_Expo (accessed 3 October 2026). **Tertiary orientation source.**
- **[CV-13]** Wikipedia contributors. “W Las Vegas.” *Wikipedia, The Free Encyclopedia*. n.d. https://en.wikipedia.org/wiki/W_Las_Vegas (accessed 3 October 2026). **Orientation only.**
- **[CV-14]** The Meeting Magazines. “Ducasse Debuts Rivea and Skyfall Lounge at Delano Las Vegas.” n.d. https://www.themeetingmagazines.com/news/ducasse-debuts-rivea-skyfall-lounge-delano-las-vegas/ (accessed 3 October 2026).
- **[CV-15]** Vital Vegas. “Skyfall Lounge Closes for Renovation at W Las Vegas.” 2026. https://www.casino.org/vitalvegas/skyfall-lounge-closes-for-renovation-at-w-las-vegas/ (accessed 3 October 2026). **Contemporary local reporting.**
- **[CV-16]** Las Vegas Convention and Visitors Authority. *Las Vegas Convention Center Expansion: West Hall Fact Sheet*. 2021. https://www.multivu.com/players/English/8909751-lvcva-las-vegas-convention-center-expansion-informa-market-world-of-concrete/docs/WestHallFactSheet_1623197150059-907052717.pdf (accessed 3 October 2026).
- **[CV-17]** Review-Journal. “Best Convention Center in the World Reopens after Massive Renovation.” n.d. https://www.reviewjournal.com/business/conventions/best-convention-center-in-the-world-reopens-after-massive-renovation-3604125/ (accessed 3 October 2026).
- **[CV-18]** PR Newswire. “$1 Billion Las Vegas Convention Center Expansion Debuts with First Major Convention Post-Pandemic.” 2021. https://www.prnewswire.com/news-releases/1-billion-las-vegas-convention-center-expansion-debuts-with-first-major-convention-post-pandemic-301308548.html (accessed 3 October 2026).
- **[CV-19]** American Society of Civil Engineers. “New Hall Opens at Las Vegas Convention Center.” *Civil Engineering Source*, January 2021. https://www.asce.org/publications-and-news/civil-engineering-source/civil-engineering-magazine/article/2021/01/new-hall-opens-at-las-vegas-convention-center (accessed 3 October 2026).
- **[CV-20]** Wikipedia contributors. “Venetian Expo.” *Wikipedia, The Free Encyclopedia*. n.d. https://en.wikipedia.org/wiki/Venetian_Expo (accessed 3 October 2026). **Orientation only.**
- **[CV-21]** Review-Journal. “Signs Beginning to Change as Sands Adopts the Venetian Expo Name.” n.d. https://www.reviewjournal.com/business/conventions/signs-beginning-to-change-as-sands-adopts-the-venetian-expo-name-2431639/ (accessed 3 October 2026).
- **[CV-22]** Review-Journal. “Sands Expo Changing Name to the Venetian Expo on Sept. 2.” n.d. https://www.reviewjournal.com/business/tourism/sands-expo-changing-name-to-the-venetian-expo-on-sept-2-2400580/ (accessed 3 October 2026).
- **[CV-23]** SparkOC. “Anaheim Convention Center.” n.d. https://sparkoc.com/venue/anaheim-convention-center/ (accessed 3 October 2026). **Venue-industry secondary source.**
- **[CV-24]** Anaheim Convention Center. *ACC Specification Guide 2025*. 2025. https://assets.simpleviewinc.com/simpleview/image/upload/v1/clients/anaheimca/ACC_Spec_Guide_2025_v8_final_reduced_77890cd3-63c3-48e9-886d-703bc25dfb33.pdf (accessed 3 October 2026).
- **[CV-25]** PR Newswire. “Anaheim Convention Center Officially Opens ACC North Building.” 2017. https://www.prnewswire.com/news-releases/anaheim-convention-center-officially-opens-acc-north-building-300526058.html (accessed 3 October 2026).
- **[CV-26]** Visit Anaheim. “ACC North Officially Opens.” 2017. https://www.visitanaheim.org/articles/post/acc-north-officially-opens/ (accessed 3 October 2026).
- **[CV-27]** Yahoo Finance. “MD&M West Returns with Focus ….” 2025. https://finance.yahoo.com/news/md-m-west-returns-focus-200000600.html (accessed 3 October 2026). **Syndicated event announcement.**
- **[CV-28]** MD+DI. “Informa Markets Engineering Advanced Manufacturing Events Unify to MD&M Brand.” 2024. https://www.mddionline.com/manufacturing/informa-markets-engineering-advanced-manufacturing-events-unify-to-md-m-brand (accessed 3 October 2026).
- **[CV-29]** MD&M East. “MD&M East.” n.d. https://www.mdmeast.com/ (accessed 3 October 2026). **Organizer event page.**
- **[CV-30]** MD+DI. “MD&M East.” n.d. https://www.mddionline.com/events/md-m-east (accessed 3 October 2026).
- **[CV-31]** Convention Calendar. “MD&M East, Jacob Javits Center.” n.d. https://conventioncalendar.com/us/ny/new-york-city/jacob-javits-center/mdm-east-399792 (accessed 3 October 2026). **Calendar secondary source.**
- **[CV-32]** Cvent. “Renaissance Las Vegas Hotel.” Venue profile. n.d. https://www.cvent.com/venues/las-vegas/hotel/renaissance-las-vegas-hotel/venue-de267c7f-28aa-454f-8b00-c57040b11c07 (accessed 3 October 2026).
- **[CV-33]** HotelPlanner. “Renaissance Las Vegas.” Hotel profile. n.d. https://www.hotelplanner.com/Hotels/283886/Reservations-Renaissance-Las-Vegas-Las-Vegas-3400-Paradise-Rd-89169 (accessed 3 October 2026). **Booking-directory secondary source.**
- **[CV-34]** Dunin, Elonka. “Jim Sanborn.” n.d. https://www.elonka.com/kryptos/sanborn.html (accessed 3 October 2026). **Secondary fan-maintained lead.**
- **[CV-35]** Wikipedia contributors. “Lingua (Sculpture).” *Wikipedia, The Free Encyclopedia*. n.d. https://en.wikipedia.org/wiki/Lingua_(sculpture) (accessed 3 October 2026). **Orientation only.**
- **[CV-36]** Grokipedia. “AVN Adult Entertainment Expo.” n.d. https://grokipedia.com/page/AVN_Adult_Entertainment_Expo (accessed 3 October 2026). **Tertiary orientation source.**

## CyberChef matrix-cipher sources

- **[CM-01]** Wikipedia contributors. “Hill Cipher.” *Wikipedia, The Free Encyclopedia*. n.d. https://en.wikipedia.org/wiki/Hill_cipher (accessed 3 October 2026). **Used for its documented teaching vector; not a substitute for a primary historical source.**
- **[CM-02]** Wikipedia contributors. “Two-Square Cipher.” *Wikipedia, The Free Encyclopedia*. n.d. https://en.wikipedia.org/wiki/Two-square_cipher (accessed 3 October 2026). **Used for the vertical-convention vector.**
- **[CM-03]** American Cryptogram Association. *Two-Square Cipher*. Cipher-information sheet. n.d. https://www.cryptogram.org/downloads/aca.info/ciphers/TwoSquare.pdf (accessed 3 October 2026).
- **[CM-04]** dCode. “Two-Square Cipher.” n.d. https://www.dcode.fr/two-square-cipher (accessed 3 October 2026). **Second-convention corroboration.**
- **[CM-05]** Wikipedia contributors. “Transposition Cipher.” *Wikipedia, The Free Encyclopedia*. n.d. https://en.wikipedia.org/wiki/Transposition_cipher (accessed 3 October 2026). **Used for the irregular-columnar vector.**
- **[CM-06]** Wikipedia contributors. “Transposition Cipher: Myszkowski Transposition.” *Wikipedia, The Free Encyclopedia*. n.d. https://en.wikipedia.org/wiki/Transposition_cipher#Myszkowski_transposition (accessed 3 October 2026).
- **[CM-07]** American Cryptogram Association. *Myszkowski Cipher*. Cipher-information sheet. n.d. https://www.cryptogram.org/downloads/aca.info/ciphers/Myszkowski.pdf (accessed 3 October 2026).
- **[CM-08]** American Cryptogram Association. *Grille Cipher*. Cipher-information sheet. n.d. https://www.cryptogram.org/downloads/aca.info/ciphers/Grille.pdf (accessed 3 October 2026).
- **[CM-09]** The Black Chamber. “Grille Transposition.” 18 November 2020. https://theblackchamber552383191.wordpress.com/2020/11/18/grille-transposition/ (accessed 3 October 2026). **Independent walkthrough.**
- **[CM-10]** American Cryptogram Association. *Phillips Cipher*. Cipher-information sheet. n.d. https://www.cryptogram.org/downloads/aca.info/ciphers/Phillips.pdf (accessed 3 October 2026).
- **[CM-11]** CryptoCrack. “Phillips.” n.d. https://sites.google.com/site/cryptocrackprogram/user-guide/cipher-types/substitution/phillips (accessed 3 October 2026).
- **[CM-12]** Central Washington University. *Kryptos Challenge: Phillips Cipher*. Classroom worksheet. n.d. https://www.cwu.edu/academics/math/_documents/kryptos-challenges/cwu-kryptos-challenge-phillips-cipher.pdf (accessed 3 October 2026).

## Intelligence Lecture Hall / Cicada 3301 sources

- **[LH-01]** Cicada 3301. “Message from 3301/Cicada.” *Pastebin*, 4 April 2017. https://pastebin.com/yEiTHhvF (accessed 3 October 2026). **Primary transcription retained by the source check.**
- **[LH-02]** Uncovering Cicada Wiki. “PGP Signed Message April 2017.” n.d. https://uncovering-cicada.fandom.com/wiki/PGP_Signed_Message_April_2017 (accessed 3 October 2026). **Community transcription and discovery record, not a replacement for LH-01.**
- **[LH-03]** Callas, Jon, et al. *OpenPGP Message Format*. RFC 4880. Internet Engineering Task Force, November 2007. https://www.rfc-editor.org/rfc/rfc4880.html (accessed 3 October 2026).
- **[LH-04]** aadishgoel. “Welcome.txt.” *Cicada-3301* repository, GitHub. n.d. https://github.com/aadishgoel/Cicada-3301/blob/master/Welcome.txt (accessed 3 October 2026). **Archive copy; preserve a byte digest when relying on it.**
- **[LH-05]** scream314. “2014.md.” *cicada3301* repository, GitHub. n.d. https://github.com/scream314/cicada3301/blob/master/2014.md (accessed 3 October 2026). **Community archive.**
- **[LH-06]** scream314. “liber_primus.md.” *cicada3301* repository, GitHub. n.d. https://github.com/scream314/cicada3301/blob/master/liber_primus.md (accessed 3 October 2026). **Community transcription.**
- **[LH-07]** Uncovering Cicada Wiki. “What Happened Part 1 (2014).” n.d. https://uncovering-cicada.fandom.com/wiki/What_Happened_Part_1_(2014) (accessed 3 October 2026). **Community archive.**
- **[LH-08]** Uncovering Cicada Wiki. “The Leaked Email.” n.d. https://uncovering-cicada.fandom.com/wiki/The_Leaked_Email (accessed 3 October 2026). **Disputed community record; not independent proof of authorship or organizational identity.**

## Incomplete or family-level references

The following were deliberately retained because the source-check corpus names
them, but it does not preserve enough bibliographic metadata for a conventional
item-level citation. These are **not** invitations to fill gaps with assumptions.
They are a remediation queue for a future pass.

| Key | Source label as used in the check | Citation status / handling |
| --- | --- | --- |
| [FL-01] | Google Drive folder embedded in LA-UR-23-21584 | No stable folder identifier was retained in the source-check notes. Cite [PY-04] and the specific folder URL only when recovered from the report. |
| [FL-02] | `cdn.lanl.gov` image assets | Delivery URLs, not bibliographic records. Cite the containing LANL page or Commons file page instead. |
| [FL-03] | Legacy `ProjectYBadges/...` GIF URLs | Individual historic asset paths were described but not enumerated. Cite [PY-06] plus the Commons file page for a particular image. |
| [FL-04] | Aerodrome data for Bandar Abbas runway 21L | Provider, edition, and retrieval URL are not recorded in the Vincennes source check. Do not promote the coordinate to a fully cited external datum without those fields. |
| [FL-05] | Island gazetteer data; UNESCO tentative-list documentation; 2015 Allen survey reporting | The check supplies source classes but no item-level locators. Preserve the values as the model’s cited-control-point inputs and add provider/record IDs before external republication. |
| [FL-06] | DjVuLibre `DjVuText.cpp` | The source check identifies the implementation as the only zone-tree description but gives no pinned commit or file URL. Pin a revision before representing the parser as implementation-conformant. |
| [FL-07] | Internet Archive derivative pipeline | A process/source family, not a single bibliographic work. Cite the relevant item’s `_djvu.xml` derivative when a real document is used. |
| [FL-08] | Open Library and Library of Congress query result sets | Search interfaces were used to verify catalog presence/absence; the check does not preserve a query URL or result snapshot. Cite a specific catalog record for a specific edition. |
| [FL-09] | Precís Intermedia / `pigames.net` domain-chain pages | The source check describes the current relationship but does not preserve a fixed dated capture for every observed page. Cite [SP-09] only for current context and archive a snapshot for time-sensitive claims. |
| [FL-10] | `HS98` | Explicitly unresolved in the source check; no bibliographic reference is claimed. |

## Source-note map

Use this map when adding an in-text citation to a particular research thread.
It records topic coverage without implying that every entry in a section supports
every claim in that note.

| Source-check note | Primary bibliography ranges |
| --- | --- |
| `docs/source-check-2026-09-28.md` | CR-01–CR-16 |
| `docs/source-check-2026-09-29.md` | K4-01–K4-19 |
| `docs/source-check-2026-09-29-vincennes.md` | VN-01–VN-14; FL-04–FL-07 |
| `docs/los-alamos-source-check-2026-09-30.md` | PY-01–PY-15; FL-01–FL-03 |
| `docs/for-dummies-source-check.md` | FD-01–FD-12; FL-08 |
| `docs/spectre-press-source-check.md` | SP-01–SP-09; FL-09–FL-10 |
| `research/jim-sanborn-source-check.md` | JS-01–JS-11 |
| `public/apps/sanborn-restaurant-4dwm/research-source-check.md` | JS-01–JS-11 |
| `docs/convention-venues.md` | CV-01–CV-36 |
| `docs/cyberchef-matrix-deep-dive.md` | CM-01–CM-12 |
| `docs/dss-casefiles-riddle-warrick.md` | No literal web locator is retained in this note; see its digest-pinned local evidence and the incomplete-record policy. |
| `docs/lecture-hall-research-2026-09-20.md` | No literal web locator is retained in this note; its follow-up links are indexed at LH-01–LH-08. |
| `docs/lecture-hall-research-2026-09-27.md` | LH-01–LH-08 |
| `docs/los-alamos-domain-deep-dive-2026-09-30.md` | PY-01–PY-15; FL-01–FL-03 |
