import React, { useEffect, useRef, useState } from 'react'
import { THEMES, COUNT, series } from '../data/etat.js'
import { Card } from './ui.jsx'
import { fmt, pct, signed } from '../lib/format.js'
import { T, isEn } from '../i18n.js'

const FR_C = 'var(--blue)', EU_C = '#9aa4b2', US_C = '#e08a2c', CN_C = '#c8102e', PAIR_C = 'var(--red)'
const L = (fr, en) => T(fr, en)

// Largeur réelle du conteneur (sans minimum, pour les cartes étroites).
function useBox(fallback) {
  const ref = useRef(null)
  const [w, setW] = useState(fallback)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(60, Math.round(e.contentRect.width))))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}
const pts = o => o ? Object.entries(o).map(([y, v]) => [+y, v]).sort((a, b) => a[0] - b[0]) : []

// Valeur formatée selon l'unité de l'indicateur.
function val(m, v) {
  if (v == null) return '–'
  if (m.unit === 'pct') return pct(v, m.d)
  if (m.unit === 'eur') return isEn() ? '€' + fmt(v, m.d) : fmt(v, m.d) + ' €'
  if (m.unit === 'usd') return isEn() ? '$' + fmt(v, m.d) : fmt(v, m.d) + ' $'
  return fmt(v, m.d)
}
// Écart depuis le début de la série : en points pour les taux, en % pour les niveaux.
function delta(m, a, b) {
  if (m.unit === 'pct') return `${signed(b - a, Math.abs(b - a) >= 10 ? 0 : m.d === 2 ? 2 : 1)} pt`
  if (m.suffix?.[0] === '‰') return `${signed(b - a)} pt`
  const g = (b / a - 1) * 100
  return (g >= 0.5 ? '+' : '') + pct(g, 0)
}
const tone = (m, a, b) => !m.good || Math.abs(b - a) < 1e-9 ? 'mut' : (b - a) * m.good > 0 ? 'dn' : 'up'

// Mini-courbe : France en trait plein, UE à 27 en pointillé, États-Unis en orange, Chine en rouge. Survol : lecture de l'année.
function Trend({ fr, eu, us, cn, pair, zero, onHover, hover }) {
  const [ref, W] = useBox(180)
  const H = 46, pad = 3
  const all = [...fr, ...eu, ...us, ...cn, ...pair]
  if (fr.length < 2) return <div ref={ref} />
  const x0 = Math.min(...all.map(p => p[0])), x1 = Math.max(...all.map(p => p[0]))
  let lo = Math.min(...all.map(p => p[1])), hi = Math.max(...all.map(p => p[1]))
  if (zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0) }
  const X = x => pad + (x - x0) / (x1 - x0 || 1) * (W - 2 * pad)
  const Y = v => H - pad - (v - lo) / (hi - lo || 1) * (H - 2 * pad)
  const d = p => p.length ? 'M' + p.map(([x, v]) => `${X(x).toFixed(1)},${Y(v).toFixed(1)}`).join('L') : ''
  const move = e => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = x0 + ((e.clientX - r.left) / r.width * W - pad) / (W - 2 * pad) * (x1 - x0)
    onHover(Math.max(x0, Math.min(x1, Math.round(x))))
  }
  const last = fr.at(-1)
  const hv = hover != null && fr.find(p => p[0] === hover)
  return (
    <div ref={ref} className="ind-trend">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} onPointerMove={move} onPointerDown={move} onPointerLeave={() => onHover(null)}>
        {zero && lo < 0 && <line x1={pad} x2={W - pad} y1={Y(0)} y2={Y(0)} className="ind-zero" />}
        {eu.length > 1 && <path d={d(eu)} fill="none" stroke={EU_C} strokeWidth={1.3} strokeDasharray="3 2" />}
        {us.length > 1 && <path d={d(us)} fill="none" stroke={US_C} strokeWidth={1.3} />}
        {cn.length > 1 && <path d={d(cn)} fill="none" stroke={CN_C} strokeWidth={1.3} />}
        {pair.length > 1 && <path d={d(pair)} fill="none" stroke={PAIR_C} strokeWidth={1.6} />}
        <path d={d(fr)} fill="none" stroke={FR_C} strokeWidth={1.9} strokeLinejoin="round" />
        <circle cx={X(last[0])} cy={Y(last[1])} r={2.6} fill={FR_C} />
        {hover != null && <line x1={X(hover)} x2={X(hover)} y1={0} y2={H} className="ind-cursor" />}
        {hv && <circle cx={X(hv[0])} cy={Y(hv[1])} r={2.6} fill={FR_C} />}
      </svg>
    </div>
  )
}

