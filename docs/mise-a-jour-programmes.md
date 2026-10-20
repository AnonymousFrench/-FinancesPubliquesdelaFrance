# Mise à jour des programmes de la présidentielle 2027

Procédure suivie par la tâche planifiée (chaque lundi, puis aussi chaque jeudi de février à avril 2027).
Elle prépare une pull request ; rien n'est publié tant que Thibault ne l'a pas fusionnée.

## Fichiers

- `src/data/election2027.js` : données des partis (mesures, montants, analyses, sources, date `checked`).
- `src/data/election2027.en.js` : textes anglais, mêmes clés (nom, détail et signalement de chaque mesure, notes des analyses).
- `src/data/sourcesEn.js` : libellé anglais de chaque nouvelle source (clé = libellé français exact).
- Pour un nouveau candidat : `src/lib/polls.js` (`DECLARED`), `src/lib/usePhotos.js` (`TITLES`), `src/routes.js` (`CANDIDATES`,
  qui donne l'adresse /presidentielle-2027/<nom> de sa fiche), puis `npm run og` pour son image de partage
  (ne garder que les images og-presidentielle* et og-<nom>*, annuler les autres).

## Ce qu'on cherche, pour chaque candidat

1. Programme ou chiffrage nouveau publié par le parti ou le candidat (site officiel, conférence de presse, livre).
2. Analyse indépendante nouvelle : Institut de l'Entreprise, Terra Nova, Institut Montaigne, iFRAP, Fipeco, OFCE,
   Rexecode, Conseil d'analyse économique, Cour des comptes, HCFP, France Budget, presse économique citant des économistes.
3. Changement de statut : candidature déclarée ou retirée, investiture, ralliement, entrée dans les sondages.

Sources récentes en priorité ; dater chaque source dans son libellé.

## Règles de la « Synthèse des analyses » (identiques pour tous)

- Montants du parti tels qu'annoncés dans `points` ; la vue « telles qu'annoncées » doit rester fidèle au parti.
- La synthèse (`reviews[].cred`, coefficient par mesure) : coûts comptés en entier, ou plus quand une évaluation
  les juge sous-estimés (ex. retraites RN 200 %) ; économies sans mesure détaillée à 0 ; autres économies ramenées
  au montant qu'une évaluation juge atteignable (ex. non-remplacement de fonctionnaires 50 %, précédent RGPP ;
  impôt plancher sur les grandes fortunes 35 %, CAE ; contribution à l'UE 0, unanimité).
- Chaque coefficient s'appuie sur une source citée dans le signalement de la mesure (`flag`) et dans la note de la synthèse.
- Nos propres estimations sont toujours signalées « Notre estimation ».
- Mettre à jour la ligne « Effet net jugé crédible en 2032 » du bandeau (FR et EN) avec la sortie de `scripts/check-election.mjs`.
- Ne jamais écrire de tiret cadratin (—) dans les textes.

## Contrôles avant la pull request

1. `node scripts/check-election.mjs` : aucune erreur ; relire les projections et expliquer tout écart notable.
2. `npm run build`.
3. `npx vite preview --port 4174 --strictPort` en arrière-plan, puis `python3 scripts/check-pages.py`.
4. Mettre `checked` à la date du jour pour chaque candidat vérifié, même sans changement.

## Pull request

Branche `maj-programmes-AAAA-MM-JJ`, titre « Programmes : mise à jour du JJ mois », description : changements par candidat,
sources, effet sur les projections 2032 (avant / après), points incertains. Ne pas fusionner.

## Budget de l'État (onglets Dépenses et Recettes)

Depuis le 20 octobre 2026, l'explorateur et le tableau des recettes utilisent le PLF 2027, tiré du texte du projet de loi
(états A à D) avec `python3 scripts/plf-pdf.py <PLF.pdf> 2027`, puis `npm run data`. Le niveau action et sous-action
reviendra quand data.economie.gouv.fr publiera le fichier « Dépenses selon destination » : le placer dans
`data-raw/plf27-destination.csv` (même format que `plf25-destination.csv`) et relancer `npm run data`.
