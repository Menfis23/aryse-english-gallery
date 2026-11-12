/* =========================================================
   slideshow.js — full-screen deck for an icebreaker, an
   activity, or a full planned lesson (icebreaker + activity).

   slideshow.html?type=ice&id=two-truths&level=beginner
   slideshow.html?type=activity&topic=food&level=middle&theme=soccer
   slideshow.html?type=lesson&topic=bus&level=beginner&ice=human-knot

   Keys: arrows / space = move, F = full screen,
         S = show/hide points, 1–4 = +1 point (Shift = −1)
   ========================================================= */
(async function () {
  const stage = document.getElementById("stage");
  const progressEl = document.getElementById("progress");
  let data;
  try { data = await Data.load(); }
  catch (e) { stage.innerHTML = '<p class="empty">Could not load the data. Run a local server (see README).</p>'; return; }

  const q = new URLSearchParams(location.search);
  const type = q.get("type") || "activity";
  const level = data.levels.find(l => l.id === q.get("level")) || data.levels[0];
  const topic = data.topics.find(t => t.id === q.get("topic")) || data.topics[0];
  const themeId = q.get("theme") || "";
  const theme = data.themes.find(t => t.id === themeId);
  const scenario = theme ? data.scenarios[topic.id][theme.id] : "";
  const ice = data.icebreakers.find(i => i.id === (type === "ice" ? q.get("id") : q.get("ice")));

  document.body.classList.add("t-" + (type === "ice" ? "ice" : topic.id));
  document.getElementById("exit").href = type === "ice" ? "icebreakers.html" : type === "lesson" ? "planner.html" : "activities.html";

  // ---- Slide builders ----
  const slides = [];
  const add = (act, cls, html) => slides.push({ act, cls, html });

  function iceSlides(ib) {
    add("Icebreaker", "sl-cover sl-ice", `
      ${Icons.svg("ice", "icon big-icon")}
      <p class="kicker">Icebreaker &middot; ${ib.minutes} min</p>
      <h1 class="big-title">${esc(ib.name)}</h1>`);
    add("Icebreaker", "sl-plain", `
      <p class="kicker">How to play</p>
      <ol class="steps-big">${ib.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>`);
    add("Icebreaker", "sl-say", `
      <p class="kicker">Say it out loud ${levelBars(level.id)}</p>
      <ul class="say-list">${ib.sayIt[level.id].map(s => `<li tabindex="0">${esc(s)}</li>`).join("")}</ul>`);
    add("Icebreaker", "sl-plain", `
      <p class="kicker">Go!</p>
      <h2 class="mid-title">${esc(ib.name)}</h2>
      ${timer(ib.minutes)}`);
  }

  function activitySlides() {
    add("Start", "sl-cover", `
      ${Icons.svg(topic.id, "icon big-icon")}
      <p class="kicker">${esc(topic.name)} &middot; ${level.name} ${levelBars(level.id)}</p>
      <h1 class="big-title">${esc(scenario || topic.name)}</h1>
      ${theme ? `<p class="cover-sub">${esc(theme.name)} theme</p>` : ""}`);
    add("Words", "sl-plain", `
      <div class="words-head">
        <p class="kicker">Key words</p>
        <div class="lang-toggle" role="group" aria-label="Languages to show">
          ${data.languages.map(l => `<button type="button" data-lang="${l.id}" aria-pressed="true">${l.name}</button>`).join("")}
        </div>
      </div>
      <div class="word-grid">
        ${topic.words.map(w => `
          <div class="word">
            <b>${esc(w.en)}</b>
            ${data.languages.map(l => `<span class="tr" data-lang="${l.id}" dir="${l.dir}" lang="${l.id}">${esc(w[l.id])}</span>`).join("")}
          </div>`).join("")}
      </div>
      <p class="draft-flag">Draft translations: check with a native speaker.</p>`);
    add("Phrases", "sl-say", `
      <p class="kicker">Say it together ${levelBars(level.id)}</p>
      <ul class="say-list">${topic.phrases[level.id].map(p => `<li tabindex="0">${esc(p)}</li>`).join("")}</ul>
      <p class="hint-line">Tap a phrase to spotlight it.</p>`);
    add("Game", "sl-plain", `
      <p class="kicker">Game &middot; ${esc(topic.game.name)}</p>
      ${scenario ? `<p class="twist">${esc(scenario)}</p>` : ""}
      <ol class="steps-big">${topic.game.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
      <p class="tweak">${level.name} version: ${esc(topic.game.tweaks[level.id])}</p>`);
    add("Game", "sl-play", `
      <p class="kicker">Play!</p>
      <h2 class="mid-title">${esc(topic.game.name)}</h2>
      <p class="cover-sub">A point for every sentence said out loud.</p>
      ${timer(15)}`);
    add("Wrap-up", "sl-say", `
      <p class="kicker">Wrap-up</p>
      <h2 class="mid-title">${esc(topic.wrapup)}</h2>
      <p class="hint-line">Everyone answers in one sentence.</p>`);
  }

  if (type === "ice" && ice) iceSlides(ice);
  else if (type === "lesson") { if (ice) iceSlides(ice); activitySlides(); }
  else activitySlides();

  add("End", "sl-cover", `
    <p class="kicker">Great work!</p>
    <h1 class="big-title">You said it in English.</h1>
    <div class="end-score" id="end-score"></div>`);

  document.getElementById("title").textContent =
    type === "ice" && ice ? ice.name : (scenario || topic.name) + " · " + level.name;
  document.title = document.getElementById("title").textContent + " · " + CONFIG.siteName;

  function timer(min) {
    return `<div class="timer" data-seconds="${min * 60}">
      <span class="timer-face">${String(min).padStart(2, "0")}:00</span>
      <span class="timer-btns">
        <button type="button" data-t="toggle">Start timer</button>
        <button type="button" data-t="reset" class="ghost">Reset</button>
      </span></div>`;
  }

  // ---- Draw ----
  stage.innerHTML = slides.map((s, i) =>
    `<section class="slide ${s.cls}" aria-roledescription="slide" aria-label="${i + 1} of ${slides.length}"><div class="slide-inner">${s.html}</div></section>`).join("");
  const acts = [...new Set(slides.map(s => s.act))];
  progressEl.innerHTML = acts.map(act => `<div class="prog-act"><span>${act}</span><div>${
    slides.map((s, i) => s.act === act ? `<button type="button" class="dot" data-go="${i}" aria-label="Slide ${i + 1}"></button>` : "").join("")
  }</div></div>`).join("");
  const slideEls = [...stage.querySelectorAll(".slide")];
  const dots = [...progressEl.querySelectorAll(".dot")];

  // ---- Navigation ----
  let current = Math.max(0, Math.min(slides.length - 1, (parseInt(location.hash.slice(1), 10) || 1) - 1));
  function go(n) {
    current = Math.max(0, Math.min(slides.length - 1, n));
    slideEls.forEach((el, i) => {
      el.classList.toggle("is-active", i === current);
      el.classList.toggle("is-before", i < current);
      el.classList.toggle("is-after", i > current);
      el.inert = i !== current;
    });
    dots.forEach((d, i) => { d.classList.toggle("done", i < current); d.classList.toggle("now", i === current); });
    document.getElementById("prev").disabled = current === 0;
    document.getElementById("next").disabled = current === slides.length - 1;
    history.replaceState(null, "", "#" + (current + 1));
    if (current === slides.length - 1) drawEndScore();
  }
  document.getElementById("prev").addEventListener("click", () => go(current - 1));
  document.getElementById("next").addEventListener("click", () => go(current + 1));
  progressEl.addEventListener("click", e => { const d = e.target.closest("[data-go]"); if (d) go(Number(d.dataset.go)); });
  stage.addEventListener("click", e => {
    if (e.target.closest("button, a, li, .word, .lang-toggle")) return;
    go(e.clientX / innerWidth < 0.2 ? current - 1 : current + 1);
  });
  let tx = null;
  stage.addEventListener("touchstart", e => { tx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
    tx = null;
  });

  document.addEventListener("keydown", e => {
    const onButton = e.target.closest && e.target.closest("button, a, li");
    if (onButton && (e.key === " " || e.key === "Enter")) return;
    if (/^[1-4]$/.test(e.key) || (e.shiftKey && /^Digit[1-4]$/.test(e.code))) {
      const n = Number(e.code.slice(-1)) - 1;
      if (n < teams.length) { addPoint(n, e.shiftKey ? -1 : 1); e.preventDefault(); }
      return;
    }
    switch (e.key) {
      case "ArrowRight": case "PageDown": case " ": e.preventDefault(); go(current + 1); break;
      case "ArrowLeft": case "PageUp": e.preventDefault(); go(current - 1); break;
      case "Home": go(0); break;
      case "End": go(slides.length - 1); break;
      case "f": case "F": toggleFs(); break;
      case "s": case "S": toggleScore(); break;
    }
  });

  document.getElementById("fullscreen").addEventListener("click", toggleFs);
  function toggleFs() { document.fullscreenElement ? document.exitFullscreen?.() : document.documentElement.requestFullscreen?.(); }

  // ---- Language toggles (remembered in this browser) ----
  const shownLangs = store.get("eag-langs", data.languages.map(l => l.id));
  function applyLangs() {
    stage.querySelectorAll(".lang-toggle button").forEach(b => b.setAttribute("aria-pressed", shownLangs.includes(b.dataset.lang)));
    stage.querySelectorAll(".tr").forEach(s => { s.hidden = !shownLangs.includes(s.dataset.lang); });
  }
  stage.addEventListener("click", e => {
    const b = e.target.closest(".lang-toggle button");
    if (!b) return;
    const id = b.dataset.lang;
    const i = shownLangs.indexOf(id);
    i >= 0 ? shownLangs.splice(i, 1) : shownLangs.push(id);
    store.set("eag-langs", shownLangs);
    applyLangs();
  });
  applyLangs();

  // ---- Spotlight a phrase ----
  stage.addEventListener("click", e => {
    const li = e.target.closest(".say-list li");
    if (!li) return;
    const on = !li.classList.contains("spot");
    li.parentElement.querySelectorAll("li").forEach(x => x.classList.remove("spot"));
    li.classList.toggle("spot", on);
  });

  // ---- Timers ----
  stage.querySelectorAll(".timer").forEach(t => {
    const face = t.querySelector(".timer-face");
    const btn = t.querySelector('[data-t="toggle"]');
    const total = Number(t.dataset.seconds);
    let left = total, tick = null;
    const show = () => {
      face.textContent = String(Math.floor(left / 60)).padStart(2, "0") + ":" + String(left % 60).padStart(2, "0");
      t.classList.toggle("low", left <= 60 && left > 0);
      t.classList.toggle("over", left === 0);
    };
    const stop = () => { clearInterval(tick); tick = null; };
    t.addEventListener("click", e => {
      const a = e.target.dataset.t;
      if (a === "toggle") {
        if (tick) { stop(); btn.textContent = "Resume"; return; }
        if (left === 0) left = total;
        btn.textContent = "Pause";
        tick = setInterval(() => { left = Math.max(0, left - 1); show(); if (!left) { stop(); btn.textContent = "Time's up! Again"; } }, 1000);
      }
      if (a === "reset") { stop(); left = total; btn.textContent = "Start timer"; show(); }
    });
  });

  // ---- Team scoreboard (kept for this browser tab only) ----
  const board = document.getElementById("scoreboard");
  let teams = JSON.parse(sessionStorage.getItem("eag-teams") || "null") || [
    { name: "Team A", pts: 0 }, { name: "Team B", pts: 0 }
  ];
  const saveTeams = () => sessionStorage.setItem("eag-teams", JSON.stringify(teams));

  function drawBoard() {
    board.innerHTML = `
      ${teams.map((t, i) => `
        <div class="team team-${i}">
          <span class="team-name">${esc(t.name)}<kbd>${i + 1}</kbd></span>
          <span class="team-pts" id="pts-${i}">${t.pts}</span>
          <span class="team-btns">
            <button type="button" data-team="${i}" data-d="-1" aria-label="Take a point from ${esc(t.name)}">&minus;</button>
            <button type="button" data-team="${i}" data-d="1" aria-label="Give ${esc(t.name)} a point">+</button>
          </span>
        </div>`).join("")}
      <div class="board-tools">
        <button type="button" data-tool="add" ${teams.length >= 4 ? "disabled" : ""}>+ team</button>
        <button type="button" data-tool="remove" ${teams.length <= 2 ? "disabled" : ""}>&minus; team</button>
        <button type="button" data-tool="reset">Reset</button>
      </div>`;
  }
  function addPoint(i, d) {
    teams[i].pts = Math.max(0, teams[i].pts + d);
    saveTeams();
    const el = document.getElementById("pts-" + i);
    if (el) { el.textContent = teams[i].pts; el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
  }
  board.addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.team) return addPoint(Number(b.dataset.team), Number(b.dataset.d));
    if (b.dataset.tool === "add") teams.push({ name: "Team " + "ABCD"[teams.length], pts: 0 });
    if (b.dataset.tool === "remove") teams.pop();
    if (b.dataset.tool === "reset") teams.forEach(t => { t.pts = 0; });
    saveTeams();
    drawBoard();
  });
  const scoreBtn = document.getElementById("score-toggle");
  function toggleScore() {
    const show = board.hidden;
    board.hidden = !show;
    scoreBtn.setAttribute("aria-pressed", show);
  }
  scoreBtn.addEventListener("click", toggleScore);

  function drawEndScore() {
    const max = Math.max(...teams.map(t => t.pts));
    const el = document.getElementById("end-score");
    if (!el || max === 0) { if (el) el.innerHTML = ""; return; }
    const winners = teams.filter(t => t.pts === max).map(t => t.name);
    el.innerHTML = `<p class="cover-sub">${winners.length > 1 ? "Tie: " + winners.join(" & ") : winners[0] + " wins"} with ${max} points!</p>`;
  }

  drawBoard();
  go(current);
})();
