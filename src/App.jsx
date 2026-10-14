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
      <footer className="disclaimer">Site indépendant, sans lien avec un parti. Projections illustratives, non des prévisions. Hébergement : Vercel Inc., Covina (CA), États-Unis. · <a href="https://www.linkedin.com/in/thibaultmaillet/" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true" style={{ verticalAlign: '-1px', marginRight: 4 }}><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>Contact</a></footer>
    </div>
  )
}
