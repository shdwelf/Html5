/** Explicit opt-in PUBLIC certificate snapshot. Never serialize the app state. */
export const PUBLIC_STORAGE_KEY = "openpgp-workbench.public-keyring.v1";

export function readPublicSnapshot(storage, maxBytes) {
  const value = storage.getItem(PUBLIC_STORAGE_KEY);
  if (value === null) return null;
  if (value.length > maxBytes + 128) throw new Error("Saved public keyring exceeds the local size limit.");
  const snapshot = JSON.parse(value);
  if (snapshot?.version !== 1 || typeof snapshot.armored !== "string" ||
      new TextEncoder().encode(snapshot.armored).length > maxBytes ||
      Object.keys(snapshot).some((key) => !["version", "armored"].includes(key))) {
    throw new Error("Saved public keyring format is not supported.");
  }
  // Callers MUST validate/import through createPublicKeyring before using it.
  return snapshot.armored;
}

export function writePublicSnapshot(storage, ring, maxBytes) {
  if (!ring.list().length) { forgetPublicSnapshot(storage); return false; }
  const armored = ring.exportKeys(); // The validated public-only model, never DOM input.
  if (new TextEncoder().encode(armored).length > maxBytes) throw new Error("Public keyring is too large to remember.");
  const value = JSON.stringify({ version: 1, armored });
  storage.setItem(PUBLIC_STORAGE_KEY, value);
  if (storage.getItem(PUBLIC_STORAGE_KEY) !== value) throw new Error("Public keyring local-storage read-back failed.");
  return true;
}

export function forgetPublicSnapshot(storage) {
  storage.removeItem(PUBLIC_STORAGE_KEY);
  if (storage.getItem(PUBLIC_STORAGE_KEY) !== null) throw new Error("Saved public keyring could not be removed.");
}
