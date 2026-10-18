#!/usr/bin/env node
/*
 * run_mealplan_sim.mjs -- drive the real converted applet from the JS model.
 *
 * tests/mealplan-applet.test.mjs compares MealPlanApplet.java against
 * js/mealplan-model.js by parsing the Java and checking their constants agree.
 * That catches a mismatched INS byte or a different PIN length. It cannot catch
 * a MAC computed over the same bytes in a different order, because both sides
 * still describe the same table.
 *
 * This closes that gap by running the applet. js/mealplan-model.js plays the
 * issuer and the terminal: it derives the keys, builds the LOAD and DEBIT
 * commands and computes the MACs with Node's crypto. The converted applet plays
 * the card and verifies them with the Java Card Signature API. Two independent
 * HMAC-SHA-256 implementations, one in Node and one in the JVM, have to agree on
 * every authenticated command or the run fails.
 *
 * It found two real defects that the constant comparison could not:
 *
 *   personalise() read the install data from b[off+1], which in a GlobalPlatform
 *   install block is the instance AID, not the app data. The array was long
 *   enough that the length check passed, so the card personalised cleanly with
 *   keys derived from a public AID and then rejected every legitimate MAC -- and
 *   rejected the correct PIN, which is what actually gave it away here.
 *
 *   The purse keys were built as TYPE_HMAC_TRANSIENT_RESET, which the platform
 *   clears at card reset, while the balance they protect is persistent.
 *
 * Usage:  node tools/run_mealplan_sim.mjs
 *
 * Exits non-zero if any command disagrees with the model. Run
 * tools/build_mealplan_applet.sh --sim first, or let this invoke it.
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CLA, INS, SW, MAC_LEN, CHALLENGE_LEN, PIN_MAX_TRIES, MealPlanCard, deriveKey, mac,
} from '../js/mealplan-model.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, '.cache/applet-toolchain');
const JDK = path.join(CACHE, 'zulu8.68.0.19-ca-jdk8.0.362-linux_x64');
const VJCRE = path.join(CACHE, 'AppletPlayground/lib/vjcre.jar');
const OBJENESIS = path.join(CACHE, 'objenesis.jar');
const OUT = path.join(ROOT, 'build/mealplan');

export const PKG_AID = 'A000000617024D500101000000000001';
export const APPLET_AID = 'A000000617024D500101000000000002';

const hex = (b) => Buffer.from(b).toString('hex').toUpperCase();
const be16 = (n) => { const x = Buffer.alloc(2); x.writeUInt16BE(n >>> 0); return x; };
const be32 = (n) => { const x = Buffer.alloc(4); x.writeUInt32BE(n >>> 0); return x; };

/** Build the JDK, kit, objenesis and simulator classes if anything is missing. */
export function ensureBuilt() {
  const need = [
    path.join(JDK, 'bin/java'), VJCRE, OBJENESIS,
    path.join(OUT, 'sim-classes/MealPlanSim.class'),
    path.join(OUT, 'shim-classes/pro/javacard/vre/vSignature.class'),
  ];
  if (need.every(existsSync)) return { built: false };
  const r = spawnSync('bash', [path.join(ROOT, 'tools/build_mealplan_applet.sh'), '--sim'],
    { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`build_mealplan_applet.sh --sim failed:\n${r.stdout}\n${r.stderr}`);
  return { built: true };
}

/**
 * A running applet. The line protocol is one hex APDU in, one hex response out;
 * a line starting "ERR" is a simulator fault and is surfaced as an exception
 * rather than parsed as a status word, because a crash is not a 6F00.
 */
export class AppletSim {
  constructor(appData) {
    this.appData = Buffer.from(appData);
    this.transcript = [];
    this.child = null;
    this.pending = [];
    this.buf = '';
  }

  async open() {
    const cp = [path.join(OUT, 'shim-classes'), path.join(OUT, 'sim-classes'),
                VJCRE, OBJENESIS].join(':');
    this.child = spawn(path.join(JDK, 'bin/java'),
      ['-cp', cp, 'MealPlanSim', PKG_AID, APPLET_AID, hex(this.appData)],
      { stdio: ['pipe', 'pipe', 'pipe'] });
    this.child.stderr.on('data', () => {});   // simulator chatter
    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', (d) => this._onData(d));

    const banner = await this._line();
    if (!banner.startsWith('OK INSTALL')) throw new Error(`install failed: ${banner}`);
    this.banner = banner;
    return this;
  }

  _onData(d) {
    this.buf += d;
    let i;
    while ((i = this.buf.indexOf('\n')) >= 0) {
      const line = this.buf.slice(0, i).trim();
      this.buf = this.buf.slice(i + 1);
      if (!line) continue;
      // VRE.log() writes to the same stdout as the responses: a LOAD and a
      // REGISTER line per package, and the applet object's toString before every
      // dispatch. Only a bare hex string, an OK banner or an ERR fault is a
      // protocol line, so anything else is chatter and gets dropped. Reading the
      // chatter as a response would misalign every subsequent answer by one.
      if (!/^(OK\b.*|ERR\b.*|[0-9A-Fa-f]+)$/.test(line)) continue;
      const p = this.pending.shift();
      if (p) p(line);
    }
  }

  _line(timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('timed out waiting for the simulator')), timeoutMs);
      this.pending.push((line) => { clearTimeout(t); resolve(line); });
    });
  }

  /** Send one APDU, return the full response including the two SW bytes. */
  async send(apdu) {
    const out = Buffer.from(apdu);
    const p = this._line();
    this.child.stdin.write(hex(out) + '\n');
    const line = await p;
    if (line.startsWith('ERR')) throw new Error(`simulator fault: ${line}`);
    const resp = Buffer.from(line, 'hex');
    this.transcript.push({ apdu: hex(out), resp: hex(resp) });
    return resp;
  }

  async close() {
    if (this.child && !this.child.killed) {
      this.child.stdin.end();
      this.child.kill();
    }
  }
}

