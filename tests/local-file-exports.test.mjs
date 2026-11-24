import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { JSDOM } from "jsdom";

const root = new URL("../apps/html5-offline-launcher/app/src/main/", import.meta.url);
const script = readFileSync(new URL("assets/launcher/local-files.js", root), "utf8");
const java = readFileSync(new URL("java/org/arena/html5launcher/LocalFileExports.java", root), "utf8");
const activity = readFileSync(new URL("java/org/arena/html5launcher/MainActivity.java", root), "utf8");
const client = readFileSync(new URL("java/org/arena/html5launcher/OfflineAssetWebViewClient.java", root), "utf8");
function boot({ finishStatus = "saved", failChunk = false } = {}) {
  const dom = new JSDOM("<!doctype html><body><p>synthetic</p></body>", { url: "https://app-synthetic.invalid/index.html", runScripts: "outside-only" });
  const window = dom.window, chunks = [], calls = [], revoked = [];
  let blobCount = 0;
  window.Blob = Blob;
  window.URL.createObjectURL = () => `blob:https://app-synthetic.invalid/${++blobCount}`;
  window.URL.revokeObjectURL = (url) => revoked.push(url);
  window.prompt = (message, payload) => {
    assert.equal(message, "html5-local-file-v1");
    const data = JSON.parse(payload); calls.push(data);
    if (data.op === "begin") return JSON.stringify({ status: "ready", id: "synthetic-request-id" });
    assert.equal(data.id, "synthetic-request-id");
    if (data.op === "chunk") {
      if (failChunk) return JSON.stringify({ status: "error", message: "Synthetic disk-full refusal" });
      assert.equal(data.seq, chunks.length);
      const chunk = Buffer.from(data.base64, "base64"); assert.ok(chunk.length <= 32768);
      chunks.push(chunk); return JSON.stringify({ status: "chunk", seq: chunks.length });
    }
    if (data.op === "cancel") return JSON.stringify({ status: "canceled" });
    const bytes = Buffer.concat(chunks);
    return JSON.stringify({ status: finishStatus, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
  };
  window.eval(script);
  return { dom, window, chunks, calls, revoked, close: () => dom.window.close() };
}
const until = async (predicate) => {
  for (let i = 0; i < 100; i++) { if (predicate()) return; await new Promise((resolve) => setTimeout(resolve, 5)); }
  assert.fail("local file adapter did not settle");
};

test("native adapter sends exact binary/Unicode bytes in ordered bounded chunks and returns only a verified receipt", async () => {
  const ui = boot();
  try {
    const expected = Buffer.concat([Buffer.from("synthetic research — café 🔐\0\r\n"), Buffer.alloc(80000, 0x81)]);
    const receipt = await ui.window.Html5LocalFiles.save(new Blob([expected], { type: "application/pgp-encrypted" }), "synthetic.asc");
    assert.deepEqual(Buffer.concat(ui.chunks), expected);
    assert.equal(ui.calls[0].name, "synthetic.asc"); assert.equal(ui.calls[0].size, expected.length);
    assert.equal(receipt.status, "saved"); assert.equal(receipt.bytes, expected.length);
    assert.equal(receipt.sha256, createHash("sha256").update(expected).digest("hex"));
    assert.deepEqual(Object.keys(receipt).sort(), ["bytes", "sha256", "status"]);
    assert.equal(Object.isFrozen(ui.window.Html5LocalFiles), true);
  } finally { ui.close(); }
});

test("legacy Blob anchor exports survive immediate revoke and work when the anchor is detached", async () => {
  const ui = boot();
  try {
    const blob = new Blob(["synthetic preset only"], { type: "application/json" });
    const url = ui.window.URL.createObjectURL(blob), anchor = ui.window.document.createElement("a");
    anchor.href = url; anchor.download = "synthetic-settings.json";
    anchor.click(); ui.window.URL.revokeObjectURL(url);
    await until(() => ui.calls.some((call) => call.op === "finish"));
    assert.equal(Buffer.concat(ui.chunks).toString(), "synthetic preset only");
    assert.deepEqual(ui.revoked, [url]);
    assert.match(ui.window.document.getElementById("html5-local-save-status").textContent, /read-back verified/);
  } finally { ui.close(); }
});

test("actual delegated download clicks are intercepted, but remote/data downloads are not fetched or silently saved", async () => {
  const ui = boot();
  try {
    const anchor = ui.window.document.createElement("a");
    anchor.href = ui.window.URL.createObjectURL(new Blob(["synthetic clicked bytes"])); anchor.download = "clicked.txt";
    ui.window.document.body.append(anchor);
    const event = new ui.window.MouseEvent("click", { bubbles: true, cancelable: true });
    anchor.dispatchEvent(event); assert.equal(event.defaultPrevented, true);
    await until(() => ui.calls.some((call) => call.op === "finish"));
    assert.equal(Buffer.concat(ui.chunks).toString(), "synthetic clicked bytes");
    await until(() => ui.window.document.getElementById("html5-local-save-status").textContent.includes("read-back verified"));
    const before = ui.calls.length;
    const remote = ui.window.document.createElement("a");
    remote.download = "remote.asc"; remote.href = "https://remote.example.invalid/private.asc"; remote.click();
    assert.equal(ui.calls.length, before);
    assert.match(ui.window.document.getElementById("html5-local-save-status").textContent, /no local save is confirmed/);
    assert.doesNotMatch(script, /\bfetch\s*\(|XMLHttpRequest|FileReader|localStorage|sessionStorage|indexedDB/);
  } finally { ui.close(); }
});

test("cancellation, disk refusal, oversized files and overlapping requests never report save success", async () => {
  const cancel = boot({ finishStatus: "canceled" }), failure = boot({ failChunk: true }), limits = boot();
  try {
    const canceled = await cancel.window.Html5LocalFiles.save(new Blob(["not saved"]), "cancel.asc");
    assert.equal(canceled.status, "canceled"); assert.equal(canceled.sha256, undefined);
    await assert.rejects(failure.window.Html5LocalFiles.save(new Blob(["disk full"]), "fail.asc"), /disk-full/);
    assert.ok(failure.calls.some((call) => call.op === "cancel"));
    assert.equal(failure.calls.some((call) => call.op === "finish"), false);
    class OversizedBlob extends Blob { get size() { return 64 * 1024 * 1024 + 1; } }
    await assert.rejects(limits.window.Html5LocalFiles.save(new OversizedBlob(), "too-large.bin"), /64 MiB/);
    assert.equal(limits.calls.length, 0);
    const first = limits.window.Html5LocalFiles.save(new Blob(["first"]), "first.asc");
    await assert.rejects(limits.window.Html5LocalFiles.save(new Blob(["second"]), "second.asc"), /Another local save/);
    await first;
  } finally { cancel.close(); failure.close(); limits.close(); }
});

test("Android export and import are system-picker-only, bounded and scoped to matching packaged HTTPS origins", () => {
  assert.match(activity, /new LocalFileExports\(this, assetClient::isPackagedAppOrigin\)/);
  assert.match(activity, /onJsPrompt[\s\S]*localFiles\.handle\(view\.getUrl\(\), url/);
  assert.match(activity, /ACTION_OPEN_DOCUMENT/);
  assert.match(activity, /FLAG_GRANT_READ_URI_PERMISSION/);
  assert.match(activity, /"content"\.equals\(uri\.getScheme\(\)\)/);
  assert.match(client, /isPackagedAppOrigin[\s\S]*!CATALOG_HOST\.equalsIgnoreCase/);
  assert.match(java, /!trusted\.test\(caller\)/);
  assert.match(java, /!topOrigin\.equals\(origin\(caller\)\)/);
  assert.match(java, /uri\.getUserInfo\(\) != null/);
  assert.match(java, /MAX_BYTES = 64L \* 1024 \* 1024/);
  assert.match(java, /ACTION_CREATE_DOCUMENT/);
  assert.match(java, /openOutputStream\(destination, "wt"\)/);
  assert.match(java, /openInputStream\(destination\)/);
  assert.match(java, /MessageDigest\.isEqual\(expected, actual\.digest\(\)\)/);
  assert.match(java, /"content"\.equals\(data\.getData\(\)\.getScheme\(\)\)/);
  assert.match(java, /current\.file\.delete\(\)/);
  assert.doesNotMatch(activity + java, /addJavascriptInterface|DownloadManager|WRITE_EXTERNAL_STORAGE|MANAGE_EXTERNAL_STORAGE|takePersistableUriPermission/);
});


test("a picker result canceled by navigation cannot fulfill a newer origin's export or file input", () => {
  assert.match(java, /pending != null \|\| pickerPending != null/);
  assert.match(java, /Pending current = pickerPending;\s*pickerPending = null;/);
  assert.match(java, /current == null \|\| current != pending \|\| current.canceled/);
  assert.match(activity, /if \(filePickerOpen\) \{\s*callback.onReceiveValue\(null\)/);
  assert.match(activity, /if \(requestCode != REQUEST_OPEN_FILE\) return;\s*filePickerOpen = false;/);
});
