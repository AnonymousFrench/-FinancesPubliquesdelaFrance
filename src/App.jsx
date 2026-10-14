import React, { useEffect, useState } from 'react'
import Overview from './components/Overview.jsx'
import Revenue from './components/Revenue.jsx'
import Spending from './components/Spending.jsx'
import Debt from './components/Debt.jsx'
import Financing from './components/Financing.jsx'
import MapView from './components/MapView.jsx'
import Election from './components/Election.jsx'
import { apu } from './data/apu.js'
import { debtLatest } from './data/data.js'
import { fmt, pct } from './lib/format.js'

const i = apu.years.length - 1
const TABS = [
  ['overview', 'Overview', Overview], ['revenue', 'Revenue', Revenue], ['spending', 'Spending', Spending],
  ['debt', 'Debt', Debt], ['financing', 'Financing', Financing], ['map', 'Map', MapView], ['election', 'Election 2027', Election],
]

class Boundary extends React.Component {
  state = { err: null }
  static getDerivedStateFromError(err) { return { err } }
  render() {
    if (!this.state.err) return this.props.children
    return (
      <section className="card errb">
        <h3>This view could not be displayed</h3>
        <p className="sub">{String(this.state.err?.message || this.state.err)}</p>
        <button className="btn" onClick={() => this.setState({ err: null })}>Try again</button>
      </section>
    )
  }
}

const fromHash = () => TABS.some(t => t[0] === location.hash.slice(1)) ? location.hash.slice(1) : 'overview'

export default function App() {
  const [t, setT] = useState(fromHash)
  useEffect(() => { const f = () => setT(fromHash()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  const go = id => { history.replaceState(null, '', '#' + id); setT(id); scrollTo({ top: 0 }) }
  const [, , View] = TABS.find(x => x[0] === t)
  return (
    <div className="app">
      <header>
        <div>
          <h1><span className="flag" aria-hidden="true"><i /><i /><i /></span>France public finances</h1>
          <div className="banner">
            <span>Spending <b>€{fmt(apu.depenses[i], 0)}bn</b> {pct(apu.depensesPct[i])} of GDP</span>
            <span>Revenue <b className="good">€{fmt(apu.recettes[i], 0)}bn</b> {pct(apu.recettesPct[i])}</span>
            <span>Deficit <b className="bad">−€{fmt(-apu.solde[i])}bn</b> {pct(-apu.soldePct[i])}</span>
            <span>Debt <b className="bad">€{fmt(debtLatest.total, 0)}bn</b> {pct(debtLatest.pct)} ({debtLatest.label})</span>
            <span>Interest <b>€{fmt(apu.interets[i])}bn</b> ≈ €{Math.round(apu.interets[i] * 1000 / 365)}m a day</span>
          </div>
        </div>
        <div className="h-r">General government, {apu.years[i]} accounts unless stated<br />Eurostat · Insee · AFT · data.economie.gouv.fr</div>
      </header>
      <nav>{TABS.map(([id, label]) => <button key={id} className={(id === t ? 'on' : '') + (id === 'election' ? ' new' : '')} onClick={() => go(id)}>{label}</button>)}</nav>
      <main><Boundary key={t}><View /></Boundary></main>
      <footer>
        Official sources: Eurostat (general government accounts, debt, long-term rates), Insee (2025 accounts, quarterly debt, COFOG), Agence France Trésor, data.economie.gouv.fr (PLF 2025 by mission, programme and action), 2026 budget law. Some ratios and residuals are computed and labelled as such on each card. Independent site, not official statistics.
      </footer>
    </div>
  )
}
