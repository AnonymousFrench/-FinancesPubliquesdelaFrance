import React from 'react'
import { apu } from '../data/apu.js'
import { oat10 } from '../data/taux.js'
import { debtLatest, SRC } from '../data/data.js'
import { Card, Kpi } from './ui.jsx'
import { LineChart } from '../lib/charts.jsx'
import { bn, fmt, pct, unitBn } from '../lib/format.js'
import { T } from '../i18n.js'
import { dt } from '../data/dataEn.js'

const i = apu.years.length - 1
const Y = +apu.years[i]
const years = apu.years.map(Number)

export const oatAnnual = y => {
  const v = oat10.filter(([d, x]) => d.startsWith(String(y)) && x != null).map(([, x]) => x)
  return v.length ? +(v.reduce((s, x) => s + x, 0) / v.length).toFixed(2) : null
}

// Trimestres Insee postérieurs à la dernière année publiée par Eurostat (« T2 2026 » → 2025,5 : fin du 2e trimestre 2026),
// rattachés au dernier 4e trimestre connu. Ils apparaissent d'eux-mêmes quand debtLatest gagne un trimestre.
const qPos = q => { const m = /T(\d) (\d{4})/.exec(q); return m ? +m[2] - 1 + +m[1] / 4 : null }
const qs = debtLatest.quarters.map(q => ({ ...q, x: qPos(q.q) })).filter(q => q.x != null && q.x >= Y).sort((a, b) => a.x - b.x)
const qLabel = x => { const q = qs.find(o => o.x === x); return q && Number.isInteger(x) === false ? dt(q.q) : null }

export default function Debt() {
  const perDay = apu.interets[i] * 1000 / 365
  const gdp = T('du PIB', 'of GDP')
  const dl = dt(debtLatest.label)
  return (
    <>
      <Card title={T('La dette publique en quatre chiffres', 'Public debt in four numbers')} sub={T('Au sens de Maastricht', 'Maastricht definition')} src={[SRC.inseeDebtQ, SRC.eurostatMain]}>
        <div className="kpis k4">
          <Kpi label={T(`Dette brute, ${dl}`, `Gross debt, ${dl}`)} value={bn(debtLatest.total, 0)} sub={T(`${pct(debtLatest.pct)} du PIB · +${bn(debtLatest.qoq)} en un trimestre`, `${pct(debtLatest.pct)} of GDP · +${bn(debtLatest.qoq)} in one quarter`)} tone="bad" />
          <Kpi label={T(`Dette nette, ${dl}`, `Net debt, ${dl}`)} value={bn(debtLatest.net, 0)} sub={T(`${pct(debtLatest.netPct)} du PIB (brute moins trésorerie et créances)`, `${pct(debtLatest.netPct)} of GDP (gross minus cash and claims)`)} />
          <Kpi label={T(`Intérêts, ${Y}`, `Interest, ${Y}`)} value={bn(apu.interets[i])} sub={T(`${pct(apu.interets[i] / apu.gdp[i] * 100)} du PIB · ≈ ${Math.round(perDay)} M€ par jour`, `${pct(apu.interets[i] / apu.gdp[i] * 100)} of GDP · ≈ €${Math.round(perDay)}m a day`)} tone="warn" />
          <Kpi label={T('Taux moyen de la dette', 'Average rate on the debt')} value={pct(apu.tauxApparent[i], 2)} sub={T(`contre ${pct(oatAnnual(Y), 2)} pour une OAT à 10 ans en ${Y}`, `vs ${pct(oatAnnual(Y), 2)} for a 10-year OAT in ${Y}`)} />
        </div>
        <p className="hint">{T('La dette émise à taux quasi nuls entre 2015 et 2021 est refinancée au taux du jour : le taux moyen ne peut que monter.', 'Debt issued at near-zero rates in 2015-2021 is refinanced at today’s rates: the average rate can only rise.')}</p>
      </Card>

      <div className="grid2">
        <Card title={T(`La dette depuis ${years[0]}`, `Debt since ${years[0]}`)} sub={T('% du PIB (courbe) et Md€ (barres) ; derniers trimestres en pointillé', `% of GDP (line) and ${unitBn()} (bars); latest quarters dotted`)} src={[SRC.eurostatDebt, SRC.inseeDebtQ]}>
          <LineChart height={290}
            series={[
              { name: T('Dette, % du PIB', 'Debt, % of GDP'), color: 'var(--red)', points: years.map((y, k) => [y, apu.dettePct[k]]) },
              ...(qs.length > 1 ? [
                { name: T('Dette trimestrielle, % du PIB (Insee)', 'Quarterly debt, % of GDP (Insee)'), color: 'var(--red)', dash: true, dots: true, points: qs.map(q => [q.x, q.pct]) },
                { name: T('Dette trimestrielle, Md€ (Insee)', `Quarterly debt, ${unitBn()} (Insee)`), color: 'var(--blue)', hidden: true, tipFmt: v => bn(v, 1), points: qs.map(q => [q.x, q.total]) },
              ] : []),
            ]}
            bars={{ name: T('Dette, Md€', `Debt, ${unitBn()}`), color: 'var(--blue)', values: years.map((y, k) => [y, apu.dette[k]]) }}
            axes={{ left: { label: T('% du PIB', '% of GDP'), fmt: v => pct(v, 0), tipFmt: v => pct(v) }, right: { label: unitBn(), fmt: v => fmt(v, 0), tipFmt: v => bn(v, 0) } }}
            tipX={x => qLabel(x) || String(x)}
            refLines={[{ y: 60, label: T('Maastricht 60 %', 'Maastricht 60%') }]}
            markers={[{ x: 2008, label: T('Crise financière', 'Financial crisis'), side: 'l' }, { x: 2020, label: 'Covid', side: 'r' }]}
          />
          {qs.length > 1 && <p className="hint">{T(`Années : Eurostat, fin d’année. Pointillé : dette trimestrielle de l’Insee jusqu’au ${dl}, en attendant les comptes annuels.`, `Years: Eurostat, end of year. Dotted: Insee quarterly debt up to ${dl}, until the annual accounts are out.`)}</p>}
        </Card>

        <Card title={T('Le coût de la dette : montant et taux', 'The cost of debt: amount and rate')} sub={T('Intérêts en Md€ (barres) ; taux en % (courbes)', `Interest in ${unitBn()} (bars); rates in % (lines)`)} src={[SRC.eurostatMain, SRC.eurostatRates]}>
          <LineChart height={290}
            series={[
              { name: T('Taux moyen de la dette', 'Average rate on the debt'), color: 'var(--red)', points: years.map((y, k) => [y, apu.tauxApparent[k]]) },
              { name: T('Taux à 10 ans, moyenne annuelle', '10-year yield, yearly average'), color: 'var(--orange)', dash: true, points: years.map(y => [y, oatAnnual(y)]) },
            ]}
            bars={{ name: T('Intérêts, Md€', `Interest, ${unitBn()}`), color: '#7a5af8', values: years.map((y, k) => [y, apu.interets[k]]) }}
            axes={{ left: { label: T('% (courbes)', '% (lines)'), fmt: v => pct(v, 0), tipFmt: v => pct(v, 2) }, right: { label: T('Md€ (barres)', `${unitBn()} (bars)`), fmt: v => fmt(v, 0), tipFmt: v => bn(v) } }}
          />
        </Card>
      </div>
    </>
  )
}
