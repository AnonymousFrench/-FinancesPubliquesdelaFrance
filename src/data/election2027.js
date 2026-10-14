// Election 2027: inputs for the projection engine (src/lib/projection.js).
// Adding a party = adding an entry to `parties` with the same shape; nothing else changes.
// € billions per year, general government. Effects on the balance: + improves it.

import { apu } from './apu.js'

const i = apu.years.length - 1

export const SOURCES = {
  plf27: { label: 'La finance pour tous, “PLF 2027: budget under pressure” (8 Oct 2026)', url: 'https://www.lafinancepourtous.com/2026/10/08/projet-de-loi-de-finances-le-budget-2027-sous-haute-tension/' },
  hcfp: { label: 'France Budget, PLF 2027 summary incl. HCFP opinion 2026-5', url: 'https://francebudget.fr/budget-2027' },
  rnPress: { label: 'Public Sénat, RN counter-budget presentation (6 Oct 2026)', url: 'https://www.publicsenat.fr/actualites/politique/140-milliards-deuros-deconomies-dici-2032-leffort-radical-propose-par-marine-le-pen-pour-redresser-les-f' },
  rnPge: { label: 'Planète Grandes Écoles, RN 2027 budget measures and Institut de l’Entreprise review', url: 'https://www.planetegrandesecoles.com/budget-marine-le-pen-2027-mesures-contre-budget-rn' },
  rnState: { label: 'Acteurs publics, State and local-authority savings in the RN plan', url: 'https://acteurspublics.fr/articles/la-reforme-de-letat-et-des-collectivites-au-coeur-des-economies-programmees-par-le-rn/' },
  rnFB: { label: 'France Budget simulator, “Programme RN 2027”', url: 'https://francebudget.fr/scenarios/rn-2027' },
  rnSite: { label: 'rassemblementnational.fr', url: 'https://rassemblementnational.fr' },
  lfiSite: { label: 'lafranceinsoumise.fr', url: 'https://lafranceinsoumise.fr/' },
  lfiNfp: { label: 'LFI / NFP, “Notre proposition macroéconomique” (June 2024, costed framework)', url: 'https://lafranceinsoumise.fr/wp-content/uploads/2024/06/RECIT-MACRO-FRONT-POPULAIRE-VF.pdf' },
  lfiAec: { label: 'melenchon2027.fr, L’Avenir en commun (2025 edition, update announced)', url: 'https://melenchon2027.fr/programme2025/livre/' },
  ifrapNfp: { label: 'iFRAP, “Le vrai coût du programme du Nouveau Front populaire” (June 2024)', url: 'https://www.ifrap.org/budget-et-fiscalite/le-vrai-cout-du-programme-du-nouveau-front-populaire' },
  montaigneNfp: { label: 'Institut Montaigne, NFP programme costing (June 2024)', url: 'https://www.institutmontaigne.org/legislatives-2024/nouveau-front-populaire/synthese' },
  asteresNfp: { label: 'Asterès, note on the NFP costing (June 2024)', url: 'https://asteres.fr/site/wp-content/uploads/2024/06/ASTERES_NFP2.pdf' },
  lfiFB: { label: 'France Budget simulator, “Programme LFI 2027”', url: 'https://francebudget.fr/scenarios/lfi-2027' },
  ifrap22: { label: 'iFRAP, costing of the 2022 Mélenchon programme', url: 'https://www.ifrap.org/budget-et-fiscalite/chiffrage-du-programme-de-jean-luc-melenchon' },
}

