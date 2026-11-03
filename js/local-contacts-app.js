import {
  CONTACT_FIELDS,
  contactsToBackup,
  contactsToCsv,
  makeContactId,
  normalizeContact,
  parseDirectoryText,
  searchContacts,
  sourceLabel,
  sourceSummary,
  validateContact,
} from "./local-contacts-core.js";

const DB_NAME = "sitek-local-directory-v1";
const DB_VERSION = 1;
const STORE_NAME = "contacts";
const MAX_IMPORT_BYTES = 50 * 1024 * 1024;
const MAX_IMPORT_RECORDS = 100_000;
const MAX_VISIBLE_RESULTS = 100;

const $ = (selector) => document.querySelector(selector);
const ui = {
  recordCount: $("#recordCount"),
  sourceCount: $("#sourceCount"),
  saveStatus: $("#saveStatus"),
  searchInput: $("#searchInput"),
  yearFilter: $("#yearFilter"),
  sourceFilter: $("#sourceFilter"),
  searchCount: $("#searchCount"),
  contactResults: $("#contactResults"),
  newContactButton: $("#newContactButton"),
  contactForm: $("#contactForm"),
  contactId: $("#contactId"),
  editorTitle: $("#editorTitle"),
  editorMessage: $("#editorMessage"),
  deleteContactButton: $("#deleteContactButton"),
  importFile: $("#importFile"),
  importSourceTitle: $("#importSourceTitle"),
  importSourceEdition: $("#importSourceEdition"),
  importSourceYear: $("#importSourceYear"),
  importSourceUrl: $("#importSourceUrl"),
  importSourceRights: $("#importSourceRights"),
  importPermission: $("#importPermission"),
  importMode: $("#importMode"),
  importButton: $("#importButton"),
  importStatus: $("#importStatus"),
  importPreview: $("#importPreview"),
  templateButton: $("#templateButton"),
  exportJsonButton: $("#exportJsonButton"),
  exportCsvButton: $("#exportCsvButton"),
  clearAllButton: $("#clearAllButton"),
  storageLabel: $("#storageLabel"),
  storageDetail: $("#storageDetail"),
};

let database;
let contacts = [];
let selectedId = "";
let stagedImport = null;

function setMessage(element, text, kind = "") {
  element.textContent = text;
  if (kind) element.dataset.kind = kind;
  else delete element.dataset.kind;
}

function setSaveStatus(text, kind = "") {
  ui.saveStatus.textContent = text;
  if (kind) ui.saveStatus.dataset.kind = kind;
  else delete ui.saveStatus.dataset.kind;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error("This browser does not provide IndexedDB local storage."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("byName", "name", { unique: false });
        store.createIndex("byYear", "sourceYear", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open the local database."));
    request.onblocked = () => reject(new Error("The local database is busy in another tab. Close older Directory Desk tabs and retry."));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error || new Error("The local database transaction was aborted."));
    transaction.onerror = () => reject(transaction.error || new Error("The local database transaction failed."));
  });
}

function readAllContacts() {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error("Could not read local records."));
    transaction.onabort = () => reject(transaction.error || new Error("The local database read was aborted."));
  });
}

async function writeContact(contact) {
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).put(contact);
  await transactionDone(transaction);
}

async function removeContact(id) {
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).delete(id);
  await transactionDone(transaction);
}

async function writeImportedContacts(imported, mode) {
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  if (mode === "replace") store.clear();
  for (const contact of imported) store.put(contact);
  await transactionDone(transaction);
}

async function clearDatabase() {
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).clear();
  await transactionDone(transaction);
}

function formatLocation(contact) {
  const town = [contact.city, contact.region].filter(Boolean).join(", ");
  const postal = [town, contact.postalCode].filter(Boolean).join(" ");
  return [contact.address1, postal, contact.countryCode].filter(Boolean).join(" · ");
}

function makeResultCard(contact) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "result-card";
  button.dataset.id = contact.id;
  button.setAttribute("aria-current", contact.id === selectedId ? "true" : "false");

  const name = document.createElement("span");
  name.className = "result-name";
  name.textContent = contact.name || "(unnamed listing)";
  button.append(name);

  const detail = document.createElement("span");
  detail.className = "result-detail";
  detail.textContent = contact.organization || formatLocation(contact) || contact.phone || "No location detail";
  button.append(detail);

  const meta = document.createElement("span");
  meta.className = "result-meta";
  const metaParts = [sourceLabel(contact), contact.page ? `PAGE ${contact.page}` : ""].filter(Boolean);
  meta.textContent = metaParts.join(" / ");
  button.append(meta);
  button.addEventListener("click", () => showContact(contact));
  return button;
}

