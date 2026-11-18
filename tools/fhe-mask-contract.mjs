/** Bounded, synthetic encrypted-mask workload contract; no private source text. */
export const MASK_EXAMPLE = Object.freeze({
  schema: 1,
  updates: [[2, 3], [10, 20], [4, 5]],
  selection: [1, 0, 1],
});

export function validateMaskInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || value.schema !== 1) throw new Error("Mask workload schema must be 1");
  if (Object.keys(value).some((key) => !["schema", "updates", "selection"].includes(key))) throw new Error("Unknown mask workload key");
  const { updates, selection } = value;
  if (!Array.isArray(updates) || updates.length < 1 || updates.length > 16) throw new Error("updates must have 1 to 16 clients");
  const width = updates[0]?.length;
  if (!Number.isInteger(width) || width < 1 || width > 32) throw new Error("updates must have 1 to 32 features");
  if (!Array.isArray(selection) || selection.length !== updates.length || selection.some((bit) => bit !== 0 && bit !== 1)) throw new Error("selection must contain one 0/1 bit per client");
  if (updates.some((row) => !Array.isArray(row) || row.length !== width || row.some((n) => !Number.isInteger(n) || n < 0 || n > 100))) throw new Error("updates must be rectangular integer rows in 0..100");
  return { schema: 1, updates: updates.map((row) => row.slice()), selection: selection.slice() };
}

export function maskReference(value) {
  const { updates, selection } = validateMaskInput(value);
  const selectedCount = selection.reduce((sum, bit) => sum + bit, 0);
  const selectedSum = updates[0].map((_, feature) => updates.reduce((sum, row, client) => sum + row[feature] * selection[client], 0));
  return { selectedSum, selectedCount, meanAfterDecryption: selectedCount ? selectedSum.map((sum) => sum / selectedCount) : null };
}
