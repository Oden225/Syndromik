# Syndromik — squelette de l'app (étape 5)

PWA hors ligne (HTML/CSS/JS pur, sans build) issue du découpage de la maquette validée
à l'étape 4, branchée sur la vraie base `syndromik_data.json` v0.6.

## Arborescence
```
index.html               page unique (shell + montage + enregistrement du SW)
manifest.json            manifeste PWA (installable, standalone)
sw.js                    service worker : cache offline « cache-first »
/css/styles.css          styles (extraits verbatim de la maquette)
/js/dataStore.js         charge le JSON, normalise, index + voisinage + recherche + analyser
/js/ui.js                rendu des écrans et des listes de voisins
/js/router.js            routage par ancre (#/…) + disclaimer + amorçage
/data/syndromik_data.json  la base (v0.6) — 59 signes, 30 syndromes, 54 pathologies, 2 spécialités
/icons/icon-192.png, icon-512.png  icônes PWA (provisoires, à remplacer par le vrai logo)
```

## Tester en local (IMPORTANT)
Le chargement du JSON se fait par `fetch`, bloqué en `file://`.
Ne pas double-cliquer `index.html` ; lancer un petit serveur :
```
cd syndromik
python3 -m http.server 8000
```
Puis ouvrir **http://localhost:8000** (aussi accessible depuis un téléphone sur le même Wi-Fi
via `http://IP_DU_PC:8000`).

## Déployer (étape 9)
1. Pousser le contenu du dossier `syndromik/` à la **racine** d'un dépôt GitHub.
2. Activer **GitHub Pages** (branche `main`, dossier `/root`) → URL HTTPS.
3. Ouvrir l'URL une fois **avec réseau** pour amorcer le cache offline, puis ça marche hors ligne.
4. Générer l'APK avec **PWABuilder** (colle l'URL Pages → package Android `.apk` / `.aab`).

## Mettre à jour la base plus tard
Remplacer `/data/syndromik_data.json`, puis **incrémenter `CACHE_VERSION`** dans `sw.js`
(sinon l'ancienne version reste en cache chez les utilisateurs).

## Notes
- L'`urgence` reste dans les données mais n'est pas affichée (décision étape 4).
- Les icônes sont des placeholders (monogramme S) — à remplacer par le logo définitif.
- Disclaimer affiché au 1er lancement, acceptation mémorisée (`localStorage`).
