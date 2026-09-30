# Gentoo penguin research translated into GEDCOM evidence matching

Prepared: 2026-09-30

## Source and relevant findings

Primary source: **“Integrative evidence reveals adaptive divergence and speciation in gentoo penguins”**, *Communications Biology* (2026), DOI [10.1038/s42003-026-10081-7](https://doi.org/10.1038/s42003-026-10081-7). [Figure 1](https://www.nature.com/articles/s42003-026-10081-7/figures/1) supplies the geographic and evolutionary overview.

The study does not present a genealogy-matching algorithm. Its useful contribution here is methodological:

- It combines independent evidence streams rather than treating one field as dispositive: phylogenomics, population structure, geography, ecology, morphology, and historical gene flow.
- The authors analyzed 64 resequenced genomes from ten colonies and 9,158,384 SNPs. Their phylogeny used 4,035 ultraconserved elements (UCEs) from 28 individuals; 100 selected loci supported time-calibrated reconstruction.
- The convergent evidence supports four principal gentoo lineages: northern, southern, southeastern, and eastern. South Georgia and Macquarie are described at lower hierarchical divergence, sister to southern and eastern lineages respectively.
- Figure 1 distinguishes a species tree inferred with ASTRAL-III from a StarBEAST3 time-calibrated tree and visibly reports uncertainty with 95% HPD intervals.
- Admixture and TreeMix/Dsuite results retain evidence of ancestral connectivity. Consequently, geographic or genetic clustering should not be mistaken for a perfectly clean identity boundary.
- The paper reports pairwise genomic differentiation and gene flow together, and explicitly discusses selection and drift as alternative contributors. This is a good model for exposing both supporting and contradictory evidence.

## Product translation

The viewer implements an intentionally smaller, explainable analogue:

1. **Candidate generation:** normalized name similarity proposes possible record matches using token overlap and Jaro–Winkler distance. Diacritics and punctuation do not prevent discovery.
2. **Independent corroboration:** shared birth/death years, birthplace, family context, and explicitly supplied genetic marker text contribute separate weighted observations when both records contain them.
3. **Contradictions remain visible:** large year conflicts, divergent places, and differing comparable marker text lower a score and appear in the explanation.
4. **Missing is not negative:** absent dates, places, relatives, or genetic fields add no evidence either way.
5. **Uncertainty is explicit:** the percentage is a review-priority score, not a probability, identity decision, kinship estimate, or merge operation.

## GEDCOM genetics constraints

FamilySearch GEDCOM 7 defines an extension mechanism, not standard DNA structures. Extension tags begin with `_` and should be mapped to URIs using `HEAD.SCHMA`: [GEDCOM 7 specification, Extensions](https://gedcom.io/specifications/FamilySearchGEDCOMv7.html#extensions). A proposal to add mtDNA and Y-DNA support remains an open ecosystem topic: [FamilySearch/GEDCOM issue 119](https://github.com/FamilySearch/GEDCOM/issues/119).

The viewer therefore preserves and displays a conservative set of vendor tags (`_DNA`, `_YDNA`, `_MTDNA`, `_HAPLO`, `_HAPLOGROUP`, `_AUTOSOMAL`, plus observed unprefixed variants) without assigning standardized semantics. Nested `TYPE`, `VALUE`, and `NOTE` values are retained where present. It does **not** infer haplogroups, ethnicity, disease risk, biological relationships, or raw-sequence conclusions.

A textual marker match is deliberately low-weight. Haplogroups may be shared by many people, vendor payloads differ, and two records can contain results from unlike tests. Genetic data must not become a shortcut around conventional records or informed review.

## Privacy and scope

- Parsing and matching stay client-side.
- No network lookup or upload is made.
- Genetic evidence is shown only when present in the imported file.
- The demo uses synthetic marker labels and a deliberately similar duplicate record to exercise the UI.
- Future work should resolve GEDCOM 7 `SCHMA` URIs and source citations before expanding the accepted extension vocabulary.
