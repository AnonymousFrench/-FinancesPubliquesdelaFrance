// Pages du site : chemin, libellés de navigation et métadonnées SEO, en français et en anglais.
// Partagé par l'application et scripts/seo.mjs (les pages statiques référencées sont en français).
import { T } from './i18n.js'

export const SITE_NAME = 'État des finances'
export const SITE_NAME_EN = 'État des finances'
export const siteName = () => T(SITE_NAME, SITE_NAME_EN)

// Deux rubriques principales, chacune déclinée en sous-pages.
export const SECTIONS = [
  { id: 'finances', label: 'Finances publiques', en: 'Public finances', path: '/' },
  { id: 'presidentielle', label: 'Présidentielle 2027', en: '2027 presidential election', path: '/presidentielle-2027' },
  { id: 'etat', label: 'État de la France', en: 'State of France', path: '/etat-de-la-france' },
]

export const ROUTES = [
  { id: 'synthese', section: 'finances', path: '/', label: 'Synthèse',
    title: 'Finances publiques de la France : dette, déficit, dépenses et recettes',
    description: 'Dette publique, déficit, dépenses et recettes de la France en chiffres et en graphiques, à partir des données officielles d’Eurostat, de l’Insee et de l’Agence France Trésor.',
    en: { label: 'Overview', title: 'French public finances: debt, deficit, spending and revenue',
      description: 'France’s public debt, deficit, spending and revenue in figures and charts, from official Eurostat, Insee and Agence France Trésor data.' } },
  { id: 'recettes', section: 'finances', path: '/recettes', label: 'Recettes',
    title: 'Recettes publiques de la France : impôts, TVA et cotisations',
    description: 'D’où vient l’argent public : TVA, impôt sur le revenu, cotisations sociales, impôt sur les sociétés, et les recettes du budget de l’État ligne par ligne.',
    en: { label: 'Revenue', title: 'French public revenue: taxes, VAT and social contributions',
      description: 'Where public money comes from: VAT, income tax, social contributions, corporate tax, and State budget revenue line by line.' } },
  { id: 'depenses', section: 'finances', path: '/depenses', label: 'Dépenses',
    title: 'Dépenses publiques et budget de l’État ligne par ligne',
    description: 'Où va l’argent public : retraites, santé, éducation, défense. Explorez le budget de l’État 2027 par mission et programme, avec un moteur de recherche.',
    en: { label: 'Spending', title: 'Public spending and the State budget line by line',
      description: 'Where public money goes: pensions, health, education, defence. Explore the 2027 State budget by mission and programme, with search.' } },
  // Dette et financement : un seul onglet ; /financement est une sous-page (inside) affichée par la tuile « Financement ».
  { id: 'dette', section: 'finances', path: '/dette', label: 'Dette et financement',
    title: 'Dette publique de la France : montant, évolution et charge d’intérêts',
    description: 'La dette publique française depuis 1995 jusqu’au dernier trimestre publié par l’Insee, son taux moyen et le coût des intérêts ; le financement de l’État sur la page voisine.',
    en: { label: 'Debt and financing', title: 'French public debt: amount, trend and interest cost',
      description: 'French public debt since 1995 up to the latest quarter published by Insee, its average rate and the cost of interest; State financing on the neighbouring page.' } },
  { id: 'financement', section: 'finances', path: '/financement', label: 'Financement', inside: 'dette',
    title: 'Financement de l’État : émissions d’OAT et taux d’intérêt',
    description: 'Comment l’État finance son déficit : besoin de financement 2026, émissions d’obligations, taux de l’OAT à 10 ans depuis 1993.',
    en: { label: 'Financing', title: 'State financing: OAT issuance and interest rates',
      description: 'How the State finances its deficit: 2026 financing need, bond issuance, the 10-year OAT yield since 1993.' } },
  { id: 'presidentielle', section: 'presidentielle', path: '/presidentielle-2027', label: 'Programmes',
    title: 'Présidentielle 2027 : l’impact des programmes sur la dette et le déficit',
    description: 'Simulateur neutre de douze candidatures à la présidentielle 2027, de LO à Reconquête : effet des programmes sur le déficit, la dette et la dépense publique jusqu’en 2032.',
    en: { label: 'Programmes', title: '2027 election: what each programme does to debt and deficit',
      description: 'Neutral simulator of twelve 2027 presidential candidacies, from LO to Reconquête: what the programmes do to deficit, debt and public spending to 2032.' } },
  { id: 'sondages', section: 'presidentielle', path: '/sondages-presidentielle-2027', label: 'Sondages', badge: 'badge-live',
    title: 'Sondages présidentielle 2027 : moyenne et tendances en direct',
    description: 'Moyenne des sondages de la présidentielle 2027 mise à jour en direct : intentions de vote au premier tour, hypothèses de second tour et dynamique de campagne.',
    en: { label: 'Polls', title: '2027 election polls: live average and trends',
      description: 'Live average of 2027 presidential election polls: first-round voting intentions, second-round matchups and campaign trends.' } },
  { id: 'etat', section: 'etat', path: '/etat-de-la-france', label: 'Indicateurs clés',
    title: 'État de la France : croissance, emploi, démographie, immigration et énergie depuis 1960',
    description: 'Les grands indicateurs macroéconomiques de la France sur longue période, comparés à l’Union européenne : PIB par habitant, chômage, heures travaillées, écart de taux avec l’Allemagne, défense, démographie, immigration, pauvreté, inégalités, énergie et climat.',
    en: { label: 'Key metrics', title: 'State of France: growth, jobs, population, immigration and energy since 1960',
      description: 'France’s key macroeconomic indicators over the long run, compared with the EU: GDP per person, unemployment, hours worked, spread over Germany, defence, population, immigration, poverty, inequality, energy and climate.' } },
  { id: 'immigration', section: 'etat', path: '/etat-de-la-france/population', label: 'Population',
    title: 'Population de la France : pyramide des âges depuis 1960 et origines des immigrés',
    description: 'Pyramide des âges animée de 1960 aux projections 2070 (Eurostat), carte des pays de naissance des immigrés depuis 1968 (Insee), premiers titres de séjour par nationalité et par motif (Eurostat).',
    en: { label: 'Population', title: 'France’s population: age pyramid since 1960 and where immigrants come from',
      description: 'Animated age pyramid from 1960 to 2070 projections (Eurostat), map of immigrants’ countries of birth since 1968 (Insee), first residence permits by citizenship and reason (Eurostat).' } },
]

