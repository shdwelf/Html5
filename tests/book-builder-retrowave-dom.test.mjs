import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../book-builder.html", import.meta.url), "utf8");
const helper = readFileSync(new URL("../js/book-builder-retrowave.js", import.meta.url), "utf8");
const builder = readFileSync(new URL("../js/book-builder.js", import.meta.url), "utf8");

function openBuilder(t, timeline) {
  const dom = new JSDOM(html, {
    url: "https://book-builder.test/",
    runScripts: "outside-only",
    pretendToBeVisual: true
  });
  const { window } = dom;
  const contexts = new WeakMap();

  window.confirm = () => true;
  window.alert = (message) => { throw new Error(String(message)); };
  window.Element.prototype.scrollIntoView = function () {};
  window.HTMLCanvasElement.prototype.getContext = function () {
    if (contexts.has(this)) return contexts.get(this);
    const context = {
      canvas: this,
      calls: [],
      fillRect(...args) { this.calls.push(["fillRect", ...args]); },
      clearRect(...args) { this.calls.push(["clearRect", ...args]); },
      createLinearGradient() { return { addColorStop() {} }; },
      createRadialGradient() { return { addColorStop() {} }; },
      measureText(value) { return { width: String(value).length * 6 }; }
    };
    const proxy = new Proxy(context, {
      get(target, property) {
        if (property in target) return target[property];
        return () => {};
      },
      set(target, property, value) {
        target[property] = value;
        return true;
      }
    });
    contexts.set(this, proxy);
    return proxy;
  };
  if (timeline) {
    window.localStorage.setItem("sitek-book-builder-google-timeline-v1", JSON.stringify(timeline));
  }
  window.eval(helper);
  window.eval(builder);
  t.after(() => window.close());
  return { window, contexts };
}

const routeFixture = {
  files: ["fixture.json"],
  importedAt: "",
  places: [{ id: "gtl-place-1", name: "Route start", lat: 34.05, lon: -118.25 }],
  events: [{
    id: "gtl-event-1",
    placeId: "",
    routeId: "gtl-path-1",
    label: "2025-01-01 · Test route",
    note: "fixture",
    startTime: "2025-01-01T00:00:00Z",
    endTime: "2025-01-01T00:10:00Z"
  }],
  paths: [{
    id: "gtl-path-1",
    label: "Fixture route",
    mode: "Drive",
    note: "fixture path",
    startTime: "2025-01-01T00:00:00Z",
    endTime: "2025-01-01T00:10:00Z",
    points: [{ lat: 34.05, lon: -118.25 }, { lat: 34.15, lon: -117.85 }]
  }],
  stats: {
    formats: ["semanticSegments"], files: 1, visits: 0, activities: 1,
    pathSegments: 1, routeCount: 1, pathPointCount: 2, placeCount: 1,
    eventCount: 1, rawPlaceCount: 1, rawEventCount: 1, rawRouteCount: 1
  }
};

test("Book Builder renders the 2003 memory separately from the mapped 2004 resume job", (t) => {
  const { window } = openBuilder(t);
  window.document.querySelector('[data-panel="map"]').click();
  const cards = Array.from(window.document.querySelectorAll("#timelineLane .timeline-item"));
  const car = cards.find((card) => card.dataset.timelineId === "milestone-seed-corolla-truck-swap-2003");
  const job = cards.find((card) => card.dataset.timelineId === "channel-data-systems-2004");
  assert.ok(car, "2003 car-swap memory is present on the timeline");
  assert.equal(car.dataset.timelineYear, "2003");
  assert.equal(car.dataset.placeId, undefined, "unknown summer-place location is not mapped");
  assert.ok(job, "resume-dated Channel Data Systems job is separate");
  assert.equal(job.dataset.timelineYear, "2004");
  assert.equal(job.dataset.placeId, "channel-data-systems");
  assert.ok(cards.indexOf(car) < cards.indexOf(job), "the 2003 recollection precedes the 2004 role");
  assert.equal(window.document.querySelector("#playGoogleRouteBtn").disabled, true);
  window.document.querySelector("#playPersonalTimelineBtn").click();
  assert.match(window.document.querySelector("#timelinePlaybackStatus").textContent, /EVENT 1\/\d+ · 1982/);
  window.document.querySelector("#stopPersonalTimelineBtn").click();
});

test("selected imported routes animate a pixel marker and can be stopped", async (t) => {
  const { window, contexts } = openBuilder(t, routeFixture);
  window.document.querySelector('[data-panel="map"]').click();
  const play = window.document.querySelector("#playGoogleRouteBtn");
  const stop = window.document.querySelector("#stopGoogleRouteBtn");
  const overlay = window.document.querySelector("#routeAnimationCanvas");
  const map = window.document.querySelector("#researchMap");
  assert.equal(play.disabled, false);
  assert.deepEqual([overlay.width, overlay.height], [map.width, map.height]);

  play.click();
  await new Promise((resolve) => window.setTimeout(resolve, 120));
  assert.match(window.document.querySelector("#routePlaybackStatus").textContent, /PLAYING · Fixture route/);
  assert.match(window.document.querySelector("#mapDetail").textContent, /Fixture route/);
  assert.equal(stop.disabled, false);
  assert.ok(contexts.get(overlay).calls.filter(([name]) => name === "fillRect").length >= 2, "pixel marker drew on the overlay canvas");

  stop.click();
  assert.equal(stop.disabled, true);
  assert.equal(window.document.querySelector("#routePlaybackStatus").textContent, "Route playback stopped.");
});
