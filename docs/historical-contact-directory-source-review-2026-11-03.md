# Historical contact directory: source and update review

**Reviewed:** 2026-11-03

**Purpose:** choose lawful, maintainable reference data for a local-first historical directory/contact index.

## Recommendation

Keep historical directory records user-supplied and local. The app does not ship any contact records, USPS ZIP dataset, ISO country table, or NIH directory. It accepts CSV and its own JSON backup format, preserves the source title/edition/year/page and a rights note, and stores records in the current browser profile. Postal codes are strings, not a claim of current USPS deliverability. Country codes are optional text, not an ISO validator.

Do not bulk-import or redistribute USPS data into the public app until the relevant USPS terms or a written license clearly allow that use. Ask for the first directory's region, year range, and file/source before selecting historical content. For the NIH reference, first choose the intended subject (grants and grantees, facilities, organizations, or providers); those are different datasets.

## USPS ZIP data

- **Official ZIP Locale Detail:** [PostalPro ZIP Codes by Area and District codes](https://postalpro.usps.com/ZIP_Locale_Detail) describes a spreadsheet of ZIP Codes with associated area and district codes. The page showed an **October 1, 2026** publication when checked. It is a locality/administrative reference, not a street-level address validator.
- **Official licensed products:** USPS [ZIP+4 Product](https://postalpro.usps.com/address-quality-solutions/zip-4-product) and [City State Product](https://postalpro.usps.com/address-quality/city-state-product) are monthly address-quality products; they are not an unrestricted offline database. USPS [developer terms](https://developers.usps.com/terms-and-conditions) reserve rights to the data, prohibit scraping, and restrict creating address lists or third-party databases from API data. The ZIP Locale page itself did not present a clear open-data grant. Treat reuse/redistribution as unconfirmed until USPS terms or a product license say otherwise.
- **Best live validation route:** the current [USPS API catalog](https://developers.usps.com/apis) includes address standardization, city/state lookup by ZIP, and ZIP lookup by city/state. It is an authenticated online service, not an offline snapshot. The official [API retirement/migration notice](https://developers.usps.com/industry-alert-api-retirement) says API v1/v2 retired effective January 22, 2025; use current v3 documentation and onboarding rather than the legacy Web Tools PDF. The API FAQ explains OAuth and account setup.
- **Stamps.com:** its [Developer Program](https://developer.stamps.com/) provides shipping, rates, labels, tracking, and address validation. It is a live shipping integration, not a ZIP-directory feed. Connecting it would send address data off-device and require account/API setup, so it is intentionally not wired into this offline contacts app.

### GitHub ZIP candidates

- [`madhatter349/postalpro-zip-locale`](https://github.com/madhatter349/postalpro-zip-locale) is the strongest *monitoring* candidate found: its README describes daily checks of the USPS PostalPro source, JSON/CSV/SQLite outputs, provenance, and health/change files. GitHub's latest data check was **November 3, 2026** (`health.json`: `ok`, `unchanged`); the mirrored upstream file was published **October 1, 2026**. The mirror reports 42,282 rows and 37,103 unique ZIP codes, so a ZIP may have multiple locality records. Its health/provenance files distinguish last-check time from the USPS publication date. The project says its code and mirrored data are Apache-2.0, but a mirror's license cannot by itself establish USPS redistribution rights. Use it for freshness/provenance review, not as an automatically bundled app dataset until rights are confirmed.
- [`pseudosavant/usps-zip-codes`](https://github.com/pseudosavant/usps-zip-codes) has an MIT-licensed transformation project and a script for the USPS Excel file; its latest commit was **September 23, 2025**. It is less suitable as a current update monitor than the daily mirror above.
- A five-digit ZIP list or ZIP-to-city mapping is not equivalent to ZIP+4, delivery-point, or street-address validation. Do not label any of these as a verified mailing address service.

## ISO 3166

- **Authoritative reference:** ISO says the [Online Browsing Platform](https://www.iso.org/obp/ui/) is kept up to date and offers change notifications. The [Country Codes Collection](https://www.iso.org/publication/PUB500001.html) covers ISO 3166 Parts 1, 2, and 3, including current and formerly used codes in downloadable formats; access to a complete integrated collection is a product, not a guaranteed free public API.
- **GitHub update history:** [`amckenna41/iso3166-updates`](https://github.com/amckenna41/iso3166-updates) is MIT-licensed software, but the bundled update data's most recent `Date Issued` was **2025-07-22** when checked, even though the software/repository received later code updates in 2026. Do not treat that mirror as a current 2026 ISO feed without reconciling it with ISO's OBP/newsletters.
- [`countries/countries-data-json`](https://github.com/countries/countries-data-json) was pushed in September 2026, but GitHub identifies its license as **Other**; review the exact data and license before redistribution. The existing Country Viewer dataset in this repository is a CIA Factbook-derived country register, not an ISO update feed.

## NIH source choice

There is no single general-purpose public NIH historical people/contact directory identified in this review. The official candidates answer different questions:

- [NIH RePORTER API](https://api.reporter.nih.gov/) is for NIH-funded research projects and related organizations/investigators; it is not an NIH employee phone book.
- [NIH Buildings and Street Addresses](https://ors.od.nih.gov/pes/dmms/services/pages/mailing-addresses.aspx) covers NIH facilities and campus mailing locations.
- The [NIDCD Directory of Organizations](https://www.nidcd.nih.gov/directory) is an institute-specific directory of organizations, not a whole-of-NIH contact source.
- The [NLM Clinical Tables NPI Organizations API](https://clinicaltables.nlm.nih.gov/apidoc/npi_org/v3/doc.html) searches provider organizations using CMS/NPPES NPI data. It is not an NIH-generated historical directory and may include professional contact information.

Choose one of these scopes before import. None is fetched by this app.

## Local app behavior and limitations

- CSV and the app's JSON backup format import in the browser; scanned PDFs need OCR/export to a table first (direct PDF/OCR import is not implemented). Contacts are stored in IndexedDB for the current browser profile. The app makes no background network requests.
- Data is not encrypted by the app. Browser-local storage is not a substitute for device security; JSON/CSV exports are plain text.
- Source, edition/year, page, catalog URL/ID, and a rights note travel with each record. Duplicate listings are preserved; the app does not automatically merge people with similar names.
- No historical directory files, NIH records, USPS postal file, or ISO table were selected or downloaded for the app. No records are preloaded.

## References checked

- [USPS ZIP Locale Detail](https://postalpro.usps.com/ZIP_Locale_Detail)
- [USPS ZIP+4 Product](https://postalpro.usps.com/address-quality-solutions/zip-4-product)
- [USPS City State Product](https://postalpro.usps.com/address-quality/city-state-product)
- [USPS API catalog](https://developers.usps.com/apis), [terms](https://developers.usps.com/terms-and-conditions), [migration notice](https://developers.usps.com/industry-alert-api-retirement), [FAQ](https://developers.usps.com/faq)
- [Stamps.com Developer Program](https://developer.stamps.com/)
- [ISO 3166 country codes](https://www.iso.org/iso-3166-country-codes.html), [OBP](https://www.iso.org/obp/ui/), [Country Codes Collection](https://www.iso.org/publication/PUB500001.html)
- [NIH RePORTER API](https://api.reporter.nih.gov/), [NIH facility addresses](https://ors.od.nih.gov/pes/dmms/services/pages/mailing-addresses.aspx), [NIDCD Directory](https://www.nidcd.nih.gov/directory), [NLM NPI Organizations API](https://clinicaltables.nlm.nih.gov/apidoc/npi_org/v3/doc.html)
