/* Local-only, complete public app index. Never use archive titles as HTML. */
(() => {
  const list = document.getElementById("app-list"), count = document.getElementById("app-count"), search = document.getElementById("app-search");
  const context = document.getElementById("ctx");
  const secure = window.isSecureContext, microphone = Boolean(navigator.mediaDevices?.getUserMedia);
  context.className = "ctx " + (secure ? "ok" : "bad");
  context.textContent = (secure ? "Secure context" : "Not a secure context") + (microphone ? " · microphone API available, permission not requested" : " · microphone API unavailable");
  let apps = [], ready = false;
  function render() {
    if (!ready) return;
    const query = search.value.trim().toLocaleLowerCase();
    const shown = apps.filter((app) => `${app.name} ${app.slug} ${app.description}`.toLocaleLowerCase().includes(query));
    list.replaceChildren();
    for (const app of shown) {
      const link = document.createElement("a"), title = document.createElement("h2"), description = document.createElement("p"), tag = document.createElement("span");
      link.className = "card"; link.href = `./${encodeURIComponent(app.slug)}/index.html`;
      title.textContent = app.name; description.textContent = app.description || "Packaged local HTML app. Review its own notes and limitations before using sensitive data.";
      tag.className = "tag"; tag.textContent = app.slug;
      link.append(title, description, tag); list.append(link);
    }
    count.textContent = `${shown.length} of ${apps.length} approved apps`;
  }
  search.addEventListener("input", render);
  fetch("./catalog.json", { cache: "no-store" }).then((response) => {
    if (!response.ok) throw new Error("catalog unavailable");
    return response.json();
  }).then((catalog) => {
    if (catalog.version !== 1 || catalog.profile !== "public" || !Array.isArray(catalog.apps) || !catalog.apps.length || catalog.apps.length > 1000) throw new Error("catalog invalid");
    const seen = new Set();
    for (const app of catalog.apps) {
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(app.slug) || seen.has(app.slug) || typeof app.name !== "string" || typeof app.description !== "string") throw new Error("catalog invalid");
      seen.add(app.slug);
    }
    apps = catalog.apps; ready = true; render();
  }).catch(() => { count.textContent = "The full catalog could not load. Serve this page over HTTPS and retry; the direct links below remain available."; });
})();
