// Données de la page « Immigration : d'où viennent les immigrés » (src/data/immig.json) et fond de carte (src/data/immig-map.json).
//   Stock : Insee, immigrés par pays de naissance (recensements 1968-1999, 2006-2019, puis dernière année publiée),
//           extrait des tableaux Insee par scripts/immig-insee.py -> data-raw/immig/insee-stock.csv
//   Arrivées : Eurostat migr_resfirst, premiers titres de séjour délivrés par la France, par nationalité et par motif.
// Usage : node scripts/build-immig.mjs          (télécharge Eurostat, puis écrit les fichiers)
//         node scripts/build-immig.mjs --local  (réutilise data-raw/immig/es_*.json déjà téléchargés)
import fs from 'node:fs'
import { geoEqualEarth, geoPath, geoCentroid, geoArea } from 'd3-geo'
import { feature, mesh } from 'topojson-client'
import countries from 'i18n-iso-countries'
import fr from 'i18n-iso-countries/langs/fr.json' with { type: 'json' }
import en from 'i18n-iso-countries/langs/en.json' with { type: 'json' }
countries.registerLocale(fr); countries.registerLocale(en)

const RAW = 'data-raw/immig'
const LOCAL = process.argv.includes('--local')
const ES = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data'

// ---------- Eurostat : premiers titres de séjour ----------
async function eurostat(file, query) {
  if (!LOCAL) {
    const r = await fetch(`${ES}/migr_resfirst?${query}&format=JSON`)
    if (!r.ok) throw new Error(`Eurostat ${r.status} ${query}`)
    fs.writeFileSync(`${RAW}/${file}`, await r.text())
  }
  const d = JSON.parse(fs.readFileSync(`${RAW}/${file}`, 'utf8'))
  if (!d.value) throw new Error(`Eurostat ${file} : réponse sans valeurs`)
  return d
}
// JSON-stat -> { code de la dimension libre : { année : valeur } }
function byDim(d, dim) {
  const pos = name => Object.fromEntries(Object.entries(d.dimension[name].category.index).map(([k, i]) => [i, k]))
  const P = Object.fromEntries(d.id.map(n => [n, pos(n)]))
  const out = {}
  for (const [k, v] of Object.entries(d.value)) {
    let rest = +k; const at = {}
    for (let j = d.id.length - 1; j >= 0; j--) { at[d.id[j]] = rest % d.size[j]; rest = Math.floor(rest / d.size[j]) }
    const c = P[dim][at[dim]], t = P.time[at.time]
    ;(out[c] ||= {})[+t] = v
  }
  return out
}

const byCit = byDim(await eurostat('es_resfirst.json', 'geo=FR&reason=TOTAL&duration=TOTAL&unit=PER'), 'citizen')
const byReason = byDim(await eurostat('es_resfirst_reason.json', 'geo=FR&citizen=TOTAL&duration=TOTAL&unit=PER'), 'reason')
if (!byCit.TOTAL || !byReason.FAM) throw new Error('Eurostat : séries incomplètes')

// ---------- Insee : stock d'immigrés par pays de naissance ----------
const norm = s => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'").toLowerCase().replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim()
const FR_IDX = {}
for (const [a2, n] of Object.entries(countries.getNames('fr', { select: 'all' }))) for (const x of [].concat(n)) FR_IDX[norm(x)] = a2
// Libellés Insee absents de la table ISO, ou ensembles historiques (une seule bulle).
const OVERRIDE = {
  'Centrafrique': 'CF', 'Congo': 'CG', 'Ile Maurice': 'MU', 'Chine (y compris Taïwan)': 'CN', 'Etats-Unis': 'US', 'États-Unis': 'US',
  'Cabo Verde': 'CV', "Royaume-Uni de Grande-Bretagne et d'Irlande du Nord": 'GB', 'Fédération de Russie': 'RU', 'République de Moldova': 'MD',
  'Ex-République yougoslave de Macédoine': 'MK', 'Bélarus': 'BY', 'Viet Nam': 'VN', 'Viêt Nam': 'VN', 'République arabe syrienne': 'SY',
  'République démocratique populaire lao': 'LA', "Iran (République islamique d')": 'IR', 'République de Corée': 'KR', 'Iraq': 'IQ',
  'Chine, région administrative spéciale de Hong Kong': 'HK', 'État de Palestine': 'PS', 'République populaire démocratique de Corée': 'KP',
  'Venezuela (République bolivarienne du)': 'VE', 'Bolivie (État plurinational de)': 'BO', 'Congo (République démocratique)': 'CD',
  'Tchécoslovaquie, République Tchèque, Slovaquie': 'CSK', 'URSS et pays de l’ex-URSS': 'SUN',
  'Yougoslavie, Bosnie, Croatie, Macédoine, Slovénie, Serbie, Monténégro': 'YUG',
}
const GROUPS = {
  CSK: { fr: 'Tchécoslovaquie', en: 'Czechoslovakia', lonlat: [16.6, 49.4] },
  SUN: { fr: 'URSS', en: 'USSR', lonlat: [37.6, 55.8] },
  YUG: { fr: 'Yougoslavie', en: 'Yugoslavia', lonlat: [19.6, 44.3] },
}
const codeOf = name => OVERRIDE[name] || FR_IDX[norm(name)] || (/^Autres/.test(name) ? null : undefined)

