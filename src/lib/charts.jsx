import React, { useEffect, useMemo, useRef, useState } from 'react'

// Width of a container in CSS pixels, so SVG text renders at its real size.
export function useWidth(fallback = 1000) {
  const ref = useRef(null)
  const [w, setW] = useState(fallback)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

// ─────────────────────────────────────────────────────────────
// LineChart: time series with hover tooltip, optional bars on a second axis,
// a shaded band between two series, event markers and reference lines.
//   series: [{ name, color, points: [[x, y]], dash?, width?, dots?, line?: false, area? }]
//   bars:   { name, color, values: [[x, y]], sameScale? }   (right axis unless sameScale)
//   band:   { from, to, color, label }                        (indexes into series)
//   axes:   { left: { label, fmt, tipFmt }, right: { label, fmt, tipFmt } }
//   markers:[{ x, label, side: 'l' | 'r' }]   refLines: [{ y, label }]
//   shade:  { from, to, label }   (x-range shading, e.g. forecast years)
// ─────────────────────────────────────────────────────────────
export function LineChart({ series = [], bars, band, axes = {}, height = 260, markers = [], refLines = [], shade, xFmt = v => v, tipX, yMin, yMax, xTicks, legend = true }) {
  const [hover, setHover] = useState(null)
  const ref = useRef(null)
  const [wrap, W] = useWidth()
  const H = height
  const m = { l: 50, r: bars && !bars.sameScale ? 60 : 18, t: 14, b: 26 }
  const iw = W - m.l - m.r, ih = H - m.t - m.b

  const valid = p => p[1] != null && !Number.isNaN(p[1])
  const xsAll = [...series.flatMap(s => s.points.filter(valid).map(p => p[0])), ...(bars ? bars.values.map(p => p[0]) : [])]
  const x0 = Math.min(...xsAll), x1 = Math.max(...xsAll)
  const padX = bars ? (x1 - x0) / (bars.values.length || 1) * 0.6 : 0
  const X = v => m.l + (v - x0 + padX) / (x1 - x0 + 2 * padX || 1) * iw

  const leftVals = series.flatMap(s => s.points.filter(valid).map(p => p[1])).concat(refLines.map(r => r.y))
  const barVals = bars ? bars.values.filter(valid).map(p => p[1]) : []
  const yL = domain(bars?.sameScale ? leftVals.concat(barVals, 0) : leftVals, yMin, yMax)
  const yR = bars ? (bars.sameScale ? yL : domain(barVals.concat(0))) : null
  const YL = v => m.t + ih - (v - yL[0]) / (yL[1] - yL[0]) * ih
  const YR = v => m.t + ih - (v - yR[0]) / (yR[1] - yR[0]) * ih
  const fmtL = axes.left?.fmt || (v => v), fmtR = axes.right?.fmt || (v => v)
  const bw = bars ? Math.max(2, iw / (bars.values.length + 1) * 0.6) : 0

  // Snap hover to the nearest x present in any series or bars.
  const xsSnap = useMemo(() => [...new Set(xsAll)].sort((a, b) => a - b), [series, bars])
  const onMove = e => {
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width * W
    const v = (px - m.l) / iw * (x1 - x0 + 2 * padX) + x0 - padX
    let best = null, bd = Infinity
    for (const xv of xsSnap) { const d = Math.abs(xv - v); if (d < bd) { bd = d; best = xv } }
    setHover(best)
  }

  const tip = hover == null ? null : {
    rows: [
      ...series.map(s => { const p = s.points.find(q => q[0] === hover); return p && valid(p) ? { name: s.name, color: s.color, v: (axes.left?.tipFmt || fmtL)(p[1]) } : null }),
      ...(bars ? [bars.values.find(q => q[0] === hover)].filter(p => p && valid(p)).map(p => ({ name: bars.name, color: bars.color, v: (bars.sameScale ? (axes.left?.tipFmt || fmtL) : (axes.right?.tipFmt || fmtR))(p[1]), bar: true })) : []),
    ].filter(Boolean),
  }
  const tipLeft = hover != null ? X(hover) / W * 100 : 0

  const ticks = niceTicks(yL[0], yL[1])
  const xt = xTicks || autoXTicks(x0, x1)

  return (
    <div className="lc">
      {legend && <div className="legend top">
        {series.filter(s => !s.hideLegend).map(s => (
          <span key={s.name}>
            {s.line === false ? <i className="dot" style={{ background: s.color }} /> : <i className={s.dash ? 'dash' : ''} style={s.dash ? { borderColor: s.color } : { background: s.color }} />}
            {s.name}
          </span>
        ))}
        {bars && <span><i style={{ background: bars.color, opacity: 0.55 }} />{bars.name}</span>}
        {band && <span><i style={{ background: band.color, opacity: 0.25 }} />{band.label}</span>}
        {shade && <span><i style={{ background: 'var(--shade)' }} />{shade.label}</span>}
      </div>}
      <div className="lc-plot" ref={wrap}>
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="chart" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          {shade && <rect x={X(shade.from)} width={X(shade.to) - X(shade.from)} y={m.t} height={ih} fill="var(--shade)" />}
          {ticks.map(t => (
            <g key={t}>
              <line x1={m.l} x2={W - m.r} y1={YL(t)} y2={YL(t)} className={t === 0 ? 'grid zero' : 'grid'} />
              <text x={m.l - 8} y={YL(t) + 4} textAnchor="end" className="ax">{fmtL(t)}</text>
            </g>
          ))}
          {bars && !bars.sameScale && niceTicks(yR[0], yR[1]).map(t => <text key={'r' + t} x={W - m.r + 8} y={YR(t) + 4} className="ax">{fmtR(t)}</text>)}
          {bars && bars.values.filter(valid).map(([xv, yv]) => {
            const Y = bars.sameScale ? YL : YR
            return <rect key={'b' + xv} x={X(xv) - bw / 2} width={bw} y={Math.min(Y(0), Y(yv))} height={Math.max(1, Math.abs(Y(yv) - Y(0)))} fill={bars.color} opacity={hover === xv ? 0.9 : 0.45} rx={1.5} />
          })}
          {band && (() => {
            const a = series[band.from], b = series[band.to]
            const pts = a.points.filter(valid).map(([xv, ya]) => { const pb = b.points.find(q => q[0] === xv); return pb && valid(pb) ? [xv, ya, pb[1]] : null }).filter(Boolean)
            if (pts.length < 2) return null
            const d = 'M' + pts.map(([xv, ya]) => `${X(xv)},${YL(ya)}`).join('L') + 'L' + pts.slice().reverse().map(([xv, , yb]) => `${X(xv)},${YL(yb)}`).join('L') + 'Z'
            return <path d={d} fill={band.color} opacity={band.opacity ?? 0.15} />
          })()}
          {refLines.map(r => (
            <g key={r.label}>
              <line x1={m.l} x2={W - m.r} y1={YL(r.y)} y2={YL(r.y)} className="ref" />
              <text x={W - m.r - 4} y={YL(r.y) - 5} textAnchor="end" className="ax ref-l">{r.label}</text>
            </g>
          ))}
          {series.map(s => {
            const p = s.points.filter(valid)
            return (
              <g key={s.name}>
                {s.line !== false && p.length > 1 && <path d={'M' + p.map(([xv, yv]) => `${X(xv)},${YL(yv)}`).join('L')} fill="none" stroke={s.color} strokeWidth={s.width || 2} strokeDasharray={s.dash ? '6 4' : null} strokeLinejoin="round" strokeLinecap="round" />}
                {(s.dots || s.line === false) && p.map(([xv, yv], di) => <circle key={xv + "_" + di} cx={X(xv)} cy={YL(yv)} r={s.line === false ? 5 : 3} fill={s.line === false ? 'var(--card)' : s.color} stroke={s.color} strokeWidth={s.line === false ? 2.5 : 0} />)}
              </g>
            )
          })}
          {markers.map(mk => (
            <g key={mk.x + mk.label}>
              <line x1={X(mk.x)} x2={X(mk.x)} y1={m.t} y2={m.t + ih} stroke="var(--mut)" strokeDasharray="3 4" opacity={0.5} />
              <text x={X(mk.x) + (mk.side === 'r' ? 6 : -6)} y={m.t + 11} textAnchor={mk.side === 'r' ? 'start' : 'end'} className="ax mk">{mk.label}</text>
            </g>
          ))}
          {xt.map(v => <text key={v} x={X(v)} y={H - 7} textAnchor="middle" className="ax">{xFmt(v)}</text>)}
          {hover != null && <line x1={X(hover)} x2={X(hover)} y1={m.t} y2={m.t + ih} stroke="var(--tx)" opacity={0.25} />}
          {hover != null && series.map(s => { const p = s.points.find(q => q[0] === hover); return p && valid(p) && s.line !== false ? <circle key={s.name} cx={X(hover)} cy={YL(p[1])} r={3.5} fill={s.color} stroke="var(--card)" strokeWidth={1.5} /> : null })}
        </svg>
        {tip && tip.rows.length > 0 && (
          <div className={'tip' + (tipLeft > 62 ? ' flip' : '')} style={{ left: `${tipLeft}%` }}>
            <div className="tip-t">{tipX ? tipX(hover) : xFmt(hover)}</div>
            {tip.rows.map(r => <div key={r.name} className="tip-r"><i style={{ background: r.color, opacity: r.bar ? 0.6 : 1 }} /><span>{r.name}</span><b>{r.v}</b></div>)}
          </div>
        )}
      </div>
      {(axes.left?.label || axes.right?.label) && (
        <div className="axis-labels"><span>{axes.left?.label}</span><span>{axes.right?.label}</span></div>
      )}
    </div>
  )
}

function domain(vals, lo0, hi0) {
  let lo = lo0 ?? Math.min(...vals), hi = hi0 ?? Math.max(...vals)
  if (lo === hi) { lo -= 1; hi += 1 }
  const st = niceStep((hi - lo) / 4)
  return [lo0 ?? Math.floor(lo / st) * st, hi0 ?? Math.ceil(hi / st) * st]
}
function niceStep(raw) {
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const r = raw / mag
  return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag
}
function niceTicks(lo, hi) {
  const st = niceStep((hi - lo) / 4), out = []
  for (let t = Math.ceil(lo / st) * st; t <= hi + st * 1e-6; t += st) out.push(+t.toFixed(6))
  return out
}
function autoXTicks(x0, x1) {
  const span = x1 - x0
  const st = span <= 8 ? 1 : span <= 16 ? 2 : span <= 40 ? 5 : 10
  const out = []
  for (let v = Math.ceil(x0 / st) * st; v <= x1; v += st) out.push(v)
  return out
}

// Sparkline: small line without axes.
export function Sparkline({ values, color = 'var(--blue)', w = 120, h = 30 }) {
  const p = values.map((v, i) => [i, v]).filter(q => q[1] != null)
  if (p.length < 2) return null
  const lo = Math.min(...p.map(q => q[1])), hi = Math.max(...p.map(q => q[1]))
  const X = i => 2 + i / (values.length - 1) * (w - 4)
  const Y = v => h - 3 - (v - lo) / (hi - lo || 1) * (h - 6)
  const last = p.at(-1)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="spark" preserveAspectRatio="none">
      <path d={'M' + p.map(([i, v]) => `${X(i)},${Y(v)}`).join('L')} fill="none" stroke={color} strokeWidth={1.8} vectorEffect="non-scaling-stroke" />
      <circle cx={X(last[0])} cy={Y(last[1])} r={2.5} fill={color} />
    </svg>
  )
}

