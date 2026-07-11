/* =========================================================
   Syndromik — ui.js
   Rendu des écrans + listes de voisins cliquables.
   Découpé tel quel de la maquette validée (étape 4).
   Dépend de : store, analyser (dataStore.js) ; go (router.js).
   ========================================================= */

/* --- État du mode "Combiner des signes" --- */
let combSel = new Set();   // signes cochés (persiste tant qu'on explore)
let _combRefresh = null;
function toggleSigne(id, on) { on ? combSel.add(id) : combSel.delete(id); if (_combRefresh) _combRefresh(); }

/* --- Références DOM (les éléments existent : scripts en fin de <body>) --- */
const app = document.getElementById("app");
const topbar = document.getElementById("topbar");
const titleEl = document.getElementById("title");
const wordmark = document.getElementById("wordmark");

const TYPE_META = {
  signe: { label: "Signe", plural: "Signes", k: "◉", cls: "sig", cap: "Élément clinique observable" },
  syndrome: { label: "Syndrome", plural: "Syndromes", k: "⬡", cls: "syn", cap: "Ensemble cohérent de signes" },
  pathologie: { label: "Pathologie", plural: "Pathologies", k: "✚", cls: "pat", cap: "Maladie / diagnostic" },
  specialite: { label: "Spécialité", plural: "Spécialités", k: "❖", cls: "spe", cap: "Domaine médical" }
};

