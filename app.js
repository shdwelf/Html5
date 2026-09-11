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
  const exitFullscreen = document.querySelector("#exit-fullscreen");
  const saver = document.querySelector("#saver");
  let player = null;
  let loading = false;
  const isWebxdc = typeof window.webxdc === "object";

  function setState(message, bad = false) {
    state.textContent = message;
    state.classList.toggle("bad", bad);
  }

  function loadDosRuntime() {
    if (typeof window.Dos === "function") return Promise.resolve();
    return new Promise((resolve, reject) => {
      const runtime = document.createElement("script");
      runtime.src = "https://v8.js-dos.com/latest/js-dos.js";
      runtime.onload = resolve;
      runtime.onerror = () => reject(new Error("The DOSBox runtime could not be downloaded."));
      document.head.append(runtime);
    });
  }

  async function launch() {
    if (loading || player || isWebxdc) return;
    loading = true;
    launchers.forEach((button) => (button.disabled = true));
    setState("MOUNTING DISK…");

    try {
      await loadDosRuntime();
      stage.replaceChildren();
      // Keep js-dos' control sidebar enabled: it provides its own mobile/mouse
      // toggle and soft keyboard. Mouse capture is off on touch devices.
      player = window.Dos(stage, {
        url: diskUrl,
        autoStart: true,
        kiosk: false,
        theme: "dark",
        backend: "dosbox",
        mouseCapture: false,
        softFullscreen: true,
        thinSidebar: false,
        scaleControls: 1.5,
        renderAspect: "4/3",
        softKeyboardLayout: [
          "q w e r t y u i o p",
          "a s d f g h j k l {enter}",
          "{shift} z x c v b n m {bksp}",
          "{esc} {tab} {space} {up} {down} {left} {right}",
          "{f1} {f2} {f3} {f4} {f5} {layout}"
        ]
      });
      player.setMouseCapture(false);
      player.setScaleControls(1.5);
      setState("ONLINE / TAP KEYBOARD ICON");
      fullscreen.disabled = false;
      exitFullscreen.disabled = false;
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
    if (player?.setFullScreen) player.setFullScreen(true);
  });
  exitFullscreen.addEventListener("click", () => {
    if (player?.setFullScreen) player.setFullScreen(false);
    if (document.fullscreenElement) document.exitFullscreen?.();
  });
  // A tap transfers focus back to the emulator after browser fullscreen changes.
  stage.addEventListener("pointerdown", () => stage.focus(), { passive: true });
  saver.addEventListener("click", () => {
    // No passwords or protection are circumvented. This simply returns focus to
    // the preserved application, whose own screen-saver/menu controls remain authoritative.
    stage.focus();
    setState("USE ORIGINAL MENU");
  });
})();
