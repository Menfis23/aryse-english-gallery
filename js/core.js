/* =========================================================
   core.js — shared by every page.
   - Data.load()  loads the three JSON files once
   - store        safe localStorage get/set
   - Icons        line drawings for topics and interests
   - Nav/footer   drawn here so all pages stay in sync
   ========================================================= */

const Data = (() => {
  let cache = null;
  async function load() {
    if (cache) return cache;
    const [acts, ice, themes] = await Promise.all(
      ["data/activities.json", "data/icebreakers.json", "data/themes.json"].map(async url => {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Could not load " + url);
        return res.json();
      })
    );
    cache = {
      languages: acts.languages,
      levels: acts.levels,
      ages: acts.ages,
      topics: acts.topics,
      icebreakers: ice.icebreakers,
      iceStyles: ice.styles || [],
      themes: themes.themes,
      scenarios: themes.scenarios
    };
    return cache;
  }
  return { load };
})();

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const store = {
  get(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private window: skip */ }
  }
};

/* Level shown as 1–3 bars, like phone signal */
function levelBars(levelId) {
  const n = { beginner: 1, middle: 2, confident: 3 }[levelId] || 1;
  return `<span class="bars" aria-hidden="true">${[1, 2, 3].map(i => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
}

/* Line icons, 48x48. stroke = currentColor so CSS sets the color. */
const Icons = (() => {
  const p = {
    // interests
    soccer: '<circle cx="24" cy="24" r="18"/><path d="M24 16l7 5-3 8h-8l-3-8zM24 6v10M31 21l9-3M28 29l5 8M20 29l-5 8M17 21l-9-3"/>',
    basketball: '<circle cx="24" cy="24" r="18"/><path d="M6 24h36M24 6v36M11 11c7 6 7 20 0 26M37 11c-7 6-7 20 0 26"/>',
    music: '<path d="M10 28v-4a14 14 0 0 1 28 0v4"/><rect x="7" y="27" width="8" height="12" rx="2"/><rect x="33" y="27" width="8" height="12" rx="2"/>',
    gaming: '<path d="M14 16h20a8 8 0 0 1 8 8l1 8a5 5 0 0 1-9 3l-3-4H17l-3 4a5 5 0 0 1-9-3l1-8a8 8 0 0 1 8-8z"/><path d="M15 21v8M11 25h8"/><circle cx="31" cy="23" r="1.6" class="dot"/><circle cx="35" cy="27" r="1.6" class="dot"/>',
    sneakers: '<path d="M5 31c0-6 2-12 4-14l8 4 4-3 3 4c6 2 13 3 17 6 2 2 2 5 1 7H7c-1 0-2-2-2-4z"/><path d="M5 35h37M17 21l-2 5M22 23l-2 5"/>',
    homefood: '<path d="M6 25h36a18 14 0 0 1-36 0z"/><path d="M18 39h12M17 19c0-3 3-3 3-6M24 19c0-3 3-3 3-6M31 19c0-3 3-3 3-6"/>',
    videos: '<rect x="14" y="5" width="20" height="38" rx="4"/><path d="M21 19v10l8-5z"/><path d="M22 39h4"/>',
    // topics
    food: '<circle cx="26" cy="24" r="11"/><path d="M7 8v11a3 3 0 0 0 6 0V8M10 8v32M41 8c-4 2-5 7-5 12h5v20"/>',
    bus: '<rect x="9" y="6" width="30" height="30" rx="5"/><path d="M9 22h30M9 14h30M15 36v5M33 36v5"/><circle cx="16" cy="29" r="2" class="dot"/><circle cx="32" cy="29" r="2" class="dot"/>',
    school: '<path d="M14 17a10 10 0 0 1 20 0v23H14z"/><path d="M19 11V7h10v4M14 27h20M20 27v5h8v-5"/>',
    doctor: '<rect x="8" y="8" width="32" height="32" rx="7"/><path d="M24 16v16M16 24h16"/>',
    interview: '<rect x="6" y="15" width="36" height="24" rx="3"/><path d="M18 15v-4h12v4M6 25h36M22 25v4h4v-4"/>',
    bank: '<path d="M6 18L24 7l18 11zM11 18v16M19 18v16M29 18v16M37 18v16M6 39h36"/>',
    // other
    ice: '<path d="M6 9h24v15H16l-6 5v-5H6z"/><path d="M34 17h8v15h-4v5l-6-5H20v-4"/>',
    vote: '<path d="M8 24l8 8 18-18"/><rect x="4" y="4" width="40" height="40" rx="8"/>'
  };
  const svg = (name, cls = "icon") =>
    `<svg class="${cls}" viewBox="0 0 48 48" aria-hidden="true">${p[name] || p.ice}</svg>`;
  return { svg };
})();

/* ---- Shared nav + footer + tab icon ---- */
(function drawChrome() {
  if (!document.querySelector("link[rel=icon]")) {
    const icon = document.createElement("link");
    icon.rel = "icon";
    icon.href = "data:image/svg+xml," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M4 4h24v18H12l-6 6v-6H4z" fill="#0E5E5A"/>' +
      '<text x="16" y="17" font-family="Arial" font-weight="bold" font-size="11" fill="#F4B63F" text-anchor="middle">Aa</text></svg>');
    document.head.appendChild(icon);
  }
  const pages = [
    ["index.html", "Home"],
    ["icebreakers.html", "Icebreakers"],
    ["activities.html", "Activities"],
    ["survey.html", "Survey"],
    ["add.html", "Add your own"]
  ];
  const here = location.pathname.split("/").pop() || "index.html";
  const nav = document.querySelector("header.nav");
  if (nav) {
    nav.innerHTML = `
      <a class="brand" href="index.html">
        <span class="brand-mark" aria-hidden="true">Aa</span>
        <span class="brand-text"><b>${esc(CONFIG.siteName)}</b><small>${esc(CONFIG.orgLine)}</small></span>
      </a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav-links">Menu</button>
      <nav id="nav-links" aria-label="Main">
        ${pages.map(([href, label]) =>
          `<a href="${href}"${href === here ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
        <a class="nav-cta" href="planner.html"${here === "planner.html" ? ' aria-current="page"' : ""}>Plan a lesson</a>
      </nav>`;
    const btn = nav.querySelector(".menu-btn");
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open);
    });
  }
  const foot = document.querySelector("footer.footer");
  if (foot) {
    foot.innerHTML = `
      <p><b>${esc(CONFIG.siteName)}</b> &middot; a counselor toolkit (working name).</p>
      <p class="fine">Independent demo, not an official ARYSE website. Translations are drafts and need a check by native speakers.</p>`;
  }
})();
