// Indicateurs macro « État de la France » : libellés, unités et sources. Séries : etat-series.json (npm run etat).
import S from './etat-series.json'
import { apu } from './apu.js'
import { oat10 } from './taux.js'

const es = ds => ({ label: `Eurostat ${ds}`, url: `https://ec.europa.eu/eurostat/databrowser/view/${ds}/default/table` })
const wb = code => ({ label: `Banque mondiale, WDI ${code}`, url: `https://data.worldbank.org/indicator/${code}?locations=FR-EU-US-CN` })
const imf = code => ({ label: `FMI ${code}`, url: `https://www.imf.org/external/datamapper/${code}@FPP/USA/CHN` })
const fred = id => ({ label: `Réserve fédérale ${id}`, url: `https://fred.stlouisfed.org/series/${id}` })
const insee = id => ({ label: `Insee, série ${id}`, url: `https://www.insee.fr/fr/statistiques/serie/${id}` })
const oecd = (label, url) => ({ label: `OCDE, ${label}`, url })

// Séries issues des autres pages du site (comptes des APU, taux à 10 ans).
const fromArr = (years, vals) => Object.fromEntries(years.map((y, k) => [y, vals[k]]).filter(([, v]) => v != null))
const oatYears = [...new Set(oat10.map(([d]) => d.slice(0, 4)))]
const oatAvg = Object.fromEntries(oatYears.map(y => { const v = oat10.filter(([d, x]) => d.startsWith(y) && x != null).map(([, x]) => x); return [y, v.length === 12 ? +(v.reduce((a, b) => a + b) / 12).toFixed(2) : null] }).filter(([, v]) => v != null))
const LOCAL = {
  debt: { fr: fromArr(apu.years, apu.dettePct), us: S.usDebt?.us, cn: S.usDebt?.cn },
  spend: { fr: fromArr(apu.years, apu.depensesPct), us: S.usSpend?.us, cn: S.usSpend?.cn },
  oat: { fr: oatAvg, us: S.usRate?.us },
  // PISA, score moyen en mathématiques des élèves de 15 ans (OCDE ; échelle comparable depuis 2003). Moyenne OCDE 2022 : 472.
  pisa: { fr: { 2003: 511, 2006: 496, 2009: 497, 2012: 495, 2015: 493, 2018: 495, 2022: 474 } },
}
export const series = id => S[id] || LOCAL[id]

