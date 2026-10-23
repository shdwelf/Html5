/**
 * warrick-plan.js — Warrick-method recovery plans for lost websites (T12.1).
 *
 * Warrick (McCown & Nelson, Old Dominion University; JCDL 2006, CACM 2009)
 * reconstructs a lost site from the web infrastructure: seed URL in,
 * archived copies (mementos) out, recursing through links found in
 * recovered HTML, limited to URLs at or beneath the seed. The current
 * implementation (oduwsdl/warrick) discovers mementos via Memento
 * (RFC 7089) TimeMaps; the Internet Archive's CDX index is the stable
 * per-archive fallback.
 *
 * This module only PLANS a recovery — it builds the query URLs, scope
 * rules, log format and packaging manifest. It never touches the network:
 * in this repo, external fetching runs through the fetch-runner/capture
 * channel, and a plan is the reviewable artifact that precedes any run.
 *
 * Hard limits, encoded rather than assumed away (they are Warrick's own):
 * uncrawled, robots-blocked, login-walled, JS/Flash-driven and deep-web
 * resources have no mementos; server-side logic is never recoverable;
 * .onion sites are unrecoverable by design and are refused as seeds.
 */

const WAYBACK_CDX = "https://web.archive.org/cdx/search/cdx";
const MEMENTO_AGGREGATOR = "https://timetravel.mementoweb.org/api/json";

function checkSeed(raw) {
  let u;
  try { u = new URL(raw); } catch { throw new Error("Seed is not a valid URL: " + raw); }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Seeds must be http(s) URLs: " + raw);
  if (u.username || u.password) throw new Error("Seeds must not carry credentials: " + raw);
  if (u.hostname.endsWith(".onion")) {
    throw new Error("Refusing .onion seed — onion services leave no web-archive mementos, so a Warrick recovery is impossible by design: " + raw);
  }
  return u;
}

/** Wayback CDX enumeration query: 200-status captures, one per content digest. */
export function waybackCdxUrl(seed, { from = null, to = null } = {}) {
  const q = new URLSearchParams({
    url: seed,
    output: "json",
    filter: "statuscode:200",
    collapse: "digest",
  });
  if (from) q.set("from", String(from));
  if (to) q.set("to", String(to));
  return `${WAYBACK_CDX}?${q.toString()}`;
}

/** Memento aggregator TimeMap query (endpoint has moved before; CDX is canonical). */
export function mementoTimeMapUrl(seed, timestamp = "") {
  return `${MEMENTO_AGGREGATOR}/${timestamp}/${seed}`;
}

/** Warrick's scope rule: only the seed itself and URLs beneath it. */
export function inScope(seed, candidate) {
  const s = new URL(seed);
  const c = new URL(candidate);
  if (c.protocol !== s.protocol || c.hostname !== s.hostname || (c.port || "") !== (s.port || "")) return false;
  const base = s.pathname.endsWith("/") ? s.pathname : s.pathname + "/";
  return c.pathname === s.pathname || c.pathname.startsWith(base);
}

/** One recovery-log line, in Warrick's original three-part format. */
export function recoveryLogLine(original, memento, localFile) {
  return `${original} => ${memento} => ${localFile}`;
}

export function buildRecoveryPlan(seeds, { from = null, to = null, targetDate = null, targetDir = "recovered", waitSeconds = 2 } = {}) {
  if (!Array.isArray(seeds) || seeds.length === 0) throw new Error("A recovery plan needs at least one seed URL");
  const checked = seeds.map((s) => checkSeed(s).href);
  return {
    tool: "warrick-method",
    planVersion: 1,
    mode: "plan-only — no network access is performed by this artifact",
    targetDir,
    politeness: {
      waitSecondsBetweenRequests: waitSeconds,
      respectArchiveRateLimits: true,
      repeatRunsOverDays: "Warrick yields grow when re-run over days/weeks as archive holdings fluctuate; run as soon as possible after a loss, before search caches refresh",
    },
    seeds: checked.map((seed) => ({
      seed,
      scope: "seed URL and everything beneath it (Warrick scope rule)",
      discovery: [
        { kind: "memento-timemap", url: mementoTimeMapUrl(seed, targetDate || "") },
        { kind: "wayback-cdx", url: waybackCdxUrl(seed, { from, to }) },
      ],
      passes: [
        "fetch the capture closest to the target date for the seed",
        "mine recovered HTML for links; enqueue in-scope URLs only",
        "repeat until the queue empties; log every resource, FAILED lines included",
      ],
      logFile: `${targetDir}/${new URL(seed).hostname}_recoveryLog.out`,
      logFormat: "ORIGINAL URI => MEMENTO URI => LOCAL FILE",
      resumeFile: `${targetDir}/${new URL(seed).hostname}.save`,
    })),
    packaging: {
      format: "BagIt 1.0 (RFC 8493) — the house preservation format",
      manifest: "recovered tree + recovery log + a mapping table (original, memento, local file, sha256) as bag metadata",
      branding: "strip archive branding/headers from recovered resources (Warrick -nB default)",
    },
    knownLimits: [
      "pages never crawled, robots-blocked, login-walled, or driven by JS/Flash/session state have no mementos and cannot be recovered",
      "only the client-side view is recoverable — CGI/scripts/databases behind the pages are gone with the server",
      ".onion and other deep-web seeds are refused: no mementos exist by design",
      "the Internet Archive leg lags months behind the live web; very recent losses lean on search-engine caches, which expire in days",
    ],
  };
}
