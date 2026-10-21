import React, { useEffect, useMemo, useRef, useState } from 'react'
import data from '../data/immig.json'
import map from '../data/immig-map.json'
import etatSeries from '../data/etat-series.json'
import { Card, Kpi, Seg } from './ui.jsx'
import { useWidth } from '../lib/charts.jsx'
import { lerp, useTimeline, Timeline } from '../lib/timeline.jsx'
import Pyramid from './Pyramid.jsx'
import { fmt, pct } from '../lib/format.js'
import { T, isEn } from '../i18n.js'

// Continents de naissance (classement Insee). Couleurs vérifiées pour les daltonismes ; chaque couleur est aussi nommée en légende.
const CONTS = [
  { id: 'AFR', fr: 'Afrique', en: 'Africa', color: '#e08a2c' },
  { id: 'EUR', fr: 'Europe', en: 'Europe', color: '#2f5fd0' },
  { id: 'ASI', fr: 'Asie', en: 'Asia', color: '#16a08f' },
  { id: 'AMO', fr: 'Amérique, Océanie', en: 'Americas, Oceania', color: '#9452c8' },
]
const COLOR = Object.fromEntries(CONTS.map(c => [c.id, c.color]))
const cName = id => { const c = CONTS.find(x => x.id === id); return T(c.fr, c.en) }
const pName = c => T(data.places[c].fr, data.places[c].en)
const num = v => fmt(Math.round(v), 0)
const mill = v => isEn() ? `${fmt(v / 1e6, 1)} million` : `${fmt(v / 1e6, 1)} million${v >= 2e6 ? 's' : ''}`

const SRC_INSEE = [
  { label: 'Insee, immigrés par pays de naissance, séries longues depuis 1968', url: 'https://www.insee.fr/fr/statistiques/6478091?sommaire=6478362' },
  { label: 'Insee, L’essentiel sur les immigrés et les étrangers', url: 'https://www.insee.fr/fr/statistiques/3633212' },
]
const SRC_PERMITS = { label: 'Eurostat, premiers titres de séjour (migr_resfirst)', url: 'https://ec.europa.eu/eurostat/databrowser/view/migr_resfirst/default/table' }

const MODES = {
  stock: { years: data.stock.years, by: data.stock.by, total: data.stock.total },
  permits: { years: data.permits.years, by: data.permits.by, total: data.permits.total },
}
// Rayon des bulles : surface proportionnelle à l'effectif, même échelle pour toutes les années d'un mode.
const MAX = Object.fromEntries(Object.entries(MODES).map(([k, m]) => [k, Math.max(...Object.values(m.by).flatMap(o => Object.values(o)))]))
const R_MAX = { stock: 30, permits: 24 }
const radius = (mode, v) => Math.max(1.3, Math.sqrt(v / MAX[mode]) * R_MAX[mode])
const KEYS = { stock: [100000, 500000], permits: [5000, 25000] }

// Vue Europe et Méditerranée élargie à un format paysage.
const viewOf = v => {
  if (v === 'world') return map.views.world
  const [x, y, w, h] = map.views.eur, W = Math.max(w, h * 1.5)
  return [x + w / 2 - W / 2, y, W, h]
}

