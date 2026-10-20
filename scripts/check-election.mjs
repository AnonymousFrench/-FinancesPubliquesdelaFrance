// Contrôles de l'onglet Présidentielle : cohérence des données (sources, textes anglais, classes, signes) et projections 2032.
// Lancer : node scripts/check-election.mjs (sortie non nulle en cas d'erreur).
const root=new URL('../src/data/', import.meta.url).href
const E=await import(root+'election2027.js'); const {EN}=await import(root+'election2027.en.js')
const {parties,SOURCES,ORDER,RULE}=E; let bad=0; const err=(...a)=>{bad++;console.log('ERR',...a)}
for(const id of ORDER){const q=parties[id]; if(!q) {err('missing',id);continue}
 const e=EN.parties[id]; if(!e) err('no EN',id)
 for(const k of [...q.src,...q.measuresSrc, ...q.external.map(x=>x.src)]) if(!SOURCES[k]) err(id,'src',k)
 if(!q.profile.born) err(id,'born')
 if(q.headline.length!==5) err(id,'headline len',q.headline.length)
 if(e && e.headline.length!==q.headline.length) err(id,'EN headline len')
 const ids=new Set(q.measures.map(m=>m.id)); if(ids.size!==q.measures.length) err(id,'dup ids')
 for(const m of q.measures){ if(!m.cost && !RULE[m.cls]) err(id,m.id,'cls'); if(!['spending','revenue','mixed'].includes(m.kind)) err(id,m.id,'kind')
   if(e && !e.measures[m.id]) err(id,m.id,'EN measure'); if(e && e.measures[m.id] && e.measures[m.id].length!==3) err(id,m.id,'EN arity')
   if(m.cost && Object.values(m.points).some(v=>v>0) && m.id!=='rn-hhother') err(id,m.id,'cost positive')
   if(!m.cost && Object.values(m.points).some(v=>v<0)) err(id,m.id,'gain negative') }
 for(const r of q.reviews){ if(r.cred) for(const k of Object.keys(r.cred)) if(!ids.has(k)) err(id,'cred key',k)
   if(e && !(e.reviews||{})[r.id]) err(id,'EN review label',r.id) }
 if(q.reviews.length && !q.reviews.find(r=>r.id===q.reviewDefault)) err(id,'reviewDefault')
 if(q.status==='unscored' && !(q.pledges&&e.pledges)) err(id,'pledges')
}
// colour clash / short duplicates
const shorts=ORDER.map(i=>parties[i].short); if(new Set(shorts).size!==shorts.length) err('dup short')
const DECL=(await import(new URL('../src/lib/polls.js', import.meta.url).href)).DECLARED
for(const id of ORDER) if(!DECL.includes(parties[id].pollName)) err(id,'pollName not in DECLARED')
console.log('checked',ORDER.length,'bad',bad)
const { project, interpolate } = await import(new URL('../src/lib/projection.js', import.meta.url).href)
const { baseline, SCORED, reviewCredibility, FIRST_YEAR_SHARE, STALE_DAYS } = E
const b32 = project(baseline, {}).find(r => r.year === 2032)
console.log(`politique inchangée 2032 : déficit ${b32.deficitPct.toFixed(2)} %, dette ${b32.debtPct.toFixed(1)} %`)
for (const id of SCORED) {
  const q = parties[id], rv = reviewCredibility(q, q.reviewDefault)
  const net = c => q.measures.reduce((s, m) => s + interpolate(m.points)[2032] * (c[m.id] ?? 1), 0)
  const r = project(baseline, { measures: q.measures, credibility: rv, firstYearShare: FIRST_YEAR_SHARE }).find(x => x.year === 2032)
  console.log(`${id.padEnd(4)} net 2032 annoncé ${net({}).toFixed(1).padStart(7)} | synthèse ${net(rv).toFixed(1).padStart(7)} | déficit ${r.deficitPct.toFixed(2)} % dette ${r.debtPct.toFixed(1)} %`)
}
for (const id of ORDER) { const d = parties[id].checked; if (!d) err(id, 'checked'); else if ((Date.now() - new Date(d)) / 864e5 > STALE_DAYS) console.log(`${id} : vérifié le ${d}, plus de ${STALE_DAYS} jours`) }
if (bad) process.exit(1)
