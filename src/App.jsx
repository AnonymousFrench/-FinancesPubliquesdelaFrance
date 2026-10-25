import React, { Suspense, lazy, useEffect, useState } from 'react'
import Home from './components/Home.jsx'
import { apu } from './data/apu.js'
import { debtLatest } from './data/data.js'
import { ROUTES, SECTIONS, ALIAS, routeOf, rLabel, rTitle, rDescription, sLabel, siteName, langOf, withLang } from './routes.js'
import { fmt, pct, bn } from './lib/format.js'
import { T, getLang, setLang } from './i18n.js'
import { Analytics } from '@vercel/analytics/react'
import { track } from './lib/track.js'

const i = apu.years.length - 1
// Chaque onglet est chargé à la demande : la première page reste légère.
const VIEWS = {
  accueil: Home,
  synthese: lazy(() => import('./components/Overview.jsx')),
  recettes: lazy(() => import('./components/Revenue.jsx')),
  depenses: lazy(() => import('./components/Spending.jsx')),
  dette: lazy(() => import('./components/DebtFinancing.jsx')),
  financement: lazy(() => import('./components/DebtFinancing.jsx')),
  presidentielle: lazy(() => import('./components/Election.jsx')),
  sondages: lazy(() => import('./components/Polls.jsx')),
  etat: lazy(() => import('./components/Etat.jsx')),
  population: lazy(() => import('./components/Immigration.jsx')),
  immigration: lazy(() => import('./components/Immigration.jsx')),
}

class Boundary extends React.Component {
  state = { err: null }
  static getDerivedStateFromError(err) { return { err } }
  render() {
    if (!this.state.err) return this.props.children
    return (
      <section className="card errb">
        <h3>{T('Cette vue n’a pas pu s’afficher', 'This view could not be displayed')}</h3>
        <p className="sub">{String(this.state.err?.message || this.state.err)}</p>
        <button className="btn" onClick={() => this.setState({ err: null })}>{T('Réessayer', 'Try again')}</button>
      </section>
    )
  }
}

function setMeta(r) {
  document.title = r.path === '/' ? rTitle(r) : `${rTitle(r)} | ${siteName()}`
  document.querySelector('meta[name="description"]')?.setAttribute('content', rDescription(r))
  const canon = document.querySelector('link[rel="canonical"]')
  if (canon) canon.setAttribute('href', new URL(withLang(r.path, getLang()), canon.href).href)
}

// Drapeaux du sélecteur de langue.
const FlagFR = () => <svg viewBox="0 0 3 2" width="20" height="14" aria-hidden="true"><rect width="1" height="2" fill="#000091" /><rect x="1" width="1" height="2" fill="#fff" /><rect x="2" width="1" height="2" fill="#e1000f" /></svg>
const FlagEN = () => (
  <svg viewBox="0 0 60 40" width="20" height="14" aria-hidden="true">
    <rect width="60" height="40" fill="#012169" />
    <path d="M0 0l60 40M60 0L0 40" stroke="#fff" strokeWidth="8" />
    <path d="M0 0l60 40M60 0L0 40" stroke="#c8102e" strokeWidth="3" />
    <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="13" />
    <path d="M30 0v40M0 20h60" stroke="#c8102e" strokeWidth="8" />
  </svg>
)