// Libellés dans la langue courante.
export const rLabel = r => T(r.label, r.en.label)
export const rTitle = r => T(r.title, r.en.title)
export const rDescription = r => T(r.description, r.en.description)
export const sLabel = s => T(s.label, s.en)

// Anciennes adresses (#ancre, version anglaise, carte supprimée) redirigées vers les pages actuelles.
export const ALIAS = {
  overview: '/', 'vue-ensemble': '/', synthese: '/', map: '/', carte: '/', revenue: '/recettes', recettes: '/recettes', spending: '/depenses', depenses: '/depenses',
  debt: '/dette', dette: '/dette', financing: '/financement', financement: '/financement',
  election: '/presidentielle-2027', presidentielle: '/presidentielle-2027', polls: '/sondages-presidentielle-2027', sondages: '/sondages-presidentielle-2027', etat: '/etat-de-la-france', immigration: '/etat-de-la-france/population', population: '/etat-de-la-france/population',
}

// Langue portée par l'adresse : /en/... pour l'anglais, sans préfixe pour le français.
export const langOf = path => (/^\/en(\/|$)/.test(path) ? 'en' : 'fr')
export const stripLang = path => path.replace(/^\/en(?=\/|$)/, '') || '/'
export const withLang = (path, lang) => (lang === 'en' ? '/en' + (path === '/' ? '' : path) : path)

