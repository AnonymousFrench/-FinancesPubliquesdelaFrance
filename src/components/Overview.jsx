import React, { useMemo } from 'react'
import { sankey, sankeyLinkHorizontal } from 'd3-sankey'
import { apu } from '../data/apu.js'
import { debtLatest, financing2026, aft, SRC } from '../data/data.js'
import { oat10 } from '../data/taux.js'
import { Card } from './ui.jsx'
import { Sparkline } from '../lib/charts.jsx'
import { fmt, bn, pct } from '../lib/format.js'

const i = apu.years.length - 1
const Y = +apu.years[i]
const years = apu.years.map(Number)

// Flux 2025, comptes nationaux Eurostat. Les lignes « résiduelles » referment l'écart avec les totaux publiés.
const revenueLines = () => {
  const L = [
    ['Impôts sur la production et les importations (TVA, accises…)', apu.impotsProduction[i]],
    ['Cotisations sociales', apu.cotisationsSociales[i]],
    ['Impôts sur le revenu et le patrimoine (IR, CSG, IS)', apu.impotsRevenuPatrimoine[i]],
    ['Ventes de services', apu.ventes[i]],
    ['Revenus de la propriété', apu.revenusPropriete[i]],
    ['Autres transferts reçus', apu.autresTransferts[i]],
    ['Impôts en capital (successions…)', apu.impotsCapital[i]],
  ]
  const rest = apu.recettes[i] - L.reduce((s, l) => s + l[1], 0)
  if (rest > 0.5) L.push(['Autres recettes (résidu)', +rest.toFixed(1)])
  return L
}
export const spendingLines = () => {
  const L = [
    ['Prestations sociales en espèces (retraites, famille, chômage)', apu.prestationsSociales[i], '#e1000f'],
    ['Rémunérations des agents publics', apu.remunerations[i], '#2148c0'],
    ['Consommations intermédiaires', apu.consommationIntermediaire[i], '#f28c28'],
    ['Investissement public', apu.fbcf[i], '#2a9d8f'],
    ['Transferts courants (UE, autres)', apu.transfertsCourants[i], '#9aa4b2'],
    ['Intérêts de la dette', apu.interets[i], '#7a5af8'],
    ['Subventions aux entreprises', apu.subventions[i], '#8e7cc3'],
    ['Transferts en capital', apu.transfertsCapital[i], '#b8c0cc'],
  ]
  const rest = apu.depenses[i] - L.reduce((s, l) => s + l[1], 0)
  // Surtout des prestations en nature achetées au privé : soins remboursés, médicaments, aides au logement.
  L.splice(1, 0, ['Prestations sociales en nature et autres (résidu)', +rest.toFixed(1), '#f4a582'])
  return L
}

const SHORT = {
  'Impôts sur la production et les importations (TVA, accises…)': 'Impôts sur la production (TVA…)',
  'Impôts sur le revenu et le patrimoine (IR, CSG, IS)': 'Impôts sur le revenu et le patrimoine',
  'Impôts en capital (successions…)': 'Impôts en capital',
  'Autres transferts reçus': 'Autres transferts',
  'Autres recettes (résidu)': 'Autres recettes',
  'Prestations sociales en espèces (retraites, famille, chômage)': 'Prestations en espèces',
  'Prestations sociales en nature et autres (résidu)': 'Prestations en nature et autres',
  'Transferts courants (UE, autres)': 'Transferts courants',
  'Subventions aux entreprises': 'Subventions',
  'Rémunérations des agents publics': 'Rémunérations',
}

