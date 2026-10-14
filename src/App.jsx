import React, { Suspense, lazy, useEffect, useState } from 'react'
import Overview from './components/Overview.jsx'
import { apu } from './data/apu.js'
import { debtLatest } from './data/data.js'
import { ROUTES, SECTIONS, ALIAS, SITE_NAME, routeOf } from './routes.js'
import { fmt, pct } from './lib/format.js'

const i = apu.years.length - 1
// Chaque onglet est chargé à la demande : la première page reste légère.
const VIEWS = {
  synthese: Overview,
  recettes: lazy(() => import('./components/Revenue.jsx')),
  depenses: lazy(() => import('./components/Spending.jsx')),
  dette: lazy(() => import('./components/Debt.jsx')),
  financement: lazy(() => import('./components/Financing.jsx')),
  presidentielle: lazy(() => import('./components/Election.jsx')),
  sondages: lazy(() => import('./components/Polls.jsx')),
}

class Boundary extends React.Component {
  state = { err: null }
  static getDerivedStateFromError(err) { return { err } }
  render() {
    if (!this.state.err) return this.props.children
    return (
      <section className="card errb">
        <h3>Cette vue n’a pas pu s’afficher</h3>
        <p className="sub">{String(this.state.err?.message || this.state.err)}</p>
        <button className="btn" onClick={() => this.setState({ err: null })}>Réessayer</button>
      </section>
    )
  }
}

function setMeta(r) {
  document.title = r.path === '/' ? r.title : `${r.title} | ${SITE_NAME}`
  document.querySelector('meta[name="description"]')?.setAttribute('content', r.description)
  const canon = document.querySelector('link[rel="canonical"]')
  if (canon) canon.setAttribute('href', new URL(r.path, canon.href).href)
}

export default function App() {
  const [route, setRoute] = useState(() => routeOf(location.pathname) || ROUTES[0])

  useEffect(() => {
    // Anciennes adresses en #ancre -> vraie page.
    const h = location.hash.slice(1)
    if (ALIAS[h]) { history.replaceState(null, '', ALIAS[h]); setRoute(routeOf(ALIAS[h])) }
    const onPop = () => setRoute(routeOf(location.pathname) || ROUTES[0])
    // Navigation interne sans rechargement pour tous les liens du site.
    const onClick = e => {
      const a = e.target.closest('a[href^="/"]')
      if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return
      const r = routeOf(a.getAttribute('href'))
      if (!r) return
      e.preventDefault()
      history.pushState(null, '', r.path)
      setRoute(r)
      scrollTo({ top: 0 })
    }
    addEventListener('popstate', onPop); document.addEventListener('click', onClick)
    return () => { removeEventListener('popstate', onPop); document.removeEventListener('click', onClick) }
  }, [])
  useEffect(() => setMeta(route), [route])

  const View = VIEWS[route.id]
  return (
    <div className="app">
      <header>
        <a href="/" className="brand"><span className="flag" aria-hidden="true"><i /><i /><i /></span>{SITE_NAME}</a>
        <div className="banner">
          <span>Dépenses <b>{fmt(apu.depenses[i], 0)} Md€</b> {pct(apu.depensesPct[i])} du PIB</span>
          <span>Recettes <b className="good">{fmt(apu.recettes[i], 0)} Md€</b></span>
          <span>Déficit <b className="bad">{pct(-apu.soldePct[i])}</b></span>
          <span>Dette <b className="bad">{fmt(debtLatest.total, 0)} Md€</b> {pct(debtLatest.pct)}</span>
          <span>Intérêts <b>{fmt(apu.interets[i])} Md€</b></span>
          <span className="banner-src">{apu.years[i]} · Eurostat, Insee, AFT</span>
        </div>
      </header>
      <nav aria-label="Rubriques">
        {SECTIONS.map(x => <a key={x.id} href={x.path} className={(x.id === route.section ? 'on' : '') + (x.badge ? ' ' + x.badge : '')} aria-current={x.id === route.section ? 'page' : undefined}>{x.label}</a>)}
      </nav>
      {route.section === 'finances' && (
        <nav className="subnav" aria-label="Finances publiques">
          {ROUTES.filter(r => r.section === 'finances').map(r => <a key={r.id} href={r.path} className={r.id === route.id ? 'on' : ''} aria-current={r.id === route.id ? 'page' : undefined}>{r.label}</a>)}
        </nav>
      )}
      <main>
        <h1 className="sr-only">{route.title}</h1>
        <Boundary key={route.id}><Suspense fallback={<div className="card loading">Chargement…</div>}><View /></Suspense></Boundary>
      </main>
    </div>
  )
}
