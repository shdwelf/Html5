const DEFAULT_DPI = 120;
const MAX_RENDER_EDGE = 2200;
let wasmReady;

function ensureWasm() {
  if (!wasmReady) {
    wasmReady = import("./djvu-rs/djvu_rs.js")
      .then(async (decoder) => {
        await decoder.default();
        return decoder;
      })
      .catch((error) => {
        wasmReady = undefined;
        throw error;
      });
  }
  return wasmReady;
}

function makeButton(label, ariaLabel, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "wiki-djvu-button";
  button.textContent = label;
  button.setAttribute("aria-label", ariaLabel);
  button.addEventListener("click", onClick);
  return button;
}

async function openDjvu(figure) {
  if (figure.dataset.djvuLoading === "true" || figure.dataset.djvuLoaded === "true") return;
  figure.dataset.djvuLoading = "true";

  const status = figure.querySelector(".wiki-djvu-status");
  const source = figure.dataset.djvuSrc;
  const fallback = figure.querySelector(".wiki-djvu-fallback");
  if (!source) {
    if (status) status.textContent = "This DjVu link has no file URL.";
    return;
  }

  let documentHandle;
  try {
    if (status) status.textContent = "Loading the DjVu reader…";
    const decoder = await ensureWasm();

    const response = await fetch(source, { credentials: "same-origin" });
    if (!response.ok) throw new Error(`The document returned HTTP ${response.status}.`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    documentHandle = decoder.WasmDocument.from_bytes(bytes);
    const pageCount = documentHandle.page_count();
    if (!pageCount) throw new Error("This DjVu document contains no pages.");

    const viewer = document.createElement("div");
    viewer.className = "wiki-djvu-viewer";
    viewer.setAttribute("role", "group");
    viewer.setAttribute("aria-label", "DjVu document viewer");

    const canvas = document.createElement("canvas");
    canvas.className = "wiki-djvu-canvas";
    canvas.setAttribute("aria-label", "Rendered DjVu page");

    const controls = document.createElement("div");
    controls.className = "wiki-djvu-controls";
    const pageLabel = document.createElement("span");
    pageLabel.className = "wiki-djvu-page-label";
    pageLabel.setAttribute("aria-live", "polite");

    viewer.appendChild(canvas);
    viewer.appendChild(controls);
    figure.appendChild(viewer);

    let pageIndex = 0;
    const previous = makeButton("Previous", "Previous DjVu page", () => {
      if (pageIndex > 0) renderPage(pageIndex - 1);
    });
    const next = makeButton("Next", "Next DjVu page", () => {
      if (pageIndex + 1 < pageCount) renderPage(pageIndex + 1);
    });
    controls.appendChild(previous);
    controls.appendChild(pageLabel);
    controls.appendChild(next);

    function renderPage(index) {
      const page = documentHandle.page(index);
      try {
        const baselineWidth = page.width_at(DEFAULT_DPI);
        const baselineHeight = page.height_at(DEFAULT_DPI);
        const edge = Math.max(baselineWidth, baselineHeight);
        const dpi = edge > MAX_RENDER_EDGE
          ? DEFAULT_DPI * (MAX_RENDER_EDGE / edge)
          : DEFAULT_DPI;
        const width = page.width_at(dpi);
        const height = page.height_at(dpi);
        const pixels = page.render(dpi);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("This browser cannot create a 2D canvas.");

        canvas.width = width;
        canvas.height = height;
        context.putImageData(new ImageData(pixels, width, height), 0, 0);
        pageIndex = index;
        previous.disabled = pageIndex === 0;
        next.disabled = pageIndex + 1 >= pageCount;
        pageLabel.textContent = `Page ${pageIndex + 1} of ${pageCount}`;
        if (status) status.textContent = "DjVu page rendered.";
      } finally {
        if (typeof page.free === "function") page.free();
      }
    }

    // Declared above in the event callbacks; render the first page now.
    renderPage(0);
    figure.dataset.djvuLoaded = "true";
    if (fallback) fallback.classList.add("wiki-djvu-download-link");
  } catch (error) {
    if (documentHandle && typeof documentHandle.free === "function") documentHandle.free();
    if (status) {
      status.textContent = `DjVu preview unavailable: ${error instanceof Error ? error.message : String(error)}`;
      status.classList.add("wiki-djvu-error");
    }
  } finally {
    figure.dataset.djvuLoading = "false";
  }
}

const figures = Array.from(document.querySelectorAll(".wiki-djvu-embed"));
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        openDjvu(entry.target);
      }
    }
  }, { rootMargin: "300px" });
  for (const figure of figures) observer.observe(figure);
} else {
  for (const figure of figures) openDjvu(figure);
}
