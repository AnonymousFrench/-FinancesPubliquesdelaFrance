import React, { useMemo, useState } from 'react'
import { apu } from '../data/apu.js'
import { missions as plfMissions } from '../data/budget-etat.js'
import { cofog, cofogMeta, natureCols, missionsLfi, byLevel2025, deficitBySub, SRC } from '../data/data.js'
import { Card, DrillList, Seg } from './ui.jsx'
import { LineChart, StackedH } from '../lib/charts.jsx'
import { spendingLines } from './Overview.jsx'
import { bn, eur, fmt, pct, signed } from '../lib/format.js'

const i = apu.years.length - 1
const Y = apu.years[i]
const years = apu.years.map(Number)
const C = ['#2148c0', '#e1000f', '#f28c28', '#2a9d8f', '#8e7cc3', '#f4a582', '#9aa4b2']

// Missions that are pass-through or special accounts rather than policy spending of the general budget.
const SPECIAL = /^(Pensions|Avances|Prêts|Participations financières|Contrôle de la circulation|Financement des aides aux collectivités|Gestion du patrimoine immobilier|Développement agricole|Audiovisuel public)/

const kind = m => m.type === 'BA' ? 'annex budget' : SPECIAL.test(m.nom) ? 'special account' : null

const toRows = list => list.map(m => ({
  name: m.nom, value: m.cp, tag: kind(m), note: m.ministere,
  children: m.programmes.map(p => ({
    name: p.nom, value: p.cp, tag: 'P' + p.code,
    children: p.actions.map(a => ({ name: a.nom, value: a.cp, children: a.sousActions.map(s => ({ name: s.nom, value: s.cp })) })),
  })),
}))

function StateBudget() {
  const [q, setQ] = useState('')
  const [scope, setScope] = useState('general')
  const list = scope === 'general' ? plfMissions.filter(m => !kind(m)) : plfMissions
  const total = list.reduce((s, m) => s + m.cp, 0)
  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 3) return null
    const out = []
    for (const m of list) {
      if (m.nom.toLowerCase().includes(s)) out.push({ level: 'mission', name: m.nom, v: m.cp, path: [] })
      for (const p of m.programmes) {
        if (p.nom.toLowerCase().includes(s)) out.push({ level: 'programme', name: p.nom, v: p.cp, path: [m.nom] })
        for (const a of p.actions) {
          if (a.nom.toLowerCase().includes(s)) out.push({ level: 'action', name: a.nom, v: a.cp, path: [m.nom, p.nom] })
          for (const sa of a.sousActions) if (sa.nom.toLowerCase().includes(s)) out.push({ level: 'sub-action', name: sa.nom, v: sa.cp, path: [m.nom, p.nom, a.nom] })
        }
      }
    }
    return out.sort((a, b) => b.v - a.v).slice(0, 50)
  }, [q, scope])

  return (
    <Card title="State budget 2025, down to the smallest published line"
      sub={`PLF 2025 payment appropriations: ${bn(total / 1e9)} across ${list.length} missions › programmes › actions › sub-actions. Shares are relative to the parent line.`}
      right={<Seg small value={scope} onChange={setScope} options={[['General budget', 'general'], ['All accounts', 'all']]} />}
      src={SRC.plf25dest}>
      <div className="search">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search any budget line in French (e.g. porte-avions, école, police, bourses…)" />
        {results && <span className="mut">{results.length}{results.length === 50 ? '+' : ''} result(s)</span>}
      </div>
      {results ? (
        <div className="bars">
          {results.map((r, k) => (
            <div key={k} className="res-row">
              <span className="bar-n"><span className="tag">{r.level}</span> {r.name}{r.path.length > 0 && <span className="bar-note"> · {r.path.join(' › ')}</span>}</span>
              <span className="bar-v">{eur(r.v)}</span>
            </div>
          ))}
          {!results.length && <p className="hint">No matching line. Search covers missions, programmes, actions and sub-actions; labels are in French.</p>}
        </div>
      ) : (
        <>
          <DrillList rows={toRows(list)} total={total} fmt={eur} />
          <p className="hint">
            Example path: Défense › Équipement des forces › Engagement et combat › “Frapper à distance – porte-avions”. Draft budget (PLF) amounts, before parliamentary amendments.
            {scope === 'all' && ' “All accounts” adds annex budgets and special accounts, such as the €134bn of advances to local authorities, which is mostly their own tax receipts passing through the State.'}
          </p>
        </>
      )}
    </Card>
  )
}

function Lfi2026() {
  const moves = missionsLfi.map(m => ({ ...m, d: +(m.y2026 - m.y2025).toFixed(1) })).sort((a, b) => b.d - a.d)
  const max = Math.max(...moves.map(m => Math.abs(m.d)))
  const Row = ({ m }) => (
    <div className="bar-row">
      <span className="bar-n" title={m.name}>{m.name}</span>
      <span className="bar-t"><span className="bar-f" style={{ width: `${Math.abs(m.d) / max * 100}%`, background: m.d > 0 ? 'var(--red)' : 'var(--green)' }} /></span>
      <span className={'bar-v ' + (m.d > 0 ? 'up' : 'dn')}>{signed(m.d)}</span>
    </div>
  )
  return (
    <Card title="What changed for 2026" sub="Change in mission ceilings, 2026 budget law vs 2025, €bn" src={SRC.lfi2026}>
      <div className="grid2">
        <div><h4>Largest increases</h4><div className="bars">{moves.slice(0, 5).map(m => <Row key={m.name} m={m} />)}</div></div>
        <div><h4>Largest cuts</h4><div className="bars">{moves.slice(-5).reverse().map(m => <Row key={m.name} m={m} />)}</div></div>
      </div>
      <p className="hint">Defence carries the 2025-2030 military programming law. “Engagements financiers” holds the State's debt charge. Development aid takes the biggest cut. The open-data line-by-line tree for 2026 is not yet published, so the explorer above stays on PLF 2025.</p>
    </Card>
  )
}

