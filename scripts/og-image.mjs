// Génère les images statiques du site : aperçu pour les réseaux sociaux (1200×630), icônes.
// À relancer si les chiffres de l'en-tête changent : `node scripts/og-image.mjs`.
import fs from 'node:fs'
import { Resvg } from '@resvg/resvg-js'
import { apu } from '../src/data/apu.js'
import { debtLatest } from '../src/data/data.js'

const i = apu.years.length - 1
const nf = (v, d = 0) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v).replace(/ /g, ' ')
const font = 'Segoe UI, Arial, Helvetica, sans-serif'
const stat = (x, label, value, sub, color) => `
  <text x="${x}" y="398" font-size="26" fill="#66707e" font-family="${font}">${label}</text>
  <text x="${x}" y="460" font-size="58" font-weight="700" fill="${color}" font-family="${font}">${value}</text>
  <text x="${x}" y="500" font-size="24" fill="#66707e" font-family="${font}">${sub}</text>`

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect x="0" y="0" width="1200" height="10" fill="#e1000f"/>
  <g transform="translate(80,92)"><rect width="22" height="44" fill="#000091"/><rect x="22" width="22" height="44" fill="#ffffff" stroke="#e4e7ec"/><rect x="44" width="22" height="44" fill="#e1000f"/></g>
  <text x="166" y="128" font-size="44" font-weight="700" fill="#171a21" font-family="${font}">Finances publiques de la France</text>
  <text x="80" y="214" font-size="34" fill="#171a21" font-family="${font}">Dette, déficit, budget de l’État ligne par ligne</text>
  <text x="80" y="262" font-size="34" fill="#171a21" font-family="${font}">et programmes de la présidentielle 2027</text>
  <line x1="80" y1="330" x2="1120" y2="330" stroke="#e4e7ec" stroke-width="2"/>
  ${stat(80, 'Dette publique', `${nf(debtLatest.total)} Md€`, `${nf(debtLatest.pct, 1)} % du PIB`, '#e1000f')}
  ${stat(470, `Déficit ${apu.years[i]}`, `${nf(-apu.soldePct[i], 1)} %`, 'du PIB', '#e1000f')}
  ${stat(800, `Intérêts ${apu.years[i]}`, `${nf(apu.interets[i], 1)} Md€`, `≈ ${Math.round(apu.interets[i] * 1000 / 365)} M€ par jour`, '#171a21')}
  <text x="80" y="580" font-size="22" fill="#9aa4b2" font-family="${font}">Sources : Eurostat, Insee, Agence France Trésor, data.economie.gouv.fr</text>
</svg>`

const flag = '<rect x="3" y="8" width="8.67" height="16" fill="#000091"/><rect x="11.67" y="8" width="8.67" height="16" fill="#ffffff" stroke="#c7ccd4" stroke-width=".5"/><rect x="20.33" y="8" width="8.67" height="16" fill="#e1000f"/>'
// Favicon : fond transparent. L'icône iOS garde un fond blanc (iOS n'accepte pas la transparence).
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${flag}</svg>`
const iconIos = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#ffffff"/>${flag}</svg>`

const png = (svg, width) => new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: true } }).render().asPng()
fs.writeFileSync('public/og.png', png(og, 1200))
fs.writeFileSync('public/favicon.svg', icon)
fs.writeFileSync('public/apple-touch-icon.png', png(iconIos, 180))
console.log('public/og.png, favicon.svg, apple-touch-icon.png')
