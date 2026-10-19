// Génère les images statiques du site : un aperçu par rubrique et par langue pour les réseaux sociaux (1200×630), icônes.
// À relancer si les chiffres changent : `npm run og`.
import fs from 'node:fs'
import { Resvg } from '@resvg/resvg-js'
import { apu } from '../src/data/apu.js'
import { debtLatest } from '../src/data/data.js'
import { parties, ORDER, SCORED } from '../src/data/election2027.js'

const E = JSON.parse(fs.readFileSync('src/data/etat-series.json', 'utf8'))
const lastOf = id => { const o = E[id].fr, y = Object.keys(o).sort().at(-1); return [y, o[y]] }
const i = apu.years.length - 1, Y = apu.years[i]
const nfL = loc => (v, d = 0) => new Intl.NumberFormat(loc, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v).replace(/[  ]/g, loc === 'fr-FR' ? ' ' : ',')
const font = 'Segoe UI, Arial, Helvetica, sans-serif'
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

const stat = (x, label, value, sub, color) => `
  <text x="${x}" y="398" font-size="26" fill="#66707e" font-family="${font}">${esc(label)}</text>
  <text x="${x}" y="460" font-size="58" font-weight="700" fill="${color}" font-family="${font}">${esc(value)}</text>
  <text x="${x}" y="500" font-size="24" fill="#66707e" font-family="${font}">${esc(sub)}</text>`

// Gabarit commun : bandeau, nom du site, rubrique, deux lignes d'accroche, contenu, sources.
const card = ({ section, line1, line2, body, src }) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect x="0" y="0" width="1200" height="10" fill="#e1000f"/>
  <g transform="translate(80,92)"><rect width="22" height="44" fill="#000091"/><rect x="22" width="22" height="44" fill="#ffffff" stroke="#e4e7ec"/><rect x="44" width="22" height="44" fill="#e1000f"/></g>
  <text x="166" y="128" font-size="44" font-weight="700" fill="#171a21" font-family="${font}">État des finances<tspan fill="#9aa4b2" font-weight="400" dx="14">· ${esc(section)}</tspan></text>
  <text x="80" y="214" font-size="34" fill="#171a21" font-family="${font}">${esc(line1)}</text>
  <text x="80" y="262" font-size="34" fill="#171a21" font-family="${font}">${esc(line2)}</text>
  <line x1="80" y1="330" x2="1120" y2="330" stroke="#e4e7ec" stroke-width="2"/>
  ${body}
  <text x="80" y="580" font-size="22" fill="#9aa4b2" font-family="${font}">${esc(src)}</text>
