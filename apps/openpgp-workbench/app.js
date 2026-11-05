import { decryptOpenPgpText, encryptClassicText } from "./crypto.mjs";

const byId = (id) => document.getElementById(id);
const tabButtons = [...document.querySelectorAll("[data-tab]")];
const panels = [...document.querySelectorAll("[data-panel]")];

function setStatus(id, message, kind = "info") {
  const status = byId(id);
  status.textContent = message;
  status.dataset.kind = kind;
}

function setBusy(button, busy) {
  button.disabled = busy;
  button.setAttribute("aria-busy", String(busy));
}

function friendlyError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, 240) || "The OpenPGP operation could not be completed.";
}

for (const tab of tabButtons) {
  tab.addEventListener("click", () => {
    const selectedPanel = tab.dataset.tab;
    for (const candidate of tabButtons) {
      const selected = candidate === tab;
      candidate.classList.toggle("is-active", selected);
      candidate.setAttribute("aria-selected", String(selected));
      candidate.tabIndex = selected ? 0 : -1;
    }
    for (const panel of panels) panel.hidden = panel.id !== selectedPanel;
  });
  tab.addEventListener("keydown", (event) => {
    const index = tabButtons.indexOf(tab);
    const nextIndex = event.key === "ArrowRight" ? (index + 1) % tabButtons.length
      : event.key === "ArrowLeft" ? (index + tabButtons.length - 1) % tabButtons.length
        : event.key === "Home" ? 0
          : event.key === "End" ? tabButtons.length - 1
            : -1;
    if (nextIndex >= 0) {
      event.preventDefault();
      tabButtons[nextIndex].focus();
      tabButtons[nextIndex].click();
    }
  });
}

for (const button of document.querySelectorAll("[data-toggle-password]")) {
  button.addEventListener("click", () => {
    const input = byId(button.dataset.togglePassword);
    const reveal = input.type === "password";
    input.type = reveal ? "text" : "password";
    button.textContent = reveal ? "Hide" : "Show";
    button.setAttribute("aria-pressed", String(reveal));
  });
}

byId("encrypt-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('[type="submit"]');
  const plaintext = byId("plaintext").value;
  const passphrase = byId("encrypt-passphrase").value;
  const confirmation = byId("encrypt-confirm").value;
  byId("encrypted-output").value = "";

  if (passphrase !== confirmation) {
    setStatus("encrypt-status", "The passphrases do not match. Nothing was encrypted.", "error");
    byId("encrypt-confirm").focus();
    return;
  }

  setBusy(button, true);
  setStatus("encrypt-status", "Encrypting locally…", "info");
  try {
    const armored = await encryptClassicText(plaintext, passphrase);
    byId("encrypted-output").value = armored;
    setStatus("encrypt-status", "Encrypted. The armored message is ready to copy or download.", "success");
  } catch (error) {
    setStatus("encrypt-status", friendlyError(error), "error");
  } finally {
    setBusy(button, false);
  }
});

byId("decrypt-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('[type="submit"]');
  const armored = byId("armored-input").value;
  const passphrase = byId("decrypt-passphrase").value;
  byId("decrypted-output").value = "";

  setBusy(button, true);
  setStatus("decrypt-status", "Decrypting locally…", "info");
  try {
    const plaintext = await decryptOpenPgpText(armored, passphrase);
    byId("decrypted-output").value = plaintext;
    setStatus("decrypt-status", "Decrypted. Review the text before copying or using it.", "success");
  } catch (error) {
    setStatus("decrypt-status", friendlyError(error), "error");
  } finally {
    setBusy(button, false);
  }
});

for (const button of document.querySelectorAll("[data-clear-form]")) {
  button.addEventListener("click", () => {
    const form = byId(button.dataset.clearForm);
    form.reset();
    for (const revealButton of form.querySelectorAll("[data-toggle-password]")) {
      byId(revealButton.dataset.togglePassword).type = "password";
      revealButton.textContent = "Show";
      revealButton.setAttribute("aria-pressed", "false");
    }
    if (form.id === "encrypt-form") byId("encrypted-output").value = "";
    if (form.id === "decrypt-form") byId("decrypted-output").value = "";
    const statusId = form.id === "encrypt-form" ? "encrypt-status" : "decrypt-status";
    setStatus(statusId, "Fields cleared from the page.", "info");
  });
}

for (const button of document.querySelectorAll("[data-clear-output]")) {
  button.addEventListener("click", () => {
    byId(button.dataset.clearOutput).value = "";
    setStatus("decrypt-status", "Decrypted output cleared from the page.", "info");
  });
}

for (const button of document.querySelectorAll("[data-copy]")) {
  button.addEventListener("click", async () => {
    const value = byId(button.dataset.copy).value;
    if (!value) {
      const statusId = button.dataset.copy === "encrypted-output" ? "encrypt-status" : "decrypt-status";
      setStatus(statusId, "There is no output to copy yet.", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      const statusId = button.dataset.copy === "encrypted-output" ? "encrypt-status" : "decrypt-status";
      setStatus(statusId, "Copied to the clipboard by your request.", "success");
    } catch {
      const target = byId(button.dataset.copy);
      target.focus();
      target.select();
      const statusId = button.dataset.copy === "encrypted-output" ? "encrypt-status" : "decrypt-status";
      setStatus(statusId, "Clipboard access was blocked. The output is selected; copy it manually.", "error");
    }
  });
}

for (const button of document.querySelectorAll("[data-download]")) {
  button.addEventListener("click", () => {
    const value = byId(button.dataset.download).value;
    if (!value) {
      setStatus("encrypt-status", "There is no encrypted message to download yet.", "error");
      return;
    }
    const url = URL.createObjectURL(new Blob([value], { type: "application/pgp-encrypted;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = button.dataset.filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    setStatus("encrypt-status", "Download started by your request.", "success");
  });
}

const supported = window.isSecureContext && Boolean(window.crypto?.subtle) && typeof TextEncoder === "function";
if (!supported) {
  byId("capability-warning").hidden = false;
  for (const button of document.querySelectorAll("[data-crypto-submit]")) button.disabled = true;
}
