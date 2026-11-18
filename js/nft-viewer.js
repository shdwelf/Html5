import { readContractMetadata, readOffchainMetadata, metadataUrl } from "./chain-read.js";

/** The original apps/index3.html NFT viewer, now shared with Keyspace's metadata tab. */
export function initNftViewer(document, readOptions = {}) {
  const $ = (id) => document.getElementById(id);
  let controller = null, metadataController = null, epoch = 0, metadataEpoch = 0, result = null;
  const status = (message) => { $("status").textContent = message; };
  function clear() {
    epoch++; metadataEpoch++;
    controller?.abort(); metadataController?.abort();
    controller = metadataController = null;
    result = null;
    $("loadBtn").disabled = false;
    $("metadataBtn").disabled = true;
    $("summary").replaceChildren();
    $("standards").replaceChildren();
    $("metadataUri").textContent = "—";
    $("metadataJson").textContent = "{}";
    $("preview").textContent = "No external image, animation, HTML or SVG is loaded automatically.";
    $("metadataConsent").checked = false;
    status("Not queried. No remote request has been made for this selection.");
  }
  function field(name, value) {
    const wrapper = document.createElement("div");
    wrapper.className = "field";
    const label = document.createElement("div"), text = document.createElement("div");
    label.className = "k"; text.className = "v mono";
    label.textContent = name; text.textContent = value ?? "unavailable";
    wrapper.append(label, text); $("summary").append(wrapper);
  }
  async function load() {
    clear();
    const generation = epoch;
    controller = new AbortController();
    try {
      if (!$("lookupConsent").checked) throw new Error("Confirm contract/token-ID disclosure before a lookup.");
      $("loadBtn").disabled = true;
      status("Read-only lookup in progress; checking the expected chain first…");
      const data = await readContractMetadata({
        endpoint: $("rpcUrl").value.trim(), chainId: Number($("chainId").value),
        contract: $("contract").value.trim(), tokenId: $("tokenId").value.trim(),
        kind: $("kind").value, consent: true,
      }, { ...readOptions, signal: controller.signal });
      if (generation !== epoch) return;
      result = data;
      for (const [key, value] of Object.entries(data)) if (key !== "errors") field(key, typeof value === "object" && value !== null ? JSON.stringify(value) : value);
      $("standards").textContent = data.errors.length ? data.errors.join(" · ") : "Optional reads returned valid data; identity/backing not independently verified.";
      $("metadataUri").textContent = data.tokenURI || "No NFT token URI returned (ERC-20 metadata is on-chain fields above).";
      $("metadataBtn").disabled = !data.tokenURI;
      status("On-chain read completed. Optional read failures are listed. Off-chain JSON and media have NOT been fetched.");
    } catch (error) {
      if (generation === epoch) status(error.name === "AbortError" ? "Lookup cancelled/timed out; not a zero or absent token." : error.message);
    } finally { if (generation === epoch) { $("loadBtn").disabled = false; $("lookupConsent").checked = false; } }
  }
  async function metadata() {
    const generation = epoch, revision = ++metadataEpoch, uri = result?.tokenURI;
    if (!uri) return;
    try {
      if (!$("metadataConsent").checked) throw new Error("Separate off-chain JSON consent is required.");
      $("metadataBtn").disabled = true;
      metadataController?.abort(); metadataController = new AbortController();
      status("Fetching selected metadata JSON only…");
      const json = await readOffchainMetadata(uri, true, { ...readOptions, signal: metadataController.signal });
      if (generation !== epoch || revision !== metadataEpoch) return;
      $("metadataJson").textContent = JSON.stringify(json, null, 2);
      $("preview").replaceChildren();
      const note = document.createElement("p");
      note.textContent = "Metadata is untrusted data. External image/animation links are not loaded; follow only if you trust their hosts.";
      $("preview").append(note);
      for (const key of ["image", "animation_url", "external_url"]) {
        if (typeof json[key] !== "string") continue;
        try {
          const link = document.createElement("a");
          link.href = metadataUrl(json[key]); link.textContent = key + " (external link)";
          link.target = "_blank"; link.rel = "noopener noreferrer";
          $("preview").append(link, document.createElement("br"));
        } catch { /* Unsafe schemes are deliberately text-only in the JSON. */ }
      }
      status("Metadata JSON fetched as inert text. This does not verify ownership, authorship, availability or authenticity.");
    } catch (error) {
      if (generation === epoch && revision === metadataEpoch) status(error.name === "AbortError" ? "Metadata read cancelled/timed out." : error.message);
    } finally { if (generation === epoch && revision === metadataEpoch) { $("metadataBtn").disabled = false; $("metadataConsent").checked = false; } }
  }
  $("lookupConsent").addEventListener("change", () => {
    if (!$("lookupConsent").checked) { clear(); status("Contract lookup cancelled/cleared. Previously sent requests cannot be retracted."); }
  });
  $("metadataConsent").addEventListener("change", () => {
    if ($("metadataConsent").checked) return;
    metadataEpoch++; metadataController?.abort(); metadataController = null;
    $("metadataBtn").disabled = !result?.tokenURI;
    $("metadataJson").textContent = "{}";
    $("preview").textContent = "No external media loaded.";
    status("Metadata read cancelled/cleared. Previously sent requests cannot be retracted.");
  });
  $("preset").addEventListener("change", () => {
    clear(); $("lookupConsent").checked = false;
    if ($("preset").value !== "custom") {
      $("rpcUrl").value = $("preset").value;
      $("chainId").value = $("preset").selectedOptions[0].dataset.chain;
    }
  });
  for (const id of ["rpcUrl", "chainId", "contract", "tokenId", "kind"]) $(id).addEventListener("input", () => {
    clear(); $("lookupConsent").checked = false;
  });
  $("loadBtn").addEventListener("click", load);
  $("metadataBtn").addEventListener("click", metadata);
  $("clearBtn").addEventListener("click", () => { clear(); $("lookupConsent").checked = false; });
  $("exampleBtn").addEventListener("click", () => {
    clear(); $("lookupConsent").checked = false;
    $("rpcUrl").value = "https://ethereum-rpc.publicnode.com";
    $("preset").value = $("rpcUrl").value; $("chainId").value = "1";
    $("kind").value = "nft"; $("contract").value = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
    $("tokenId").value = "1";
    status("Public example filled locally. No request yet; review the RPC and disclosure consent.");
  });
  clear();
  return { clear };
}

if (typeof document !== "undefined" && document.getElementById("lookupConsent")) initNftViewer(document);
