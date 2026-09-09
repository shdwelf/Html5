const records = [
  {
    id: "13259",
    source005: "20250709213020.0",
    title: "Maple leaf rag — home recording",
    performer: "Scott Joplin (piano roll)",
    year: "1992",
    label: "David Giovannoni Collection · brown wax",
    status: "ready",
    score: 94,
    candidates: 3,
    selected: true,
    exact: 6,
    enriched: 2,
    choices: { 3: "local", 4: "local", 5: "local", 6: "local" },
    fields: [
      ["001", "MMS ID", "990041103680203776", "— UCSB control field retained —", "local"],
      ["035", "OCLC", "(OCoLC)881047763", "881047763", "same"],
      ["700", "Creator", "Joplin, Scott, 1868–1917, $e composer, $e instrumentalist", "Joplin, Scott, 1868–1917", "changed"],
      ["245", "Title", "[Brown wax home recording of player piano with roll of Maple leaf rag]", "Maple leaf rag / Scott Joplin.", "changed"],
      ["264", "Date", "[United States] : 1992", "New York : John Stark & Son, ©1899", "changed"],
      ["300", "Format", "1 cylinder (ca. 2 min.) : 113.4 rpm ; 2 1/4 x 4 in.", "1 score (6 pages) ; 35 cm", "changed"],
      ["655", "Genre", "Personal recordings", "Ragtime music", "changed"],
      ["590", "Local note", "David Giovannoni Collection, Set Number 348-02.", "— local field retained —", "local"],
      ["856", "Digital", "library.ucsb.edu/OBJID/Cylinder13259", "— local link retained —", "local"]
    ]
  },
  {
    id: "0774",
    source005: "20250709213020.0",
    title: "William Tell : fantasie",
    performer: "Charles Daab",
    year: "1913",
    label: "Edison Blue Amberol · 1730",
    status: "synced",
    score: 97,
    candidates: 1,
    selected: false,
    exact: 5,
    enriched: 3,
    fields: [
      ["001", "MMS ID", "990025192730203776", "— UCSB control field retained —", "local"],
      ["035", "OCLC", "(OCoLC)39012442", "39012442", "same"],
      ["028", "Issue no.", "1730 $b Edison Blue Amberol", "1730 $b Edison", "changed"],
      ["100", "Creator", "Rossini, Gioacchino, 1792–1868", "Rossini, Gioacchino, 1792–1868", "same"],
      ["700", "Performer", "Daab, Charles, $e performer", "Daab, Charles, $e instrumentalist", "changed"],
      ["245", "Title", "William Tell : fantasie / Rossini", "William Tell : fantasie / Rossini", "same"],
      ["240", "Uniform title", "Guillaume Tell. Selections; arranged", "Guillaume Tell. Selections; arranged", "same"],
      ["264", "Date", "Orange, N.J. : Edison, 1913", "Orange, N.J. : Edison, [1913]", "changed"],
      ["300", "Format", "1 audio cylinder (approximately 4 min.) : 160 rpm ; 2 1/4 x 4 in.", "1 audio cylinder : analog, 160 rpm", "changed"],
      ["650", "Subject", "Xylophone with orchestra", "Operas — Excerpts, Arranged", "changed"],
      ["500", "Source note", "Release year from The Edison Phonograph Monthly, v.11 (1913).", "— UCSB note retained —", "local"],
      ["856", "Digital", "library.ucsb.edu/OBJID/Cylinder0774", "— local link retained —", "local"]
    ]
  },
  {
    id: "11362",
    source005: "20210614163515.0",
    title: "Around the world",
    performer: "Thomas A. Edison",
    year: "2012",
    label: "Edisonia Record · 1001",
    status: "ready",
    score: 88,
    candidates: 1,
    selected: true,
    exact: 5,
    enriched: 1,
    fields: [
      ["001", "MMS ID", "990036983190203776", "— UCSB control field retained —", "local"],
      ["035", "OCLC", "(OCoLC)780204521", "780204521", "same"],
      ["028", "Issue no.", "1001 $b Edisonia Record", "1001 $b Edisonia", "changed"],
      ["100", "Creator", "Edison, Thomas A.", "Edison, Thomas A. (Thomas Alva), 1847–1931", "changed"],
      ["245", "Title", "Around the world / [Thomas A. Edison]", "Around the world / [Thomas A. Edison]", "same"],
      ["246", "Alternate", "Around the world on the phonograph", "Around the world on the phonograph", "same"],
      ["264", "Date", "[United States] : Edisonia, 2012", "[United States] : Edisonia, 2012", "same"],
      ["300", "Format", "1 audio cylinder (approximately 2 min.) : 144 rpm ; 2 1/4 x 4 in.", "1 audio cylinder : analog, 144 rpm", "changed"],
      ["650", "Subject", "Recitation", "Recitations", "changed"],
      ["590", "Local note", "Cylinder re-release; no. 28 of 50 copies.", "— local field retained —", "local"],
      ["500", "Access note", "Cylinder has not been digitized for online access.", "— UCSB note retained —", "local"]
    ]
  },
  {
    id: "16097",
    source005: "20250709213020.0",
    title: "[Black wax home recording of inaudible speaking and singing]",
    performer: "Unidentified performer",
    year: "1909?",
    label: "Rev. James Sunderland family collection",
    status: "review",
    score: 62,
    candidates: 4,
    selected: false,
    exact: 2,
    enriched: 1,
    fields: [
      ["001", "MMS ID", "990046974130203776", "— no confident LC bib match —", "local"],
      ["035", "OCLC", "(OCoLC)958382220", "958382220", "same"],
      ["245", "Title", "[Black wax home recording of inaudible speaking and singing]", "— no confident LC bib candidate —", "local"],
      ["264", "Date", "[Oakland, California] : [1909?]", "[between 1900 and 1925?]", "changed"],
      ["300", "Format", "1 audio cylinder (approximately 2 min.) : 144 rpm ; 2 1/4 x 4 in.", "1 audio cylinder", "changed"],
      ["655", "Genre", "Personal recordings $2 lcgft", "Personal recordings $0 id.loc.gov/authorities/genreForms/gf2011026803", "changed"],
      ["561", "Provenance", "Rev. James Sunderland family collection.", "— local field retained —", "local"],
      ["590", "Local note", "Black wax cylinder; sung in English.", "— local field retained —", "local"],
      ["856", "Digital", "library.ucsb.edu/OBJID/Cylinder16097", "— local link retained —", "local"]
    ]
  },
  {
    id: "0348",
    source005: "20250709213020.0",
    title: "Danish dance of greeting",
    performer: "National Promenade Band",
    year: "1914",
    label: "Edison Blue Amberol · 2243",
    status: "review",
    score: 41,
    candidates: 1,
    selected: false,
    exact: 1,
    enriched: 0,
    fields: [
      ["001", "MMS ID", "990025147250203776", "— UCSB control field retained —", "local"],
      ["035", "OCLC", "(OCoLC)39400399", "— different manifestation —", "local"],
      ["028", "Issue no.", "2243 $b Edison Blue Amberol", "A3039 $b Columbia", "changed"],
      ["710", "Performer", "National Promenade Band", "Prince's Band", "changed"],
      ["245", "Title", "Danish dance of greeting", "Danish dance of greeting", "same"],
      ["264", "Date", "[Orange, N.J.] : Edison, 1914", "New York : Columbia, 1912-12-20", "changed"],
      ["300", "Format", "1 cylinder (ca. 4 min.) : 160 rpm ; 2 1/4 x 4 in.", "1 sound disc : analog ; 10 in.", "changed"],
      ["650", "Subject", "Band music; Folk dance music — Denmark", "Popular music; Ethnic music", "changed"],
      ["590", "Local note", "Year from The Edison Phonograph Monthly, v.12 (1914). Todd collection.", "— local field retained —", "local"],
      ["856", "Digital", "library.ucsb.edu/OBJID/Cylinder0348", "— local link retained —", "local"]
    ]
  }
];

