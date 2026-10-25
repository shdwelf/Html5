/**
 * FidoNet Type-2 packet (FTS-0001) parsing/serialization + echomail→news
 * mapping helpers — the substrate for gating FidoNet echomail to NNTP
 * newsgroups (the `mbfido news` / Synchronet newslink job).
 *
 * Design rules (matching js/historical-network.js):
 * - Parse, never canonicalize away evidence: kludges, SEEN-BY and PATH are
 *   preserved on the message object even though the news view hides them.
 * - Bounded and fail-soft on message bodies (truncate → warning, keep
 *   going); fail-hard only when the 58-byte packet header cannot exist.
 * - No I/O, no network, no external data. Synthetic fixtures only.
 *
 * Layout reference: FTS-0001 (packet header 58 bytes; packed message:
 * type/origNode/destNode/origNet/destNet/attr/cost as uint16LE, 20-byte
 * dateTime, NUL-terminated toName(36)/fromName(36)/subject(72)/body).
 */

export const FTN_PACKET_TYPE = 2;

const u16 = (b, o) => b[o] | (b[o + 1] << 8);
const p16 = (v) => [v & 0xff, (v >> 8) & 0xff];

function readField(bytes, offset, maxLen) {
  let end = offset;
  const hard = Math.min(bytes.length, offset + maxLen);
  while (end < hard && bytes[end] !== 0) end++;
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(offset, end));
  return { text, next: Math.min(end + 1, bytes.length), truncated: end >= bytes.length };
}

function writeField(text, maxLen) {
  const enc = [...new TextEncoder().encode(String(text ?? ""))].slice(0, maxLen - 1);
  return [...enc, 0];
}

/** Split a packed-message body into area, kludges, text, tearline, origin, SEEN-BY/PATH. */
export function parseBody(raw) {
  const lines = String(raw ?? "").split(/\r\n|\r|\n/);
  const out = { area: null, kludges: {}, textLines: [], seenBy: [], path: [], tearline: null, origin: null };
  let inFooters = false;
  lines.forEach((line, i) => {
    if (i === 0 && line.startsWith("AREA:")) { out.area = line.slice(5).trim(); return; }
    if (line.startsWith("\x01")) {
      const m = line.slice(1).match(/^([A-Za-z0-9_]+):?\s?(.*)$/);
      if (m) {
        const [, key, value] = m;
        if (key === "SEEN-BY") { out.seenBy.push(value.trim()); inFooters = true; }
        else if (key === "PATH") { out.path.push(value.trim()); inFooters = true; }
        else out.kludges[key.toUpperCase()] = value.trim();
        return;
      }
    }
    if (line.startsWith("SEEN-BY:")) { out.seenBy.push(line.slice(8).trim()); inFooters = true; return; }
    if (line.startsWith("---")) { out.tearline = line; inFooters = true; return; }
    const origin = line.match(/^\s*\* Origin: (.*)$/);
    if (origin) { out.origin = origin[1]; inFooters = true; return; }
    if (!inFooters) out.textLines.push(line);
    else if (line.trim()) out.textLines.push(line); // trailing content kept, not hidden
  });
  out.text = out.textLines.join("\n").replace(/\n+$/, "");
  return out;
}

export function parsePacket(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.length < 58) throw new Error(`FTN packet too short for a Type-2 header: ${bytes.length} bytes`);
  const header = {
    origNode: u16(bytes, 0), destNode: u16(bytes, 2),
    year: u16(bytes, 4), month: u16(bytes, 6), day: u16(bytes, 8),
    hour: u16(bytes, 10), minute: u16(bytes, 12), second: u16(bytes, 14),
    baud: u16(bytes, 16), packetType: u16(bytes, 18),
    origNet: u16(bytes, 20), destNet: u16(bytes, 22),
    productCode: bytes[24], revision: bytes[25],
  };
  const warnings = [];
  if (header.packetType !== FTN_PACKET_TYPE) warnings.push(`packet type ${header.packetType} is not 2; parsing as Type-2 anyway`);
  const messages = [];
  let o = 58;
  while (o + 2 <= bytes.length) {
    const type = u16(bytes, o);
    if (type === 0) break;
    if (type !== FTN_PACKET_TYPE) { warnings.push(`stopping at offset ${o}: unknown packed-message type ${type}`); break; }
    o += 2;
    if (o + 16 > bytes.length) { warnings.push("truncated packed-message fixed fields"); break; }
    const fixed = {
      origNode: u16(bytes, o), destNode: u16(bytes, o + 2),
      origNet: u16(bytes, o + 4), destNet: u16(bytes, o + 6),
      attribute: u16(bytes, o + 8), cost: u16(bytes, o + 10),
    };
    o += 12;
    // dateTime is fixed-width (20 bytes, NUL-padded) in FTS-0001.
    const dtBytes = bytes.subarray(o, Math.min(o + 20, bytes.length));
    const dtNul = dtBytes.indexOf(0);
    fixed.dateTime = new TextDecoder("utf-8", { fatal: false }).decode(dtNul >= 0 ? dtBytes.subarray(0, dtNul) : dtBytes);
    o += 20;
    const to = readField(bytes, o, 36); o = to.next;
    const from = readField(bytes, o, 36); o = from.next;
    const subj = readField(bytes, o, 72); o = subj.next;
    const bodyStart = o;
    let bodyEnd = bodyStart;
    while (bodyEnd < bytes.length && bytes[bodyEnd] !== 0) bodyEnd++;
    const rawBody = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(bodyStart, bodyEnd));
    o = Math.min(bodyEnd + 1, bytes.length);
    if (to.truncated || from.truncated || subj.truncated) warnings.push(`message ${messages.length}: truncated header field(s)`);
    const body = parseBody(rawBody);
    messages.push({
      ...fixed,
      toName: to.text, fromName: from.text, subject: subj.text,
      area: body.area, kludges: body.kludges, seenBy: body.seenBy, path: body.path,
      tearline: body.tearline, origin: body.origin, text: body.text, rawBody,
    });
  }
  return { header, messages, warnings };
}

