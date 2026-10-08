/**
 * 24 · replacement parts: the dataset is held to the same standard as the CAD.
 *
 * A substitution table is where hand-waving normally lives, so these assertions
 * are about *claims*, not formatting:
 *
 *   · every option names a maker, a package, a verdict, a reason and a source;
 *   · a "drop-in" must either name the same package as the fitted part or explain
 *     in its own reason why the package does not matter;
 *   · nothing is marked verified when it was not: `confidence: 'unverified'`
 *     requires a `verify` note telling the reader what to check;
 *   · every design referenced is a design that actually builds;
 *   · every part listed as "documented but not built" has a real imported
 *     footprint behind it, so the claim is checkable;
 *   · the xPort Pro conversion table and the interface conversions cite their
 *     sources, because those are the answers to "convert for xPort Pro".
 */

import { suite } from './lib.mjs';
import {
  SUBSTITUTES, DESIGNS, XPORT_CONVERSIONS, INTERFACE_CONVERSIONS,
  DOCUMENTED_NOT_BUILT, substituteRows,
} from '../tools/replacement-parts.mjs';
import { IMPORTED_PACKAGES as IMPORTED } from '../tools/eda-packages.mjs';
import { designNames } from '../tools/build-wallplug-eagle.mjs';

const s = suite('24 · replacement parts and conversions');

const VERDICTS = ['drop-in', 're-rated', 'redesign', 'alternative', 'not-a-substitute'];
const CONFIDENCE = ['datasheet', 'vendor-page', 'open-hardware', 'third-party', 'unverified', 'this-repo'];

/* ------------------------------------------------------------- shape of data */

s.ok('the table covers the whole family', SUBSTITUTES.length >= 20, `${SUBSTITUTES.length} roles`);
s.eq('every design named in the table is a real design',
  [...new Set(SUBSTITUTES.flatMap((g) => g.designs))].filter((d) => !designNames().includes(d)), []);
s.eq('the table\'s design list matches the registry', [...DESIGNS].sort(), designNames().sort());

for (const g of SUBSTITUTES) {
  s.ok(`role "${g.role.slice(0, 46)}…" has options`, (g.options ?? []).length >= 1, `${g.options?.length}`);
  s.ok(`role "${g.role.slice(0, 46)}…" names the fitted part`,
    Boolean(g.fitted?.ref && g.fitted?.package) && Boolean(g.fitted.mpn || g.fitted.mpn === '—'));
}

const rows = substituteRows();
s.eq('flat row count equals the sum of the options', rows.length,
  SUBSTITUTES.reduce((a, g) => a + g.options.length, 0));
s.eq('no row is missing a field',
  rows.filter((r) => !r.mpn || !r.maker || !r.package || !r.verdict || !r.why || !r.source || !r.confidence).length, 0);
s.eq('verdicts come from the documented set',
  [...new Set(rows.map((r) => r.verdict))].filter((v) => !VERDICTS.includes(v)), []);
s.eq('confidence labels come from the documented set',
  [...new Set(rows.map((r) => r.confidence))].filter((c) => !CONFIDENCE.includes(c)), []);
s.eq('every unverified row says what to check',
  rows.filter((r) => r.confidence === 'unverified' && !r.verify).map((r) => r.mpn), []);
s.eq('rows sourced only from this repo say so',
  rows.filter((r) => r.confidence === 'this-repo').filter((r) => !/^this repo:/i.test(r.source)).map((r) => r.mpn), []);
s.ok('the table is honest about how much was verified',
  rows.filter((r) => r.confidence !== 'unverified').length > rows.length * 0.6,
  `${rows.filter((r) => r.confidence !== 'unverified').length}/${rows.length} sourced`);

/* --------------------------------------------------- what "drop-in" may mean */

for (const r of rows.filter((x) => x.verdict === 'drop-in')) {
  const samePackage = r.package === r.fittedPackage ||
    r.package === 'same' || /same/i.test(r.package);
  const explainsPackage = /package|footprint|pin(s|out)?|outline|body/i.test(r.why);
  s.ok(`drop-in "${r.mpn}" matches the fitted package or explains itself`,
    samePackage || explainsPackage, `${r.fittedPackage} → ${r.package}`);
}

/* ---------------------------------------------- sources must be findable */