const $ = (id) => document.getElementById(id);
let activeId = "13259";
let currentFilter = "all";
let searchTerm = "";
let sortDescending = true;
let fieldsExpanded = false;

function recordIcon(name) {
  if (name === "label") return '<svg viewBox="0 0 12 12" fill="none"><path d="M2 3h8v6H2zM4 1.5h4V3" stroke="currentColor" stroke-width="1"/></svg>';
  return '<svg viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.2" stroke="currentColor"/><path d="M6 3.7v2.6l1.7 1" stroke="currentColor" stroke-linecap="round"/></svg>';
}

function statusLabel(status) {
  return status === "ready" ? "Ready" : status === "review" ? "Review" : "Synced";
}

function visibleRecords() {
  const q = searchTerm.trim().toLowerCase();
  return records
    .filter((record) => currentFilter === "all" || record.status === currentFilter)
    .filter((record) => !q || `${record.id} ${record.title} ${record.performer} ${record.label}`.toLowerCase().includes(q))
    .sort((a, b) => sortDescending ? b.score - a.score : a.score - b.score);
}

function renderRecords() {
  const items = visibleRecords();
  $("recordList").innerHTML = items.map((record) => `
    <article class="record-card${record.id === activeId ? " active" : ""}" data-id="${record.id}" tabindex="0" aria-label="${record.title}">
      <label class="check" aria-label="Select ${record.title}" onclick="event.stopPropagation()">
        <input type="checkbox" data-select-id="${record.id}" ${record.selected ? "checked" : ""} ${record.status === "synced" ? "disabled" : ""}/><span></span>
      </label>
      <div class="record-main">
        <div class="record-topline"><span class="record-id">Cylinder ${record.id}</span><span class="record-status ${record.status}">${statusLabel(record.status)}</span></div>
        <b class="record-title">${record.title}</b>
        <p class="record-byline">${record.performer} · ${record.year}</p>
        <div class="record-meta"><span>${recordIcon("label")}${record.label}</span></div>
      </div>
      <div class="match-score${record.score < 75 ? " low" : ""}"><b>${record.score}%</b><span>match</span></div>
    </article>`).join("");

  $("recordList").hidden = items.length === 0;
  $("emptyState").hidden = items.length !== 0;
  bindRecordEvents();
  updateSelectionUi();
}

