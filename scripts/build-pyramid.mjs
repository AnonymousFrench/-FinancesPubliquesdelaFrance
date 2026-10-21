// Pyramide des âges de la France (src/data/pyramid.json) : population au 1er janvier par âge et sexe.
//   Observé : Eurostat demo_pjan, France métropolitaine (FX) de 1960 à 1990 puis France entière (FR).
//   Projection : Eurostat proj_23np (EUROPOP2023, scénario central).
// Usage : node scripts/build-pyramid.mjs          (télécharge Eurostat, puis écrit le fichier)
//         node scripts/build-pyramid.mjs --local  (réutilise data-raw/immig/es_pjan*.json et es_proj.json)
import fs from 'node:fs'

const RAW = 'data-raw/immig'
const LOCAL = process.argv.includes('--local')
const ES = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data'

async function eurostat(file, dataset, query) {
  if (!LOCAL) {
    const r = await fetch(`${ES}/${dataset}?${query}&format=JSON`)
    if (!r.ok) throw new Error(`Eurostat ${dataset} ${r.status}`)
    fs.writeFileSync(`${RAW}/${file}`, await r.text())
  }
  const d = JSON.parse(fs.readFileSync(`${RAW}/${file}`, 'utf8'))
  if (!d.value) throw new Error(`Eurostat ${file} : réponse sans valeurs`)
  return d
}
// JSON-stat -> { année : { M: [âge 0..100], F: [...] } } ; âge 100 = 100 ans et plus.
function pyramid(d) {
  const pos = name => Object.fromEntries(Object.entries(d.dimension[name].category.index).map(([k, i]) => [i, k]))
  const P = Object.fromEntries(d.id.map(n => [n, pos(n)]))
  const out = {}
  for (const [k, v] of Object.entries(d.value)) {
    let rest = +k; const at = {}
    for (let j = d.id.length - 1; j >= 0; j--) { at[d.id[j]] = rest % d.size[j]; rest = Math.floor(rest / d.size[j]) }
    const sex = P.sex[at.sex], age = P.age[at.age], y = +P.time[at.time]
    if (sex !== 'M' && sex !== 'F') continue
    const a = age === 'Y_LT1' ? 0 : age === 'Y_OPEN' || age === 'Y_GE100' ? 100 : /^Y\d+$/.test(age) ? +age.slice(1) : null
    if (a == null || a > 100) continue
    const o = (out[y] ||= { M: Array(101).fill(null), F: Array(101).fill(null) })
    o[sex][a] = Math.round(v)
  }
  // Années complètes seulement : tous les âges de 0 à 95 ans renseignés (au-delà, une classe vide compte pour zéro).
  for (const y of Object.keys(out)) {
    if (['M', 'F'].some(s => out[y][s].slice(0, 96).some(v => v == null))) { delete out[y]; continue }
    for (const s of ['M', 'F']) out[y][s] = out[y][s].map(v => v ?? 0)
  }
  return out
}

const fr = pyramid(await eurostat('es_pjan.json', 'demo_pjan', 'geo=FR&unit=NR&sex=M&sex=F'))
const fx = pyramid(await eurostat('es_pjan_fx.json', 'demo_pjan', 'geo=FX&unit=NR&sex=M&sex=F'))
const FR0 = Math.min(...Object.keys(fr).map(Number))
const obs = { ...Object.fromEntries(Object.entries(fx).filter(([y]) => +y < FR0)), ...fr }
const proj = pyramid(await eurostat('es_proj.json', 'proj_23np', 'geo=FR&unit=PER&projection=BSL&sex=M&sex=F'))
const oy = Object.keys(obs).map(Number).sort((a, b) => a - b)
if (oy.length < 20) throw new Error('demo_pjan : trop peu d’années complètes')
const last = oy.at(-1)
// Projection : une année sur cinq après la dernière année observée, jusqu'en 2070.
const py = Object.keys(proj).map(Number).filter(y => y > last && y <= 2070 && (y % 5 === 0 || y === 2070)).sort((a, b) => a - b)
const years = [...oy, ...py]
const data = Object.fromEntries(years.map(y => [y, y > last ? proj[y] : obs[y]]))
fs.writeFileSync('src/data/pyramid.json', JSON.stringify({ years, lastObs: last, firstFR: FR0, data }))
const tot = y => data[y].M.reduce((s, v) => s + v, 0) + data[y].F.reduce((s, v) => s + v, 0)
console.log(`pyramid.json : observé ${oy[0]}-${last} (${oy.length} ans), projection ${py[0]}-${py.at(-1)} ; population ${oy[0]} ${tot(oy[0])}, ${last} ${tot(last)}, ${py.at(-1)} ${tot(py.at(-1))}`)