// Interpolation linéaire entre deux années publiées, pour une frise continue.
// Dernière année du stock : l'Insee ne détaille que les principaux pays ; les autres gardent leur dernière valeur connue (2019).
const KEYF = Object.fromEntries(Object.entries(MODES).map(([mode, m]) => {
  const vals = {}
  for (const [c, o] of Object.entries(m.by)) {
    if (!data.places[c]) continue
    const v = m.years.map(y => o[y] || 0), n = v.length
    if (mode === 'stock' && !v[n - 1] && v[n - 2]) v[n - 1] = v[n - 2]
    vals[c] = v
  }
  const ty = Object.keys(m.total).map(Number).sort((a, b) => a - b)
  return [mode, { years: m.years, vals, ty, tv: ty.map(y => m.total[y]) }]
}))
function OriginMap() {
  const [mode, setMode] = useState('stock')
  const [view, setView] = useState('world')
  const K = KEYF[mode], ys = K.years, y0 = ys[0], y1 = ys.at(-1)
  const { t, setT, play, setPlay } = useTimeline(ys)
  const [hover, setHover] = useState(null) // { c, x, y }
  const wrap = useRef(null)
  const year = Math.round(t)

  useEffect(() => { setT(KEYF[mode].years.at(-1)); setPlay(false) }, [mode])
  const rows = useMemo(() => Object.entries(K.vals).map(([c, v]) => ({ c, v: lerp(ys, v, t) })).filter(r => r.v >= 1).sort((a, b) => b.v - a.v), [mode, t])
  const total = lerp(K.ty, K.tv, t)
  const vb = viewOf(view), k = vb[2] / map.views.world[2] // rayon constant à l'écran quand on zoome
  const val = c => rows.find(r => r.c === c)?.v || 0

  const onMove = (e, c) => {
    const r = wrap.current.getBoundingClientRect()
    setHover({ c, x: e.clientX - r.left, y: e.clientY - r.top, w: r.width })
  }
  const top = rows.slice(0, 10), topMax = top[0]?.v || 1
  return (
    <Card title={T('D’où viennent les immigrés', 'Where immigrants come from')}
      sub={mode === 'stock'
        ? T('Immigrés vivant en France selon leur pays de naissance. Surface des bulles proportionnelle au nombre de personnes.', 'Immigrants living in France by country of birth. Bubble area proportional to the number of people.')
        : T('Premiers titres de séjour délivrés dans l’année, par nationalité (ressortissants de pays hors Union européenne, qui n’ont pas besoin de titre). Surface des bulles proportionnelle au nombre de titres.', 'First residence permits issued during the year, by citizenship (nationals of non-EU countries; EU citizens need no permit). Bubble area proportional to the number of permits.')}
      src={mode === 'stock' ? SRC_INSEE : [SRC_PERMITS]}>
      <div className="im-ctl">
        <Seg small value={mode} onChange={setMode} options={[[T('Immigrés installés', 'Immigrants living in France'), 'stock'], [T('Arrivées : premiers titres de séjour', 'Arrivals: first residence permits'), 'permits']]} />
        <Seg small value={view} onChange={setView} options={[[T('Monde', 'World'), 'world'], [T('Europe et Méditerranée', 'Europe and Mediterranean'), 'eur']]} />
      </div>
      <Timeline years={ys} t={t} setT={setT} play={play} setPlay={setPlay} />
      <div className="im-grid">
        <div className="im-map" ref={wrap} onMouseLeave={() => setHover(null)}>
          <svg viewBox={vb.join(' ')} role="img" aria-label={T(`Carte des pays d’origine en ${year}`, `Map of countries of origin in ${year}`)}>
            <path d={map.land} className="im-land" />
            <path d={map.borders} className="im-borders" strokeWidth={0.5 * k} />
            <text x={vb[0] + vb[2] * 0.02} y={vb[1] + vb[3] * 0.96} className="im-wm" fontSize={vb[3] * 0.17}>{year}</text>
            {rows.map(({ c, v }) => {
              const p = data.places[c], r = radius(mode, v) * k
              const on = hover?.c === c
              return <circle key={c} cx={p.xy[0]} cy={p.xy[1]} r={r} fill={COLOR[p.c]} fillOpacity={on ? 0.95 : 0.68}
                stroke={on ? '#14181f' : '#fff'} strokeWidth={(on ? 1.4 : 0.8) * k}
                onMouseMove={e => onMove(e, c)} onClick={e => onMove(e, c)} />
            })}
          </svg>
          {hover && !hover.list && val(hover.c) > 0 && (
            <div className={'tip' + (hover.x > hover.w * 0.5 ? ' flip' : '')} style={{ left: hover.x, top: hover.y + 10 }}>
              <div className="tip-t">{pName(hover.c)}</div>
              <div className="tip-r"><i style={{ background: COLOR[data.places[hover.c].c] }} /><span>{year}</span><b>{num(Math.round(val(hover.c) / 100) * 100)}</b></div>
              {total > 0 && <div className="tip-r"><i /><span>{T('Part du total', 'Share of total')}</span><b>{pct(val(hover.c) / total * 100, 1)}</b></div>}
              {year !== y0 && K.vals[hover.c][0] > 0 && <div className="tip-r"><i /><span>{y0}</span><b>{num(K.vals[hover.c][0])}</b></div>}
            </div>
          )}
          <div className="im-legend">
            {CONTS.map(c => <span key={c.id}><i style={{ background: c.color }} />{T(c.fr, c.en)}</span>)}
            <span className="im-size">
              {KEYS[mode].map(v => { const r = radius(mode, v); return <svg key={v} width={2 * r + 2} height={2 * r + 2} aria-hidden="true"><circle cx={r + 1} cy={r + 1} r={r} fill="none" stroke="#9aa4b2" /></svg> })}
              {KEYS[mode].map(num).join(T(' et ', ' and '))}
            </span>
          </div>
        </div>
        <div className="im-top">
          <h4>{T(`Les 10 premiers en ${year}`, `Top 10 in ${year}`)}</h4>
          <p className="sub">{mode === 'stock' ? T(`${mill(total)} d’immigrés au total`, `${mill(total)} immigrants in total`) : T(`${num(Math.round(total / 100) * 100)} premiers titres au total`, `${num(Math.round(total / 100) * 100)} first permits in total`)}</p>
          <ol>
            {top.map(({ c, v }) => (
              <li key={c} className={hover?.c === c ? 'on' : ''} onMouseEnter={() => setHover({ c, list: true })} onMouseLeave={() => setHover(null)}>
                <span className="im-n">{pName(c)}</span>
                <span className="im-v">{num(Math.round(v / 100) * 100)}</span>
                <span className="im-bar"><i style={{ width: `${v / topMax * 100}%`, background: COLOR[data.places[c].c] }} /></span>
                <span className="im-s">{pct(v / total * 100, 1)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Card>
  )
}

// Aires empilées : immigrés par continent de naissance, en effectifs ou en parts.
function Continents() {
  const [ref, W] = useWidth(900)
  const [share, setShare] = useState(false)
  const [hi, setHi] = useState(null)
  const years = data.stock.years
  const val = (c, y) => data.stock.continents[c][y] || 0
  const sum = y => CONTS.reduce((s, c) => s + val(c.id, y), 0)
  const H = 260, L = 44, R = 12, Tp = 10, B = 24
  const x0 = years[0], x1 = years.at(-1)
  const X = y => L + (y - x0) / (x1 - x0) * (W - L - R)
  const top = share ? 100 : Math.ceil(Math.max(...years.map(sum)) / 1e6) * 1e6
  const Y = v => Tp + (1 - v / top) * (H - Tp - B)
  const v = (c, y) => share ? val(c, y) / sum(y) * 100 : val(c, y)
  // Ordre d'empilement : Europe en bas (premier continent en 1968), puis Afrique, Asie, Amérique-Océanie.
  const order = ['EUR', 'AFR', 'ASI', 'AMO']
  const layers = order.map((id, j) => {
    const lo = years.map(y => order.slice(0, j).reduce((s, o) => s + v(o, y), 0))
    const hiV = years.map((y, i) => lo[i] + v(id, y))
    const d = 'M' + years.map((y, i) => `${X(y).toFixed(1)},${Y(hiV[i]).toFixed(1)}`).join('L') + 'L' + years.map((y, i) => `${X(y).toFixed(1)},${Y(lo[i]).toFixed(1)}`).reverse().join('L') + 'Z'
    return { id, d }
  })
  const ticks = share ? [0, 25, 50, 75, 100] : Array.from({ length: top / 2e6 + 1 }, (_, i) => i * 2e6)
  const xt = [1968, 1975, 1982, 1990, 1999, 2006, 2013, 2019, 2024].filter(y => W > 520 || [1968, 1982, 1999, 2013, 2024].includes(y))
  const move = e => {
    const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W
    setHi(years.reduce((b, y) => Math.abs(X(y) - x) < Math.abs(X(b) - x) ? y : b, years[0]))
  }
  const a = years[0], z = years.at(-1)
  return (
    <Card title={T('Par continent de naissance, 1968-2024', 'By continent of birth, 1968-2024')}
      sub={T(`En ${a}, ${pct(val('EUR', a) / sum(a) * 100, 0)} des immigrés étaient nés en Europe et ${pct(val('AFR', a) / sum(a) * 100, 0)} en Afrique. En ${z}, ${pct(val('EUR', z) / sum(z) * 100, 0)} sont nés en Europe et ${pct(val('AFR', z) / sum(z) * 100, 0)} en Afrique.`,
        `In ${a}, ${pct(val('EUR', a) / sum(a) * 100, 0)} of immigrants were born in Europe and ${pct(val('AFR', a) / sum(a) * 100, 0)} in Africa. In ${z}, ${pct(val('EUR', z) / sum(z) * 100, 0)} were born in Europe and ${pct(val('AFR', z) / sum(z) * 100, 0)} in Africa.`)}
      right={<Seg small value={share} onChange={setShare} options={[[T('Effectifs', 'Number'), false], [T('Parts', 'Shares'), true]]} />}
      src={SRC_INSEE}>
      <div ref={ref} className="im-chart">
        <svg width={W} height={H} onMouseMove={move} onMouseLeave={() => setHi(null)} role="img" aria-label={T('Immigrés par continent de naissance', 'Immigrants by continent of birth')}>
          {ticks.map(t => <g key={t}><line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} stroke="var(--line)" /><text x={L - 6} y={Y(t) + 4} textAnchor="end" className="ax">{share ? t + ' %' : fmt(t / 1e6, 0) + (t ? T(' M', 'M') : '')}</text></g>)}
          {layers.map(l => <path key={l.id} d={l.d} fill={COLOR[l.id]} fillOpacity="0.85" stroke="#fff" strokeWidth="1.5" />)}
          {xt.map(y => <text key={y} x={X(y)} y={H - 6} textAnchor="middle" className="ax">{y}</text>)}
          {years.map(y => <line key={y} x1={X(y)} x2={X(y)} y1={H - B} y2={H - B + 3} stroke="var(--mut)" />)}
          {hi && <line x1={X(hi)} x2={X(hi)} y1={Tp} y2={H - B} stroke="#14181f" strokeWidth="1" />}
        </svg>
        {hi && (
          <div className={'tip' + (X(hi) > W * 0.6 ? ' flip' : '')} style={{ left: X(hi), top: 8 }}>
            <div className="tip-t">{hi}</div>
            {[...order].reverse().map(id => <div key={id} className="tip-r"><i style={{ background: COLOR[id] }} /><span>{cName(id)}</span><b>{share ? pct(v(id, hi), 1) : num(val(id, hi))}</b></div>)}
            <div className="tip-r"><i /><span>{T('Total', 'Total')}</span><b>{num(sum(hi))}</b></div>
          </div>
        )}
        <div className="im-legend">{[...order].reverse().map(id => <span key={id}><i style={{ background: COLOR[id] }} />{cName(id)}</span>)}</div>
      </div>
    </Card>
  )
}

// Barres empilées : premiers titres de séjour par motif.
const REASONS = [
  { id: 'FAM', fr: 'Famille', en: 'Family', color: '#2f5fd0' },
  { id: 'EDUC', fr: 'Études', en: 'Studies', color: '#16a08f' },
  { id: 'EMP', fr: 'Travail', en: 'Work', color: '#e08a2c' },
  { id: 'OTH', fr: 'Autres motifs, dont asile et raisons humanitaires', en: 'Other, incl. asylum and humanitarian', color: '#9452c8' },
]
function Permits() {
  const [ref, W] = useWidth(900)
  const [hi, setHi] = useState(null)
  const years = data.permits.years, R = data.permits.reasons
  const H = 240, L = 44, Rr = 8, Tp = 10, B = 24
  const sum = y => REASONS.reduce((s, r) => s + (R[r.id][y] || 0), 0)
  const top = Math.ceil(Math.max(...years.map(sum)) / 1e5) * 1e5
  const step = (W - L - Rr) / years.length, bw = Math.max(4, step - 3)
  const X = i => L + i * step + (step - bw) / 2
  const Y = v => Tp + (1 - v / top) * (H - Tp - B)
  const last = years.at(-1)
  const sh = id => pct((R[id][last] || 0) / sum(last) * 100, 0)
  return (
    <Card title={T(`Premiers titres de séjour par motif, ${years[0]}-${last}`, `First residence permits by reason, ${years[0]}-${last}`)}
      sub={T(`${num(sum(last))} premiers titres en ${last} : ${sh('FAM')} pour motif familial, ${sh('EDUC')} pour études, ${sh('EMP')} pour travail, ${sh('OTH')} pour d’autres motifs (asile, raisons humanitaires, autres).`,
        `${num(sum(last))} first permits in ${last}: ${sh('FAM')} for family, ${sh('EDUC')} for studies, ${sh('EMP')} for work, ${sh('OTH')} for other reasons (asylum, humanitarian, other).`)}
      src={[SRC_PERMITS]}>
      <div ref={ref} className="im-chart">
        <svg width={W} height={H} onMouseLeave={() => setHi(null)} role="img" aria-label={T('Premiers titres de séjour par motif', 'First residence permits by reason')}>
          {Array.from({ length: top / 1e5 + 1 }, (_, i) => i * 1e5).map(t => <g key={t}><line x1={L} x2={W - Rr} y1={Y(t)} y2={Y(t)} stroke="var(--line)" /><text x={L - 6} y={Y(t) + 4} textAnchor="end" className="ax">{fmt(t / 1000, 0)}{t ? T(' k', 'k') : ''}</text></g>)}
          {years.map((y, i) => {
            let acc = 0
            return <g key={y} onMouseEnter={() => setHi(i)} opacity={hi == null || hi === i ? 1 : 0.55}>
              <rect x={L + i * step} y={Tp} width={step} height={H - Tp - B} fill="transparent" />
              {REASONS.map(r => {
                const v = R[r.id][y] || 0, y1 = Y(acc + v), y0 = Y(acc); acc += v
                return <rect key={r.id} x={X(i)} y={y1} width={bw} height={Math.max(0, y0 - y1 - 1)} fill={r.color} rx="1.5" />
              })}
              {(W > 560 || i % 3 === 0 || i === years.length - 1) && <text x={X(i) + bw / 2} y={H - 6} textAnchor="middle" className="ax">{W > 700 ? y : `’${String(y).slice(2)}`}</text>}
            </g>
          })}
        </svg>
        {hi != null && (
          <div className={'tip' + (X(hi) > W * 0.6 ? ' flip' : '')} style={{ left: X(hi) + bw, top: 8 }}>
            <div className="tip-t">{years[hi]}</div>
            {[...REASONS].reverse().map(r => <div key={r.id} className="tip-r"><i style={{ background: r.color }} /><span>{T(r.fr, r.en).replace(/, dont.*|, incl.*/, '')}</span><b>{num(R[r.id][years[hi]] || 0)}</b></div>)}
            <div className="tip-r"><i /><span>{T('Total', 'Total')}</span><b>{num(sum(years[hi]))}</b></div>
          </div>
        )}
        <div className="im-legend">{[...REASONS].reverse().map(r => <span key={r.id}><i style={{ background: r.color }} />{T(r.fr, r.en)}</span>)}</div>
      </div>
    </Card>
  )
}

export default function Immigration() {
  const S = data.stock, y0 = S.years[0], y1 = S.years.at(-1)
  // Part de la population née à l'étranger, France et moyenne de l'UE (Eurostat), dernière année commune.
  const sh = etatSeries.immShare, shY = Math.max(...Object.keys(sh.fr).filter(y => sh.eu[y] != null).map(Number))
  const pl = data.permits.years.at(-1)
  return (
    <>
      <div className="kpis k4">
        <Kpi label={T(`Immigrés en ${y1}`, `Immigrants in ${y1}`)} value={mill(S.total[y1])} sub={T(`${pct(S.total[y1] / S.pop[y1] * 100, 1)} de la population`, `${pct(S.total[y1] / S.pop[y1] * 100, 1)} of the population`)} />
        <Kpi label={T(`Immigrés en ${y0}`, `Immigrants in ${y0}`)} value={mill(S.total[y0])} sub={T(`${pct(S.total[y0] / S.pop[y0] * 100, 1)} de la population`, `${pct(S.total[y0] / S.pop[y0] * 100, 1)} of the population`)} />
        <Kpi label={T(`Nés à l’étranger en ${shY}`, `Born abroad in ${shY}`)} value={pct(sh.fr[shY], 1)} sub={T(`de la population ; moyenne de l’UE : ${pct(sh.eu[shY], 1)}`, `of the population; EU average: ${pct(sh.eu[shY], 1)}`)} />
        <Kpi label={T(`Premiers titres de séjour en ${pl}`, `First residence permits in ${pl}`)} value={num(data.permits.total[pl])} sub={T('ressortissants hors UE', 'non-EU nationals')} />
      </div>
      <OriginMap />
      <Pyramid />
      <div className="grid2">
        <Continents />
        <Permits />
      </div>
    </>
  )
}
