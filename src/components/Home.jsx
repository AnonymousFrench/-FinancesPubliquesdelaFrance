import React, { useEffect, useRef, useState } from 'react'
import '@fontsource/source-serif-4/latin-700.css'
import { apu } from '../data/apu.js'
import { debtLatest, aft, cofog, cofogMeta } from '../data/data.js'
import { PARTY_COLOR } from '../lib/polls.js'
import { fmt, pct, bn, dateFr } from '../lib/format.js'
import { T, isEn, getLang } from '../i18n.js'
import { dt } from '../data/dataEn.js'
import { withLang } from '../routes.js'

const lp = p => withLang(p, getLang())
const i = apu.years.length - 1
const Y = +apu.years[i]
const Y0 = +apu.years[0]
const FIRST_ROUND = '2027-04-18'
const ROUND_X = 2026 + 107 / 365 // 18 avril 2027 sur l'axe des fins d'année

// Largeur réelle du conteneur, pour dessiner le graphique en pixels (textes lisibles sur téléphone).
function useWidth(fallback) {
  const ref = useRef(null)
  const [w, setW] = useState(fallback)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

// Dette en % du PIB : observé depuis 1995 (fin d'année), dernier trimestre publié, puis éventail des programmes jusqu'en 2032.
function DebtChart({ fan }) {
  const [ref, W] = useWidth(720)
  const narrow = W < 560
  const H = narrow ? 230 : 330
  const L = narrow ? 30 : 42, R = narrow ? 48 : 64, top = 14, bottom = H - 26
  const x1 = 2032, lo = 40, hi = 170
  const X = x => L + (x - Y0) / (x1 - Y0) * (W - L - R)
  const Yv = v => bottom - (v - lo) / (hi - lo) * (bottom - top)
  const path = pts => 'M' + pts.map(([x, v]) => `${X(x).toFixed(1)},${Yv(v).toFixed(1)}`).join('L')
  const hist = apu.years.map((y, k) => [+y, apu.dettePct[k]])
  const q = debtLatest.label.match(/T(\d) (\d{4})/)
  const qx = q ? +q[2] - 1 + +q[1] / 4 : Y + 0.5
  const last = [qx, debtLatest.pct]
  const fy = fan?.years.filter(y => y >= Y + 1) || []
  const k0 = fan ? fan.years.indexOf(fy[0]) : 0
  const at = arr => fy.map((y, k) => [y, arr[k0 + k]])
  // Repères : [année, libellé, position du texte (année, % du PIB)] ; Covid à gauche de la hausse pour ne pas toucher l'étiquette du dernier point.
  const ev = [[2009, T('Crise financière', 'Financial crisis'), 2009, 84.1 + 8], [2020, 'Covid', 2019, 107]]
  const lab = { fontSize: narrow ? 10.5 : 11.5 }
  return (
    <div ref={ref} className="home-chart">
      <svg width={W} height={H} role="img" aria-label={T(`Dette publique : ${pct(apu.dettePct[0], 0)} du PIB en ${Y0}, ${pct(debtLatest.pct, 0)} au ${debtLatest.label}`, `Public debt: ${pct(apu.dettePct[0], 0)} of GDP in ${Y0}, ${pct(debtLatest.pct, 0)} in ${dt(debtLatest.label)}`) + (fan ? T(`, ${pct(fan.base.at(-1), 0)} en 2032 à politique inchangée, ${pct(fan.lo.at(-1), 0)} à ${pct(fan.hi.at(-1), 0)} selon les programmes`, `, ${pct(fan.base.at(-1), 0)} in 2032 under unchanged policy, ${pct(fan.lo.at(-1), 0)} to ${pct(fan.hi.at(-1), 0)} under the programmes`) : '')}>
        {[60, 100, 140].map(v => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={Yv(v)} y2={Yv(v)} className="hc-grid" />
            <text x={L - 6} y={Yv(v)} dy="0.35em" textAnchor="end" className="hc-ax" style={lab}>{narrow ? v : pct(v, 0)}</text>
          </g>
        ))}
        <rect x={X(ROUND_X)} y={top} width={Math.max(0, W - R - X(ROUND_X))} height={bottom - top} className="hc-future" />
        <line x1={X(ROUND_X)} x2={X(ROUND_X)} y1={top} y2={bottom} className="hc-round" />
        <text x={X(ROUND_X) + (narrow ? -6 : 6)} y={top + 12} textAnchor={narrow ? 'end' : 'start'} className="hc-round-t" style={lab}>{narrow ? T('Avril 2027', 'April 2027') : dateFr(FIRST_ROUND)}</text>
        {!narrow && <text x={X(ROUND_X) + 6} y={top + 27} className="hc-ax" style={lab}>{T('premier tour', 'first round')}</text>}
        {fan && <path d={path(at(fan.hi).concat(at(fan.lo).reverse())) + 'Z'} className="hc-fan" />}
        {fan && <path d={path([[Y + 1, fan.base[k0]], ...at(fan.base)])} className="hc-base" />}
        <path d={path(hist.concat([last]))} className="hc-hist" />
        {fan && <path d={path([last, [Y + 1, fan.base[k0]]])} className="hc-est" />}
        <circle cx={X(last[0])} cy={Yv(last[1])} r={5} className="hc-now" />
        <text x={X(last[0]) - 10} y={Yv(last[1]) - 12} textAnchor="end" className="hc-strong" style={{ fontSize: narrow ? 11.5 : 13 }}>{pct(debtLatest.pct, 0)}{narrow ? '' : T(` au ${debtLatest.label}`, ` in ${dt(debtLatest.label)}`)}</text>
        <text x={X(Y0)} y={Yv(apu.dettePct[0]) - 10} className="hc-strong" style={lab}>{pct(apu.dettePct[0], 0)}</text>
        {!narrow && ev.map(([y, t, tx, tv]) => apu.years.includes(String(y)) && <text key={y} x={X(tx) - 6} y={Yv(tv)} textAnchor="end" className="hc-ax" style={lab}>{t}</text>)}
        {fan && <text x={W - R + 6} y={Yv(fan.hi.at(-1))} dy="0.35em" className="hc-hi" style={{ fontSize: narrow ? 11.5 : 13 }}>{pct(fan.hi.at(-1), 0)}</text>}
        {fan && <text x={W - R + 6} y={Yv(fan.lo.at(-1))} dy="0.35em" className="hc-strong" style={{ fontSize: narrow ? 11.5 : 13 }}>{pct(fan.lo.at(-1), 0)}</text>}
        {(narrow ? [Y0, x1] : [Y0, 2010, Y, x1]).map(y => <text key={y} x={X(y)} y={H - 8} textAnchor={y === Y0 ? 'start' : y === x1 ? 'end' : 'middle'} className="hc-ax" style={lab}>{y}</text>)}
      </svg>
    </div>
  )
}