// a source is findable if it is on the web, in a standard, or in this repo
const SOURCE_OK = (src) => /https?:\/\/|github\.com\/|§|datasheet|Guide|Specification|product page|teardown|JLCPCB|DigiKey|KiCad official|this repo|ISO \d|IEC \d|UL \d|IPC\//i.test(src);
s.eq('every option cites something findable',
  rows.filter((r) => !SOURCE_OK(r.source)).map((r) => `${r.mpn}: ${r.source}`), []);
s.ok('open-hardware claims name a repo path',
  rows.filter((r) => r.confidence === 'open-hardware').every((r) => /github\.com\/\S+/.test(r.source)),
  `${rows.filter((r) => r.confidence === 'open-hardware').length} open-hardware rows`);
const DOC_REF = /§|figure|table|appendix|rev|datasheet|section|guide|brief|manual|IEC|EN ?6|ISO \d|UL \d/i;
s.ok('datasheet claims name a section, figure, table or document',
  rows.filter((r) => r.confidence === 'datasheet').every((r) => DOC_REF.test(r.source)),
  rows.filter((r) => r.confidence === 'datasheet' && !DOC_REF.test(r.source)).map((r) => r.mpn).join(', '));

/* ------------------------------------------- documented but not built */

s.eq('every "documented, not built" part has an imported footprint',
  DOCUMENTED_NOT_BUILT.filter((d) => !(d.package in IMPORTED)).map((d) => d.package), []);
s.ok('each of them says why it is not fitted',
  DOCUMENTED_NOT_BUILT.every((d) => (d.why ?? '').length > 40));

/* ------------------------------------------------- "convert for xPort Pro" */

s.ok('the xPort Pro conversion table covers the part-number matrix',
  XPORT_CONVERSIONS.length >= 5, `${XPORT_CONVERSIONS.length} rows`);
s.eq('every conversion row states what changes on the board',
  XPORT_CONVERSIONS.filter((c) => !c.changes || !c.source || !c.mpn).map((c) => c.mpn), []);
s.ok('the reference build is named', XPORT_CONVERSIONS.some((c) => c.mpn === 'XPP100300S-04R'));
s.ok('flash and SDRAM sizes are recorded where the guide gives them',
  XPORT_CONVERSIONS.filter((c) => c.flash !== '—').every((c) => /MB/.test(c.flash)));
s.ok('the Evolution OS variant is distinguished from Linux',
  XPORT_CONVERSIONS.some((c) => /Evolution/.test(c.os)) && XPORT_CONVERSIONS.some((c) => /Linux/.test(c.os)));
s.ok('the applet-serving web server is mentioned where it belongs',
  XPORT_CONVERSIONS.some((c) => /applet/i.test(c.changes)));

s.eq('every interface conversion names its designs and its how',
  INTERFACE_CONVERSIONS.filter((c) => !c.name || !c.how || !c.why || !c.source ||
    !c.designs?.length || c.designs.some((d) => !designNames().includes(d))).map((c) => c.name), []);
s.ok('the DTE/DCE strap conversion is documented',
  INTERFACE_CONVERSIONS.some((c) => /DTE/.test(c.name) && /JP1/.test(c.how)));
s.ok('the RS-485 conversion names the Integration Guide appendix',
  INTERFACE_CONVERSIONS.some((c) => /RS-485/.test(c.name) && /appendix A/i.test(c.source)));
s.ok('the Green PHY DC-line conversion cites the datasheet note',
  INTERFACE_CONVERSIONS.some((c) => /DC-line/.test(c.name) && /§8\.2/.test(c.source)));
s.ok('the WiMAX → LTE conversion says what has to be fitted',
  INTERFACE_CONVERSIONS.some((c) => /LTE/.test(c.name) && /J4/.test(c.how)));

/* ------------------------------------------------- the honest bits */

s.ok('the table says plainly that WiMAX networks are gone',
  rows.some((r) => r.verdict === 'not-a-substitute' && /museum|gone|shut/i.test(r.why)));
s.ok('the table refuses a transformerless supply',
  rows.some((r) => /dropper/i.test(r.mpn) && r.verdict === 'not-a-substitute'));
s.ok('the table refuses the 5 V RS-232 part on a 3.3 V rail',
  rows.some((r) => r.mpn === 'ADM3202ARW' && r.verdict === 'not-a-substitute'));
s.ok('the table refuses the automotive PLC variant on mains',
  rows.some((r) => /ISE\/ISP/.test(r.mpn) && r.verdict === 'not-a-substitute' && /not designed to work on mains/i.test(r.why)));

process.exit(s.done() ? 1 : 0);