function Flows() {
  const W = 1000, H = 520
  const { nodes, links } = useMemo(() => {
    const L = revenueLines(), R = spendingLines()
    const ns = [...L.map(l => ({ name: l[0], side: 'in' })), { name: 'Emprunt nouveau (déficit)', side: 'debt' }, { name: 'Administrations publiques', side: 'hub' }, ...R.map(r => ({ name: r[0], side: r[0].startsWith('Intérêts') ? 'int' : 'out' }))]
    const idx = Object.fromEntries(ns.map((n, k) => [n.name, k]))
    const ls = [
      ...L.map(l => ({ source: idx[l[0]], target: idx['Administrations publiques'], value: l[1] })),
      { source: idx['Emprunt nouveau (déficit)'], target: idx['Administrations publiques'], value: -apu.solde[i] },
      ...R.map(r => ({ source: idx['Administrations publiques'], target: idx[r[0]], value: r[1] })),
    ]
    return sankey().nodeWidth(12).nodePadding(10).nodeSort(null)
      .nodeAlign(n => n.side === 'hub' ? 1 : n.side === 'in' || n.side === 'debt' ? 0 : 2)
      .extent([[230, 6], [W - 215, H - 6]])({ nodes: ns.map(n => ({ ...n })), links: ls.map(l => ({ ...l })) })
  }, [])
  const color = n => n.side === 'debt' ? 'var(--red)' : n.side === 'int' ? '#7a5af8' : n.side === 'hub' ? 'var(--tx)' : n.side === 'in' ? 'var(--green)' : 'var(--blue)'
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sankey">
      {links.map((l, k) => (
        <path key={k} d={sankeyLinkHorizontal()(l)} fill="none" strokeWidth={Math.max(1, l.width)}
          stroke={color(l.source.side === 'hub' ? l.target : l.source)} opacity={0.22} />
      ))}
      {nodes.map(n => {
        const right = n.side === 'out' || n.side === 'int'
        return (
          <g key={n.index}>
            <rect x={n.x0} y={n.y0} width={n.x1 - n.x0} height={Math.max(1, n.y1 - n.y0)} fill={color(n)} rx={2} />
            {n.side !== 'hub' && (
              <text x={right ? n.x1 + 7 : n.x0 - 7} y={(n.y0 + n.y1) / 2} dy="0.35em" textAnchor={right ? 'start' : 'end'} className="sk-l">
                <tspan className={n.side === 'debt' ? 'bad' : ''}>{SHORT[n.name] || n.name}</tspan>
                <tspan className="sk-v"> {fmt(n.value, 0)}</tspan>
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// Une tuile par sous-rubrique : chiffre clé, trois repères, tendance longue, lien vers le détail.
function Tile({ href, title, value, unit, sub, items, spark, color, tone }) {
  return (
    <a className="tile" href={href}>
      <span className="tile-h">{title}<span className="tile-go">Détails →</span></span>
      <span className={'tile-v ' + (tone || '')}>{value}<small>{unit}</small></span>
      <span className="tile-s">{sub}</span>
      <span className="tile-spark"><Sparkline values={spark} color={color} w={260} h={38} /></span>
      <span className="tile-list">{items.map(([k, v]) => <span key={k}><em>{k}</em><b>{v}</b></span>)}</span>
    </a>
  )
}

export default function Overview() {
  const gap = apu.depenses[i] - apu.recettes[i]
  const need = financing2026.needs.reduce((s, x) => s + x.v, 0)
  const oatYears = [...new Set(oat10.map(([d]) => d.slice(0, 4)))].filter(y => y >= '2005')
  const oatAvg = oatYears.map(y => { const v = oat10.filter(([d, x]) => d.startsWith(y) && x != null).map(([, x]) => x); return v.reduce((a, b) => a + b, 0) / v.length })
  const lastOat = oat10.filter(([, v]) => v != null).at(-1)
  return (
    <>
      <Card title={`L’équation ${Y}`} sub={`Pour 100 € de recettes, ${fmt(apu.depenses[i] / apu.recettes[i] * 100)} € de dépenses. La dette a augmenté de ${bn(apu.dette[i] - apu.dette[i - 1])} en ${Y}.`} src={[SRC.eurostatMain, SRC.inseeDebtQ]}>
        <div className="equation">
          <div className="eq"><div className="eq-l">Recettes</div><div className="eq-v good">{fmt(apu.recettes[i])}</div><div className="eq-s">Md€ · {pct(apu.recettesPct[i])} du PIB</div></div>
          <div className="eq-op">−</div>
          <div className="eq"><div className="eq-l">Dépenses</div><div className="eq-v blue">{fmt(apu.depenses[i])}</div><div className="eq-s">Md€ · {pct(apu.depensesPct[i])} du PIB</div></div>
          <div className="eq-op">=</div>
          <div className="eq"><div className="eq-l">Déficit</div><div className="eq-v bad">−{fmt(gap)}</div><div className="eq-s">Md€ · {pct(-apu.soldePct[i])} du PIB</div></div>
          <div className="eq-op">→</div>
          <div className="eq"><div className="eq-l">Dette, {debtLatest.label}</div><div className="eq-v bad">{fmt(debtLatest.total, 0)}</div><div className="eq-s">Md€ · {pct(debtLatest.pct)} du PIB</div></div>
        </div>
      </Card>

      <div className="tiles">
        <Tile href="/recettes" title="Recettes" value={fmt(apu.recettes[i], 0)} unit=" Md€" sub={`${pct(apu.recettesPct[i])} du PIB · ${years[0]}-${Y}`} color="var(--green)" tone="good"
          spark={apu.recettesPct} items={[['Cotisations sociales', bn(apu.cotisationsSociales[i], 0)], ['TVA', bn(apu.tva[i], 0)], ['IR, CSG, IS', bn(apu.impotsRevenuPatrimoine[i], 0)]]} />
        <Tile href="/depenses" title="Dépenses" value={fmt(apu.depenses[i], 0)} unit=" Md€" sub={`${pct(apu.depensesPct[i])} du PIB · ${years[0]}-${Y}`} color="var(--blue)" tone="blue"
          spark={apu.depensesPct} items={[['Prestations sociales', bn(apu.prestationsSociales[i], 0)], ['Rémunérations', bn(apu.remunerations[i], 0)], ['Investissement', bn(apu.fbcf[i], 0)]]} />
        <Tile href="/dette" title="Dette" value={fmt(debtLatest.total, 0)} unit=" Md€" sub={`${pct(debtLatest.pct)} du PIB · ${years[0]}-${debtLatest.label}`} color="var(--red)" tone="bad"
          spark={[...apu.dettePct, debtLatest.pct]} items={[['Intérêts ' + Y, bn(apu.interets[i])], ['Taux moyen', pct(apu.tauxApparent[i], 2)], ['Hausse en ' + Y, bn(apu.dette[i] - apu.dette[i - 1], 0)]]} />
        <Tile href="/financement" title="Financement" value={fmt(need, 0)} unit=" Md€" sub={`à emprunter en 2026 · OAT 10 ans ${oatYears[0]}-${lastOat[0].slice(0, 4)}`} color="var(--orange)"
          spark={oatAvg} items={[['Dette à rembourser', bn(financing2026.needs[0].v, 0)], ['OAT 10 ans', pct(aft.spot10.v, 2)], ['Non-résidents', aft.nonResidents]]} />
      </div>

      <Card title={`D’où vient l’argent et où il va, ${Y}`} sub="Md€" src={SRC.eurostatMain}>
        <div className="sankey-wrap"><Flows /></div>
      </Card>
    </>
  )
}
