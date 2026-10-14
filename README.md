# Finances publiques de la France

Dette, déficit, recettes et dépenses de la France à partir des données officielles, budget de l’État ligne par ligne, simulateur des programmes de la présidentielle 2027 et sondages en direct.

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:5173
```

## Déployer sur Vercel

Importer le dépôt dans Vercel (préréglage Vite, sortie `dist`). Définir la variable d’environnement `SITE_URL` avec l’adresse finale du site (URL canoniques, sitemap, aperçus sociaux).

`npm run build` télécharge le dernier instantané des sondages, compile le site puis génère une page HTML par rubrique, `sitemap.xml` et `robots.txt`.

## Données

- `src/data/apu.js`, `taux.js`, `budget-etat.js`, `recettes-etat.js` : générés depuis les fichiers officiels de `data-raw/` (Eurostat, data.economie.gouv.fr) par `npm run data`.
- `src/data/data.js` : chiffres curés et sourcés (Insee, COFOG, AFT, loi de finances 2026).
- `src/data/election2027.js` : scénario de référence, plan du gouvernement et une entrée par parti (mesures, analyses indépendantes, sources).
- `src/data/polls-snapshot.json` : instantané de secours des sondages (Wikipédia), rafraîchi par `npm run polls` et à chaque build ; le site charge la version en direct.
- `public/og.png` : image d’aperçu, régénérée par `npm run og`.

## Moteur de projection

`src/lib/projection.js` projette recettes, dépenses, intérêts, déficit et dette jusqu’en 2032 pour la politique inchangée et pour chaque programme. Ajouter un parti revient à ajouter une entrée dans `src/data/election2027.js`.
