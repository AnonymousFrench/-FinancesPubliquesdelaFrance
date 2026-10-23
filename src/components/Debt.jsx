import React from 'react'
import { apu } from '../data/apu.js'
import { oat10 } from '../data/taux.js'
import { debtLatest, SRC } from '../data/data.js'
import { Card, Kpi } from './ui.jsx'
import { LineChart } from '../lib/charts.jsx'
import { bn, fmt, pct, unitBn } from '../lib/format.js'
import { T } from '../i18n.js'
import { dt } from '../data/dataEn.js'
import { withLang } from '../routes.js'
import { getLang } from '../i18n.js'

const lp = p => withLang(p, getLang())

const i = apu.years.length - 1
const Y = +apu.years[i]
const years = apu.years.map(Number)

export const oatAnnual = y => {
  const v = oat10.filter(([d, x]) => d.startsWith(String(y)) && x != null).map(([, x]) => x)
  return v.length ? +(v.reduce((s, x) => s + x, 0) / v.length).toFixed(2) : null
}

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

      <Card title={T(`La dette depuis ${years[0]}`, `Debt since ${years[0]}`)} sub={T('% du PIB (courbe) et Md€ (barres)', `% of GDP (line) and ${unitBn()} (bars)`)} src={[SRC.eurostatDebt, SRC.inseeDebtQ]}>
        <LineChart height={290}
          series={[{ name: T('Dette, % du PIB', 'Debt, % of GDP'), color: 'var(--red)', points: years.map((y, k) => [y, apu.dettePct[k]]) }]}
          bars={{ name: T('Dette, Md€', `Debt, ${unitBn()}`), color: 'var(--blue)', values: years.map((y, k) => [y, apu.dette[k]]) }}
          axes={{ left: { label: T('% du PIB', '% of GDP'), fmt: v => pct(v, 0), tipFmt: v => pct(v) }, right: { label: unitBn(), fmt: v => fmt(v, 0), tipFmt: v => bn(v, 0) } }}
          refLines={[{ y: 60, label: T('Maastricht 60 %', 'Maastricht 60%') }]}
          markers={[{ x: 2008, label: T('Crise financière', 'Financial crisis'), side: 'l' }, { x: 2020, label: 'Covid', side: 'r' }]}
        />
      </Card>

      <div className="grid2">
        <Card title={T('Qui est endetté', 'Who owes it')} sub={T(`Dette par sous-secteur, Md€, ${years[0]}-${Y}`, `Debt by sub-sector, ${unitBn()}, ${years[0]}-${Y}`)} src={SRC.eurostatDebt}>
          <LineChart height={230}
            series={[
              { name: dt('État et organismes centraux'), color: 'var(--blue)', points: years.map((y, k) => [y, apu.detteEtat[k]]) },
              { name: dt('Sécurité sociale'), color: 'var(--red)', points: years.map((y, k) => [y, apu.detteSociales[k]]) },
              { name: dt('Collectivités locales'), color: 'var(--orange)', points: years.map((y, k) => [y, apu.detteLocales[k]]) },
            ]}
            axes={{ left: { fmt: v => fmt(v, 0), tipFmt: v => bn(v) } }}
          />
        </Card>
        <Card title={T('Derniers trimestres', 'Latest quarters')} sub={T('Dette brute, Insee', 'Gross debt, Insee')} src={SRC.inseeDebtQ}>
          <table className="t"><thead><tr><th></th><th>{unitBn()}</th><th>{T('% du PIB', '% of GDP')}</th></tr></thead><tbody>
            {debtLatest.quarters.map(q => <tr key={q.q}><td>{dt(q.q)}</td><td>{fmt(q.total)}</td><td>{pct(q.pct)}</td></tr>)}
          </tbody></table>
        </Card>
      </div>

      <Card title={T('Le coût de la dette : montant et taux', 'The cost of debt: amount and rate')} sub={T('Intérêts en Md€ (barres) ; taux en % (courbes)', `Interest in ${unitBn()} (bars); rates in % (lines)`)} src={[SRC.eurostatMain, SRC.eurostatRates]}>
        <LineChart height={270}
          series={[
            { name: T('Taux moyen de la dette', 'Average rate on the debt'), color: 'var(--red)', points: years.map((y, k) => [y, apu.tauxApparent[k]]) },
            { name: T('Taux à 10 ans, moyenne annuelle', '10-year yield, yearly average'), color: 'var(--orange)', dash: true, points: years.map(y => [y, oatAnnual(y)]) },
          ]}
          bars={{ name: T('Intérêts, Md€', `Interest, ${unitBn()}`), color: '#7a5af8', values: years.map((y, k) => [y, apu.interets[k]]) }}
          axes={{ left: { label: T('% (courbes)', '% (lines)'), fmt: v => pct(v, 0), tipFmt: v => pct(v, 2) }, right: { label: T('Md€ (barres)', `${unitBn()} (bars)`), fmt: v => fmt(v, 0), tipFmt: v => bn(v) } }}
        />
        <p className="hint">{T('Le taux du jour, ce que l’État emprunte cette année et auprès de qui : ', 'Today’s rate, what the State borrows this year and from whom: ')}<a href={lp('/financement')}>{T('Financement →', 'Financing →')}</a></p>
      </Card>
    </>
  )
}