function getFilteredContacts() {
  return searchContacts(contacts, ui.searchInput.value, {
    year: ui.yearFilter.value,
    source: ui.sourceFilter.value,
  });
}

function renderFilters() {
  const previousYear = ui.yearFilter.value;
  const previousSource = ui.sourceFilter.value;
  const years = [...new Set(contacts.map((contact) => contact.sourceYear).filter(Boolean))]
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  const sources = sourceSummary(contacts);

  ui.yearFilter.replaceChildren(new Option("All years", ""));
  for (const year of years) ui.yearFilter.add(new Option(year, year));
  ui.sourceFilter.replaceChildren(new Option("All sources", ""));
  for (const source of sources) ui.sourceFilter.add(new Option(source.label, source.key));

  if (years.includes(previousYear)) ui.yearFilter.value = previousYear;
  if (sources.some((source) => source.key === previousSource)) ui.sourceFilter.value = previousSource;
}

function renderResults() {
  const matches = getFilteredContacts();
  const shown = matches.slice(0, MAX_VISIBLE_RESULTS);
  const fragment = document.createDocumentFragment();
  if (!shown.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = contacts.length
      ? "No entries match these search terms and filters."
      : "No directory entries yet. Import a file below to build your local index.";
    fragment.append(empty);
  } else {
    for (const contact of shown) fragment.append(makeResultCard(contact));
  }
  ui.contactResults.replaceChildren(fragment);
  ui.searchCount.textContent = matches.length > MAX_VISIBLE_RESULTS
    ? `${MAX_VISIBLE_RESULTS} of ${matches.length.toLocaleString()} matches`
    : `${matches.length.toLocaleString()} ${matches.length === 1 ? "match" : "matches"}`;
}

function renderMetrics() {
  const sources = sourceSummary(contacts);
  ui.recordCount.textContent = contacts.length.toLocaleString();
  ui.sourceCount.textContent = sources.length.toLocaleString();
  ui.storageLabel.textContent = contacts.length
    ? `${contacts.length.toLocaleString()} record${contacts.length === 1 ? "" : "s"} in this browser`
    : "Browser database ready";
  ui.storageDetail.textContent = "Saved to this site's browser storage; not encrypted or synced. Export a backup before clearing browser data.";
  ui.exportJsonButton.disabled = contacts.length === 0;
  ui.exportCsvButton.disabled = contacts.length === 0;
  ui.clearAllButton.disabled = contacts.length === 0;
}

function render() {
  renderMetrics();
  renderFilters();
  renderResults();
}

function showContact(contact) {
  selectedId = contact?.id || "";
  ui.contactId.value = selectedId;
  for (const field of CONTACT_FIELDS) {
    const control = ui.contactForm.elements.namedItem(field);
    if (control) control.value = contact?.[field] ?? (field === "kind" ? "person" : "");
  }
  ui.editorTitle.textContent = contact ? "Directory record" : "New contact card";
  ui.deleteContactButton.hidden = !contact;
  setMessage(ui.editorMessage, contact ? "Changes are stored only after you save." : "Add a listing, then save it to this browser.");
  renderResults();
}

async function refreshContacts() {
  contacts = await readAllContacts();
  contacts.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" }));
  render();
}

function formContact() {
  const values = Object.fromEntries(new FormData(ui.contactForm).entries());
  return normalizeContact(values);
}

ui.contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!ui.contactForm.reportValidity()) return;
  const contact = formContact();
  const errors = validateContact(contact);
  if (errors.length) {
    setMessage(ui.editorMessage, errors.join(" "), "error");
    return;
  }
  contact.id = ui.contactId.value || makeContactId();
  try {
    setSaveStatus("SAVING…");
    await writeContact(contact);
    selectedId = contact.id;
    await refreshContacts();
    showContact(contact);
    setSaveStatus("LOCAL SAVE COMPLETE");
    setMessage(ui.editorMessage, "Record saved to this browser.", "success");
  } catch (error) {
    setSaveStatus("SAVE FAILED", "error");
    setMessage(ui.editorMessage, error.message || "Could not save this record.", "error");
  }
});

