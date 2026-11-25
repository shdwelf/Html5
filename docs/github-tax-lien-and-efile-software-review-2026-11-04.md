# GitHub review: tax-lien and e-file software

**Reviewed:** 2026-11-04
**Method:** GitHub repository search, repository metadata, READMEs, license metadata, selected source files, and tests where relevant. This is a source review, not a deployment, legal opinion, or financial audit.

## Executive summary

GitHub contains projects that cover several different meanings of “tax-lien/e-file software,” but no single reviewed project is a general, production-ready tax-lien investment and filing platform:

- **Tax-lien investing/portfolio calculations:** [LeinOS](https://github.com/3piecechickendinner/LeinOS/tree/5bab14df10b3ccabbe150f906b3bf9a433aa751c) is the closest purpose-built candidate, but its implementation needs financial and jurisdictional validation before any reliance.
- **A tax-lien court response:** [docassemble-MATCTaxLienAnswer](https://github.com/SuffolkLITLab/docassemble-MATCTaxLienAnswer/tree/659e82fcb3ad5e073bc12ec7040c83a36809d68e) is a Massachusetts-specific legal-aid interview for a defendant’s answer and certificate of service. It is not an investor or portfolio system.
- **Court e-filing infrastructure:** [docassemble-EFSPIntegration](https://github.com/SuffolkLITLab/docassemble-EFSPIntegration/tree/9be348db51eda88f92ae3435ea505f306482bb8b) and [EfileProxyServer](https://github.com/SuffolkLITLab/EfileProxyServer/tree/0433c1a01a056afd3d1f6c967563fb8e2f7f1cc1) are a jurisdiction/provider-dependent ECF integration, not a general IRS e-file product.
- **IRS information returns:** [fire-1099](https://github.com/sdj0/fire-1099/tree/b10429357be1e9b1e3a0231d2d1df42c08721c03) is old alpha code for generating 1099 files for IRS FIRE. File generation is not the same as submitting a return or preparing a 1040.
- **Tax Court case management:** [ustaxcourt/ef-cms](https://github.com/ustaxcourt/ef-cms/tree/81c9692d9d3e017cb226ca999b137d477c3aa93a) is the U.S. Tax Court’s public-domain case-management/e-filing system, not a reusable consumer tax-preparation app.

No reviewed repository establishes that it is an IRS-authorized e-file provider or that it is suitable for production legal, tax, or investment decisions. The GitHub search was not an exhaustive census of commercial services.

## Tax-lien and tax-sale projects

| Repository | What the source says/does | Assessment |
|---|---|---|
| [3piecechickendinner/LeinOS](https://github.com/3piecechickendinner/LeinOS/tree/5bab14df10b3ccabbe150f906b3bf9a433aa751c) — MIT | Describes an AI-assisted tax-lien portfolio system. The checked-in interest-calculator agent uses simple interest with a 365-day denominator; model serialization converts `Decimal` values to `float`. The tree also contains several backup copies. | A research prototype, not a validated financial calculator. The code-level formula and numeric conversions warrant review against each jurisdiction’s statute, dates, fees, redemption rules, and rounding requirements. A README claim of production readiness is not independent validation. |
| [SuffolkLITLab/docassemble-MATCTaxLienAnswer](https://github.com/SuffolkLITLab/docassemble-MATCTaxLienAnswer/tree/659e82fcb3ad5e073bc12ec7040c83a36809d68e) — MIT | A docassemble interview for a Massachusetts Land Court tax-lien answer and certificate of service, aimed at defendants or attorneys; the interview can connect to an e-filing workflow. | Useful as a narrowly scoped example of court-form automation. It is not a tax-lien acquisition, servicing, or return-preparation system. Its Massachusetts-specific content needs legal review before adaptation elsewhere. |
| [XP1/TedThomas.com-tax-sale-states](https://github.com/XP1/TedThomas.com-tax-sale-states/tree/bedbd8adbc2bda17a6ddbc7c2a779d096171577f) — Apache-2.0 | Scraper/export utility for state tax-sale classifications, with spreadsheet/CSV/JSON outputs. | A data-collection script, not a lien-management product. Validate each result against current primary law and review the source site’s terms before reuse or automated collection. |
| [PovertyCenterCLE/TaxLien](https://github.com/PovertyCenterCLE/TaxLien/tree/fe6d9689a567cd08fb59b9757f710bc82e815111) | Older Cuyahoga County tax-lien visualization; no license metadata was found in the reviewed repository metadata. | Local visualization/data project, not a general product. Do not assume the code or its data is reusable without resolving licensing and provenance. |
| [TruliSTAT/forclos](https://github.com/TruliSTAT/forclos/tree/46f89cdc3bbcf11ca5ed799c14ac1f73d1f34651) | Repository search hit; the checked README/tree looked like a generic Next.js starter rather than a tax-lien implementation. | Not a substantive tax-lien candidate. No reuse recommendation. |

## E-filing projects

### Court e-filing

- [docassemble-EFSPIntegration](https://github.com/SuffolkLITLab/docassemble-EFSPIntegration/tree/9be348db51eda88f92ae3435ea505f306482bb8b) (MIT) is an integration component for court electronic filing. Its documented flow depends on a separately deployed [EfileProxyServer](https://github.com/SuffolkLITLab/EfileProxyServer/tree/0433c1a01a056afd3d1f6c967563fb8e2f7f1cc1) (MIT), a provider API token, and jurisdiction/provider setup. It is not a standalone filing service and does not grant access to any court’s filing system.
- [ustaxcourt/ef-cms](https://github.com/ustaxcourt/ef-cms/tree/81c9692d9d3e017cb226ca999b137d477c3aa93a) is the U.S. Tax Court’s DAWSON case-management/e-filing application. The repository declares CC0/public-domain terms. Its agency-specific scale and operational dependencies make it a reference for that court system, not a plug-in for general tax filing.

### IRS information returns and tax returns

- [sdj0/fire-1099](https://github.com/sdj0/fire-1099/tree/b10429357be1e9b1e3a0231d2d1df42c08721c03) (MIT) is marked alpha and its package metadata targets Python 3.6/3.7. It generates files for the IRS FIRE workflow; it is not evidence of current IRS-format conformance, acceptance, or submission capability. Verify current IRS specifications and test cases before any use.
- The GitHub sweep did **not** identify a clearly maintained, licensed, production-grade open-source client for preparing and electronically filing ordinary individual income-tax returns (for example, a complete 1040 workflow). This is a scoped search result, not proof that no such code exists.

## Practical conclusion

1. First identify the actual workflow: tax-lien investor accounting, a state/county lien case, a court response, IRS 1099 information returns, or an individual/business income-tax return. These are different products and authorities.
2. Treat LeinOS as a code-review lead only; do not use its calculated balances for acquisition, redemption, tax, or legal decisions without a jurisdiction-specific specification, independently calculated golden vectors, and financial review.
3. Treat court e-filing integrations as provider-specific infrastructure. Obtain the court/EFSP’s authorization and technical requirements before designing an integration; do not put API tokens in source control or browser code.
4. Do not use an unlicensed scraper or a public-data repository as a source of legal truth. Verify county, state, and IRS rules against the controlling primary sources.

No filing was submitted, no live provider was contacted, and no credentials or real tax/contact data were used.

## References

- [LeinOS source snapshot](https://github.com/3piecechickendinner/LeinOS/tree/5bab14df10b3ccabbe150f906b3bf9a433aa751c)
- [Massachusetts tax-lien answer interview snapshot](https://github.com/SuffolkLITLab/docassemble-MATCTaxLienAnswer/tree/659e82fcb3ad5e073bc12ec7040c83a36809d68e)
- [EFSP integration snapshot](https://github.com/SuffolkLITLab/docassemble-EFSPIntegration/tree/9be348db51eda88f92ae3435ea505f306482bb8b)
- [EfileProxyServer snapshot](https://github.com/SuffolkLITLab/EfileProxyServer/tree/0433c1a01a056afd3d1f6c967563fb8e2f7f1cc1)
- [U.S. Tax Court ef-cms snapshot](https://github.com/ustaxcourt/ef-cms/tree/81c9692d9d3e017cb226ca999b137d477c3aa93a)
- [fire-1099 snapshot](https://github.com/sdj0/fire-1099/tree/b10429357be1e9b1e3a0231d2d1df42c08721c03)
- [Tax-sale state scraper snapshot](https://github.com/XP1/TedThomas.com-tax-sale-states/tree/bedbd8adbc2bda17a6ddbc7c2a779d096171577f)
