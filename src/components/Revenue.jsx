import React from 'react'
import { apu } from '../data/apu.js'
import { recettesEtat } from '../data/recettes-etat.js'
import { byLevel2025, SRC } from '../data/data.js'
import { Card, DrillList } from './ui.jsx'
import { LineChart, StackedH } from '../lib/charts.jsx'
import { bn, eur, fmt, pct } from '../lib/format.js'

const i = apu.years.length - 1
const Y = apu.years[i]
const years = apu.years.map(Number)
const C = ['#2148c0', '#e1000f', '#f28c28', '#2a9d8f', '#8e7cc3', '#9aa4b2', '#1a7f4b', '#f4a582']

const tree = () => [
  { name: 'Production and import taxes', note: 'VAT, fuel duty, property and business taxes', value: apu.impotsProduction[i], color: C[0], children: [
    { name: 'VAT', value: apu.tva[i] },
    { name: 'Other taxes on products', note: 'fuel duty (TICPE), tobacco, alcohol…', value: +(apu.impotsProduits[i] - apu.tva[i]).toFixed(1) },
    { name: 'Other taxes on production', note: 'property tax, CFE/CVAE, payroll taxes…', value: apu.autresImpotsProduction[i] },
  ] },
  { name: 'Social contributions', note: 'employer and employee', value: apu.cotisationsSociales[i], color: C[3] },
  { name: 'Income and wealth taxes', note: 'income tax, CSG, corporate tax, wealth tax on property', value: apu.impotsRevenuPatrimoine[i], color: C[1] },
  { name: 'Sales of services', note: 'hospital fees, tolls, tuition…', value: apu.ventes[i], color: C[2] },
  { name: 'Property income', note: 'dividends, interest received', value: apu.revenusPropriete[i], color: C[4] },
  { name: 'Other transfers received', note: 'incl. EU funds', value: apu.autresTransferts[i], color: C[5] },
  { name: 'Capital taxes', note: 'inheritance and gift duties', value: apu.impotsCapital[i], color: C[6] },
].sort((a, b) => b.value - a.value)

// The file stores revenue handed to local authorities and the EU ("prélèvements") as positive amounts.
const stateTree = () => recettesEtat.map(t => {
  const sign = t.nom.startsWith('Prélèvement') ? -1 : 1
  return {
    name: t.nom, value: sign * t.montant, tag: sign < 0 ? 'deducted' : null,
    children: [...t.lignes].filter(l => l.montant).sort((a, b) => b.montant - a.montant).map(l => ({ name: l.lib, value: sign * l.montant })),
  }
})

export default function Revenue() {
  const twoPillars = (apu.cotisationsSociales[i] + apu.tva[i]) / apu.recettes[i] * 100
  return (
    <>
      <Card title={`Public revenue ${Y}: ${bn(apu.recettes[i])}`} sub={`${pct(apu.recettesPct[i])} of GDP, all levels of government. Click a line with ▸ to expand it.`} src={SRC.eurostatMain}>
        <DrillList rows={tree()} total={apu.recettes[i]} fmt={v => bn(v)} />
        <p className="hint">Social contributions and VAT alone bring in {pct(twoPillars, 0)} of all public revenue. Compulsory levies came to {pct(byLevel2025.levies)} of GDP in {Y}.</p>
      </Card>

      <div className="grid2">
        <Card title={`Main revenue sources, ${years[0]} to ${Y}`} sub="€bn, current prices" src={SRC.eurostatMain}>
          <LineChart height={250}
            series={[
              { name: 'Total revenue', color: 'var(--tx)', width: 2.5, points: years.map((y, k) => [y, apu.recettes[k]]) },
              { name: 'Social contributions', color: C[3], points: years.map((y, k) => [y, apu.cotisationsSociales[k]]) },
              { name: 'Production taxes', color: C[0], points: years.map((y, k) => [y, apu.impotsProduction[k]]) },
              { name: 'Income and wealth taxes', color: C[1], points: years.map((y, k) => [y, apu.impotsRevenuPatrimoine[k]]) },
              { name: 'of which VAT', color: C[5], dash: true, points: years.map((y, k) => [y, apu.tva[k]]) },
            ]}
            axes={{ left: { fmt: v => fmt(v, 0), tipFmt: v => bn(v) } }}
          />
        </Card>
        <Card title="Who collects it" sub={`Revenue by level of government, ${Y}, €bn`} src={SRC.insee2106}>
          <StackedH segs={byLevel2025.revenue.map((s, k) => ({ ...s, color: [C[0], C[1], C[2]][k] }))} fmt={v => fmt(v, 0)} height={40} />
          <p className="hint">Levels pass money to one another (the State funds local authorities and part of social security), so the three figures add up to more than the consolidated total.</p>
          <h4>Revenue as a share of GDP</h4>
          <LineChart height={150} series={[{ name: 'Revenue / GDP', color: C[0], points: years.map((y, k) => [y, apu.recettesPct[k]]) }]} axes={{ left: { fmt: v => v + '%', tipFmt: v => pct(v) } }} />
        </Card>
      </div>

      <Card title="State budget revenue, line by line (PLF 2025)" sub="The State alone, as voted. Negative lines are revenue passed on to local authorities and the EU. Click a category to see every tax." src={SRC.plf25rec}>
        <DrillList rows={stateTree()} fmt={eur} />
        <p className="hint">VAT is the State's largest tax even after the share passed to local authorities and social security. Income tax and corporate tax are shown gross, before refunds.</p>
      </Card>
    </>
  )
}
