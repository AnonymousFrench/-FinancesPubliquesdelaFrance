import React, { useMemo, useState } from 'react'
import { baseline, governmentPlan, parties, reviewCredibility, reviewsOf, RULE, ORDER, SOURCES, KIND, FIRST_YEAR_SHARE } from '../data/election2027.js'
import { project, interpolate, YEARS } from '../lib/projection.js'
import { usePolls, pollOf } from '../lib/usePolls.js'
import { WIKI_PAGE } from '../lib/polls.js'
import { PollStatus } from './Polls.jsx'
import { Card, Kpi, Seg } from './ui.jsx'
import { LineChart } from '../lib/charts.jsx'
import { bn, fmt, pct, signed } from '../lib/format.js'

const S = k => SOURCES[k]
const PROJ = YEARS.filter(y => y >= 2026)
const pointsOf = obj => Object.entries(obj).map(([y, v]) => [+y, v])
const GOV = '#1a7f4b'
const BASE_C = '#9aa4b2'
const LIST = ORDER.map(id => parties[id])
const at = (rows, y) => rows.find(r => r.year === y)
const line = (key, rows, ref) => rows.filter(r => r.year >= 2025).map(r => [r.year, +(r[key] - (ref ? at(ref, r.year)[key] : 0)).toFixed(2)])
const reviewName = (q, id) => (r => r.by || r.label)(reviewsOf(q).find(r => r.id === id) || reviewsOf(q)[0])
const pctAxis = v => fmt(v, 0) + ' %'

function Slider({ label, value, min, max, step, onChange, fmtv, hint }) {
  return (
    <label className="sl">
      <span className="sl-l">{label}<b>{fmtv(value)}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} />
      {hint && <span className="sl-h">{hint}</span>}
    </label>
  )
}

// Coefficients de crédibilité d'un parti selon la base choisie : tel qu'annoncé, analyse centrale ou règle commune.
const credFor = (q, basis) => basis === 'claimed' ? {} : reviewCredibility(q, basis === 'standard' ? 'standard' : q.reviewDefault)

