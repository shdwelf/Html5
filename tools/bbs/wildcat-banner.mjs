#!/usr/bin/env node
/**
 * A Wildcat!-flavoured BBS screen, served over a local socket so netcat can
 * capture it.
 *
 * Why this exists: the BBS viewer needs real ANSI byte streams, and this
 * sandbox cannot reach any live BBS (DNS for arbitrary hosts fails, and the
 * outbound allowlist does not include one). Loopback does work, so a screen can
 * be served locally and captured with the same tool -- nc -- that would be used
 * against a real system. The capture path is therefore exercised for real; only
 * the destination is local.
 *
 * The screen imitates the shape of a Wildcat! v4/v5 main menu: an ANSI banner,
 * a menu block, and a status line. It is an imitation of the layout, not a copy
 * of any Mustang Software asset. See docs/bbs-viewer-and-netcat-capture.md for
 * why that distinction matters.
 *
 *   node tools/bbs/wildcat-banner.mjs --serve 6420     # serve until killed
 *   node tools/bbs/wildcat-banner.mjs --emit           # write the bytes to stdout
 */

import net from "node:net";

const ESC = "\x1b";
const CSI = `${ESC}[`;
const sgr = (...p) => `${CSI}${p.join(";")}m`;

/** Box width. Computed rather than hand-counted: the first version had the
 *  right border one column short because the padding was counted by eye. */
export const BOX_INNER = 38;
const box = (text) => "\xba" + text.padEnd(BOX_INNER) + "\xba";

export const COLS = 80;
export const ROWS = 25;

/** The screen, as the bytes a BBS would actually put on the wire. */
export const WILDCAT_SCREEN = [
  CSI, "2J", CSI, "1;1H",                       // clear and home
  sgr(0, 1, 36),                                 // bold cyan
  // Box art is CP437 BYTES, not Unicode. "\u2554" pushed through
  // Buffer.from(..., "binary") keeps only the low byte and comes out as "T";
  // the wire wants 0xC9. The viewer's CP437_HIGH table turns them back.
  "\xc9" + "\xcd".repeat(BOX_INNER) + "\xbb", "\r\n",
  box("  W I L D C A T !   B B S"), "\r\n",
  box("  The Purr-fect Connection"), "\r\n",
  "\xc8" + "\xcd".repeat(BOX_INNER) + "\xbc", "\r\n",
  sgr(0),
  "\r\n",
  sgr(1, 33), "  Main Menu", sgr(0), "\r\n",
  sgr(37),
  "\r\n",
  "   [M]essage bases      [F]ile areas\r\n",
  "   [U]ser list          [C]hat with Sysop\r\n",
  "   [G]oodbye\r\n",
  "\r\n",
  sgr(32), "  Node 1  \xfa  2400 baud  \xfa  ANSI detected", sgr(0), "\r\n",
  "\r\n",
  sgr(1, 37), "  Select> ", sgr(0),
].join("");

export function serve(port, host = "127.0.0.1") {
  const server = net.createServer((sock) => {
    // A real BBS negotiates telnet options; this one sends the screen and
    // closes, which is all a capture needs.
    sock.write(Buffer.from(WILDCAT_SCREEN, "binary"));
    sock.end();
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve(server));
  });
}

const argv = process.argv.slice(2);

if (argv.includes("--serve")) {
  const port = Number(argv[argv.indexOf("--serve") + 1] || 6420);
  serve(port).then((s) => {
    const a = s.address();
    process.stdout.write(`listening ${a.address}:${a.port}\n`);
  }).catch((e) => { console.error(String(e.message || e)); process.exit(1); });
} else if (argv.includes("--emit")) {
  process.stdout.write(Buffer.from(WILDCAT_SCREEN, "binary"));
}
