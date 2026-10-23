// Données curées et sourcées, en Md€ sauf mention contraire.
// Les longues séries viennent des modules générés (apu.js, taux.js, budget-etat.js, recettes-etat.js).

export const SRC = {
  eurostatMain: { label: 'Eurostat gov_10a_main : comptes des administrations publiques, France, 1995-2025', url: 'https://ec.europa.eu/eurostat/databrowser/view/gov_10a_main/default/table' },
  eurostatDebt: { label: 'Eurostat gov_10dd_edpt1 : déficit et dette au sens de Maastricht', url: 'https://ec.europa.eu/eurostat/databrowser/view/gov_10dd_edpt1/default/table' },
  eurostatRates: { label: 'Eurostat irt_lt_mcby_m : taux des obligations d’État à 10 ans (critère de Maastricht), mensuel', url: 'https://ec.europa.eu/eurostat/databrowser/view/irt_lt_mcby_m/default/table' },
  insee2106: { label: 'Insee Première n° 2106 (29 mai 2026) : comptes publics 2025', url: 'https://www.insee.fr/fr/statistiques/9060403' },
  inseeDebtQ: { label: 'Insee, Informations rapides : dette trimestrielle des APU, T2 2026 (30 sept. 2026)', url: 'https://www.insee.fr/fr/statistiques/series/102760712' },
  insee2093: { label: 'Insee Première n° 2093 (févr. 2026) : dépenses par fonction (COFOG) 2024, provisoire', url: 'https://www.insee.fr/fr/statistiques/8573552' },
  plf25dest: { label: 'data.economie.gouv.fr : PLF 2025, dépenses selon destination (mission › programme › action › sous-action)', url: 'https://data.economie.gouv.fr/explore/dataset/plf25-depenses-2025-selon-destination/' },
  plf27loi: { label: 'Projet de loi de finances pour 2027 (1er oct. 2026), états B, C et D : crédits par mission et programme', url: 'https://www.budget.gouv.fr/documentation/documents-budgetaires' },
  plf27rec: { label: 'Projet de loi de finances pour 2027 (1er oct. 2026), état A : voies et moyens', url: 'https://www.budget.gouv.fr/documentation/documents-budgetaires' },
  plf25rec: { label: 'data.economie.gouv.fr : PLF 2025, recettes du budget général', url: 'https://data.economie.gouv.fr/explore/dataset/plf25-recettes-du-budget-general/' },
  lfi2026: { label: 'Loi de finances initiale pour 2026 (loi 2026-103 du 19 févr. 2026) : tableau de financement et plafonds par mission', url: 'https://www.legifrance.gouv.fr/' },
  aft: { label: 'Agence France Trésor : programme de financement et bulletin mensuel', url: 'https://www.aft.gouv.fr/' },
}

// ---------- Dernière dette connue (Insee, trimestrielle) ----------
export const debtLatest = {
  label: 'T2 2026', total: 3595.5, pct: 119.0, qoq: 59.4, net: 3366.8, netPct: 111.4,
  quarters: [
    { q: 'T4 2024', total: 3306.1, pct: 112.6 },
    { q: 'T4 2025', total: 3460.5, pct: 115.7 },
    { q: 'T1 2026', total: 3536.1, pct: 117.5 },
    { q: 'T2 2026', total: 3595.5, pct: 119.0 },
  ],
}

// ---------- 2025 par sous-secteur (Insee 2106) ----------
// Chaque niveau compte les transferts reçus des autres : la somme dépasse le total consolidé.
export const byLevel2025 = {
  spending: [{ name: 'État et organismes centraux', v: 680.8 }, { name: 'Sécurité sociale', v: 803.5 }, { name: 'Collectivités locales', v: 335.5 }],
  revenue: [{ name: 'État et organismes centraux', v: 550.5 }, { name: 'Sécurité sociale', v: 796.8 }, { name: 'Collectivités locales', v: 319.9 }],
  levies: 43.6,
}
export const deficitBySub = [
  { name: 'État', y2024: -151.1, y2025: -128.1 },
  { name: 'Organismes divers (ODAC)', y2024: -1.4, y2025: -2.2 },
  { name: 'Collectivités locales', y2024: -17.8, y2025: -15.6 },
  { name: 'Sécurité sociale', y2024: 1.1, y2025: -6.7 },
]

