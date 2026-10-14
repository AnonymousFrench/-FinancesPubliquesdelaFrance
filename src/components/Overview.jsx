import React, { useMemo, useState } from 'react'
import { sankey, sankeyLinkHorizontal } from 'd3-sankey'
import { apu } from '../data/apu.js'
import { debtLatest, SRC } from '../data/data.js'
import { Card, DrillList } from './ui.jsx'
import { LineChart, Sparkline } from '../lib/charts.jsx'
import { fmt, bn, pct } from '../lib/format.js'

const i = apu.years.length - 1
const Y = +apu.years[i]
const years = apu.years.map(Number)

// 2025 flows, Eurostat national accounts. Residual lines close the gap to the published totals.
const revenueLines = () => {
  const L = [
    ['Production and import taxes (VAT, excise…)', apu.impotsProduction[i]],
    ['Social contributions', apu.cotisationsSociales[i]],
    ['Income and wealth taxes (income tax, CSG, corporate tax)', apu.impotsRevenuPatrimoine[i]],
    ['Sales of services', apu.ventes[i]],
    ['Property income', apu.revenusPropriete[i]],
    ['Other transfers received', apu.autresTransferts[i]],
    ['Capital taxes (inheritance…)', apu.impotsCapital[i]],
  ]
  const rest = apu.recettes[i] - L.reduce((s, l) => s + l[1], 0)
  if (rest > 0.5) L.push(['Other revenue (residual)', +rest.toFixed(1)])
  return L
}
export const spendingLines = () => {
  const L = [
    ['Cash social benefits (pensions, family, unemployment)', apu.prestationsSociales[i], '#e1000f'],
    ['Public sector pay', apu.remunerations[i], '#2148c0'],
    ['Intermediate consumption', apu.consommationIntermediaire[i], '#f28c28'],
    ['Public investment', apu.fbcf[i], '#2a9d8f'],
    ['Current transfers (EU, other)', apu.transfertsCourants[i], '#9aa4b2'],
    ['Interest on debt', apu.interets[i], '#7a5af8'],
    ['Subsidies to companies', apu.subventions[i], '#8e7cc3'],
    ['Capital transfers', apu.transfertsCapital[i], '#b8c0cc'],
  ]
  const rest = apu.depenses[i] - L.reduce((s, l) => s + l[1], 0)
  // Mostly social benefits in kind bought from market producers: reimbursed care, medicines, housing benefit.
  L.splice(1, 0, ['In-kind social benefits and other (residual)', +rest.toFixed(1), '#f4a582'])
  return L
}

const SHORT = {
  'Production and import taxes (VAT, excise…)': 'Production taxes (VAT…)',
  'Income and wealth taxes (income tax, CSG, corporate tax)': 'Income and wealth taxes',
  'Capital taxes (inheritance…)': 'Capital taxes',
  'Other transfers received': 'Other transfers',
  'Other revenue (residual)': 'Other revenue',
  'Cash social benefits (pensions, family, unemployment)': 'Cash social benefits',
  'In-kind social benefits and other (residual)': 'In-kind benefits and other',
  'Current transfers (EU, other)': 'Current transfers',
  'Subsidies to companies': 'Subsidies',
}

