// Curated figures, €bn unless stated. Every block carries its source.
// Long time series come from the generated modules (apu.js, taux.js, budget-etat.js, recettes-etat.js).

export const SRC = {
  eurostatMain: { label: 'Eurostat gov_10a_main: general government accounts, France, 1995-2025', url: 'https://ec.europa.eu/eurostat/databrowser/view/gov_10a_main/default/table' },
  eurostatDebt: { label: 'Eurostat gov_10dd_edpt1: Maastricht deficit and debt', url: 'https://ec.europa.eu/eurostat/databrowser/view/gov_10dd_edpt1/default/table' },
  eurostatRates: { label: 'Eurostat irt_lt_mcby_m: 10-year government bond yield (Maastricht criterion), monthly', url: 'https://ec.europa.eu/eurostat/databrowser/view/irt_lt_mcby_m/default/table' },
  insee2106: { label: 'Insee Première 2106 (29 May 2026): 2025 public accounts', url: 'https://www.insee.fr/fr/statistiques/9060403' },
  inseeDebtQ: { label: 'Insee Informations rapides: quarterly general government debt, Q2 2026 (30 Sep 2026)', url: 'https://www.insee.fr/fr/statistiques/series/102760712' },
  insee2093: { label: 'Insee Première 2093 (Feb 2026): spending by function (COFOG) 2024, provisional', url: 'https://www.insee.fr/fr/statistiques/8573552' },
  plf25dest: { label: 'data.economie.gouv.fr: PLF 2025 spending by destination (mission › programme › action › sub-action)', url: 'https://data.economie.gouv.fr/explore/dataset/plf25-depenses-2025-selon-destination/' },
  plf25rec: { label: 'data.economie.gouv.fr: PLF 2025 general budget revenue', url: 'https://data.economie.gouv.fr/explore/dataset/plf25-recettes-du-budget-general/' },
  lfi2026: { label: 'LFI 2026 (law 2026-103, 19 Feb 2026): financing table and mission ceilings', url: 'https://www.legifrance.gouv.fr/' },
  aft: { label: 'Agence France Trésor: financing programme and monthly bulletin', url: 'https://www.aft.gouv.fr/' },
  regions: { label: 'Insee / DGCL regional budgets (budgets primitifs 2025)', url: 'https://www.collectivites-locales.gouv.fr/' },
}

// ---------- Latest debt (Insee, quarterly) ----------
export const debtLatest = {
  label: 'Q2 2026', total: 3595.5, pct: 119.0, qoq: 59.4, net: 3366.8, netPct: 111.4,
  quarters: [
    { q: 'Q4 2024', total: 3306.1, pct: 112.6 },
    { q: 'Q4 2025', total: 3460.5, pct: 115.7 },
    { q: 'Q1 2026', total: 3536.1, pct: 117.5 },
    { q: 'Q2 2026', total: 3595.5, pct: 119.0 },
  ],
}

// ---------- 2025 split by level of government (Insee 2106) ----------
// Each level counts transfers received from the others, so the sum exceeds the consolidated total.
export const byLevel2025 = {
  spending: [{ name: 'Central government', v: 680.8 }, { name: 'Social security', v: 803.5 }, { name: 'Local government', v: 335.5 }],
  revenue: [{ name: 'Central government', v: 550.5 }, { name: 'Social security', v: 796.8 }, { name: 'Local government', v: 319.9 }],
  levies: 43.6,
}
export const deficitBySub = [
  { name: 'State', y2024: -151.1, y2025: -128.1 },
  { name: 'State agencies (ODAC)', y2024: -1.4, y2025: -2.2 },
  { name: 'Local government', y2024: -17.8, y2025: -15.6 },
  { name: 'Social security', y2024: 1.1, y2025: -6.7 },
]