ui.newContactButton.addEventListener("click", () => showContact(null));

ui.deleteContactButton.addEventListener("click", async () => {
  if (!selectedId) return;
  const contact = contacts.find((item) => item.id === selectedId);
  if (!window.confirm(`Delete “${contact?.name || "this record"}” from this browser? This does not affect the source directory.`)) return;
  try {
    await removeContact(selectedId);
    selectedId = "";
    await refreshContacts();
    showContact(null);
    setMessage(ui.editorMessage, "Record deleted from this browser.", "success");
    setSaveStatus("LOCAL SAVE COMPLETE");
  } catch (error) {
    setMessage(ui.editorMessage, error.message || "Could not delete this record.", "error");
  }
});

ui.searchInput.addEventListener("input", renderResults);
ui.yearFilter.addEventListener("change", renderResults);
ui.sourceFilter.addEventListener("change", renderResults);

function getImportDefaults() {
  return {
    sourceTitle: ui.importSourceTitle.value.trim(),
    sourceEdition: ui.importSourceEdition.value.trim(),
    sourceYear: ui.importSourceYear.value.trim(),
    sourceUrl: ui.importSourceUrl.value.trim(),
    sourceRights: ui.importSourceRights.value.trim(),
  };
}

function importReady() {
  return Boolean(
    stagedImport
    && stagedImport.preview.contacts.length
    && ui.importPermission.checked
    && ui.importSourceTitle.value.trim()
    && ui.importSourceRights.value.trim()
    && stagedImport.preview.contacts.length <= MAX_IMPORT_RECORDS
  );
}

function refreshImportButton() {
  ui.importButton.disabled = !importReady();
}

function showImportPreview(preview, fileName) {
  const skipped = preview.issues.length;
  const details = [
    `FILE: ${fileName}`,
    `ROWS: ${preview.totalRows.toLocaleString()}`,
    `READY: ${preview.contacts.length.toLocaleString()}`,
    `SKIPPED: ${skipped.toLocaleString()} (missing or invalid required fields)`,
    `COLUMNS: ${preview.headers.slice(0, 12).join(", ") || "none detected"}`,
  ];
  if (skipped) {
    details.push("", "FIRST ISSUES:");
    for (const issue of preview.issues.slice(0, 4)) details.push(`Row ${issue.row}: ${issue.messages.join(" ")}`);
    if (skipped > 4) details.push(`…and ${skipped - 4} more skipped row(s).`);
  }
  ui.importPreview.textContent = details.join("\n");
  ui.importPreview.hidden = false;
  const overLimit = preview.contacts.length > MAX_IMPORT_RECORDS;
  setMessage(
    ui.importStatus,
    overLimit
      ? `This file has more than ${MAX_IMPORT_RECORDS.toLocaleString()} usable records. Split it into smaller editions or files.`
      : `${preview.contacts.length.toLocaleString()} usable record${preview.contacts.length === 1 ? "" : "s"} ready. Duplicate listings are kept; nothing is auto-merged.`,
    overLimit ? "error" : "",
  );
  refreshImportButton();
}

ui.importFile.addEventListener("change", async () => {
  stagedImport = null;
  ui.importButton.disabled = true;
  ui.importPreview.hidden = true;
  const file = ui.importFile.files?.[0];
  if (!file) {
    setMessage(ui.importStatus, "Choose a file to preview its rows.");
    return;
  }
  if (file.size > MAX_IMPORT_BYTES) {
    setMessage(ui.importStatus, "This file is larger than the 50 MB limit. Split it into smaller files and import them one at a time.", "error");
    return;
  }
  try {
    setSaveStatus("READING FILE…");
    const text = await file.text();
    const format = file.name.toLowerCase().endsWith(".json") ? "json" : "csv";
    const preview = parseDirectoryText(text, { format });
    stagedImport = { text, format, fileName: file.name, preview };
    showImportPreview(preview, file.name);
    setSaveStatus("LOCAL INDEX READY");
  } catch (error) {
    setMessage(ui.importStatus, error.message || "Could not read this file.", "error");
    setSaveStatus("IMPORT PREVIEW FAILED", "error");
  }
});

