import React from 'react'
import { apu } from '../data/apu.js'
import { oat10 } from '../data/taux.js'
import { financing2026, aft, SRC } from '../data/data.js'
import { Card, Kpi } from './ui.jsx'
import { LineChart, Waterfall } from '../lib/charts.jsx'
import { oatAnnual } from './Debt.jsx'
import { bn, fmt, pct, monthFr, unitBn } from '../lib/format.js'
import { T } from '../i18n.js'
import { dt } from '../data/dataEn.js'

const years = apu.years.map(Number)
const month = d => { const [y, m] = d.split('-').map(Number); return monthFr(y, m) }

export default function Financing() {
  const n = financing2026.needs
  const need = n.reduce((s, x) => s + x.v, 0)
  const pts = oat10.filter(([, v]) => v != null)
  const lo = pts.reduce((a, b) => (b[1] < a[1] ? b : a)), hi = pts.reduce((a, b) => (b[1] > a[1] ? b : a)), last = pts.at(-1)
  const prevHigh = pts.findLast(([, v]) => v >= aft.spot10.v)
  return (
    <>
      <Card title={T('Comment l’État couvre ses besoins 2026', 'How the State covers its 2026 needs')} sub={T('Md€, loi de finances 2026', `${unitBn()}, 2026 budget law`)} src={SRC.lfi2026}>
        <Waterfall height={240} fmt={v => fmt(v, v < 10 ? 1 : 0)} items={[
          { label: T('Dette à rembourser', 'Maturing debt'), value: n[0].v, sub: T('obligations à échéance', 'bonds to repay'), color: 'var(--blue)' },
          { label: T('Déficit de l’État', 'State deficit'), value: n[1].v, sub: T('emprunt nouveau', 'new borrowing'), color: 'var(--red)' },
          { label: T('Autres besoins', 'Other needs'), value: +(n[2].v + n[3].v).toFixed(1), sub: T('SNCF Réseau, trésorerie', 'SNCF Réseau, cash'), color: 'var(--orange)' },
          { label: T('Besoin total', 'Total need'), value: +need.toFixed(1), kind: 'total', color: 'var(--tx)' },
          { label: T('Émissions', 'Issuance'), value: financing2026.issuance, kind: 'total', sub: T('nettes des rachats', 'net of buybacks'), color: 'var(--green)' },
        ]} />
        <p className="hint">{T(`Plus de la moitié des ${bn(need, 0)} sert à rembourser de la dette ancienne.`, `More than half of the ${bn(need, 0)} only repays old debt.`)}</p>
      </Card>

      <Card title={T('Le taux qui décide de tout : l’obligation à 10 ans (OAT) depuis 1993', 'The rate that decides everything: the 10-year bond (OAT) since 1993')} sub={T('Taux annuel, moyenne de chaque mois (courbe) ; déficit public en % du PIB (barres)', 'Annual rate, average of each month (line); public deficit as % of GDP (bars)')} src={[SRC.eurostatRates, SRC.eurostatMain]}>
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
          <Kpi label={T('Dernière cotation (AFT)', 'Latest quote (AFT)')} value={pct(aft.spot10.v, 2)} sub={T(`le ${aft.spot10.date}${prevHigh ? `, plus haut depuis ${month(prevHigh[0])}` : ''}`, `on ${dt(aft.spot10.date)}${prevHigh ? `, highest since ${month(prevHigh[0])}` : ''}`)} tone="bad" />
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
        <Card title={T('Taux moyen et taux de marché', 'Average rate and market rate')} sub="%" src={[SRC.eurostatMain, SRC.eurostatRates]}>
          <LineChart height={220}
            series={[
              { name: T('Taux moyen de la dette', 'Average rate on the debt'), color: 'var(--red)', points: years.map((y, k) => [y, apu.tauxApparent[k]]) },
              { name: T('Taux à 10 ans, moyenne annuelle', '10-year yield, yearly average'), color: 'var(--blue)', points: years.map(y => [y, oatAnnual(y)]) },
            ]}
            band={{ from: 0, to: 1, color: '#1a7f4b', label: T('Écart', 'Gap') }}
            axes={{ left: { fmt: v => pct(v, 0), tipFmt: v => pct(v, 2) } }}
          />
          <p className="hint">{T('Depuis 2022, refinancer coûte plus cher que la dette remplacée.', 'Since 2022, refinancing has cost more than the debt it replaces.')}</p>
        </Card>
      </div>
    </>
  )
}