// ---------- Baseline: unchanged policy ----------
export const baseline = {
  actual2025: { gdp: apu.gdp[i], revenue: apu.recettes[i], spending: apu.depenses[i], interest: apu.interets[i], debt: apu.dette[i], debtPrev: apu.dette[i - 1] },
  // Latest official estimate for 2026 (PLF 2027, Oct 2026). 2026 is fixed before any new government takes office.
  anchor2026: { deficitPct: 5.4, debtPct: 119.3 },
  growth: { 2026: 0.5, 2027: 1.0, 2028: 1.1, 2029: 1.1, 2030: 1.1, 2031: 1.1, 2032: 1.1 },
  deflator: { 2026: 2.1, 2027: 1.8, 2028: 1.75, 2029: 1.75, 2030: 1.75, 2031: 1.75, 2032: 1.75 },
  spendTrend: 1.2,   // real growth of primary spending with no new measures (ageing, indexation, defence law)
  marketRate: 3.8,   // average rate on new borrowing, % (blend of 10-year bonds at ≈ 4-4.8% and short bills)
  rollover: 0.06,    // share of the stock refinanced each year, on top of the new deficit (≈ maturities / debt)
  notes: [
    '2026 anchored on the government’s revised estimate: deficit 5.4% of GDP, debt 119.3% (PLF 2027).',
    'Growth 0.5% in 2026 and 1.0% in 2027 (PLF 2027; the HCFP calls 2027 optimistic), then 1.1%, close to potential-growth estimates.',
    'Primary spending grows 1.2% a year in real terms with no new measures; revenue stays at its 2026 share of GDP.',
    'New borrowing costs 3.8%. Each year about 6% of the stock plus the new deficit is refinanced at that rate.',
  ],
}

// Official plan, shown for reference only (not modelled).
export const governmentPlan = {
  label: 'Government plan (PLF 2027)',
  deficit: { 2026: 5.4, 2027: 5.0, 2029: 2.9 },
  debt: { 2026: 119.3, 2027: 121.7 },
  note: 'Deficit 5.0% in 2027 after €54bn of savings, below 3% by 2029. The HCFP judges 5.0% “very unlikely” without very favourable conditions.',
  src: ['plf27', 'hcfp'],
}

