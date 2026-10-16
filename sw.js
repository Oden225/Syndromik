/*
 * Syndromik — Service Worker
 * Stratégie : "cache-first" (étape 3, §7).
 * Au 1er chargement EN LIGNE, tout le shell + les données sont mis en cache.
 * Ensuite l'app fonctionne 100 % hors ligne.
 *
 * IMPORTANT : à chaque mise à jour du contenu (nouveau syndromik_data.json,
 * modif du HTML/CSS/JS), incrémenter CACHE_VERSION pour forcer le rafraîchissement.
 */

const CACHE_VERSION = "syndromik-v0.7.0";

// Chemins RELATIFS (./) : indispensable pour GitHub Pages servi sous un sous-dossier
// (https://<user>.github.io/<repo>/). Ne pas mettre de "/" absolu.
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/dataStore.js",
  "./js/router.js",
  "./js/ui.js",
  "./data/syndromik_data.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// --- Installation : pré-cache de tout le shell ---
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// --- Activation : purge des anciens caches ---
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// --- Fetch : cache-first, puis réseau, avec repli SPA sur index.html ---
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // On ne gère que les GET (le reste passe direct au réseau)
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          // Met en cache à la volée les ressources récupérées (même origine)
          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          // Hors ligne + ressource absente du cache : pour une navigation,
          // on renvoie la page unique de l'app (routage par ancre côté client).
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    })
  );
});
