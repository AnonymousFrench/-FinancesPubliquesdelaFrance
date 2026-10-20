import React from 'react'
import { apu } from '../data/apu.js'
import { recettesEtat, recettesYear } from '../data/recettes-etat.js'
import { byLevel2025, SRC } from '../data/data.js'
import { Card, DrillList } from './ui.jsx'
import { LineChart, StackedH } from '../lib/charts.jsx'
import { bn, eur, fmt, pct, label, unitBn } from '../lib/format.js'
import { T } from '../i18n.js'
import { dt } from '../data/dataEn.js'

const i = apu.years.length - 1
const Y = apu.years[i]
const years = apu.years.map(Number)
const C = ['#2148c0', '#e1000f', '#f28c28', '#2a9d8f', '#8e7cc3', '#9aa4b2', '#1a7f4b', '#f4a582']

const tree = () => [
  { name: T('Impôts sur la production et les importations', 'Production and import taxes'), note: T('TVA, TICPE, taxes foncières, impôts de production', 'VAT, fuel duty, property and business taxes'), value: apu.impotsProduction[i], color: C[0], children: [
    { name: T('TVA', 'VAT'), value: apu.tva[i] },
    { name: T('Autres impôts sur les produits', 'Other taxes on products'), note: T('TICPE, tabac, alcools…', 'fuel duty (TICPE), tobacco, alcohol…'), value: +(apu.impotsProduits[i] - apu.tva[i]).toFixed(1) },
    { name: T('Autres impôts sur la production', 'Other taxes on production'), note: T('taxe foncière, CFE/CVAE, taxes sur les salaires…', 'property tax, CFE/CVAE, payroll taxes…'), value: apu.autresImpotsProduction[i] },
  ] },
  { name: T('Cotisations sociales', 'Social contributions'), note: T('employeurs et salariés', 'employers and employees'), value: apu.cotisationsSociales[i], color: C[3] },
  { name: T('Impôts sur le revenu et le patrimoine', 'Income and wealth taxes'), note: T('IR, CSG, impôt sur les sociétés, IFI', 'income tax, CSG, corporate tax, wealth tax on property'), value: apu.impotsRevenuPatrimoine[i], color: C[1] },
  { name: T('Ventes de services', 'Sales of services'), note: T('hôpital, péages, enseignement…', 'hospital fees, tolls, tuition…'), value: apu.ventes[i], color: C[2] },
  { name: T('Revenus de la propriété', 'Property income'), note: T('dividendes, intérêts reçus', 'dividends, interest received'), value: apu.revenusPropriete[i], color: C[4] },
  { name: T('Autres transferts reçus', 'Other transfers received'), note: T('dont fonds européens', 'incl. EU funds'), value: apu.autresTransferts[i], color: C[5] },
  { name: T('Impôts en capital', 'Capital taxes'), note: T('droits de succession et de donation', 'inheritance and gift duties'), value: apu.impotsCapital[i], color: C[6] },
].sort((a, b) => b.value - a.value)

// Le fichier stocke en positif les recettes reversées aux collectivités et à l'UE (« prélèvements »).
const stateTree = () => recettesEtat.map(t => {
  const sign = t.nom.startsWith('Prélèvement') ? -1 : 1
  return {
    name: dt(label(t.nom)), value: sign * t.montant, tag: sign < 0 ? dt('déduit') : null,
    children: [...t.lignes].filter(l => l.montant).sort((a, b) => b.montant - a.montant).map(l => ({ name: label(l.lib), value: sign * l.montant })),
  }
})

export default function Revenue() {
  const twoPillars = (apu.cotisationsSociales[i] + apu.tva[i]) / apu.recettes[i] * 100
  const gdp = T('du PIB', 'of GDP')
  return (
    <>
      <Card title={T(`Recettes publiques ${Y} : ${bn(apu.recettes[i])}`, `Public revenue ${Y}: ${bn(apu.recettes[i])}`)} sub={T(`${pct(apu.recettesPct[i])} du PIB, toutes administrations`, `${pct(apu.recettesPct[i])} of GDP, all levels of government`)} src={SRC.eurostatMain}>
        <DrillList rows={tree()} total={apu.recettes[i]} fmt={v => bn(v)} />
        <p className="hint">{T(`Cotisations sociales et TVA : ${pct(twoPillars, 0)} des recettes. Prélèvements obligatoires : ${pct(byLevel2025.levies)} du PIB.`, `Social contributions and VAT: ${pct(twoPillars, 0)} of revenue. Compulsory levies: ${pct(byLevel2025.levies)} of GDP.`)}</p>
      </Card>

      <div className="grid2">
        <Card title={T(`Les grandes recettes, ${years[0]}-${Y}`, `Main revenue sources, ${years[0]}-${Y}`)} sub={T('Md€ courants', 'current €bn')} src={SRC.eurostatMain}>
          <LineChart height={250}
            series={[
              { name: T('Total des recettes', 'Total revenue'), color: 'var(--tx)', width: 2.5, points: years.map((y, k) => [y, apu.recettes[k]]) },
              { name: T('Cotisations sociales', 'Social contributions'), color: C[3], points: years.map((y, k) => [y, apu.cotisationsSociales[k]]) },
              { name: T('Impôts sur la production', 'Production taxes'), color: C[0], points: years.map((y, k) => [y, apu.impotsProduction[k]]) },
              { name: T('Impôts sur le revenu et le patrimoine', 'Income and wealth taxes'), color: C[1], points: years.map((y, k) => [y, apu.impotsRevenuPatrimoine[k]]) },
              { name: T('dont TVA', 'of which VAT'), color: C[5], dash: true, points: years.map((y, k) => [y, apu.tva[k]]) },
            ]}
            axes={{ left: { fmt: v => fmt(v, 0), tipFmt: v => bn(v) } }}
          />
        </Card>
        <Card title={T('Qui collecte', 'Who collects it')} sub={T(`Recettes par niveau d’administration, ${Y}, Md€`, `Revenue by level of government, ${Y}, ${unitBn()}`)} src={SRC.insee2106}>
          <StackedH segs={byLevel2025.revenue.map((s, k) => ({ ...s, name: dt(s.name), color: [C[0], C[1], C[2]][k] }))} fmt={v => fmt(v, 0)} height={40} />
          <h4>{T('Recettes en % du PIB', 'Revenue as % of GDP')}</h4>
          <LineChart height={150} series={[{ name: T('Recettes / PIB', 'Revenue / GDP'), color: C[0], points: years.map((y, k) => [y, apu.recettesPct[k]]) }]} axes={{ left: { fmt: v => pct(v, 0), tipFmt: v => pct(v) } }} />
        </Card>
      </div>

      <Card title={T(`Recettes du budget de l’État, ligne par ligne (PLF ${recettesYear})`, `State budget revenue, line by line (${recettesYear} draft budget)`)} sub={T('L’État seul. Lignes négatives : reversées aux collectivités et à l’UE, ou remboursements et dégrèvements d’impôts.', 'State only. Negative lines: passed on to local authorities and the EU, or tax refunds and rebates.')} src={recettesYear === 2025 ? SRC.plf25rec : SRC[`plf${String(recettesYear).slice(2)}rec`]}>
        <DrillList rows={stateTree()} fmt={eur} />
      </Card>
    </>
  )
}
