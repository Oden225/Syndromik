/* =========================================================
   Syndromik — dataStore.js
   Point de vérité unique pour les données (étape 3, §3).
   - charge le vrai syndromik_data.json (fetch, asynchrone)
   - NORMALISE le schéma réel (synonymes→syn, description→desc,
     liens{objets typés}) vers une forme interne stable :
     les écrans ne connaissent jamais le format du JSON.
   - index par ID + voisinage bidirectionnel + recherche sans accents
   ========================================================= */

let store = null; // rempli par loadData() ; visible des autres scripts

/* Normalise une entité brute (schéma v0.6) vers la forme interne de l'UI. */
function _normEntite(e) {
  const o = {
    id: e.id,
    nom: e.nom,
    syn: e.synonymes || e.syn || [],
    desc: e.description || e.desc || ""
  };
  if (e.urgence) o.urgence = e.urgence; // conservé dans les données (non affiché — étape 4)
  if (e.a_valider) o.aValider = true;   // proposition non relue par un médecin
  return o;
}

/* Construit le store à partir du JSON brut. */
function _buildStore(raw) {
  const byId = {}, typeOf = {};
  const push = (arr, t) => (arr || []).forEach(e => {
    const n = _normEntite(e);
    byId[n.id] = n;
    typeOf[n.id] = t;
  });
  push(raw.signes, "signe");
  push(raw.syndromes, "syndrome");
  push(raw.pathologies, "pathologie");
  push(raw.specialites, "specialite");

  // Voisinage bidirectionnel à partir des tables de liens (objets typés).
  const adj = {};
  const pending = new Set(); // liens "a_valider", clé "a|b" dans les deux sens
  const link = (a, b, aValider) => {
    (adj[a] = adj[a] || new Set()).add(b);
    (adj[b] = adj[b] || new Set()).add(a);
    if (aValider) { pending.add(a + "|" + b); pending.add(b + "|" + a); }
  };
  const L = raw.liens || {};
  (L.signe_syndrome || []).forEach(x => link(x.signe, x.syndrome, x.a_valider));
  (L.syndrome_pathologie || []).forEach(x => link(x.syndrome, x.pathologie, x.a_valider));
  (L.pathologie_specialite || []).forEach(x => link(x.pathologie, x.specialite, x.a_valider));

  const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const all = () => Object.values(byId);
  const voisins = (id, t) =>
    [...(adj[id] || [])].map(x => byId[x]).filter(e => e && typeOf[e.id] === t);

  return {
    get: id => byId[id],
    type: id => typeOf[id],
    voisins,
    lienAValider: (a, b) => pending.has(a + "|" + b),
    list: t => all().filter(e => typeOf[e.id] === t),
    rechercher: q => {
      const n = norm((q || "").trim());
      if (!n) return [];
      return all().filter(e => {
        const hay = [e.nom, ...(e.syn || [])].map(norm).join(" ");
        return hay.includes(n);
      }).slice(0, 30);
    },
    meta: raw.meta || {}
  };
}

/* Charge le JSON embarqué (une seule fois) puis expose `store`. */
async function loadData(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error("HTTP " + res.status + " sur " + url);
  const raw = await res.json();
  store = _buildStore(raw);
  return store;
}

/* =========================================================
   Analyse multi-signes (étape 4, §4) : signes cochés →
   syndromes classés par recoupement, puis pathologies évoquées.
   Aucun changement de modèle : on croise les tables de liens.
   ========================================================= */
function analyser(signIds) {
  const sel = new Set(signIds);
  const synScores = store.list("syndrome").map(syn => {
    const signs = store.voisins(syn.id, "signe");
    const match = signs.filter(s => sel.has(s.id)).length;
    return { syn, match, total: signs.length };
  }).filter(x => x.match > 0)
    .sort((a, b) =>
      b.match - a.match ||
      (b.match / b.total) - (a.match / a.total) ||
      a.syn.nom.localeCompare(b.syn.nom));

  const patMap = {};
  synScores.forEach(({ syn, match }) => {
    store.voisins(syn.id, "pathologie").forEach(p => {
      (patMap[p.id] = patMap[p.id] || { pat: p, score: 0 }).score += match;
    });
  });
  const urg = { vitale: 0, elevee: 1, moderee: 2, faible: 3 };
  const pats = Object.values(patMap)
    .sort((a, b) =>
      b.score - a.score ||
      ((urg[a.pat.urgence] ?? 9) - (urg[b.pat.urgence] ?? 9)) ||
      a.pat.nom.localeCompare(b.pat.nom));

  return { synScores, pats };
}
