# Syndromik — feuille de route

État au 16/10/2026 : squelette de l'app (étape 5) fonctionnel, base v0.6.
Cocher au fur et à mesure (`[x]`).

## 1. Mettre en ligne (version de test)
- [x] Ranger les fichiers dans `css/`, `js/`, `data/`, `icons/` (l'app ne chargeait pas sinon)
- [ ] Fusionner la branche de travail dans `main`
- [ ] Activer GitHub Pages (branche `main`, dossier `/root`)
- [ ] Ouvrir l'URL sur un téléphone, installer l'app, tester **hors ligne** (mode avion)

## 2. Enrichir la base (priorité contenu)
Objectif : 5 à 8 signes par syndrome sur le noyau fébrile + pédiatrique,
pour que « Combiner des signes » discrimine vraiment.
Avant v0.7 : 2 à 5 signes par syndrome, 42 signes sur 59 ne mènent qu'à un seul syndrome.

v0.7 : 12 signes et 23 liens **proposés** (`"a_valider": true`, badge « À valider » dans l'app),
sur les syndromes cochés ci-dessous. Restent à relire avant de compter comme validés.

**Priorité haute** — peu de signes, beaucoup de pathologies ou des urgences derrière :
- [x] Syndrome digestif fébrile (3 signes → 9 pathologies)
- [x] Syndrome neurologique fébrile (3 → 6, dont méningite, neuropaludisme, rage)
- [x] Syndrome hémorragique (2 → 3 : dengue, fièvre jaune, Lassa)
- [x] Syndrome ictérique (2 → 5)
- [x] Syndrome anémique (3 → 5)
- [x] Syndrome algique diffus (3 → 7)
- [ ] Syndrome fébrile (5 signes mais 27 pathologies : très peu discriminant)

**Priorité moyenne** — 2 signes seulement :
- [ ] Syndrome urinaire, syndrome oculaire, syndrome lymphatique
- [ ] Syndromes cutanés (prurigineux, ulcéreux), paralysie flasque, parotidien
- [ ] ORL douloureux, IST, immunodépression, dermatose localisée, spasmes musculaires

**Cohérence à vérifier** (avec le relecteur) :
- [x] Syndrome urinaire : ajout proposé de « Brûlures mictionnelles » et « Envies fréquentes d'uriner »
- [x] Syndrome oculaire : ajout proposé de « Œil rouge » (garder « Prurit » ?)
- [ ] Syndrome éruptif fébrile mène à la syphilis
- [ ] Paludisme classé `elevee` alors que sa forme grave est vitale

Après chaque modification de la base : incrémenter `CACHE_VERSION` dans `sw.js`.

## 3. Validation médicale (bloquant avant tout usage réel)
- [ ] Trouver 1–2 relecteurs (médecin, interne en infectiologie / pédiatrie)
- [x] Générer une version tableur de la base pour la relecture (`relecture/`, régénérable avec `python3 relecture/generer_tableur.py`)
- [ ] Intégrer les corrections, noter la date de validation dans `meta` du JSON

## 4. Application
- [ ] Décider : afficher un badge « Urgence » pour les pathologies `vitale` ?
- [ ] Afficher la version de la base sur l'accueil
- [ ] Remplacer les icônes provisoires par le vrai logo
- [ ] (plus tard) Pondérer les signes très évocateurs dans « Combiner »

## 5. Diffusion
- [ ] Générer l'APK / AAB avec PWABuilder (après validation médicale)
- [ ] Ajouter d'autres spécialités (seulement une fois le noyau solide)
