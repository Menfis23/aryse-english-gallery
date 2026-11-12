/* =========================================================
   planner.js — builds a full lesson plan from the pieces:
   icebreaker + key words + phrases + game + wrap-up.

   If the picture survey has answers, "Group vote" and
   "From survey" use the group's top choices.
   Recently used icebreakers ("eag-ice-used") are skipped.
   ========================================================= */
(async function () {
  const form = document.getElementById("plan-form");
  const out = document.getElementById("out");
  let data;
  try { data = await Data.load(); }
  catch (e) { out.innerHTML = '<p class="empty">Could not load the data. Run a local server (see README).</p>'; return; }

  const survey = store.get("eag-survey", null);
  const hasSurvey = survey && survey.count > 0;
  const top = obj => Object.entries(obj || {}).sort((a, b) => b[1] - a[1])[0]?.[0];
  const surveyTheme = hasSurvey ? top(survey.interests) : null;
  const surveyTopic = hasSurvey ? top(survey.topics) : null;
  const surveyLevel = hasSurvey ? top(survey.levels) : null;

  const saved = store.get("eag-planner", {});
  const fromSurvey = new URLSearchParams(location.search).get("from") === "survey";
  const themeName = id => (data.themes.find(t => t.id === id) || {}).name;
  const topicName = id => (data.topics.find(t => t.id === id) || {}).name;

  // ---- Survey note ----
  if (hasSurvey) {
    const note = document.getElementById("survey-note");
    note.hidden = false;
    note.innerHTML = `<b>Survey:</b> ${survey.count} students. Top interest: <b>${esc(themeName(surveyTheme) || "none")}</b>` +
      (surveyTopic ? `. Top topic vote: <b>${esc(topicName(surveyTopic))}</b>` : "") + ".";
  }

  // ---- Draw the radio groups ----
  function radios(id, name, opts, chosen) {
    if (!opts.some(o => o[0] === chosen)) chosen = opts[0][0];   // never leave a group with nothing picked
    document.getElementById(id).innerHTML = opts.map(([v, label, extra]) =>
      `<label class="seg-opt"><input type="radio" name="${name}" value="${v}" ${v === chosen ? "checked" : ""}><span>${extra || ""}${label}</span></label>`).join("");
  }
  const pick = (want, fallback) => want || fallback;

  radios("f-age", "age", data.ages.map(a => [a.id, a.name]),
    pick(fromSurvey && survey?.age, saved.age || "11-14"));
  radios("f-level", "level", data.levels.map(l => [l.id, l.name, levelBars(l.id) + " "]),
    pick(fromSurvey && surveyLevel, saved.level || "beginner"));
  radios("f-min", "min", [["30", "30 min"], ["45", "45 min"], ["60", "60 min"], ["90", "90 min"]], saved.min || "45");
  if (saved.size) document.getElementById("f-size").value = saved.size;

  const themeOpts = [["none", "No theme"], ...data.themes.map(t => [t.id, t.name])];
  if (hasSurvey && surveyTheme) themeOpts.unshift(["survey", `From survey (${themeName(surveyTheme)})`]);
  radios("f-theme", "theme", themeOpts, hasSurvey && (fromSurvey || !saved.theme) ? "survey" : (saved.theme || "none"));

  // Topic list depends on age (job interviews and banks are 15–21 only)
  function drawTopics() {
    const age = form.age.value;
    const current = form.topic ? form.topic.value : (fromSurvey && surveyTopic ? "vote" : saved.topic);
    const opts = data.topics.filter(t => t.ages.includes(age)).map(t => [t.id, t.name]);
    const voteOk = hasSurvey && surveyTopic && data.topics.find(t => t.id === surveyTopic).ages.includes(age);
    if (voteOk) opts.unshift(["vote", `Group vote (${topicName(surveyTopic)})`]);
    const chosen = opts.some(o => o[0] === current) ? current : opts[0][0];
    radios("f-topic", "topic", opts, chosen);
  }
  drawTopics();
  document.getElementById("f-age").addEventListener("change", drawTopics);

  // ---- Build the plan ----
  form.addEventListener("submit", e => { e.preventDefault(); build(); });
  if (fromSurvey) build();

  function build(keepTopic) {
    const f = new FormData(form);
    const c = {
      age: f.get("age"), level: f.get("level"), min: Number(f.get("min")),
      size: Math.min(60, Math.max(2, Number(f.get("size")) || 15)),
      topicChoice: f.get("topic"), themeChoice: f.get("theme")
    };
    store.set("eag-planner", { age: c.age, level: c.level, min: String(c.min), size: c.size, topic: c.topicChoice, theme: c.themeChoice });

    const topicId = c.topicChoice === "vote" ? surveyTopic : c.topicChoice;
    const themeId = c.themeChoice === "survey" ? surveyTheme : (c.themeChoice === "none" ? "" : c.themeChoice);
    const topic = data.topics.find(t => t.id === topicId);
    const ice = pickIcebreaker(c);

    // Timeline: icebreaker, words, phrases, game, wrap-up
    const iceMin = ice ? ice.minutes : 0;
    const wrapMin = 5;
    const rest = Math.max(10, c.min - iceMin - wrapMin);
    const wordsMin = Math.round(rest * 0.2);
    const phrasesMin = Math.round(rest * 0.2);
    const gameMin = rest - wordsMin - phrasesMin;
    const tl = [
      ["tl-ice", "Icebreaker", iceMin], ["tl-words", "Key words", wordsMin],
      ["tl-phrases", "Phrases", phrasesMin], ["tl-game", "Game", gameMin], ["tl-wrap", "Wrap-up", wrapMin]
    ].filter(x => x[2] > 0);

    const scenario = themeId ? data.scenarios[topic.id][themeId] : "";
    const level = data.levels.find(l => l.id === c.level);
    const present = `slideshow.html?type=lesson&topic=${topic.id}&level=${c.level}&age=${c.age}` +
      (themeId ? `&theme=${themeId}` : "") + (ice ? `&ice=${ice.id}` : "");

    out.innerHTML = `
      <div class="plan-hero t-${topic.id}">
        ${Icons.svg(topic.id)}
        <p class="eyebrow">${esc(topic.name)} &middot; ${level.name} &middot; ${c.age} &middot; ${c.min} min</p>
        <h2>${esc(scenario || topic.name)}</h2>
        <p>${c.size} students${themeId ? " &middot; themed around " + esc(themeName(themeId)) : ""}</p>
      </div>

      <div class="timeline" aria-label="Session timeline">
        ${tl.map(([cls, label, m]) => `<span class="${cls}" style="flex:${m}"><b>${label}</b>${m} min</span>`).join("")}
      </div>

      <div class="plan-actions">
        <a class="btn btn-primary" href="${present}">Present this lesson</a>
        <button type="button" class="btn btn-ghost" id="new-ice">Different icebreaker</button>
        <button type="button" class="btn btn-ghost" id="print">Print</button>
      </div>

      ${ice ? `
      <div class="plan-block">
        <h3><small>1 &middot; ${iceMin} min</small>Icebreaker: ${esc(ice.name)}</h3>
        <ol>${ice.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
        <p class="tweak"><b>Say it out loud:</b> ${ice.sayIt[c.level].map(esc).join(" &middot; ")}</p>
      </div>` : `<div class="plan-block"><p>No icebreaker fits this group size and level. Try the <a href="icebreakers.html">icebreaker library</a>.</p></div>`}

      <div class="plan-block">
        <h3><small>2 &middot; ${wordsMin} min</small>Key words</h3>
        <div class="table-scroll">
          <table class="words">
            <thead><tr><th>English</th>${data.languages.map(l => `<th>${l.name}</th>`).join("")}</tr></thead>
            <tbody>${topic.words.map(w => `<tr><td>${esc(w.en)}</td>${data.languages.map(l =>
              `<td dir="${l.dir}" lang="${l.id}">${esc(w[l.id])}</td>`).join("")}</tr>`).join("")}</tbody>
          </table>
        </div>
        <span class="draft-flag">Draft translations: check with a native speaker before using.</span>
      </div>

      <div class="plan-block">
        <h3><small>3 &middot; ${phrasesMin} min</small>Phrases to practice</h3>
        <ul class="phrase-list">${topic.phrases[c.level].map(p => `<li>${esc(p)}</li>`).join("")}</ul>
      </div>

      <div class="plan-block">
        <h3><small>4 &middot; ${gameMin} min</small>Game: ${esc(topic.game.name)}</h3>
        ${scenario ? `<p><b>Theme twist:</b> ${esc(scenario)}.</p>` : ""}
        <p><b>Materials:</b> ${topic.game.materials.map(esc).join(", ")}</p>
        <ol>${topic.game.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
        <p class="tweak"><b>${level.name} version:</b> ${esc(topic.game.tweaks[c.level])}</p>
      </div>

      <div class="plan-block">
        <h3><small>5 &middot; ${wrapMin} min</small>Wrap-up</h3>
        <p style="margin:0">Go around the circle: <b>${esc(topic.wrapup)}</b></p>
      </div>`;

    out.querySelector("#new-ice").addEventListener("click", () => build());
    out.querySelector("#print").addEventListener("click", () => window.print());
    out.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function pickIcebreaker(c) {
    const used = store.get("eag-ice-used", []);
    const maxMin = Math.max(10, Math.round(c.min * 0.25));
    const fits = data.icebreakers.filter(ib =>
      ib.ages.includes(c.age) && ib.levels.includes(c.level) &&
      c.size >= ib.groupMin && c.size <= ib.groupMax && ib.minutes <= maxMin);
    if (!fits.length) return null;
    const fresh = fits.filter(ib => !used.includes(ib.id));
    const pool = fresh.length ? fresh : fits;
    const ib = pool[Math.floor(Math.random() * pool.length)];
    store.set("eag-ice-used", [ib.id, ...used.filter(x => x !== ib.id)].slice(0, 5));
    return ib;
  }
})();
