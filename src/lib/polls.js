// Sondages présidentielle 2027 : lecture de la liste Wikipédia (fr) et agrégation.
// Le même code tourne dans le navigateur (DOMParser natif) et au build (linkedom, scripts/fetch-polls.mjs).

export const WIKI_TITLE = "Liste de sondages sur l'élection présidentielle française de 2027"
export const WIKI_PAGE = `https://fr.wikipedia.org/wiki/${encodeURIComponent(WIKI_TITLE.replaceAll(' ', '_'))}`
const API = 'https://fr.wikipedia.org/w/api.php'
export const parseUrl = () => `${API}?action=parse&page=${encodeURIComponent(WIKI_TITLE)}&prop=text|revid&format=json&formatversion=2&origin=*&redirects=1`
export const revUrl = () => `${API}?action=query&prop=revisions&titles=${encodeURIComponent(WIKI_TITLE)}&rvprop=timestamp|ids&format=json&formatversion=2&origin=*&redirects=1`

// Candidats déclarés suivis : sert à choisir, pour chaque sondage, l'hypothèse correspondant au plateau actuel.
export const DECLARED = ['Le Pen', 'Mélenchon', 'Philippe', 'Glucksmann', 'Attal', 'Retailleau', 'Zemmour', 'Tondelier', 'Roussel', 'Arthaud', 'Dupont-Aignan', 'Lisnard']

const MONTHS = { janv: 1, janvier: 1, fevr: 2, fev: 2, fevrier: 2, mars: 3, avr: 4, avril: 4, mai: 5, juin: 6, juil: 7, juillet: 7, aout: 8, sept: 9, septembre: 9, oct: 10, octobre: 10, nov: 11, novembre: 11, dec: 12, decembre: 12 }
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const clean = s => (s || '').replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim()
const month = w => MONTHS[norm(w).replace(/\.$/, '')]

// "25-29 septembre", "30 sept.-2 oct.", "1er-3 juillet" -> dernier jour du terrain.
function endDate(text, year, headingMonth) {
  const m = [...norm(clean(text)).matchAll(/(\d{1,2})(?:er)?\s*([a-z]+\.?)/g)].filter(x => month(x[2]))
  if (!m.length) return null
  const last = m.at(-1)
  const mo = month(last[2])
  const explicit = clean(text).match(/20\d\d/g)
  if (explicit) return `${explicit.at(-1)}-${String(mo).padStart(2, '0')}-${String(+last[1]).padStart(2, '0')}`
  // Un titre « Décembre 2025-janvier 2026 » : un sondage de décembre appartient à l'année précédente.
  const y = headingMonth && mo > headingMonth + 1 ? year - 1 : year
  return `${y}-${String(mo).padStart(2, '0')}-${String(+last[1]).padStart(2, '0')}`
}

// En-tête "Glucksmann[c](PP)[c]" -> { name, party } ; "CandidatRN" -> { name: null, party: 'RN' }.
function headerCand(text) {
  const t = clean(text)
  const m = t.match(/^(.+?)\s*\(([^)]+)\)$/)
  if (m && !/^candidat/i.test(m[1])) return { name: m[1].trim(), party: m[2].trim() }
  const c = t.match(/^Candidat\s*(.+)$/i)
  return c ? { name: null, party: c[1].trim() } : null
}

// Cellule "14,5 Glucksmann", "36Bardella", "4Faure (PS)", "—" -> { v, name?, party? }.
function cellValue(text) {
  const t = clean(text)
  const m = t.match(/^<?\s*(\d+(?:[.,]\d+)?)\s*%?\s*(.*)$/)
  if (!m) return null
  const v = parseFloat(m[1].replace(',', '.'))
  const rest = m[2].trim()
  if (!rest) return { v }
  const p = rest.match(/^(.+?)\s*\(([^)]+)\)$/)
  return p ? { v, name: p[1].trim(), party: p[2].trim() } : { v, name: rest }
}

// Table HTML -> grille (rowspan/colspan dépliés), chaque case gardant sa cellule d'origine.
function grid(table) {
  const g = []
  ;[...table.querySelectorAll('tr')].forEach((tr, r) => {
    g[r] = g[r] || []
    let c = 0
    for (const cell of tr.children) {
      while (g[r][c]) c++
      const rs = +cell.getAttribute('rowspan') || 1, cs = +cell.getAttribute('colspan') || 1
      for (let i = 0; i < rs; i++) for (let j = 0; j < cs; j++) (g[r + i] = g[r + i] || [])[c + j] = { cell, r0: r }
      c += cs
    }
  })
  return g
}

