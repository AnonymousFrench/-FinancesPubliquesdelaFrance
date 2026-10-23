import React, { useMemo } from 'react'
import { sankey, sankeyLinkHorizontal } from 'd3-sankey'
import { apu } from '../data/apu.js'
import { debtLatest, financing2026, aft, SRC } from '../data/data.js'
import { oat10 } from '../data/taux.js'
import { Card } from './ui.jsx'
import { Sparkline } from '../lib/charts.jsx'
import { fmt, bn, pct, unitBn } from '../lib/format.js'
import { T } from '../i18n.js'
import { dt } from '../data/dataEn.js'
import { withLang } from '../routes.js'
import { getLang } from '../i18n.js'
const lp = p => withLang(p, getLang())

const i = apu.years.length - 1
const Y = +apu.years[i]
const years = apu.years.map(Number)

// Flux 2025, comptes nationaux Eurostat. Les lignes « résiduelles » referment l'écart avec les totaux publiés.
// Chaque ligne : [libellé, montant, libellé court, couleur?]
const revenueLines = () => {
  const L = [
    [T('Impôts sur la production et les importations (TVA, accises…)', 'Production and import taxes (VAT, excise…)'), apu.impotsProduction[i], T('TVA et taxes sur la production', 'VAT and production taxes')],
    [T('Cotisations sociales', 'Social contributions'), apu.cotisationsSociales[i]],
    [T('Impôts sur le revenu et le patrimoine (IR, CSG, IS)', 'Income and wealth taxes (income tax, CSG, corporate tax)'), apu.impotsRevenuPatrimoine[i], T('Impôts sur le revenu et le patrimoine', 'Income and wealth taxes')],
    [T('Ventes de services', 'Sales of services'), apu.ventes[i]],
    [T('Revenus de la propriété', 'Property income'), apu.revenusPropriete[i]],
    [T('Autres transferts reçus', 'Other transfers received'), apu.autresTransferts[i], T('Autres transferts', 'Other transfers')],
    [T('Impôts en capital (successions…)', 'Capital taxes (inheritance…)'), apu.impotsCapital[i], T('Impôts en capital', 'Capital taxes')],
  ]
  const rest = apu.recettes[i] - L.reduce((s, l) => s + l[1], 0)
  if (rest > 0.5) L.push([T('Autres recettes (résidu)', 'Other revenue (residual)'), +rest.toFixed(1), T('Autres recettes', 'Other revenue')])
  return L
}
export const spendingLines = () => {
  const L = [
    [T('Prestations sociales en espèces (retraites, famille, chômage)', 'Cash social benefits (pensions, family, unemployment)'), apu.prestationsSociales[i], T('Prestations en espèces', 'Cash benefits'), '#e1000f'],
    [T('Rémunérations des agents publics', 'Public sector pay'), apu.remunerations[i], T('Rémunérations', 'Pay'), '#2148c0'],
    [T('Consommations intermédiaires', 'Intermediate consumption'), apu.consommationIntermediaire[i], null, '#f28c28'],
    [T('Investissement public', 'Public investment'), apu.fbcf[i], null, '#2a9d8f'],
    [T('Transferts courants (UE, autres)', 'Current transfers (EU, other)'), apu.transfertsCourants[i], T('Transferts courants', 'Current transfers'), '#9aa4b2'],
    [T('Intérêts de la dette', 'Interest on debt'), apu.interets[i], null, '#7a5af8'],
    [T('Subventions aux entreprises', 'Subsidies to companies'), apu.subventions[i], T('Subventions', 'Subsidies'), '#8e7cc3'],
    [T('Transferts en capital', 'Capital transfers'), apu.transfertsCapital[i], null, '#b8c0cc'],
  ]
  const rest = apu.depenses[i] - L.reduce((s, l) => s + l[1], 0)
  // Surtout des prestations en nature achetées au privé : soins remboursés, médicaments, aides au logement.
  L.splice(1, 0, [T('Prestations sociales en nature et autres (résidu)', 'In-kind social benefits and other (residual)'), +rest.toFixed(1), T('Prestations en nature et autres', 'In-kind benefits and other'), '#f4a582'])
  return L
}

