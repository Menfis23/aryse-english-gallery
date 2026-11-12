/* =========================================================
   add.js — "Add your own".

   A GitHub Pages site can't save what people type, so:
   1. Sharing  -> opens your Google Form, already filled in
                  (needs CONFIG.formUrl + CONFIG.formFields).
   2. Showing  -> reads the Form's Google Sheet, published as
                  CSV (CONFIG.sheetCsvUrl). With
                  CONFIG.requireApproval, only rows marked
                  "yes" in an "Approved" column appear.
   Until those are set, counselors can copy or save their idea.
   ========================================================= */
(function () {
  const form = document.getElementById("add-form");
  const preview = document.getElementById("preview");
  const status = document.getElementById("status");
  const connected = Boolean(CONFIG.formUrl);
  const lines = s => String(s || "").split("\n").map(x => x.trim()).filter(Boolean);

  document.getElementById("not-connected").hidden = connected;
  if (!connected) document.getElementById("share").textContent = "Share (not connected yet)";

  // Keep an unsent draft in this browser
  const draft = store.get("eag-draft", null);
  if (draft) {
    Object.entries(draft).forEach(([k, v]) => {
      const el = form.elements[k];
      if (!el) return;
      if (el instanceof RadioNodeList || el.length) {
        [...form.querySelectorAll(`[name="${k}"]`)].forEach(i => { i.checked = Array.isArray(v) ? v.includes(i.value) : i.value === v; });
      } else el.value = v;
    });
  }

  function read() {
    const f = new FormData(form);
    return {
      type: f.get("type"),
      title: (f.get("title") || "").trim(),
      age: f.getAll("age"),
      level: f.getAll("level"),
      minutes: f.get("minutes"),
      materials: f.get("materials"),
      steps: f.get("steps"),
      phrases: f.get("phrases"),
      author: (f.get("author") || "").trim()
    };
  }

  function draw() {
    const d = read();
    store.set("eag-draft", d);
    const steps = lines(d.steps), phrases = lines(d.phrases), mats = lines(d.materials);
    preview.innerHTML = `
      <div class="tile-top ${d.type === "Icebreaker" ? "t-ice" : "t-school"}" style="background:var(--c);color:var(--cf)">
        ${Icons.svg(d.type === "Icebreaker" ? "ice" : "school")}
        <div class="tile-tags"><span>${esc(d.minutes)} min</span><span>${d.age.map(esc).join(", ") || "No age picked"}</span></div>
      </div>
      <div class="tile-body">
        <h3>${esc(d.title) || "Your title"}</h3>
        <p>${d.type} &middot; ${d.level.map(esc).join(", ") || "No level picked"}${d.author ? " &middot; by " + esc(d.author) : ""}</p>
        ${mats.length ? `<p><b>Materials:</b> ${mats.map(esc).join(", ")}</p>` : ""}
        ${steps.length ? `<ol>${steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>` : `<p>Your steps will show here.</p>`}
        ${phrases.length ? `<ul class="phrase-list" style="margin-top:.6rem">${phrases.map(p => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
      </div>`;
  }
  form.addEventListener("input", draw);
  draw();

  function asText(d) {
    return [
      `${d.type}: ${d.title}`,
      `Ages: ${d.age.join(", ")} | Levels: ${d.level.join(", ")} | ${d.minutes} min`,
      d.author ? `By: ${d.author}` : "",
      lines(d.materials).length ? `Materials: ${lines(d.materials).join(", ")}` : "",
      "Steps:", ...lines(d.steps).map((s, i) => `${i + 1}. ${s}`),
      lines(d.phrases).length ? "Phrases: " + lines(d.phrases).join(" / ") : ""
    ].filter(Boolean).join("\n");
  }

  function valid(d) {
    if (!d.title || !lines(d.steps).length) { status.textContent = "Add a title and at least one step first."; return false; }
    if (!d.age.length || !d.level.length) { status.textContent = "Pick at least one age group and one level."; return false; }
    return true;
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const d = read();
    if (!valid(d)) return;
    if (!connected) { status.textContent = "Sharing isn't connected yet. Use Copy as text or Save file for now."; return; }
    const ff = CONFIG.formFields;
    const url = new URL(CONFIG.formUrl);
    url.searchParams.set("usp", "pp_url");
    const values = { ...d, age: d.age.join(", "), level: d.level.join(", ") };
    Object.entries(ff).forEach(([k, entry]) => { if (entry && values[k]) url.searchParams.set(entry, values[k]); });
    window.open(url.toString(), "_blank", "noopener");
    status.textContent = "The form opened in a new tab, already filled in. Check it and press Submit there.";
  });

  document.getElementById("copy").addEventListener("click", async () => {
    const d = read();
    if (!valid(d)) return;
    try { await navigator.clipboard.writeText(asText(d)); status.textContent = "Copied. Paste it into an email or chat."; }
    catch (e) { status.textContent = "Couldn't copy automatically. Try Save file instead."; }
  });

  document.getElementById("download").addEventListener("click", () => {
    const d = read();
    if (!valid(d)) return;
    const blob = new Blob([JSON.stringify({ ...d, steps: lines(d.steps), materials: lines(d.materials), phrases: lines(d.phrases) }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (d.title || "activity").toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    status.textContent = "Saved as a file.";
  });

  // ---- Shared by counselors (from the published Google Sheet) ----
  if (CONFIG.sheetCsvUrl) loadCommunity();

  async function loadCommunity() {
    try {
      const res = await fetch(CONFIG.sheetCsvUrl);
      const rows = parseCSV(await res.text());
      const [head, ...body] = rows;
      const col = name => head.findIndex(h => h.trim().toLowerCase() === name);
      const c = { title: col("title"), type: col("type"), age: col("age"), level: col("level"), minutes: col("minutes"), steps: col("steps"), author: col("author"), approved: col("approved") };
      const items = body.filter(r => r[c.title] && (!CONFIG.requireApproval || (r[c.approved] || "").trim().toLowerCase() === "yes"));
      if (!items.length) return;
      document.getElementById("community").hidden = false;
      document.getElementById("community-grid").innerHTML = items.map(r => `
        <details class="tile">
          <summary class="tile-top ${r[c.type] === "Icebreaker" ? "t-ice" : "t-school"}" style="list-style:none;cursor:pointer">
            ${Icons.svg(r[c.type] === "Icebreaker" ? "ice" : "school")}
            <div class="tile-tags"><span>${esc(r[c.minutes])} min</span><span>${esc(r[c.age])}</span></div>
          </summary>
          <div class="tile-body">
            <h3>${esc(r[c.title])}</h3>
            <p>${esc(r[c.type])} &middot; ${esc(r[c.level])}${r[c.author] ? " &middot; by " + esc(r[c.author]) : ""}</p>
            <ol>${lines(r[c.steps]).map(s => `<li>${esc(s)}</li>`).join("")}</ol>
          </div>
        </details>`).join("");
    } catch (e) { console.warn("Could not load shared lessons", e); }
  }

  // Small CSV reader that handles quotes and line breaks inside cells
  function parseCSV(text) {
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') q = false;
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
      else if (ch !== "\r") cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }
})();
