import React, { useMemo, useState } from 'react'
import P from '../data/pyramid.json'
import { Card, Seg } from './ui.jsx'
import { useWidth } from '../lib/charts.jsx'
import { bracket, lerp, useTimeline, Timeline } from '../lib/timeline.jsx'
import { fmt, pct } from '../lib/format.js'
import { T, isEn } from '../i18n.js'

// Pyramide des âges : population au 1er janvier par âge (0 à 100 ans et plus) et sexe, de 1960 aux projections 2070.
const MEN = '#2f5fd0', WOMEN = '#e08a2c', MEN_R = '#152f78', WOMEN_R = '#9c4f0e', RET = '#14181f'
const YEARS = P.years, LAST = P.lastObs, AGES = 101, DRAWN = 100 // 0 à 99 ans dessinés ; 100 ans et plus compté dans les totaux
const MAX = Math.max(...YEARS.flatMap(y => [...P.data[y].M, ...P.data[y].F].slice(0, 100)))
const SRC = [
  { label: 'Eurostat, population au 1er janvier par âge et sexe (demo_pjan)', url: 'https://ec.europa.eu/eurostat/databrowser/view/demo_pjan/default/table' },
  { label: 'Eurostat, projections de population EUROPOP2023 (proj_23np)', url: 'https://ec.europa.eu/eurostat/databrowser/view/proj_23np/default/table' },
]
const num = v => fmt(Math.round(v / 100) * 100, 0)

// Âge légal minimal de départ à la retraite atteint dans l'année (régime général) :
// 65 ans jusqu'en 1982, 60 ans à partir de 1983, relevé à 62 ans entre 2011 et 2017 (réforme de 2010),
// puis réforme de 2023 : 62 ans 9 mois pour la génération 1964, gel jusqu'en 2028 (LFSS 2026), 64 ans à partir de la génération 1969.
const LEGAL = [[1960, 65], [1982.99, 65], [1983, 60], [2011, 60], [2017, 62], [2023.6, 62], [2023.7, 62.25], [2024.6, 62.5], [2025.8, 62.75], [2028, 62.75], [2033, 64], [2070, 64]]
const legalAge = t => lerp(LEGAL.map(x => x[0]), LEGAL.map(x => x[1]), t)
const ageTxt = a => {
  let y = Math.floor(a + 1e-6), m = Math.round((a - y) * 12)
  if (m === 12) { y += 1; m = 0 }
  return m === 0 ? T(`${y} ans`, `${y}`) : T(`${y} ans ${m} mois`, `${y} years ${m} months`)
}
// Part de la population ayant atteint l'âge légal (l'année d'âge du seuil est comptée au prorata).
function retired(p, A) {
  const tot = p.M.map((v, k) => v + p.F[k]), N = tot.reduce((s, v) => s + v, 0)
  const k0 = Math.floor(A), f = A - k0
  let r = tot[k0] * (1 - f), w = tot[k0] * f
  for (let k = k0 + 1; k < AGES; k++) r += tot[k]
  for (let k = 20; k < k0; k++) w += tot[k]
  return { share: r / N * 100, ratio: w / r }
}
const RET_SERIES = YEARS.map(y => [y, retired(P.data[y], legalAge(y)).share])

// Pyramide à l'instant t (interpolée entre deux années publiées).
function at(t) {
  const [i, j, f] = bracket(YEARS, t), a = P.data[YEARS[i]], b = P.data[YEARS[j]]
  const mix = s => a[s].map((v, k) => v * (1 - f) + b[s][k] * f)
  return { M: mix('M'), F: mix('F') }
}
function stats(p) {
  const tot = p.M.map((v, k) => v + p.F[k]), N = tot.reduce((s, v) => s + v, 0)
  const sum = (lo, hi) => tot.slice(lo, hi + 1).reduce((s, v) => s + v, 0)
  let acc = 0, med = 0
  for (let k = 0; k < AGES; k++) { if (acc + tot[k] >= N / 2) { med = k + (N / 2 - acc) / tot[k]; break } acc += tot[k] }
  return { N, young: sum(0, 19) / N * 100, old: sum(65, 100) / N * 100, med }
}

