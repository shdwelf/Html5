(function () {
  const intro = document.getElementById("bookIntro");
  const skip = document.getElementById("skipBookIntro");
  const replay = document.getElementById("replayBookIntro");
  const page = document.getElementById("book");
  if (!intro || !skip || !page) return;

  const SEEN_KEY = "greeran-book-intro-seen-v1";
  const reducedMotion = typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const background = [document.querySelector(".studio-bar"), document.querySelector(".workspace")].filter(Boolean);
  const previousAriaHidden = new Map();
  let finishTimer = 0;
  let closeTimer = 0;
  let active = false;

  function markSeen() {
    try { window.sessionStorage.setItem(SEEN_KEY, "1"); } catch (_error) { /* Storage can be disabled. */ }
  }

  function setBackgroundInert(inert) {
    for (const element of background) {
      if (inert) {
        previousAriaHidden.set(element, element.getAttribute("aria-hidden"));
        element.setAttribute("aria-hidden", "true");
        if ("inert" in element) element.inert = true;
      } else {
        if ("inert" in element) element.inert = false;
        const previous = previousAriaHidden.get(element);
        if (previous === null || previous === undefined) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", previous);
        previousAriaHidden.delete(element);
      }
    }
  }

  function closeIntro(shouldFocus = true) {
    if (!active) return;
    active = false;
    window.clearTimeout(finishTimer);
    intro.classList.add("is-leaving");
    intro.setAttribute("aria-hidden", "true");
    document.body.classList.remove("book-intro-active");
    setBackgroundInert(false);
    markSeen();
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      intro.hidden = true;
      intro.classList.remove("is-playing", "is-leaving");
      if (shouldFocus) {
        page.focus({ preventScroll: true });
        document.getElementById("premise")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      }
    }, reducedMotion ? 0 : 560);
  }

  function playIntro() {
    if (active) {
      active = false;
      window.clearTimeout(finishTimer);
    }
    window.clearTimeout(closeTimer);
    intro.hidden = false;
    intro.setAttribute("aria-hidden", "false");
    intro.classList.remove("is-playing", "is-leaving");
    document.body.classList.add("book-intro-active");
    setBackgroundInert(true);
    // Restart CSS keyframes even when the user replays the same intro.
    void intro.offsetWidth;
    intro.classList.add("is-playing");
    active = true;
    markSeen();
    skip.focus({ preventScroll: true });
    finishTimer = window.setTimeout(() => closeIntro(true), reducedMotion ? 320 : 5550);
  }

  skip.addEventListener("click", () => closeIntro(true));
  intro.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeIntro(true);
    }
  });
  replay?.addEventListener("click", playIntro);

  let alreadySeen = false;
  try { alreadySeen = window.sessionStorage.getItem(SEEN_KEY) === "1"; } catch (_error) { /* Play once per visit if storage is unavailable. */ }
  if (!alreadySeen && !reducedMotion) playIntro();
})();
