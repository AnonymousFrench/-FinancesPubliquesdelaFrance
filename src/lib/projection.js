// Public-finance projection engine for the Election 2027 tab.
// Pure functions, no React: a baseline (policy unchanged) and any party scenario
// are run through the same accounting so their gaps are comparable.
//
// Accounting, € billions, general government (Maastricht):
//   GDP_t        = GDP_{t-1} × (1 + real growth_t) × (1 + deflator_t) × (1 − level effect_t)
//   revenue_t    = baseline revenue ratio × GDP_t + revenue measures_t        (elasticity 1)
//   primary_t    = primary_{t-1} × (1 + trend real spending growth) × (1 + deflator_t) − spending measures_t
//   interest_t   = r_t × debt_{t-1}
//   r_t          = r_{t-1} + (rollover + new-debt share_{t-1}) × (market rate + spread − r_{t-1})
//   deficit_t    = primary_t + interest_t − revenue_t
//   debt_t       = debt_{t-1} + deficit_t                                    (no stock-flow adjustment after the anchor year)
// The primary-spending path is set in euros, independent of growth: faster growth lowers the
// spending ratio, slower growth raises it. That is how "unchanged policy" budgets behave.

export const YEARS = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032]

// Linear interpolation of { year: value } points over YEARS; flat before the first and after the last point.
export function interpolate(points) {
  const ks = Object.keys(points).map(Number).sort((a, b) => a - b)
  return Object.fromEntries(YEARS.map(y => {
    if (y < ks[0]) return [y, 0]
    if (y >= ks.at(-1)) return [y, points[ks.at(-1)]]
    const k = ks.findIndex(x => x > y)
    const a = ks[k - 1], b = ks[k]
    return [y, points[a] + (points[b] - points[a]) * (y - a) / (b - a)]
  }))
}

// Annual € effect of each measure on the balance (+ improves it), split by side of the account.
// kind: 'spending' (cut = +) | 'revenue' (raise = +) | 'mixed' (half each).
// firstYearShare scales the first programme year (2027): the election falls mid-year and that
// year's budget is already voted, so only part of the annual effect can land.
export function measureFlows(measures, credibility = {}, firstYearShare = 1) {
  const spend = Object.fromEntries(YEARS.map(y => [y, 0]))
  const rev = Object.fromEntries(YEARS.map(y => [y, 0]))
  for (const m of measures) {
    const c = credibility[m.id] ?? 1
    const path = interpolate(m.points)
    for (const y of YEARS) {
      const v = path[y] * c * (y === 2027 ? firstYearShare : 1)
      if (m.kind === 'spending') spend[y] += v
      else if (m.kind === 'revenue') rev[y] += v
      else { spend[y] += v / 2; rev[y] += v / 2 }
    }
  }
  return { spend, rev }
}

export function project(base, opts = {}) {
  const { growth = base.growth, measures = [], credibility = {}, marketRate = base.marketRate, spreadBp = 0, multiplier = 0, firstYearShare = 1 } = opts
  const { spend, rev } = measureFlows(measures, credibility, firstYearShare)
  const a = base.actual2025, anc = base.anchor2026
  const rows = []

  // 2025: actual accounts.
  const r25 = a.interest / a.debtPrev
  rows.push(row(2025, a.gdp, a.revenue, a.spending - a.interest, a.interest, a.debt, r25, 0))

  // 2026: anchored on the latest official estimate (deficit and debt ratios).
  const gdp26 = a.gdp * (1 + base.growth[2026] / 100) * (1 + base.deflator[2026] / 100)
  const n25 = (a.debt - a.debtPrev) / a.debt
  const r26 = r25 + (base.rollover + n25) * (marketRate - r25 * 100) / 100
  const int26 = r26 * a.debt
  const rev26 = a.revenue / a.gdp * gdp26
  const def26 = anc.deficitPct / 100 * gdp26
  const prim26 = rev26 + def26 - int26
  rows.push(row(2026, gdp26, rev26, prim26, int26, anc.debtPct / 100 * gdp26, r26, 0))

  const revRatio = rev26 / gdp26
  let potGdp = gdp26, basePrim = prim26
  for (const y of YEARS.filter(t => t > 2026)) {
    const p = rows.at(-1), pp = rows.at(-2)
    potGdp *= (1 + growth[y] / 100) * (1 + base.deflator[y] / 100)
    basePrim *= (1 + base.spendTrend / 100) * (1 + base.deflator[y] / 100)
    const net = spend[y] + rev[y]
    // Fiscal multiplier: a persistent GDP level effect proportional to the net measures in force.
    const gdp = potGdp * (1 - multiplier * net / potGdp)
    const n = (p.debt - pp.debt) / p.debt
    const r = p.rate + (base.rollover + Math.max(0, n)) * ((marketRate + spreadBp / 100) / 100 - p.rate)
    const interest = r * p.debt
    const revenue = revRatio * gdp + rev[y]
    const primary = basePrim - spend[y]
    const deficit = primary + interest - revenue
    rows.push(row(y, gdp, revenue, primary, interest, p.debt + deficit, r, net))
  }
  return rows
}

function row(year, gdp, revenue, primary, interest, debt, rate, measures) {
  const spending = primary + interest
  const deficit = spending - revenue
  return {
    year, gdp, revenue, primary, interest, spending, deficit, debt, rate, measures,
    deficitPct: deficit / gdp * 100, debtPct: debt / gdp * 100, spendingPct: spending / gdp * 100,
    revenuePct: revenue / gdp * 100, interestPct: interest / gdp * 100, primaryPct: (revenue - primary) / gdp * 100,
  }
}

// Debt-stabilising primary balance (% of GDP) for given interest rate and nominal growth (%).
export const stabilisingPrimary = (debtPct, rPct, gPct) => debtPct * (rPct - gPct) / (100 + gPct)
