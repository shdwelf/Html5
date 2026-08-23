// Small offline gallery filesystem for Art Studio.
// It stores collectible metadata and artwork data, never the source mnemonic.
const DB_NAME = "sitek-art-studio";
const STORE_NAME = "gallery";
const memory = new Map();
let database = null;

function openDatabase() {
  if (database) return database;
  if (!("indexedDB" in window)) return Promise.resolve(null);
  database = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return database;
}

export async function listGallery() {
  const db = await openDatabase();
  if (!db) return [...memory.values()].sort((a, b) => b.createdAt - a.createdAt);
  return new Promise((resolve) => {
    try {
      const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt - a.createdAt));
      request.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

export async function saveGalleryCard(card) {
  const safeCard = { ...card, id: card.id || `card-${Date.now().toString(36)}`, createdAt: card.createdAt || Date.now() };
  const db = await openDatabase();
  if (!db) {
    memory.set(safeCard.id, safeCard);
    return safeCard;
  }
  return new Promise((resolve) => {
    try {
      const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(safeCard);
      request.onsuccess = () => resolve(safeCard);
      request.onerror = () => resolve(safeCard);
    } catch {
      memory.set(safeCard.id, safeCard);
      resolve(safeCard);
    }
  });
}

export async function deleteGalleryCard(id) {
  const db = await openDatabase();
  memory.delete(id);
  if (!db) return;
  await new Promise((resolve) => {
    try {
      const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(id);
      request.onsuccess = request.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function clearGallery() {
  const db = await openDatabase();
  memory.clear();
  if (!db) return;
  await new Promise((resolve) => {
    try {
      const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).clear();
      request.onsuccess = request.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
