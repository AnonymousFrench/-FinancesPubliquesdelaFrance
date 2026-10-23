// Taux des emprunts d'État à 10 ans, mensuels, pour comparer la France à d'autres pays (onglet Dette et financement).
// - Pays de l'UE : Eurostat irt_lt_mcby_m (taux de convergence de Maastricht), la même série que la France.
// - Royaume-Uni, États-Unis, Japon : OCDE (Main Economic Indicators, taux longs), via la Réserve fédérale de Saint-Louis (FRED).
// Chaque pays garde une seule source. La série France est aussi réécrite dans data-raw/oat10y_monthly.json (lue par build-data.mjs).
// Usage : node scripts/fetch-yields.mjs  →  src/data/yields.json (puis npm run data pour taux.js)
import fs from 'node:fs'

const FROM = '1993-01'
const EU = ['FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'PT', 'EL']
const FRED = { UK: 'IRLTLT01GBM156N', US: 'IRLTLT01USM156N', JP: 'IRLTLT01JPM156N' }

const out = { updated: new Date().toISOString().slice(0, 10), series: {} }
const file = new URL('../src/data/yields.json', import.meta.url)
const prev = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : { series: {} }

async function eurostat() {
  const q = new URLSearchParams({ sinceTimePeriod: FROM })
  for (const g of EU) q.append('geo', g)
  const r = await fetch('https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/irt_lt_mcby_m?' + q)
  if (!r.ok) throw new Error('irt_lt_mcby_m ' + r.status)
  const j = await r.json()
  const ids = j.id, size = j.size
  const gPos = ids.indexOf('geo'), tPos = ids.indexOf('time')
  for (let d = 0; d < ids.length; d++) if (d !== gPos && d !== tPos && size[d] !== 1) throw new Error('irt_lt_mcby_m : dimension ' + ids[d] + ' a ' + size[d] + ' valeurs')
  const stride = i => size.slice(i + 1).reduce((a, b) => a * b, 1)
  const geoIdx = j.dimension.geo.category.index, timeIdx = j.dimension.time.category.index
  const times = Object.keys(timeIdx).sort()
  for (const g of EU) {
    if (geoIdx[g] == null) continue
    const pts = times.map(t => [t, j.value[geoIdx[g] * stride(gPos) + timeIdx[t] * stride(tPos)] ?? null]).filter(([, v]) => v != null)
    out.series[g === 'EL' ? 'GR' : g] = pts.map(([t, v]) => [t, +(+v).toFixed(2)])
  }
  // France : même fichier brut que celui lu par build-data.mjs (taux.js).
  const fr = out.series.FR
  if (fr?.length) fs.writeFileSync(new URL('../data-raw/oat10y_monthly.json', import.meta.url), JSON.stringify({ keys: fr.map(p => p[0]), vals: fr.map(p => p[1]) }))
}

async function fred(code, id) {
  const r = await fetch('https://fred.stlouisfed.org/graph/fredgraph.csv?id=' + id)
  if (!r.ok) throw new Error(id + ' ' + r.status)
  const rows = (await r.text()).trim().split('\n').slice(1).map(l => l.trim().split(','))
  out.series[code] = rows.filter(([d, v]) => v && v !== '.' && d.slice(0, 7) >= FROM).map(([d, v]) => [d.slice(0, 7), +(+v).toFixed(2)])
}

const jobs = [['UE (Eurostat)', eurostat], ...Object.entries(FRED).map(([c, id]) => [c, () => fred(c, id)])]
for (const [name, job] of jobs) {
  try { await job() } catch (e) {
    console.log('ÉCHEC', name, e.message)
    if (process.env.GITHUB_ACTIONS) console.log(`::warning title=Taux à 10 ans non rafraîchis::${name} : ${e.message.slice(0, 150)}`)
  }
}
// Une source indisponible ne doit pas effacer les séries déjà publiées.
const series = { ...prev.series, ...out.series }
fs.writeFileSync(file, JSON.stringify({ updated: out.updated, series }))
for (const [c, p] of Object.entries(series)) console.log(c.padEnd(3), p[0]?.[0], '→', p.at(-1)?.[0], p.at(-1)?.[1])
