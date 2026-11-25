/**
 * Conservative checks for private cloud-storage references and backup/archive
 * passages before Markdown enters a public offline corpus.
 *
 * Drive IDs vary in length across API generations. Explicit file/folder-ID
 * labels and IDs immediately after a Drive collection marker accept shorter
 * IDs; the wider contextual scan retains the existing 28-character floor to
 * avoid treating ordinary source filenames and URLs as identifiers.
 */
const GOOGLE_ITEM_LINK = /https?:\/\/(?:docs|drive|sheets|forms)\.google\.com\/[^\s)<>"']*(?:\/d\/|\/folders\/|[?&]id=)[A-Za-z0-9_-]{15,64}/i;
const DROPBOX_LINK = /https?:\/\/(?:www\.)?(?:dropbox\.com|dropboxusercontent\.com)\/[^\s)<>"']+/i;
const GOOGLE_DRIVE_ID_CONTEXT = /(?:google\s+(?:drive|docs?|sheets?|forms?)|drive\s+(?:search|file|folder|item|copy|backup|link|document)|spreadsheet|(?:document|file|folder)\s*(?:id|identifier))/i;
const EXPLICIT_ID_LABEL = /(?:google\s+)?drive\s+(?:(?:file|folder|item)\s+)?(?:id|identifier)\b|\b(?:document|file|folder)\s*(?:id|identifier)\b/i;
const DRIVE_COLLECTION_ID = /google\s+drive\s+(?:files?|folders?|items?)\s*(?:\(|:|=)\s*[`'\"]?[A-Za-z0-9_-]{15,64}/i;
const SHORT_ID_TOKEN = /(?<![A-Za-z0-9_-])[A-Za-z0-9_-]{15,27}(?![A-Za-z0-9_-])/;
const LONG_ID_TOKEN = /(?<![A-Za-z0-9_-])[A-Za-z0-9_-]{28,64}(?![A-Za-z0-9_-])/g;
const PRIVATE_BACKUP_CONTEXT = /(?:\b(?:private|personal|confidential)\b[^.!?]{0,60}\bbackups?\b|\bbackups?\b[^.!?]{0,60}\b(?:private|personal|confidential)\b|\b(?:google\s+drive|dropbox)\b[^.!?]{0,80}\bbackups?\b|\bbackups?\b[^.!?]{0,80}\b(?:google\s+drive|dropbox)\b)/i;

/** Return true if text contains a likely private cloud-storage reference. */
export function hasPrivateCloudReference(text) {
  if (GOOGLE_ITEM_LINK.test(text) || DROPBOX_LINK.test(text)) return true;
  return text.split(/\r?\n/).some((line) => {
    if (DRIVE_COLLECTION_ID.test(line) || EXPLICIT_ID_LABEL.test(line) && SHORT_ID_TOKEN.test(line)) return true;
    if (!GOOGLE_DRIVE_ID_CONTEXT.test(line)) return false;
    const tokens = line.match(LONG_ID_TOKEN) ?? [];
    return tokens.some((token) =>
      !/^[0-9a-f]{28,64}$/i.test(token) && !/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(token),
    );
  });
}

/** Return true if text contains a private or personal archive/backup passage. */
export function hasPrivateBackupPassage(text) {
  return PRIVATE_BACKUP_CONTEXT.test(text.replace(/\s+/g, " "));
}

/** Return source names that contain a likely private cloud-storage reference. */
export function findUnsafeCloudReferenceSources(sources) {
  return sources
    .filter(({ markdown }) => hasPrivateCloudReference(markdown))
    .map(({ source }) => source);
}

/** Return source names that contain private backup context. */
export function findPrivateBackupPassageSources(sources) {
  return sources
    .filter(({ markdown }) => hasPrivateBackupPassage(markdown))
    .map(({ source }) => source);
}
