import React from 'react'
import { apu } from '../data/apu.js'
import { oat10 } from '../data/taux.js'
import { debtLatest, aft, SRC } from '../data/data.js'
import { Card, Kpi } from './ui.jsx'
import { LineChart } from '../lib/charts.jsx'
import { bn, fmt, pct } from '../lib/format.js'

const i = apu.years.length - 1
const Y = +apu.years[i]
const years = apu.years.map(Number)

export const oatAnnual = y => {
  const v = oat10.filter(([d, x]) => d.startsWith(String(y)) && x != null).map(([, x]) => x)
  return v.length ? +(v.reduce((s, x) => s + x, 0) / v.length).toFixed(2) : null
}

export default function Debt() {
  const perDay = apu.interets[i] * 1000 / 365
  return (
    <>
      <Card title="Public debt in four numbers" sub="Maastricht definition: gross debt of all public administrations" src={[SRC.inseeDebtQ, SRC.eurostatMain]}>
        <div className="kpis k4">
          <Kpi label={`Gross debt, ${debtLatest.label}`} value={bn(debtLatest.total, 0)} sub={`${pct(debtLatest.pct)} of GDP · +${bn(debtLatest.qoq)} in one quarter`} tone="bad" />
          <Kpi label={`Net debt, ${debtLatest.label}`} value={bn(debtLatest.net, 0)} sub={`${pct(debtLatest.netPct)} of GDP (gross minus cash and claims)`} />
          <Kpi label={`Interest, ${Y}`} value={bn(apu.interets[i])} sub={`${pct(apu.interets[i] / apu.gdp[i] * 100)} of GDP · ≈ €${Math.round(perDay)}m a day`} tone="warn" />
          <Kpi label="Average interest rate on the stock" value={pct(apu.tauxApparent[i], 2)} sub={`vs ${pct(oatAnnual(Y), 2)} for a new 10-year bond in ${Y}`} />
        </div>
        <p className="hint">The <b>average rate</b> on existing debt ({pct(apu.tauxApparent[i], 2)}) is still well below market rates because much of the stock was issued in 2015-2021 at near-zero rates. Every bond that matures is refinanced at today's rates, so the average keeps rising.</p>
      </Card>

      <Card title={`Debt since ${years[0]}`} sub="% of GDP (line, left axis) and €bn (bars, right axis)" src={[SRC.eurostatDebt, SRC.inseeDebtQ]}>
        <LineChart height={290}
          series={[{ name: 'Debt, % of GDP', color: 'var(--red)', points: years.map((y, k) => [y, apu.dettePct[k]]) }]}
          bars={{ name: 'Debt, €bn', color: 'var(--blue)', values: years.map((y, k) => [y, apu.dette[k]]) }}
          axes={{ left: { label: '% of GDP', fmt: v => v + '%', tipFmt: v => pct(v) }, right: { label: '€bn', fmt: v => fmt(v, 0), tipFmt: v => bn(v, 0) } }}
          refLines={[{ y: 60, label: 'Maastricht 60%' }]}
          markers={[{ x: 2008, label: 'Financial crisis', side: 'l' }, { x: 2020, label: 'Covid', side: 'r' }]}
        />
        <p className="hint">{bn(apu.dette[i], 0)} at end {Y}, then {bn(debtLatest.total, 0)} in {debtLatest.label}. As a share of GDP debt has doubled since 2007 and is now above its 2020 Covid peak.</p>
      </Card>

      <div className="grid2">
        <Card title="Who owes it" sub={`Debt by sub-sector, €bn, ${years[0]} to ${Y}`} src={SRC.eurostatDebt}>
          <LineChart height={230}
            series={[
              { name: 'Central government', color: 'var(--blue)', points: years.map((y, k) => [y, apu.detteEtat[k]]) },
              { name: 'Social security', color: 'var(--red)', points: years.map((y, k) => [y, apu.detteSociales[k]]) },
              { name: 'Local government', color: 'var(--orange)', points: years.map((y, k) => [y, apu.detteLocales[k]]) },
            ]}
            axes={{ left: { fmt: v => fmt(v, 0), tipFmt: v => bn(v) } }}
          />
          <p className="hint">Central government (State and its agencies) carries {pct(apu.detteEtat[i] / apu.dette[i] * 100, 0)} of the total. Sub-sector debts are not consolidated, so they add up to slightly more than the total.</p>
        </Card>
        <Card title="Latest quarters" sub="Gross debt, Insee" src={SRC.inseeDebtQ}>
          <table className="t"><thead><tr><th></th><th>€bn</th><th>% of GDP</th></tr></thead><tbody>
            {debtLatest.quarters.map(q => <tr key={q.q}><td>{q.q}</td><td>{fmt(q.total)}</td><td>{pct(q.pct)}</td></tr>)}
          </tbody></table>
          <p className="hint">Debt rose by {bn(debtLatest.total - debtLatest.quarters[1].total, 0)} in the first half of 2026 alone, partly because the State built up cash ahead of heavy redemptions.</p>
        </Card>
      </div>

      <Card title="The cost of debt: amount and rate" sub="Interest paid, €bn (bars, right axis); average rate on the stock and 10-year market yield, % (lines, left axis)" src={[SRC.eurostatMain, SRC.eurostatRates]}>
        <LineChart height={270}
          series={[
            { name: 'Average rate on the stock', color: 'var(--red)', points: years.map((y, k) => [y, apu.tauxApparent[k]]) },
            { name: '10-year yield, yearly average', color: 'var(--orange)', dash: true, points: years.map(y => [y, oatAnnual(y)]) },
          ]}
          bars={{ name: 'Interest, €bn', color: '#7a5af8', values: years.map((y, k) => [y, apu.interets[k]]) }}
          axes={{ left: { label: '% (lines)', fmt: v => v + '%', tipFmt: v => pct(v, 2) }, right: { label: '€bn (bars)', fmt: v => fmt(v, 0), tipFmt: v => bn(v) } }}
        />
        <p className="hint">Interest fell from €{fmt(Math.max(...apu.interets.slice(0, 5)), 0)}bn in the late 1990s to €{fmt(Math.min(...apu.interets), 0)}bn in 2021 as rates collapsed, even though the debt doubled. Since 2022 the market yield has been above the average rate, so the bill is rising again: {bn(apu.interets[i])} in {Y}.</p>
      </Card>

      <Card title="What the State borrows on the markets" sub="Negotiable State debt (bonds and bills)" src={SRC.aft}>
        <div className="kpis k4">
          <Kpi label="Negotiable debt, end Sep 2026" value={bn(aft.negotiableSep2026, 0)} sub={`end 2024: ${bn(aft.negotiableEnd2024.oat, 0)} of bonds (OAT) + ${bn(aft.negotiableEnd2024.btf, 0)} of bills (BTF)`} />
          <Kpi label="Average maturity" value={aft.avgMaturity.v} sub={aft.avgMaturity.date} />
          <Kpi label="10-year yield (TEC 10)" value={pct(aft.tec10.v, 2)} sub={`${aft.tec10.date} · ${pct(aft.spot10.v, 2)} on ${aft.spot10.date}`} tone="bad" />
          <Kpi label="Held by non-residents" value={aft.nonResidents} sub={aft.rating} />
        </div>
        <h4>Spread over German 10-year bonds</h4>
        <table className="t"><tbody>{aft.spread.map(r => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td></tr>)}</tbody></table>
        <p className="src warn">Spreads come from press reports, not an official series; treat them as indicative.</p>
      </Card>
    </>
  )
}
