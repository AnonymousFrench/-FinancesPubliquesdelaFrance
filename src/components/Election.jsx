import React, { useMemo, useState } from 'react'
import { baseline, governmentPlan, parties, reviewCredibility, SOURCES } from '../data/election2027.js'
import { project, interpolate, YEARS } from '../lib/projection.js'
import { Card, Kpi, Seg } from './ui.jsx'
import { LineChart } from '../lib/charts.jsx'
import { bn, fmt, pct, signed } from '../lib/format.js'

const S = k => SOURCES[k]
const PROJ = YEARS.filter(y => y >= 2026)
const pointsOf = obj => Object.entries(obj).map(([y, v]) => [+y, v])
const GOV = '#1a7f4b'

function Slider({ label, value, min, max, step, onChange, fmtv, hint }) {
  return (
    <label className="sl">
      <span className="sl-l">{label}<b>{fmtv(value)}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} />
      {hint && <span className="sl-h">{hint}</span>}
    </label>
  )
}

function Pending({ p }) {
  return (
    <Card title={`${p.name}: framework ready, costing not yet published`} tag="next" src={p.src.map(S)}>
      <p className="sub">{p.document}</p>
      <h4>What is known so far</h4>
      <ul className="list">{p.known.map(k => <li key={k}>{k}</li>)}</ul>
      <p className="hint">Once a costing is out (from the party or an independent institute), adding it only takes a data entry in <code>src/data/election2027.js</code>: one line per measure category, with amounts for 2027 and 2031, the growth claimed and the party's own targets. The engine, charts and tables on this tab then work unchanged.</p>
    </Card>
  )
}

