/* =========================================================
   survey.js — the day-one picture survey.

   Saved in this browser under "eag-survey":
     { age, count, interests: {soccer: 5, ...}, levels: {...}, topics: {...} }
   The lesson planner reads it to pick a theme and topic.
   ========================================================= */
(async function () {
  const stage = document.getElementById("stage");
  const tabRun = document.getElementById("tab-run");
  const tabResults = document.getElementById("tab-results");
  let data;
  try { data = await Data.load(); }
  catch (e) { stage.innerHTML = '<p class="empty">Could not load the data. Run a local server (see README).</p>'; return; }

  const KEY = "eag-survey";
  const blank = () => ({ age: "", count: 0, interests: {}, levels: {}, topics: {} });
  let results = store.get(KEY, blank());

  const levelWords = { beginner: "A little", middle: "Some", confident: "A lot" };

  // The three questions. Short words, big pictures.
  const questions = () => [
    { key: "interests", q: "What do you like?", multi: true,
      opts: data.themes.map(t => ({ id: t.id, label: t.name, art: Icons.svg(t.id) })) },
    { key: "levels", q: "How much English do you know?", multi: false,
      opts: data.levels.map(l => ({ id: l.id, label: levelWords[l.id], art: levelBars(l.id) })) },
    { key: "topics", q: "What do you want to learn?", multi: false,
      opts: data.topics.filter(t => t.ages.includes(results.age)).map(t => ({ id: t.id, label: t.name, art: Icons.svg(t.id) })) }
  ];

  let step = 0;
  let answers = {};

  // ---- Tabs ----
  tabRun.addEventListener("click", () => showTab("run"));
  tabResults.addEventListener("click", () => showTab("results"));
  function showTab(which) {
    tabRun.setAttribute("aria-selected", which === "run");
    tabResults.setAttribute("aria-selected", which === "results");
    which === "run" ? (results.age ? startStudent() : drawSetup()) : drawResults();
  }

  // ---- Counselor setup (age group decides which topics appear) ----
  function drawSetup() {
    stage.innerHTML = `
      <div class="setup">
        ${Icons.svg("vote", "icon")}
        <h2>Before you start</h2>
        <p class="sub">Which age group is taking the survey? This sets the topics they can vote on.</p>
        <div class="seg">
          ${data.ages.map(a => `<label class="seg-opt"><input type="radio" name="age" value="${a.id}"><span>${a.name}</span></label>`).join("")}
        </div>
        <button class="s-next" id="start" disabled>Start survey</button>
      </div>`;
    const startBtn = stage.querySelector("#start");
    stage.querySelectorAll("input[name=age]").forEach(r => r.addEventListener("change", () => { startBtn.disabled = false; }));
    startBtn.addEventListener("click", () => {
      results.age = stage.querySelector("input[name=age]:checked").value;
      store.set(KEY, results);
      startStudent();
    });
  }

  // ---- One student ----
  function startStudent() {
    step = 0;
    answers = { interests: [], levels: [], topics: [] };
    drawQuestion();
  }

  function drawQuestion() {
    const qs = questions();
    const q = qs[step];
    stage.innerHTML = `
      <div class="s-progress">${qs.map((_, i) => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div>
      <h2 class="s-q">${q.q}</h2>
      <p class="sub" style="text-align:center;margin-top:-1rem">${q.multi ? "Tap all you like." : "Tap one."}</p>
      <div class="pick-grid">
        ${q.opts.map(o => `
          <button type="button" class="pick" data-id="${o.id}" aria-pressed="${answers[q.key].includes(o.id)}">
            ${o.art}<span>${esc(o.label)}</span>
          </button>`).join("")}
      </div>
      <div class="s-actions">
        <button type="button" class="s-back" ${step === 0 ? "hidden" : ""}>&larr; Back</button>
        <span></span>
        <button type="button" class="s-next" ${answers[q.key].length ? "" : "disabled"}>${step === qs.length - 1 ? "Done" : "Next &rarr;"}</button>
      </div>`;

    const next = stage.querySelector(".s-next");
    stage.querySelectorAll(".pick").forEach(btn => btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (q.multi) {
        const on = btn.getAttribute("aria-pressed") !== "true";
        btn.setAttribute("aria-pressed", on);
        answers[q.key] = on ? [...answers[q.key], id] : answers[q.key].filter(x => x !== id);
      } else {
        stage.querySelectorAll(".pick").forEach(b => b.setAttribute("aria-pressed", b === btn));
        answers[q.key] = [id];
      }
      next.disabled = !answers[q.key].length;
    }));
    stage.querySelector(".s-back").addEventListener("click", () => { step--; drawQuestion(); });
    next.addEventListener("click", () => {
      if (step < qs.length - 1) { step++; drawQuestion(); }
      else finishStudent();
    });
  }

  function finishStudent() {
    Object.keys(answers).forEach(k => answers[k].forEach(id => {
      results[k][id] = (results[k][id] || 0) + 1;
    }));
    results.count++;
    store.set(KEY, results);

    stage.innerHTML = `
      <div class="s-done">
        <div>
          ${Icons.svg("vote")}
          <h2>Thank you!</h2>
          <p class="sub">Pass it to the next person.</p>
          <button type="button" class="s-next" id="again">Next student</button>
          <p class="hint">${results.count} ${results.count === 1 ? "student has" : "students have"} answered.</p>
        </div>
      </div>`;
    stage.querySelector("#again").addEventListener("click", startStudent);
  }

  // ---- Results for the counselor ----
  function drawResults() {
    const block = (title, key, items) => {
      const max = Math.max(1, ...items.map(i => results[key][i.id] || 0));
      const sorted = [...items].sort((a, b) => (results[key][b.id] || 0) - (results[key][a.id] || 0));
      const topVal = results[key][sorted[0]?.id] || 0;
      return `
        <div class="res-block">
          <h3>${title}</h3>
          ${sorted.map(i => {
            const n = results[key][i.id] || 0;
            return `<div class="res-row${n && n === topVal ? " top" : ""}">
              <span class="res-label">${i.art || ""}${esc(i.label)}</span>
              <span class="res-track"><span class="res-fill" style="width:${(n / max) * 100}%"></span></span>
              <span class="res-num">${n}</span>
            </div>`;
          }).join("")}
        </div>`;
    };

    if (!results.count) {
      stage.innerHTML = `<div class="s-done"><div><h2 style="font-size:2rem">No answers yet</h2><p class="sub">Switch to Students to run the survey.</p></div></div>`;
      return;
    }

    const ageName = (data.ages.find(a => a.id === results.age) || {}).name || "";
    stage.innerHTML = `
      <div class="results">
        <div class="survey-bar" style="margin:0">
          <h2 style="margin:0">${results.count} ${results.count === 1 ? "student" : "students"} &middot; ${ageName}</h2>
          <div class="plan-actions">
            <a class="btn btn-coral btn-small" href="planner.html?from=survey">Plan a lesson from this</a>
            <button type="button" class="btn btn-ghost btn-small" id="reset">Start a new group</button>
          </div>
        </div>
        ${block("What they're into", "interests", data.themes.map(t => ({ id: t.id, label: t.name, art: Icons.svg(t.id) })))}
        ${block("Topic votes", "topics", data.topics.filter(t => t.ages.includes(results.age)).map(t => ({ id: t.id, label: t.name, art: Icons.svg(t.id) })))}
        ${block("English level (their own guess)", "levels", data.levels.map(l => ({ id: l.id, label: l.name })))}
      </div>`;

    stage.querySelector("#reset").addEventListener("click", () => {
      if (!confirm("Clear all answers and start a new group?")) return;
      results = blank();
      store.set(KEY, results);
      showTab("run");
    });
  }

  showTab(location.hash === "#results" ? "results" : "run");
})();