function Flows() {
  const [hover, setHover] = useState(null)
  const W = 1000, H = 520
  const { nodes, links } = useMemo(() => {
    const L = revenueLines(), R = spendingLines()
    const ns = [...L.map(l => ({ name: l[0], value0: l[1], side: 'in' })), { name: 'New borrowing (deficit)', value0: -apu.solde[i], side: 'debt' }, { name: 'General government', side: 'hub' }, ...R.map(r => ({ name: r[0], value0: r[1], side: r[0].startsWith('Interest') ? 'int' : 'out' }))]
    const idx = Object.fromEntries(ns.map((n, k) => [n.name, k]))
    const ls = [
      ...L.map(l => ({ source: idx[l[0]], target: idx['General government'], value: l[1] })),
      { source: idx['New borrowing (deficit)'], target: idx['General government'], value: -apu.solde[i] },
      ...R.map(r => ({ source: idx['General government'], target: idx[r[0]], value: r[1] })),
    ]
    return sankey().nodeWidth(12).nodePadding(10).nodeSort(null)
      .nodeAlign(n => n.side === 'hub' ? 1 : n.side === 'in' || n.side === 'debt' ? 0 : 2)
      .extent([[215, 6], [W - 215, H - 6]])({ nodes: ns.map(n => ({ ...n })), links: ls.map(l => ({ ...l })) })
  }, [])
  const color = n => n.side === 'debt' ? 'var(--red)' : n.side === 'int' ? '#7a5af8' : n.side === 'hub' ? 'var(--tx)' : n.side === 'in' ? 'var(--green)' : 'var(--blue)'
  const active = l => hover === null || hover === l.source.index || hover === l.target.index
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sankey">
      {links.map((l, k) => (
        <path key={k} d={sankeyLinkHorizontal()(l)} fill="none" strokeWidth={Math.max(1, l.width)}
          stroke={color(l.source.side === 'hub' ? l.target : l.source)} opacity={active(l) ? (hover === null ? 0.22 : 0.5) : 0.05} />
      ))}
      {nodes.map(n => {
        const right = n.side === 'out' || n.side === 'int'
        return (
          <g key={n.index} onMouseEnter={() => setHover(n.index)} onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
            <rect x={n.x0} y={n.y0} width={n.x1 - n.x0} height={Math.max(1, n.y1 - n.y0)} fill={color(n)} rx={2} />
            {n.side !== 'hub' && (
              <text x={right ? n.x1 + 7 : n.x0 - 7} y={(n.y0 + n.y1) / 2} dy="0.35em" textAnchor={right ? 'start' : 'end'} className="sk-l">
                <title>{n.name}: {bn(n.value)}</title>
                <tspan className={n.side === 'debt' ? 'bad' : ''}>{SHORT[n.name] || n.name}</tspan>
                <tspan className="sk-v"> {fmt(n.value, 0)}</tspan>
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default function Overview() {
  const gap = apu.depenses[i] - apu.recettes[i]
  return (
    <>
      <Card title={`The ${Y} equation`} sub="General government: State, social security and local authorities, national accounts" src={[SRC.eurostatMain, SRC.inseeDebtQ]}>
        <div className="equation">
          <div className="eq"><div className="eq-l">Revenue</div><div className="eq-v good">{fmt(apu.recettes[i])}</div><div className="eq-s">€bn · {pct(apu.recettesPct[i])} of GDP</div></div>
          <div className="eq-op">−</div>
          <div className="eq"><div className="eq-l">Spending</div><div className="eq-v blue">{fmt(apu.depenses[i])}</div><div className="eq-s">€bn · {pct(apu.depensesPct[i])} of GDP</div></div>
          <div className="eq-op">=</div>
          <div className="eq"><div className="eq-l">Deficit</div><div className="eq-v bad">−{fmt(gap)}</div><div className="eq-s">€bn · {pct(-apu.soldePct[i])} of GDP</div></div>
          <div className="eq-op">→</div>
          <div className="eq"><div className="eq-l">Debt, {debtLatest.label}</div><div className="eq-v bad">{fmt(debtLatest.total, 0)}</div><div className="eq-s">€bn · {pct(debtLatest.pct)} of GDP</div></div>
        </div>
        <div className="callout">
          For every <b>€100</b> it collects, the public sector spends <b>€{fmt(apu.depenses[i] / apu.recettes[i] * 100)}</b>. The gap is borrowed: debt rose by <b>{bn(apu.dette[i] - apu.dette[i - 1])}</b> in {Y}, and interest now costs <b>≈ €{Math.round(apu.interets[i] * 1000 / 365)}m a day</b>.
        </div>
        <div className="krow">
          <div><div className="kpi-l">Debt / GDP, {years[0]}</div><div className="big">{pct(apu.dettePct[0])}</div></div>
          <div className="krow-spark"><Sparkline values={[...apu.dettePct, debtLatest.pct]} color="var(--red)" w={420} h={44} /></div>
          <div className="r"><div className="kpi-l">{debtLatest.label}</div><div className="big bad">{pct(debtLatest.pct)}</div></div>
        </div>
      </Card>

      <Card title={`Where the money comes from and where it goes, ${Y}`} sub={`€bn. Revenue (${fmt(apu.recettes[i], 0)}) plus new borrowing (${fmt(gap, 0)}) pays for spending (${fmt(apu.depenses[i], 0)}). Hover a block to isolate its flows.`} src={SRC.eurostatMain}>
        <div className="sankey-wrap"><Flows /></div>
        <p className="hint">“In-kind social benefits and other” is a computed residual: mostly care, medicines and housing benefit that the State pays for but households receive from private providers.</p>
      </Card>

      <Card title={`Spending and revenue since ${years[0]}`} sub="% of GDP. The shaded gap between the two lines is the deficit." src={SRC.eurostatMain}>
        <LineChart height={280}
          series={[
            { name: 'Spending', color: 'var(--blue)', points: years.map((y, k) => [y, apu.depensesPct[k]]) },
            { name: 'Revenue', color: 'var(--green)', points: years.map((y, k) => [y, apu.recettesPct[k]]) },
          ]}
          band={{ from: 0, to: 1, color: '#e1000f', label: 'Deficit' }}
          axes={{ left: { fmt: v => v + '%', tipFmt: v => pct(v) } }}
          markers={[{ x: 2009, label: 'Financial crisis', side: 'l' }, { x: 2020, label: 'Covid', side: 'l' }]}
        />
        <p className="hint">Revenue has hovered around 51 to 54% of GDP for 30 years. Spending has not come back down after each crisis, so the deficit has not closed since 1974. In {Y} the gap was {pct(-apu.soldePct[i])} of GDP.</p>
      </Card>

      <Card title={`What €100 of public spending pays for, ${Y}`} sub="By economic nature, €bn" src={SRC.eurostatMain}>
        <DrillList rows={spendingLines().map(([name, value, color]) => ({ name, value, color }))} total={apu.depenses[i]} fmt={v => bn(v)} />
      </Card>
    </>
  )
}