const lines = fs.readFileSync(`${RAW}/insee-stock.csv`, 'utf8').trim().split('\n').slice(1).map(l => l.split(';'))
const stock = {}, continents = {}, total = {}, pop = {}, contOf = {}, missing = new Set()
for (const [lieu, cont, y, v] of lines) {
  const year = +y, n = +v
  if (lieu === 'TOTAL') { total[year] = n; continue }
  if (lieu === 'POP') { pop[year] = n; continue }
  if (lieu.startsWith('C:')) { (continents[cont] ||= {})[year] = n; continue }
  const c = codeOf(lieu)
  if (c === null) continue // « Autres pays de ... » : pas de bulle
  if (!c) { missing.add(lieu); continue }
  ;(stock[c] ||= {})[year] = ((stock[c] || {})[year] || 0) + n
  if (year >= 2006 || !contOf[c]) contOf[c] = cont // continent selon le classement Insee récent
}
if (missing.size) throw new Error('Pays Insee sans code ISO : ' + [...missing].join(', '))
const stockYears = [...new Set(Object.values(stock).flatMap(o => Object.keys(o).map(Number)))].sort((a, b) => a - b)
for (const y of stockYears) {
  const s = Object.values(continents).reduce((a, o) => a + (o[y] || 0), 0)
  if (total[y] && Math.abs(s - total[y]) / total[y] > 0.01) console.warn(`attention : continents ${y} = ${s}, total ${total[y]}`)
}

// ---------- Fond de carte et position des bulles ----------
const w110 = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-110m.json', 'utf8'))
const w50 = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json', 'utf8'))
const land = feature(w110, w110.objects.countries)
land.features = land.features.filter(f => f.id !== '010') // sans l'Antarctique
const W = 1000
const proj = geoEqualEarth().fitWidth(W, land)
const path = geoPath(proj).digits(1)
const b = path.bounds(land), H = Math.ceil(b[1][1])
const borders = mesh(w110, { type: 'GeometryCollection', geometries: w110.objects.countries.geometries.filter(g => g.id !== '010') }, (a, c) => a !== c)
// Vue rapprochée Europe, Afrique du Nord et Moyen-Orient : cadre projeté de 20° O à 60° E, de 2° N à 62° N.
const box = []
for (let lon = -20; lon <= 60; lon += 5) for (const lat of [2, 62]) box.push(proj([lon, lat]))
for (let lat = 2; lat <= 62; lat += 5) for (const lon of [-20, 60]) box.push(proj([lon, lat]))
const bx0 = Math.min(...box.map(p => p[0])), bx1 = Math.max(...box.map(p => p[0])), by0 = Math.min(...box.map(p => p[1])), by1 = Math.max(...box.map(p => p[1]))
const views = { world: [0, 0, W, H], eur: [bx0, by0, bx1 - bx0, by1 - by0].map(v => Math.round(v)) }
fs.writeFileSync('src/data/immig-map.json', JSON.stringify({ views, land: path(land), borders: path(borders) }))

