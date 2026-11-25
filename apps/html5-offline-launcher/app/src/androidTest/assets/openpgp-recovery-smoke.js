/* Test APK only. Fresh synthetic keys; observe REAL workers, never replace crypto or replies. */
(() => {
  "use strict";
  const NativeWorker = window.Worker;
  const records = [], observations = new WeakMap(), live = new Set();
  const fixtures = new Map();
  const secret = "Synthetic Android Café Unlock!";
  let selected, ready = false, failed = false;
  const node = (id) => document.getElementById(id);
  const field = (id, value) => {
    node(id).value = value;
    node(id).dispatchEvent(new Event("input", { bubbles: true }));
  };

  // Construction, postMessage and terminate all delegate to the native Worker.
  // Retain only public URL/type/operation/count metadata, never message bodies,
  // key armor, candidates, worker errors or results in observations/diagnostics.
  class ObservedWorker extends NativeWorker {
    constructor(url, options) {
      super(url, options);
      const record = { url: String(url), type: options?.type, operation: null, total: 0, terminated: false };
      observations.set(this, record); records.push(record); live.add(this);
    }
    postMessage(message, ...transfer) {
      const record = observations.get(this);
      record.operation = message.operation;
      record.total = message.operation === "recover" ? message.candidates.length : 0;
      return super.postMessage(message, ...transfer);
    }
    terminate() {
      observations.get(this).terminated = true;
      live.delete(this);
      return super.terminate();
    }
  }
  window.Worker = ObservedWorker;

  async function create(mode) {
    try {
      const pgp = await import("openpgp");
      const config = { v6Keys: false, s2kIterationCountByte: mode === "slow" ? 255 : 96 };
      const common = { userIDs: [{ name: "Synthetic Android recovery control only" }], passphrase: secret };
      if (mode === "slow") {
        const key = await pgp.generateKey({ ...common, type: "ecc", curve: "curve25519Legacy", config });
        fixtures.set("slow", { armor: key.privateKey, fingerprint: (await pgp.readPrivateKey({ armoredKey: key.privateKey })).getFingerprint().toUpperCase() });
      } else {
        const v4 = await pgp.generateKey({ ...common, type: "ecc", curve: "curve25519Legacy", config });
        const v6 = await pgp.generateKey({ ...common, type: "curve25519", config: { ...config, v6Keys: true, aeadProtect: true } });
        const plain = await pgp.generateKey({ type: "ecc", curve: "curve25519Legacy", userIDs: common.userIDs, config });
        for (const [name, key] of [["v4", v4], ["v6", v6]]) {
          fixtures.set(name, { armor: key.privateKey, fingerprint: (await pgp.readPrivateKey({ armoredKey: key.privateKey })).getFingerprint().toUpperCase() });
        }
        fixtures.set("public", { armor: v4.publicKey });
        fixtures.set("unprotected", { armor: plain.privateKey });
        // Deliberately invalid Argon2 metadata: refusal must precede derivation.
        // No Argon2 work or production protection-parameter rewrite is performed.
        const argon = await pgp.readPrivateKey({ armoredKey: v6.privateKey });
        argon.keyPacket.s2k = { type: "argon2", write: () => Uint8Array.of(4, ...new Uint8Array(16), 255, 255, 31) };
        fixtures.set("argon2", { armor: argon.armor() });
      }
      ready = true;
    } catch {
      // A fixture failure cannot expose private material through test output.
      failed = true;
    }
  }

  window.__androidRecoverySmoke = Object.freeze({
    create,
    load(name, mode = "exact") {
      selected = fixtures.get(name);
      if (!selected) throw new Error("Synthetic fixture unavailable");
      field("recovery-private-key", selected.armor);
      field("recovery-wordlist", mode === "slow" ? Array.from({ length: 256 }, (_, i) => `Synthetic wrong Android candidate ${i}`).join("\n") :
        mode === "no-match" ? secret.toUpperCase() : `${secret.toUpperCase()}\n${secret}`);
      field("recovery-hint", mode === "exact" ? secret.toLowerCase() : "");
    },
    confirmFingerprint(wrong = false) {
      const fingerprint = selected.fingerprint;
      field("recovery-fingerprint", wrong ? (fingerprint[0] === "B" ? "A" : "B") + fingerprint.slice(1) : fingerprint);
    },
    revealedMatchIsExact() { return !node("recovery-match").hidden && node("recovery-match").value === secret; },
    snapshot() {
      return {
        ready, failed,
        secure: isSecureContext && Boolean(crypto.subtle),
        records: records.map((record) => ({ ...record })),
        live: live.size,
        attempts: Number(node("recovery-progress").value),
        identityMatches: Boolean(selected?.fingerprint && node("recovery-key-identity").textContent.includes(selected.fingerprint)),
        fingerprintLength: selected?.fingerprint?.length || 0,
        previewCount: node("recovery-candidates").children.length,
        previewHidesValues: !node("recovery-candidates").textContent.includes(secret),
        inputsCleared: ["recovery-private-key", "recovery-wordlist", "recovery-hint"].every((id) => node(id).value === ""),
        matchEmpty: node("recovery-match").value === "",
        matchHidden: node("recovery-match").hidden,
        revealHidden: node("recovery-reveal-match").hidden,
        startDisabled: node("recovery-start").disabled,
        stopDisabled: node("recovery-stop").disabled,
        noPersistence: localStorage.length === 0 && sessionStorage.length === 0,
        noKeyringImport: node("keyring-list").children.length === 0,
      };
    },
    dispose() {
      for (const worker of [...live]) worker.terminate();
      fixtures.clear(); selected = null;
      window.Worker = NativeWorker;
      delete window.__androidRecoverySmoke;
    },
  });
})();
