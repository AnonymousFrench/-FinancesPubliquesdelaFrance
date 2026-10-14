// Transforme data-raw/ (Eurostat JSON, CSV data.economie.gouv.fr) en modules src/data/*.js
import fs from 'node:fs';

const rd = f => JSON.parse(fs.readFileSync('data-raw/' + f, 'utf8'));
const w = (f, s) => {
  fs.writeFileSync('src/data/' + f, s);
  console.log('écrit src/data/' + f, (s.length / 1024).toFixed(0) + ' Ko');
};

const S = rd('apu_series_s13.json'); // {CODE:{year:Mio€}}
const years = Object.keys(S.TR).sort();

// séries en Md€
const md = code => years.map(y => S[code]?.[y] != null ? +(S[code][y] / 1000).toFixed(1) : null);
const gdp = rd('gdp_meur.json'); // {keys, vals} Mio
const gdpMd = Object.fromEntries(gdp.keys.map((k, i) => [k, +(gdp.vals[i] / 1000).toFixed(1)]));

const tePc = rd('te_tr_pcgdp.json');
const pct = key => years.map(y => +(tePc['A.PC_GDP.S13.' + key + '.FR'][y]).toFixed(1));

const debt = rd('debt_subsector_eur.json');
const debtPc = rd('debt_s13_pcgdp.json')['A.PC_GDP.S13.GD.FR'];

const apuOut = {
  years,
  gdp: years.map(y => gdpMd[y]),
  recettes: md('TR'),
  depenses: md('TE'),
  solde: md('B9'),
  recettesPct: pct('TR'),
  depensesPct: pct('TE'),
  soldePct: years.map(y => +((S.B9[y] / 1000) / gdpMd[y] * 100).toFixed(1)),
  // recettes détail
  impotsProduction: md('D2REC'),
  impotsProduits: md('D21REC'),
  tva: md('D211REC'),
  autresImpotsProduction: md('D29REC'),
  impotsRevenuPatrimoine: md('D5REC'),
  cotisationsSociales: md('D61REC'),
  ventes: md('P11_P12_P131'),
  revenusPropriete: md('D4REC'),
  autresTransferts: md('D7REC'),
  impotsCapital: md('D91REC'),
  // dépenses détail
  remunerations: md('D1PAY'),
  salaires: md('D11PAY'),
  cotisationsEmployeurs: md('D12PAY'),
  prestationsSociales: md('D62PAY'),
  consommationIntermediaire: md('P2'),
  subventions: md('D3PAY'),
  interets: md('D41GPAY'), // avant FISIM = chiffre Insee
  interetsBruts: md('D41PAY'),
  fbcf: md('P51G'),
  transfertsCourants: md('D7PAY'),
  transfertsCapital: md('D9PAY'),
  // dette
  dette: years.map(y => S13 => 0), // rempli après
};

// dette APU et par sous-secteur (Md€ + % PIB)
const sub = code => years.map(y => debt['A.MIO_EUR.' + code + '.GD.FR']?.[y] != null ? +(debt['A.MIO_EUR.' + code + '.GD.FR'][y] / 1000).toFixed(1) : null);
apuOut.dette = sub('S13');
apuOut.detteEtat = sub('S1311');
apuOut.detteLocales = sub('S1313');
apuOut.detteSociales = sub('S1314');
apuOut.dettePct = years.map(y => +(+debtPc[y]).toFixed(1));
// taux apparent = intérêts (avant FISIM) / encours
apuOut.tauxApparent = years.map((y, i) => apuOut.dette[i] && apuOut.dette[i] > 0 && S.D41GPAY[y] ? +(S.D41GPAY[y] / debt['A.MIO_EUR.S13.GD.FR'][y] * 100).toFixed(2) : null);

w('apu.js',
  `// Généré par scripts/build-data.mjs — source Eurostat gov_10a_main / gov_10dd_edpt1 (France, APU S13)
// Montants en milliards d'euros courants. Années ${years[0]}–${years.at(-1)}.
export const apu = ${JSON.stringify(apuOut)}
`);

// ---------- OAT 10 ans mensuelle ----------
const oat = rd('oat10y_monthly.json');
const oat10 = oat.keys.map((k, i) => [k, oat.vals[i] != null ? +oat.vals[i].toFixed(2) : null]);
w('taux.js',
  `// Généré — source Eurostat irt_lt_mcby_m (taux long terme Maastricht, France, mensuel, %)
export const oat10 = ${JSON.stringify(oat10)}
`);

