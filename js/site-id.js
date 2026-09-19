/** Resolve which containment theater is live. */

export const CATALOG = [
  { id: "stx", label: "ST. CROIX", href: "./index.html#grid" },
  { id: "la", label: "LOUISIANA", href: "./index.html?site=la#grid" },
  { id: "ww", label: "WRIGHTWOOD", href: "./index.html?site=ww#grid" },
  { id: "dalton", label: "DALTON CYN", href: "./index.html?site=dalton#grid" },
  { id: "iv", label: "ISLA VISTA", href: "./index.html?site=iv#grid" },
];

export function resolveSite() {
  try {
    if (typeof location === "undefined" || !location) return "stx";
    const search = location.search || "";
    const pathname = location.pathname || "";
    const q = new URLSearchParams(search).get("site");
    if (q && CATALOG.some((c) => c.id === q)) return q;
    if (/louisiana/.test(pathname)) return "la";
    if (/wrightwood/.test(pathname)) return "ww";
    if (/dalton/.test(pathname)) return "dalton";
    if (/isla|ivista/.test(pathname)) return "iv";
    return "stx";
  } catch {
    return "stx";
  }
}
