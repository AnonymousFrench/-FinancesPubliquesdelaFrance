// Onglet « Dette et financement » : la dette, puis le financement de l'État, chacun dans sa zone grise.
// /dette et /financement gardent leur adresse ; /financement fait défiler jusqu'à la zone Financement.
import React, { Suspense, lazy, useEffect } from 'react'
import { T } from '../i18n.js'

const Debt = lazy(() => import('./Debt.jsx'))
const Financing = lazy(() => import('./Financing.jsx'))

export default function DebtFinancing({ route }) {
  const fin = route?.id === 'financement'
  useEffect(() => {
    if (!fin) return
    // Attendre que les deux zones soient affichées avant de défiler.
    const t = setTimeout(() => document.getElementById('financement')?.scrollIntoView({ block: 'start' }), 120)
    return () => clearTimeout(t)
  }, [fin])
  const wait = <div className="card loading">{T('Chargement…', 'Loading…')}</div>
  return (
    <Suspense fallback={wait}>
      <section className="zone" id="dette" aria-labelledby="h-dette">
        <h2 id="h-dette">{T('Dette', 'Debt')}</h2>
        <Debt />
      </section>
      <section className="zone" id="financement" aria-labelledby="h-fin">
        <h2 id="h-fin">{T('Financement', 'Financing')}</h2>
        <Financing />
      </section>
    </Suspense>
  )
}
