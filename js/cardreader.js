/**
 * cardreader.js — virtualized smartcard reader + card (T9.1).
 *
 * The shared substrate of BasicCard and JavaCard work is the ISO/IEC
 * 7816-4 APDU: a reader sends command APDUs, the card answers data plus a
 * two-byte status word. This module models both ends in pure JS:
 *
 *   - an APDU codec (parse/serialise, command cases 1-4),
 *   - a virtual card: MF/DF/EF file tree with access conditions, a PIN
 *     with the standard retry-counter lockout, READ/UPDATE BINARY, and
 *     SELECT — by file ID for the filesystem, by AID for JavaCard-style
 *     applets registered on the card,
 *   - a reader that talks to the card only through APDU bytes, so the
 *     same code path a real PC/SC bridge would use is what gets tested.
 *
 * Scope, honestly: this is the card/reader substrate. It is not a JVM
 * (JavaCard applets arrive as APDU handlers, not bytecode) and not a
 * Basic interpreter (BasicCard programs arrive the same way). Secrets on
 * the demo card are demo values, printed on the label.
 */

// ---------------------------------------------------------------- APDU codec

export function parseApdu(bytes) {
  const b = Uint8Array.from(bytes);
  if (b.length < 4) throw new Error("APDU too short (need CLA INS P1 P2)");
  const [cla, ins, p1, p2] = b;
  let offset = 4, data = new Uint8Array(0), le = null;
  if (b.length > 4) {
    const lc = b[4];
    if (b.length === 5) {
      le = lc; // case 2: Le only
    } else {
      if (b.length < 5 + lc) throw new Error("APDU truncated: Lc exceeds body");
      data = b.subarray(5, 5 + lc);
      offset = 5 + lc;
      if (b.length === offset + 1) le = b[offset];
      else if (b.length !== offset) throw new Error("APDU has trailing garbage");
    }
  }
  return { cla, ins, p1, p2, data, le };
}

export function buildApdu({ cla = 0x00, ins, p1 = 0, p2 = 0, data = new Uint8Array(0), le = null }) {
  const body = [cla, ins, p1, p2];
  if (data.length) body.push(data.length, ...data);
  if (le !== null) body.push(le);
  return Uint8Array.from(body);
}

const hex = (bytes) => [...bytes].map((x) => x.toString(16).padStart(2, "0").toUpperCase()).join(" ");
export const apduToHex = hex;

const SW = {
  OK: 0x9000,
  WRONG_LENGTH: 0x6700,
  AUTH_BLOCKED: 0x6983,
  SECURITY_STATUS: 0x6982,
  WRONG_OFFSET: 0x6B00,
  FILE_NOT_FOUND: 0x6A82,
  APPLET_NOT_FOUND: 0x6A82,
  INS_NOT_SUPPORTED: 0x6D00,
  CLA_NOT_SUPPORTED: 0x6E00,
  retriesLeft: (n) => 0x63C0 | n,
};
export { SW };

// -------------------------------------------------------------- virtual card

/**
 * Card image format (plain object):
 *   { pin: "1234", files: { "3F00": {type:"MF", children:{...}}, ... } }
 * EF entries: { type:"EF", data: Uint8Array|string, read:"always"|"pin",
 *               write:"pin"|"never" }
 * Applets: [{ aid: "A000000001", name, process(card, apdu) -> {data, sw} }]
 */