/**
 * The model acting as issuer and terminal against a real card.
 *
 * Before building any authenticated command it re-reads ATC and challenge from
 * the card, because those are the two things a legitimate terminal genuinely
 * learns over the wire. Everything else -- keys, MACs, command bodies -- comes
 * from js/mealplan-model.js.
 */
export class RealCard {
  constructor(model) { this.model = model; }

  static async open(opts) {
    const model = new MealPlanCard(opts);
    const appData = Buffer.concat([
      model.issuerKey, model.accessKey, model.pin,
      be32(model.maxBalance), be32(model.maxDebit),
    ]);
    const sim = await new AppletSim(appData).open();
    const c = new RealCard(model);
    c.sim = sim;
    // SELECT. selectingApplet() is hardcoded false in the free simulator, so the
    // card answers 6E00 here where a real card answers 9000. Documented rather
    // than papered over; the applet is still selected and everything after works.
    await c.sim.send(Buffer.concat([
      Buffer.from([0x00, INS.SELECT, 0x04, 0x00, APPLET_AID.length / 2]),
      Buffer.from(APPLET_AID, 'hex'),
    ]));
    return c;
  }

  async status() {
    const r = await this.sim.send(Buffer.from([CLA, INS.GET_STATUS, 0, 0, 0]));
    if (sw(r) !== SW.OK) throw new Error(`GET_STATUS -> ${swName(sw(r))}`);
    const d = r.subarray(0, r.length - 2);
    return {
      balance: d.readUInt32BE(0), atc: d.readUInt16BE(4),
      tries: d[6], pinValidated: d[7] === 1, raw: d,
    };
  }

  async challenge() {
    const r = await this.sim.send(Buffer.from([CLA, INS.GET_CHALLENGE, 0, 0, CHALLENGE_LEN]));
    if (sw(r) !== SW.OK) throw new Error(`GET_CHALLENGE -> ${swName(sw(r))}`);
    const c = r.subarray(0, CHALLENGE_LEN);
    this.model.challenge = c;              // sync the issuer to the card
    return c;
  }

  /** Re-read the card's counter into the model, which is what a terminal does. */
  async sync() { const s = await this.status(); this.model.atc = s.atc; return s; }

  /** Send and return { sw, body } without asserting anything. */
  async _sw(bytes) {
    const r = await this.sim.send(Buffer.from(bytes));
    return { sw: sw(r), body: r.subarray(0, r.length - 2) };
  }

  async verifyPin(pin = this.model.pin) {
    return this._sw(Buffer.concat([Buffer.from([CLA, INS.VERIFY_PIN, 0, 0, pin.length]), pin]));
  }

  async load(amount) {
    await this.sync();
    const c = this.model.loadCommand(amount);
    const r = await this.sim.send(apdu(c));
    return { sw: sw(r), body: r.subarray(0, r.length - 2) };
  }

  async debit(amount, terminalSecret) {
    await this.sync();
    const c = this.model.debitCommand(amount, this.model.terminalKey, terminalSecret);
    const r = await this.sim.send(apdu(c));
    return { sw: sw(r), body: r.subarray(0, r.length - 2) };
  }

  async unload(amount) {
    await this.sync();
    const c = this.model.unloadCommand(amount);
    const r = await this.sim.send(apdu(c));
    return { sw: sw(r), body: r.subarray(0, r.length - 2) };
  }

  /** Provision the terminal key, issuer-authenticated. */
  async setTerminalKey(key) {
    await this.sync();
    const c = await this.challenge();
    // MAC input mirrors the applet exactly: INS || ATC || P1 || new key.
    const macIn = Buffer.concat([
      Buffer.from([INS.SET_STATE]), be16(this.model.atc), Buffer.from([0x01]), key,
    ]);
    const data = Buffer.concat([c, key, mac(this.model.issuerKey, macIn)]);
    const r = await this.sim.send(Buffer.concat(
      [Buffer.from([CLA, INS.SET_STATE, 0x01, 0x00, data.length]), data]));
    this.model.terminalKey = key;
    return { sw: sw(r), body: r.subarray(0, r.length - 2) };
  }

  /** Door pass: the card signs nonce || ATC with the access key. */
  async pass(nonce) {
    await this.sync();
    const r = await this.sim.send(Buffer.concat(
      [Buffer.from([CLA, INS.PASS, 0, 0, nonce.length]), nonce]));
    return { sw: sw(r), body: r.subarray(0, r.length - 2) };
  }

  async raw(bytes) { const r = await this.sim.send(Buffer.from(bytes)); return { sw: sw(r), body: r }; }
  async close() { await this.sim.close(); }
}

const sw = (r) => r.readUInt16BE(r.length - 2);
const apdu = (c) => Buffer.concat([Buffer.from([CLA, c.ins, c.p1, c.p2, c.data.length]), c.data]);

const SW_NAMES = Object.fromEntries(Object.entries(SW).map(([k, v]) => [v, k]));
export const swName = (v) => `0x${v.toString(16).padStart(4, '0')} ${SW_NAMES[v] || '?'}`;

export { PIN_MAX_TRIES, CHALLENGE_LEN, MAC_LEN, deriveKey, MealPlanCard, CLA, INS, SW, mac };
