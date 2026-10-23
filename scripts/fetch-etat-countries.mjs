// « État de la France » : les mêmes indicateurs pour les 26 autres pays de l'UE, à comparer avec la France (menu déroulant).
// Mêmes sources que la France (scripts/etat-specs.json) : Eurostat ou Banque mondiale. Les séries Insee (chômage) sont
// remplacées par la série Eurostat équivalente ; les séries propres au site (dette, dépense, taux à 10 ans) par Eurostat.
// Usage : node scripts/fetch-etat-countries.mjs  →  public/data/etat/<PAYS>.json (un fichier par pays, chargé à la demande)
import fs from 'node:fs'

const ES = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
const C = { AT: 'AUT', BE: 'BEL', BG: 'BGR', HR: 'HRV', CY: 'CYP', CZ: 'CZE', DK: 'DNK', EE: 'EST', FI: 'FIN', DE: 'DEU', EL: 'GRC', HU: 'HUN', IE: 'IRL', IT: 'ITA', LV: 'LVA', LT: 'LTU', LU: 'LUX', MT: 'MLT', NL: 'NLD', PL: 'POL', PT: 'PRT', RO: 'ROU', SK: 'SVK', SI: 'SVN', ES: 'ESP', SE: 'SWE' }
const GEOS = Object.keys(C)

// Eurostat JSON-stat, plusieurs pays d'un coup ; sub = nombre de périodes infra-annuelles (moyenne des années complètes).
async function eurostat(ds, filters, geos = GEOS, sub = 0) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(filters)) q.append(k, v)
  for (const g of geos) q.append('geo', g)
  const r = await fetch(ES + ds + '?' + q)
  if (!r.ok) throw new Error(ds + ' ' + r.status + ' ' + (await r.text()).slice(0, 200))
  const j = await r.json()
  const ids = j.id, size = j.size
  for (let d = 0; d < ids.length; d++) if (!['geo', 'time'].includes(ids[d]) && size[d] !== 1) throw new Error(ds + ': dimension ' + ids[d] + ' a ' + size[d] + ' valeurs')
  const gPos = ids.indexOf('geo'), tPos = ids.indexOf('time')
  const stride = i => size.slice(i + 1).reduce((a, b) => a * b, 1)
  const geoIdx = j.dimension.geo.category.index, timeIdx = j.dimension.time.category.index
  const out = {}
  for (const g of geos) {
    if (geoIdx[g] == null) continue
    const by = {}
    for (const [t, ti] of Object.entries(timeIdx)) {
      const v = j.value[geoIdx[g] * stride(gPos) + ti * stride(tPos)]
      if (v != null) (by[t.slice(0, 4)] ||= []).push(v)
    }
    out[g] = {}
    for (const [y, v] of Object.entries(by)) {
      if (sub && v.length !== sub) continue
      out[g][y] = sub ? +(v.reduce((a, b) => a + b) / v.length).toFixed(4) : v.at(-1)
    }
  }
  return out
}

async function worldbank(code) {
  const r = await fetch(`https://api.worldbank.org/v2/country/${Object.values(C).join(';')}/indicator/${code}?format=json&per_page=20000`)
  const j = await r.json()
  if (!Array.isArray(j) || !j[1]) throw new Error(code + ' ' + JSON.stringify(j).slice(0, 200))
  const iso2 = Object.fromEntries(Object.entries(C).map(([a, b]) => [b, a]))
  const out = {}
  for (const o of j[1]) if (o.value != null && iso2[o.countryiso3code]) (out[iso2[o.countryiso3code]] ||= {})[o.date] = o.value
  return out
}

// Séries propres au site pour la France (src/data/etat.js, LOCAL) : équivalent Eurostat pour les autres pays.
const LOCAL = {
  debt: { es: 'gov_10dd_edpt1', f: { unit: 'PC_GDP', sector: 'S13', na_item: 'GD' } },
  spend: { es: 'gov_10a_main', f: { unit: 'PC_GDP', sector: 'S13', na_item: 'TE' } },
  oat: { es: 'irt_lt_mcby_a', f: { int_rt: 'MCBY' } },
}

async function spec(s) {
  if (s.insee) return s.euSpec ? eurostat(s.euSpec.es, s.euSpec.f) : null
  if (s.wb) return worldbank(s.wb)
  if (!s.es) return null
  if (s.minus) {
    const d = await eurostat(s.es, s.f, [...GEOS], s.sub)
    const o = d[s.minus] || {}
    delete d[s.minus] // écart d'un pays avec lui-même : sans objet
    for (const g of Object.keys(d)) d[g] = Object.fromEntries(Object.entries(d[g]).filter(([y]) => o[y] != null).map(([y, v]) => [y, +(v - o[y]).toFixed(3)]))
    return d
  }
  const d = await eurostat(s.es, s.f, GEOS, s.sub)
  if (s.div) {
    const q = await eurostat(s.div.es || s.es, s.div.f, GEOS, s.sub)
    for (const g of Object.keys(d)) d[g] = Object.fromEntries(Object.entries(d[g]).filter(([y]) => q[g]?.[y]).map(([y, v]) => [y, +(v / q[g][y] * (s.scale || 1)).toFixed(4)]))
  }
  return d
}

const SPECS = JSON.parse(fs.readFileSync(new URL('./etat-specs.json', import.meta.url))).filter(s => !s.usOnly)
const dir = new URL('../public/data/etat/', import.meta.url)
fs.mkdirSync(dir, { recursive: true })
// EL (code Eurostat de la Grèce) est publié sous GR, le code ISO.
const fileOf = g => new URL((g === 'EL' ? 'GR' : g) + '.json', dir)
const prev = Object.fromEntries(GEOS.map(g => { const f = fileOf(g); return [g, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f)) : {}] }))
const res = Object.fromEntries(GEOS.map(g => [g, {}]))
const jobs = [...SPECS.map(s => [s.id, () => spec(s)]), ...Object.entries(LOCAL).map(([id, s]) => [id, () => eurostat(s.es, s.f)])]
for (const [id, job] of jobs) {
  try {
    const d = await job()
    if (!d) continue
    let n = 0
    for (const g of GEOS) if (d[g] && Object.keys(d[g]).length) { res[g][id] = d[g]; n++ }
    console.log('ok', id.padEnd(14), n, 'pays')
  } catch (e) {
    console.log('ÉCHEC', id, e.message)
    if (process.env.GITHUB_ACTIONS) console.log(`::warning title=Série pays non rafraîchie::${id} : ${e.message.slice(0, 150)}`)
  }
}
// Version allégée : années ≥ 1960, 4 chiffres significatifs, population en millions ; une série en échec garde sa version précédente.
const round = v => +(+v).toPrecision(4)
let total = 0
for (const g of GEOS) {
  const all = { ...prev[g], ...Object.fromEntries(Object.entries(res[g]).map(([k, o]) => [k, Object.fromEntries(Object.entries(o).filter(([y]) => +y >= 1960).sort().map(([y, v]) => [y, round(k === 'pop' ? v / 1e6 : v)]))])) }
  const s = JSON.stringify(all)
  total += s.length
  fs.writeFileSync(fileOf(g), s)
}
console.log('écrit public/data/etat/*.json', GEOS.length, 'pays,', (total / 1024).toFixed(0) + ' Ko au total')
