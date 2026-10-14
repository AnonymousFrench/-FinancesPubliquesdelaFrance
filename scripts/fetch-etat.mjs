// Indicateurs macro « État de la France » : Eurostat (JSON-stat) et Banque mondiale, France et UE à 27.
// Usage : node scripts/fetch-etat.mjs  →  écrit src/data/etat.js
import fs from 'node:fs'

const ES = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
const WB = 'https://api.worldbank.org/v2/country/'

async function eurostat(ds, filters, geos = ['FR', 'EU27_2020']) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(filters)) q.append(k, v)
  for (const g of geos) q.append('geo', g)
  const r = await fetch(ES + ds + '?' + q)
  if (!r.ok) throw new Error(ds + ' ' + r.status + ' ' + (await r.text()).slice(0, 200))
  const j = await r.json()
  const ids = j.id, size = j.size
  const geoIdx = j.dimension.geo.category.index, timeIdx = j.dimension.time.category.index
  for (let d = 0; d < ids.length; d++) if (!['geo', 'time'].includes(ids[d]) && size[d] !== 1) throw new Error(ds + ': dimension ' + ids[d] + ' a ' + size[d] + ' valeurs')
  const gPos = ids.indexOf('geo'), tPos = ids.indexOf('time')
  const stride = i => size.slice(i + 1).reduce((a, b) => a * b, 1)
  const out = {}
  for (const g of geos) {
    out[g] = {}
    for (const [t, ti] of Object.entries(timeIdx)) {
      const k = (geoIdx[g] ?? -1) * stride(gPos) + ti * stride(tPos)
      const v = j.value[k]
      if (geoIdx[g] != null && v != null) out[g][t.slice(0, 4)] = v
    }
  }
  return { fr: out.FR, eu: geos.length > 1 ? out.EU27_2020 : null, updated: j.updated?.slice(0, 10) }
}

async function worldbank(code, countries = ['FRA', 'EUU']) {
  const r = await fetch(`${WB}${countries.join(';')}/indicator/${code}?format=json&per_page=500`)
  const j = await r.json()
  if (!Array.isArray(j) || !j[1]) throw new Error(code + ' ' + JSON.stringify(j).slice(0, 200))
  const out = { FRA: {}, EUU: {}, USA: {}, CHN: {} }
  for (const o of j[1]) if (o.value != null) out[o.countryiso3code][o.date] = o.value
  return { fr: out.FRA, eu: countries.includes('EUU') ? out.EUU : null, us: out.USA, raw: out, updated: j[0].lastupdated }
}

// Insee BDM (SDMX) : moyenne annuelle des trimestres ; garde aussi le dernier trimestre publié.
async function insee(id) {
  const x = await (await fetch('https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/' + id)).text()
  const obs = [...x.matchAll(/TIME_PERIOD="([^"]+)" OBS_VALUE="([^"]+)"/g)].map(m => [m[1], +m[2]]).sort()
  const by = {}
  for (const [t, v] of obs) (by[t.slice(0, 4)] ||= []).push(v)
  const fr = {}
  for (const [y, v] of Object.entries(by)) if (v.length === 4) fr[y] = +(v.reduce((a, b) => a + b) / 4).toFixed(2)
  const [lt, lv] = obs.at(-1)
  return { fr, eu: null, latest: { period: lt, v: lv } }
}

// Pays de comparaison (USA, CHN) : Banque mondiale, FMI (dette et dépense publiques, séries historiques) ou Réserve fédérale (taux à 10 ans, USA).
async function foreign(u, iso = 'USA') {
  if (u.wb) return (await worldbank(u.wb, [iso])).raw[iso]
  if (u.imf) {
    const j = await (await fetch('https://www.imf.org/external/datamapper/api/v1/' + u.imf + '/' + iso)).json()
    return j.values[u.imf]?.[iso] || {}
  }
  if (u.fred && iso === 'USA') {
    const rows = (await (await fetch('https://fred.stlouisfed.org/graph/fredgraph.csv?id=' + u.fred)).text()).trim().split(String.fromCharCode(10)).slice(1).map(l => l.trim().split(','))
    const by = {}
    for (const [d, v] of rows) if (v && v !== '.') (by[d.slice(0, 4)] ||= []).push(+v)
    return Object.fromEntries(Object.entries(by).filter(([, v]) => v.length === 12).map(([y, v]) => [y, +(v.reduce((a, b) => a + b) / 12).toFixed(2)]))
  }
}