// Point d'ancrage : centre du plus grand morceau de territoire (carte 1:50 m, qui contient les petites îles).
const LONLAT = { TV: [179.2, -8.5], RU: [45, 56], US: [-98, 39], CA: [-100, 56], NO: [9, 61], FR: [2.5, 46.5], CL: [-71, -33], HK: [114.2, 22.3], MC: [7.42, 43.74], SM: [12.45, 43.94], AD: [1.52, 42.5], JE: [-2.13, 49.21], MT: [14.4, 35.9], BH: [50.55, 26.07], SG: [103.8, 1.35], XK: [20.9, 42.6] }
const anchor = {}
for (const f of feature(w50, w50.objects.countries).features) {
  const a2 = countries.numericToAlpha2(f.id)
  if (!a2) continue
  let g = f.geometry
  if (g.type === 'MultiPolygon') {
    const parts = g.coordinates.map(c => ({ type: 'Polygon', coordinates: c }))
    g = parts.reduce((m, p) => geoArea(p) > geoArea(m) ? p : m)
  }
  anchor[a2] = geoCentroid(g)
}
// Codes Eurostat -> ISO
const ES2ISO = { UK: 'GB', EL: 'GR' }
const permits = {}
for (const [c, o] of Object.entries(byCit)) {
  const iso = ES2ISO[c] || c
  if (iso.length !== 2 || !countries.isValid(iso)) continue // agrégats (TOTAL, NEU27_2020_FOR...) et apatrides
  permits[iso] = o
}
// Continent des nationalités sans immigrés recensés (rares) : déduit de la position.
const contFromLonLat = ([lon, lat]) => lon < -25 || lon > 150 || (lon > 130 && lat < 20) ? 'AMO' : lat > 36 && lon < 45 ? 'EUR' : lon < 52 && lat < 37 && !(lon > 34 && lat > 12) ? 'AFR' : 'ASI'

const places = {}
const xy = lonlat => proj(lonlat).map(v => Math.round(v * 10) / 10)
for (const c of new Set([...Object.keys(stock), ...Object.keys(permits)])) {
  if (GROUPS[c]) { places[c] = { fr: GROUPS[c].fr, en: GROUPS[c].en, c: 'EUR', xy: xy(GROUPS[c].lonlat), group: true }; continue }
  const ll = LONLAT[c] || anchor[c]
  if (!ll) { console.warn('sans position :', c); continue }
  places[c] = { fr: countries.getName(c, 'fr', { select: 'alias' }), en: countries.getName(c, 'en', { select: 'alias' }), c: contOf[c] || contFromLonLat(ll), xy: xy(ll) }
}
// Noms courts plus usuels
const SHORT = {
  GB: ['Royaume-Uni', 'United Kingdom'], US: ['États-Unis', 'United States'], CD: ['RD Congo', 'DR Congo'], CG: ['Congo', 'Congo'],
  SY: ['Syrie', 'Syria'], MD: ['Moldavie', 'Moldova'], LA: ['Laos', 'Laos'], CI: ['Côte d’Ivoire', 'Côte d’Ivoire'], KR: ['Corée du Sud', 'South Korea'],
  TZ: ['Tanzanie', 'Tanzania'], BN: ['Brunei', 'Brunei'], FM: ['Micronésie', 'Micronesia'], VA: ['Vatican', 'Vatican'], CZ: ['Tchéquie', 'Czechia'],
  CV: ['Cap-Vert', 'Cape Verde'], RU: ['Russie', 'Russia'], HK: ['Hong Kong', 'Hong Kong'], XK: ['Kosovo', 'Kosovo'],
}
for (const [c, [f, e]] of Object.entries(SHORT)) if (places[c]) Object.assign(places[c], { fr: f, en: e })
for (const p of Object.values(places)) { p.fr = p.fr.replace(/'/g, '’'); p.en = p.en.replace(/'/g, '’') }

const out = {
  stock: { years: stockYears, by: stock, continents, total, pop },
  permits: { years: Object.keys(byCit.TOTAL).map(Number).sort((a, b) => a - b), by: permits, total: byCit.TOTAL, reasons: { FAM: byReason.FAM, EDUC: byReason.EDUC, EMP: byReason.EMP, OTH: byReason.OTH } },
  places,
}
fs.writeFileSync('src/data/immig.json', JSON.stringify(out))
const last = out.permits.years.at(-1)
console.log(`immig.json : ${Object.keys(stock).length} pays (stock ${stockYears[0]}-${stockYears.at(-1)}), ${Object.keys(permits).length} nationalités (titres ${out.permits.years[0]}-${last}, ${byCit.TOTAL[last]} en ${last})`)
