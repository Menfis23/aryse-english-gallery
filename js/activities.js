/* activities.js — Activity library: one card per topic x level.
   Picking an interest ("Group is into") re-themes every card. */
(async function () {
  const grid = document.getElementById("grid");
  let data;
  try { data = await Data.load(); }
  catch (e) { grid.innerHTML = '<p class="empty">Could not load the data. Run a local server (see README).</p>'; return; }

  const filters = {
    topic: [["all", "All"], ...data.topics.map(t => [t.id, t.name])],
    age:   [["all", "Any"], ...data.ages.map(a => [a.id, a.id])],
    level: [["all", "Any"], ...data.levels.map(l => [l.id, l.name])],
    theme: [["none", "No theme"], ...data.themes.map(t => [t.id, t.name])]
  };
  const defaults = { topic: "all", age: "all", level: "all", theme: "none" };

  const params = new URLSearchParams(location.search);
  const state = {};
  Object.keys(filters).forEach(k => { state[k] = params.get(k) || defaults[k]; });

  document.querySelectorAll("[data-f]").forEach(box => {
    const key = box.dataset.f;
    box.innerHTML = filters[key].map(([v, label]) => {
      const pre = key === "level" && v !== "all" ? levelBars(v)
        : key === "theme" && v !== "none" ? Icons.svg(v, "icon pill-icon") : "";
      return `<button type="button" class="pill" data-v="${v}">${pre}${label}</button>`;
    }).join("");
    box.addEventListener("click", e => {
      const b = e.target.closest(".pill");
      if (!b) return;
      state[key] = b.dataset.v;
      render();
    });
  });
  document.getElementById("clear").addEventListener("click", () => { Object.assign(state, defaults); render(); });

  function render() {
    document.querySelectorAll("[data-f]").forEach(box => {
      box.querySelectorAll(".pill").forEach(b => {
        const on = b.dataset.v === state[box.dataset.f];
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on);
      });
    });
    const q = new URLSearchParams(Object.entries(state).filter(([k, v]) => v !== defaults[k]));
    history.replaceState(null, "", q.toString() ? "?" + q : location.pathname);

    const cards = [];
    data.topics.forEach(t => {
      if (state.topic !== "all" && t.id !== state.topic) return;
      if (state.age !== "all" && !t.ages.includes(state.age)) return;
      data.levels.forEach(l => {
        if (state.level !== "all" && l.id !== state.level) return;
        cards.push({ t, l });
      });
    });

    document.getElementById("count").textContent = cards.length + (cards.length === 1 ? " activity" : " activities");
    document.getElementById("clear").hidden = Object.keys(state).every(k => state[k] === defaults[k]);

    const theme = state.theme !== "none" ? state.theme : "";
    grid.innerHTML = cards.length ? cards.map(({ t, l }) => {
      const scenario = theme ? data.scenarios[t.id][theme] : "";
      const href = `slideshow.html?type=activity&topic=${t.id}&level=${l.id}` +
        (theme ? `&theme=${theme}` : "") + (state.age !== "all" ? `&age=${state.age}` : "");
      return `
      <a class="tile t-${t.id}" href="${href}">
        <div class="tile-top">
          ${Icons.svg(t.id)}
          <div class="tile-tags"><span>${levelBars(l.id)} ${l.name}</span><span>${t.ages.length === 2 ? "Ages 11–21" : "Ages " + t.ages[0]}</span></div>
        </div>
        <div class="tile-body">
          <h3>${esc(t.name)}</h3>
          <p>${esc(scenario || t.phrases[l.id][0])}</p>
          <p class="tile-meta"><span>Game: ${esc(t.game.name)}</span><span>${t.words.length} key words</span></p>
        </div>
      </a>`;
    }).join("") : '<p class="empty">No activities match. Job interviews and bank accounts are for ages 15–21.</p>';
  }

  render();
})();
