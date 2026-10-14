// Number formatting (English). Amounts in €bn unless stated.
const nf = d => new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const f0 = nf(0), f1 = nf(1), f2 = nf(2)

export const fmt = (v, d = 1) => (d === 0 ? f0 : d === 2 ? f2 : f1).format(v)
export const bn = (v, d = 1) => `€${fmt(v, d)}bn`
export const pct = (v, d = 1) => `${fmt(v, d)}%`
export const signed = (v, d = 1) => { const r = +v.toFixed(d); return (r > 0 ? '+' : r < 0 ? '−' : '') + fmt(Math.abs(r), d) }
export const sbn = (v, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '') + bn(Math.abs(v), d)
export const pts =(v, d = 1) => `${signed(v, d)} pt`

// Raw euros (State budget files) → readable: "€24.9bn" / "€146m"
export const eur = v => {
  if (v == null) return '–'
  const a = Math.abs(v)
  if (a >= 1e9) return `€${f1.format(v / 1e9)}bn`
  if (a >= 1e6) return `€${f0.format(v / 1e6)}m`
  if (a >= 1e3) return `€${f0.format(v / 1e3)}k`
  return `€${f0.format(v)}`
}
