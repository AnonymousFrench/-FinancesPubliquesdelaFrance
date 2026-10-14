import React, { useState } from 'react'
import { T, isEn } from '../i18n.js'
import { SRC_EN } from '../data/sourcesEn.js'

const srcLabel = l => (isEn() ? SRC_EN[l] || l.replace('Banque mondiale', 'World Bank').replace('Insee, série', 'Insee, series') : l)

export function Card({ title, sub, children, src, right, tag, className, id }) {
  return (
    <section className={'card' + (className ? ' ' + className : '')} id={id}>
      {(title || right) && (
        <div className="card-h">
          <div>
            {title && <h3>{title}{tag && <span className="tag">{tag}</span>}</h3>}
            {sub && <p className="sub">{sub}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
      {src && <p className="src">{T('Source', 'Source')}{[].concat(src).length > 1 ? 's' : ''}{T(' : ', ': ')}{[].concat(src).map((s, i) => (
        <React.Fragment key={i}>{i > 0 && ' · '}{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{srcLabel(s.label)}</a> : s.label || s}</React.Fragment>
      ))}</p>}
    </section>
  )
}

export function Kpi({ label, value, sub, tone, children }) {
  return (
    <div className={'kpi' + (tone ? ' ' + tone : '')}>
      <div className="kpi-l">{label}</div>
      <div className="kpi-v">{value}</div>
      {sub && <div className="kpi-s">{sub}</div>}
      {children}
    </div>
  )
}

export function Seg({ options, value, onChange, small }) {
  return (
    <div className={'seg' + (small ? ' small' : '')} role="tablist">
      {options.map(([label, v, disabled]) => (
        <button key={v} className={value === v ? 'on' : ''} disabled={disabled} onClick={() => onChange(v)}>{label}</button>
      ))}
    </div>
  )
}

// Liste de barres dépliable. rows : [{ name, value, note?, tag?, color?, children?[] }]
// Les parts sont relatives au niveau parent.
export function DrillList({ rows, total, fmt, defaultOpen = [] }) {
  const [open, setOpen] = useState(() => new Set(defaultOpen))
  const tot = total || rows.reduce((s, r) => s + Math.abs(r.value), 0) || 1
  const max = Math.max(...rows.map(r => Math.abs(r.value)))
  const toggle = n => setOpen(o => { const x = new Set(o); x.has(n) ? x.delete(n) : x.add(n); return x })
  return (
    <div className="bars">
      {rows.map((r, k) => {
        const share = Math.abs(r.value) / tot
        const kids = r.children?.length > 0
        const key = r.name + k
        const isOpen = open.has(key)
        return (
          <div key={key}>
            <div className={'bar-row' + (kids ? ' click' : '') + (isOpen ? ' sel' : '')} onClick={kids ? () => toggle(key) : undefined}>
              <span className="bar-n" title={r.name}>
                <span className={'caret' + (isOpen ? ' open' : '') + (kids ? '' : ' none')}>▸</span>
                {r.name}{r.tag && <span className="tag">{r.tag}</span>}
                {r.note && <span className="bar-note"> · {r.note}</span>}
              </span>
              <span className="bar-t"><span className="bar-f" style={{ width: `${Math.abs(r.value) / max * 100}%`, background: r.color || (r.value < 0 ? 'var(--red)' : undefined) }} /></span>
              <span className="bar-v">{fmt(r.value)}<span className="bar-p">{share < 0.001 ? '<0,1' : (share * 100).toFixed(share < 0.1 ? 1 : 0).replace('.', isEn() ? '.' : ',')}{isEn() ? '' : ' '}%</span></span>
            </div>
            {isOpen && (
              <div className="drill">
                <DrillList rows={r.children} fmt={fmt} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
