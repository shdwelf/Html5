/** Resolve which containment theater is live. */

export const CATALOG = [
  { id: "stx", label: "ST. CROIX", href: "./index.html#grid" },
  { id: "la", label: "LOUISIANA", href: "./index.html?site=la#grid" },
  { id: "ww", label: "WRIGHTWOOD", href: "./index.html?site=ww#grid" },
  { id: "dalton", label: "DALTON CYN", href: "./index.html?site=dalton#grid" },
  { id: "iv", label: "ISLA VISTA", href: "./index.html?site=iv#grid" },
];

export function resolveSite() {
  const q = new URLSearchParams(location.search).get("site");
  if (q && CATALOG.some((c) => c.id === q)) return q;
  if (/louisiana/.test(location.pathname)) return "la";
  if (/wrightwood/.test(location.pathname)) return "ww";
  if (/dalton/.test(location.pathname)) return "dalton";
  if (/isla|ivista/.test(location.pathname)) return "iv";
  return "stx";
}
