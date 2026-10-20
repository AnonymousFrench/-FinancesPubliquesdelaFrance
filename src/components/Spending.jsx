import React, { useMemo, useState } from 'react'
import { apu } from '../data/apu.js'
import { missions as plfMissions, budgetYear, budgetDepth } from '../data/budget-etat.js'
import { cofog, cofogMeta, natureCols, missionsLfi, byLevel2025, deficitBySub, SRC } from '../data/data.js'
import { Card, DrillList, Seg } from './ui.jsx'
import { LineChart, StackedH } from '../lib/charts.jsx'
import { spendingLines } from './Overview.jsx'
import { bn, eur, fmt, pct, signed, label, unitBn } from '../lib/format.js'
import { T } from '../i18n.js'
import { dt } from '../data/dataEn.js'

const i = apu.years.length - 1
const Y = apu.years[i]
const years = apu.years.map(Number)
const C = ['#2148c0', '#e1000f', '#f28c28', '#2a9d8f', '#8e7cc3', '#f4a582', '#9aa4b2']

// Missions de transit ou comptes spéciaux plutôt que dépenses de politique publique du budget général.
const SPECIAL = /^(Pensions|Avances|Prêts|Participations financières|Contrôle de la circulation|Financement des aides aux collectivités|Gestion du patrimoine immobilier|Développement agricole|Audiovisuel public)/
const kind = m => m.type === 'BA' ? dt('budget annexe') : m.type === 'CS' || SPECIAL.test(m.nom) ? dt('compte spécial') : null
const deep = budgetDepth !== 'programme'

// Missions et ministères traduits en anglais ; programmes, actions et sous-actions gardent leur intitulé officiel.
const ap = label
const mission = s => dt(ap(s))
const toRows = list => list.map(m => ({
  name: mission(m.nom), value: m.cp, tag: kind(m), note: m.ministere ? dt(ap(m.ministere)) : undefined,
  children: m.programmes.map(p => ({
    name: ap(p.nom), value: p.cp, tag: p.code ? 'P' + p.code : undefined,
    children: p.actions.length === 0 ? undefined : p.actions.map(a => ({ name: ap(a.nom), value: a.cp, children: a.sousActions.map(s => ({ name: ap(s.nom), value: s.cp })) })),
  })),
}))