// ---------- Fiches candidats : une adresse par candidat, /presidentielle-2027/<nom> ----------
// Liste courte pour ne pas charger les données des programmes dans la page d'accueil ; scripts/check-election.mjs
// vérifie qu'elle correspond à ORDER et aux noms de src/data/election2027.js.
export const ELECTION_PATH = '/presidentielle-2027'
export const CANDIDATES = [
  { id: 'lo', slug: 'arthaud', name: 'Nathalie Arthaud', party: 'Lutte ouvrière', partyEn: 'Lutte ouvrière', costed: false },
  { id: 'pcf', slug: 'roussel', name: 'Fabien Roussel', party: 'Parti communiste français', partyEn: 'French Communist Party', costed: false },
  { id: 'lfi', slug: 'melenchon', name: 'Jean-Luc Mélenchon', party: 'La France insoumise', partyEn: 'La France insoumise', costed: true },
  { id: 'eco', slug: 'tondelier', name: 'Marine Tondelier', party: 'Les Écologistes', partyEn: 'Les Écologistes (Greens)', costed: true },
  { id: 'ps', slug: 'glucksmann', name: 'Raphaël Glucksmann', party: 'PS – Place publique', partyEn: 'PS – Place publique', costed: true },
  { id: 're', slug: 'attal', name: 'Gabriel Attal', party: 'Renaissance', partyEn: 'Renaissance', costed: true },
  { id: 'hor', slug: 'philippe', name: 'Édouard Philippe', party: 'Horizons', partyEn: 'Horizons', costed: true },
  { id: 'lr', slug: 'retailleau', name: 'Bruno Retailleau', party: 'Les Républicains', partyEn: 'Les Républicains', costed: true },
  { id: 'ne', slug: 'lisnard', name: 'David Lisnard', party: 'Nouvelle Énergie', partyEn: 'Nouvelle Énergie', costed: true },
  { id: 'dlf', slug: 'dupont-aignan', name: 'Nicolas Dupont-Aignan', party: 'Debout la France', partyEn: 'Debout la France', costed: true },
  { id: 'rn', slug: 'le-pen', name: 'Marine Le Pen', party: 'Rassemblement national', partyEn: 'National Rally', costed: true },
  { id: 'rec', slug: 'zemmour', name: 'Éric Zemmour', party: 'Reconquête', partyEn: 'Reconquête', costed: true },
]
export const candidateOf = id => CANDIDATES.find(c => c.id === id)
export const candidatePath = id => `${ELECTION_PATH}/${candidateOf(id).slug}`
const candidateRoute = c => {
  const base = ROUTES.find(r => r.id === 'presidentielle')
  const enName = c.name, poss = /s$/.test(enName) ? '’' : '’s'
  return {
    ...base, path: candidatePath(c.id), candidate: c.id,
    title: c.costed ? `Programme de ${c.name} pour 2027 : chiffrage et impact sur la dette` : `${c.name}, présidentielle 2027 : programme et engagements`,
    description: c.costed
      ? `Le programme présidentiel 2027 de ${c.name} (${c.party}) passé au même modèle que les autres candidats : mesures chiffrées, analyses indépendantes ligne par ligne, effet sur le déficit et la dette jusqu’en 2032.`
      : `${c.name} (${c.party}) à la présidentielle 2027 : profil, engagements principaux et pourquoi le programme n’est pas chiffré, à côté des autres candidats.`,
    en: { ...base.en,
      title: c.costed ? `${enName}${poss} 2027 programme: costing and impact on the debt` : `${enName}, 2027 election: programme and pledges`,
      description: c.costed
        ? `${enName}${poss} 2027 presidential programme (${c.partyEn}) run through the same model as the other candidates: costed measures, line-by-line independent reviews, effect on the deficit and debt to 2032.`
        : `${enName} (${c.partyEn}) in the 2027 presidential election: profile, main pledges and why the programme is not costed, alongside the other candidates.` },
  }
}
export const CANDIDATE_ROUTES = CANDIDATES.map(candidateRoute)

export const routeOf = path => {
  const p = stripLang(path).replace(/\/+$/, '') || '/'
  if (p.startsWith(ELECTION_PATH + '/')) return CANDIDATE_ROUTES.find(r => r.path === p)
  if (p === '/etat-de-la-france/immigration') return ROUTES.find(r => r.id === 'immigration') // ancienne adresse
  return ROUTES.find(r => r.path === p) || (p === '/carte' ? ROUTES[0] : undefined)
}
