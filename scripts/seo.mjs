// Après `vite build` : une page HTML par rubrique (titre, description, URL canonique, aperçus sociaux,
// données structurées et contenu lisible par les moteurs avant le chargement de React),
// plus sitemap.xml, robots.txt et 404.html.
// Adresse du site : variable SITE_URL, sinon le domaine de production Vercel, sinon une valeur par défaut.
import fs from 'node:fs'
import { ROUTES, SITE_NAME, withLang } from '../src/routes.js'
import { apu } from '../src/data/apu.js'
import { debtLatest, aft, financing2026 } from '../src/data/data.js'
import { parties, ORDER } from '../src/data/election2027.js'
import { average } from '../src/lib/polls.js'

const SITE = (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://www.etatdesfinances.fr')).replace(/\/$/, '')
if (!process.env.SITE_URL && !process.env.VERCEL_PROJECT_PRODUCTION_URL) console.warn(`seo : SITE_URL non défini, adresse par défaut ${SITE}`)

const i = apu.years.length - 1, Y = apu.years[i]
const nf = (v, d = 0) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v)
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const today = new Date().toISOString().slice(0, 10)
const polls = JSON.parse(fs.readFileSync('src/data/polls-snapshot.json', 'utf8'))
const avg = average(polls.first, today)
const E = JSON.parse(fs.readFileSync('src/data/etat-series.json', 'utf8'))
const lastOf = id => { const o = E[id].fr, y = Object.keys(o).sort().at(-1); return [y, o[y]] }
const fact = (lbl, id, unit, d = 1) => { const [y, v] = lastOf(id); return `${lbl} : ${nf(v, d)}${unit} (${y}).` }

// Contenu statique par rubrique : quelques faits clés, en texte, pour les moteurs et les aperçus.
const FACTS = {
  etat: [
    fact('PIB par habitant', 'gdpPc', ' € constants de 2020', 0), fact('Taux de chômage', 'unemp', ' %'), fact('Inflation', 'inflation', ' %'),
    fact('Balance courante', 'currentAcc', ' % du PIB'), fact('Fécondité', 'fertility', ' enfant par femme', 2), fact('Espérance de vie', 'lifeExp', ' ans'),
    fact('Taux de pauvreté', 'poverty', ' %'), fact('Émissions de gaz à effet de serre', 'ghg', ' Mt CO2e', 0),
  ],
  synthese: [
    `Dépenses publiques ${Y} : ${nf(apu.depenses[i], 1)} Md€, soit ${nf(apu.depensesPct[i], 1)} % du PIB.`,
    `Recettes publiques ${Y} : ${nf(apu.recettes[i], 1)} Md€, soit ${nf(apu.recettesPct[i], 1)} % du PIB.`,
    `Déficit public ${Y} : ${nf(-apu.solde[i], 1)} Md€, soit ${nf(-apu.soldePct[i], 1)} % du PIB.`,
    `Dette publique au ${debtLatest.label} : ${nf(debtLatest.total, 1)} Md€, soit ${nf(debtLatest.pct, 1)} % du PIB.`,
    `Charge d’intérêts ${Y} : ${nf(apu.interets[i], 1)} Md€.`,
  ],
  recettes: [
    `Recettes publiques ${Y} : ${nf(apu.recettes[i], 1)} Md€.`,
    `TVA : ${nf(apu.tva[i], 1)} Md€. Cotisations sociales : ${nf(apu.cotisationsSociales[i], 1)} Md€.`,
    `Impôts sur le revenu et le patrimoine (IR, CSG, IS) : ${nf(apu.impotsRevenuPatrimoine[i], 1)} Md€.`,
  ],
  depenses: [
    `Dépenses publiques ${Y} : ${nf(apu.depenses[i], 1)} Md€.`,
    `Prestations sociales en espèces : ${nf(apu.prestationsSociales[i], 1)} Md€. Rémunérations des agents publics : ${nf(apu.remunerations[i], 1)} Md€.`,
    `Budget de l’État détaillé par mission, programme, action et sous-action (PLF 2025).`,
  ],
  dette: [
    `Dette publique au ${debtLatest.label} : ${nf(debtLatest.total, 1)} Md€ (${nf(debtLatest.pct, 1)} % du PIB).`,
    `Dette nette : ${nf(debtLatest.net, 1)} Md€. Intérêts ${Y} : ${nf(apu.interets[i], 1)} Md€.`,
    `Taux moyen de la dette ${Y} : ${nf(apu.tauxApparent[i], 2)} %.`,
  ],
  financement: [
    `Besoin de financement de l’État en 2026 : ${nf(financing2026.needs.reduce((s, x) => s + x.v, 0), 0)} Md€, couvert par ${nf(financing2026.issuance, 0)} Md€ d’émissions.`,
    `Taux de l’OAT à 10 ans : ${nf(aft.spot10.v, 2)} % au ${aft.spot10.date}.`,
  ],
  presidentielle: ORDER.map(id => { const q = parties[id]; return `${q.candidate} (${q.name}) : ${q.headline.slice(0, 2).map(([k, v]) => `${k.toLowerCase()} ${v}`).join(', ')}.` }),
  // Pas de chiffres de sondage dans le HTML statique : il resterait servi pendant la période de réserve.
  sondages: [`Moyenne des sondages ${avg.n ? `de ${avg.n} instituts ` : ''}mise à jour en direct, hypothèses de second tour et dynamique de campagne.`],
}

