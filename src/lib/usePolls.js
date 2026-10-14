import { useEffect, useState } from 'react'
import snapshot from '../data/polls-snapshot.json'
import { fetchLivePolls, average } from './polls.js'

// Affiche tout de suite l'instantané du build, puis le remplace par la version en direct de Wikipédia.
// Une seule requête par visite, partagée entre les onglets.
let live = null

export function usePolls() {
  const [state, setState] = useState(() => ({ data: snapshot, status: 'snapshot' }))
  useEffect(() => {
    let on = true
    ;(live = live || fetchLivePolls())
      .then(data => on && setState({ data, status: 'live' }))
      .catch(e => { live = null; on && setState(s => ({ ...s, status: 'error', error: e.message })) })
    return () => { on = false }
  }, [])
  return state
}

export const today = () => new Date().toISOString().slice(0, 10)
export const daysBefore = (iso, n) => new Date(new Date(iso + 'T00:00:00Z').getTime() - n * 864e5).toISOString().slice(0, 10)

// Moyenne actuelle et variation sur 30 jours pour un candidat (fenêtre glissante de 45 jours).
export function pollOf(data, name) {
  const t = today()
  const now = average(data.first, t).rows.find(r => r.name === name)
  const before = average(data.first, daysBefore(t, 30)).rows.find(r => r.name === name)
  return now ? { v: now.v, delta: before ? now.v - before.v : null, n: now.n } : null
}