function esc(s) { return (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function setBar(mode, text) {
  if (mode === "home") { topbar.classList.remove("has-back"); wordmark.style.display = ""; titleEl.style.display = "none"; }
  else { topbar.classList.add("has-back"); wordmark.style.display = "none"; titleEl.style.display = ""; titleEl.textContent = text; }
}

function rowHTML(e) {
  const t = store.type(e.id), m = TYPE_META[t];
  const meta = `<span class="minichip">${m.label}</span>`;
  return `<button class="row ${m.cls}" onclick="go('${t}/${e.id}')">
    <span class="tick"></span>
    <span class="body"><span class="rn">${esc(e.nom)}</span><span class="rmeta">${meta}</span></span>
    <span class="chev">›</span>
  </button>`;
}
function rows(list) {
  if (!list.length) return `<div class="empty">Aucun élément lié pour l'instant.</div>`;
  return `<div class="rowlist">${list.map(rowHTML).join("")}</div>`;
}
function chain(active) {
  const order = [["signe", "Signe"], ["syndrome", "Syndrome"], ["pathologie", "Pathologie"], ["specialite", "Spécialité"]];
  return `<div class="chain">` + order.map(([k, l], i) =>
    `${i ? '<span class="sep">⇄</span>' : ''}<span class="node ${k === active ? 'on' : ''}">${l}</span>`
  ).join("") + `</div>`;
}

/* ---------- Écran Accueil ---------- */
function renderHome() {
  setBar("home");
  app.innerHTML = `
    <p class="lede">Signes, syndromes, pathologies et spécialités — reliés dans tous les sens, hors ligne.</p>
    <div class="search">
      <span class="ic">⌕</span>
      <input id="q" type="search" placeholder="Rechercher un signe, une maladie…" autocomplete="off" enterkeyhint="search" aria-label="Rechercher">
    </div>
    <div id="results"></div>
    <div id="browse">
      <button class="combcta" onclick="go('combiner')">
        <span class="k">☑</span>
        <span class="txt"><span class="n">Combiner des signes</span><span class="c">Plusieurs signes → syndromes &amp; pathologies</span></span>
        <span class="go">›</span>
      </button>
      <div class="eyebrow">Parcourir par type</div>
      <div class="types">
        ${Object.entries(TYPE_META).map(([t, m]) => `
          <button class="typecard ${m.cls}" onclick="go('type/${t}')">
            <span class="k">${m.k}</span>
            <span class="n">${m.plural}</span>
            <span class="c">${m.cap}</span>
          </button>`).join("")}
      </div>
      <div class="demo">Base v0.6 — infectiologie · pédiatrie (2 spécialités remplies). Contenu à valider avant usage réel.</div>
    </div>`;
  const q = document.getElementById("q"), res = document.getElementById("results"), br = document.getElementById("browse");
  q.addEventListener("input", () => {
    const v = q.value.trim();
    if (!v) { res.innerHTML = ""; br.style.display = ""; return; }
    br.style.display = "none";
    const r = store.rechercher(v);
    res.innerHTML = r.length
      ? `<div class="eyebrow">${r.length} résultat${r.length > 1 ? "s" : ""}</div>` + rows(r)
      : `<div class="empty">Rien trouvé pour « ${esc(v)} ».</div>`;
  });
  q.focus();
}

/* ---------- Écran Combiner des signes ---------- */
function renderCombiner() {
  setBar("detail", "Combiner des signes");
  const signes = store.list("signe").slice().sort((a, b) => a.nom.localeCompare(b.nom));
  const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  app.innerHTML = `
    <p class="lede">Cochez les signes présents chez le patient, puis lancez la recherche. Touchez ensuite un syndrome pour voir ses pathologies.</p>
    <div class="search"><span class="ic">⌕</span><input id="fsig" type="search" placeholder="Filtrer les signes…" autocomplete="off" aria-label="Filtrer les signes"></div>
    <div class="eyebrow">Signes présents <span id="selcount"></span></div>
    <div id="siglist" class="checklist"></div>
    <button id="runbtn" class="runbtn" onclick="runCombiner()" disabled>Lancer la recherche</button>
    <div id="analyse"></div>`;
  const listEl = document.getElementById("siglist");
  const filt = document.getElementById("fsig");
  function paintList() {
    const f = norm(filt.value.trim());
    listEl.innerHTML = signes.filter(s => !f || norm(s.nom + " " + (s.syn || []).join(" ")).includes(f))
      .map(s => `<label class="chk ${combSel.has(s.id) ? "on" : ""}">
        <input type="checkbox" ${combSel.has(s.id) ? "checked" : ""} onchange="toggleSigne('${s.id}',this.checked)">
        <span>${esc(s.nom)}</span></label>`).join("")
      || `<div class="empty">Aucun signe ne correspond au filtre.</div>`;
  }
  function syncControls() {
    const n = combSel.size;
    document.getElementById("selcount").textContent = n ? `· ${n} coché${n > 1 ? "s" : ""}` : "";
    const btn = document.getElementById("runbtn");
    btn.disabled = !n;
    btn.textContent = n ? `Lancer la recherche (${n} signe${n > 1 ? "s" : ""})` : "Lancer la recherche";
    // modifier la sélection rend un résultat précédent obsolète : on invite à relancer
    document.getElementById("analyse").innerHTML =
      `<div class="empty">${n ? "Appuyez sur « Lancer la recherche » pour voir les syndromes évoqués."
        : "Cochez au moins un signe pour commencer."}</div>`;
  }
  _combRefresh = () => { paintList(); syncControls(); };
  filt.addEventListener("input", paintList);
  paintList(); syncControls();
}

/* Combiner — temps 1 : n'affiche QUE les syndromes.
   Les pathologies apparaissent au temps 2, en touchant un syndrome (sa fiche les liste). */
function runCombiner() {
  const box = document.getElementById("analyse"); if (!box) return;
  if (!combSel.size) { box.innerHTML = `<div class="empty">Cochez au moins un signe.</div>`; return; }
  const { synScores } = analyser([...combSel]);
  let h = `<div class="eyebrow">Syndromes évoqués</div>`;
  h += synScores.length ? `<div class="rowlist">` + synScores.map(({ syn, match }) =>
    `<button class="row syn" onclick="go('syndrome/${syn.id}')"><span class="tick"></span>
       <span class="body"><span class="rn">${esc(syn.nom)}</span>
       <span class="rmeta"><span class="scorebadge">${match} / ${combSel.size} signe${combSel.size > 1 ? "s" : ""}</span></span></span>
       <span class="chev">›</span></button>`).join("") + `</div>`
    : `<div class="empty">Aucun syndrome ne partage ces signes dans la base actuelle.</div>`;
  h += `<div class="demo">Touchez un syndrome pour voir ses pathologies. Orientation, pas un diagnostic.</div>`;
  box.innerHTML = h;
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ---------- Écran Liste par type ---------- */
function renderType(t) {
  const m = TYPE_META[t]; setBar("detail", m.plural);
  app.innerHTML = `${rows(store.list(t).sort((a, b) => a.nom.localeCompare(b.nom)))}`;
}

/* ---------- Écran Fiche ---------- */
function renderFiche(t, id) {
  const e = store.get(id);
  if (!e) { app.innerHTML = `<div class="empty">Fiche introuvable.</div>`; return; }
  setBar("detail", e.nom);
  const m = TYPE_META[t];
  let html = chain(t);
  html += `<div class="head"><span class="chip"><span class="d" style="color:${
    t === 'signe' ? '#6B7F9E' : t === 'syndrome' ? '#7A5EA6' : t === 'pathologie' ? '#B0603A' : 'var(--brand)'}"></span>${m.label}</span></div>`;
  html += `<h1 class="name">${esc(e.nom)}</h1>`;
  if (e.syn && e.syn.length) html += `<p class="synos">Aussi : ${e.syn.map(esc).join(", ")}</p>`;

  html += `<div class="desc">${esc(e.desc)}</div>`;

  if (t === "signe") {
    html += `<div class="eyebrow">Présent dans ces syndromes</div>` + rows(store.voisins(id, "syndrome"));
  } else if (t === "syndrome") {
    html += `<div class="eyebrow">Signes qui le composent</div>` + rows(store.voisins(id, "signe"));
    html += `<div class="eyebrow">Pathologies probables</div>` + rows(store.voisins(id, "pathologie"));
  } else if (t === "pathologie") {
    html += `<div class="eyebrow">Syndromes associés</div>` + rows(store.voisins(id, "syndrome"));
    html += `<div class="eyebrow">Spécialité(s)</div>` + rows(store.voisins(id, "specialite"));
  } else if (t === "specialite") {
    html += `<div class="eyebrow">Pathologies de la spécialité</div>` + rows(store.voisins(id, "pathologie"));
  }
  app.innerHTML = html;
  app.scrollTop = 0;
}