const jsonld = (r, en) => JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': `${SITE}/#site`, url: `${SITE}/`, name: SITE_NAME, inLanguage: 'fr-FR' },
    { '@type': 'WebPage', '@id': `${SITE}${withLang(r.path, en ? 'en' : 'fr')}#page`, url: `${SITE}${withLang(r.path, en ? 'en' : 'fr')}`, name: en ? r.en.title : r.title, description: en ? r.en.description : r.description, inLanguage: en ? 'en' : 'fr-FR', isPartOf: { '@id': `${SITE}/#site` }, dateModified: today,
      breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE}/` }, ...(r.path === '/' ? [] : [{ '@type': 'ListItem', position: 2, name: en ? r.en.label : r.label, item: `${SITE}${withLang(r.path, en ? 'en' : 'fr')}` }])] } },
    { '@type': 'Dataset', name: 'État des finances : finances publiques et indicateurs de la France', description: 'Recettes, dépenses, déficit, dette et charge d’intérêts des administrations publiques françaises, budget de l’État par mission, projections des programmes présidentiels 2027.',
      url: `${SITE}/`, inLanguage: 'fr-FR', spatialCoverage: 'France', temporalCoverage: '1995/2032',
      isBasedOn: ['https://ec.europa.eu/eurostat/databrowser/view/gov_10a_main/default/table', 'https://www.insee.fr/fr/statistiques/series/102760712', 'https://www.aft.gouv.fr/', 'https://data.economie.gouv.fr/'],
      variableMeasured: ['Dette publique', 'Déficit public', 'Dépenses publiques', 'Recettes publiques', 'Charge d’intérêts'] },
  ],
}).replace(/</g, '\\u003c')

const prerender = (r, en) => `
<div class="app prerender"><header><a href="${withLang('/', en ? 'en' : 'fr')}" class="brand">${SITE_NAME}</a></header>
<nav aria-label="${en ? 'Sections' : 'Rubriques'}">${ROUTES.map(x => `<a href="${withLang(x.path, en ? 'en' : 'fr')}"${x.id === r.id ? ' class="on"' : ''}>${esc(en ? x.en.label : x.label)}</a>`).join('')}</nav>
<main><h1>${esc(en ? r.en.title : r.title)}</h1><p>${esc(en ? r.en.description : r.description)}</p>${en ? '' : `<ul>${(FACTS[r.id] || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul>`}</main></div>`

const tpl = fs.readFileSync('dist/index.html', 'utf8')
const ogOf = (r, en) => `/og${r.section === 'finances' ? '' : '-' + r.section}${en ? '-en' : ''}.png`
const page = (r, { noindex = false, en = false } = {}) => {
  const url = `${SITE}${withLang(r.path, en ? 'en' : 'fr')}`
  const t = en ? r.en.title : r.title, d = en ? r.en.description : r.description
  const title = r.path === '/' ? t : `${t} | ${SITE_NAME}`
  const alt = `<link rel="alternate" hreflang="fr" href="${SITE}${r.path}" />\n<link rel="alternate" hreflang="en" href="${SITE}${withLang(r.path, 'en')}" />\n<link rel="alternate" hreflang="x-default" href="${SITE}${r.path}" />`
  let h = tpl
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*"/, `$1${esc(d)}"`)
    .replace(/(<link rel="canonical" href=")[^"]*" \/>/, `$1${url}" />\n${noindex ? '' : alt}`)
    .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${url}"`)
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${esc(title)}"`)
    .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${esc(d)}"`)
    .replace(/(<meta name="twitter:title" content=")[^"]*"/, `$1${esc(title)}"`)
    .replace(/(<meta name="twitter:description" content=")[^"]*"/, `$1${esc(d)}"`)
    .replace(/(content=")\/og\.png"/g, `$1${SITE}${ogOf(r, en)}"`)
    .replace('<!--jsonld-->', `<script type="application/ld+json">${jsonld(r, en)}</script>`)
    .replace('<!--prerender-->', prerender(r, en))
  if (en) h = h.replace('<html lang="fr">', '<html lang="en">').replace('content="fr_FR"', 'content="en_GB" />\n<meta property="og:locale:alternate" content="fr_FR"')
  else h = h.replace('content="fr_FR" />', 'content="fr_FR" />\n<meta property="og:locale:alternate" content="en_GB" />')
  if (noindex) h = h.replace(/<meta name="robots" content="[^"]*"/, '<meta name="robots" content="noindex"')
  return h
}

fs.mkdirSync('dist/en', { recursive: true })
for (const r of ROUTES) {
  fs.writeFileSync(r.path === '/' ? 'dist/index.html' : `dist${r.path}.html`, page(r))
  fs.writeFileSync(r.path === '/' ? 'dist/en.html' : `dist/en${r.path}.html`, page(r, { en: true }))
}
fs.writeFileSync('dist/404.html', page({ ...ROUTES[0], title: 'Page introuvable' }, { noindex: true }))
fs.writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${ROUTES.flatMap(r => ['fr', 'en'].map(l => `  <url><loc>${SITE}${withLang(r.path, l)}</loc><xhtml:link rel="alternate" hreflang="fr" href="${SITE}${r.path}"/><xhtml:link rel="alternate" hreflang="en" href="${SITE}${withLang(r.path, 'en')}"/><lastmod>${today}</lastmod><changefreq>${r.id === 'sondages' ? 'daily' : 'weekly'}</changefreq><priority>${r.path === '/' ? '1.0' : r.id === 'presidentielle' || r.id === 'sondages' ? '0.9' : '0.7'}</priority></url>`)).join('\n')}
</urlset>
`)
fs.writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)
console.log(`seo : ${ROUTES.length} pages × 2 langues, sitemap et robots.txt pour ${SITE}`)
