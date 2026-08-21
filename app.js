/* global Dos */
(() => {
  "use strict";

  // Archive's original, publicly listed ZIP. Keep this external: its contents are
  // third-party promotional material and are not redistributed by this project.
  const diskUrl = "https://archive.org/download/Sneakers_Film_Promotional_Floppy/Sneakers_Promotional_Diskette.zip";
  const stage = document.querySelector("#dos");
  const state = document.querySelector("#state");
  const launchers = document.querySelectorAll("#launch, #launch-secondary");
  const fullscreen = document.querySelector("#fullscreen");
  const saver = document.querySelector("#saver");
  let player = null;
  let loading = false;
  const isWebxdc = typeof window.webxdc === "object";

  function setState(message, bad = false) {
    state.textContent = message;
    state.classList.toggle("bad", bad);
  }

  async function launch() {
    if (loading || player) return;
    loading = true;
    launchers.forEach((button) => (button.disabled = true));
    setState("MOUNTING DISK…");

    try {
      if (typeof window.Dos !== "function") {
        throw new Error("The WebAssembly runtime did not load. Check your connection and retry.");
      }
      stage.replaceChildren();
      // js-dos mounts ZIP distributions and starts their DOS executable. The
      // source item's own metadata identifies SNEAKERS.EXE as the entry point.
      player = await window.Dos(stage, {
        url: diskUrl,
        autoStart: true,
        kiosk: false,
        theme: "dark",
      });
      setState("ONLINE");
      fullscreen.disabled = false;
      saver.disabled = false;
    } catch (error) {
      console.error(error);
      stage.innerHTML = `<div class="boot-copy error"><p class="prompt">C:\\&gt; ERROR</p><h2>Disk mount unavailable.</h2><p>${error.message}</p><p>Use the source item to download the ZIP locally, then follow the README.</p></div>`;
      setState("OFFLINE", true);
      launchers.forEach((button) => (button.disabled = false));
    } finally {
      loading = false;
    }
  }

  if (isWebxdc) {
    // webxdc runs in an isolated viewer, where external Archive/CDN requests are
    // intentionally unavailable. The .xdc therefore remains a portable, safe
    // project card rather than silently attempting a network fetch.
    stage.innerHTML = '<div class="boot-copy"><p class="prompt">WEBXDC / OFFLINE CATALOG</p><h2>Original media is not bundled.</h2><p>This package contains the launcher source and preservation notes, but not the third-party disk image or DOSBox runtime. Open the project source outside the webxdc sandbox to run the WASM player.</p></div>';
    launchers.forEach((button) => (button.disabled = true));
    setState("ARCHIVE MODE");
  }

  launchers.forEach((button) => button.addEventListener("click", launch));
  fullscreen.addEventListener("click", () => {
    if (stage.requestFullscreen) stage.requestFullscreen();
  });
  saver.addEventListener("click", () => {
    // No passwords or protection are circumvented. This simply returns focus to
    // the preserved application, whose own screen-saver/menu controls remain authoritative.
    stage.focus();
    setState("USE ORIGINAL MENU");
  });
})();