// ---------- Dépenses 2024 par fonction (COFOG, Insee 2093, provisoire) ----------
export const natureCols = ['Rémunérations', 'Consommations intermédiaires', 'Subventions et transferts', 'Intérêts', 'Prestations en espèces', 'Prestations en nature', 'Investissement']
export const cofog = [
  { name: 'Protection sociale', total: 693, nature: [32, 11, 45, 0, 556, 45, 4], level: [133, 59, 501],
    sub: [{ name: 'Famille et enfance', value: 67 }, { name: 'Chômage et formation', value: 49 }], subNote: 'Les retraites, premier poste, ont progressé de 23 Md€ (+6,2 %) en 2024.' },
  { name: 'Santé', total: 261, nature: [70, 34, 11, 0, 0, 136, 10], level: [9, 2, 250], sub: [{ name: 'Services hospitaliers', value: 109 }] },
  { name: 'Services publics généraux', total: 181, nature: [48, 16, 35, 60, 0, 0, 22], level: [114, 59, 8], sub: [{ name: 'Charge d’intérêts de la dette', value: 60 }] },
  { name: 'Affaires économiques', total: 166, nature: [20, 27, 84, 0, 0, 0, 34], level: [111, 55, 1] },
  { name: 'Enseignement', total: 149, nature: [104, 14, 9, 0, 6, 5, 12], level: [104, 45, 0] },
  { name: 'Défense', total: 54, nature: [22, 20, 2, 0, 0, 0, 11], level: [54, 0, 0], sub: [{ name: 'Défense militaire', value: 48 }] },
  { name: 'Ordre et sécurité publics', total: 52, nature: [36, 9, 2, 0, 0, 0, 4], level: [42, 10, 0] },
  { name: 'Loisirs, culture et culte', total: 43, nature: [15, 11, 7, 0, 0, 0, 10], level: [13, 30, 0] },
  { name: 'Logement et équipements collectifs', total: 42, nature: [9, 8, 8, 0, 0, 0, 18], level: [6, 36, 0] },
  { name: 'Protection de l’environnement', total: 30, nature: [6, 12, 5, 0, 0, 0, 7], level: [5, 26, 0] },
]
export const cofogMeta = { total: 1672, pctGdp: 57.0, levels: ['État', 'Collectivités', 'Sécurité sociale'] }

// ---------- Missions du budget de l'État : plafonds 2025 et 2026 (Md€, budget général hors CAS Pensions) ----------
export const missionsLfi = [
  ['Remboursements et dégrèvements', 148.3, 152.2], ['Engagements financiers de l’État (dont charge de la dette)', 56.2, 59.5],
  ['Enseignement scolaire', 64.3, 64.5], ['Défense', 50.5, 57.1], ['Recherche et enseignement supérieur', 30.7, 31.2],
  ['Solidarité, insertion, égalité', 30.3, 28.6], ['Cohésion des territoires', 23.1, 22.2], ['Écologie, développement durable', 20.7, 20.9],
  ['Travail et emploi', 19.7, 18.0], ['Sécurités', 17.3, 17.7], ['Justice', 10.5, 10.6], ['Gestion des finances publiques', 8.1, 8.2],
  ['Régimes sociaux et de retraite', 6.0, 5.9], ['Investir pour la France 2030', 5.3, 5.5], ['Aide publique au développement', 4.4, 3.7],
  ['Administration générale et territoriale', 4.1, 4.2], ['Agriculture', 4.0, 3.8], ['Relations avec les collectivités', 4.0, 3.8],
  ['Culture', 3.7, 3.5], ['Économie', 3.5, 3.3], ['Action extérieure de l’État', 3.3, 3.2], ['Outre-mer', 2.9, 2.8],
  ['Immigration, asile, intégration', 2.1, 2.2], ['Santé', 1.5, 1.7], ['Sport, jeunesse, vie associative', 1.5, 1.2],
  ['Pouvoirs publics', 1.1, 1.1], ['Direction de l’action du Gouvernement', 1.0, 1.0], ['Monde combattant', 1.9, 1.7],
  ['Conseil et contrôle de l’État', 0.7, 0.7], ['Médias', 0.7, 0.7], ['Transformation et fonction publiques', 0.7, 0.5], ['Crédits non répartis', 0.2, 0.2],
].map(([name, y2025, y2026]) => ({ name, y2025, y2026 }))

// ---------- Financement de l'État 2026 (LFI) ----------
export const financing2026 = {
  needs: [
    { name: 'Remboursement de la dette arrivant à échéance', v: 169.9, note: '167,5 Md€ en nominal + 2,4 Md€ de suppléments d’indexation' },
    { name: 'Déficit de l’État', v: 134.6 },
    { name: 'Reprise de dette de SNCF Réseau', v: 2.5 },
    { name: 'Autres besoins de trésorerie', v: 3.0, derived: true },
  ],
  issuance: 310.0,
}

// ---------- Agence France Trésor ----------
export const aft = {
  negotiableEnd2024: { total: 2541.7, oat: 2340.5, btf: 201.2 },
  negotiableSep2026: 2909.4,
  avgMaturity: { v: '8 ans et 158 jours', date: '30 sept. 2026' },
  tec10: { v: 4.93, date: '20 oct. 2026' },
  spot10: { v: 4.75, date: '30 sept. 2026' },
  nonResidents: '≈ 56 %',
  issuance: [
    { year: 2023, v: 270.0, tag: 'réalisé' }, { year: 2024, v: 285.0, tag: 'réalisé' },
    { year: 2025, v: 347.7, tag: 'réalisé' }, { year: 2026, v: 310.0, tag: 'programme' },
    { year: 2027, v: 340.0, tag: 'prévision AFT' },
  ],
  rating: 'Moody’s Aa3, perspective négative (10 avr. 2026) ; décision attendue le 23 oct. 2026 au soir.',
  spread: [['Févr. 2026', '55 points de base'], ['Fin juil. 2026', '74 points de base'], ['Début oct. 2026', '159 points de base, plus haut depuis nov. 2011 (Reuters)'], ['22 oct. 2026', '≈ 170 points de base (presse)']],
}