function Indicator({ m, show }) {
  const [hover, setHover] = useState(null)
  const s = series(m.id) || {}
  const fr = pts(s.fr)
  if (!fr.length) return null
  // Comparaisons limitées à la période couverte par la série française.
  const span = p => p.filter(q => q[0] >= fr[0][0])
  const eu = show.eu ? span(pts(s.eu)) : [], us = show.us ? span(pts(s.us)) : [], cn = show.cn ? span(pts(s.cn)) : [], pair = m.pair ? span(pts(series(m.pair)?.fr)) : []
  const first = fr[0], last = fr.at(-1)
  const at = (p, y) => p.find(q => q[0] === y)?.[1]
  const latest = s.latest // dernier trimestre publié (chômage)
  const qLabel = latest && (isEn() ? latest.period.replace(/(\d{4})-Q(\d)/, 'Q$2 $1') : latest.period.replace(/(\d{4})-Q(\d)/, 'T$2 $1'))
  const head = latest ? latest.v : last[1]
  const avg = m.avg && fr.length > 10 ? fr.slice(-10).reduce((a, p) => a + p[1], 0) / 10 : null
  const suffix = m.suffix && L(m.suffix[0], m.suffix[1])
  // Comparaisons : dernière valeur (ou année survolée) de l'UE, des États-Unis et de la Chine.
  const cmp = y => {
    const v = p => y == null ? p.at(-1)?.[1] : at(p, y)
    const e = v(eu), u = v(us), c = v(cn)
    // Taux sans le signe % (l'unité figure déjà sur la valeur principale) pour tenir sur une ligne.
    const cv = x => m.unit === 'pct' ? fmt(x, m.d) : val(m, x)
    return <>{e != null && <span>{L('UE', 'EU')} {cv(e)}</span>}{u != null && <span className="us">USA {cv(u)}</span>}{c != null && <span className="cn">{L('Chine', 'China')} {cv(c)}</span>}</>
  }
  const line1 = hover != null
    ? <><b>{hover}</b><span className="fr">{val(m, at(fr, hover))}</span>{pair.length ? <i className="up">{L('décès', 'deaths')} {val(m, at(pair, hover))}</i> : null}{cmp(hover)}</>
    : pair.length ? <><span className="fr">{L('naissances', 'births')}</span><i className="up">{L('décès', 'deaths')} {val(m, pair.at(-1)[1])}</i></> : cmp(null)
  const Tag = m.link ? 'a' : 'div'
  return (
    <Tag className="ind" href={m.link}>
      <div className="ind-h"><span>{L(m.fr, m.en)}</span><em>{latest ? qLabel : last[0]}</em></div>
      <div className="ind-v">
        <b>{val(m, head)}</b>{suffix && <small>{suffix}</small>}
        {avg != null
          ? <span className="ind-d mut">{L('moy. 10 ans', '10-yr avg')} {val(m, avg)}</span>
          : <span className={'ind-d ' + tone(m, first[1], last[1])}>{delta(m, first[1], last[1])} {L('depuis', 'since')} {first[0]}</span>}
      </div>
      <Trend fr={fr} eu={eu} us={us} cn={cn} pair={pair} zero={m.zero} hover={hover} onHover={setHover} />
      <div className="ind-f ind-c">{line1}</div>
      <div className="ind-f">{L(m.note[0], m.note[1])}</div>
    </Tag>
  )
}

