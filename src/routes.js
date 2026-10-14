// Pages du site : chemin, libellés de navigation et métadonnées SEO, en français et en anglais.
// Partagé par l'application et scripts/seo.mjs (les pages statiques référencées sont en français).
import { T } from './i18n.js'

export const SITE_NAME = 'Finances publiques de la France'
export const SITE_NAME_EN = 'French public finances'
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
    description: 'Où va l’argent public : retraites, santé, éducation, défense. Explorez le budget de l’État par mission, programme et action, avec un moteur de recherche.',
    en: { label: 'Spending', title: 'Public spending and the State budget line by line',
      description: 'Where public money goes: pensions, health, education, defence. Explore the State budget by mission, programme and action, with search.' } },
  { id: 'dette', section: 'finances', path: '/dette', label: 'Dette',
    title: 'Dette publique de la France : montant, évolution et charge d’intérêts',
    description: 'La dette publique française depuis 1995, sa répartition entre État, Sécurité sociale et collectivités, son taux moyen et le coût des intérêts.',
    en: { label: 'Debt', title: 'French public debt: amount, trend and interest cost',
      description: 'French public debt since 1995, split between the State, social security and local government, its average rate and the cost of interest.' } },
  { id: 'financement', section: 'finances', path: '/financement', label: 'Financement',
    title: 'Financement de l’État : émissions d’OAT et taux d’intérêt',
    description: 'Comment l’État finance son déficit : besoin de financement 2026, émissions d’obligations, taux de l’OAT à 10 ans depuis 1993.',
    en: { label: 'Financing', title: 'State financing: OAT issuance and interest rates',
      description: 'How the State finances its deficit: 2026 financing need, bond issuance, the 10-year OAT yield since 1993.' } },
  { id: 'presidentielle', section: 'presidentielle', path: '/presidentielle-2027', label: 'Programmes',
    title: 'Présidentielle 2027 : l’impact des programmes sur la dette et le déficit',
    description: 'Simulateur neutre des programmes de LFI, PS-Place publique, Renaissance, Horizons, LR et RN : effet sur le déficit, la dette et la dépense publique jusqu’en 2032.',
    en: { label: 'Programmes', title: '2027 election: what each programme does to debt and deficit',
      description: 'Neutral simulator of the LFI, PS-Place publique, Renaissance, Horizons, LR and RN programmes: effect on deficit, debt and public spending to 2032.' } },
  { id: 'sondages', section: 'presidentielle', path: '/sondages-presidentielle-2027', label: 'Sondages', badge: 'badge-live',
    title: 'Sondages présidentielle 2027 : moyenne et tendances en direct',
    description: 'Moyenne des sondages de la présidentielle 2027 mise à jour en direct : intentions de vote au premier tour, hypothèses de second tour et dynamique de campagne.',
    en: { label: 'Polls', title: '2027 election polls: live average and trends',
      description: 'Live average of 2027 presidential election polls: first-round voting intentions, second-round matchups and campaign trends.' } },
  { id: 'etat', section: 'etat', path: '/etat-de-la-france', label: 'État de la France',
    title: 'État de la France : croissance, emploi, démographie et énergie depuis 1960',
    description: 'Les grands indicateurs macroéconomiques de la France sur longue période, comparés à l’Union européenne : PIB par habitant, chômage, inflation, balance courante, démographie, pauvreté, énergie et climat.',
    en: { label: 'State of France', title: 'State of France: growth, jobs, population and energy since 1960',
      description: 'France’s key macroeconomic indicators over the long run, compared with the EU: GDP per person, unemployment, inflation, current account, population, poverty, energy and climate.' } },
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
  election: '/presidentielle-2027', presidentielle: '/presidentielle-2027', polls: '/sondages-presidentielle-2027', sondages: '/sondages-presidentielle-2027', etat: '/etat-de-la-france',
}

export const routeOf = path => {
  const p = path.replace(/\/+$/, '') || '/'
  return ROUTES.find(r => r.path === p) || (p === '/carte' ? ROUTES[0] : undefined)
}
