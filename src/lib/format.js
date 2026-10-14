// Formatage des nombres et dates, selon la langue courante. Montants en milliards d'euros (Md€ / €bn) sauf mention contraire.
import { isEn } from '../i18n.js'

const NBSP = ' '
const cache = {}
const nf = d => { const k = (isEn() ? 'en' : 'fr') + d; return (cache[k] = cache[k] || new Intl.NumberFormat(isEn() ? 'en-US' : 'fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })) }

export const fmt = (v, d = 1) => nf(d).format(v).replace('-', '−')
export const bn = (v, d = 1) => (isEn() ? `€${fmt(v, d)}bn` : `${fmt(v, d)}${NBSP}Md€`)
export const pct = (v, d = 1) => (isEn() ? `${fmt(v, d)}%` : `${fmt(v, d)}${NBSP}%`)
export const signed = (v, d = 1) => { const r = +v.toFixed(d); return (r > 0 ? '+' : r < 0 ? '−' : '') + fmt(Math.abs(r), d) }
export const sbn = (v, d = 1) => (isEn() ? `${signed(v, d)}bn` : `${signed(v, d)}${NBSP}Md€`)
export const pts = (v, d = 1) => `${signed(v, d)}${NBSP}pt`
// Unité d'un montant en milliards, pour les cas où le nombre est formaté à part.
export const unitBn = () => (isEn() ? '€bn' : 'Md€')

// Montants bruts en euros (fichiers du budget de l'État) -> « 24,9 Md€ », « 146 M€ » / "€24.9bn", "€146m".
export const eur = v => {
  if (v == null) return '–'
  const a = Math.abs(v), sg = v < 0 ? '−' : ''
  if (isEn()) {
    if (a >= 1e9) return `${sg}€${fmt(a / 1e9, 1)}bn`
    if (a >= 1e6) return `${sg}€${fmt(a / 1e6, 0)}m`
    if (a >= 1e3) return `${sg}€${fmt(a / 1e3, 0)}k`
    return `${sg}€${fmt(a, 0)}`
  }
  if (a >= 1e9) return `${fmt(v / 1e9, 1)}${NBSP}Md€`
  if (a >= 1e6) return `${fmt(v / 1e6, 0)}${NBSP}M€`
  if (a >= 1e3) return `${fmt(v / 1e3, 0)}${NBSP}k€`
  return `${fmt(v, 0)}${NBSP}€`
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
// "2026-10-08" -> « 8 oct. 2026 » / "8 Oct 2026" ; withYear = false -> sans l'année.
export const dateFr = (iso, withYear = true) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return `${d} ${(isEn() ? MONTHS : MOIS)[m - 1]}${withYear ? ' ' + y : ''}` }
export const monthFr = (y, m) => `${(isEn() ? MONTHS : MOIS)[m - 1]} ${y}`

// Libellés des fichiers officiels du budget : apostrophes typographiques et majuscules accentuées
// (les fichiers sources écrivent « Etat », « Etudes », « Evaluation »… sans accent).
const CAPS = [[/\bEtats?\b/g, m => 'É' + m.slice(1)], [/\bEtudes?\b/g, m => 'É' + m.slice(1)], [/\bEvaluation\b/g, 'Évaluation'], [/\bEvolution\b/g, 'Évolution'], [/\bEquipements?\b/g, m => 'É' + m.slice(1)], [/\bEducation\b/g, 'Éducation']]
export const label = s => CAPS.reduce((t, [re, to]) => t.replace(re, to), (s || '').replace(/'/g, '’'))