// Waterfall: needs stacking up to a total, then the resource that covers it.
// items: [{ label, value, kind: 'delta' | 'total', sub, color }]
export function Waterfall({ items, fmt = v => v, height = 240 }) {
  const [wrap, W] = useWidth()
  const m = { l: 46, r: 14, t: 26, b: 42 }
  const iw = W - m.l - m.r
  // Étiquettes passées à la ligne selon la largeur de colonne (mobile).
  const wrap1 = (str, px, cw) => {
    const max = Math.max(6, Math.floor((iw / items.length - 4) / cw)), out = []
    let cur = ''
    for (const w of String(str).split(' ')) { if (cur && (cur + ' ' + w).length > max) { out.push(cur); cur = w } else cur = cur ? cur + ' ' + w : w }
    if (cur) out.push(cur)
    return out
  }
  const lab = items.map(it => ({ l: wrap1(it.label, 12.5, 6.4), s: it.sub ? wrap1(it.sub, 11, 5.6) : [] }))
  const nLines = Math.max(...lab.map(x => x.l.length + x.s.length))
  m.b = Math.max(42, 12 + nLines * 14)
  const H = height + (m.b - 42), ih = H - m.t - m.b
  let run = 0
  const bars = items.map(it => {
    const from = it.kind === 'total' ? 0 : run
    const to = it.kind === 'total' ? it.value : run + it.value
    run = to
    return { ...it, lo: Math.min(from, to), hi: Math.max(from, to), end: to }
  })
  const top = Math.max(...bars.map(b => b.hi)) * 1.08
  const st = niceStep(top / 4)
  const Y = v => m.t + ih - v / (Math.ceil(top / st) * st) * ih
  const slot = iw / bars.length, bw = slot * 0.56
  const Xc = i => m.l + slot * (i + 0.5)
  return (
    <div ref={wrap}><svg viewBox={`0 0 ${W} ${H}`} className="chart">
      {niceTicks(0, Math.ceil(top / st) * st).map(t => (
        <g key={t}><line x1={m.l} x2={W - m.r} y1={Y(t)} y2={Y(t)} className="grid" /><text x={m.l - 8} y={Y(t) + 4} textAnchor="end" className="ax">{t ? fmt(t) : ''}</text></g>
      ))}
      {bars.map((b, i) => (
        <g key={b.label}>
          {i > 0 && <line x1={Xc(i - 1) + bw / 2} x2={Xc(i) - bw / 2} y1={Y(bars[i - 1].end)} y2={Y(bars[i - 1].end)} stroke="var(--mut)" strokeDasharray="3 3" opacity={0.6} />}
          <rect x={Xc(i) - bw / 2} width={bw} y={Y(b.hi)} height={Math.max(2, Y(b.lo) - Y(b.hi))} rx={3} fill={b.color} opacity={b.kind === 'total' ? 1 : 0.82} />
          <text x={Xc(i)} y={Y(b.hi) - 7} textAnchor="middle" className="wf-v">{fmt(b.value)}</text>
          {lab[i].l.map((ln, k) => <text key={'l' + k} x={Xc(i)} y={H - m.b + 16 + k * 14} textAnchor="middle" className="wf-l">{ln}</text>)}
          {lab[i].s.map((ln, k) => <text key={'s' + k} x={Xc(i)} y={H - m.b + 16 + (lab[i].l.length + k) * 14} textAnchor="middle" className="wf-s">{ln}</text>)}
        </g>
      ))}
    </svg></div>
  )
}

// StackedH: one horizontal stacked bar with labels inside wide segments
// and a legend underneath for narrow ones. segs: [{ name, v, color }]
export function StackedH({ segs, fmt, height = 32 }) {
  const total = segs.reduce((s, x) => s + Math.abs(x.v), 0) || 1
  return (
    <div className="stk-wrap">
      <div className="stk" style={{ height }}>
        {segs.map(s => {
          const w = s.v / total
          return (
            <div key={s.name} className="stk-s" style={{ width: `${w * 100}%`, background: s.color }} title={`${s.name}: ${fmt(s.v)}`}>
              {w >= 0.2 ? <span className="stk-t">{s.name} <b>{fmt(s.v)}</b></span> : w >= 0.07 ? <b>{fmt(s.v)}</b> : null}
            </div>
          )
        })}
      </div>
      <div className="stk-leg">
        {segs.map(s => <span key={s.name}><i style={{ background: s.color }} />{s.name} {fmt(s.v)}</span>)}
      </div>
    </div>
  )
}
