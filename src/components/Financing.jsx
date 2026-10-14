import React from 'react'
import { apu } from '../data/apu.js'
import { oat10 } from '../data/taux.js'
import { financing2026, aft, SRC } from '../data/data.js'
import { Card, Kpi } from './ui.jsx'
import { LineChart, Waterfall } from '../lib/charts.jsx'
import { oatAnnual } from './Debt.jsx'
import { bn, fmt, pct } from '../lib/format.js'

const years = apu.years.map(Number)
const month = d => { const [y, m] = d.split('-'); return new Date(+y, +m - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' }) }

export default function Financing() {
  const n = financing2026.needs
  const need = n.reduce((s, x) => s + x.v, 0)
  const pts = oat10.filter(([, v]) => v != null)
  const lo = pts.reduce((a, b) => (b[1] < a[1] ? b : a)), hi = pts.reduce((a, b) => (b[1] > a[1] ? b : a)), last = pts.at(-1)
  const prevHigh = pts.findLast(([, v]) => v >= aft.spot10.v)
  return (
    <>
      <Card title="How the State covers its 2026 needs" sub="Financing needs and resources, €bn (2026 budget law)" src={SRC.lfi2026}>
        <Waterfall height={240} fmt={v => fmt(v, v < 10 ? 1 : 0)} items={[
          { label: 'Maturing debt', value: n[0].v, sub: 'bonds to repay', color: 'var(--blue)' },
          { label: 'State deficit', value: n[1].v, sub: 'new borrowing', color: 'var(--red)' },
          { label: 'Other needs', value: +(n[2].v + n[3].v).toFixed(1), sub: 'SNCF Réseau, cash', color: 'var(--orange)' },
          { label: 'Total need', value: +need.toFixed(1), kind: 'total', color: 'var(--tx)' },
          { label: 'Bond issuance', value: financing2026.issuance, kind: 'total', sub: 'net of buybacks', color: 'var(--green)' },
        ]} />
        <p className="hint">The State needs about <b>{bn(need, 0)}</b> in 2026. More than half only <b>rolls over</b> old debt; the rest pays for this year's deficit. All of it is raised by issuing bonds, about 10% of them inflation-linked.</p>
      </Card>

      <Card title="The rate that drives everything: 10-year yield since 1993" sub="Monthly yield on the French benchmark bond (line); general government deficit, % of GDP (bars)" src={[SRC.eurostatRates, SRC.eurostatMain]}>
        <LineChart height={300}
          series={[{ name: '10-year yield', color: 'var(--blue)', points: pts.map(([d, v]) => [+d.slice(0, 4) + (+d.slice(5, 7) - 1) / 12, v]) }]}
          bars={{ name: 'Deficit, % of GDP', color: 'var(--red)', sameScale: true, values: years.map((y, k) => [y + 0.5, -apu.soldePct[k]]) }}
          axes={{ left: { fmt: v => v + '%', tipFmt: v => pct(v, 2) } }}
          xTicks={[1995, 2000, 2005, 2010, 2015, 2020, 2025]}
          tipX={x => Number.isInteger(x - 0.5) ? `${x - 0.5}` : month(`${Math.floor(x)}-${String(Math.round((x % 1) * 12) + 1).padStart(2, '0')}`)}
          markers={[{ x: 2008.7, label: 'Lehman', side: 'l' }, { x: 2015.2, label: 'ECB QE', side: 'r' }, { x: 2022.5, label: 'ECB hikes', side: 'l' }]}
        />
        <div className="kpis k4">
          <Kpi label="All-time low" value={pct(lo[1], 2)} sub={month(lo[0])} />
          <Kpi label="High since 1993" value={pct(hi[1], 2)} sub={month(hi[0])} />
          <Kpi label="Latest monthly average" value={pct(last[1], 2)} sub={month(last[0])} tone="warn" />
          <Kpi label="Spot (AFT)" value={pct(aft.spot10.v, 2)} sub={`${aft.spot10.date}${prevHigh ? `, highest since ${month(prevHigh[0])}` : ''}`} tone="bad" />
        </div>
        <p className="hint">Large deficits did not push rates up while the ECB was buying bonds (2015-2021). Since it stopped, rates have tracked fiscal risk: the climb in 2026 directly raises the cost of the €{fmt(financing2026.issuance, 0)}bn issued this year.</p>
      </Card>

      <div className="grid2">
        <Card title="Medium and long-term bond issuance" sub="€bn, net of buybacks" src={SRC.aft}>
          <div className="emissions">
            {aft.issuance.map(e => (
              <div key={e.year} className="emi">
                <div className="emi-bar" style={{ height: `${e.v / 380 * 100}%`, background: e.tag === 'actual' ? 'var(--blue)' : e.tag === 'programme' ? '#7a8cff' : '#b8c0cc' }}><span className="emi-v">{fmt(e.v, 0)}</span></div>
                <div className="emi-y">{e.year}</div><div className="emi-tag">{e.tag}</div>
              </div>
            ))}
          </div>
          <p className="hint">2025 was a record (€347.7bn). The AFT expects €340bn in 2027 as redemptions peak over 2026-2030.</p>
        </Card>
        <Card title="Average rate vs market rate" sub="The gap is the cushion left by cheap past borrowing, %" src={[SRC.eurostatMain, SRC.eurostatRates]}>
          <LineChart height={220}
            series={[
              { name: 'Average rate on the stock', color: 'var(--red)', points: years.map((y, k) => [y, apu.tauxApparent[k]]) },
              { name: '10-year yield, yearly average', color: 'var(--blue)', points: years.map(y => [y, oatAnnual(y)]) },
            ]}
            band={{ from: 0, to: 1, color: '#1a7f4b', label: 'Gap' }}
            axes={{ left: { fmt: v => v + '%', tipFmt: v => pct(v, 2) } }}
          />
          <p className="hint">When the blue line is above the red one, refinancing costs more than the debt it replaces. That has been true every year since 2022, so the average rate can only rise toward the market rate.</p>
        </Card>
      </div>
    </>
  )
}