function bindRecordEvents() {
  document.querySelectorAll(".record-card").forEach((card) => {
    const open = () => selectRecord(card.dataset.id);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });
  document.querySelectorAll("[data-select-id]").forEach((input) => {
    input.addEventListener("change", () => {
      const record = records.find((item) => item.id === input.dataset.selectId);
      record.selected = input.checked;
      updateSelectionUi();
    });
  });
}

function selectRecord(id) {
  activeId = id;
  fieldsExpanded = false;
  renderRecords();
  renderDetail();
  $("recordDetail").classList.add("open");
}

function renderDetail() {
  const record = records.find((item) => item.id === activeId);
  if (!record) {
    $("detailEmpty").hidden = false;
    $("detailContent").hidden = true;
    $("detailActions").hidden = true;
    return;
  }
  $("detailEmpty").hidden = true;
  $("detailContent").hidden = false;
  $("detailActions").hidden = false;
  $("detailId").textContent = `Cylinder ${record.id}`;
  $("detailTitle").textContent = record.title;
  $("detailSubtitle").textContent = `${record.performer} · ${record.year}`;
  $("scoreValue").textContent = record.score;
  $("scoreRing").style.setProperty("--score", record.score);
  $("scoreRing").classList.toggle("low", record.score < 72);
  $("matchTitle").textContent = record.score >= 85 ? "Strong match" : record.score < 60 ? "Likely different item" : "Review suggested";
  $("matchCopy").textContent = `${record.exact} exact ${record.exact === 1 ? "field" : "fields"} · ${record.enriched} authority ${record.enriched === 1 ? "suggestion" : "suggestions"}`;
  $("candidateCount").textContent = `1 of ${record.candidates}`;
  $("approveBtn").textContent = record.status === "synced" ? "Updated" : "Approve update";
  $("approveBtn").disabled = record.status === "synced";
  $("holdBtn").textContent = record.status === "review" ? "Keep on hold" : "Hold for review";

  record.choices ||= {};
  $("fieldRows").innerHTML = record.fields.map((field, index) => {
    const [tag, label, local, loc, kind] = field;
    const hidden = index >= 5 && !fieldsExpanded ? " hidden-field" : "";
    const isChanged = kind === "changed";
    const choice = record.choices[index] || (record.status === "review" ? "local" : isChanged ? "loc" : "local");
    return `<div class="field-row${hidden}" data-field-index="${index}">
      <div class="field-label"><b>${tag}</b><span>${label}</span></div>
      <div class="field-value${choice === "local" ? " selected" : ""}" data-choice="local">${escapeHtml(local)}${isChanged ? `<button class="${choice === "local" ? "chosen" : ""}" title="Keep UCSB Alma value">✓</button>` : ""}</div>
      <div class="field-value${isChanged ? " changed" : ""}${choice === "loc" ? " selected" : ""}" data-choice="loc">${escapeHtml(loc)}${isChanged ? `<button class="${choice === "loc" ? "chosen" : ""}" title="Use Library of Congress value">✓</button>` : ""}</div>
    </div>`;
  }).join("");
  $("showAllFields").innerHTML = fieldsExpanded ? 'Show fewer fields <span>↑</span>' : 'Show all MARC fields <span>↓</span>';
  $("marcView").textContent = buildMarc(record);
  bindFieldChoices();
}

