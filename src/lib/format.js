// Formatage des nombres à la française. Montants en milliards d'euros (Md€) sauf mention contraire.
const NBSP = ' '
const cache = {}
const nf = d => (cache[d] = cache[d] || new Intl.NumberFormat('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }))

export const fmt = (v, d = 1) => nf(d).format(v)
export const bn = (v, d = 1) => `${fmt(v, d)}${NBSP}Md€`
export const pct = (v, d = 1) => `${fmt(v, d)}${NBSP}%`
export const signed = (v, d = 1) => { const r = +v.toFixed(d); return (r > 0 ? '+' : r < 0 ? '−' : '') + fmt(Math.abs(r), d) }
export const sbn = (v, d = 1) => `${signed(v, d)}${NBSP}Md€`
export const pts = (v, d = 1) => `${signed(v, d)}${NBSP}pt`

// Montants bruts en euros (fichiers du budget de l'État) -> « 24,9 Md€ », « 146 M€ ».
export const eur = v => {
  if (v == null) return '–'
  const a = Math.abs(v)
  if (a >= 1e9) return `${fmt(v / 1e9, 1)}${NBSP}Md€`
  if (a >= 1e6) return `${fmt(v / 1e6, 0)}${NBSP}M€`
  if (a >= 1e3) return `${fmt(v / 1e3, 0)}${NBSP}k€`
  return `${fmt(v, 0)}${NBSP}€`
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
// "2026-10-08" -> « 8 oct. 2026 » ; withYear = false -> « 8 oct. »
export const dateFr = (iso, withYear = true) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return `${d} ${MOIS[m - 1]}${withYear ? ' ' + y : ''}` }
export const monthFr = (y, m) => `${MOIS[m - 1]} ${y}`