const test = process.argv[2]
const SPECS = JSON.parse(fs.readFileSync(new URL('./etat-specs.json', import.meta.url)))
const res = {}
for (const s of SPECS) {
  if (test && s.id !== test) continue
  try {
    const d = s.usOnly ? { fr: {}, us: await foreign(s.us), ...(s.cn ? { cn: await foreign(s.us, 'CHN') } : {}) } : s.insee ? await insee(s.insee) : s.wb ? await worldbank(s.wb, s.eu === false ? ['FRA'] : undefined) : await eurostat(s.es, s.f, s.eu === false ? ['FR'] : undefined)
    if (s.us && !s.usOnly) d.us = await foreign(s.us)
    else if (!s.us) delete d.us
    delete d.raw
    if (s.cn && !s.usOnly) d.cn = await foreign(s.us, 'CHN')
    if (s.euSpec) d.eu = (await eurostat(s.euSpec.es, s.euSpec.f)).eu
    const yrs = Object.keys(s.usOnly ? d.us : d.fr).sort()
    res[s.id] = d
    console.log('ok', s.id.padEnd(14), yrs[0], '→', yrs.at(-1), (s.usOnly ? d.us : d.fr)[yrs.at(-1)], d.eu ? 'EU ' + Object.keys(d.eu).length : '', d.us ? 'US ' + Object.keys(d.us).sort()[0] + '-' + Object.keys(d.us).sort().at(-1) : '', d.cn ? 'CN ' + Object.keys(d.cn).length : '')
  } catch (e) {
    console.log('ÉCHEC', s.id, e.message)
    // Dans GitHub Actions : avertissement visible dans le résumé de l'exécution (la donnée précédente est conservée).
    if (process.env.GITHUB_ACTIONS) console.log(`::warning title=Série non rafraîchie::${s.id} — ${e.message.slice(0, 150)}`)
  }
}
const file = new URL('../data-raw/etat.json', import.meta.url)
// Une source indisponible ne doit pas effacer les données déjà publiées : on part toujours de la version précédente.
const prev = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {}
fs.writeFileSync(file, JSON.stringify({ ...prev, ...res }))

// Version allégée pour le site : années ≥ 1960, 3 chiffres significatifs, population en millions.
const all = JSON.parse(fs.readFileSync(file))
const round = v => +(+v).toPrecision(4)
const slim = {}
for (const [k, d] of Object.entries(all)) {
  const div = k === 'pop' ? 1e6 : 1
  const pick = o => o && Object.fromEntries(Object.entries(o).filter(([y]) => +y >= 1960).sort().map(([y, v]) => [y, round(v / div)]))
  const maxY = Object.keys(d.fr).length ? +Object.keys(d.fr).sort().at(-1) + 1 : new Date().getFullYear() - 1
  const cut = o => o && Object.fromEntries(Object.entries(o).filter(([y]) => +y <= maxY))
  slim[k] = { fr: pick(d.fr), eu: pick(d.eu), ...(d.us ? { us: cut(pick(d.us)) } : {}), ...(d.cn && Object.keys(d.cn).length ? { cn: cut(pick(d.cn)) } : {}), ...(d.latest ? { latest: d.latest } : {}) }
}
fs.writeFileSync(new URL('../src/data/etat-series.json', import.meta.url), JSON.stringify(slim))
console.log('écrit src/data/etat-series.json', (JSON.stringify(slim).length / 1024).toFixed(0) + ' Ko')