// Où vont 100 € de dépense publique (COFOG) : huit postes, les deux derniers regroupés.
const COFOG_SHORT = {
  'Protection sociale': ['Protection sociale', 'Social protection', '#2148c0'],
  'Santé': ['Santé', 'Health', '#4f6fd6'],
  'Services publics généraux': ['Services généraux', 'General services', '#7a5af8'],
  'Affaires économiques': ['Économie', 'Economy', '#f28c28'],
  'Enseignement': ['Éducation', 'Education', '#2a9d8f'],
  'Défense': ['Défense', 'Defence', '#5f6b7a'],
  'Ordre et sécurité publics': ['Sécurité', 'Public order', '#8a94a3'],
}
function spendShares() {
  const total = cofog.reduce((s, c) => s + c.total, 0)
  const main = cofog.filter(c => COFOG_SHORT[c.name]).map(c => { const [fr, en, color] = COFOG_SHORT[c.name]; return { name: T(fr, en), v: c.total / total * 100, color } })
  const rest = 100 - main.reduce((s, c) => s + c.v, 0)
  return [...main, { name: T('Autres', 'Other'), v: rest, color: '#c3c9d2' }]
}

function Door({ href, kicker, title, children, cta, live }) {
  return (
    <a className="door" href={href}>
      <span className="door-k">{kicker}{live && <span className="door-live">{T('En direct', 'Live')}</span>}</span>
      <span className="door-t">{title}</span>
      {children}
      <span className="door-go">{cta} →</span>
    </a>
  )
}

