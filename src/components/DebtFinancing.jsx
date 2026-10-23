// Onglet « Dette et financement » : deux tuiles servent de sous-onglets (/dette et /financement gardent leur adresse).
import React, { Suspense, lazy } from 'react'
import { debtLatest, financing2026 } from '../data/data.js'
import { bn, pct } from '../lib/format.js'
import { T, getLang } from '../i18n.js'
import { withLang } from '../routes.js'
import { dt } from '../data/dataEn.js'

const Debt = lazy(() => import('./Debt.jsx'))
const Financing = lazy(() => import('./Financing.jsx'))
const need = financing2026.needs.reduce((s, x) => s + x.v, 0)

export default function DebtFinancing({ route }) {
  const fin = route?.id === 'financement'
  const tile = (id, path, title, value, sub) => (
    <a className={'tile' + ((id === 'financement') === fin ? ' on' : '')} href={withLang(path, getLang())} aria-current={(id === 'financement') === fin ? 'page' : undefined}>
      <span className="tile-h">{title}<span className="tile-go">{T('Voir →', 'View →')}</span></span>
      <span className="tile-v bad">{value}</span>
      <span className="tile-s">{sub}</span>
    </a>
  )
  return (
    <>
      <div className="tiles two">
        {tile('dette', '/dette', T('Dette', 'Debt'), bn(debtLatest.total, 0), T(`${pct(debtLatest.pct)} du PIB au ${debtLatest.label} : montant, évolution, coût`, `${pct(debtLatest.pct)} of GDP in ${dt(debtLatest.label)}: amount, trend, cost`))}
        {tile('financement', '/financement', T('Financement', 'Financing'), bn(need, 0), T('à emprunter en 2026 : besoins, marchés, taux à 10 ans', 'to borrow in 2026: needs, markets, 10-year rates'))}
      </div>
      <Suspense fallback={<div className="card loading">{T('Chargement…', 'Loading…')}</div>}>{fin ? <Financing /> : <Debt />}</Suspense>
    </>
  )
}
