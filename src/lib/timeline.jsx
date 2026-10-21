import React, { useEffect, useRef, useState } from 'react'
import { T } from '../i18n.js'

// Frise temporelle continue partagée par les graphiques animés : lecture fluide, curseur libre
// qui revient sur l'année publiée la plus proche au relâchement, flèches du clavier d'une année publiée à l'autre.

// Interpolation linéaire entre années publiées.
export const lerp = (xs, vs, t) => {
  if (t <= xs[0]) return vs[0]
  for (let i = 0; i < xs.length - 1; i++) if (t <= xs[i + 1]) { const f = (t - xs[i]) / (xs[i + 1] - xs[i]); return vs[i] * (1 - f) + vs[i + 1] * f }
  return vs.at(-1)
}
export const nearest = (xs, t) => xs.reduce((b, y) => Math.abs(y - t) < Math.abs(b - t) ? y : b, xs[0])
// Encadrement de t : indices des deux années publiées et poids de la seconde.
export const bracket = (xs, t) => {
  if (t <= xs[0]) return [0, 0, 0]
  for (let i = 0; i < xs.length - 1; i++) if (t <= xs[i + 1]) return [i, i + 1, (t - xs[i]) / (xs[i + 1] - xs[i])]
  return [xs.length - 1, xs.length - 1, 0]
}

export function useTimeline(years, start, seconds = 11) {
  const y0 = years[0], y1 = years.at(-1)
  const [t, setT] = useState(start ?? y1)
  const [play, setPlay] = useState(false)
  useEffect(() => {
    if (!play) return
    let raf, last = performance.now()
    const speed = (y1 - y0) / seconds
    const tick = now => {
      const dt = (now - last) / 1000; last = now
      setT(v => {
        const n = Math.min(y1, v + dt * speed)
        if (n >= y1) setPlay(false)
        return n
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [play, y0, y1, seconds])
  return { t, setT, play, setPlay }
}

// split : dernière année observée ; au-delà, la frise est grisée et l'année suivie de « projection ».
export function Timeline({ years, t, setT, play, setPlay, split, labelEvery }) {
  const y0 = years[0], y1 = years.at(-1)
  const track = useRef(null)
  const [tw, setTw] = useState(600)
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setTw(e.contentRect.width || 600))
    ro.observe(track.current); return () => ro.disconnect()
  }, [])
  const year = Math.round(t)
  const snap = () => setT(v => nearest(years, v))
  const key = e => {
    const i = years.indexOf(nearest(years, t))
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setPlay(false); setT(years[Math.min(years.length - 1, i + 1)]) }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setPlay(false); setT(years[Math.max(0, i - 1)]) }
  }
  // Graduations : années publiées, libellées si la place le permet (ou une année sur labelEvery).
  const pos = y => (y - y0) / (y1 - y0) * 100
  const gap = 4400 / tw
  let lastLab = -100
  const ticks = years.map(y => {
    const p = pos(y)
    let lab = (labelEvery ? y % labelEvery === 0 : true) && p - lastLab >= gap && pos(y1) - p >= gap
    if (y === y1) lab = true
    if (lab) lastLab = p
    return { y, p, lab }
  })
  const proj = split != null && t > split + 1e-9
  return (
    <div className="im-time">
      <button type="button" className="im-play" onClick={() => { if (play) { setPlay(false); snap() } else { if (t >= y1) setT(y0); setPlay(true) } }} aria-label={play ? T('Pause', 'Pause') : T('Lecture', 'Play')}>
        {play ? <svg viewBox="0 0 12 12" width="12" height="12"><rect x="2" y="1.5" width="3" height="9" rx="1" fill="currentColor" /><rect x="7" y="1.5" width="3" height="9" rx="1" fill="currentColor" /></svg>
          : <svg viewBox="0 0 12 12" width="12" height="12"><path d="M3 1.5v9l7.5-4.5z" fill="currentColor" /></svg>}
      </button>
      <div className="im-track" ref={track}>
        {split != null && split < y1 && <div className="im-proj" style={{ left: `calc(8px + (100% - 16px) * ${pos(split) / 100})` }} aria-hidden="true" />}
        <input type="range" min={y0} max={y1} step="any" value={t} aria-label={T('Année', 'Year')} aria-valuetext={String(year)}
          onChange={e => { setPlay(false); setT(+e.target.value) }} onPointerUp={snap} onTouchEnd={snap} onKeyDown={key} />
        <div className="im-ticks" aria-hidden="true">{ticks.map(x => <span key={x.y} style={{ left: `${x.p}%` }} className={x.lab ? 'lab' : ''}><i />{x.lab && <b>{x.y}</b>}</span>)}</div>
      </div>
      <span className={'im-year' + (proj ? ' proj' : '')}>{year}{proj && <small>{T('projection', 'projection')}</small>}</span>
    </div>
  )
}