function escapeHtml(value) {
  const span = document.createElement("span");
  span.textContent = value;
  return span.innerHTML;
}

function buildMarc(record) {
  const controlNumber = record.fields.find((field) => field[0] === "001")?.[2] || record.id;
  const lines = [
    "LDR  00000njm a2200000 i 4500",
    `001  ${controlNumber}`,
    `005  ${record.source005}`,
    `008  260823s${record.year.replace(/\D/g, "").slice(0, 4) || "uuuu"}    xxunnn            n zxx d`,
    "040  __ $a CU-SB $b eng $e rda $c CU-SB"
  ];
  record.fields.forEach((field, index) => {
    if (field[0] === "001") return;
    const defaultChoice = record.status === "review" ? "local" : field[4] === "changed" ? "loc" : "local";
    const choice = record.choices?.[index] || defaultChoice;
    const value = choice === "loc" ? field[3] : field[2];
    if (!value.startsWith("—")) lines.push(`${field[0]}  __ $a ${value}`);
  });
  return lines.join("\n");
}

function bindFieldChoices() {
  document.querySelectorAll(".field-value button").forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest(".field-row");
      const record = records.find((item) => item.id === activeId);
      const choice = button.parentElement.dataset.choice;
      record.choices ||= {};
      record.choices[Number(row.dataset.fieldIndex)] = choice;
      row.querySelectorAll(".field-value").forEach((value) => value.classList.remove("selected"));
      row.querySelectorAll(".field-value button").forEach((item) => item.classList.remove("chosen"));
      button.parentElement.classList.add("selected");
      button.classList.add("chosen");
      $("marcView").textContent = buildMarc(record);
      showToast("Field preference saved in this review session.");
    });
  });
}

function updateSelectionUi() {
  const selectable = records.filter((record) => record.status !== "synced");
  const selected = selectable.filter((record) => record.selected);
  $("selectedCount").textContent = `${selected.length} selected`;
  $("topSelectedCount").textContent = selected.length;
  $("selectAll").checked = selected.length === selectable.length && selectable.length > 0;
  $("selectAll").indeterminate = selected.length > 0 && selected.length < selectable.length;
  $("syncSelectedTop").disabled = selected.length === 0;
}

