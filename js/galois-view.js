import { FIELDS, fieldById, fieldAdd, fieldMultiply, fieldInverse, fieldDivide, fieldElementText, elementPolynomial } from "./galois.js";

/** DOM-only educational lab. It never modifies entropy, derives a key or sends data. */
export function initGaloisExplorer(document, getEntropy) {
  const $ = (id) => document.getElementById(id);
  const resultIds = ["fieldSum", "fieldProduct", "fieldInverse", "fieldDivision"];
  $("fieldPreset").replaceChildren(...FIELDS.map((field) => {
    const option = document.createElement("option");
    option.value = field.id;
    option.textContent = field.name;
    return option;
  }));
  $("fieldPreset").value = "aes";

  const read = (id, field) => {
    const text = $(id).value.trim();
    if (!/^(?:0x[0-9a-f]+|[0-9]+)$/i.test(text)) throw new RangeError("Enter decimal or 0x-prefixed hex integers");
    const n = Number(text);
    if (!Number.isInteger(n) || n < 0 || n >= field.order) throw new RangeError(`Choose elements 0…${field.order - 1}`);
    return n;
  };

  function draw(field, a, b) {
    const canvas = $("fieldPlot");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (a === null) return;
    const cols = field.order > 17 ? 16 : 4;
    const rows = Math.ceil(field.order / cols);
    const cellW = w / cols, cellH = h / rows;
    for (let x = 0; x < field.order; x++) {
      const product = fieldMultiply(field, a, x);
      const left = (x % cols) * cellW, top = Math.floor(x / cols) * cellH;
      ctx.fillStyle = `hsl(${190 + 135 * product / (field.order - 1)} 58% ${16 + 32 * product / (field.order - 1)}%)`;
      ctx.fillRect(left + 1, top + 1, cellW - 2, cellH - 2);
      if (x === b) {
        ctx.strokeStyle = "#ffb020";
        ctx.lineWidth = 2;
        ctx.strokeRect(left + 1, top + 1, cellW - 2, cellH - 2);
      }
      ctx.font = `${cols === 16 ? 9 : 12}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      const value = field.characteristic === 2 ? product.toString(16).padStart(2, "0") : String(product);
      ctx.fillText(value, left + cellW / 2, top + cellH / 2);
    }
  }

  function update() {
    const field = fieldById($("fieldPreset").value);
    $("fieldBasis").textContent = `${field.name} · characteristic ${field.characteristic} · modulus ${field.polynomial}`;
    $("fieldFromEntropy").disabled = !getEntropy()?.length;
    try {
      const a = read("fieldA", field), b = read("fieldB", field);
      const fmt = (value) => value === null ? "undefined (division by zero)" : fieldElementText(field, value);
      $("fieldSum").textContent = fmt(fieldAdd(field, a, b));
      $("fieldProduct").textContent = fmt(fieldMultiply(field, a, b));
      $("fieldInverse").textContent = fmt(fieldInverse(field, a));
      $("fieldDivision").textContent = fmt(fieldDivide(field, a, b));
      $("fieldStatus").textContent = `a = ${elementPolynomial(field, a)}; b = ${elementPolynomial(field, b)}. ` +
        `Grid: a × x for every x = 0…${field.order - 1}, row-major; highlighted cell is b. ` +
        (a === 0 ? "Zero collapses every product to zero; it has no inverse." : "Every output occurs once: multiplication by a nonzero element is a permutation.");
      draw(field, a, b);
    } catch (error) {
      resultIds.forEach((id) => { $(id).textContent = "—"; });
      $("fieldStatus").textContent = error.message;
      draw(field, null, null);
    }
  }

  $("fieldPreset").addEventListener("change", () => {
    const field = fieldById($("fieldPreset").value);
    for (const id of ["fieldA", "fieldB"]) {
      const n = Number($(id).value);
      $(id).value = String(Number.isSafeInteger(n) && n >= 0 ? n % field.order : 0);
    }
    update();
  });
  ["fieldA", "fieldB"].forEach((id) => $(id).addEventListener("input", update));
  $("fieldFromEntropy").addEventListener("click", () => {
    const entropy = getEntropy();
    if (!entropy?.length) return;
    const field = fieldById($("fieldPreset").value);
    $("fieldA").value = String(entropy[0] % field.order);
    $("fieldB").value = String((entropy[1] ?? 0) % field.order);
    update();
    $("fieldStatus").textContent += " First two entropy bytes reduced modulo the field order for display only (lossy in smaller fields). Phrase unchanged.";
  });
  update();
  return { update };
}