export function serializePacket(header, messages) {
  const out = [];
  const push = (...vals) => out.push(...vals);
  push(...p16(header.origNode), ...p16(header.destNode), ...p16(header.year), ...p16(header.month),
    ...p16(header.day), ...p16(header.hour), ...p16(header.minute), ...p16(header.second),
    ...p16(header.baud ?? 0), ...p16(FTN_PACKET_TYPE), ...p16(header.origNet), ...p16(header.destNet),
    header.productCode ?? 0, header.revision ?? 0);
  while (out.length < 58) out.push(0); // password + zone fields stay zero (basic Type-2)
  for (const m of messages) {
    push(...p16(FTN_PACKET_TYPE), ...p16(m.origNode), ...p16(m.destNode), ...p16(m.origNet), ...p16(m.destNet),
      ...p16(m.attribute ?? 0), ...p16(m.cost ?? 0));
    const dt = String(m.dateTime ?? "").padEnd(20, "\0").slice(0, 20);
    push(...new TextEncoder().encode(dt));
    push(...writeField(m.toName, 36), ...writeField(m.fromName, 36), ...writeField(m.subject, 72));
    push(...new TextEncoder().encode(m.rawBody ?? ""), 0);
  }
  push(0, 0);
  return new Uint8Array(out);
}

/** FidoNet echomail area tag -> candidate NNTP newsgroup (mbnntp needs a valid group name per area). */
export function newsgroupForArea(areaTag, prefix = "fidonet") {
  const cleaned = String(areaTag ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.|\.$/g, "");
  if (!cleaned) return null;
  const group = prefix ? `${prefix}.${cleaned}` : cleaned;
  return /^[a-z0-9][a-z0-9+._-]*$/.test(group) && group.includes(".") ? group : null;
}

export function isValidNewsgroup(name) {
  return typeof name === "string"
    && /^[a-z0-9][a-z0-9+._-]*(\.[a-z0-9][a-z0-9+._-]*)+$/.test(name)
    && !name.includes("..")
    && name.length <= 66;
}

/**
 * Map a parsed echomail message to a news article view.
 * MSGID `zone:net/node[.point]@domain serial` -> Message-ID
 * `<serial@fidonet.invalid>`-style stable id (domain preserved when sane);
 * REPLY -> References. Kludges/SEEN-BY/PATH/tearline stay off the wire.
 */
export function echomailToNews(message, { group } = {}) {
  const newsgroup = group ?? newsgroupForArea(message.area);
  const parseMsgid = (raw) => {
    const m = String(raw ?? "").trim().match(/^(\S+)\s+(\S+)$/);
    if (!m) return null;
    const address = m[1].replace(/[@:/]/g, ".").replace(/[^\w.-]/g, "");
    return `<${m[2]}@${address}.fidonet.invalid>`;
  };
  const messageId = parseMsgid(message.kludges.MSGID);
  const references = parseMsgid(message.kludges.REPLY);
  return {
    newsgroup: newsgroup && isValidNewsgroup(newsgroup) ? newsgroup : null,
    messageId,
    references: references ? [references] : [],
    subject: message.subject ?? "",
    from: message.fromName ?? "",
    dateTime: message.dateTime ?? "",
    body: message.text ?? "",
    // Evidence retained for the gateway log, not posted:
    ftn: {
      area: message.area ?? null,
      msgid: message.kludges.MSGID ?? null,
      reply: message.kludges.REPLY ?? null,
      origin: message.origin ?? null,
      seenByCount: (message.seenBy ?? []).length,
      path: message.path ?? [],
    },
  };
}
