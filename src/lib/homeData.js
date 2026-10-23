// Données de la page d'accueil chargées après le premier affichage : projections des programmes,
// moyenne des sondages et indicateurs « État de la France ». Module à part pour garder la première page légère.
import { baseline, parties, SCORED, reviewCredibility, FIRST_YEAR_SHARE } from '../data/election2027.js'
import { project, YEARS } from './projection.js'
import { series, COUNT } from '../data/etat.js'
export const indicatorCount = COUNT
import snapshot from '../data/polls-snapshot.json'
import { average, fetchLivePolls, pollBlackout } from './polls.js'

export const FIRST_ROUND = '2027-04-18'

// Dette (% du PIB) jusqu'en 2032 : politique inchangée et, chaque année, le plus bas et le plus haut des programmes chiffrés.
// Mêmes réglages que la comparaison par défaut de la page Programmes (analyse centrale, croissance consensus).
export function debtFan() {
  const opts = { marketRate: baseline.marketRate, spreadBp: 0, multiplier: 0, firstYearShare: FIRST_YEAR_SHARE }
  const base = project(baseline, { marketRate: baseline.marketRate })
  const runs = SCORED.map(id => project(baseline, { ...opts, measures: parties[id].measures, growth: baseline.growth, credibility: reviewCredibility(parties[id], parties[id].reviewDefault) }))
  return {
    years: YEARS,
    base: base.map(r => r.debtPct),
    lo: YEARS.map((_, k) => Math.min(...runs.map(r => r[k].debtPct))),
    hi: YEARS.map((_, k) => Math.max(...runs.map(r => r[k].debtPct))),
    scored: SCORED.length,
  }
}

// Moyenne du premier tour (même méthode que la page Sondages) et date du dernier sondage pris en compte.
export function pollSummary(data, asOf = new Date().toISOString().slice(0, 10)) {
  const a = average(data.first, asOf)
  const last = data.first.filter(p => !p.partySponsor && p.date <= asOf).map(p => p.date).sort().at(-1)
  return { rows: a.rows, n: a.n, last, blackout: pollBlackout() }
}
export const pollSnapshot = () => pollSummary(snapshot)
export const pollLive = () => fetchLivePolls().then(d => pollSummary(d))

// Quatre indicateurs face à l'UE, comparés sur la même année (la dernière publiée pour les deux).
const IND = [
  { id: 'unemp', unit: 'pct', d: 1 },
  { id: 'gdpPcPpp', unit: 'usd', d: 0 },
  { id: 'hours', unit: 'h', d: 0 },
  { id: 'fertility', unit: 'num', d: 2 },
]
export function indicators() {
  return IND.map(m => {
    const s = series(m.id) || {}
    const years = Object.keys(s.fr || {}).filter(y => s.eu?.[y] != null).sort()
    const y = years.at(-1)
    return y ? { ...m, year: y, fr: s.fr[y], eu: s.eu[y] } : null
  }).filter(Boolean)
}
export const population = () => { const o = series('pop')?.fr || {}; const y = Object.keys(o).sort().at(-1); return y ? o[y] : null }
