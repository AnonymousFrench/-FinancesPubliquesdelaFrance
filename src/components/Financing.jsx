import React from 'react'
import { apu } from '../data/apu.js'
import { oat10 } from '../data/taux.js'
import { financing2026, aft, SRC } from '../data/data.js'
import { Card, Kpi } from './ui.jsx'
import { LineChart, Waterfall } from '../lib/charts.jsx'
import { bn, fmt, pct, monthFr, unitBn } from '../lib/format.js'
import { T } from '../i18n.js'
import { dt } from '../data/dataEn.js'
import { withLang } from '../routes.js'
import { getLang } from '../i18n.js'

const lp = p => withLang(p, getLang())

const years = apu.years.map(Number)
const month = d => { const [y, m] = d.split('-').map(Number); return monthFr(y, m) }

export default function Financing() {
  const n = financing2026.needs
  const need = n.reduce((s, x) => s + x.v, 0)
  const pts = oat10.filter(([, v]) => v != null)
  const lo = pts.reduce((a, b) => (b[1] < a[1] ? b : a)), hi = pts.reduce((a, b) => (b[1] > a[1] ? b : a)), last = pts.at(-1)
  const prevHigh = pts.findLast(([, v]) => v >= aft.rate10.v)
  return (
    <>
      <Card title={T('Comment l’État couvre ses besoins 2026', 'How the State covers its 2026 needs')} sub={T('Md€, loi de finances 2026', `${unitBn()}, 2026 budget law`)} src={SRC.lfi2026}>
        <Waterfall height={240} fmt={v => fmt(v, v < 10 ? 1 : 0)} items={[
          { label: T('Dette à rembourser', 'Maturing debt'), value: n[0].v, sub: T('obligations à échéance', 'bonds to repay'), color: 'var(--blue)' },
          { label: T('Déficit de l’État', 'State deficit'), value: n[1].v, sub: T('État seul, budget 2026', 'State only, 2026 budget'), color: 'var(--red)' },
          { label: T('Autres besoins', 'Other needs'), value: +(n[2].v + n[3].v).toFixed(1), sub: T('SNCF Réseau, trésorerie', 'SNCF Réseau, cash'), color: 'var(--orange)' },
          { label: T('Besoin total', 'Total need'), value: +need.toFixed(1), kind: 'total', color: 'var(--tx)' },
          { label: T('Émissions', 'Issuance'), value: financing2026.issuance, kind: 'total', sub: T('nettes des rachats', 'net of buybacks'), color: 'var(--green)' },
        ]} />
        <p className="hint">{T(`Plus de la moitié des ${bn(need, 0)} sert à rembourser de la dette ancienne.`, `More than half of the ${bn(need, 0)} only repays old debt.`)}</p>
      </Card>

      <Card title={T('Le taux qui décide de tout : l’obligation à 10 ans (OAT) depuis 1993', 'The rate that decides everything: the 10-year bond (OAT) since 1993')} sub={T('Taux annuel, moyenne de chaque mois (courbe) ; déficit public en % du PIB (barres)', 'Annual rate, average of each month (line); public deficit as % of GDP (bars)')} src={[SRC.eurostatRates, SRC.eurostatMain, SRC.bdfTec10]}>
        <LineChart height={300}
          series={[{ name: T('Taux à 10 ans', '10-year yield'), color: 'var(--blue)', points: pts.map(([d, v]) => [+d.slice(0, 4) + (+d.slice(5, 7) - 1) / 12, v]) }]}
          bars={{ name: T('Déficit, % du PIB', 'Deficit, % of GDP'), color: 'var(--red)', sameScale: true, values: years.map((y, k) => [y + 0.5, -apu.soldePct[k]]) }}
          axes={{ left: { fmt: v => pct(v, 0), tipFmt: v => pct(v, 2) } }}
          xTicks={[1995, 2000, 2005, 2010, 2015, 2020, 2025]}
          tipX={x => Number.isInteger(x - 0.5) ? `${x - 0.5}` : month(`${Math.floor(x)}-${String(Math.round((x % 1) * 12) + 1).padStart(2, '0')}`)}
          markers={[{ x: 2008.7, label: 'Lehman', side: 'l' }, { x: 2015.2, label: T('QE de la BCE', 'ECB QE'), side: 'r' }, { x: 2022.5, label: T('Hausses BCE', 'ECB hikes'), side: 'l' }]}
        />
        <div className="kpis k4">
          <Kpi label={T('Plus bas depuis 1993', 'Lowest since 1993')} value={pct(lo[1], 2)} sub={T(`moyenne de ${month(lo[0])}`, `average of ${month(lo[0])}`)} />
          <Kpi label={T('Plus haut depuis 1993', 'Highest since 1993')} value={pct(hi[1], 2)} sub={T(`moyenne de ${month(hi[0])}`, `average of ${month(hi[0])}`)} />
          <Kpi label={T('Dernier mois publié', 'Latest published month')} value={pct(last[1], 2)} sub={T(`moyenne de ${month(last[0])} (Eurostat)`, `average of ${month(last[0])} (Eurostat)`)} tone="warn" />
          <Kpi label={T('Dernier taux de marché (TEC 10)', 'Latest market rate (TEC 10)')} value={pct(aft.rate10.v, 2)} sub={T(`le ${aft.rate10.date} (Banque de France)${prevHigh ? `, au-dessus de toute moyenne mensuelle depuis ${month(prevHigh[0])}` : ''}`, `on ${dt(aft.rate10.date)} (Banque de France)${prevHigh ? `, above every monthly average since ${month(prevHigh[0])}` : ''}`)} tone="bad" />
        </div>
      </Card>

      <Card title={T('Ce que l’État emprunte sur les marchés', 'What the State borrows on the markets')} sub={T('Dette négociable de l’État (obligations et bons)', 'Negotiable State debt (bonds and bills)')} src={SRC.aft}>
        <div className="kpis k4">
          <Kpi label={T('Dette négociable, fin sept. 2026', 'Negotiable debt, end Sep 2026')} value={bn(aft.negotiableSep2026, 0)} sub={T(`fin 2024 : ${bn(aft.negotiableEnd2024.oat, 0)} d’obligations (OAT) + ${bn(aft.negotiableEnd2024.btf, 0)} de bons du Trésor (BTF)`, `end 2024: ${bn(aft.negotiableEnd2024.oat, 0)} of bonds (OAT) + ${bn(aft.negotiableEnd2024.btf, 0)} of Treasury bills (BTF)`)} />
          <Kpi label={T('Durée de vie moyenne', 'Average maturity')} value={dt(aft.avgMaturity.v)} sub={dt(aft.avgMaturity.date)} />
          <Kpi label={T('Émissions prévues en 2027', 'Planned issuance in 2027')} value={bn(aft.issuance.at(-1).v, 0)} sub={T(`prévision AFT, contre ${bn(financing2026.issuance, 0)} en 2026`, `AFT forecast, vs ${bn(financing2026.issuance, 0)} in 2026`)} tone="warn" />
          <Kpi label={T('Détenue par des non-résidents', 'Held by non-residents')} value={dt(aft.nonResidents)} sub={T('part de la dette négociable de l’État', 'share of negotiable State debt')} />
        </div>
      </Card>

      <div className="grid2">
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
        <Card title={T('Écart de taux avec l’obligation allemande à 10 ans (Bund)', 'Spread over the German 10-year bond (Bund)')} sub={T('Prime de risque payée par la France, et notation', 'Risk premium paid by France, and credit rating')}>
          <table className="t"><tbody>{aft.spread.map(r => <tr key={r[0]}><td>{dt(r[0])}</td><td style={{ whiteSpace: 'normal' }}>{dt(r[1])}</td></tr>)}</tbody></table>
          <p className="src">{T('Écarts de taux : presse, ordres de grandeur.', 'Spreads: press reports, orders of magnitude.')}</p>
          <h4>{T('Notation', 'Credit rating')}</h4>
          <p className="hint">{dt(aft.rating)}</p>
        </Card>
      </div>
      <p className="hint">{T('Le montant total de la dette, qui la porte et ce qu’elle coûte en intérêts : ', 'Total debt, who owes it and what it costs in interest: ')}<a href={lp('/dette')}>{T('Dette →', 'Debt →')}</a></p>
    </>
  )
}