// Sources regroupées par producteur, chaque jeu de données lié.
function Sources() {
  const all = [...new Map(THEMES.flatMap(t => t.items.flatMap(m => [m.src, m.srcEu, m.srcUs].filter(Boolean))).map(x => [x.url, x])).values()]
  const groups = [
    ['Eurostat', 'Eurostat', x => x.label.startsWith('Eurostat'), x => x.label.replace('Eurostat ', '')],
    ['Banque mondiale', 'World Bank', x => x.label.startsWith('Banque'), x => x.label.replace('Banque mondiale, WDI ', '')],
    ['Insee', 'Insee', x => x.label.startsWith('Insee'), x => x.label.replace('Insee, série ', '')],
    ['FMI', 'IMF', x => x.label.startsWith('FMI'), x => x.label.replace('FMI ', '')],
    ['Réserve fédérale', 'Federal Reserve', x => x.label.startsWith('Réserve'), x => x.label.replace('Réserve fédérale ', '')],
  ]
  const un = <a href="https://population.un.org/wpp/" target="_blank" rel="noreferrer">World Population Prospects</a>
  return (
    <p className="src">{T('Sources : ', 'Sources: ')}{groups.map(([fr, en, f, short], k) => (
      <React.Fragment key={fr}>{k > 0 && ' · '}{T(fr, en)} ({all.filter(f).map((x, i) => <React.Fragment key={x.url}>{i > 0 && ', '}<a href={x.url} target="_blank" rel="noreferrer">{short(x)}</a></React.Fragment>)})</React.Fragment>
    ))}{T('. Dette et dépense publiques de la France : comptes des administrations publiques (Eurostat).', '. French public debt and spending: general government accounts (Eurostat).')} {T('Chine : séries des organisations internationales (Banque mondiale, FMI ; chômage modélisé par l’OIT ; démographie estimée par les Nations unies, ', 'China: series from international organisations (World Bank, IMF; unemployment modelled by the ILO; population estimated by the United Nations, ')}{un}{T('). PIB, prix et échanges reposent sur les comptes nationaux chinois ; plusieurs estimations indépendantes jugent la croissance officielle surévaluée.', '). GDP, prices and trade rest on Chinese national accounts; several independent estimates consider official growth overstated.')}</p>
  )
}

export default function Etat() {
  // Comparaisons affichées : clic sur la légende pour masquer ou réafficher l’UE, les États-Unis ou la Chine.
  const [show, setShow] = useState({ eu: true, us: true, cn: false })
  const toggle = k => setShow(v => ({ ...v, [k]: !v[k] }))
  return (
    <Card title={T('L’état de la France en chiffres', 'France in figures')}
      sub={<>{T(`${COUNT} indicateurs macroéconomiques sur longue période.`, `${COUNT} macroeconomic indicators over the long run.`)} <span className="ind-key"><i style={{ background: FR_C }} />France</span> <button type="button" className={'ind-key dash tog' + (show.eu ? '' : ' off')} aria-pressed={show.eu} onClick={() => toggle('eu')}><i />{T('Union européenne à 27', 'EU-27')}</button> <button type="button" className={'ind-key tog' + (show.us ? '' : ' off')} aria-pressed={show.us} onClick={() => toggle('us')}><i style={{ background: US_C }} />USA</button> <button type="button" className={'ind-key tog' + (show.cn ? '' : ' off')} aria-pressed={show.cn} onClick={() => toggle('cn')}><i style={{ background: CN_C }} />{T('Chine', 'China')}</button></>}>
      <div className="etat">
        {THEMES.map(t => (
          <section key={t.id} className="etat-t" style={{ flexGrow: t.items.length, flexBasis: t.items.length * 184 }}>
            <h4>{T(t.fr, t.en)}</h4>
            <div className="inds" style={{ '--n': t.items.length }}>{t.items.map(m => <Indicator key={m.id} m={m} show={show} />)}</div>
          </section>
        ))}
      </div>
      <Sources />
    </Card>
  )
}
