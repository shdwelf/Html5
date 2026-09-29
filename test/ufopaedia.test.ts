import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * The UFOpaedia is a research artifact, not decoration: the point of the app
 * is that every entry is graded and sourced, and that the two "silent cipher"
 * case files carry their demonstrations rather than just their claims. These
 * tests hold that editorial bar in place.
 */
const APP = resolve(__dirname, "../public/apps/ufopaedia/index.html");

type Entry = {
  id: string; cat: string; title: string; period: string; location: string;
  confidence: string; summary: string; facts: string[];
  sourceLinks: [string, string][]; caution: string; demo?: string;
};

let dom: JSDOM;
let api: {
  ENTRIES: Entry[]; CATEGORIES: string[];
  checkDigitValid: (c: string) => { ok: boolean; why: string };
  checkDigitMake: (p: string[]) => string | null;
  matches: (e: Entry, q: string) => boolean;
};

beforeEach(() => {
  dom = new JSDOM(readFileSync(APP, "utf8"), {
    url: "https://example.test/apps/ufopaedia/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
  });
  api = (dom.window as unknown as { UFOPAEDIA: typeof api }).UFOPAEDIA;
});
afterEach(() => dom.window.close());

describe("UFOpaedia", () => {
  it("boots, exposes its data, and renders a category list", () => {
    expect(api).toBeTruthy();
    expect(api.ENTRIES.length).toBeGreaterThanOrEqual(11);
    expect(api.CATEGORIES).toEqual([
      "ARCHIVED SITES", "PROTECTION MECHANISMS", "EXECUTABLE PACKERS", "CASE FILES", "TERMINOLOGY",
    ]);
    expect(dom.window.document.querySelectorAll("nav .cat").length).toBe(5);
    expect(dom.window.document.querySelector("#count")?.textContent)
      .toBe(String(api.ENTRIES.length));
    // every entry is reachable: its category must be one of the nav categories
    for (const e of api.ENTRIES) expect(api.CATEGORIES).toContain(e.cat);
    expect(new Set(api.ENTRIES.map((e) => e.id)).size).toBe(api.ENTRIES.length);
  });

  it("holds every entry to the graded-and-sourced bar", () => {
    const allowed = new Set(["Primary capture", "Primary artifact", "Secondary"]);
    for (const e of api.ENTRIES) {
      expect(allowed, `${e.id} confidence`).toContain(e.confidence);
      expect(e.facts.length, `${e.id} facts`).toBeGreaterThanOrEqual(5);
      expect(e.sourceLinks.length, `${e.id} sources`).toBeGreaterThanOrEqual(1);
      expect(e.summary.length, `${e.id} summary`).toBeGreaterThanOrEqual(200);
      expect(e.caution.length, `${e.id} caution`).toBeGreaterThanOrEqual(100);
      for (const [label, url] of e.sourceLinks) {
        expect(label.length, `${e.id} link label`).toBeGreaterThan(8);
        expect(url, `${e.id} link url`).toMatch(/^https?:\/\//);
      }
    }
  });

  it("records the source-checks that contradict the popular retellings", () => {
    const asta = api.ENTRIES.find((e) => e.id === "astalavista-box-sk")!;
    const blob = JSON.stringify(asta);
    // attribution taken from the capture, not from secondary summaries
    expect(blob).toContain("Marek Bednar");
    expect(blob).toContain("60000 people daily");
    // the 1994 founding date must be flagged as claimed, not demonstrated
    expect(asta.caution).toMatch(/1994.*claimed, not demonstrated/s);

    // cracks.to is the "famous name the record does not support" entry
    const cracks = api.ENTRIES.find((e) => e.id === "cracks-to")!;
    expect(JSON.stringify(cracks)).toContain("cracks.to is for sale");
    expect(cracks.caution).toMatch(/Absence of evidence is not evidence of absence/);
  });

  it("carries the demonstrations for both silently-failing ciphers", () => {
    const pk = JSON.stringify(api.ENTRIES.find((e) => e.id === "packer-pklite"));
    expect(pk).toMatch(/self-synchronising/i);
    // the wrong key that still produced a byte-identical result
    expect(pk).toContain("0x0118");
    expect(pk).toContain("0x0317");
    expect(pk).toContain("0a3e081f");
    expect(pk).toMatch(/v1\.20/);
    expect(pk).toMatch(/NOT implemented/);

    const scumm = JSON.stringify(api.ENTRIES.find((e) => e.id === "case-scumm"));
    expect(scumm).toContain("0x69");
    expect(scumm).toContain("0xFF");
    expect(scumm).toContain("col-offi");
    expect(scumm).toMatch(/10 for 10/);
  });

  it("keeps contested and negative findings honest", () => {
    const ghost = api.ENTRIES.find((e) => e.id === "case-ghost")!;
    expect(ghost.confidence).toBe("Secondary");
    expect(ghost.caution).toMatch(/SINGLE-SOURCED AND CONTESTED/);
    expect(JSON.stringify(ghost)).toMatch(/not \(yet\) reverse-engineered/);

    // the X-COM easter-egg hunt found nothing and must say so
    const xcom = api.ENTRIES.find((e) => e.id === "case-xcom")!;
    expect(JSON.stringify(xcom)).toMatch(/NULL RESULT/);
    expect(xcom.caution).toMatch(/negative finding/);
  });

  it("ships no keys: the demonstrator scheme is invented and self-declared", () => {
    const demo = api.ENTRIES.find((e) => e.id === "checkdigit-demo")!;
    expect(demo.demo).toBe("checkdigit");
    expect(JSON.stringify(demo)).toMatch(/invented for this page/);
    expect(demo.caution).toMatch(/guards no software/);

    // no entry may present itself as supplying a real key or serial
    for (const e of api.ENTRIES) {
      expect(JSON.stringify(e), `${e.id}`).not.toMatch(/here is a (valid )?(serial|key) for/i);
    }
    expect(dom.window.document.querySelector("footer")?.textContent)
      .toMatch(/no keys, no serials and no working keygen/);
  });

  it("the check-digit demonstrator actually validates and inverts", () => {
    // generation is the validator solved backwards — so it must round-trip
    const made = api.checkDigitMake(["DEAD", "BEEF", "0000", "1111"]);
    expect(made).toBeTruthy();
    expect(api.checkDigitValid(made!).ok).toBe(true);

    // and the rule must actually reject things, or it proves nothing
    expect(api.checkDigitValid("DEAD-BEEF-0000-1111-FFFF").ok).toBe(false);
    expect(api.checkDigitValid("DEAD-BEEF-0000-1111").ok).toBe(false);
    expect(api.checkDigitValid("DEAD-BEEF-0000-1111-ZZZZ").why).toMatch(/4 hex digits/);
    expect(api.checkDigitValid("").why).toMatch(/5 groups/);
  });

  it("search filters across facts and sources, not just titles", () => {
    const e = api.ENTRIES.find((x) => x.id === "packer-lzexe")!;
    expect(api.matches(e, "bellard")).toBe(true);      // author, only in facts/links
    expect(api.matches(e, "0x5B30")).toBe(true);       // the frozen constant, in a fact
    expect(api.matches(e, "lzexe 0.91")).toBe(true);
    expect(api.matches(e, "norton ghost")).toBe(false);

    const q = dom.window.document.querySelector("#q") as HTMLInputElement;
    q.value = "barnett";
    q.dispatchEvent(new dom.window.Event("input"));
    expect(dom.window.document.querySelector("main")?.textContent)
      .toMatch(/demo that shipped the whole game/);
  });

  it("navigates into an entry and back", () => {
    const doc = dom.window.document;
    const first = doc.querySelector(".item") as HTMLElement;
    expect(first).toBeTruthy();
    first.click();
    expect(doc.querySelector("h2")?.textContent).toContain("astalavista.box.sk");
    expect(doc.querySelector(".caution")?.textContent).toMatch(/CAUTION/);
    expect(doc.querySelectorAll("a[href^='http']").length).toBeGreaterThan(0);
    (doc.querySelector("#back") as HTMLElement).click();
    expect(doc.querySelectorAll(".item").length).toBeGreaterThan(1);
  });
});