function StateBudget() {
  const [q, setQ] = useState('')
  const [scope, setScope] = useState('general')
  const list = scope === 'general' ? plfMissions.filter(m => !kind(m)) : plfMissions
  const total = list.reduce((s, m) => s + m.cp, 0)
  const advances = plfMissions.filter(m => /^Avances aux collectivités/.test(m.nom)).reduce((s, m) => s + m.cp, 0)
  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 3) return null
    const has = (...t) => t.some(x => x.toLowerCase().includes(s))
    const out = []
    for (const m of list) {
      if (has(m.nom, mission(m.nom))) out.push({ level: T('mission', 'mission'), name: mission(m.nom), v: m.cp, path: [] })
      for (const p of m.programmes) {
        if (has(p.nom)) out.push({ level: T('programme', 'programme'), name: ap(p.nom), v: p.cp, path: [mission(m.nom)] })
        for (const a of p.actions) {
          if (has(a.nom)) out.push({ level: T('action', 'action'), name: ap(a.nom), v: a.cp, path: [mission(m.nom), ap(p.nom)] })
          for (const sa of a.sousActions) if (has(sa.nom)) out.push({ level: T('sous-action', 'sub-action'), name: ap(sa.nom), v: sa.cp, path: [mission(m.nom), ap(p.nom), ap(a.nom)] })
        }
      }
    }
    return out.sort((a, b) => b.v - a.v).slice(0, 50)
  }, [q, scope])

  return (
    <Card title={deep ? T(`Budget de l’État ${budgetYear}, jusqu’à la plus petite ligne publiée`, `State budget ${budgetYear}, down to the smallest published line`) : T(`Budget de l’État ${budgetYear}, par mission et programme`, `State budget ${budgetYear}, by mission and programme`)}
      sub={deep ? T(`PLF ${budgetYear} : ${bn(total / 1e9)}, ${list.length} missions › programmes › actions › sous-actions`, `${budgetYear} draft budget: ${bn(total / 1e9)}, ${list.length} missions › programmes › actions › sub-actions`) : T(`PLF ${budgetYear} : ${bn(total / 1e9)}, ${list.length} missions › programmes`, `${budgetYear} draft budget: ${bn(total / 1e9)}, ${list.length} missions › programmes`)}
      right={<Seg small value={scope} onChange={setScope} options={[[T('Budget général', 'General budget'), 'general'], [T('Tous les comptes', 'All accounts'), 'all']]} />}
      src={deep ? SRC.plf25dest : SRC.plf27loi}>
      <div className="search">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={T('Chercher une ligne du budget (ex. : porte-avions, école, police, bourses…)', 'Search a budget line (e.g. porte-avions, école, police, bourses…)')} />
        {results && <span className="mut">{results.length}{results.length === 50 ? '+' : ''} {T('résultat(s)', 'result(s)')}</span>}
      </div>
      {results ? (
        <div className="bars">
          {results.map((r, k) => (
            <div key={k} className="res-row">
              <span className="bar-n"><span className="tag">{r.level}</span> {r.name}{r.path.length > 0 && <span className="bar-note"> · {r.path.join(' › ')}</span>}</span>
              <span className="bar-v">{eur(r.v)}</span>
            </div>
          ))}
          {!results.length && <p className="hint">{deep ? T('Aucune ligne ne correspond. La recherche porte sur les missions, programmes, actions et sous-actions.', 'No line matches. Search covers missions, programmes, actions and sub-actions; programme-level labels are in French.') : T('Aucune ligne ne correspond. La recherche porte sur les missions et les programmes.', 'No line matches. Search covers missions and programmes; programme labels are in French.')}</p>}
        </div>
      ) : (
        <>
          <DrillList rows={toRows(list)} total={total} fmt={eur} />
          <p className="hint">
            {scope === 'all' ? T(`Inclut ${bn(advances / 1e9, 0)} d’avances aux collectivités, pour l’essentiel leurs propres impôts transitant par l’État.`, `Includes ${bn(advances / 1e9, 0)} of advances to local authorities, mostly their own taxes passing through the State.`) : T('Montants du projet de loi, avant amendements.', 'Draft-bill amounts, before amendments. Programme labels keep their official French names.')}
            {!deep && T(' Le détail par action et sous-action sera ajouté quand le ministère publiera le fichier ouvert correspondant ; les crédits du titre 2 (personnel) incluent les cotisations de retraite des fonctionnaires.', ' Detail by action and sub-action will be added when the ministry publishes the matching open-data file; staff credits (title 2) include civil servants’ pension contributions.')}
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
      <span className="bar-n" title={mission(m.name)}>{mission(m.name)}</span>
      <span className="bar-t"><span className="bar-f" style={{ width: `${Math.abs(m.d) / max * 100}%`, background: m.d > 0 ? 'var(--red)' : 'var(--green)' }} /></span>
      <span className={'bar-v ' + (m.d > 0 ? 'up' : 'dn')}>{signed(m.d)}</span>
    </div>
  )
  return (
    <Card title={T('Ce qui change en 2026', 'What changes in 2026')} sub={T('Variation des plafonds par mission, loi de finances 2026 vs 2025, Md€', `Change in mission ceilings, 2026 budget law vs 2025, ${unitBn()}`)} src={SRC.lfi2026}>
      <div className="grid2 flat">
        <div><h4>{T('Principales hausses', 'Largest increases')}</h4><div className="bars">{moves.slice(0, 5).map(m => <Row key={m.name} m={m} />)}</div></div>
        <div><h4>{T('Principales baisses', 'Largest cuts')}</h4><div className="bars">{moves.slice(-5).reverse().map(m => <Row key={m.name} m={m} />)}</div></div>
      </div>
    </Card>
  )
}

function ByNature() {
  const rows = spendingLines().map(([name, value, , color]) => ({ name, value, color }))
  return (
    <>
      <Card title={T(`Dépenses par nature : ${bn(apu.depenses[i])} en ${Y}`, `Spending by nature: ${bn(apu.depenses[i])} in ${Y}`)} sub={T(`${pct(apu.depensesPct[i])} du PIB`, `${pct(apu.depensesPct[i])} of GDP`)} src={SRC.eurostatMain}>
        <DrillList rows={rows} total={apu.depenses[i]} fmt={v => bn(v)} />
      </Card>
      <div className="grid2">
        <Card title={T('Trente ans de dépenses', 'Thirty years of spending')} sub={T('Md€ courants', 'current €bn')} src={SRC.eurostatMain}>
          <LineChart height={250}
            series={[
              { name: T('Total des dépenses', 'Total spending'), color: 'var(--tx)', width: 2.5, points: years.map((y, k) => [y, apu.depenses[k]]) },
              { name: T('Prestations en espèces', 'Cash benefits'), color: C[1], points: years.map((y, k) => [y, apu.prestationsSociales[k]]) },
              { name: T('Rémunérations', 'Public pay'), color: C[0], points: years.map((y, k) => [y, apu.remunerations[k]]) },
              { name: T('Investissement', 'Investment'), color: C[3], points: years.map((y, k) => [y, apu.fbcf[k]]) },
              { name: T('Intérêts', 'Interest'), color: '#7a5af8', points: years.map((y, k) => [y, apu.interets[k]]) },
            ]}
            axes={{ left: { fmt: v => fmt(v, 0), tipFmt: v => bn(v) } }}
            markers={[{ x: 2020, label: 'Covid', side: 'l' }]}
          />
        </Card>
        <Card title={T('Qui dépense', 'Who spends it')} sub={T(`Dépenses par niveau d’administration, ${Y}, Md€`, `Spending by level of government, ${Y}, ${unitBn()}`)} src={SRC.insee2106}>
          <StackedH segs={byLevel2025.spending.map((s, k) => ({ ...s, name: dt(s.name), color: [C[0], C[1], C[2]][k] }))} fmt={v => fmt(v, 0)} height={40} />
          <h4>{T('Solde par sous-secteur (Md€)', `Balance by sub-sector (${unitBn()})`)}</h4>
          <table className="t"><thead><tr><th></th><th>2024</th><th>2025</th><th>{T('Écart', 'Change')}</th></tr></thead><tbody>
            {deficitBySub.map(r => <tr key={r.name}><td>{dt(r.name)}</td><td>{signed(r.y2024)}</td><td>{signed(r.y2025)}</td><td className={r.y2025 > r.y2024 ? 'dn' : 'up'}>{signed(r.y2025 - r.y2024)}</td></tr>)}
            <tr className="tot"><td>Total</td><td>{signed(-169.1)}</td><td>{signed(-152.5)}</td><td className="dn">{signed(16.6)}</td></tr>
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
      <Card title={T('Dépenses par fonction, 2024', 'Spending by function, 2024')} sub={T(`${bn(cofogMeta.total, 0)}, ${pct(cofogMeta.pctGdp)} du PIB`, `${bn(cofogMeta.total, 0)}, ${pct(cofogMeta.pctGdp)} of GDP`)} src={SRC.insee2093}>
        <div className="bars">
          {cofog.map(c => (
            <div key={c.name} className={`bar-row click ${sel === c.name ? 'sel' : ''}`} onClick={() => setSel(c.name)}>
              <span className="bar-n"><span className="caret none">▸</span>{dt(c.name)}</span>
              <span className="bar-t"><span className="bar-f" style={{ width: `${c.total / cofog[0].total * 100}%` }} /></span>
              <span className="bar-v">{fmt(c.total, 0)}<span className="bar-p">{pct(c.total / cofogMeta.total * 100, 0)}</span></span>
            </div>
          ))}
        </div>
      </Card>
      <Card title={dt(f.name)} sub={T(`${bn(f.total, 0)} en 2024`, `${bn(f.total, 0)} in 2024`)}>
        <h4>{T('Par nature de dépense', 'By nature of spending')}</h4>
        <StackedH segs={f.nature.map((v, k) => ({ name: dt(natureCols[k]), v, color: C[k % C.length] })).filter(s => s.v > 0)} fmt={v => fmt(v, 0)} />
        <h4>{T('Par niveau d’administration', 'By level of government')}</h4>
        <StackedH segs={f.level.map((v, k) => ({ name: dt(cofogMeta.levels[k]), v, color: [C[0], C[2], C[1]][k] })).filter(s => s.v > 0)} fmt={v => fmt(v, 0)} />
        {f.sub && <><h4>{T('Sous-postes connus', 'Known sub-items')}</h4><DrillList rows={f.sub.map(x => ({ ...x, name: dt(x.name) }))} total={f.total} fmt={v => bn(v, 0)} /></>}
        {f.subNote && <p className="hint">{dt(f.subNote)}</p>}
      </Card>
    </div>
  )
}

export default function Spending() {
  const [view, setView] = useState('state')
  return (
    <>
      <Seg value={view} onChange={setView} options={[[T('Budget de l’État', 'State budget'), 'state'], [T('Par nature', 'By nature'), 'nature'], [T('Par fonction', 'By function'), 'function']]} />
      {view === 'state' && <><StateBudget /><Lfi2026 /></>}
      {view === 'nature' && <ByNature />}
      {view === 'function' && <ByFunction />}
    </>
  )
}
