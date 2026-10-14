import React, { useEffect, useMemo, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { regionPerCap, localMeta, SRC } from '../data/data.js'
import { Card } from './ui.jsx'
import { fmt } from '../lib/format.js'

export default function MapView() {
  const [geo, setGeo] = useState(null)
  const [hov, setHov] = useState(null)
  useEffect(() => { fetch('/geo/regions.geojson').then(r => r.json()).then(setGeo).catch(() => setGeo(false)) }, [])
  const vals = Object.values(regionPerCap).map(v => v.total)
  const lo = Math.min(...vals), hi = Math.max(...vals)
  const col = v => { const t = (v - lo) / (hi - lo); return `hsl(${215 - t * 10} ${40 + t * 30}% ${82 - t * 52}%)` }
  const { paths } = useMemo(() => {
    if (!geo) return { paths: [] }
    const proj = geoMercator().fitSize([560, 560], geo)
    const gp = geoPath(proj)
    return { paths: geo.features.map(f => ({ code: f.properties.code, name: f.properties.nom, d: gp(f) })) }
  }, [geo])
  const h = hov && regionPerCap[hov.code]
  return (
    <div className="grid2">
      <Card title="Regional council spending per inhabitant, 2025" sub="€ per inhabitant, total real spending excluding loan repayment (budgets primitifs)" src={SRC.regions}>
        {geo === false && <p className="src warn">Map file not found.</p>}
        <svg viewBox="0 0 560 560" className="map">
          {paths.map(p => {
            const v = regionPerCap[p.code]
            return <path key={p.code} d={p.d} fill={v ? col(v.total) : 'var(--line)'} stroke="#fff" strokeWidth="1" onMouseEnter={() => setHov(p)} onMouseLeave={() => setHov(null)} />
          })}
        </svg>
        <div className="ramp"><span>€{lo}</span><div /><span>€{hi}</span></div>
      </Card>
      <Card title={hov ? hov.name : 'Hover a region'} sub={h ? '€ per inhabitant' : hov ? 'No data retrieved (single territorial authority)' : undefined}>
        {h && <table className="t"><tbody><tr><td>Total</td><td>{h.total}</td></tr><tr><td>Day-to-day operations</td><td>{h.fn}</td></tr><tr><td>Investment</td><td>{h.inv}</td></tr></tbody></table>}
        <h4>Context</h4>
        <p className="sub">Regional councils are only a small slice of local spending: €39.5bn of €329.7bn in 2024. Communes and their groupings spend about €178bn and departments €78.3bn, but their geographic split was not retrievable here.</p>
        <table className="t"><thead><tr><th>Local deficit 2025 (€bn)</th><th></th></tr></thead><tbody>{localMeta.deficits.map(([k, v]) => <tr key={k}><td>{k}</td><td>{fmt(v)}</td></tr>)}</tbody></table>
        <p className="src warn">Limits: Corsica, overseas territories and department/commune level are not mapped. Most State spending (pay, pensions, benefits) is not allocated to places in any open source I could access.</p>
      </Card>
    </div>
  )
}