// Évolution de la part au-delà de l'âge légal, avec le point de l'année affichée ; projection en pointillés.
function RetSpark({ t }) {
  const w = 180, h = 46, pad = 4, x0 = YEARS[0], x1 = YEARS.at(-1)
  const vs = RET_SERIES.map(d => d[1]), lo = Math.floor(Math.min(...vs) / 5) * 5, hi = Math.ceil(Math.max(...vs) / 5) * 5
  const X = x => pad + (x - x0) / (x1 - x0) * (w - 2 * pad), Yv = v => h - pad - (v - lo) / (hi - lo) * (h - 2 * pad)
  const d = pts => 'M' + pts.map(([x, v]) => `${X(x).toFixed(1)},${Yv(v).toFixed(1)}`).join('L')
  const obs = RET_SERIES.filter(([y]) => y <= LAST), prj = RET_SERIES.filter(([y]) => y >= LAST)
  const v = lerp(YEARS, vs, t)
  return (
    <svg width={w} height={h + 12} className="py-spark" aria-hidden="true">
      <path d={d(obs)} fill="none" stroke={RET} strokeWidth="1.8" />
      <path d={d(prj)} fill="none" stroke={RET} strokeWidth="1.8" strokeDasharray="3 3" opacity="0.6" />
      <line x1={X(t)} x2={X(t)} y1={pad} y2={h - pad} stroke="var(--line)" />
      <circle cx={X(t)} cy={Yv(v)} r="4" fill="#fff" stroke={RET} strokeWidth="2" />
      <text x={X(x0)} y={h + 10} className="ax">{x0}</text>
      <text x={X(LAST)} y={h + 10} textAnchor="middle" className="ax">{LAST}</text>
      <text x={X(x1)} y={h + 10} textAnchor="end" className="ax">{x1}</text>
    </svg>
  )
}