function ByNature() {
  const rows = spendingLines().map(([name, value, color]) => ({ name, value, color }))
  return (
    <>
      <Card title={`Spending by nature: ${bn(apu.depenses[i])} in ${Y}`} sub={`${pct(apu.depensesPct[i])} of GDP`} src={SRC.eurostatMain}>
        <DrillList rows={rows} total={apu.depenses[i]} fmt={v => bn(v)} />
        <p className="hint">Social benefits (cash and in kind) plus public pay make up {pct((apu.prestationsSociales[i] + apu.remunerations[i] + rows[1].value) / apu.depenses[i] * 100, 0)} of all public spending.</p>
      </Card>
      <div className="grid2">
        <Card title="Thirty years of spending" sub="€bn, current prices" src={SRC.eurostatMain}>
          <LineChart height={250}
            series={[
              { name: 'Total spending', color: 'var(--tx)', width: 2.5, points: years.map((y, k) => [y, apu.depenses[k]]) },
              { name: 'Cash social benefits', color: C[1], points: years.map((y, k) => [y, apu.prestationsSociales[k]]) },
              { name: 'Public pay', color: C[0], points: years.map((y, k) => [y, apu.remunerations[k]]) },
              { name: 'Investment', color: C[3], points: years.map((y, k) => [y, apu.fbcf[k]]) },
              { name: 'Interest', color: '#7a5af8', points: years.map((y, k) => [y, apu.interets[k]]) },
            ]}
            axes={{ left: { fmt: v => fmt(v, 0), tipFmt: v => bn(v) } }}
            markers={[{ x: 2020, label: 'Covid', side: 'l' }]}
          />
        </Card>
        <Card title="Who spends it" sub={`Spending by level of government, ${Y}, €bn`} src={SRC.insee2106}>
          <StackedH segs={byLevel2025.spending.map((s, k) => ({ ...s, color: [C[0], C[1], C[2]][k] }))} fmt={v => fmt(v, 0)} height={40} />
          <h4>Deficit by sub-sector (€bn)</h4>
          <table className="t"><thead><tr><th></th><th>2024</th><th>2025</th><th>Change</th></tr></thead><tbody>
            {deficitBySub.map(r => <tr key={r.name}><td>{r.name}</td><td>{signed(r.y2024)}</td><td>{signed(r.y2025)}</td><td className={r.y2025 > r.y2024 ? 'dn' : 'up'}>{signed(r.y2025 - r.y2024)}</td></tr>)}
            <tr className="tot"><td>Total</td><td>−169.1</td><td>−152.5</td><td className="dn">+16.6</td></tr>
          </tbody></table>
        </Card>
      </div>
    </>
  )
}

function ByFunction() {
  const [sel, setSel] = useState(cofog[0].name)
  const f = cofog.find(c => c.name === sel)
  return (
    <div className="grid2">
      <Card title="Spending by function, 2024" sub={`${bn(cofogMeta.total, 0)} (${pct(cofogMeta.pctGdp)} of GDP). Click a function to see what it is made of.`} src={SRC.insee2093}>
        <div className="bars">
          {cofog.map(c => (
            <div key={c.name} className={`bar-row click ${sel === c.name ? 'sel' : ''}`} onClick={() => setSel(c.name)}>
              <span className="bar-n"><span className="caret none">▸</span>{c.name}</span>
              <span className="bar-t"><span className="bar-f" style={{ width: `${c.total / cofog[0].total * 100}%` }} /></span>
              <span className="bar-v">{fmt(c.total, 0)}<span className="bar-p">{(c.total / cofogMeta.total * 100).toFixed(0)}%</span></span>
            </div>
          ))}
        </div>
      </Card>
      <Card title={f.name} sub={`${bn(f.total, 0)} in 2024`}>
        <h4>By nature of spending</h4>
        <StackedH segs={f.nature.map((v, k) => ({ name: natureCols[k], v, color: C[k % C.length] })).filter(s => s.v > 0)} fmt={v => fmt(v, 0)} />
        <h4>By level of government</h4>
        <StackedH segs={f.level.map((v, k) => ({ name: cofogMeta.levels[k], v, color: [C[0], C[2], C[1]][k] })).filter(s => s.v > 0)} fmt={v => fmt(v, 0)} />
        {f.sub && <><h4>Known sub-items</h4><DrillList rows={f.sub} total={f.total} fmt={v => bn(v, 0)} /></>}
        {f.subNote && <p className="hint">{f.subNote}</p>}
        <p className="src">€bn, provisional, rounded: rows may not sum exactly.</p>
      </Card>
    </div>
  )
}

export default function Spending() {
  const [view, setView] = useState('state')
  return (
    <>
      <Seg value={view} onChange={setView} options={[['State budget', 'state'], ['By nature', 'nature'], ['By function', 'function']]} />
      {view === 'state' && <><StateBudget /><Lfi2026 /></>}
      {view === 'nature' && <ByNature />}
      {view === 'function' && <ByFunction />}
    </>
  )
}