function updateCounts() {
  $("countAll").textContent = records.length;
  $("countReady").textContent = records.filter((r) => r.status === "ready").length;
  $("countReview").textContent = records.filter((r) => r.status === "review").length;
  $("countSynced").textContent = records.filter((r) => r.status === "synced").length;
  const reviewed = 17 + records.filter((r) => r.status === "synced").length;
  const pct = Math.round((reviewed / 25) * 100);
  $("reviewedCount").textContent = reviewed;
  $("progressPercent").textContent = `${pct}%`;
  $("progressBar").style.width = `${pct}%`;
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i>✓</i><span>${escapeHtml(message)}</span>`;
  $("toastRegion").appendChild(toast);
  setTimeout(() => {
    toast.classList.add("out");
    setTimeout(() => toast.remove(), 220);
  }, 3100);
}

function openSyncModal() {
  const selected = records.filter((record) => record.selected && record.status !== "synced");
  if (!selected.length) return;
  $("syncModalCopy").textContent = `This will write approved authority fields to ${selected.length} UCSB Alma ${selected.length === 1 ? "record" : "records"}. Local identifiers, notes, holdings, and audio links will be preserved.`;
  $("approvalCheck").checked = false;
  $("confirmSync").disabled = true;
  $("syncModal").hidden = false;
}

function closeSyncModal() { $("syncModal").hidden = true; }
function closeInfoModal() { $("infoModal").hidden = true; }

function syncRecords(ids) {
  records.forEach((record) => {
    if (ids.includes(record.id)) {
      record.status = "synced";
      record.selected = false;
    }
  });
  updateCounts();
  renderRecords();
  renderDetail();
  showToast(`${ids.length} ${ids.length === 1 ? "record" : "records"} marked updated in this review session.`);
}

function downloadReport() {
  const rows = ["cylinder_id,title,performer,status,match_score", ...records.map((record) => [record.id, record.title, record.performer, record.status, record.score].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "ucsb-cylinder-reconciliation-24-08-CYC.csv";
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Reconciliation report exported.");
}

$("recordSearch").addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderRecords();
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    $("recordSearch").focus();
  }
  if (event.key === "Escape") {
    closeSyncModal();
    closeInfoModal();
    $("recordDetail").classList.remove("open");
  }
});

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach((item) => item.classList.toggle("active", item === button));
    renderRecords();
  });
});

$("sortBtn").addEventListener("click", () => {
  sortDescending = !sortDescending;
  $("sortBtn").firstChild.textContent = sortDescending ? "Confidence " : "Confidence ↑ ";
  renderRecords();
});

$("selectAll").addEventListener("change", (event) => {
  records.filter((record) => record.status !== "synced").forEach((record) => { record.selected = event.target.checked; });
  renderRecords();
});

$("clearSelection").addEventListener("click", () => {
  records.forEach((record) => { record.selected = false; });
  renderRecords();
});

$("showAllFields").addEventListener("click", () => {
  fieldsExpanded = !fieldsExpanded;
  renderDetail();
});

document.querySelectorAll(".view-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".view-tabs button").forEach((item) => item.classList.toggle("active", item === button));
    const marc = button.dataset.view === "marc";
    $("compareView").hidden = marc;
    $("marcView").hidden = !marc;
  });
});

$("syncSelectedTop").addEventListener("click", openSyncModal);
$("approvalCheck").addEventListener("change", (event) => { $("confirmSync").disabled = !event.target.checked; });
$("confirmSync").addEventListener("click", () => {
  const ids = records.filter((record) => record.selected && record.status !== "synced").map((record) => record.id);
  closeSyncModal();
  syncRecords(ids);
});
document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeSyncModal));
$("syncModal").addEventListener("click", (event) => { if (event.target === $("syncModal")) closeSyncModal(); });

$("approveBtn").addEventListener("click", () => {
  const record = records.find((item) => item.id === activeId);
  if (record && record.status !== "synced") syncRecords([record.id]);
});
$("holdBtn").addEventListener("click", () => {
  const record = records.find((item) => item.id === activeId);
  if (!record || record.status === "synced") return;
  record.status = "review";
  record.selected = false;
  updateCounts();
  renderRecords();
  renderDetail();
  showToast(`Cylinder ${record.id} held for cataloger review.`);
});
$("closeDetail").addEventListener("click", () => $("recordDetail").classList.remove("open"));

$("testConnection").addEventListener("click", () => {
  const button = $("testConnection");
  button.disabled = true;
  button.textContent = "Testing…";
  setTimeout(() => {
    button.disabled = false;
    button.textContent = "Validate";
    $("checkedTime").textContent = "just now";
    showToast("UCSB SRU and LC Z39.50 profiles passed local validation.");
  }, 850);
});

$("exportBtn").addEventListener("click", downloadReport);
$("helpBtn").addEventListener("click", () => { $("infoModal").hidden = false; });
$("infoModal").addEventListener("click", (event) => { if (event.target === $("infoModal")) closeInfoModal(); });
document.querySelectorAll("[data-close-info]").forEach((button) => button.addEventListener("click", closeInfoModal));

$("syncModal").querySelector(".modal").addEventListener("click", (event) => event.stopPropagation());
$("infoModal").querySelector(".modal").addEventListener("click", (event) => event.stopPropagation());

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.nav === "connections") $("infoModal").hidden = false;
    else if (button.dataset.nav !== "reconcile") showToast(`${button.textContent} view is ready for the next workflow step.`);
  });
});

updateCounts();
renderRecords();
renderDetail();
