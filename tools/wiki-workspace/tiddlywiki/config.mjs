// browser-storage passes a change iterator. Never reset it with all[tiddlers]:
// doing so saves the entire repository on every event and can cause a quota-alert loop.
export const BROWSER_STORAGE_FILTER='[!is[system]] [prefix[$:/state/]!prefix[$:/state/popup/]]';
export const DEFAULT_NATIVE_PREVIEW_BYTES=4096;