export function createCard({ pin = "1234", files, applets = [] } = {}) {
  const state = {
    pinBytes: new TextEncoder().encode(pin),
    pinVerified: false,
    pinRetries: 3,
    pinBlocked: false,
    currentFile: null, // {id, node, parentChain:[ids]}
    selectedApplet: null,
  };

  const mf = files["3F00"];
  if (!mf || mf.type !== "MF") throw new Error('Card image needs an MF at "3F00"');
  state.currentFile = { id: "3F00", node: mf };

  function findFile(idHex) {
    const walk = (node, chain) => {
      for (const [id, child] of Object.entries(node.children || {})) {
        if (id === idHex) return { id, node: child, chain: [...chain, id] };
        if (child.type === "DF" || child.type === "MF") {
          const hit = walk(child, [...chain, id]);
          if (hit) return hit;
        }
      }
      return null;
    };
    if (idHex === "3F00") return { id: "3F00", node: mf, chain: ["3F00"] };
    return walk(mf, ["3F00"]);
  }

  const respond = (data, sw) => ({ data: Uint8Array.from(data || []), sw });

  function process(apduBytes) {
    let apdu;
    try { apdu = parseApdu(apduBytes); } catch { return respond([], SW.WRONG_LENGTH); }
    const { cla, ins, p1, p2, data } = apdu;
    if (cla !== 0x00) return respond([], SW.CLA_NOT_SUPPORTED);

    switch (ins) {
      case 0xA4: { // SELECT
        if (p1 === 0x04) { // by AID (JavaCard applet selection)
          const aid = hex(data).replaceAll(" ", "");
          const applet = applets.find((a) => a.aid === aid);
          if (!applet) return respond([], SW.APPLET_NOT_FOUND);
          state.selectedApplet = applet;
          state.currentFile = { id: "3F00", node: mf }; // selecting an applet leaves the FS at MF
          return respond(new TextEncoder().encode(applet.name || applet.aid), SW.OK);
        }
        // by file ID (2 bytes)
        if (data.length !== 2) return respond([], SW.WRONG_LENGTH);
        const id = hex(data).replaceAll(" ", "");
        const found = findFile(id);
        if (!found) return respond([], SW.FILE_NOT_FOUND);
        state.currentFile = found;
        state.selectedApplet = null;
        return respond(new TextEncoder().encode(found.node.type + ":" + id), SW.OK);
      }
      case 0x20: { // VERIFY PIN
        if (state.pinBlocked) return respond([], SW.AUTH_BLOCKED);
        const ok = data.length === state.pinBytes.length && data.every((v, i) => v === state.pinBytes[i]);
        if (ok) {
          state.pinVerified = true;
          state.pinRetries = 3;
          return respond([], SW.OK);
        }
        state.pinRetries--;
        if (state.pinRetries <= 0) {
          state.pinBlocked = true;
          return respond([], SW.AUTH_BLOCKED);
        }
        return respond([], SW.retriesLeft(state.pinRetries));
      }
      case 0xB0: { // READ BINARY
        const ef = state.currentFile;
        if (!ef || ef.node.type !== "EF") return respond([], SW.FILE_NOT_FOUND);
        if (ef.node.read === "pin" && !state.pinVerified) return respond([], SW.SECURITY_STATUS);
        const offset = (p1 << 8) | p2;
        const bytes = ef.node.data instanceof Uint8Array ? ef.node.data : new TextEncoder().encode(ef.node.data);
        if (offset > bytes.length) return respond([], SW.WRONG_OFFSET);
        const want = apdu.le ?? bytes.length - offset;
        return respond(bytes.subarray(offset, offset + want), SW.OK);
      }
      case 0xD6: { // UPDATE BINARY
        const ef = state.currentFile;
        if (!ef || ef.node.type !== "EF") return respond([], SW.FILE_NOT_FOUND);
        if (ef.node.write === "never") return respond([], SW.SECURITY_STATUS);
        if (ef.node.write === "pin" && !state.pinVerified) return respond([], SW.SECURITY_STATUS);
        const offset = (p1 << 8) | p2;
        const bytes = ef.node.data instanceof Uint8Array ? ef.node.data : new TextEncoder().encode(ef.node.data);
        if (offset + data.length > bytes.length) return respond([], SW.WRONG_OFFSET);
        bytes.set(data, offset);
        ef.node.data = bytes;
        return respond([], SW.OK);
      }
      default: {
        // Card applets get first refusal on proprietary instructions.
        if (state.selectedApplet && typeof state.selectedApplet.process === "function") {
          const r = state.selectedApplet.process(api(), apdu);
          if (r) return respond(r.data, r.sw ?? SW.OK);
        }
        return respond([], SW.INS_NOT_SUPPORTED);
      }
    }
  }

  const api = () => ({ state, findFile, respond });
  return { process, state };
}

// ------------------------------------------------------------------- reader

/** A reader session: the only way in or out is APDU hex on the wire. */
export function createReader(card) {
  const log = [];
  function transmit(apduBytes) {
    const cmd = Uint8Array.from(apduBytes);
    const { data, sw } = card.process(cmd);
    const response = Uint8Array.from([...data, (sw >> 8) & 0xFF, sw & 0xFF]);
    log.push({ cmd: hex(cmd), resp: hex(response), sw });
    return response;
  }
  const send = (apdu) => transmit(buildApdu(apdu));
  return {
    log,
    transmit,
    selectFile(idHex) {
      const bytes = Uint8Array.from(idHex.match(/../g).map((h) => parseInt(h, 16)));
      return send({ ins: 0xA4, p1: 0x00, p2: 0x00, data: bytes });
    },
    selectApplet(aidHex) {
      const bytes = Uint8Array.from(aidHex.match(/../g).map((h) => parseInt(h, 16)));
      return send({ ins: 0xA4, p1: 0x04, p2: 0x00, data: bytes });
    },
    verifyPin(pin) {
      return send({ ins: 0x20, p1: 0x00, p2: 0x00, data: new TextEncoder().encode(pin) });
    },
    readBinary(offset, le) {
      return send({ ins: 0xB0, p1: (offset >> 8) & 0xFF, p2: offset & 0xFF, le });
    },
    updateBinary(offset, data) {
      return send({ ins: 0xD6, p1: (offset >> 8) & 0xFF, p2: offset & 0xFF, data });
    },
    /** Response payload with the status word checked; throws on non-9000. */
    unwrap(response) {
      const sw = (response[response.length - 2] << 8) | response[response.length - 1];
      if (sw !== SW.OK) throw new Error("Card refused with SW=" + sw.toString(16).toUpperCase().padStart(4, "0"));
      return response.subarray(0, response.length - 2);
    },
  };
}

/** The demo card: a wallet-ish MF with a public note and a PIN-sealed secret. */
export function demoCard() {
  return createCard({
    pin: "1234",
    files: {
      "3F00": {
        type: "MF",
        children: {
          "2F01": { type: "EF", read: "always", write: "never", data: "SITE-K demo card. Nothing of value is stored here." },
          "7F10": {
            type: "DF",
            children: {
              "6F02": { type: "EF", read: "pin", write: "pin", data: "grandmaster: DEMO-ONLY-0000 (not a real key)" },
            },
          },
        },
      },
    },
    applets: [
      {
        aid: "A000000001",
        name: "DEMO-APPLET",
        process(card, apdu) {
          if (apdu.ins === 0x50) return { data: new TextEncoder().encode("PONG"), sw: SW.OK };
          return null; // fall through to 6D00
        },
      },
    ],
  });
}