export default function App() {
  const [route, setRoute] = useState(() => routeOf(location.pathname) || ROUTES[0])
  // Langue : l'adresse fait foi (/en/...). Ancien paramètre ?lang=en et préférence enregistrée redirigés vers la bonne adresse.
  const [lang, setLangState] = useState(() => {
    const q = new URLSearchParams(location.search).get('lang')
    const stored = getLang()
    const l = langOf(location.pathname) === 'en' ? 'en' : q === 'en' || q === 'fr' ? q : stored
    setLang(l)
    const r = routeOf(location.pathname) || ROUTES[0]
    const want = withLang(r.path, l)
    const sp = new URLSearchParams(location.search); sp.delete('lang')
    const search = sp.toString() ? '?' + sp : ''
    if (want !== location.pathname || q) history.replaceState(null, '', want + search + location.hash)
    return l
  })
  const switchLang = l => { if (l !== lang) track('Langue', { langue: l }); setLang(l); setLangState(l); history.pushState(null, '', withLang(route.path, l) + location.search) }

  useEffect(() => {
    // Anciennes adresses en #ancre -> vraie page.
    const h = location.hash.slice(1)
    if (ALIAS[h]) { history.replaceState(null, '', withLang(ALIAS[h], getLang())); setRoute(routeOf(ALIAS[h])) }
    const onPop = () => {
      const l = langOf(location.pathname)
      if (l !== getLang()) { setLang(l); setLangState(l) }
      setRoute(routeOf(location.pathname) || ROUTES[0])
    }
    // Navigation interne sans rechargement pour tous les liens du site.
    const onClick = e => {
      const out = e.target.closest('a[href^="http"]')
      if (out) { try { const u = new URL(out.href); if (u.hostname !== location.hostname) track('Lien externe', { site: u.hostname }) } catch { /* adresse invalide */ } }
      const a = e.target.closest('a[href^="/"]')
      if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return
      const r = routeOf(a.getAttribute('href'))
      if (!r) return
      e.preventDefault()
      history.pushState(null, '', withLang(r.path, getLang()))
      setRoute(r)
      scrollTo({ top: 0 })
    }
    // Une vue qui change elle-même l'adresse (fiche candidat) le signale pour mettre à jour le titre et la langue.
    const onRoute = () => setRoute(routeOf(location.pathname) || ROUTES[0])
    addEventListener('popstate', onPop); document.addEventListener('click', onClick); addEventListener('routechange', onRoute)
    return () => { removeEventListener('popstate', onPop); document.removeEventListener('click', onClick); removeEventListener('routechange', onRoute) }
  }, [])
  useEffect(() => setMeta(route), [route, lang])

  const View = VIEWS[route.id]
  return (
    <div className="app">
      <header>
        <a href={withLang('/', lang)} className="brand"><span className="flag" aria-hidden="true"><i /><i /><i /></span>{siteName()}</a>
        <span className="langs" role="group" aria-label={T('Langue', 'Language')}>
          <button className={lang === 'fr' ? 'on' : ''} onClick={() => switchLang('fr')} title="Français" aria-label="Français" aria-pressed={lang === 'fr'}><FlagFR /></button>
          <button className={lang === 'en' ? 'on' : ''} onClick={() => switchLang('en')} title="English" aria-label="English" aria-pressed={lang === 'en'}><FlagEN /></button>
        </span>
        {route.id !== 'accueil' && <div className="banner">
          <span>{T('Dépenses', 'Spending')} <b>{bn(apu.depenses[i], 0)}</b> {pct(apu.depensesPct[i])} {T('du PIB', 'of GDP')}</span>
          <span>{T('Recettes', 'Revenue')} <b className="good">{bn(apu.recettes[i], 0)}</b></span>
          <span>{T('Déficit', 'Deficit')} <b className="bad">{pct(-apu.soldePct[i])}</b></span>
          <span>{T('Dette', 'Debt')} <b className="bad">{bn(debtLatest.total, 0)}</b> {pct(debtLatest.pct)}</span>
          <span>{T('Intérêts', 'Interest')} <b>{bn(apu.interets[i])}</b></span>
        </div>}
      </header>
      <nav aria-label={T('Rubriques', 'Sections')}>
        {SECTIONS.map(x => <a key={x.id} href={withLang(x.path, lang)} className={x.id === route.section ? 'on' : ''} aria-current={x.id === route.section ? 'page' : undefined}>{sLabel(x)}</a>)}
      </nav>
      {ROUTES.filter(r => r.section === route.section).length > 1 && (
        <nav className="subnav" aria-label={sLabel(SECTIONS.find(x => x.id === route.section))}>
          {ROUTES.filter(r => r.section === route.section && !r.inside).map(r => { const on = r.id === route.id || route.inside === r.id; return <a key={r.id} href={withLang(r.path, lang)} className={(on ? 'on' : '') + (r.badge ? ' ' + r.badge : '')} aria-current={on ? 'page' : undefined}>{rLabel(r)}</a> })}
        </nav>
      )}
      <main key={lang}>
        <h1 className="sr-only">{rTitle(route)}</h1>
        <Boundary key={route.id}><Suspense fallback={<div className="card loading">{T('Chargement…', 'Loading…')}</div>}><View route={route} /></Suspense></Boundary>
      </main>
      <footer className="disclaimer"><span>{T('Site indépendant, sans lien avec un parti. Projections illustratives, non des prévisions.', 'Independent site, not affiliated with any party. Projections are illustrative, not forecasts.')}</span><a href="https://www.linkedin.com/in/thibaultmaillet/" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true" style={{ verticalAlign: '-1px', marginRight: 4 }}><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>Contact</a></footer>
      <Analytics />
    </div>
  )
}