// ---------- Parties ----------
export const parties = {
  rn: {
    id: 'rn', name: 'Rassemblement National', short: 'RN', color: '#0d2c6e', site: 'rnSite', status: 'ready',
    document: 'Counter-budget and 2027-2032 public-finance trajectory, presented by Marine Le Pen and Jean-Philippe Tanguy on 6 October 2026. The full document was not online when this page was built; figures come from press coverage and the Institut de l’Entreprise review.',
    headline: [
      ['Net savings', '€140bn in 2032 vs 2026'],
      ['Net tax cuts', '€30bn over the term'],
      ['Deficit target', 'below 3% of GDP in 2030'],
      ['Debt target', '121% in 2027 → 112% in 2032'],
      ['Growth assumed', '1.8% a year'],
    ],
    growthClaim: { 2026: 0.5, 2027: 1.8, 2028: 1.8, 2029: 1.8, 2030: 1.8, 2031: 1.8, 2032: 1.8 },
    growthNote: 'The government says the plan assumes 1.8% growth a year; France Budget reports a 1.5% target. Either is well above the 1.0-1.1% consensus.',
    targets: { deficit: { 2030: 3.0, 2032: 2.5 }, debt: { 2027: 121, 2032: 112 } },
    // Gross amounts per category as recalculated by the Institut de l'Entreprise (2027 and 2031 points);
    // linear in between and held flat in 2032. Cost lines are negative.
    measures: [
      { id: 'social', name: 'Social security', kind: 'spending', points: { 2027: 19.0, 2031: 53.1 },
        detail: 'Pension “corrections” (€15-20bn in the long run), single social allowance, benefit indexation rules.',
        flag: 'Pension savings not yet detailed; the party said they would follow “in the coming weeks”.' },
      { id: 'state', name: 'State, agencies and local authorities', kind: 'spending', points: { 2027: 22.4, 2031: 29.0 },
        detail: 'State reorganisation (€20.7bn from 2027), local-authority effort (€8.2bn), closing agencies (€3.4bn in 2027, > €10bn in 2031), 85,000 agency and 116,000 local posts not replaced, abolishing intercommunalités and métropoles.',
        flag: 'Agency closures save less than their budget: staff must be redeployed or paid off.' },
      { id: 'energy', name: 'Energy, networks and concessions', kind: 'mixed', points: { 2027: 20.6, 2031: 29.0 },
        detail: 'End of renewable-energy support (≈ €5bn the first year), moratorium on new wind and solar, motorway concessions.',
        flag: 'Mix of spending cuts and receipts; split half and half here.' },
      { id: 'immigration', name: 'Immigration and “national preference”', kind: 'spending', points: { 2027: 15.1, 2031: 29.0 },
        detail: '€15bn the first year, €29bn in a full year: benefits reserved for nationals or tied to 5 years of work, State medical aid (AME) replaced.',
        flag: 'Reserved benefits (€18.1bn in 2031) may conflict with the constitutional equality principle and EU law.' },
      { id: 'fraud', name: 'Fraud (VAT, public procurement)', kind: 'revenue', points: { 2027: 1.1, 2031: 23.8 },
        detail: 'VAT collected at source, procurement controls, social-fraud recovery.',
        flag: 'Counts €18bn from VAT at source when the whole VAT gap was estimated at €12bn in 2023.' },
      { id: 'eu', name: 'EU contribution', kind: 'spending', points: { 2027: 11.1, 2031: 19.5 },
        detail: 'Net contribution capped at about €5bn (≈ €29bn gross today).',
        flag: 'Changing the EU budget requires unanimity of member states.' },
      { id: 'taxcuts', name: 'Tax cuts', kind: 'revenue', points: { 2027: -15.0, 2031: -30.0 }, cost: true,
        detail: 'VAT on energy cut to 5.5% (RN: €12.2bn; France Budget: €17.4bn), abolition of CFE, CVAE and C3S production taxes (€17bn, CVAE from 2030), full family-quotient share from the 2nd child, income-tax exemption for under-30s.',
        flag: 'Derived: the total of the two cost lines equals the gap between the category sum and the net totals (€20.0bn in 2027, €43.1bn in 2031). The split between them is our estimate.' },
      { id: 'newspend', name: 'New spending', kind: 'spending', points: { 2027: -5.0, 2031: -13.1 }, cost: true,
        detail: 'Pension age back to 62 with 42 years of contributions (RN: €9bn a year; France Budget: €12.8bn by 2032), pension indexation, renovation and research programmes.',
        flag: 'Derived, see the line above.' },
    ],
    // Independent review: the Institut de l'Entreprise classes 80% of the gains as undocumented, legally fragile or
    // without effect on the Maastricht deficit, and puts the credible net improvement at about €7.5bn in 2031
    // (range −€25bn to +€50bn). Reproduced with one haircut on all savings lines, costs counted in full.
    reviews: [
      { id: 'central', label: 'Central', by: 'Institut de l’Entreprise', net2031: 7.5 },
      { id: 'low', label: 'Pessimistic', net2031: -25 },
      { id: 'high', label: 'Optimistic', net2031: 50 },
    ],
    reviewDefault: 'central',
    reviewNote: r => `Institut de l’Entreprise review (6 Oct 2026): the credible net gain in 2031 is ${r.net2031 >= 0 ? '+' : '−'}€${Math.abs(r.net2031)}bn (range −€25bn to +€50bn). Each savings line is scaled down uniformly to match it; costs count in full. The review excludes growth and interest-rate effects; the model adds them.`,
    // Projections published by others, shown as dots for comparison.
    external: [
      { label: 'Institut de l’Entreprise', deficit: { 2027: 5.9 }, debt: { 2031: 130 }, src: 'rnPge' },
      { label: 'France Budget simulator', deficit: { 2027: 6.2, 2028: 6.1, 2029: 6.2, 2030: 6.5, 2032: 7.6 }, debt: { 2027: 122, 2028: 124, 2029: 126, 2030: 130, 2032: 137.5 }, src: 'rnFB' },
    ],
    measuresNote: 'Category amounts are the Institut de l’Entreprise’s recalculation of the RN figures (€69.3bn net in 2027, €140.3bn in 2031, against €141.7bn claimed), interpolated in between and held flat in 2032. “Mixed” lines are split half spending, half revenue.',
    measuresSrc: ['rnPge', 'rnState'],
    src: ['rnPress', 'rnPge', 'rnState', 'rnFB'],
  },

  lfi: {
    id: 'lfi', name: 'La France insoumise', short: 'LFI', color: '#c9462c', site: 'lfiSite', status: 'ready',
    document: 'LFI’s 2027 programme (“L’Avenir en commun”, 2025 edition; a 5th edition with 1,069 measures is announced) has no published costing yet. This tab uses the costed framework LFI published for the 2024 Nouveau Front Populaire programme, which it still links as part of its programme. It applies the same three phases, shifted to a mid-2027 start. Campaign-tracking sites quote +€250bn of spending and +€267bn of revenue for the 2025 edition; we could not find those figures on LFI’s own sites.',
    headline: [
      ['New spending', '+€150bn a year by year 3'],
      ['New revenue', '+€150bn a year by year 3'],
      ['Net effect claimed', 'balanced (+€5bn in year 1)'],
      ['Deficit / debt target', 'none published'],
      ['Growth assumed', 'not quantified'],
    ],
    growthClaim: null,
    growthNote: 'LFI says the plan “largely pays for itself through renewed growth” but publishes no growth figure: part of its revenue (≈ €31bn, the unitemised line) is that feedback. Growth stays at the consensus here. Because the plan is balanced on paper, the fiscal multiplier (which acts on the net budget change) only matters under the independent reviews.',
    targets: { deficit: {}, debt: {} },
    // LFI's three phases as annual amounts: phase 1 (first months: 25 spending / 30 revenue), phase 2 (cumulative 100 / 100
    // by the end of the second year), phase 3 (150 / 150 two years later). Mapped to 2027, 2028 and 2030.
    measures: [
      { id: 'pp', name: 'Purchasing power and social rights', kind: 'spending', cost: true, points: { 2027: -25, 2028: -60, 2030: -90 },
        detail: 'Civil-service pay index +10%, repeal of the pension and unemployment-insurance reforms, fully free state school (canteen, supplies, transport), housing benefit +10%, autonomy guarantee for young people under the poverty line. Minimum wage to €1,600 net (paid by employers, with State support to small firms).',
        flag: 'Excludes retirement at 60, which LFI says new contributions will finance. iFRAP prices it at €50bn a year and counts it in its €215bn total.' },
      { id: 'eco', name: 'Ecological transition', kind: 'spending', cost: true, points: { 2027: 0, 2028: -20, 2030: -30 },
        detail: 'Thermal renovation with zero out-of-pocket cost for those who need it, French and European renewable-energy supply chains, rail and freight plan, support for organic farming.',
        flag: 'Split of the phase-2 total between the three priorities is our estimate, proportional to the end-state envelopes (90 / 30 / 30).' },
      { id: 'pub', name: 'Public services', kind: 'spending', cost: true, points: { 2027: 0, 2028: -20, 2030: -30 },
        detail: 'Teachers to cut class sizes, multi-year hiring and pay plan for health and care staff, public services within 30 minutes of every home, culture budget to 1% of GDP, tax-fraud inspectors.',
        flag: 'Presented as “autorisations d’engagement” (maximum amounts), so actual spending could lag.' },
      { id: 'superprofits', name: 'Windfall-profits tax', kind: 'revenue', points: { 2027: 15, 2030: 15 },
        detail: 'Tax on “superprofits” in sectors such as energy and agri-food, voted in an amending budget in the first summer.',
        flag: 'Windfall profits are by nature temporary: the yield is unlikely to recur at the same level every year.' },
      { id: 'isf', name: 'Wealth tax with a climate component', kind: 'revenue', points: { 2027: 15, 2030: 15 },
        detail: 'Reinstated wealth tax (ISF) including a component on the carbon footprint of assets.',
        flag: 'The old wealth tax raised about €4-5bn a year before 2018; €15bn assumes a much broader base or higher rates.' },
      { id: 'niches', name: 'Removal of tax loopholes', kind: 'revenue', points: { 2027: 0, 2028: 25, 2030: 25 },
        detail: '“Inefficient, unfair and polluting” tax expenditures removed.',
        flag: 'Which tax expenditures go is not specified.' },
      { id: 'inherit', name: 'Inheritance tax reform', kind: 'revenue', points: { 2027: 0, 2028: 17, 2030: 17 },
        detail: 'More progressive inheritance tax and a maximum inheritance of €12m.',
        flag: 'Would nearly double inheritance and gift duties (€21.7bn of capital taxes in 2025).' },
      { id: 'income', name: 'Income tax (14 brackets), progressive CSG, end of flat tax', kind: 'revenue', points: { 2027: 0, 2028: 8.2, 2030: 8.2 },
        detail: '14-bracket income tax and progressive CSG (€5.5bn); capital income taxed like labour income by abolishing the 30% flat tax (€2.7bn). LFI says 9 in 10 households would pay less.',
        flag: 'Net of the cuts for most households, so the gross changes are larger in both directions.' },
      { id: 'zucman', name: '“Zucman” tax on multinationals', kind: 'revenue', points: { 2028: 0, 2030: 26 },
        detail: 'Taxing multinationals’ profits where their activity actually takes place.',
        flag: 'Requires international coordination or contested unilateral rules; the yield is highly uncertain.' },
      { id: 'equality', name: 'Gender pay equality, financial transactions tax', kind: 'revenue', points: { 2028: 0, 2030: 13 },
        detail: 'Contributions on the higher wages from equal pay (€10bn), stronger financial transactions tax (€3bn).',
        flag: 'The €10bn depends on wages actually rising; it is a feedback effect rather than a tax measure.' },
      { id: 'feedback', name: 'Unitemised: growth feedback and anti-fraud', kind: 'revenue', points: { 2027: 0, 2028: 19.8, 2030: 30.8 },
        detail: 'Difference between LFI’s revenue totals (100 then 150) and the itemised measures: extra tax receipts from stronger demand, and recruitment of tax-fraud inspectors.',
        flag: 'Derived residual, not itemised by LFI. Independent reviews give it little or no value.' },
    ],
    // Independent costings of the same 2024 framework. Factors applied to all cost lines and all revenue lines so the
    // end-state net effect matches each review: costs × factor (150 → review total), revenue × factor.
    reviews: [
      { id: 'ifrap', label: 'iFRAP', costs: 215 / 150, gains: 55 / 150, net: -160, src: 'ifrapNfp',
        note: 'iFRAP (June 2024): +€215bn of spending (incl. retirement at 60, €50bn) and +€55bn of revenue, a net cost of about €160bn a year.' },
      { id: 'montaigne', label: 'Institut Montaigne', costs: 233 / 150, gains: 54 / 150, net: -179, src: 'montaigneNfp',
        note: 'Institut Montaigne (June 2024): €233bn of new spending and tax cuts, a net deficit increase of €179bn a year.' },
      { id: 'asteres', label: 'Asterès', costs: 1, gains: 100 / 150, net: -50, src: 'asteresNfp',
        note: 'Asterès (June 2024): taking LFI’s spending at face value, revenue falls at least €50bn short, so the deficit widens by more than €50bn a year.' },
    ],
    reviewDefault: 'ifrap',
    reviewNote: r => `${r.note} Here every spending line is scaled by ${Math.round(r.costs * 100)}% and every revenue line by ${Math.round(r.gains * 100)}% of LFI’s figure. Reviews of the 2024 framework, phased like LFI’s plan; the model adds growth and interest effects.`,
    external: [
      { label: 'France Budget simulator', deficit: { 2027: 6.5, 2028: 5.6, 2029: 5.9, 2030: 6.3 }, debt: { 2027: 122, 2028: 123, 2029: 124, 2030: 127 }, src: 'lfiFB' },
    ],
    measuresNote: 'Amounts are LFI’s, in its three phases (first year, end of year 2, end of year 4), interpolated in between and held flat after 2030. Phase totals: spending −25 / −100 / −150, revenue +30 / +100 / +150.',
    measuresSrc: ['lfiNfp'],
    src: ['lfiNfp', 'lfiAec', 'ifrapNfp', 'montaigneNfp', 'asteresNfp', 'lfiFB'],
  },
}

// Credibility factor per measure for a given independent review.
// Either the review gives explicit factors for costs and gains, or (RN) a net 2031 figure, which is
// reproduced with one uniform haircut on the gains while costs count in full.
export function reviewCredibility(party, reviewId) {
  const r = party.reviews.find(x => x.id === reviewId) || party.reviews[0]
  if (r.costs != null) return Object.fromEntries(party.measures.map(m => [m.id, m.cost ? r.costs : r.gains]))
  const at = m => m.points[2031] ?? Object.values(m.points).at(-1)
  const gains = party.measures.filter(m => !m.cost).reduce((s, m) => s + at(m), 0)
  const costs = party.measures.filter(m => m.cost).reduce((s, m) => s + at(m), 0)
  const k = Math.max(0, (r.net2031 - costs) / gains)
  return Object.fromEntries(party.measures.map(m => [m.id, m.cost ? 1 : k]))
}
