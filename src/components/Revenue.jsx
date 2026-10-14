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
  { name: 'Impôts sur la production et les importations', note: 'TVA, TICPE, taxes foncières, impôts de production', value: apu.impotsProduction[i], color: C[0], children: [
    { name: 'TVA', value: apu.tva[i] },
    { name: 'Autres impôts sur les produits', note: 'TICPE, tabac, alcools…', value: +(apu.impotsProduits[i] - apu.tva[i]).toFixed(1) },
    { name: 'Autres impôts sur la production', note: 'taxe foncière, CFE/CVAE, taxes sur les salaires…', value: apu.autresImpotsProduction[i] },
  ] },
  { name: 'Cotisations sociales', note: 'employeurs et salariés', value: apu.cotisationsSociales[i], color: C[3] },
  { name: 'Impôts sur le revenu et le patrimoine', note: 'IR, CSG, impôt sur les sociétés, IFI', value: apu.impotsRevenuPatrimoine[i], color: C[1] },
  { name: 'Ventes de services', note: 'hôpital, péages, enseignement…', value: apu.ventes[i], color: C[2] },
  { name: 'Revenus de la propriété', note: 'dividendes, intérêts reçus', value: apu.revenusPropriete[i], color: C[4] },
  { name: 'Autres transferts reçus', note: 'dont fonds européens', value: apu.autresTransferts[i], color: C[5] },
  { name: 'Impôts en capital', note: 'droits de succession et de donation', value: apu.impotsCapital[i], color: C[6] },
].sort((a, b) => b.value - a.value)

// Le fichier stocke en positif les recettes reversées aux collectivités et à l'UE (« prélèvements »).
const stateTree = () => recettesEtat.map(t => {
  const sign = t.nom.startsWith('Prélèvement') ? -1 : 1
  return {
    name: t.nom, value: sign * t.montant, tag: sign < 0 ? 'déduit' : null,
    children: [...t.lignes].filter(l => l.montant).sort((a, b) => b.montant - a.montant).map(l => ({ name: l.lib, value: sign * l.montant })),
  }
})

export default function Revenue() {
  const twoPillars = (apu.cotisationsSociales[i] + apu.tva[i]) / apu.recettes[i] * 100
  return (
    <>
      <Card title={`Recettes publiques ${Y} : ${bn(apu.recettes[i])}`} sub={`${pct(apu.recettesPct[i])} du PIB, toutes administrations`} src={SRC.eurostatMain}>
        <DrillList rows={tree()} total={apu.recettes[i]} fmt={v => bn(v)} />
        <p className="hint">Cotisations sociales et TVA : {pct(twoPillars, 0)} des recettes. Prélèvements obligatoires : {pct(byLevel2025.levies)} du PIB.</p>
      </Card>

      <div className="grid2">
        <Card title={`Les grandes recettes, ${years[0]}-${Y}`} sub="Md€ courants" src={SRC.eurostatMain}>
          <LineChart height={250}
            series={[
              { name: 'Total des recettes', color: 'var(--tx)', width: 2.5, points: years.map((y, k) => [y, apu.recettes[k]]) },
              { name: 'Cotisations sociales', color: C[3], points: years.map((y, k) => [y, apu.cotisationsSociales[k]]) },
              { name: 'Impôts sur la production', color: C[0], points: years.map((y, k) => [y, apu.impotsProduction[k]]) },
              { name: 'Impôts sur le revenu et le patrimoine', color: C[1], points: years.map((y, k) => [y, apu.impotsRevenuPatrimoine[k]]) },
              { name: 'dont TVA', color: C[5], dash: true, points: years.map((y, k) => [y, apu.tva[k]]) },
            ]}
            axes={{ left: { fmt: v => fmt(v, 0), tipFmt: v => bn(v) } }}
          />
        </Card>
        <Card title="Qui collecte" sub={`Recettes par niveau d’administration, ${Y}, Md€`} src={SRC.insee2106}>
          <StackedH segs={byLevel2025.revenue.map((s, k) => ({ ...s, color: [C[0], C[1], C[2]][k] }))} fmt={v => fmt(v, 0)} height={40} />
          <h4>Recettes en % du PIB</h4>
          <LineChart height={150} series={[{ name: 'Recettes / PIB', color: C[0], points: years.map((y, k) => [y, apu.recettesPct[k]]) }]} axes={{ left: { fmt: v => fmt(v, 0) + ' %', tipFmt: v => pct(v) } }} />
        </Card>
      </div>

      <Card title="Recettes du budget de l’État, ligne par ligne (PLF 2025)" sub="L’État seul. Lignes négatives : reversées aux collectivités et à l’UE." src={SRC.plf25rec}>
        <DrillList rows={stateTree()} fmt={eur} />
      </Card>
    </>
  )
}