</svg>`

function images(en) {
  const nf = nfL(en ? 'en-US' : 'fr-FR')
  const T = (fr, e) => (en ? e : fr)
  const bn = v => (en ? `€${nf(v)}bn` : `${nf(v)} Md€`)
  const pc = (v, d = 1) => (en ? `${nf(v, d)}%` : `${nf(v, d)} %`)
  const finances = card({
    section: T('Finances publiques', 'Public finances'),
    line1: T('Dette, déficit, budget de l’État ligne par ligne', 'Debt, deficit and the State budget line by line'),
    line2: T('et programmes de la présidentielle 2027', 'and the 2027 presidential programmes'),
    body: stat(80, T('Dette publique', 'Public debt'), bn(debtLatest.total), `${pc(debtLatest.pct)} ${T('du PIB', 'of GDP')}`, '#e1000f')
      + stat(470, `${T('Déficit', 'Deficit')} ${Y}`, pc(-apu.soldePct[i]), T('du PIB', 'of GDP'), '#e1000f')
      + stat(800, `${T('Intérêts', 'Interest')} ${Y}`, en ? `€${nf(apu.interets[i], 1)}bn` : `${nf(apu.interets[i], 1)} Md€`, T(`≈ ${Math.round(apu.interets[i] * 1000 / 365)} M€ par jour`, `≈ €${Math.round(apu.interets[i] * 1000 / 365)}m a day`), '#171a21'),
    src: T('Sources : Eurostat, Insee, Agence France Trésor, data.economie.gouv.fr', 'Sources: Eurostat, Insee, Agence France Trésor, data.economie.gouv.fr'),
  })
  // Pas de chiffres de sondage dans l'image (période de réserve) : les candidats suivis et leur couleur, sur deux lignes.
  const perRow = Math.ceil(ORDER.length / 2)
  const chips = ORDER.map((id, k) => {
    const q = parties[id], row = Math.floor(k / perRow), x = 80 + (k % perRow) * 175, y = 350 + row * 82
    return `<rect x="${x}" y="${y}" width="160" height="70" rx="12" fill="${q.color}" opacity=".12"/><rect x="${x}" y="${y}" width="7" height="70" rx="3" fill="${q.color}"/>
      <text x="${x + 20}" y="${y + 32}" font-size="26" font-weight="700" fill="#171a21" font-family="${font}">${esc(q.short)}</text>
      <text x="${x + 20}" y="${y + 57}" font-size="16" fill="#66707e" font-family="${font}">${esc(q.candidate.split(' ').slice(1).join(' '))}</text>`
  }).join('')
  const presidentielle = card({
    section: T('Présidentielle 2027', '2027 election'),
    line1: T(`${ORDER.length} candidats, ${SCORED.length} programmes chiffrés au même modèle :`, `${ORDER.length} candidates, ${SCORED.length} costed programmes, one model:`),
    line2: T('effet sur le déficit et la dette jusqu’en 2032', 'effect on the deficit and debt to 2032'),
    body: chips,
    src: T('Sources : programmes des partis, analyses indépendantes, Eurostat', 'Sources: party programmes, independent reviews, Eurostat'),
  })
  const [gy, gv] = lastOf('gdpPcPpp'), [, fv] = lastOf('fertility'), u = E.unemp.latest
  const etat = card({
    section: T('État de la France', 'State of France'),
    line1: T('26 indicateurs macroéconomiques depuis 1960,', '26 macroeconomic indicators since 1960,'),
    line2: T('comparés à l’UE, aux États-Unis et à la Chine', 'compared with the EU, the US and China'),
    body: stat(80, `${T('PIB par habitant', 'GDP per person')} ${gy}`, en ? `$${nf(gv)}` : `${nf(gv)} $`, T('parité de pouvoir d’achat', 'purchasing power parity'), '#2148c0')
      + stat(470, T('Chômage', 'Unemployment'), pc(u.v), u.period.replace(/(\d{4})-Q(\d)/, en ? 'Q$2 $1' : 'T$2 $1'), '#e1000f')
      + stat(800, T('Fécondité', 'Fertility'), nf(fv, 2), T('enfant par femme', 'children per woman'), '#171a21'),
    src: T('Sources : Eurostat, Insee, Banque mondiale, FMI, Nations unies', 'Sources: Eurostat, Insee, World Bank, IMF, United Nations'),
  })
  return { finances, presidentielle, etat }
}

const png = (svg, width) => new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: true } }).render().asPng()
for (const en of [false, true]) {
  for (const [sec, svg] of Object.entries(images(en))) {
    const f = `public/og${sec === 'finances' ? '' : '-' + sec}${en ? '-en' : ''}.png`
    fs.writeFileSync(f, png(svg, 1200))
    console.log(f)
  }
}

const flag = '<rect x="3" y="8" width="8.67" height="16" fill="#000091"/><rect x="11.67" y="8" width="8.67" height="16" fill="#ffffff" stroke="#c7ccd4" stroke-width=".5"/><rect x="20.33" y="8" width="8.67" height="16" fill="#e1000f"/>'
// Favicon : fond transparent. L'icône iOS garde un fond blanc (iOS n'accepte pas la transparence).
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${flag}</svg>`
const iconIos = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#ffffff"/>${flag}</svg>`
fs.writeFileSync('public/flag.svg', icon)
fs.writeFileSync('public/apple-touch-icon.png', png(iconIos, 180))