export default function Election() {
  const [basis, setBasis] = useState('central')
  const [growthMode, setGrowthMode] = useState('consensus')
  const [marketRate, setMarketRate] = useState(baseline.marketRate)
  const [spreadBp, setSpreadBp] = useState(0)
  const [multiplier, setMultiplier] = useState(0)
  const [pid, setPid] = useState('rn')
  const opts = { marketRate, spreadBp, multiplier, firstYearShare: FIRST_YEAR_SHARE }
  const growthOf = q => growthMode === 'party' && q.growthClaim ? q.growthClaim : baseline.growth

  const base = useMemo(() => project(baseline, { marketRate }), [marketRate])
  const runs = useMemo(() => LIST.map(q => ({
    q,
    rows: project(baseline, { ...opts, measures: q.measures, growth: growthOf(q), credibility: credFor(q, basis) }),
    claimed: project(baseline, { ...opts, measures: q.measures, growth: growthOf(q) }),
  })), [basis, growthMode, marketRate, spreadBp, multiplier])

  const pick = id => { setPid(id); requestAnimationFrame(() => document.getElementById('deep-dive')?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }

  return (
    <>
      <Intro onPick={pick} />

      <div className="dd-head sec">
        <h2>Comparer les programmes, 2027-2032</h2>
      <div className="ctl-row">
        <div className="ctl">
          <span className="ctl-l">Mesures retenues</span>
          <Seg small value={basis} onChange={setBasis} options={[['Telles qu’annoncées', 'claimed'], ['Analyse indépendante', 'central'], ['Règle commune', 'standard']]} />
        </div>
        <div className="ctl">
          <span className="ctl-l">Croissance</span>
          <Seg small value={growthMode} onChange={setGrowthMode} options={[['Consensus', 'consensus'], ['Hypothèses des partis', 'party']]} />
        </div>
        <details className="adv">
          <summary>Taux et multiplicateur</summary>
          <div className="sliders">
            <Slider label="Taux des emprunts nouveaux" value={marketRate} min={2.5} max={6} step={0.1} onChange={setMarketRate} fmtv={v => pct(v)} />
            <Slider label="Prime de risque" value={spreadBp} min={0} max={200} step={10} onChange={setSpreadBp} fmtv={v => `+${v} pb`} />
            <Slider label="Multiplicateur budgétaire" value={multiplier} min={0} max={1} step={0.1} onChange={setMultiplier} fmtv={v => fmt(v)} />
          </div>
        </details>
      </div>
      </div>
      <Impact runs={runs} base={base} basis={basis} />
      <Trajectories runs={runs} base={base} />
      <Size runs={runs} basis={basis} />
      <Table runs={runs} base={base} basis={basis} />

      <div id="deep-dive" className="dd-head">
        <h2>Zoom sur un programme</h2>
        <Seg value={pid} onChange={setPid} options={LIST.map(q => [q.short, q.id])} />
      </div>
      <DeepDive key={pid + basis} q={parties[pid]} basis={basis} base={base} opts={opts} growth={growthOf(parties[pid])} />

    </>
  )
}

function Intro({ onPick }) {
  const state = usePolls()
  return (
    <Card title="Présidentielle 2027 : les programmes face à la dette"
      sub="Six programmes, un même modèle, comparés à la politique inchangée jusqu’en 2032."
      src={[{ label: 'Wikipédia, liste des sondages 2027', url: WIKI_PAGE }, S('votons')]}>
      <div className="cands">
        {LIST.map(q => {
          const p = pollOf(state.data, q.pollName)
          const v = p ? p.v : q.poll, d = p ? p.delta : q.pollDelta
          return (
            <button key={q.id} className="cand" style={{ '--pc': q.color }} onClick={() => onPick(q.id)} title={`Zoom : ${q.name}`}>
              <span className="cand-pos">{q.position}</span>
              <b className="cand-name">{q.candidate}</b>
              <span className="cand-party">{q.name}</span>
              <span className="cand-poll">{pct(v)}{d != null && (Math.abs(d) < 0.05 ? <em className="mut">=</em> : <em className={d > 0 ? 'dn' : 'up'}>{d > 0 ? '▲' : '▼'} {fmt(Math.abs(d))}</em>)}</span>
              <span className="cand-bar"><i style={{ width: `${v / 36 * 100}%` }} /></span>
              <span className="cand-seats">{q.deputies} députés</span>
            </button>
          )
        })}
      </div>
      <div className="poll-meta"><PollStatus state={state} /><a href="/sondages-presidentielle-2027">Tous les sondages →</a></div>
    </Card>
  )
}

// Barres divergentes : écart en 2032 par rapport à la politique inchangée. Plein = base retenue ; contour = tel qu'annoncé.
function Impact({ runs, base, basis }) {
  const b = at(base, 2032)
  const rows = runs.map(({ q, rows, claimed }) => {
    const r = at(rows, 2032), c = at(claimed, 2032)
    return { q, def: r.deficitPct - b.deficitPct, debt: r.debtPct - b.debtPct, cdef: c.deficitPct - b.deficitPct, cdebt: c.debtPct - b.debtPct }
  })
  const sorted = [...rows].sort((x, y) => x.debt - y.debt)
  const maxDef = niceMax(Math.max(...rows.flatMap(r => [Math.abs(r.def), Math.abs(r.cdef)])))
  const maxDebt = niceMax(Math.max(...rows.flatMap(r => [Math.abs(r.debt), Math.abs(r.cdebt)])))
  const ghost = basis !== 'claimed'
  return (
    <Card title="Effet de chaque programme en 2032"
      sub={`Écart avec la politique inchangée (déficit ${pct(b.deficitPct)}, dette ${pct(b.debtPct)} du PIB), en points de PIB.`}>
      <div className="grid2 flat">
        <Diverging title="Déficit 2032, points de PIB" rows={sorted.map(r => ({ q: r.q, v: r.def, g: ghost ? r.cdef : null }))} max={maxDef} />
        <Diverging title="Dette 2032, points de PIB" rows={sorted.map(r => ({ q: r.q, v: r.debt, g: ghost ? r.cdebt : null }))} max={maxDebt} />
      </div>
      {ghost && <p className="hint"><span className="ghost-key" /> Contour : le programme tel qu’annoncé. 1 point de PIB ≈ 35 Md€.</p>}
    </Card>
  )
}

function niceMax(v) {
  const steps = [1, 2, 2.5, 5, 10, 15, 20, 25, 30, 40, 50]
  return steps.find(s => s >= v * 1.05) || Math.ceil(v / 10) * 10
}

function Diverging({ title, rows, max }) {
  const X = v => 50 + v / max * 50
  const ticks = [-max, -max / 2, 0, max / 2, max]
  return (
    <div className="div">
      <h4>{title}</h4>
      <div className="div-axis"><span />{ticks.map(t => <em key={t} style={{ left: `${X(t)}%` }}>{signed(t, Number.isInteger(t) ? 0 : 1)}</em>)}</div>
      {rows.map(({ q, v, g }) => (
        <div key={q.id} className="div-row">
          <span className="div-l"><i style={{ background: q.color }} />{q.short}</span>
          <span className="div-track">
            <span className="div-zero" />
            {g != null && <span className="div-ghost" style={{ left: `${Math.min(X(0), X(g))}%`, width: `${Math.abs(X(g) - X(0))}%`, borderColor: q.color }} />}
            <span className="div-bar" style={{ left: `${Math.min(X(0), X(v))}%`, width: `${Math.max(0.4, Math.abs(X(v) - X(0)))}%`, background: q.color }} />
          </span>
          <span className={'div-v ' + (v < -0.05 ? 'dn' : v > 0.05 ? 'up' : 'mut')}>{signed(v)}</span>
        </div>
      ))}
      <div className="div-foot"><span>◄ mieux</span><span>politique inchangée</span><span>pire ►</span></div>
    </div>
  )
}

function Trajectories({ runs, base }) {
  const [metric, setMetric] = useState('debtPct')
  const isDebt = metric === 'debtPct'
  const vals = [...runs.flatMap(r => r.rows), ...base].filter(r => r.year >= 2025).map(r => r[metric])
  const lo = isDebt ? Math.floor(Math.min(...vals) / 10) * 10 : 0
  const hi = Math.ceil(Math.max(...vals) / (isDebt ? 10 : 2)) * (isDebt ? 10 : 2)
  const b32 = at(base, 2032)
  return (
    <Card title="Trajectoires 2025-2032"
      sub={`${isDebt ? 'Dette' : 'Déficit'} en % du PIB, même échelle pour tous. Pointillés : politique inchangée.`}
      right={<Seg small value={metric} onChange={setMetric} options={[['Dette', 'debtPct'], ['Déficit', 'deficitPct']]} />}>
      <div className="multi">
        {runs.map(({ q, rows }) => {
          const r = at(rows, 2032)
          const dPts = r[metric] - b32[metric]
          const dEur = isDebt ? r.debt - b32.debt : r.deficit - b32.deficit
          const tone = dPts < -0.05 ? 'dn' : dPts > 0.05 ? 'up' : 'mut'
          return (
            <div key={q.id} className="mini">
              <div className="mini-h"><i style={{ background: q.color }} /><b>{q.short}</b><span>{q.candidate}</span></div>
              <div className="mini-v"><b>{pct(r[metric])}</b><span className={tone}>{signed(dPts)} pt · {signed(dEur, 0)} Md€{isDebt ? '' : ' par an'}</span></div>
              <LineChart height={120} legend={false} yMin={lo} yMax={hi} xTicks={[2026, 2029, 2032]}
                series={[
                  { name: 'Politique inchangée', color: BASE_C, dash: true, width: 1.6, points: line(metric, base) },
                  { name: q.short, color: q.color, width: 2.6, points: line(metric, rows) },
                ]}
                band={{ from: 0, to: 1, color: tone === 'dn' ? '#1a7f4b' : '#e1000f', opacity: 0.2, label: '' }}
                refLines={isDebt ? [] : [{ y: 3, label: '3 %' }]}
                axes={{ left: { fmt: v => fmt(v, 0), tipFmt: v => pct(v) } }} />
            </div>
          )
        })}
      </div>
      <p className="hint">Écart en 2032 avec la politique inchangée : <span className="dn">vert</span> = moins {isDebt ? 'de dette' : 'de déficit'}, <span className="up">rouge</span> = davantage.</p>
    </Card>
  )
}

// Ampleur de la recomposition budgétaire : gains et coûts bruts annoncés pour 2032.
const SIZE_CATS = [
  ['cutsSpend', 'Baisses de dépenses', '#2a9d8f'], ['newRev', 'Recettes nouvelles', '#8cc084'],
  ['taxCuts', 'Baisses d’impôts', '#f2a65a'], ['newSpend', 'Dépenses nouvelles', '#e07a5f'],
]
function sizeOf(q) {
  const t = { cutsSpend: 0, newRev: 0, taxCuts: 0, newSpend: 0 }
  for (const m of q.measures) {
    const v = interpolate(m.points)[2032]
    const parts = m.kind === 'mixed' ? [['spending', v / 2], ['revenue', v / 2]] : [[m.kind, v]]
    for (const [k, x] of parts) {
      if (x >= 0) t[k === 'spending' ? 'cutsSpend' : 'newRev'] += x
      else t[k === 'spending' ? 'newSpend' : 'taxCuts'] += -x
    }
  }
  return t
}
function Size({ runs, basis }) {
  const data = runs.map(({ q, rows }) => ({ q, t: sizeOf(q), counted: at(rows, 2032).measures }))
  const max = niceMax(Math.max(...data.flatMap(d => [d.t.cutsSpend + d.t.newRev, d.t.taxCuts + d.t.newSpend])))
  const X = v => 50 + v / max * 50
  return (
    <Card title="Ampleur des programmes"
      sub="Montants bruts annoncés pour 2032, Md€ par an : coûts à gauche, gains à droite."
      right={<div className="legend">{SIZE_CATS.map(([k, n, c]) => <span key={k}><i style={{ background: c }} />{n}</span>)}<span><i className="net-key" />Net annoncé</span>{basis !== 'claimed' && <span><i className="cnt-key" />Net retenu</span>}</div>}>
      <div className="div size">
        <div className="div-axis"><span />{[-max, -max / 2, 0, max / 2, max].map(t => <em key={t} style={{ left: `${X(t)}%` }}>{signed(t, Number.isInteger(t) ? 0 : 1)}</em>)}</div>
        {data.map(({ q, t, counted }) => {
          const net = t.cutsSpend + t.newRev - t.taxCuts - t.newSpend
          let right = 50, left = 50
          return (
            <div key={q.id} className="div-row">
              <span className="div-l"><i style={{ background: q.color }} />{q.short}</span>
              <span className="div-track tall">
                <span className="div-zero" />
                {SIZE_CATS.slice(0, 2).map(([k, n, c]) => { const w = t[k] / max * 50; const el = <span key={k} className="seg-bar" title={`${n} : ${bn(t[k], 0)}`} style={{ left: `${right}%`, width: `${w}%`, background: c }} />; right += w; return el })}
                {SIZE_CATS.slice(2).map(([k, n, c]) => { const w = t[k] / max * 50; left -= w; return <span key={k} className="seg-bar" title={`${n} : ${bn(t[k], 0)}`} style={{ left: `${left}%`, width: `${w}%`, background: c }} /> })}
                <span className="net-mark" style={{ left: `${X(net)}%` }} title={`Net annoncé : ${signed(net, 0)} Md€`} />
                {basis !== 'claimed' && <span className="cnt-mark" style={{ left: `${X(counted)}%`, background: q.color }} title={`Net retenu : ${signed(counted, 0)} Md€`} />}
              </span>
              <span className="div-v wide">{signed(net, 0)}<em>{basis !== 'claimed' ? ` → ${signed(counted, 0)}` : ''}</em></span>
            </div>
          )
        })}
        <div className="div-foot"><span>◄ coûts</span><span /><span>gains ►</span></div>
      </div>
    </Card>
  )
}

function Table({ runs, base, basis }) {
  const b = at(base, 2032)
  const all = [{ name: 'Politique inchangée', rows: base, review: '–' }, ...runs.map(({ q, rows }) => ({ name: q.name, q, rows, review: basis === 'claimed' ? 'tel qu’annoncé' : reviewName(q, basis === 'standard' ? 'standard' : q.reviewDefault) }))]
  return (
    <Card title="2032 en chiffres">
      <div className="t-wrap">
        <table className="t">
          <thead><tr><th></th><th>Déficit</th><th>Écart</th><th>Dette</th><th>Écart</th><th>Dépenses</th><th>Recettes</th><th>Intérêts</th><th>Mesures nettes</th><th>Évalué par</th></tr></thead>
          <tbody>
            {all.map(({ name, q, rows, review }) => {
              const r = at(rows, 2032)
              const dd = r.deficitPct - b.deficitPct, db = r.debtPct - b.debtPct
              return (
                <tr key={name} className={q ? '' : 'mutrow'}>
                  <td>{q && <i className="dot-c" style={{ background: q.color }} />}{name}</td>
                  <td>{pct(r.deficitPct)}</td><td className={q ? (dd < -0.05 ? 'dn' : dd > 0.05 ? 'up' : '') : ''}>{q ? signed(dd) : '–'}</td>
                  <td>{pct(r.debtPct)}</td><td className={q ? (db < -0.05 ? 'dn' : db > 0.05 ? 'up' : '') : ''}>{q ? signed(db) : '–'}</td>
                  <td>{pct(r.spendingPct)}</td><td>{pct(r.revenuePct)}</td><td>{bn(r.interest, 0)}</td>
                  <td>{q ? `${signed(r.measures, 0)} Md€` : '–'}</td><td className="mut">{review}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function DeepDive({ q, basis, base, opts, growth }) {
  const [preset, setPreset] = useState(basis === 'claimed' ? 'claimed' : 'review')
  const [reviewId, setReviewId] = useState(basis === 'standard' ? 'standard' : q.reviewDefault)
  const [custom, setCustom] = useState(null)
  const [open, setOpen] = useState(null)
  const reviews = reviewsOf(q)
  const review = reviews.find(r => r.id === reviewId) || reviews[0]

  const cred = useMemo(() => {
    if (preset === 'custom' && custom) return custom
    if (preset === 'review') return reviewCredibility(q, review.id)
    return Object.fromEntries(q.measures.map(m => [m.id, 1]))
  }, [q, preset, review, custom])
  const setCred = (id, v) => { setPreset('custom'); setCustom({ ...cred, [id]: v }) }
  const scen = useMemo(() => project(baseline, { ...opts, measures: q.measures, credibility: cred, growth }), [q, cred, opts.marketRate, opts.spreadBp, opts.multiplier, growth])

  const b32 = at(base, 2032), s32 = at(scen, 2032)
  const tgtYear = Object.keys(q.targets.deficit).map(Number).sort().at(-1)
  const series = (key, rows) => rows.filter(r => r.year >= 2025).map(r => [r.year, +r[key].toFixed(2)])
  const extSeries = metric => q.external.filter(e => e[metric]).map((e, k) => ({ name: e.label, color: ['#8e7cc3', '#f28c28'][k], line: false, points: pointsOf(e[metric]) }))
  const note = preset === 'claimed' ? `Chaque mesure au montant du parti. ${q.growthNote}`
    : preset === 'custom' ? 'Votre propre crédibilité pour chaque ligne, réglée dans le tableau ci-dessous.'
    : review.id === 'standard' ? `Règle commune : chaque gain compte ${Object.entries(RULE).map(([k, r]) => `${Math.round(r.share * 100)} % (${k}, ${r.label.toLowerCase()})`).join(', ')} ; les coûts en entier. La classe de chaque mesure figure dans le tableau.`
    : q.reviewNote(review)

  return (
    <>
      <Card title={`${q.candidate} · ${q.name}`} tag={q.position} src={q.src.map(S)}>
        <div className="claims">{q.headline.map(([k, v]) => <div key={k} className="claim"><span>{k}</span><b>{v}</b></div>)}</div>
        <details className="about"><summary>À propos de ce chiffrage</summary><p className="sub">{q.document}</p></details>
      </Card>

      <section className="card">
        <div className="ctl-row">
          <div className="ctl">
            <span className="ctl-l">Mesures</span>
            <Seg small value={preset} onChange={v => { setPreset(v); setCustom(null) }} options={[[`Telles qu’annoncées (${q.short})`, 'claimed'], ['Analyse indépendante', 'review'], ['Personnalisé', 'custom']]} />
            {preset === 'review' && <Seg small value={review.id} onChange={setReviewId} options={reviews.map(r => [r.label, r.id])} />}
          </div>
        </div>
        {preset === 'review' && review.id !== 'standard' && <p className="ctl-note">{note}</p>}
      </section>

      <div className="kpis">
        <Kpi label="Déficit 2032" value={pct(s32.deficitPct)} sub={`politique inchangée ${pct(b32.deficitPct)} · ${signed(s32.deficitPct - b32.deficitPct)} pt`} tone={s32.deficitPct > 3 ? 'bad' : 'good'} />
        <Kpi label={tgtYear ? `Déficit ${tgtYear} et objectif` : 'Objectif de déficit'} value={tgtYear ? pct(at(scen, tgtYear).deficitPct) : '–'} sub={tgtYear ? `objectif ${q.short} : ${pct(q.targets.deficit[tgtYear])}` : `aucun objectif publié par ${q.short}`} tone={tgtYear ? (at(scen, tgtYear).deficitPct > q.targets.deficit[tgtYear] + 0.05 ? 'bad' : 'good') : undefined} />
        <Kpi label="Dette 2032" value={pct(s32.debtPct)} sub={`politique inchangée ${pct(b32.debtPct)}${q.targets.debt[2032] ? ` · objectif ${q.short} ${pct(q.targets.debt[2032], 0)}` : ''}`} tone={s32.debtPct > at(scen, 2026).debtPct ? 'bad' : 'good'} />
        <Kpi label="Dépense publique 2032" value={pct(s32.spendingPct)} sub={`du PIB · inchangée ${pct(b32.spendingPct)}`} />
        <Kpi label="Intérêts 2032" value={bn(s32.interest, 0)} sub={`inchangée ${bn(b32.interest, 0)} · 2025 : ${bn(base[0].interest, 0)}`} tone="warn" />
      </div>

      <div className="grid2">
        <Card title="Déficit, % du PIB" sub="Points : objectifs et autres projections.">
          <LineChart height={250} yMin={0}
            series={[
              { name: 'Politique inchangée', color: BASE_C, dash: true, points: series('deficitPct', base) },
              { name: q.short, color: q.color, width: 2.8, points: series('deficitPct', scen) },
              { name: `Objectifs ${q.short}`, color: q.color, line: false, points: pointsOf(q.targets.deficit) },
              { name: governmentPlan.label, color: GOV, line: false, points: pointsOf(governmentPlan.deficit) },
              ...extSeries('deficit'),
            ].filter(x => x.points.length)}
            refLines={[{ y: 3, label: 'Limite UE 3 %' }]} shade={{ from: 2026.5, to: 2032.5, label: 'Projection' }}
            axes={{ left: { fmt: pctAxis, tipFmt: v => pct(v) } }} />
        </Card>
        <Card title="Dette, % du PIB">
          <LineChart height={250}
            series={[
              { name: 'Politique inchangée', color: BASE_C, dash: true, points: series('debtPct', base) },
              { name: q.short, color: q.color, width: 2.8, points: series('debtPct', scen) },
              { name: `Objectifs ${q.short}`, color: q.color, line: false, points: pointsOf(q.targets.debt) },
              { name: governmentPlan.label, color: GOV, line: false, points: pointsOf(governmentPlan.debt) },
              ...extSeries('debt'),
            ].filter(x => x.points.length)}
            shade={{ from: 2026.5, to: 2032.5, label: 'Projection' }}
            axes={{ left: { fmt: pctAxis, tipFmt: v => pct(v) } }} />
        </Card>
      </div>

      <div className="grid2">
        <Card title="Dépenses et recettes, % du PIB" sub="Pointillés : politique inchangée.">
          <LineChart height={220}
            series={[
              { name: 'Dépenses', color: 'var(--blue)', width: 2.5, points: series('spendingPct', scen) },
              { name: 'Dépenses, inchangée', color: 'var(--blue)', dash: true, width: 1.5, points: series('spendingPct', base) },
              { name: 'Recettes', color: 'var(--green)', width: 2.5, points: series('revenuePct', scen) },
              { name: 'Recettes, inchangée', color: 'var(--green)', dash: true, width: 1.5, points: series('revenuePct', base) },
            ]}
            band={{ from: 0, to: 2, color: '#e1000f', label: 'Déficit' }}
            shade={{ from: 2026.5, to: 2032.5, label: 'Projection' }}
            axes={{ left: { fmt: pctAxis, tipFmt: v => pct(v) } }} />
        </Card>
        <Card title="Charge d’intérêts, Md€">
          <LineChart height={220}
            series={[
              { name: 'Politique inchangée', color: BASE_C, dash: true, points: series('interest', base) },
              { name: q.short, color: q.color, width: 2.5, points: series('interest', scen) },
            ]}
            shade={{ from: 2026.5, to: 2032.5, label: 'Projection' }}
            axes={{ left: { fmt: v => fmt(v, 0), tipFmt: v => bn(v) } }} />
        </Card>
      </div>

      <Card title="Mesure par mesure" sub="Md€ par an, effet sur le solde. Curseur : part retenue ; clic : détail." src={q.measuresSrc.map(S)}>
        <div className="t-wrap">
          <table className="t mt">
            <thead><tr><th>Mesure</th><th>Nature</th><th title="Classe selon la règle commune">Classe</th><th>2027</th><th>2032</th><th>Retenu</th><th>Modélisé 2032</th></tr></thead>
            <tbody>
              {q.measures.map(m => {
                const c = cred[m.id] ?? 1
                const path = interpolate(m.points)
                const v = path[2032] * c
                return (
                  <React.Fragment key={m.id}>
                    <tr className="click" onClick={() => setOpen(open === m.id ? null : m.id)}>
                      <td><span className={'caret' + (open === m.id ? ' open' : '')}>▸</span>{m.name}{m.cost && <span className="tag">coût</span>}</td>
                      <td className="mut">{KIND[m.kind]}</td>
                      <td>{m.cost ? <span className="mut">–</span> : <span className={'cls cls-' + m.cls} title={`${RULE[m.cls].label} : ${RULE[m.cls].note}`}>{m.cls}</span>}</td>
                      <td className={path[2027] < 0 ? 'up' : ''}>{signed(path[2027])}</td>
                      <td className={path[2032] < 0 ? 'up' : ''}>{signed(path[2032])}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <span className="cred" title={m.cost ? 'Part du coût annoncé réellement dépensée (au-delà de 100 % : coût sous-estimé)' : 'Part du gain annoncé qui se réalise'}><input type="range" min={0} max={m.cost ? 2 : 1} step={0.05} value={c} onChange={e => setCred(m.id, +e.target.value)} /><b>{pct(c * 100, 0)}</b></span>
                      </td>
                      <td className={v < 0 ? 'up' : 'dn'}>{signed(v)}</td>
                    </tr>
                    {open === m.id && <tr className="detail"><td colSpan={7}><p>{m.detail}</p><p className="warn">⚠ {m.flag}</p></td></tr>}
                  </React.Fragment>
                )
              })}
              <tr className="tot">
                <td>Effet net</td><td></td><td></td>
                <td>{signed(q.measures.reduce((s, m) => s + interpolate(m.points)[2027], 0))}</td>
                <td>{signed(q.measures.reduce((s, m) => s + interpolate(m.points)[2032], 0))}</td>
                <td></td>
                <td>{signed(q.measures.reduce((s, m) => s + interpolate(m.points)[2032] * (cred[m.id] ?? 1), 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <details className="about"><summary>Origine des montants</summary><p className="sub">{q.measuresNote}</p></details>
      </Card>

      <Card title="Année par année" sub={`${q.short}, administrations publiques`}>
        <div className="t-wrap">
          <table className="t">
            <thead><tr><th></th>{PROJ.map(y => <th key={y}>{y}</th>)}</tr></thead>
            <tbody>
              {[
                ['Mesures nettes, Md€', r => r.year > 2026 ? fmt(r.measures) : '–'],
                ['Recettes, % du PIB', r => fmt(r.revenuePct)],
                ['Dépenses, % du PIB', r => fmt(r.spendingPct)],
                ['dont intérêts', r => fmt(r.interestPct)],
                ['Déficit, % du PIB', r => fmt(r.deficitPct)],
                ['Déficit à politique inchangée', r => fmt(at(base, r.year).deficitPct)],
                ['Dette, % du PIB', r => fmt(r.debtPct)],
                ['Dette à politique inchangée', r => fmt(at(base, r.year).debtPct)],
                ['Dette, Md€', r => fmt(r.debt, 0)],
                ['Taux moyen de la dette', r => pct(r.rate * 100, 2)],
              ].map(([label, f]) => (
                <tr key={label} className={label.startsWith('Déficit, %') || label.startsWith('Dette, %') ? 'em' : label.includes('inchangée') || label.startsWith('dont') ? 'mutrow' : ''}>
                  <td>{label}</td>{scen.filter(r => r.year >= 2026).map(r => <td key={r.year}>{f(r)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
