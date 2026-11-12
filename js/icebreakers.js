/* icebreakers.js — Icebreaker library with filters saved in the URL. */
(async function () {
  const grid = document.getElementById("grid");
  let data;
  try { data = await Data.load(); }
  catch (e) { grid.innerHTML = '<p class="empty">Could not load the data. Run a local server (see README).</p>'; return; }

  const filters = {
    size:  [["all", "Any"], ["small", "Up to 10"], ["medium", "11–20"], ["large", "21+"]],
    age:   [["all", "Any"], ...data.ages.map(a => [a.id, a.id])],
    level: [["all", "Any"], ...data.levels.map(l => [l.id, l.name])],
    time:  [["all", "Any"], ["10", "10 min or less"], ["15", "15 min or less"], ["20", "20 min or less"]]
  };
  const sizeRange = { small: [1, 10], medium: [11, 20], large: [21, 99] };

  const params = new URLSearchParams(location.search);
  const state = {};
  Object.keys(filters).forEach(k => { state[k] = params.get(k) || "all"; });

  // Draw pills
  document.querySelectorAll("[data-f]").forEach(box => {
    const key = box.dataset.f;
    box.innerHTML = filters[key].map(([v, label]) =>
      `<button type="button" class="pill" data-v="${v}">${key === "level" && v !== "all" ? levelBars(v) : ""}${label}</button>`).join("");
    box.addEventListener("click", e => {
      const b = e.target.closest(".pill");
      if (!b) return;
      state[key] = b.dataset.v;
      render();
    });
  });
  document.getElementById("clear").addEventListener("click", () => {
    Object.keys(state).forEach(k => { state[k] = "all"; });
    render();
  });

  function fits(ib) {
    if (state.age !== "all" && !ib.ages.includes(state.age)) return false;
    if (state.level !== "all" && !ib.levels.includes(state.level)) return false;
    if (state.time !== "all" && ib.minutes > Number(state.time)) return false;
    if (state.size !== "all") {
      const [lo, hi] = sizeRange[state.size];
      if (ib.groupMax < lo || ib.groupMin > hi) return false;   // ranges must overlap
    }
    return true;
  }

  function render() {
    document.querySelectorAll("[data-f]").forEach(box => {
      box.querySelectorAll(".pill").forEach(b => {
        const on = b.dataset.v === state[box.dataset.f];
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on);
      });
    });
    const q = new URLSearchParams(Object.entries(state).filter(([, v]) => v !== "all"));
    history.replaceState(null, "", q.toString() ? "?" + q : location.pathname);

    const list = data.icebreakers.filter(fits);
    document.getElementById("count").textContent = list.length + (list.length === 1 ? " icebreaker" : " icebreakers");
    document.getElementById("clear").hidden = Object.values(state).every(v => v === "all");

    // When a level is picked, open the slideshow at that level
    const lvl = state.level !== "all" ? state.level : "";
    grid.innerHTML = list.length ? list.map(ib => `
      <a class="tile t-ice" href="slideshow.html?type=ice&id=${ib.id}${lvl ? "&level=" + lvl : ""}">
        <div class="tile-top">
          ${Icons.svg("ice")}
          <div class="tile-tags"><span>${ib.minutes} min</span><span>${ib.groupMin}–${ib.groupMax} people</span></div>
        </div>
        <div class="tile-body">
          <h3>${esc(ib.name)}</h3>
          <p>${esc(ib.steps[0])}</p>
          <p class="tile-meta">
            <span>${ib.levels.map(l => levelBars(l)).join(" ")}</span>
            <span>${ib.levels.length === 3 ? "All levels" : ib.levels.map(l => l[0].toUpperCase() + l.slice(1)).join(", ")}</span>
          </p>
        </div>
      </a>`).join("")
      : '<p class="empty">No icebreakers match. Try a different group size or time.</p>';
  }

  render();
})();
