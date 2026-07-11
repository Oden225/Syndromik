/* =========================================================
   Syndromik — router.js
   Routage par ancre (#/...) + amorçage de l'application.
   Chargé en dernier : il déclenche le chargement des données,
   puis affiche le premier écran.
   ========================================================= */

function go(path) { location.hash = "#/" + path; }

function route() {
  const h = (location.hash || "#/").replace(/^#\//, "");
  const parts = h.split("/").filter(Boolean);
  window.scrollTo(0, 0);
  if (parts.length === 0) { renderHome(); return; }
  if (parts[0] === "combiner") { renderCombiner(); return; }
  if (parts[0] === "type" && TYPE_META[parts[1]]) { renderType(parts[1]); return; }
  if (TYPE_META[parts[0]] && parts[1]) { renderFiche(parts[0], parts[1]); return; }
  renderHome();
}

/* Bouton retour physique/navigateur + navigation par ancre */
document.getElementById("backbtn").addEventListener("click", () => history.back());
window.addEventListener("hashchange", route);

/* Disclaimer obligatoire — acceptation mémorisée localement (étape 3/4). */
(function initDisclaimer() {
  const disc = document.getElementById("disc");
  const KEY = "syndromik_disclaimer_ok";
  try { if (localStorage.getItem(KEY) === "1") disc.style.display = "none"; } catch (e) {}
  document.getElementById("discok").addEventListener("click", () => {
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
    disc.style.display = "none";
  });
})();

/* Amorçage : charger la base AVANT d'afficher un écran. */
(function boot() {
  app.innerHTML = `<div class="empty">Chargement de la base…</div>`;
  loadData("./data/syndromik_data.json")
    .then(() => { route(); })
    .catch(err => {
      app.innerHTML =
        `<div class="empty">Impossible de charger la base de données.<br><br>` +
        `Ouvrez l'application via une adresse <b>http(s)</b> (GitHub Pages ou un petit serveur local),<br>` +
        `pas en double-cliquant le fichier : le protocole <code>file://</code> bloque le chargement du JSON.<br><br>` +
        `<small>${esc(String((err && err.message) || err))}</small></div>`;
    });
})();