function Flows() {
  const W = 1000, H = 520
  const { nodes, links } = useMemo(() => {
    const L = revenueLines(), R = spendingLines()
    const NEW = T('Emprunt nouveau (déficit)', 'New borrowing (deficit)'), HUB = T('Administrations publiques', 'General government')
    const ns = [...L.map(l => ({ name: l[0], short: l[2], side: 'in' })), { name: NEW, side: 'debt' }, { name: HUB, side: 'hub' }, ...R.map((r, k) => ({ name: r[0], short: r[2], side: r[0] === T('Intérêts de la dette', 'Interest on debt') ? 'int' : 'out' }))]
    const idx = Object.fromEntries(ns.map((n, k) => [n.name, k]))
    const ls = [
      ...L.map(l => ({ source: idx[l[0]], target: idx[HUB], value: l[1] })),
      { source: idx[NEW], target: idx[HUB], value: -apu.solde[i] },
      ...R.map(r => ({ source: idx[HUB], target: idx[r[0]], value: r[1] })),
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
                <tspan className={n.side === 'debt' ? 'bad' : ''}>{n.short || n.name}</tspan>
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
      <span className="tile-h">{title}<span className="tile-go">{T('Détails →', 'Details →')}</span></span>
      <span className={'tile-v ' + (tone || '')}>{value}{unit && <small> {unitBn()}</small>}</span>
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
  const gdp = T('du PIB', 'of GDP')
  const dl = dt(debtLatest.label)
  return (
    <Card className="group">
      <Card title={T(`L’équation ${Y}`, `The ${Y} equation`)}
        sub={T(`Pour 100 € de recettes, ${fmt(apu.depenses[i] / apu.recettes[i] * 100)} € de dépenses. La dette a augmenté de ${bn(apu.dette[i] - apu.dette[i - 1])} en ${Y}.`, `For every €100 of revenue, €${fmt(apu.depenses[i] / apu.recettes[i] * 100)} of spending. Debt rose by ${bn(apu.dette[i] - apu.dette[i - 1])} in ${Y}.`)}
        src={[SRC.eurostatMain, SRC.inseeDebtQ]}>
        <div className="tiles flow">
          <Tile href={lp('/recettes')} title={T('Recettes', 'Revenue')} value={fmt(apu.recettes[i])} unit sub={`${pct(apu.recettesPct[i])} ${gdp} · ${years[0]}-${Y}`} color="var(--green)" tone="good"
            spark={apu.recettesPct} items={[[T('Cotisations sociales', 'Social contributions'), bn(apu.cotisationsSociales[i], 0)], [T('Taxe sur la valeur ajoutée', 'Value-added tax (VAT)'), bn(apu.tva[i], 0)], [T('Impôts sur revenus et sociétés', 'Income and corporate taxes'), bn(apu.impotsRevenuPatrimoine[i], 0)]]} />
          <span className="eq-op">−</span>
          <Tile href={lp('/depenses')} title={T('Dépenses', 'Spending')} value={fmt(apu.depenses[i])} unit sub={`${pct(apu.depensesPct[i])} ${gdp} · ${years[0]}-${Y}`} color="var(--blue)" tone="blue"
            spark={apu.depensesPct} items={[[T('Prestations sociales', 'Social benefits'), bn(apu.prestationsSociales[i], 0)], [T('Rémunérations', 'Public pay'), bn(apu.remunerations[i], 0)], [T('Investissement', 'Investment'), bn(apu.fbcf[i], 0)]]} />
          <span className="eq-op">=</span>
          <Tile href={lp('/financement')} title={T('Déficit', 'Deficit')} value={'−' + fmt(gap)} unit sub={`${pct(-apu.soldePct[i])} ${gdp} · ${T('financé par l’emprunt', 'financed by borrowing')}`} color="var(--orange)" tone="bad"
            spark={apu.soldePct.map(v => -v)} items={[[T('À emprunter en 2026', 'To borrow in 2026'), bn(need, 0)], [T('dont dette à rembourser', 'of which maturing debt'), bn(financing2026.needs[0].v, 0)], [T('Obligation à 10 ans (OAT)', '10-year bond (OAT)'), pct(aft.rate10.v, 2)]]} />
          <span className="eq-op">→</span>
          <Tile href={lp('/dette')} title={T('Dette', 'Debt')} value={fmt(debtLatest.total, 0)} unit sub={`${pct(debtLatest.pct)} ${gdp} · ${dl}`} color="var(--red)" tone="bad"
            spark={[...apu.dettePct, debtLatest.pct]} items={[[T('Intérêts ', 'Interest ') + Y, bn(apu.interets[i])], [T('Taux moyen', 'Average rate'), pct(apu.tauxApparent[i], 2)], [T('Hausse en ', 'Rise in ') + Y, bn(apu.dette[i] - apu.dette[i - 1], 0)]]} />
        </div>
      </Card>
      <Card title={T(`D’où vient l’argent et où il va, ${Y}`, `Where the money comes from and where it goes, ${Y}`)} sub={unitBn()} src={SRC.eurostatMain}>
        <div className="sankey-wrap"><Flows /></div>
      </Card>
    </Card>
  )
}
