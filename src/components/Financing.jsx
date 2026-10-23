import React, { useState } from 'react'
import { apu } from '../data/apu.js'
import { oat10 } from '../data/taux.js'
import { financing2026, aft, SRC } from '../data/data.js'
import Y10 from '../data/yields.json'
import { Card, Kpi } from './ui.jsx'
import { LineChart, Waterfall } from '../lib/charts.jsx'
import { bn, fmt, pct, monthFr, unitBn } from '../lib/format.js'
import { T } from '../i18n.js'
import { dt } from '../data/dataEn.js'

const years = apu.years.map(Number)
const month = d => { const [y, m] = d.split('-').map(Number); return monthFr(y, m) }

// Autres pays sur le graphique du taux à 10 ans : un clic les ajoute ou les retire (France toujours affichée).
const PEERS = [
  ['DE', 'Allemagne', 'Germany', '#4b5563'], ['IT', 'Italie', 'Italy', '#16a34a'], ['ES', 'Espagne', 'Spain', '#d97706'],
  ['NL', 'Pays-Bas', 'Netherlands', '#ea580c'], ['BE', 'Belgique', 'Belgium', '#9333ea'], ['PT', 'Portugal', 'Portugal', '#0891b2'],
  ['GR', 'Grèce', 'Greece', '#db2777'], ['UK', 'Royaume-Uni', 'United Kingdom', '#7c2d12'], ['US', 'États-Unis', 'United States', '#0f766e'],
  ['JP', 'Japon', 'Japan', '#a16207'],
].filter(([c]) => Y10.series[c]?.length)
const mx = d => +d.slice(0, 4) + (+d.slice(5, 7) - 1) / 12
const SRC_OECD = { label: 'OCDE, taux d’intérêt à long terme (Royaume-Uni, États-Unis, Japon), via la Réserve fédérale de Saint-Louis (FRED)', url: 'https://fred.stlouisfed.org/series/IRLTLT01USM156N' }