export function parsePolls(doc) {
  const first = [], second = []
  let round = 0, year = null, headingMonth = null, hypothesis = null
  for (const el of doc.querySelectorAll('h2, h3, h4, table.wikitable')) {
    if (el.tagName !== 'TABLE') {
      const t = clean(el.textContent).replace(/modifier.*$/i, '')
      if (el.tagName === 'H2') round = /premier tour/i.test(t) ? 1 : /second tour/i.test(t) ? 2 : 0
      const ys = t.match(/20\d\d/g)
      if (ys) { year = +ys.at(-1); const ms = [...norm(t).matchAll(/([a-z]+)\s+20\d\d/g)].map(x => month(x[1])).filter(Boolean); headingMonth = ms.at(-1) || null }
      if (el.tagName === 'H4' && round === 2) hypothesis = t.replace(/^Hypothèse\s*/i, '')
      continue
    }
    if (!round || !year) continue
    const g = grid(el)
    const h = g.findIndex(row => [...new Set(row.map(x => x?.cell))].filter(c => c && headerCand(c.textContent)).length >= 2)
    if (h < 0) continue
    const cols = g[h].map(x => headerCand(x.cell.textContent))
    const groups = new Map()
    for (let r = h + 1; r < g.length; r++) {
      const row = g[r]
      if (!row || !row[0] || !row[3] || row[0].cell === row[3].cell) continue // ligne d'événement
      const pollster = clean(row[0].cell.textContent), date = endDate(row[1]?.cell.textContent, year, headingMonth)
      if (!pollster || !date || /sondeur/i.test(pollster)) continue
      const results = []
      const seen = new Set()
      row.forEach((x, k) => {
        if (k < 3 || !cols[k] || !x || seen.has(x.cell)) return
        seen.add(x.cell)
        const val = cellValue(x.cell.textContent)
        if (!val) return
        const name = val.name || cols[k].name
        if (name) results.push({ name, party: val.party || cols[k].party, v: val.v })
      })
      if (results.length < (round === 1 ? 4 : 2)) continue
      const key = row[0].r0 + '|' + pollster + '|' + date
      if (!groups.has(key)) groups.set(key, { pollster, date, sample: +clean(row[2]?.cell.textContent).replace(/\D/g, '') || null, rows: [] })
      groups.get(key).rows.push(results)
    }
    for (const gr of groups.values()) {
      if (round === 1) {
        // Hypothèse principale : celle qui contient le plus de candidats déclarés (la première en cas d'égalité).
        const score = rs => rs.filter(x => DECLARED.includes(x.name)).length
        const best = gr.rows.reduce((a, b) => score(b) > score(a) ? b : a)
        first.push({ pollster: gr.pollster, date: gr.date, sample: gr.sample, results: best })
      } else {
        for (const rs of gr.rows) if (rs.length === 2) second.push({ pollster: gr.pollster, date: gr.date, sample: gr.sample, hypothesis, results: rs })
      }
    }
  }
  const byDate = (a, b) => b.date.localeCompare(a.date)
  return { first: first.sort(byDate), second: second.sort(byDate) }
}

export async function fetchLivePolls(parseHTML = html => new DOMParser().parseFromString(html, 'text/html')) {
  const [p, q] = await Promise.all([fetch(parseUrl()).then(r => r.json()), fetch(revUrl()).then(r => r.json())])
  if (p.error) throw new Error(p.error.info)
  const data = parsePolls(parseHTML(p.parse.text))
  if (data.first.length < 10) throw new Error('Tableaux de sondages introuvables')
  const rev = q.query?.pages?.[0]?.revisions?.[0]
  return { ...data, revid: p.parse.revid, timestamp: rev?.timestamp || null, fetchedAt: new Date().toISOString() }
}

// ---------- Agrégation ----------
const day = d => new Date(d + 'T00:00:00Z').getTime()
const DAY = 864e5

// Moyenne du dernier sondage de chaque institut sur une fenêtre glissante.
export function average(polls, asOf, windowDays = 45) {
  const end = day(asOf), start = end - windowDays * DAY
  const latest = new Map()
  for (const p of polls) {
    const t = day(p.date)
    if (t > end || t < start) continue
    if (!latest.has(p.pollster) || p.date > latest.get(p.pollster).date) latest.set(p.pollster, p)
  }
  const acc = {}
  for (const p of latest.values()) for (const r of p.results) {
    (acc[r.name] = acc[r.name] || { name: r.name, party: r.party, sum: 0, n: 0 })
    acc[r.name].sum += r.v; acc[r.name].n++
  }
  return { n: latest.size, pollsters: [...latest.keys()], rows: Object.values(acc).map(a => ({ name: a.name, party: a.party, v: a.sum / a.n, n: a.n })).sort((a, b) => b.v - a.v) }
}

// Courbes de tendance : une moyenne glissante tous les `stepDays` jours.
export function trend(polls, names, { from, to, stepDays = 7, windowDays = 45 } = {}) {
  const end = day(to), out = Object.fromEntries(names.map(n => [n, []]))
  for (let t = day(from); t <= end; t += stepDays * DAY) {
    const asOf = new Date(t).toISOString().slice(0, 10)
    const a = average(polls, asOf, windowDays)
    for (const n of names) {
      const r = a.rows.find(x => x.name === n)
      out[n].push([t, r && r.n >= 2 ? +r.v.toFixed(1) : null])
    }
  }
  return out
}

// ---------- Période de réserve (loi du 19 juillet 1977, art. 11) ----------
// La veille et le jour de chaque tour, aucun sondage ne peut être publié, diffusé ni commenté.
// Du samedi 0 h au dimanche 20 h, heure de Paris. Dates à confirmer par le décret de convocation des électeurs.
export const BLACKOUTS = [
  { from: '2027-04-16T22:00:00Z', to: '2027-04-18T18:00:00Z', label: 'premier tour', end: 'dimanche 18 avril à 20 h', labelEn: 'first round', endEn: 'Sunday 18 April at 8 pm' },
  { from: '2027-04-30T22:00:00Z', to: '2027-05-02T18:00:00Z', label: 'second tour', end: 'dimanche 2 mai à 20 h', labelEn: 'second round', endEn: 'Sunday 2 May at 8 pm' },
]
export const pollBlackout = (now = new Date()) => BLACKOUTS.find(b => now >= new Date(b.from) && now < new Date(b.to)) || null

// Marge d'erreur à 95 %, par référence à la méthode aléatoire, pour un score de 50 % (cas le plus défavorable).
export const marginOfError = n => n ? 1.96 * Math.sqrt(0.25 / n) * 100 : null
export const COMMISSION_URL = 'https://www.commission-des-sondages.fr/notices/'
