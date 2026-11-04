import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const html = readFileSync(new URL("contacts.html", root), "utf8");

function waitFor(predicate, timeout = 1000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (predicate()) return resolve();
      if (Date.now() - started > timeout) return reject(new Error("Timed out waiting for the local contacts UI."));
      setTimeout(check, 5);
    };
    check();
  });
}

test("Local Directory Desk boots, saves a contact locally, and filters it", async (t) => {
  let JSDOM;
  let IDBFactory;
  try {
    ({ JSDOM } = await import("jsdom"));
    ({ IDBFactory } = await import("fake-indexeddb"));
  } catch (error) {
    t.skip(`optional browser DOM dependencies are not installed: ${error.message}`);
    return;
  }
  const dom = new JSDOM(html, { url: "http://localhost/contacts.html", pretendToBeVisual: true });
  const { window } = dom;
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.indexedDB = new IDBFactory();
  globalThis.Option = window.Option;
  globalThis.FormData = window.FormData;
  Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true });

  try {
    await import(`../js/local-contacts-app.js?dom-test=${Date.now()}`);
    await waitFor(() => window.document.querySelector("#saveStatus").textContent === "LOCAL INDEX READY");

    const form = window.document.querySelector("#contactForm");
    form.elements.namedItem("name").value = "Ada Lovelace";
    form.elements.namedItem("kind").value = "person";
    form.elements.namedItem("city").value = "London";
    form.elements.namedItem("postalCode").value = "00123";
    form.elements.namedItem("sourceTitle").value = "Sample 1950 directory";
    form.elements.namedItem("sourceYear").value = "1950";
    form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

    await waitFor(() => window.document.querySelector("#recordCount").textContent === "1");
    assert.equal(window.document.querySelector("#saveStatus").textContent, "LOCAL SAVE COMPLETE");
    assert.equal(window.document.querySelector("#contactId").value.length > 0, true);

    const sourceTitle = window.document.querySelector("#importSourceTitle");
    sourceTitle.value = "Imported directory fixture";
    window.document.querySelector("#importSourceYear").value = "1930";
    window.document.querySelector("#importSourceRights").value = "Synthetic test fixture";
    window.document.querySelector("#importPermission").checked = true;
    const fileInput = window.document.querySelector("#importFile");
    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [{
        name: "directory.csv",
        size: 256,
        text: async () => [
          "Name,City,ZIP,Record Type,Company,Event,Booth Number,Product Category,Badge Scan Date",
          "Grace Hopper,Boston,02108,Person,,General directory,,,",
          "Acme Instruments,,,Business,Acme Instruments,MD&M West,0174,Precision sensors,2020-02-11 10:42",
        ].join("\n"),
      }],
    });
    fileInput.dispatchEvent(new window.Event("change", { bubbles: true }));
    await waitFor(() => !window.document.querySelector("#importButton").disabled);
    assert.match(window.document.querySelector("#importPreview").textContent, /READY: 2/);
    window.document.querySelector("#importButton").click();
    await waitFor(() => window.document.querySelector("#recordCount").textContent === "3");

    const search = window.document.querySelector("#searchInput");
    search.value = "grace boston";
    search.dispatchEvent(new window.Event("input", { bubbles: true }));
    assert.match(window.document.querySelector("#searchCount").textContent, /1 match/);
    assert.equal(window.document.querySelectorAll(".result-card").length, 1);
    assert.match(window.document.querySelector(".result-name").textContent, /Grace Hopper/);

    window.document.querySelector(".result-card").click();
    assert.equal(form.elements.namedItem("postalCode").value, "02108");
    assert.equal(form.elements.namedItem("sourceYear").value, "1930");
    assert.equal(form.elements.namedItem("sourceTitle").value, "Imported directory fixture");

    search.value = "precision";
    search.dispatchEvent(new window.Event("input", { bubbles: true }));
    window.document.querySelector("#kindFilter").value = "business";
    window.document.querySelector("#kindFilter").dispatchEvent(new window.Event("change", { bubbles: true }));
    window.document.querySelector("#eventFilter").value = "MD&M West";
    window.document.querySelector("#eventFilter").dispatchEvent(new window.Event("change", { bubbles: true }));
    assert.match(window.document.querySelector("#searchCount").textContent, /1 match/);
    window.document.querySelector(".result-card").click();
    assert.equal(form.elements.namedItem("booth").value, "0174");
    assert.equal(form.elements.namedItem("productCategory").value, "Precision sensors");
    assert.equal(form.elements.namedItem("scanDate").value, "2020-02-11 10:42");
  } finally {
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.indexedDB;
    delete globalThis.Option;
    delete globalThis.FormData;
  }
});