const valOf = m => m.unit === 'pct' ? pct(m.fr, m.d) : m.unit === 'usd' ? (isEn() ? '$' + fmt(m.fr, 0) : fmt(m.fr, 0) + ' $') : m.unit === 'h' ? fmt(m.fr, 0) + ' h' : fmt(m.fr, m.d)
const euOf = m => m.unit === 'pct' ? pct(m.eu, m.d) : m.unit === 'usd' ? (isEn() ? '$' + fmt(m.eu, 0) : fmt(m.eu, 0) + ' $') : m.unit === 'h' ? fmt(m.eu, 0) + ' h' : fmt(m.eu, m.d)

export default function Home() {
  const [d, setD] = useState(null)
  useEffect(() => {
    let on = true
    import('../lib/homeData.js').then(m => {
      if (!on) return
      setD({ fan: m.debtFan(), polls: m.pollSnapshot(), ind: m.indicators(), pop: m.population(), live: false })
      m.pollLive().then(p => on && setD(s => ({ ...s, polls: p, live: true }))).catch(() => {})
    })
    return () => { on = false }
  }, [])

  const days = Math.ceil((new Date(FIRST_ROUND + 'T00:00:00') - new Date()) / 864e5)
  const ratio = apu.dettePct[i] / apu.dettePct[0]
  const years = Y - Y0
  const headline = ratio > 1.9 && ratio < 2.15
    ? T(`La dette a doublé en ${years === 30 ? 'trente ans' : years + ' ans'}. La présidentielle décidera de la suite.`, `Debt has doubled in ${years === 30 ? 'thirty' : years} years. The presidential election will decide what comes next.`)
    : T(`La dette est passée de ${pct(apu.dettePct[0], 0)} à ${pct(apu.dettePct[i], 0)} du PIB depuis ${Y0}. La présidentielle décidera de la suite.`, `Debt has gone from ${pct(apu.dettePct[0], 0)} to ${pct(apu.dettePct[i], 0)} of GDP since ${Y0}. The presidential election will decide what comes next.`)
  const perHead = d?.pop ? Math.round(debtLatest.total * 1e3 / d.pop / 100) * 100 : null
  const shares = spendShares()
  const top = d?.polls.rows.slice(0, 5) || []
  const max = Math.max(35, ...top.map(r => r.v))

  return (
    <div className="home">
      <section className="home-hero" aria-labelledby="home-h">
        <h2 id="home-h" className="home-h">{headline}</h2>
        <div className="home-hero-row">
          <div className="home-stats">
            <div><b>{bn(debtLatest.total, 0)}</b><span>{T(`dette publique au ${debtLatest.label}, ${pct(debtLatest.pct, 0)} du PIB`, `public debt in ${dt(debtLatest.label)}, ${pct(debtLatest.pct, 0)} of GDP`)}</span></div>
            <div><b>{isEn() ? '€' + fmt(apu.depenses[i] / apu.recettes[i] * 100, 0) : fmt(apu.depenses[i] / apu.recettes[i] * 100, 0) + ' €'}</b><span>{T(`dépensés pour 100 € de recettes en ${Y}`, `spent per €100 of revenue in ${Y}`)}</span></div>
            <div><b>{bn(apu.interets[i], 0)}</b><span>{T(`d’intérêts payés en ${Y}`, `of interest paid in ${Y}`)}</span></div>
            <div><b>{perHead ? (isEn() ? '€' + fmt(perHead, 0) : fmt(perHead, 0) + ' €') : '…'}</b><span>{T('de dette par habitant', 'of debt per resident')}</span></div>
            <a href={lp('/dette')} className="home-more">{T('Dette, taux et financement de l’État', 'Debt, rates and State financing')} →</a>
          </div>
          <figure className="home-fig">
            <figcaption>
              <b>{T(`Dette publique, % du PIB, ${Y0} à 2032`, `Public debt, % of GDP, ${Y0} to 2032`)}</b>
              <span className="home-leg">
                <span><i className="lg-hist" />{T('Observé', 'Actual')}</span>
                <span><i className="lg-base" />{T('Politique inchangée', 'Unchanged policy')}</span>
                <span><i className="lg-fan" />{d ? T(`Selon les ${d.fan.scored} programmes chiffrés`, `Range of the ${d.fan.scored} costed programmes`) : T('Selon les programmes chiffrés', 'Range of the costed programmes')}</span>
              </span>
            </figcaption>
            <DebtChart fan={d?.fan} />
            <p className="home-src">{T('Insee, Eurostat. Projection du site, analyse centrale : illustrative, pas une prévision. Programmes d’Arthaud et Roussel non chiffrés.', 'Insee, Eurostat. Site projection, central review: illustrative, not a forecast. Arthaud’s and Roussel’s programmes are not costed.')} <a href={lp('/presidentielle-2027')}>{T('Méthode et hypothèses', 'Method and assumptions')}</a></p>
          </figure>
        </div>
      </section>

      <section className="doors" aria-label={T('Rubriques', 'Sections')}>
        <Door href={lp('/presidentielle-2027')} kicker={T('Présidentielle 2027', '2027 election') + (days > 0 ? ` · J-${days}` : '')} live={d?.live && !d?.polls.blackout}
          title={T('Qui mène, et que coûte son programme ?', 'Who leads, and what would their programme cost?')} cta={T('Les 12 programmes au même barème', 'All 12 programmes on the same model')}>
          {d?.polls.blackout
            ? <span className="door-note">{T('Sondages suspendus la veille et le jour du scrutin (loi du 19 juillet 1977).', 'Polls are suspended the day before and the day of the vote (law of 19 July 1977).')}</span>
            : <>
              <span className="door-bars">{(d ? top : Array.from({ length: 5 }, (_, k) => ({ name: '', v: 0, k }))).map((r, k) => (
                <span key={r.name || k} className="door-bar"><span>{r.name}</span><span className="db-track"><span style={{ width: `${r.v / max * 100}%`, background: PARTY_COLOR[r.party] || '#9aa4b2' }} /></span><b>{r.v ? pct(r.v, 1) : ''}</b></span>
              ))}</span>
              <span className="door-note">{d ? T(`Moyenne de ${d.polls.n} instituts, premier tour · dernier sondage le ${dateFr(d.polls.last)}`, `Average of ${d.polls.n} pollsters, first round · latest poll ${dateFr(d.polls.last)}`) : T('Chargement des sondages…', 'Loading polls…')}</span>
            </>}
        </Door>

        <Door href={lp('/finances-publiques')} kicker={T('Finances publiques', 'Public finances')}
          title={T('Où vont 100 € de dépense publique ?', 'Where does €100 of public spending go?')} cta={T('Recettes, dépenses, budget ligne par ligne', 'Revenue, spending, the budget line by line')}>
          <span className="door-stack" aria-hidden="true">{shares.map(s => <span key={s.name} style={{ flexGrow: s.v, background: s.color }} />)}</span>
          <span className="door-legend">{shares.slice(0, 6).map(s => (
            <span key={s.name}><span><i style={{ background: s.color }} />{s.name}</span><b>{isEn() ? '€' + fmt(s.v, 0) : fmt(s.v, 0) + ' €'}</b></span>
          ))}</span>
          <span className="door-note">{T(`Dépense des administrations publiques par fonction, ${cofogMeta.year} (Insee).`, `General government spending by function, ${cofogMeta.year} (Insee).`)}</span>
        </Door>

        <Door href={lp('/etat-de-la-france')} kicker={T('État de la France', 'State of France')}
          title={T('Où en est la France face à l’Europe ?', 'How does France compare with the EU?')} cta={T('26 indicateurs depuis 1960, population', '26 indicators since 1960, population')}>
          <span className="door-ind">{(d?.ind || []).map(m => {
            const top = Math.max(m.fr, m.eu) * 1.25
            return (
              <span key={m.id}>
                <span className="di-h"><span>{T(IND_LABEL[m.id][0], IND_LABEL[m.id][1])} · {m.year}</span><span><b>{valOf(m)}</b> <em>{T('UE', 'EU')} {euOf(m)}</em></span></span>
                <span className="di-track"><span style={{ width: `${m.fr / top * 100}%` }} /><i style={{ left: `${m.eu / top * 100}%` }} /></span>
              </span>
            )
          })}</span>
          <span className="door-note">{T('Barre : France. Trait : moyenne de l’UE.', 'Bar: France. Tick: EU average.')}</span>
        </Door>
      </section>
    </div>
  )
}

const IND_LABEL = { unemp: ['Chômage', 'Unemployment'], gdpPcPpp: ['PIB par habitant', 'GDP per person'], hours: ['Heures travaillées par an', 'Hours worked per year'], fertility: ['Fécondité', 'Fertility'] }