// unit : 'pct' (en %, écart en points), 'eur', 'num' (avec suffixe). good : sens favorable de l'évolution (pour la couleur de l'écart).
export const THEMES = [
  { id: 'croissance', fr: 'Croissance et niveau de vie', en: 'Growth and living standards', items: [
    { id: 'gdpPcPpp', fr: 'PIB par habitant', en: 'GDP per person', unit: 'usd', d: 0, note: ['parité de pouvoir d’achat, $ de 2021', 'purchasing power parity, 2021 $'], src: wb('NY.GDP.PCAP.PP.KD'), good: 1 },
    { id: 'gdpGrowth', fr: 'Croissance du PIB', en: 'GDP growth', unit: 'pct', d: 1, note: ['en volume, sur un an', 'real, year on year'], src: es('nama_10_gdp'), srcUs: wb('NY.GDP.MKTP.KD.ZG'), good: 1, zero: true, avg: true },
    { id: 'productivity', fr: 'Productivité horaire', en: 'Hourly productivity', unit: 'num', d: 0, note: ['indice 100 en 2020, PIB réel par heure', 'index 2020 = 100, real GDP per hour'], src: es('nama_10_lp_ulc'), good: 1 },
    { id: 'investment', fr: 'Investissement', en: 'Investment', unit: 'pct', d: 1, note: ['FBCF totale, % du PIB', 'total GFCF, % of GDP'], src: es('nama_10_gdp'), srcUs: wb('NE.GDI.FTOT.ZS'), good: 1 },
    { id: 'saving', fr: 'Épargne des ménages', en: 'Household saving', unit: 'pct', d: 1, note: ['% du revenu disponible brut', '% of gross disposable income'], src: es('nasa_10_ki') },
    { id: 'medianInc', fr: 'Niveau de vie médian', en: 'Median living standard', unit: 'eur', d: 0, note: ['revenu disponible par unité de consommation, € courants', 'disposable income per consumption unit, current €'], src: es('ilc_di03'), good: 1 },
    { id: 'bankrupt', fr: 'Défaillances d’entreprises', en: 'Business failures', unit: 'num', d: 0, note: ['déclarations de faillite, indice 100 en 2021', 'bankruptcy declarations, index 2021 = 100'], src: es('sts_rb_q'), good: -1 },
  ] },
  { id: 'prix', fr: 'Prix et compétitivité', en: 'Prices and competitiveness', items: [
    { id: 'inflation', fr: 'Inflation', en: 'Inflation', unit: 'pct', d: 1, note: ['prix à la consommation, sur un an', 'consumer prices, year on year'], src: wb('FP.CPI.TOTL.ZG'), good: -1, avg: true },
    { id: 'currentAcc', fr: 'Balance courante', en: 'Current account', unit: 'pct', d: 1, note: ['% du PIB', '% of GDP'], src: wb('BN.CAB.XOKA.GD.ZS'), good: 1, zero: true },
    { id: 'tradeBal', fr: 'Solde commercial', en: 'Trade balance', unit: 'pct', d: 1, note: ['biens et services, % du PIB', 'goods and services, % of GDP'], src: wb('NE.RSB.GNFS.ZS'), good: 1, zero: true },
    { id: 'manuf', fr: 'Industrie manufacturière', en: 'Manufacturing', unit: 'pct', d: 1, note: ['% du PIB', '% of GDP'], src: wb('NV.IND.MANF.ZS'), good: 1 },
    { id: 'elecPrice', fr: 'Prix de l’électricité', en: 'Electricity price', unit: 'eur', d: 3, note: ['ménages, €/kWh toutes taxes, moyenne des deux semestres', 'households, €/kWh incl. taxes, average of both halves'], src: es('nrg_pc_204'), good: -1 },
    { id: 'rd', fr: 'Recherche (R&D)', en: 'R&D', unit: 'pct', d: 2, note: ['dépense intérieure, % du PIB', 'gross domestic spending, % of GDP'], src: es('rd_e_gerdtot'), srcUs: wb('GB.XPD.RSDV.GD.ZS'), good: 1 },
  ] },
  { id: 'demo', fr: 'Démographie', en: 'Population', items: [
    { id: 'pop', fr: 'Population', en: 'Population', unit: 'num', d: 1, suffix: ['millions', 'million'], note: ['France entière', 'whole of France'], src: wb('SP.POP.TOTL'), good: 0 },
    { id: 'fertility', fr: 'Fécondité', en: 'Fertility', unit: 'num', d: 2, note: ['enfants par femme', 'children per woman'], src: wb('SP.DYN.TFRT.IN'), good: 0 },
    { id: 'births', fr: 'Naissances et décès', en: 'Births and deaths', unit: 'num', d: 1, suffix: ['‰', '‰'], pair: 'deaths', note: ['pour 1 000 habitants', 'per 1,000 people'], src: wb('SP.DYN.CBRT.IN'), good: 0 },
    { id: 'lifeExp', fr: 'Espérance de vie', en: 'Life expectancy', unit: 'num', d: 1, suffix: ['ans', 'years'], note: ['à la naissance', 'at birth'], src: wb('SP.DYN.LE00.IN'), good: 1 },
    { id: 'netMig', fr: 'Solde migratoire', en: 'Net migration', unit: 'num', d: 1, suffix: ['‰', '‰'], note: ['pour 1 000 habitants, ajusté', 'per 1,000 people, adjusted'], src: es('demo_gind'), good: 0 },
    { id: 'oldDep', fr: '65 ans et plus', en: 'People aged 65+', unit: 'num', d: 0, note: ['pour 100 personnes de 15-64 ans', 'per 100 people aged 15-64'], src: wb('SP.POP.DPND.OL'), good: 0 },
  ] },
  { id: 'social', fr: 'État et redistribution', en: 'State and redistribution', items: [
    { id: 'oat', fr: 'Taux à 10 ans (OAT)', en: '10-year yield (OAT)', unit: 'pct', d: 2, note: ['emprunt d’État, moyenne annuelle', 'government bond, annual average'], src: es('irt_lt_mcby_m'), srcUs: fred('GS10'), good: -1 },
    { id: 'spread', fr: 'Écart de taux avec l’Allemagne', en: 'Spread over Germany', unit: 'num', d: 2, suffix: ['pt', 'pt'], abs: true, note: ['OAT 10 ans moins Bund 10 ans, en points, moyenne annuelle', '10-year OAT minus 10-year Bund, points, annual average'], src: es('irt_lt_mcby_a'), good: -1, zero: true },
    { id: 'taxBurden', fr: 'Impôts et cotisations', en: 'Taxes and contributions', unit: 'pct', d: 1, note: ['prélèvements obligatoires, % du PIB', 'tax burden, % of GDP'], src: es('gov_10a_taxag'), good: 0 },
    { id: 'spend', fr: 'Dépense publique', en: 'Public spending', unit: 'pct', d: 1, note: ['% du PIB', '% of GDP'], src: es('gov_10a_main'), srcUs: imf('exp'), good: 0, link: '/depenses' },
    { id: 'debt', fr: 'Dette publique', en: 'Public debt', unit: 'pct', d: 1, note: ['% du PIB', '% of GDP'], src: es('gov_10dd_edpt1'), srcUs: imf('d'), good: -1, link: '/dette' },
    { id: 'poverty', fr: 'Taux de pauvreté', en: 'Poverty rate', unit: 'pct', d: 1, note: ['revenu sous 60 % du revenu médian', 'income below 60% of the median'], src: es('sdg_01_20'), good: -1 },
    { id: 'gini', fr: 'Inégalités de revenu', en: 'Income inequality', unit: 'num', d: 1, note: ['indice de Gini du niveau de vie (0 à 100)', 'Gini index of disposable income (0 to 100)'], src: es('ilc_di12'), good: -1, abs: true },
    { id: 'defence', fr: 'Dépense de défense', en: 'Defence spending', unit: 'pct', d: 1, note: ['% du PIB (Sipri) ; objectif Otan : 2 %', '% of GDP (SIPRI); NATO target: 2%'], src: wb('MS.MIL.XPND.GD.ZS'), good: 0 },
  ] },
  { id: 'emploi', fr: 'Emploi', en: 'Jobs', items: [
    { id: 'unemp', fr: 'Taux de chômage', en: 'Unemployment rate', unit: 'pct', d: 1, note: ['au sens du BIT, moyenne annuelle', 'ILO definition, annual average'], src: insee('001688527'), srcUs: wb('SL.UEM.TOTL.ZS'), srcEu: es('une_rt_a'), good: -1 },
    { id: 'youthUnemp', fr: 'Chômage des jeunes', en: 'Youth unemployment', unit: 'pct', d: 1, note: ['% des actifs de 15-24 ans', '% of active 15-24 year-olds'], src: es('une_rt_a'), srcUs: wb('SL.UEM.1524.ZS'), good: -1 },
    { id: 'empRate', fr: 'Taux d’emploi', en: 'Employment rate', unit: 'pct', d: 1, note: ['% des 20-64 ans', '% of people aged 20-64'], src: es('lfsi_emp_a'), good: 1 },
    { id: 'emp55', fr: 'Emploi des seniors', en: 'Older workers in jobs', unit: 'pct', d: 1, note: ['taux d’emploi des 55-64 ans', 'employment rate of 55-64 year-olds'], src: es('lfsi_emp_a'), good: 1 },
    { id: 'hours', fr: 'Heures travaillées', en: 'Hours worked', unit: 'num', d: 0, suffix: ['h/an', 'h/yr'], note: ['par personne en emploi et par an', 'per person employed, per year'], src: es('nama_10_a10_e'), good: 0 },
    { id: 'pisa', fr: 'Niveau en mathématiques', en: 'Maths performance', unit: 'num', d: 0, note: ['score PISA des élèves de 15 ans ; moyenne OCDE 2022 : 472', 'PISA score of 15-year-olds; OECD average 2022: 472'], src: oecd('PISA 2022, résultats', 'https://www.oecd.org/fr/publications/resultats-du-pisa-2022-volume-i_5a849c2a-fr.html'), good: 1, abs: true },
  ] },
  // Personnes nées à l'étranger (définition Eurostat : pays de naissance), comparées aux personnes nées en France.
  // L'Insee compte les « immigrés » (nés étrangers à l'étranger) : 7,6 millions, 11,2 % de la population en 2024.
  { id: 'immigration', fr: 'Immigration', en: 'Immigration',
    link: { path: '/etat-de-la-france/immigration', fr: 'Carte : d’où viennent les immigrés, de 1968 à aujourd’hui →', en: 'Map: where immigrants have come from, 1968 to today →' },
    note: ['Personnes nées à l’étranger (définition Eurostat, Français nés à l’étranger compris), comparées aux personnes nées en France (pointillés). L’Insee compte 7,6 millions d’immigrés en 2024, 11,2 % de la population, et 8,0 millions de descendants d’immigrés.', 'People born abroad (Eurostat definition, including French citizens born abroad), compared with people born in France (dotted). Insee counts 7.6 million immigrants in 2024, 11.2% of the population, and 8.0 million descendants of immigrants.'],
    items: [
    { id: 'immShare', fr: 'Nés à l’étranger', en: 'Born abroad', unit: 'pct', d: 1, note: ['% de la population', '% of the population'], src: es('migr_pop3ctb'), srcX: { label: 'Insee, Immigrés et descendants d’immigrés (nov. 2025)', url: 'https://www.insee.fr/fr/statistiques/8612512' }, good: 0 },
    { id: 'immHigh', fr: 'Diplômés du supérieur', en: 'Tertiary-educated', unit: 'pct', d: 1, vs: ['nés en France', 'born in France'], note: ['% des 25-64 ans nés à l’étranger', '% of 25-64 year-olds born abroad'], src: es('edat_lfs_9912'), good: 0 },
    { id: 'immLow', fr: 'Sans diplôme du secondaire', en: 'Below upper secondary', unit: 'pct', d: 1, vs: ['nés en France', 'born in France'], note: ['brevet au plus, % des 25-64 ans nés à l’étranger', 'lower secondary at most, % of 25-64 year-olds born abroad'], src: es('edat_lfs_9912'), good: 0 },
    { id: 'immEmp', fr: 'Taux d’emploi', en: 'Employment rate', unit: 'pct', d: 1, vs: ['nés en France', 'born in France'], note: ['% des 20-64 ans nés à l’étranger', '% of 20-64 year-olds born abroad'], src: es('lfsa_ergacob'), good: 0 },
    { id: 'immPov', fr: 'Taux de pauvreté', en: 'Poverty rate', unit: 'pct', d: 1, vs: ['nés en France', 'born in France'], note: ['% des 18 ans et plus nés à l’étranger', '% of people 18+ born abroad'], src: es('ilc_li32'), good: 0 },
  ] },
  { id: 'energie', fr: 'Énergie et climat', en: 'Energy and climate', items: [
    { id: 'ghg', fr: 'Émissions de CO₂e', en: 'CO₂e emissions', unit: 'num', d: 0, suffix: ['Mt', 'Mt'], note: ['gaz à effet de serre, hors forêts et sols', 'greenhouse gases, excl. land use'], src: es('env_air_gge'), good: -1 },
    { id: 'energyDep', fr: 'Énergie importée', en: 'Imported energy', unit: 'pct', d: 0, note: ['importations nettes / consommation', 'net imports / consumption'], src: es('nrg_ind_id'), srcUs: wb('EG.IMP.CONS.ZS'), good: -1 },
    { id: 'renew', fr: 'Renouvelables', en: 'Renewables', unit: 'pct', d: 1, note: ['% de la consommation finale', '% of final consumption'], src: es('nrg_ind_ren'), srcUs: wb('EG.FEC.RNEW.ZS'), good: 1 },
  ] },
]
export const COUNT = THEMES.reduce((s, t) => s + t.items.length, 0)