export default function Pyramid() {
  const [ref, W] = useWidth(900)
  const { t, setT, play, setPlay } = useTimeline(YEARS, LAST, 14)
  const [cmp, setCmp] = useState(YEARS[0])
  const [hov, setHov] = useState(null)
  const p = useMemo(() => at(t), [t])
  const c = cmp ? P.data[cmp] : null
  const s = stats(p), s0 = stats(P.data[YEARS[0]])
  const A = legalAge(t), R = retired(p, A), R0 = retired(P.data[YEARS[0]], legalAge(YEARS[0]))
  const year = Math.round(t), proj = t > LAST + 1e-9

  // Géométrie : hommes à gauche, femmes à droite, âges au centre.
  const narrow = W < 560
  const mid = narrow ? 26 : 34, side = (W - mid) / 2, rowH = narrow ? 3.2 : 4, Tp = 18, H = Tp + DRAWN * rowH + 26
  const xs = v => v / MAX * (side - 6)
  const Y = a => Tp + (DRAWN - 1 - a) * rowH
  const xL = side, xR = side + mid
  const outline = (arr, dir) => {
    let d = ''
    for (let a = DRAWN - 1; a >= 0; a--) {
      const x = dir < 0 ? xL - xs(arr[a]) : xR + xs(arr[a]), y = Y(a)
      d += (a === DRAWN - 1 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`) + `L${x.toFixed(1)},${(y + rowH).toFixed(1)}`
    }
    return d
  }
  // Surface pleine d'un côté : du centre jusqu'au contour.
  const yA = Tp + (DRAWN - A) * rowH // seuil de l'âge légal (âge fractionnaire)
  const area = (arr, dir) => { const x0 = dir < 0 ? xL : xR; return `M${x0},${Y(DRAWN - 1)}` + outline(arr, dir).replace(/^M/, 'L') + `L${x0},${Y(0) + rowH}Z` }
  const axis = [0, 200000, 400000].filter(v => v <= MAX)
  const move = e => {
    const r = e.currentTarget.getBoundingClientRect(), y = (e.clientY - r.top) / r.height * H
    const a = DRAWN - 1 - Math.floor((y - Tp) / rowH)
    setHov(a >= 0 && a < DRAWN ? a : null)
  }
  // Générations repères : creux des naissances de la Grande Guerre (1915-1919), premières générations du baby-boom (1946).
  const marks = [
    { born: 1917, fr: 'Grande Guerre (nés en 1915-1919)', en: 'World War I (born 1915-1919)' },
    { born: 1946, fr: 'Baby-boom (nés dès 1946)', en: 'Baby boom (born from 1946)' },
  ].map(m => ({ ...m, age: t - m.born })).filter(m => m.age >= 1 && m.age <= 99)

  return (
    <Card title={T('Pyramide des âges', 'Population pyramid')}
      sub={T(`Population au 1er janvier par âge et par sexe, de ${YEARS[0]} à ${LAST}, puis projection d’Eurostat jusqu’en ${YEARS.at(-1)}. France métropolitaine avant ${P.firstFR}.`, `Population on 1 January by age and sex, from ${YEARS[0]} to ${LAST}, then Eurostat projection to ${YEARS.at(-1)}. Metropolitan France before ${P.firstFR}.`)}
      right={<Seg small value={cmp} onChange={setCmp} options={[[T(`Contour ${YEARS[0]}`, `${YEARS[0]} outline`), YEARS[0]], [T(`Contour ${LAST}`, `${LAST} outline`), LAST], [T('Sans contour', 'No outline'), 0]]} />}
      src={SRC}>
      <Timeline years={YEARS} t={t} setT={setT} play={play} setPlay={setPlay} split={LAST} labelEvery={10} />
      <div className="py-grid">
        <div ref={ref} className="im-chart py-chart">
          <svg width={W} height={H} onMouseMove={move} onMouseLeave={() => setHov(null)} role="img" aria-label={T(`Pyramide des âges en ${year}`, `Population pyramid in ${year}`)}>
            <text x={xL - 4} y={12} textAnchor="end" className="py-h" fill={MEN}>{T('Hommes', 'Men')}</text>
            <text x={xR + 4} y={12} className="py-h" fill={WOMEN}>{T('Femmes', 'Women')}</text>
            {axis.map(v => <g key={v}>
              <line x1={xL - xs(v)} x2={xL - xs(v)} y1={Tp} y2={Y(0) + rowH} stroke="var(--line)" />
              <line x1={xR + xs(v)} x2={xR + xs(v)} y1={Tp} y2={Y(0) + rowH} stroke="var(--line)" />
              {v > 0 && <><text x={xL - xs(v)} y={H - 8} textAnchor="middle" className="ax">{fmt(v / 1000, 0)}{T(' k', 'k')}</text><text x={xR + xs(v)} y={H - 8} textAnchor="middle" className="ax">{fmt(v / 1000, 0)}{T(' k', 'k')}</text></>}
            </g>)}
            <defs><clipPath id="py-ret"><rect x="0" y={Tp} width={W} height={Math.max(0, yA - Tp)} /></clipPath></defs>
            <g opacity={proj ? 0.55 : 0.9}>
              <path d={area(p.M, -1)} fill={MEN} />
              <path d={area(p.F, 1)} fill={WOMEN} />
              <g clipPath="url(#py-ret)"><path d={area(p.M, -1)} fill={MEN_R} /><path d={area(p.F, 1)} fill={WOMEN_R} /></g>
            </g>
            {c && <><path d={outline(c.M, -1)} fill="none" stroke="#14181f" strokeWidth="1.2" /><path d={outline(c.F, 1)} fill="none" stroke="#14181f" strokeWidth="1.2" /></>}
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map(a => <text key={a} x={xL + mid / 2} y={Y(a) + rowH / 2 + 3.5} textAnchor="middle" className="ax">{a}</text>)}
            {!narrow && marks.map(m => {
              const y = Y(Math.round(m.age)) + rowH / 2
              return <g key={m.born}><line x1={xR + 2} x2={W - 2} y1={y} y2={y} stroke="#14181f" strokeDasharray="2 3" opacity="0.5" /><text x={W - 2} y={y - 4} textAnchor="end" className="py-mark">{T(m.fr, m.en)}</text></g>
            })}
            <line x1={0} x2={W} y1={yA} y2={yA} stroke={RET} strokeWidth="1.2" strokeDasharray="5 3" />
            <text x={2} y={yA - 6} className="py-ret">{T(`Âge légal de la retraite : ${ageTxt(A)}`, `Legal retirement age: ${ageTxt(A)}`)}</text>
            <text x={2} y={yA - 20} className="py-ret big">{T(`${pct(R.share, 1)} de la population au-delà`, `${pct(R.share, 1)} of the population above it`)}</text>
            {hov != null && <rect x={0} y={Y(hov)} width={W} height={rowH} fill="#14181f" opacity="0.08" />}
          </svg>
          {hov != null && (
            <div className="tip" style={{ left: Math.max(0, Math.min(W - 210, xR + 10)), top: Math.max(0, Y(hov) - 80), transform: 'none' }}>
              <div className="tip-t">{T(`${hov} an${hov > 1 ? 's' : ''}`, `Aged ${hov}`)} · {year}{proj ? T(' (projection)', ' (projection)') : ''}</div>
              <div className="tip-r"><i style={{ background: MEN }} /><span>{T('Hommes', 'Men')}</span><b>{num(p.M[hov])}</b></div>
              <div className="tip-r"><i style={{ background: WOMEN }} /><span>{T('Femmes', 'Women')}</span><b>{num(p.F[hov])}</b></div>
              <div className="tip-r"><i /><span>{T(`Nés en ${year - hov}`, `Born in ${year - hov}`)}</span><b>{num(p.M[hov] + p.F[hov])}</b></div>
              {c && <div className="tip-r"><i style={{ background: '#14181f' }} /><span>{T(`Même âge en ${cmp}`, `Same age in ${cmp}`)}</span><b>{num(c.M[hov] + c.F[hov])}</b></div>}
            </div>
          )}
        </div>
        <div className="py-stats">
          <div className="py-ret-tile">
            <span>{T('Population ayant atteint l’âge légal de la retraite', 'Population at or above the legal retirement age')}</span>
            <b>{pct(R.share, 1)}</b>
            <small>{T(`${pct(R0.share, 1)} en ${YEARS[0]} (âge légal ${ageTxt(legalAge(YEARS[0]))})`, `${pct(R0.share, 1)} in ${YEARS[0]} (legal age ${ageTxt(legalAge(YEARS[0]))})`)}</small>
            <RetSpark t={t} />
            <small>{T(`${fmt(R.ratio, 1)} personnes de 20 ans à l’âge légal pour une au-delà (${fmt(R0.ratio, 1)} en ${YEARS[0]})`, `${fmt(R.ratio, 1)} people aged 20 to the legal age per person above it (${fmt(R0.ratio, 1)} in ${YEARS[0]})`)}</small>
          </div>
          <div><span>{T('Population', 'Population')}</span><b>{isEn() ? `${fmt(s.N / 1e6, 1)} million` : `${fmt(s.N / 1e6, 1)} millions`}</b><small>{T(`${fmt(s0.N / 1e6, 1)} en ${YEARS[0]}`, `${fmt(s0.N / 1e6, 1)} in ${YEARS[0]}`)}</small></div>
          <div><span>{T('Âge médian', 'Median age')}</span><b>{T(`${fmt(s.med, 1)} ans`, `${fmt(s.med, 1)} years`)}</b><small>{T(`${fmt(s0.med, 1)} en ${YEARS[0]}`, `${fmt(s0.med, 1)} in ${YEARS[0]}`)}</small></div>
          <div><span>{T('Moins de 20 ans', 'Under 20')}</span><b>{pct(s.young, 1)}</b><small>{T(`${pct(s0.young, 1)} en ${YEARS[0]}`, `${pct(s0.young, 1)} in ${YEARS[0]}`)}</small></div>
          <div><span>{T('65 ans et plus', '65 and over')}</span><b>{pct(s.old, 1)}</b><small>{T(`${pct(s0.old, 1)} en ${YEARS[0]}`, `${pct(s0.old, 1)} in ${YEARS[0]}`)}</small></div>
        </div>
      </div>
    </Card>
  )
}