export default function Financing() {
  const n = financing2026.needs
  const need = n.reduce((s, x) => s + x.v, 0)
  const pts = oat10.filter(([, v]) => v != null)
  const lo = pts.reduce((a, b) => (b[1] < a[1] ? b : a)), hi = pts.reduce((a, b) => (b[1] > a[1] ? b : a)), last = pts.at(-1)
  const prevHigh = pts.findLast(([, v]) => v >= aft.rate10.v)
  const [on, setOn] = useState({ DE: true, deficit: true })
  const flip = k => setOn(v => ({ ...v, [k]: !v[k] }))
  const de = Y10.series.DE ? new Map(Y10.series.DE) : null
  const spread = de ? pts.filter(([d]) => de.has(d)).map(([d, v]) => [mx(d), +(v - de.get(d)).toFixed(2)]) : []
  const lastSpread = aft.spread.at(-1)
  const chip = (k, label, color, dash) => (
    <button key={k} type="button" className={'ind-key tog' + (dash ? ' dash' : '') + (on[k] ? '' : ' off')} aria-pressed={!!on[k]} onClick={() => flip(k)}>
      <i style={dash ? { background: `repeating-linear-gradient(90deg, ${color} 0 3px, transparent 3px 5px)` } : { background: color }} />{label}
    </button>
  )
  return (
    <>
      <Card title={T('Comment l’État couvre ses besoins 2026', 'How the State covers its 2026 needs')} sub={T('Md€, loi de finances 2026 ; dette négociable de l’État', `${unitBn()}, 2026 budget law; negotiable State debt`)} src={[SRC.lfi2026, SRC.aft]}>
        <Waterfall height={240} fmt={v => fmt(v, v < 10 ? 1 : 0)} items={[
          { label: T('Dette à rembourser', 'Maturing debt'), value: n[0].v, sub: T('obligations à échéance', 'bonds to repay'), color: 'var(--blue)' },
          { label: T('Déficit de l’État', 'State deficit'), value: n[1].v, sub: T('État seul, budget 2026', 'State only, 2026 budget'), color: 'var(--red)' },
          { label: T('Autres besoins', 'Other needs'), value: +(n[2].v + n[3].v).toFixed(1), sub: T('SNCF Réseau, trésorerie', 'SNCF Réseau, cash'), color: 'var(--orange)' },
          { label: T('Besoin total', 'Total need'), value: +need.toFixed(1), kind: 'total', color: 'var(--tx)' },
          { label: T('Émissions', 'Issuance'), value: financing2026.issuance, kind: 'total', sub: T('nettes des rachats', 'net of buybacks'), color: 'var(--green)' },
        ]} />
        <p className="hint">{T(`Plus de la moitié des ${bn(need, 0)} sert à rembourser de la dette ancienne.`, `More than half of the ${bn(need, 0)} only repays old debt.`)}</p>
        <div className="kpis k4">
          <Kpi label={T('Dette négociable, fin sept. 2026', 'Negotiable debt, end Sep 2026')} value={bn(aft.negotiableSep2026, 0)} sub={T(`fin 2024 : ${bn(aft.negotiableEnd2024.oat, 0)} d’obligations (OAT) + ${bn(aft.negotiableEnd2024.btf, 0)} de bons du Trésor (BTF)`, `end 2024: ${bn(aft.negotiableEnd2024.oat, 0)} of bonds (OAT) + ${bn(aft.negotiableEnd2024.btf, 0)} of Treasury bills (BTF)`)} />
          <Kpi label={T('Durée de vie moyenne', 'Average maturity')} value={dt(aft.avgMaturity.v)} sub={dt(aft.avgMaturity.date)} />
          <Kpi label={T('Émissions prévues en 2027', 'Planned issuance in 2027')} value={bn(aft.issuance.at(-1).v, 0)} sub={T(`prévision AFT, contre ${bn(financing2026.issuance, 0)} en 2026`, `AFT forecast, vs ${bn(financing2026.issuance, 0)} in 2026`)} tone="warn" />
          <Kpi label={T('Détenue par des non-résidents', 'Held by non-residents')} value={dt(aft.nonResidents)} sub={T('part de la dette négociable de l’État', 'share of negotiable State debt')} />
        </div>
        <p className="hint"><b>{T('Notation', 'Credit rating')}</b> : {dt(aft.rating)}</p>
      </Card>

      <Card title={T('Le taux qui décide de tout : l’obligation à 10 ans (OAT) depuis 1993', 'The rate that decides everything: the 10-year bond (OAT) since 1993')} sub={T('Moyenne de chaque mois, en % ; cliquez pour comparer avec d’autres pays', 'Monthly average, in %; click to compare with other countries')} src={[SRC.eurostatRates, ...(PEERS.some(p => ['UK', 'US', 'JP'].includes(p[0])) ? [SRC_OECD] : []), SRC.eurostatMain, SRC.bdfTec10]}>
        <div className="chips">
          <span className="ind-key"><i style={{ background: 'var(--blue)', height: 3 }} />France</span>
          {PEERS.map(([c, fr, en, col]) => chip(c, T(fr, en), col))}
          {spread.length > 0 && chip('spread', T('Écart France-Allemagne (points)', 'France-Germany spread (points)'), 'var(--red)', true)}
          {chip('deficit', T('Déficit français, % du PIB', 'French deficit, % of GDP'), '#f1a1a8')}
        </div>
        <LineChart height={320} legend={false}
          series={[
            ...PEERS.filter(([c]) => on[c]).map(([c, fr, en, col]) => ({ name: T(fr, en), color: col, width: 1.4, points: Y10.series[c].map(([d, v]) => [mx(d), v]) })),
            ...(on.spread ? [{ name: T('Écart France-Allemagne', 'France-Germany spread'), color: 'var(--red)', dash: true, width: 1.6, tipFmt: v => `${fmt(v, 2)} pt`, points: spread }] : []),
            { name: 'France', color: 'var(--blue)', width: 2.4, points: pts.map(([d, v]) => [mx(d), v]) },
          ]}
          bars={on.deficit ? { name: T('Déficit, % du PIB', 'Deficit, % of GDP'), color: 'var(--red)', sameScale: true, values: years.map((y, k) => [y + 0.5, -apu.soldePct[k]]) } : undefined}
          axes={{ left: { fmt: v => pct(v, 0), tipFmt: v => pct(v, 2) } }}
          xTicks={[1995, 2000, 2005, 2010, 2015, 2020, 2025]}
          tipX={x => Number.isInteger(x - 0.5) ? `${x - 0.5}` : month(`${Math.floor(x)}-${String(Math.round((x % 1) * 12) + 1).padStart(2, '0')}`)}
          markers={[{ x: 2008.7, label: 'Lehman', side: 'l' }, { x: 2010.3, label: T('Crise grecque', 'Greek crisis'), side: 'r' }, { x: 2015.2, label: T('QE de la BCE', 'ECB QE'), side: 'r' }, { x: 2022.5, label: T('Hausses BCE', 'ECB hikes'), side: 'l' }]}
        />
        <div className="kpis k4">
          <Kpi label={T('Plus bas depuis 1993', 'Lowest since 1993')} value={pct(lo[1], 2)} sub={T(`moyenne de ${month(lo[0])}`, `average of ${month(lo[0])}`)} />
          <Kpi label={T('Plus haut depuis 1993', 'Highest since 1993')} value={pct(hi[1], 2)} sub={T(`moyenne de ${month(hi[0])}`, `average of ${month(hi[0])}`)} />
          <Kpi label={T('Dernier mois publié', 'Latest published month')} value={pct(last[1], 2)} sub={T(`moyenne de ${month(last[0])} (Eurostat)`, `average of ${month(last[0])} (Eurostat)`)} tone="warn" />
          <Kpi label={T('Dernier taux de marché (TEC 10)', 'Latest market rate (TEC 10)')} value={pct(aft.rate10.v, 2)} sub={T(`le ${aft.rate10.date} (Banque de France)${prevHigh ? `, au-dessus de toute moyenne mensuelle depuis ${month(prevHigh[0])}` : ''}`, `on ${dt(aft.rate10.date)} (Banque de France)${prevHigh ? `, above every monthly average since ${month(prevHigh[0])}` : ''}`)} tone="bad" />
        </div>
        {lastSpread && <p className="hint">{T(`Dernier écart connu avec l’Allemagne : ${lastSpread[1]}, ${lastSpread[0]}. Les courbes mensuelles s’arrêtent au dernier mois publié.`, `Latest known spread over Germany: ${dt(lastSpread[1])}, ${dt(lastSpread[0])}. Monthly lines stop at the latest published month.`)}</p>}
      </Card>

      <Card title={T('Émissions à moyen et long terme', 'Medium and long-term issuance')} sub={T('Md€, nettes des rachats', `${unitBn()}, net of buybacks`)} src={SRC.aft}>
        <div className="emissions">
          {aft.issuance.map(e => (
            <div key={e.year} className="emi">
              <div className="emi-bar" style={{ height: `${e.v / 380 * 100}%`, background: e.tag === 'réalisé' ? 'var(--blue)' : e.tag === 'programme' ? '#7a8cff' : '#b8c0cc' }}><span className="emi-v">{fmt(e.v, 0)}</span></div>
              <div className="emi-y">{e.year}</div><div className="emi-tag">{dt(e.tag)}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