// ---------- Spending 2024 by function (COFOG, Insee 2093, provisional) ----------
export const natureCols = ['Pay', 'Intermediate consumption', 'Subsidies and transfers', 'Interest', 'Cash social benefits', 'In-kind social benefits', 'Investment']
export const cofog = [
  { name: 'Social protection', total: 693, nature: [32, 11, 45, 0, 556, 45, 4], level: [133, 59, 501],
    sub: [{ name: 'Family and children', value: 67 }, { name: 'Unemployment and training', value: 49 }], subNote: 'Pensions, the largest item, grew by €23bn (+6.2%) in 2024.' },
  { name: 'Health', total: 261, nature: [70, 34, 11, 0, 0, 136, 10], level: [9, 2, 250], sub: [{ name: 'Hospital services', value: 109 }] },
  { name: 'General public services', total: 181, nature: [48, 16, 35, 60, 0, 0, 22], level: [114, 59, 8], sub: [{ name: 'Interest on debt', value: 60 }] },
  { name: 'Economic affairs', total: 166, nature: [20, 27, 84, 0, 0, 0, 34], level: [111, 55, 1] },
  { name: 'Education', total: 149, nature: [104, 14, 9, 0, 6, 5, 12], level: [104, 45, 0] },
  { name: 'Defence', total: 54, nature: [22, 20, 2, 0, 0, 0, 11], level: [54, 0, 0], sub: [{ name: 'Military defence', value: 48 }] },
  { name: 'Public order and safety', total: 52, nature: [36, 9, 2, 0, 0, 0, 4], level: [42, 10, 0] },
  { name: 'Recreation and culture', total: 43, nature: [15, 11, 7, 0, 0, 0, 10], level: [13, 30, 0] },
  { name: 'Housing', total: 42, nature: [9, 8, 8, 0, 0, 0, 18], level: [6, 36, 0] },
  { name: 'Environment', total: 30, nature: [6, 12, 5, 0, 0, 0, 7], level: [5, 26, 0] },
]
export const cofogMeta = { total: 1672, pctGdp: 57.0, levels: ['Central', 'Local', 'Social security'] }

// ---------- State budget missions: 2025 vs 2026 ceilings (€bn, general budget excl. pensions account) ----------
export const missionsLfi = [
  ['Remboursements et dégrèvements', 148.3, 152.2], ['Engagements financiers de l’État (incl. debt charge)', 56.2, 59.5],
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

// ---------- State financing 2026 (LFI) ----------
export const financing2026 = {
  needs: [
    { name: 'Redeem maturing debt', v: 169.9, note: '167.5 nominal + 2.4 inflation-indexation supplements' },
    { name: 'State deficit', v: 134.6 },
    { name: 'SNCF Réseau debt takeover', v: 2.5 },
    { name: 'Other cash needs', v: 3.0, derived: true },
  ],
  issuance: 310.0,
}

// ---------- Agence France Trésor ----------
export const aft = {
  negotiableEnd2024: { total: 2541.7, oat: 2340.5, btf: 201.2 },
  negotiableSep2026: 2909.4,
  avgMaturity: { v: '8 years 158 days', date: '30 Sep 2026' },
  tec10: { v: 4.86, date: 'Oct 2026' },
  spot10: { v: 4.75, date: '30 Sep 2026' },
  nonResidents: '≈ 56%',
  issuance: [
    { year: 2023, v: 270.0, tag: 'actual' }, { year: 2024, v: 285.0, tag: 'actual' },
    { year: 2025, v: 347.7, tag: 'actual' }, { year: 2026, v: 310.0, tag: 'programme' },
    { year: 2027, v: 340.0, tag: 'AFT forecast' },
  ],
  rating: 'Moody’s Aa3 negative (10 Apr 2026); next review 23 Oct 2026.',
  spread: [['Feb 2026', '55 bp'], ['End Jul 2026', '74 bp'], ['Early Oct 2026', '> 100 bp (press reports)']],
}

// ---------- Regional councils per inhabitant, € (budgets primitifs 2025) ----------
export const regionPerCap = {
  '84': { total: 587, fn: 342, inv: 245 }, '27': { total: 634, fn: 424, inv: 211 }, '53': { total: 517, fn: 316, inv: 201 },
  '24': { total: 584, fn: 394, inv: 190 }, '44': { total: 705, fn: 402, inv: 303 }, '32': { total: 629, fn: 423, inv: 207 },
  '11': { total: 411, fn: 238, inv: 173 }, '28': { total: 579, fn: 372, inv: 207 }, '75': { total: 490, fn: 337, inv: 153 },
  '76': { total: 553, fn: 331, inv: 222 }, '52': { total: 445, fn: 281, inv: 164 }, '93': { total: 552, fn: 381, inv: 171 },
}
export const localMeta = {
  deficits: [['Communes', -4.4], ['Departments', -2.0], ['Regions', -2.1]],
  spending2024: [['Communal bloc', 178], ['Departments', 78.3], ['Regions', 39.5]],
}