// ---------- Budget de l'État : mission → programme → action → sous-action (PLF 2025) ----------
const csv = fs.readFileSync('data-raw/plf25-destination.csv', 'utf8').replace(/^\uFEFF/, '');
const rows = csv.split('\n').slice(1).filter(Boolean).map(l => {
  // séparateur ';' — libellés entre guillemets non échappés dans ce fichier
  const p = l.split(';');
  return {
    type: p[2], minCode: p[3], min: p[4], codeM: p[5], mission: p[6],
    codeP: p[7], programme: p[8], codeA: p[9], action: p[10],
    codeS: p[11], sousAction: p[12], titre: p[14],
    ae: +(p[15] || 0), cp: +(p[16] || 0),
  };
});
const missions = new Map();
for (const r of rows) {
  if (!missions.has(r.codeM)) missions.set(r.codeM, {
    code: r.codeM, nom: r.mission, type: r.type === 'BA' ? 'BA' : 'BG', ministere: r.min, cp: 0, ae: 0, programmes: new Map(),
  });
  const m = missions.get(r.codeM);
  m.cp += r.cp; m.ae += r.ae;
  if (!m.programmes.has(r.codeP)) m.programmes.set(r.codeP, { code: r.codeP, nom: r.programme, cp: 0, ae: 0, actions: new Map() });
  const p = m.programmes.get(r.codeP);
  p.cp += r.cp; p.ae += r.ae;
  if (!p.actions.has(r.codeA)) p.actions.set(r.codeA, { code: r.codeA, nom: r.action, cp: 0, ae: 0, sousActions: [] });
  const a = p.actions.get(r.codeA);
  a.cp += r.cp; a.ae += r.ae;
  if (r.codeS) {
    a.sousActions.push({ code: r.codeS, nom: r.sousAction, cp: r.cp, ae: r.ae });
    a.hasSous = true;
  }
}
const tree = [...missions.values()].map(m => ({
  ...m, cp: Math.round(m.cp), ae: Math.round(m.ae),
  programmes: [...m.programmes.values()].map(p => ({
    ...p, cp: Math.round(p.cp), ae: Math.round(p.ae),
    actions: [...p.actions.values()].map(a => ({ ...a, cp: Math.round(a.cp), ae: Math.round(a.ae), sousActions: a.sousActions.map(s => ({ ...s, cp: Math.round(s.cp), ae: Math.round(s.ae) })) })),
  })).sort((a, b) => b.cp - a.cp),
})).sort((a, b) => b.cp - a.cp);
const totalBG = Math.round(rows.filter(r => r.type === 'BG').reduce((s, r) => s + r.cp, 0));
const totalBA = Math.round(rows.filter(r => r.type !== 'BG').reduce((s, r) => s + r.cp, 0));
w('budget-etat.js',
  `// Généré — source data.economie.gouv.fr « PLF 2025 – Dépenses selon destination » (crédits de paiement, €)
// Nomenclature : mission → programme → action → sous-action. PLF = projet de loi (avant amendements).
export const budgetTotal = { BG: ${totalBG}, BA: ${totalBA}, tout: ${totalBG + totalBA} }
export const missions = ${JSON.stringify(tree)}
`);

// ---------- Recettes du budget de l'État (PLF 2025) ----------
const csv2 = fs.readFileSync('data-raw/plf25-recettes.csv', 'utf8').replace(/^\uFEFF/, '');
const rrows = csv2.split('\n').slice(1).filter(Boolean).map(l => {
  const p = l.split(';');
  return { type: p[1], code: p[2], lib: p[3], montant: +(p[4] || 0) };
});
const recTypes = new Map();
for (const r of rrows) {
  if (!recTypes.has(r.type)) recTypes.set(r.type, { nom: r.type, lignes: [], montant: 0 });
  const t = recTypes.get(r.type);
  t.lignes.push({ lib: r.lib, montant: Math.round(r.montant) });
  t.montant += r.montant;
}
const recettes = [...recTypes.values()].map(t => ({ ...t, montant: Math.round(t.montant) })).sort((a, b) => b.montant - a.montant);
w('recettes-etat.js',
  `// Généré — source data.economie.gouv.fr « PLF 2025 – Recettes du budget général » (€)
export const recettesEtat = ${JSON.stringify(recettes)}
`);

console.log('OK');
