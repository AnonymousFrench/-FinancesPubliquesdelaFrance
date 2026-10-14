import React from 'react'
import { apu } from '../data/apu.js'
import { oat10 } from '../data/taux.js'
import { financing2026, aft, SRC } from '../data/data.js'
import { Card, Kpi } from './ui.jsx'
import { LineChart, Waterfall } from '../lib/charts.jsx'
import { oatAnnual } from './Debt.jsx'
import { bn, fmt, pct, monthFr } from '../lib/format.js'

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
      <Card title="Comment l’État couvre ses besoins 2026" sub="Md€, loi de finances 2026" src={SRC.lfi2026}>
        <Waterfall height={240} fmt={v => fmt(v, v < 10 ? 1 : 0)} items={[
          { label: 'Dette à rembourser', value: n[0].v, sub: 'obligations à échéance', color: 'var(--blue)' },
          { label: 'Déficit de l’État', value: n[1].v, sub: 'emprunt nouveau', color: 'var(--red)' },
          { label: 'Autres besoins', value: +(n[2].v + n[3].v).toFixed(1), sub: 'SNCF Réseau, trésorerie', color: 'var(--orange)' },
          { label: 'Besoin total', value: +need.toFixed(1), kind: 'total', color: 'var(--tx)' },
          { label: 'Émissions', value: financing2026.issuance, kind: 'total', sub: 'nettes des rachats', color: 'var(--green)' },
        ]} />
        <p className="hint">Plus de la moitié des {bn(need, 0)} sert à <b>rembourser</b> de la dette ancienne.</p>
      </Card>

      <Card title="Le taux qui décide de tout : l’OAT à 10 ans depuis 1993" sub="Taux mensuel (courbe) et déficit public en % du PIB (barres)" src={[SRC.eurostatRates, SRC.eurostatMain]}>
        <LineChart height={300}
          series={[{ name: 'Taux à 10 ans', color: 'var(--blue)', points: pts.map(([d, v]) => [+d.slice(0, 4) + (+d.slice(5, 7) - 1) / 12, v]) }]}
          bars={{ name: 'Déficit, % du PIB', color: 'var(--red)', sameScale: true, values: years.map((y, k) => [y + 0.5, -apu.soldePct[k]]) }}
          axes={{ left: { fmt: v => fmt(v, 0) + ' %', tipFmt: v => pct(v, 2) } }}
          xTicks={[1995, 2000, 2005, 2010, 2015, 2020, 2025]}
          tipX={x => Number.isInteger(x - 0.5) ? `${x - 0.5}` : month(`${Math.floor(x)}-${String(Math.round((x % 1) * 12) + 1).padStart(2, '0')}`)}
          markers={[{ x: 2008.7, label: 'Lehman', side: 'l' }, { x: 2015.2, label: 'QE de la BCE', side: 'r' }, { x: 2022.5, label: 'Hausses BCE', side: 'l' }]}
        />
        <div className="kpis k4">
          <Kpi label="Plus bas historique" value={pct(lo[1], 2)} sub={month(lo[0])} />
          <Kpi label="Plus haut depuis 1993" value={pct(hi[1], 2)} sub={month(hi[0])} />
          <Kpi label="Dernière moyenne mensuelle" value={pct(last[1], 2)} sub={month(last[0])} tone="warn" />
          <Kpi label="Taux au jour le jour (AFT)" value={pct(aft.spot10.v, 2)} sub={`${aft.spot10.date}${prevHigh ? `, plus haut depuis ${month(prevHigh[0])}` : ''}`} tone="bad" />
        </div>
      </Card>

      <div className="grid2">
        <Card title="Émissions à moyen et long terme" sub="Md€, nettes des rachats" src={SRC.aft}>
          <div className="emissions">
            {aft.issuance.map(e => (
              <div key={e.year} className="emi">
                <div className="emi-bar" style={{ height: `${e.v / 380 * 100}%`, background: e.tag === 'réalisé' ? 'var(--blue)' : e.tag === 'programme' ? '#7a8cff' : '#b8c0cc' }}><span className="emi-v">{fmt(e.v, 0)}</span></div>
                <div className="emi-y">{e.year}</div><div className="emi-tag">{e.tag}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Taux moyen et taux de marché" sub="%" src={[SRC.eurostatMain, SRC.eurostatRates]}>
          <LineChart height={220}
            series={[
              { name: 'Taux moyen de la dette', color: 'var(--red)', points: years.map((y, k) => [y, apu.tauxApparent[k]]) },
              { name: 'Taux à 10 ans, moyenne annuelle', color: 'var(--blue)', points: years.map(y => [y, oatAnnual(y)]) },
            ]}
            band={{ from: 0, to: 1, color: '#1a7f4b', label: 'Écart' }}
            axes={{ left: { fmt: v => fmt(v, 0) + ' %', tipFmt: v => pct(v, 2) } }}
          />
          <p className="hint">Depuis 2022, refinancer coûte plus cher que la dette remplacée.</p>
        </Card>
      </div>
    </>
  )
}
