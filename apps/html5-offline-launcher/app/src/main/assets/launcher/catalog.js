(() => {
  const grid = document.getElementById("app-grid");
  const search = document.getElementById("search");
  const count = document.getElementById("app-count");
  const label = document.getElementById("results-label");
  const empty = document.getElementById("empty-state");
  const error = document.getElementById("error-state");
  const clear = document.getElementById("clear-search");
  let apps = [];

  const palette = [
    ["#dff4ef", "#087d6d"],
    ["#e9e8ff", "#5650aa"],
    ["#fff0df", "#a95d17"],
    ["#e4eefb", "#33629b"],
    ["#f8e8ee", "#a53e65"],
    ["#e7f1d8", "#55772f"],
  ];

  function makeCard(app, index) {
    const link = document.createElement("a");
    link.className = "app-card";
    link.href = `https://${app.host}/index.html`;
    link.setAttribute("aria-label", `Open ${app.name}`);

    const mark = document.createElement("span");
    mark.className = "app-mark";
    const color = palette[index % palette.length];
    mark.style.setProperty("--mark-bg", color[0]);
    mark.style.setProperty("--mark-ink", color[1]);
    mark.textContent = (app.name || app.slug).trim().charAt(0).toUpperCase() || "•";
    mark.setAttribute("aria-hidden", "true");

    const copy = document.createElement("span");
    copy.className = "app-copy";
    const name = document.createElement("span");
    name.className = "app-name";
    name.textContent = app.name || app.slug;
    const slug = document.createElement("span");
    slug.className = "app-slug";
    slug.textContent = app.slug;
    copy.appendChild(name);
    copy.appendChild(slug);

    const arrow = document.createElement("span");
    arrow.className = "app-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";

    link.appendChild(mark);
    link.appendChild(copy);
    link.appendChild(arrow);
    if (app.hasRemoteResources) {
      const badge = document.createElement("span");
      badge.className = "remote-badge";
      badge.textContent = "Remote asset blocked";
      link.appendChild(badge);
    }
    return link;
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const visible = apps.filter((app) =>
      `${app.name} ${app.slug} ${app.description || ""}`.toLocaleLowerCase().includes(query),
    );
    while (grid.firstChild) grid.removeChild(grid.firstChild);
    visible.forEach((app) => grid.appendChild(makeCard(app, apps.indexOf(app))));
    label.textContent = query
      ? `${visible.length} of ${apps.length} apps`
      : `${apps.length} apps · all entrypoints stored on this device`;
    empty.hidden = visible.length !== 0;
  }

  search.addEventListener("input", render);
  clear.addEventListener("click", () => {
    search.value = "";
    render();
    search.focus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !event.ctrlKey && !event.metaKey &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      search.focus();
    }
  });

  fetch("/catalog.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`Catalog response ${response.status}`);
      return response.json();
    })
    .then((catalog) => {
      if (!catalog || catalog.version !== 1 || !Array.isArray(catalog.apps)) {
        throw new Error("Unsupported local catalog format");
      }
      apps = catalog.apps;
      count.textContent = String(apps.length);
      render();
    })
    .catch(() => {
      count.textContent = "—";
      label.textContent = "Catalog unavailable";
      error.hidden = false;
    });
})();