for (const control of [ui.importSourceTitle, ui.importSourceRights, ui.importPermission]) {
  control.addEventListener("input", refreshImportButton);
  control.addEventListener("change", refreshImportButton);
}

ui.importButton.addEventListener("click", async () => {
  if (!stagedImport || !importReady()) return;
  const mode = ui.importMode.value;
  if (mode === "replace") {
    if (!window.confirm(`Replace all ${contacts.length.toLocaleString()} existing records with this import?`)) return;
    if (!window.confirm("This replaces the complete local collection in this browser. Continue?")) return;
  }
  try {
    const parsed = parseDirectoryText(stagedImport.text, {
      format: stagedImport.format,
      defaults: getImportDefaults(),
    });
    if (!parsed.contacts.length) throw new Error("There are no usable contact rows to import.");
    const usedIds = new Set();
    const imported = parsed.contacts.map((contact) => {
      let id = mode === "replace" ? contact.id : "";
      if (!id || usedIds.has(id)) id = makeContactId();
      usedIds.add(id);
      return { ...contact, id };
    });
    if (imported.length > MAX_IMPORT_RECORDS) throw new Error(`Limit is ${MAX_IMPORT_RECORDS.toLocaleString()} records per import.`);
    setSaveStatus("IMPORTING LOCALLY…");
    await writeImportedContacts(imported, mode);
    await refreshContacts();
    selectedId = "";
    showContact(null);
    ui.importFile.value = "";
    stagedImport = null;
    ui.importPreview.hidden = true;
    ui.importButton.disabled = true;
    setMessage(ui.importStatus, `${imported.length.toLocaleString()} record${imported.length === 1 ? "" : "s"} ${mode === "replace" ? "replaced the collection" : "added to the collection"}. Duplicates were preserved.`, "success");
    setSaveStatus("LOCAL SAVE COMPLETE");
  } catch (error) {
    setMessage(ui.importStatus, error.message || "Import failed; the previous collection was left in place.", "error");
    setSaveStatus("IMPORT FAILED", "error");
  }
});

ui.templateButton.addEventListener("click", () => {
  const csv = contactsToCsv([]);
  downloadFile(csv, "historical-directory-template.csv", "text/csv;charset=utf-8");
});

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function dateSuffix() {
  return new Date().toISOString().slice(0, 10);
}

ui.exportJsonButton.addEventListener("click", () => {
  const backup = contactsToBackup(contacts, new Date().toISOString());
  downloadFile(JSON.stringify(backup, null, 2), `local-directory-backup-${dateSuffix()}.json`, "application/json;charset=utf-8");
});

ui.exportCsvButton.addEventListener("click", () => {
  downloadFile(contactsToCsv(contacts), `local-directory-contacts-${dateSuffix()}.csv`, "text/csv;charset=utf-8");
});

ui.clearAllButton.addEventListener("click", async () => {
  if (!contacts.length) return;
  if (!window.confirm(`Delete all ${contacts.length.toLocaleString()} records from this browser?`)) return;
  if (!window.confirm("This clears the entire local collection. Export a backup first if you may need these records.")) return;
  try {
    await clearDatabase();
    contacts = [];
    selectedId = "";
    render();
    showContact(null);
    setSaveStatus("LOCAL COLLECTION CLEARED");
    setMessage(ui.importStatus, "The local collection is empty. The source files are unchanged.", "success");
  } catch (error) {
    setSaveStatus("CLEAR FAILED", "error");
    setMessage(ui.importStatus, error.message || "Could not clear the local collection.", "error");
  }
});

async function start() {
  try {
    database = await openDatabase();
    database.onversionchange = () => {
      database.close();
      setSaveStatus("DATABASE UPDATED · RELOAD THIS PAGE");
    };
    await refreshContacts();
    showContact(null);
    setSaveStatus("LOCAL INDEX READY");
  } catch (error) {
    setSaveStatus("LOCAL STORAGE UNAVAILABLE", "error");
    ui.storageLabel.textContent = "Could not open browser storage";
    ui.storageDetail.textContent = `${error.message} Use a modern browser and an installed or local web origin, then reload.`;
    setMessage(ui.editorMessage, "This browser session cannot save records until local storage is available.", "error");
    ui.contactForm.querySelectorAll("input, select, textarea, button[type=submit]").forEach((control) => { control.disabled = true; });
    ui.importFile.disabled = true;
    ui.importButton.disabled = true;
  }
}

start();