export default function Election() {
  const [pid, setPid] = useState('rn')
  const [preset, setPreset] = useState('claimed')
  const [reviewId, setReviewId] = useState(parties.rn.reviewDefault)
  const [growthMode, setGrowthMode] = useState('party')
  const [timing, setTiming] = useState(0.5)
  const [custom, setCustom] = useState(null)
  const [marketRate, setMarketRate] = useState(baseline.marketRate)
  const [spreadBp, setSpreadBp] = useState(0)
  const [multiplier, setMultiplier] = useState(0)
  const [open, setOpen] = useState(null)
  const p = parties[pid]
  const review = p.reviews?.find(r => r.id === reviewId) || p.reviews?.[0]

  const pickPreset = v => {
    setPreset(v)
    setCustom(null)
    setGrowthMode(v === 'claimed' && p.growthClaim ? 'party' : 'consensus')
  }
  const pickParty = id => {
    const q = parties[id]
    setPid(id); setPreset('claimed'); setCustom(null); setOpen(null)
    setReviewId(q.reviewDefault); setGrowthMode(q.growthClaim ? 'party' : 'consensus')
  }

  const cred = useMemo(() => {
    if (p.status !== 'ready') return {}
    if (preset === 'custom' && custom) return custom
    if (preset === 'review') return reviewCredibility(p, review.id)
    return Object.fromEntries(p.measures.map(m => [m.id, 1]))
  }, [p, preset, review, custom])

  const setCred = (id, v) => { setPreset('custom'); setCustom({ ...cred, [id]: v }) }

  const base = useMemo(() => project(baseline, { marketRate }), [marketRate])
  const scen = useMemo(() => p.status === 'ready' ? project(baseline, {
    measures: p.measures, credibility: cred, growth: growthMode === 'party' && p.growthClaim ? p.growthClaim : baseline.growth,
    marketRate, spreadBp, multiplier, firstYearShare: timing,
  }) : null, [p, cred, growthMode, marketRate, spreadBp, multiplier, timing])

  const parties_ = Object.values(parties).map(x => [x.status === 'ready' ? x.name : `${x.name} (next)`, x.id])

  if (p.status !== 'ready') return (
    <>
      <Intro pid={pid} setPid={pickParty} options={parties_} />
      <Pending p={p} />
    </>
  )

  const at = (rows, y) => rows.find(r => r.year === y)
  const b32 = at(base, 2032), s32 = at(scen, 2032), s30 = at(scen, 2030)
  const ext = p.external
  const series = (key, rows) => rows.filter(r => r.year >= 2024).map(r => [r.year, +r[key].toFixed(2)])

  const extSeries = metric => ext.filter(e => e[metric]).map((e, k) => ({ name: e.label, color: ['#f28c28', '#8e7cc3'][k], line: false, points: pointsOf(e[metric]) }))

  return (
    <>
      <Intro pid={pid} setPid={pickParty} options={parties_} />

      <Card title={`${p.name}: the programme as presented`} src={p.src.map(S)}>
        <p className="sub">{p.document}</p>
        <div className="claims">{p.headline.map(([k, v]) => <div key={k} className="claim"><span>{k}</span><b>{v}</b></div>)}</div>
      </Card>

      <section className="card controls">
        <div className="ctl-row">
          <div className="ctl">
            <span className="ctl-l">Measures</span>
            <Seg small value={preset} onChange={pickPreset} options={[[`As claimed by ${p.short}`, 'claimed'], ['Independent review', 'review'], ['Custom', 'custom']]} />
            {preset === 'review' && <Seg small value={review.id} onChange={setReviewId} options={p.reviews.map(r => [r.label, r.id])} />}
          </div>
          <div className="ctl">
            <span className="ctl-l">Growth</span>
            <Seg small value={growthMode} onChange={setGrowthMode} options={[[p.growthClaim ? `${p.short} claim: ${p.growthClaim[2028]}%` : `${p.short}: no figure`, 'party', !p.growthClaim], ['Consensus: 1.0-1.1%', 'consensus']]} />
          </div>
          <div className="ctl">
            <span className="ctl-l">Start</span>
            <Seg small value={timing} onChange={setTiming} options={[['Mid-2027', 0.5], ['Full 2027', 1], ['From 2028', 0]]} />
          </div>
        </div>
        <details className="adv">
          <summary>Market and macro assumptions</summary>
          <div className="sliders">
            <Slider label="Rate on new borrowing" value={marketRate} min={2.5} max={6} step={0.1} onChange={setMarketRate} fmtv={v => pct(v)} hint="Applies to the baseline too." />
            <Slider label={`Extra risk premium (${p.short} scenario)`} value={spreadBp} min={0} max={200} step={10} onChange={setSpreadBp} fmtv={v => `+${v} bp`} hint="Markets may charge more, or less, if they doubt the plan." />
            <Slider label="Fiscal multiplier" value={multiplier} min={0} max={1} step={0.1} onChange={setMultiplier} fmtv={v => fmt(v)} hint="GDP change per € of net budget change: lost with savings, gained with stimulus. 0 = ignored, as in the reviews." />
          </div>
        </details>
        <p className="ctl-note">
          {preset === 'claimed' && `Every measure at the party's figure. ${p.growthNote}`}
          {preset === 'review' && p.reviewNote(review)}
          {preset === 'custom' && 'Set how much of each line you believe will materialise in the table below.'}
        </p>
      </section>

      <div className="kpis">
        <Kpi label="Deficit 2032" value={pct(s32.deficitPct)} sub={`baseline ${pct(b32.deficitPct)} · ${signed(s32.deficitPct - b32.deficitPct)} pt`} tone={s32.deficitPct > 3 ? 'bad' : 'good'} />
        <Kpi label="Deficit 2030" value={pct(s30.deficitPct)} sub={p.targets.deficit[2030] ? `${p.short} target: below ${p.targets.deficit[2030]}%` : `baseline ${pct(at(base, 2030).deficitPct)} · no ${p.short} target`} tone={s30.deficitPct > (p.targets.deficit[2030] ?? 3) ? 'bad' : 'good'} />
        <Kpi label="Debt 2032" value={pct(s32.debtPct)} sub={`baseline ${pct(b32.debtPct)}${p.targets.debt[2032] ? ` · ${p.short} target ${p.targets.debt[2032]}%` : ''}`} tone={s32.debtPct > at(scen, 2026).debtPct ? 'bad' : 'good'} />
        <Kpi label="Public spending 2032" value={pct(s32.spendingPct)} sub={`of GDP · baseline ${pct(b32.spendingPct)}`} />
        <Kpi label="Interest 2032" value={bn(s32.interest, 0)} sub={`baseline ${bn(b32.interest, 0)} · 2025: ${bn(base[0].interest, 0)}`} tone="warn" />
      </div>

      <div className="grid2">
        <Card title="Deficit, % of GDP" sub="Projection 2027-2032. Dots are targets and other institutes' projections.">
          <LineChart height={250} yMin={0}
            series={[
              { name: 'Baseline (unchanged policy)', color: '#9aa4b2', dash: true, points: series('deficitPct', base) },
              { name: `${p.short} scenario`, color: p.color, width: 2.8, points: series('deficitPct', scen) },
              { name: `${p.short} targets`, color: p.color, line: false, points: pointsOf(p.targets.deficit) },
              { name: governmentPlan.label, color: GOV, line: false, points: pointsOf(governmentPlan.deficit) },
              ...extSeries('deficit'),
            ].filter(x => x.points.length)}
            refLines={[{ y: 3, label: 'EU 3% limit' }]} shade={{ from: 2026.5, to: 2032.5, label: 'Projection' }}
            axes={{ left: { fmt: v => v + '%', tipFmt: v => pct(v) } }}
          />
        </Card>
        <Card title="Debt, % of GDP" sub="Debt keeps rising as long as the deficit is above about 3%.">
          <LineChart height={250}
            series={[
              { name: 'Baseline (unchanged policy)', color: '#9aa4b2', dash: true, points: series('debtPct', base) },
              { name: `${p.short} scenario`, color: p.color, width: 2.8, points: series('debtPct', scen) },
              { name: `${p.short} targets`, color: p.color, line: false, points: pointsOf(p.targets.debt) },
              { name: governmentPlan.label, color: GOV, line: false, points: pointsOf(governmentPlan.debt) },
              ...extSeries('debt'),
            ].filter(x => x.points.length)}
            shade={{ from: 2026.5, to: 2032.5, label: 'Projection' }}
            axes={{ left: { fmt: v => v + '%', tipFmt: v => pct(v) } }}
          />
        </Card>
      </div>

      <div className="grid2">
        <Card title="Spending and revenue, % of GDP" sub={`${p.short} scenario (solid) vs baseline (dashed)`}>
          <LineChart height={220}
            series={[
              { name: 'Spending', color: 'var(--blue)', width: 2.5, points: series('spendingPct', scen) },
              { name: 'Spending, baseline', color: 'var(--blue)', dash: true, width: 1.5, points: series('spendingPct', base) },
              { name: 'Revenue', color: 'var(--green)', width: 2.5, points: series('revenuePct', scen) },
              { name: 'Revenue, baseline', color: 'var(--green)', dash: true, width: 1.5, points: series('revenuePct', base) },
            ]}
            band={{ from: 0, to: 2, color: '#e1000f', label: 'Deficit' }}
            shade={{ from: 2026.5, to: 2032.5, label: 'Projection' }}
            axes={{ left: { fmt: v => v + '%', tipFmt: v => pct(v) } }}
          />
        </Card>
        <Card title="Interest bill, €bn" sub="The fastest-growing item in every scenario: maturing bonds issued near 0% are refinanced near 4%.">
          <LineChart height={220}
            series={[
              { name: 'Baseline', color: '#9aa4b2', dash: true, points: series('interest', base) },
              { name: `${p.short} scenario`, color: p.color, width: 2.5, points: series('interest', scen) },
            ]}
            shade={{ from: 2026.5, to: 2032.5, label: 'Projection' }}
            axes={{ left: { fmt: v => fmt(v, 0), tipFmt: v => bn(v) } }}
          />
        </Card>
      </div>

      <Card title="Measure by measure" sub={`€bn a year, effect on the balance (+ improves it). ${preset === 'custom' ? 'Drag a slider to set how much you believe will materialise.' : 'Choose “Custom” above to set your own credibility for each line.'} Click a row for details.`} src={p.measuresSrc.map(S)}>
        <div className="t-wrap">
          <table className="t mt">
            <thead><tr><th>Category</th><th>Side</th><th>2027</th><th>2031</th><th>Counted</th><th>Modelled 2031</th></tr></thead>
            <tbody>
              {p.measures.map(m => {
                const c = cred[m.id] ?? 1
                const path = interpolate(m.points)
                const v31 = path[2031] * c
                return (
                  <React.Fragment key={m.id}>
                    <tr className="click" onClick={() => setOpen(open === m.id ? null : m.id)}>
                      <td><span className={'caret' + (open === m.id ? ' open' : '')}>▸</span>{m.name}{m.cost && <span className="tag">cost</span>}</td>
                      <td className="mut">{m.kind}</td>
                      <td className={path[2027] < 0 ? 'up' : ''}>{signed(path[2027])}</td>
                      <td className={path[2031] < 0 ? 'up' : ''}>{signed(path[2031])}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <span className="cred" title={m.cost ? 'Share of the announced cost that is actually spent (above 100% = cost underestimated)' : 'Share of the announced gain that materialises'}><input type="range" min={0} max={m.cost ? 2 : 1} step={0.05} value={c} onChange={e => setCred(m.id, +e.target.value)} /><b>{pct(c * 100, 0)}</b></span>
                      </td>
                      <td className={v31 < 0 ? 'up' : 'dn'}>{signed(v31)}</td>
                    </tr>
                    {open === m.id && <tr className="detail"><td colSpan={6}><p>{m.detail}</p><p className="warn">⚠ {m.flag}</p></td></tr>}
                  </React.Fragment>
                )
              })}
              <tr className="tot">
                <td>Net effect</td><td></td>
                <td>{signed(p.measures.reduce((s, m) => s + interpolate(m.points)[2027], 0))}</td>
                <td>{signed(p.measures.reduce((s, m) => s + interpolate(m.points)[2031], 0))}</td>
                <td></td>
                <td>{signed(p.measures.reduce((s, m) => s + interpolate(m.points)[2031] * (cred[m.id] ?? 1), 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="hint">{p.measuresNote} The 2027 column is a full-year amount; the “Start” setting decides how much of it lands in 2027.</p>
      </Card>

      <Card title="Year by year" sub={`${p.short} scenario, general government`}>
        <div className="t-wrap">
          <table className="t">
            <thead><tr><th></th>{PROJ.map(y => <th key={y}>{y}</th>)}</tr></thead>
            <tbody>
              {[
                ['Net measures, €bn', r => r.year > 2026 ? fmt(r.measures) : '–'],
                ['Revenue, % GDP', r => fmt(r.revenuePct)],
                ['Spending, % GDP', r => fmt(r.spendingPct)],
                ['of which interest', r => fmt(r.interestPct)],
                ['Deficit, % GDP', r => fmt(r.deficitPct)],
                ['Baseline deficit', (r, k) => fmt(base.find(b => b.year === r.year).deficitPct)],
                ['Debt, % GDP', r => fmt(r.debtPct)],
                ['Baseline debt', r => fmt(base.find(b => b.year === r.year).debtPct)],
                ['Debt, €bn', r => fmt(r.debt, 0)],
                ['Average rate on debt', r => pct(r.rate * 100, 2)],
              ].map(([label, f]) => (
                <tr key={label} className={label.startsWith('Deficit') || label.startsWith('Debt, %') ? 'em' : label.startsWith('Baseline') || label.startsWith('of which') ? 'mutrow' : ''}>
                  <td>{label}</td>{scen.filter(r => r.year >= 2026).map(r => <td key={r.year}>{f(r)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint">2026 is the government's latest estimate and is the same in every scenario. The new president's first budget only fully applies from 2028.</p>
      </Card>

      <Compare base={base} opts={{ marketRate, spreadBp, multiplier, firstYearShare: timing }} />

      <Card title="How this is calculated" src={[S('plf27'), S('hcfp'), ...p.src.map(S)]}>
        <div className="grid2">
          <div>
            <h4>Baseline: unchanged policy</h4>
            <ul className="list">{baseline.notes.map(n => <li key={n}>{n}</li>)}</ul>
            <p className="hint">{governmentPlan.note}</p>
          </div>
          <div>
            <h4>Party scenario</h4>
            <ul className="list">
              <li>Each measure changes primary spending or revenue in euros, compared with the baseline.</li>
              <li>The growth choice changes GDP. Spending is set in euros, so faster growth lowers the spending ratio, while revenue keeps its share of GDP.</li>
              <li>Interest is recomputed every year from the debt actually accumulated, so a smaller deficit also lowers the interest bill.</li>
              <li>Not modelled: behavioural responses to tax changes, legal challenges, and the EU fiscal-rule procedure.</li>
            </ul>
          </div>
        </div>
        <p className="src warn">An illustrative model, not a forecast. The party's own document was not online when this page was built, so measure amounts come from secondary sources. Check them against the original before relying on them.</p>
      </Card>
    </>
  )
}

function Intro({ pid, setPid, options }) {
  return (
    <Card title="Election 2027: what each programme would do to the public finances"
      sub="Each party's measures run through the same model as an unchanged-policy baseline: deficit, debt, spending and interest to 2032. Change the assumptions to see what drives the result.">
      <Seg value={pid} onChange={setPid} options={options} />
    </Card>
  )
}

// Every ready party through the same model and assumptions, as claimed and under its default independent review.
function Compare({ base, opts }) {
  const [mode, setMode] = useState('claimed')
  const ready = Object.values(parties).filter(q => q.status === 'ready')
  const runs = ready.map(q => ({
    q,
    rows: project(baseline, {
      ...opts, measures: q.measures,
      growth: mode === 'claimed' && q.growthClaim ? q.growthClaim : baseline.growth,
      credibility: mode === 'claimed' ? {} : reviewCredibility(q, q.reviewDefault),
    }),
  }))
  const line = (key, rows) => rows.filter(r => r.year >= 2025).map(r => [r.year, +r[key].toFixed(2)])
  const chart = (key, extra = {}) => (
    <LineChart height={230} {...extra}
      series={[
        { name: 'Baseline', color: '#9aa4b2', dash: true, points: line(key, base) },
        ...runs.map(({ q, rows }) => ({ name: q.short, color: q.color, width: 2.6, points: line(key, rows) })),
      ]}
      shade={{ from: 2026.5, to: 2032.5, label: 'Projection' }}
      axes={{ left: { fmt: v => v + '%', tipFmt: v => pct(v) } }}
    />
  )
  const y = (rows, yr) => rows.find(r => r.year === yr)
  return (
    <Card title={`${ready.map(q => q.short).join(' vs ')} on the same assumptions`}
      sub={mode === 'claimed' ? 'Each programme at its own figures and its own growth claim, where it has one.' : `Each programme under its default independent review (${ready.map(q => `${q.short}: ${(r => r.by || r.label)(q.reviews.find(r => r.id === q.reviewDefault))}`).join(', ')}), consensus growth.`}
      right={<Seg small value={mode} onChange={setMode} options={[['As claimed', 'claimed'], ['Independent review', 'review']]} />}>
      <div className="grid2 flat">
        <div><h4>Deficit, % of GDP</h4>{chart('deficitPct', { yMin: 0, refLines: [{ y: 3, label: 'EU 3% limit' }] })}</div>
        <div><h4>Debt, % of GDP</h4>{chart('debtPct')}</div>
      </div>
      <div className="t-wrap">
        <table className="t">
          <thead><tr><th>2032</th><th>Deficit</th><th>Debt</th><th>Spending</th><th>Revenue</th><th>Interest</th><th>Net measures</th></tr></thead>
          <tbody>
            {[['Baseline', base], ...runs.map(r => [r.q.name, r.rows])].map(([name, rows]) => {
              const r = y(rows, 2032)
              return <tr key={name}><td>{name}</td><td>{pct(r.deficitPct)}</td><td>{pct(r.debtPct)}</td><td>{pct(r.spendingPct)}</td><td>{pct(r.revenuePct)}</td><td>{bn(r.interest, 0)}</td><td className={r.measures < 0 ? 'up' : r.measures > 0 ? 'dn' : ''}>{name === 'Baseline' ? '–' : `${signed(r.measures, 0)}bn`}</td></tr>
            })}
          </tbody>
        </table>
      </div>
      <p className="hint">Spending and revenue as % of GDP. Under their own figures, RN shrinks the public sector (spending down about 7 points of GDP, revenue flat) and LFI enlarges it (spending and revenue both up about 4 points). The deficit depends on whether the announced savings or new revenue actually materialise, which is where the parties and the reviewers disagree.</p>
    </Card>
  )
}
