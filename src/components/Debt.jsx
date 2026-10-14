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
      <Card title="La dette publique en quatre chiffres" sub="Au sens de Maastricht" src={[SRC.inseeDebtQ, SRC.eurostatMain]}>
        <div className="kpis k4">
          <Kpi label={`Dette brute, ${debtLatest.label}`} value={bn(debtLatest.total, 0)} sub={`${pct(debtLatest.pct)} du PIB · +${bn(debtLatest.qoq)} en un trimestre`} tone="bad" />
          <Kpi label={`Dette nette, ${debtLatest.label}`} value={bn(debtLatest.net, 0)} sub={`${pct(debtLatest.netPct)} du PIB (brute moins trésorerie et créances)`} />
          <Kpi label={`Intérêts, ${Y}`} value={bn(apu.interets[i])} sub={`${pct(apu.interets[i] / apu.gdp[i] * 100)} du PIB · ≈ ${Math.round(perDay)} M€ par jour`} tone="warn" />
          <Kpi label="Taux moyen de la dette" value={pct(apu.tauxApparent[i], 2)} sub={`contre ${pct(oatAnnual(Y), 2)} pour une OAT à 10 ans en ${Y}`} />
        </div>
        <p className="hint">La dette émise à taux quasi nuls entre 2015 et 2021 est refinancée au taux du jour : le taux moyen ne peut que monter.</p>
      </Card>

      <Card title={`La dette depuis ${years[0]}`} sub="% du PIB (courbe) et Md€ (barres)" src={[SRC.eurostatDebt, SRC.inseeDebtQ]}>
        <LineChart height={290}
          series={[{ name: 'Dette, % du PIB', color: 'var(--red)', points: years.map((y, k) => [y, apu.dettePct[k]]) }]}
          bars={{ name: 'Dette, Md€', color: 'var(--blue)', values: years.map((y, k) => [y, apu.dette[k]]) }}
          axes={{ left: { label: '% du PIB', fmt: v => fmt(v, 0) + ' %', tipFmt: v => pct(v) }, right: { label: 'Md€', fmt: v => fmt(v, 0), tipFmt: v => bn(v, 0) } }}
          refLines={[{ y: 60, label: 'Maastricht 60 %' }]}
          markers={[{ x: 2008, label: 'Crise financière', side: 'l' }, { x: 2020, label: 'Covid', side: 'r' }]}
        />
      </Card>

      <div className="grid2">
        <Card title="Qui est endetté" sub={`Dette par sous-secteur, Md€, ${years[0]}-${Y}`} src={SRC.eurostatDebt}>
          <LineChart height={230}
            series={[
              { name: 'État et organismes centraux', color: 'var(--blue)', points: years.map((y, k) => [y, apu.detteEtat[k]]) },
              { name: 'Sécurité sociale', color: 'var(--red)', points: years.map((y, k) => [y, apu.detteSociales[k]]) },
              { name: 'Collectivités locales', color: 'var(--orange)', points: years.map((y, k) => [y, apu.detteLocales[k]]) },
            ]}
            axes={{ left: { fmt: v => fmt(v, 0), tipFmt: v => bn(v) } }}
          />
        </Card>
        <Card title="Derniers trimestres" sub="Dette brute, Insee" src={SRC.inseeDebtQ}>
          <table className="t"><thead><tr><th></th><th>Md€</th><th>% du PIB</th></tr></thead><tbody>
            {debtLatest.quarters.map(q => <tr key={q.q}><td>{q.q}</td><td>{fmt(q.total)}</td><td>{pct(q.pct)}</td></tr>)}
          </tbody></table>
        </Card>
      </div>

      <Card title="Le coût de la dette : montant et taux" sub="Intérêts en Md€ (barres) ; taux en % (courbes)" src={[SRC.eurostatMain, SRC.eurostatRates]}>
        <LineChart height={270}
          series={[
            { name: 'Taux moyen de la dette', color: 'var(--red)', points: years.map((y, k) => [y, apu.tauxApparent[k]]) },
            { name: 'Taux à 10 ans, moyenne annuelle', color: 'var(--orange)', dash: true, points: years.map(y => [y, oatAnnual(y)]) },
          ]}
          bars={{ name: 'Intérêts, Md€', color: '#7a5af8', values: years.map((y, k) => [y, apu.interets[k]]) }}
          axes={{ left: { label: '% (courbes)', fmt: v => fmt(v, 0) + ' %', tipFmt: v => pct(v, 2) }, right: { label: 'Md€ (barres)', fmt: v => fmt(v, 0), tipFmt: v => bn(v) } }}
        />
      </Card>

      <Card title="Ce que l’État emprunte sur les marchés" sub="Dette négociable de l’État (obligations et bons)" src={SRC.aft}>
        <div className="kpis k4">
          <Kpi label="Dette négociable, fin sept. 2026" value={bn(aft.negotiableSep2026, 0)} sub={`fin 2024 : ${bn(aft.negotiableEnd2024.oat, 0)} d’OAT + ${bn(aft.negotiableEnd2024.btf, 0)} de BTF`} />
          <Kpi label="Durée de vie moyenne" value={aft.avgMaturity.v} sub={aft.avgMaturity.date} />
          <Kpi label="Taux à 10 ans (TEC 10)" value={pct(aft.tec10.v, 2)} sub={`${aft.tec10.date} · ${pct(aft.spot10.v, 2)} au ${aft.spot10.date}`} tone="bad" />
          <Kpi label="Détenue par des non-résidents" value={aft.nonResidents} sub={aft.rating} />
        </div>
        <h4>Écart de taux avec le Bund allemand à 10 ans</h4>
        <table className="t"><tbody>{aft.spread.map(r => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td></tr>)}</tbody></table>
        <p className="src">Écarts de taux : presse, ordres de grandeur.</p>
      </Card>
    </>
  )
}
