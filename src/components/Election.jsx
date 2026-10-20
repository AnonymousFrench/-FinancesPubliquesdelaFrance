import React, { useMemo, useState } from 'react'
import { baseline, governmentPlan, parties, reviewCredibility, reviewsOf, RULE, ORDER, SCORED, SOURCES, KIND, FIRST_YEAR_SHARE, STALE_DAYS } from '../data/election2027.js'
import { pName, pPosition, pRole, pDocument, pHeadline, pGrowthNote, pMeasuresNote, pPledges, unscoredText, ageOf, mName, mDetail, mFlag, ruleLabel, ruleNote, kindLabel, govLabel, extLabel, reviewLabel, reviewBy, reviewNoteText } from '../data/electionText.js'
import { project, interpolate, YEARS } from '../lib/projection.js'
import { usePolls, pollOf } from '../lib/usePolls.js'
import { WIKI_PAGE, pollBlackout } from '../lib/polls.js'
import { PollStatus, PollMentions } from './Polls.jsx'
import { usePhotos } from '../lib/usePhotos.js'
import { Card, Kpi, Seg } from './ui.jsx'
import { LineChart } from '../lib/charts.jsx'
import { bn, fmt, pct, signed, unitBn, dateFr } from '../lib/format.js'
import { T, isEn } from '../i18n.js'
import { withLang } from '../routes.js'
import { getLang } from '../i18n.js'
const lp = p => withLang(p, getLang())

const S = k => SOURCES[k]
const PROJ = YEARS.filter(y => y >= 2026)
const pointsOf = obj => Object.entries(obj).map(([y, v]) => [+y, v])
const GOV = '#1a7f4b'
const BASE_C = '#9aa4b2'
const LIST = ORDER.map(id => parties[id])          // tous les candidats suivis
const SLIST = SCORED.map(id => parties[id])        // programmes chiffrés, modélisés
const unscored = q => q.status === 'unscored'
const WORDS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze']
const WORDS_EN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
const cap = w => w[0].toUpperCase() + w.slice(1)
const at = (rows, y) => rows.find(r => r.year === y)
const line = (key, rows, ref) => rows.filter(r => r.year >= 2025).map(r => [r.year, +(r[key] - (ref ? at(ref, r.year)[key] : 0)).toFixed(2)])
const reviewName = (q, id) => reviewBy(q, reviewsOf(q).find(r => r.id === id) || reviewsOf(q)[0])
const pctAxis = v => pct(v, 0)
const UNCH = () => T('Politique inchangée', 'Unchanged policy')

// Coefficients de crédibilité d'un parti selon la base choisie : tel qu'annoncé, analyse centrale ou barème commun.
const credFor = (q, basis) => basis === 'claimed' ? {} : reviewCredibility(q, basis === 'standard' ? 'standard' : q.reviewDefault)

export default function Election() {
  const [basis, setBasis] = useState('central')
  const [growthMode, setGrowthMode] = useState('consensus')
  const marketRate = baseline.marketRate, spreadBp = 0, multiplier = 0
  const [pid, setPid] = useState('rn')
  const opts = { marketRate, spreadBp, multiplier, firstYearShare: FIRST_YEAR_SHARE }
  const growthOf = q => growthMode === 'party' && q.growthClaim ? q.growthClaim : baseline.growth

  const base = useMemo(() => project(baseline, { marketRate }), [marketRate])
  const runs = useMemo(() => SLIST.map(q => ({
    q,
    rows: project(baseline, { ...opts, measures: q.measures, growth: growthOf(q), credibility: credFor(q, basis) }),
    claimed: project(baseline, { ...opts, measures: q.measures, growth: growthOf(q) }),
  })), [basis, growthMode, marketRate, spreadBp, multiplier])

  const pick = id => { setPid(id); requestAnimationFrame(() => document.getElementById('deep-dive')?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }

  return (
    <>
      <Intro onPick={pick} />

      <Card title={T('Comparer les programmes, 2027-2032', 'Compare the programmes, 2027-2032')} className="group">
        <div className="ctl-row">
          <div className="ctl">
            <span className="ctl-l">{T('Mesures retenues', 'Measures counted')}</span>
            <Seg small value={basis} onChange={setBasis} options={[[T('Telles qu’annoncées', 'As announced'), 'claimed'], [T('Analyse indépendante', 'Independent review'), 'central'], [T('Barème commun', 'Common scale'), 'standard']]} />
          </div>
          <div className="ctl">
            <span className="ctl-l">{T('Croissance', 'Growth')}</span>
            <Seg small value={growthMode} onChange={setGrowthMode} options={[[T('Consensus', 'Consensus'), 'consensus'], [T('Hypothèses des partis', 'Party assumptions'), 'party']]} />
          </div>
        </div>
        {basis === 'central' && <p className="ctl-note">{T(
          'Analyse indépendante : pour chaque programme, une synthèse ligne par ligne établie par cette page à partir des évaluations publiées (Institut de l’Entreprise, Terra Nova, Institut Montaigne, iFRAP, France Budget, Conseil d’analyse économique, Cour des comptes…). Les mêmes règles valent pour tous : les coûts comptent en entier, ou davantage quand les évaluations les jugent sous-estimés ; les économies sans mesure détaillée ne sont pas retenues ; les autres sont ramenées aux montants que les évaluations jugent atteignables. Le détail et les sources figurent dans la fiche de chaque candidat.',
          'Independent review: for each programme, a line-by-line synthesis built by this page from published assessments (Institut de l’Entreprise, Terra Nova, Institut Montaigne, iFRAP, France Budget, Conseil d’analyse économique, Cour des comptes…). The same rules apply to all: costs count in full, or more when assessments find them understated; savings with no detailed measure are not retained; the others are brought down to the amounts assessments judge achievable. Details and sources are in each candidate’s deep dive.')}</p>}

        <Impact runs={runs} base={base} basis={basis} />
        <Trajectories runs={runs} base={base} />
        <Size runs={runs} basis={basis} />
        <Table runs={runs} base={base} basis={basis} />
      </Card>

      <Card title={T('Zoom sur un programme', 'Zoom on one programme')} sub={T('Choisissez un parti', 'Choose a party')} className="group" id="deep-dive">
        <PartyPicker value={pid} onChange={setPid} />
        {unscored(parties[pid])
          ? <UnscoredDive key={pid} q={parties[pid]} />
          : <DeepDive key={pid + basis} q={parties[pid]} basis={basis} base={base} opts={opts} growth={growthOf(parties[pid])} />}
      </Card>
    </>
  )
}

// Sélecteur de parti : grands boutons avec portrait (ou pastille aux couleurs du parti).
function Avatar({ q, photos, size = 38 }) {
  const ph = photos[q.candidate]
  return ph
    ? <img className="pk-photo" src={ph.src} alt={q.candidate} loading="lazy" width={size} height={size} />
    : <span className="pk-badge">{q.short}</span>
}

function PartyPicker({ value, onChange }) {
  const photos = usePhotos()
  return (
    <>
      <div className="picker" role="tablist" aria-label={T('Programme à détailler', 'Programme to detail')}>
        {LIST.map(q => (
          <button key={q.id} role="tab" aria-selected={value === q.id} className={value === q.id ? 'on' : ''} style={{ '--pc': q.color }} onClick={() => onChange(q.id)}>
            <Avatar q={q} photos={photos} />
            <span className="pk-t"><b>{q.candidate}</b><em>{pName(q)}</em></span>
          </button>
        ))}
      </div>
      <a className="photo-credit" href="https://commons.wikimedia.org/" target="_blank" rel="noreferrer">{T('Photos : Wikimedia Commons', 'Photos: Wikimedia Commons')}</a>
    </>
  )
}

function Intro({ onPick }) {
  const state = usePolls()
  const photos = usePhotos()
  const blackout = pollBlackout()
  return (
    <Card title={T('Présidentielle 2027 : les programmes face à la dette', '2027 election: the programmes and the debt')}
      sub={T(`${cap(WORDS[LIST.length])} candidats, dont ${WORDS[SLIST.length]} avec un programme chiffré, passés au même modèle et comparés à la politique inchangée jusqu’en 2032.`, `${cap(WORDS_EN[LIST.length])} candidates, ${WORDS_EN[SLIST.length]} of them with a costed programme, run through one model and compared with unchanged policy to 2032.`)}
      src={[{ label: 'Wikipédia, liste des sondages 2027', url: WIKI_PAGE }, S('touteleurope'), S('wikiFR'), S('assemblee'), { label: 'photos Wikimedia Commons', url: 'https://commons.wikimedia.org/' }]}>
      <div className="cands">
        {LIST.map(q => {
          const p = pollOf(state.data, q.pollName)
          const v = p ? p.v : q.poll, d = p ? p.delta : q.pollDelta
          return (
            <button key={q.id} className="cand" style={{ '--pc': q.color }} onClick={() => onPick(q.id)} title={T(`Zoom : ${q.name}`, `Zoom: ${pName(q)}`)}>
              <span className="cand-top"><span className="cand-pos">{pPosition(q)}</span>{photos[q.candidate] && <img className="cand-photo" src={photos[q.candidate].src} alt={q.candidate} loading="lazy" />}</span>
              <b className="cand-name">{q.candidate}</b>
              <span className="cand-party">{pName(q)}</span>
              {!blackout && <><span className="cand-poll">{pct(v)}{d != null && (Math.abs(d) < 0.05 ? <em className="mut">=</em> : <em className={d > 0 ? 'dn' : 'up'}>{d > 0 ? '▲' : '▼'} {fmt(Math.abs(d))}</em>)}</span>
              <span className="cand-bar"><i style={{ width: `${v / 36 * 100}%` }} /></span></>}
              <span className="cand-seats">{q.deputies} {T('députés', 'deputies')}{unscored(q) && <em className="cand-ns"> · {T('non chiffré', 'not costed')}</em>}</span>
            </button>
          )
        })}
      </div>
      {blackout
        ? <p className="mentions">{T(`Sondages suspendus la veille et le jour du ${blackout.label} (loi du 19 juillet 1977), jusqu’au ${blackout.end}.`, `Polls suspended the day before and the day of the ${blackout.labelEn} (law of 19 July 1977), until ${blackout.endEn}.`)}</p>
        : <><div className="poll-meta"><PollStatus state={state} /><a href={lp('/sondages-presidentielle-2027')}>{T('Tous les sondages →', 'All polls →')}</a></div><PollMentions /></>}
    </Card>
  )
}

// Barres divergentes : écart en 2032 par rapport à la politique inchangée. Plein = base retenue ; contour = tel qu'annoncé.
function Impact({ runs, base, basis }) {
  const b = at(base, 2032)
  const rows = runs.map(({ q, rows, claimed }) => {
    const r = at(rows, 2032), c = at(claimed, 2032)
    return { q, def: r.deficitPct - b.deficitPct, debt: r.debtPct - b.debtPct, cdef: c.deficitPct - b.deficitPct, cdebt: c.debtPct - b.debtPct }
  })
  const sorted = [...rows].sort((x, y) => x.debt - y.debt)
  const maxDef = niceMax(Math.max(...rows.flatMap(r => [Math.abs(r.def), Math.abs(r.cdef)])))
  const maxDebt = niceMax(Math.max(...rows.flatMap(r => [Math.abs(r.debt), Math.abs(r.cdebt)])))
  const ghost = basis !== 'claimed'
  return (
    <Card>
      <div className="grid2 flat">
        <Diverging title={T('Déficit 2032, points de PIB', '2032 deficit, points of GDP')} rows={sorted.map(r => ({ q: r.q, v: r.def, g: ghost ? r.cdef : null }))} max={maxDef} />
        <Diverging title={T('Dette 2032, points de PIB', '2032 debt, points of GDP')} rows={sorted.map(r => ({ q: r.q, v: r.debt, g: ghost ? r.cdebt : null }))} max={maxDebt} />
      </div>
      {ghost && <p className="hint"><span className="ghost-key" /> {T('Contour : le programme tel qu’annoncé.', 'Outline: the programme as announced.')} {T(`1 point de PIB ≈ 35 Md€.`, `1 point of GDP ≈ €35bn.`)}</p>}
    </Card>
  )
}

function niceMax(v) {
  const steps = [1, 2, 2.5, 5, 10, 15, 20, 25, 30, 40, 50]
  return steps.find(s => s >= v * 1.05) || Math.ceil(v / 10) * 10
}

function Diverging({ title, rows, max }) {
  const X = v => 50 + v / max * 50
  const ticks = [-max, -max / 2, 0, max / 2, max]
  return (
    <div className="div">
      <h4>{title}</h4>
      <div className="div-axis"><span />{ticks.map(t => <em key={t} style={{ left: `${X(t)}%` }}>{signed(t, Number.isInteger(t) ? 0 : 1)}</em>)}</div>
      {rows.map(({ q, v, g }) => (
        <div key={q.id} className="div-row">
          <span className="div-l"><i style={{ background: q.color }} />{q.short}</span>
          <span className="div-track">
            <span className="div-zero" />
            {g != null && <span className="div-ghost" style={{ left: `${Math.min(X(0), X(g))}%`, width: `${Math.abs(X(g) - X(0))}%`, borderColor: q.color }} />}
            <span className="div-bar" style={{ left: `${Math.min(X(0), X(v))}%`, width: `${Math.max(0.4, Math.abs(X(v) - X(0)))}%`, background: q.color }} />
          </span>
          <span className={'div-v ' + (v < -0.05 ? 'dn' : v > 0.05 ? 'up' : 'mut')}>{signed(v)}</span>
        </div>
      ))}
      <div className="div-foot"><span>{T('◄ mieux', '◄ better')}</span><span>{UNCH().toLowerCase()}</span><span>{T('pire ►', 'worse ►')}</span></div>
    </div>
  )
}

function Trajectories({ runs, base }) {
  const [metric, setMetric] = useState('debtPct')
  const isDebt = metric === 'debtPct'
  const vals = [...runs.flatMap(r => r.rows), ...base].filter(r => r.year >= 2025).map(r => r[metric])
  const lo = isDebt ? Math.floor(Math.min(...vals) / 10) * 10 : 0
  const hi = Math.ceil(Math.max(...vals) / (isDebt ? 10 : 2)) * (isDebt ? 10 : 2)
  const b32 = at(base, 2032)
  return (
    <Card title={T('Trajectoires 2025-2032', 'Trajectories 2025-2032')}
      sub={T(`${isDebt ? 'Dette' : 'Déficit'} en % du PIB, même échelle pour tous. Pointillés : politique inchangée.`, `${isDebt ? 'Debt' : 'Deficit'} as % of GDP, same scale for all. Dashed: unchanged policy.`)}
      right={<Seg small value={metric} onChange={setMetric} options={[[T('Dette', 'Debt'), 'debtPct'], [T('Déficit', 'Deficit'), 'deficitPct']]} />}>
      <div className="multi">
        {runs.map(({ q, rows }) => {
          const r = at(rows, 2032)
          const dPts = r[metric] - b32[metric]
          const dEur = isDebt ? r.debt - b32.debt : r.deficit - b32.deficit
          const tone = dPts < -0.05 ? 'dn' : dPts > 0.05 ? 'up' : 'mut'
          return (
            <div key={q.id} className="mini">
              <div className="mini-h"><i style={{ background: q.color }} /><b>{q.short}</b><span>{q.candidate}</span></div>
              <div className="mini-v"><b>{pct(r[metric])}</b><span className={tone}>{signed(dPts)} pt · {isEn() ? `${signed(dEur, 0)}bn` : `${signed(dEur, 0)} Md€`}{isDebt ? '' : T(' par an', ' a year')}</span></div>
              <LineChart height={120} legend={false} yMin={lo} yMax={hi} xTicks={[2026, 2029, 2032]}
                series={[
                  { name: UNCH(), color: BASE_C, dash: true, width: 1.6, points: line(metric, base) },
                  { name: q.short, color: q.color, width: 2.6, points: line(metric, rows) },
                ]}
                band={{ from: 0, to: 1, color: tone === 'dn' ? '#1a7f4b' : '#e1000f', opacity: 0.2, label: '' }}
                refLines={isDebt ? [] : [{ y: 3, label: '3%' }]}
                axes={{ left: { fmt: v => fmt(v, 0), tipFmt: v => pct(v) } }} />
            </div>
          )
        })}
      </div>
      <p className="hint">{T('Écart en 2032 avec la politique inchangée : ', 'Gap in 2032 vs unchanged policy: ')}<span className="dn">{T('vert', 'green')}</span> = {isDebt ? T('moins de dette', 'less debt') : T('moins de déficit', 'less deficit')}, <span className="up">{T('rouge', 'red')}</span> = {T('davantage', 'more')}.</p>
    </Card>
  )
}

// Ampleur de la recomposition budgétaire : gains et coûts bruts annoncés pour 2032.
const sizeCats = () => [
  ['cutsSpend', T('Baisses de dépenses', 'Spending cuts'), '#2a9d8f'], ['newRev', T('Recettes nouvelles', 'New revenue'), '#8cc084'],
  ['taxCuts', T('Baisses d’impôts', 'Tax cuts'), '#f2a65a'], ['newSpend', T('Dépenses nouvelles', 'New spending'), '#e07a5f'],
]
function sizeOf(q) {
  const t = { cutsSpend: 0, newRev: 0, taxCuts: 0, newSpend: 0 }
  for (const m of q.measures) {
    const v = interpolate(m.points)[2032]
    const parts = m.kind === 'mixed' ? [['spending', v / 2], ['revenue', v / 2]] : [[m.kind, v]]
    for (const [k, x] of parts) {
      if (x >= 0) t[k === 'spending' ? 'cutsSpend' : 'newRev'] += x
      else t[k === 'spending' ? 'newSpend' : 'taxCuts'] += -x
    }
  }
  return t
}
function Size({ runs, basis }) {
  const data = runs.map(({ q, rows }) => ({ q, t: sizeOf(q), counted: at(rows, 2032).measures }))
  const max = niceMax(Math.max(...data.flatMap(d => [d.t.cutsSpend + d.t.newRev, d.t.taxCuts + d.t.newSpend])))
  const X = v => 50 + v / max * 50
  const CATS = sizeCats()
  return (
    <Card title={T('Ampleur des programmes', 'Scale of the programmes')}
      sub={T('Montants bruts annoncés pour 2032, Md€ par an : coûts à gauche, gains à droite.', `Gross amounts announced for 2032, ${unitBn()} a year: costs on the left, gains on the right.`)}
      right={<div className="legend">{CATS.map(([k, n, c]) => <span key={k}><i style={{ background: c }} />{n}</span>)}<span><i className="net-key" />{T('Net annoncé', 'Net announced')}</span>{basis !== 'claimed' && <span><i className="cnt-key" />{T('Net retenu', 'Net counted')}</span>}</div>}>
      <div className="div size">
        <div className="div-axis"><span />{[-max, -max / 2, 0, max / 2, max].map(t => <em key={t} style={{ left: `${X(t)}%` }}>{signed(t, Number.isInteger(t) ? 0 : 1)}</em>)}</div>
        {data.map(({ q, t, counted }) => {
          const net = t.cutsSpend + t.newRev - t.taxCuts - t.newSpend
          let right = 50, left = 50
          return (
            <div key={q.id} className="div-row">
              <span className="div-l"><i style={{ background: q.color }} />{q.short}</span>
              <span className="div-track tall">
                <span className="div-zero" />
                {CATS.slice(0, 2).map(([k, n, c]) => { const w = t[k] / max * 50; const el = <span key={k} className="seg-bar" title={`${n}: ${bn(t[k], 0)}`} style={{ left: `${right}%`, width: `${w}%`, background: c }} />; right += w; return el })}
                {CATS.slice(2).map(([k, n, c]) => { const w = t[k] / max * 50; left -= w; return <span key={k} className="seg-bar" title={`${n}: ${bn(t[k], 0)}`} style={{ left: `${left}%`, width: `${w}%`, background: c }} /> })}
                <span className="net-mark" style={{ left: `${X(net)}%` }} title={`${T('Net annoncé', 'Net announced')}: ${signed(net, 0)} ${unitBn()}`} />
                {basis !== 'claimed' && <span className="cnt-mark" style={{ left: `${X(counted)}%`, background: q.color }} title={`${T('Net retenu', 'Net counted')}: ${signed(counted, 0)} ${unitBn()}`} />}
              </span>
              <span className="div-v wide">{signed(net, 0)}<em>{basis !== 'claimed' ? ` → ${signed(counted, 0)}` : ''}</em></span>
            </div>
          )
        })}
        <div className="div-foot"><span>{T('◄ coûts', '◄ costs')}</span><span /><span>{T('gains ►', 'gains ►')}</span></div>
      </div>
    </Card>
  )
}

function Table({ runs, base, basis }) {
  const b = at(base, 2032)
  const all = [{ name: UNCH(), rows: base, review: '–' }, ...runs.map(({ q, rows }) => ({ name: pName(q), q, rows, review: basis === 'claimed' ? T('tel qu’annoncé', 'as announced') : reviewName(q, basis === 'standard' ? 'standard' : q.reviewDefault) }))]
  return (
    <Card title={T('2032 en chiffres', '2032 in figures')}>
      <div className="t-wrap">
        <table className="t">
          <thead><tr><th></th><th>{T('Déficit', 'Deficit')}</th><th>{T('Écart', 'Gap')}</th><th>{T('Dette', 'Debt')}</th><th>{T('Écart', 'Gap')}</th><th>{T('Dépenses', 'Spending')}</th><th>{T('Recettes', 'Revenue')}</th><th>{T('Intérêts', 'Interest')}</th><th>{T('Mesures nettes', 'Net measures')}</th><th>{T('Évalué par', 'Assessed by')}</th></tr></thead>
          <tbody>
            {all.map(({ name, q, rows, review }) => {
              const r = at(rows, 2032)
              const dd = r.deficitPct - b.deficitPct, db = r.debtPct - b.debtPct
              return (
                <tr key={name} className={q ? '' : 'mutrow'}>
                  <td>{q && <i className="dot-c" style={{ background: q.color }} />}{name}</td>
                  <td>{pct(r.deficitPct)}</td><td className={q ? (dd < -0.05 ? 'dn' : dd > 0.05 ? 'up' : '') : ''}>{q ? signed(dd) : '–'}</td>
                  <td>{pct(r.debtPct)}</td><td className={q ? (db < -0.05 ? 'dn' : db > 0.05 ? 'up' : '') : ''}>{q ? signed(db) : '–'}</td>
                  <td>{pct(r.spendingPct)}</td><td>{pct(r.revenuePct)}</td><td>{bn(r.interest, 0)}</td>
                  <td>{q ? (isEn() ? `${signed(r.measures, 0)}bn` : `${signed(r.measures, 0)} Md€`) : '–'}</td><td className="mut">{review}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// Fiche candidat succincte : portrait, fonction, parti, sondage du moment et liens de référence.
function Profile({ q }) {
  const photos = usePhotos()
  const state = usePolls()
  const p = pollOf(state.data, q.pollName)
  const blackout = pollBlackout()
  const ph = photos[q.candidate]
  return (
    <div className="profile" style={{ '--pc': q.color }}>
      {ph ? <img className="pf-photo" src={ph.src} alt={q.candidate} /> : <span className="pf-photo pf-ph">{q.short}</span>}
      <div className="pf-main">
        <b className="pf-name">{q.candidate}</b>
        <span className="pf-role">{pRole(q)} · {ageOf(q.profile.born)} {T('ans', 'years old')}</span>
        <span className="pf-party"><i style={{ background: q.color }} />{pName(q)} · {pPosition(q)}</span>
        <span className="pf-links">
          <a href={`https://fr.wikipedia.org/wiki/${q.profile.wiki}`} target="_blank" rel="noreferrer">{T('Wikipédia', 'Wikipedia (in French)')}</a>
          <a href={q.officialSite} target="_blank" rel="noreferrer">{T('Site du parti', 'Party website')}</a>
        </span>
        <Checked q={q} />
      </div>
      <div className="pf-stats">
        {!blackout && p && <span><b>{pct(p.v)}</b>{T('sondages 1er tour', 'first-round polls')}</span>}
        <span><b>{q.deputies}</b>{T('députés', 'deputies')}</span>
      </div>
    </div>
  )
}

// Date de la dernière vérification du programme ; signalée si elle date de plus de STALE_DAYS jours.
function Checked({ q }) {
  if (!q.checked) return null
  const age = Math.floor((Date.now() - new Date(q.checked + 'T00:00:00Z').getTime()) / 864e5)
  const stale = age > STALE_DAYS
  return (
    <span className={'pf-checked' + (stale ? ' stale' : '')}>
      {T(`Programme et analyses vérifiés le ${dateFr(q.checked)}`, `Programme and reviews checked on ${dateFr(q.checked)}`)}
      {stale && T(` : vérification de plus de ${STALE_DAYS} jours, des annonces récentes peuvent manquer.`, `: more than ${STALE_DAYS} days old, recent announcements may be missing.`)}
    </span>
  )
}

// Candidat sans programme chiffré : fiche, engagements principaux, sans projection.
function UnscoredDive({ q }) {
  const u = unscoredText()
  return (
    <Card title={T(`Programme ${q.short}`, `${q.short} programme`)} src={q.src.map(S)}>
      <Profile q={q} />
      <div className="claims">{pHeadline(q).map(([k, v]) => <div key={k} className="claim"><span>{k}</span><b>{v}</b></div>)}</div>
      <p className="ctl-note"><b>{u.title}.</b> {u.text}</p>
      <p className="sub">{pDocument(q)}</p>
      {pPledges(q).length > 0 && <ul className="pledges">{pPledges(q).map(([k, v]) => <li key={k}><b>{k}</b> {v}</li>)}</ul>}
    </Card>
  )
}

function DeepDive({ q, basis, base, opts, growth }) {
  const [preset, setPreset] = useState(basis === 'claimed' ? 'claimed' : 'review')
  const [reviewId, setReviewId] = useState(basis === 'standard' ? 'standard' : q.reviewDefault)
  const [custom, setCustom] = useState(null)
  const [open, setOpen] = useState(null)
  const reviews = reviewsOf(q)
  const review = reviews.find(r => r.id === reviewId) || reviews[0]

  const cred = useMemo(() => {
    if (preset === 'custom' && custom) return custom
    if (preset === 'review') return reviewCredibility(q, review.id)
    return Object.fromEntries(q.measures.map(m => [m.id, 1]))
  }, [q, preset, review, custom])
  const setCred = (id, v) => { setPreset('custom'); setCustom({ ...cred, [id]: v }) }
  const scen = useMemo(() => project(baseline, { ...opts, measures: q.measures, credibility: cred, growth }), [q, cred, opts.marketRate, opts.spreadBp, opts.multiplier, growth])

  const b32 = at(base, 2032), s32 = at(scen, 2032)
  const tgtYear = Object.keys(q.targets.deficit).map(Number).sort().at(-1)
  const series = (key, rows) => rows.filter(r => r.year >= 2025).map(r => [r.year, +r[key].toFixed(2)])
  const extSeries = metric => q.external.filter(e => e[metric]).map((e, k) => ({ name: extLabel(e.label), color: ['#8e7cc3', '#f28c28'][k], line: false, points: pointsOf(e[metric]) }))
  const note = reviewNoteText(q, review)
  const gdp = T('du PIB', 'of GDP')

  return (
    <>
      <Card title={T(`Programme ${q.short}`, `${q.short} programme`)} src={q.src.map(S)}>
        <Profile q={q} />
        <div className="claims">{pHeadline(q).map(([k, v]) => <div key={k} className="claim"><span>{k}</span><b>{v}</b></div>)}</div>
        <details className="about"><summary>{T('À propos de ce chiffrage', 'About this costing')}</summary><p className="sub">{pDocument(q)}</p></details>
      </Card>

      <section className="card ctl-card">
        <div className="ctl-row">
          <div className="ctl">
            <span className="ctl-l">{T('Mesures', 'Measures')}</span>
            <Seg small value={preset} onChange={v => { setPreset(v); setCustom(null) }} options={[[T(`Telles qu’annoncées (${q.short})`, `As announced (${q.short})`), 'claimed'], [T('Analyse indépendante', 'Independent review'), 'review']]} />
            {preset === 'review' && <Seg small value={review.id} onChange={setReviewId} options={reviews.map(r => [reviewLabel(q, r), r.id])} />}
          </div>
        </div>
        {preset === 'review' && review.id !== 'standard' && <p className="ctl-note">{note}</p>}
      </section>

      <div className="kpis">
        <Kpi label={T('Déficit 2032', '2032 deficit')} value={pct(s32.deficitPct)} sub={T(`politique inchangée ${pct(b32.deficitPct)} · ${signed(s32.deficitPct - b32.deficitPct)} pt`, `unchanged policy ${pct(b32.deficitPct)} · ${signed(s32.deficitPct - b32.deficitPct)} pt`)} tone={s32.deficitPct > 3 ? 'bad' : 'good'} />
        <Kpi label={tgtYear ? T(`Déficit ${tgtYear} et objectif`, `${tgtYear} deficit vs target`) : T('Objectif de déficit', 'Deficit target')} value={tgtYear ? pct(at(scen, tgtYear).deficitPct) : '–'} sub={tgtYear ? T(`objectif ${q.short} : ${pct(q.targets.deficit[tgtYear])}`, `${q.short} target: ${pct(q.targets.deficit[tgtYear])}`) : T(`aucun objectif publié par ${q.short}`, `no target published by ${q.short}`)} tone={tgtYear ? (at(scen, tgtYear).deficitPct > q.targets.deficit[tgtYear] + 0.05 ? 'bad' : 'good') : undefined} />
        <Kpi label={T('Dette 2032', '2032 debt')} value={pct(s32.debtPct)} sub={T(`politique inchangée ${pct(b32.debtPct)}${q.targets.debt[2032] ? ` · objectif ${q.short} ${pct(q.targets.debt[2032], 0)}` : ''}`, `unchanged policy ${pct(b32.debtPct)}${q.targets.debt[2032] ? ` · ${q.short} target ${pct(q.targets.debt[2032], 0)}` : ''}`)} tone={s32.debtPct > at(scen, 2026).debtPct ? 'bad' : 'good'} />
        <Kpi label={T('Dépense publique 2032', '2032 public spending')} value={pct(s32.spendingPct)} sub={T(`du PIB · inchangée ${pct(b32.spendingPct)}`, `of GDP · unchanged ${pct(b32.spendingPct)}`)} />
        <Kpi label={T('Intérêts 2032', '2032 interest')} value={bn(s32.interest, 0)} sub={T(`inchangée ${bn(b32.interest, 0)} · 2025 : ${bn(base[0].interest, 0)}`, `unchanged ${bn(b32.interest, 0)} · 2025: ${bn(base[0].interest, 0)}`)} tone="warn" />
      </div>

      <div className="grid2">
        <Card title={T('Déficit, % du PIB', 'Deficit, % of GDP')} sub={T('Points : objectifs et autres projections.', 'Dots: targets and other projections.')}>
          <LineChart height={250} yMin={0}
            series={[
              { name: UNCH(), color: BASE_C, dash: true, points: series('deficitPct', base) },
              { name: q.short, color: q.color, width: 2.8, points: series('deficitPct', scen) },
              { name: T(`Objectifs ${q.short}`, `${q.short} targets`), color: q.color, line: false, points: pointsOf(q.targets.deficit) },
              { name: govLabel(), color: GOV, line: false, points: pointsOf(governmentPlan.deficit) },
              ...extSeries('deficit'),
            ].filter(x => x.points.length)}
            refLines={[{ y: 3, label: T('Limite UE 3 %', 'EU limit 3%') }]} shade={{ from: 2026.5, to: 2032.5, label: T('Projection', 'Projection') }}
            axes={{ left: { fmt: pctAxis, tipFmt: v => pct(v) } }} />
        </Card>
        <Card title={T('Dette, % du PIB', 'Debt, % of GDP')}>
          <LineChart height={250}
            series={[
              { name: UNCH(), color: BASE_C, dash: true, points: series('debtPct', base) },
              { name: q.short, color: q.color, width: 2.8, points: series('debtPct', scen) },
              { name: T(`Objectifs ${q.short}`, `${q.short} targets`), color: q.color, line: false, points: pointsOf(q.targets.debt) },
              { name: govLabel(), color: GOV, line: false, points: pointsOf(governmentPlan.debt) },
              ...extSeries('debt'),
            ].filter(x => x.points.length)}
            shade={{ from: 2026.5, to: 2032.5, label: T('Projection', 'Projection') }}
            axes={{ left: { fmt: pctAxis, tipFmt: v => pct(v) } }} />
        </Card>
      </div>

      <div className="grid2">
        <Card title={T('Dépenses et recettes, % du PIB', 'Spending and revenue, % of GDP')} sub={T('Pointillés : politique inchangée.', 'Dashed: unchanged policy.')}>
          <LineChart height={220}
            series={[
              { name: T('Dépenses', 'Spending'), color: 'var(--blue)', width: 2.5, points: series('spendingPct', scen) },
              { name: T('Dépenses, inchangée', 'Spending, unchanged'), color: 'var(--blue)', dash: true, width: 1.5, points: series('spendingPct', base) },
              { name: T('Recettes', 'Revenue'), color: 'var(--green)', width: 2.5, points: series('revenuePct', scen) },
              { name: T('Recettes, inchangée', 'Revenue, unchanged'), color: 'var(--green)', dash: true, width: 1.5, points: series('revenuePct', base) },
            ]}
            band={{ from: 0, to: 2, color: '#e1000f', label: T('Déficit', 'Deficit') }}
            shade={{ from: 2026.5, to: 2032.5, label: T('Projection', 'Projection') }}
            axes={{ left: { fmt: pctAxis, tipFmt: v => pct(v) } }} />
        </Card>
        <Card title={T('Charge d’intérêts, Md€', `Interest bill, ${unitBn()}`)}>
          <LineChart height={220}
            series={[
              { name: UNCH(), color: BASE_C, dash: true, points: series('interest', base) },
              { name: q.short, color: q.color, width: 2.5, points: series('interest', scen) },
            ]}
            shade={{ from: 2026.5, to: 2032.5, label: T('Projection', 'Projection') }}
            axes={{ left: { fmt: v => fmt(v, 0), tipFmt: v => bn(v) } }} />
        </Card>
      </div>

      <Card title={T('Mesure par mesure', 'Measure by measure')} sub={T('Md€ par an, effet sur le solde. Curseur : part retenue ; clic : détail.', `${unitBn()} a year, effect on the balance. Slider: share counted; click: details.`)} src={q.measuresSrc.map(S)}>
        <div className="t-wrap">
          <table className="t mt">
            <thead><tr><th>{T('Mesure', 'Measure')}</th><th>{T('Nature', 'Type')}</th><th title={T('Classe selon le barème commun', 'Class under the common scale')}>{T('Classe', 'Class')}</th><th>2027</th><th>2032</th><th>{T('Retenu', 'Counted')}</th><th>{T('Modélisé 2032', 'Modelled 2032')}</th></tr></thead>
            <tbody>
              {q.measures.map(m => {
                const c = cred[m.id] ?? 1
                const path = interpolate(m.points)
                const v = path[2032] * c
                return (
                  <React.Fragment key={m.id}>
                    <tr className="click" onClick={() => setOpen(open === m.id ? null : m.id)}>
                      <td><span className={'caret' + (open === m.id ? ' open' : '')}>▸</span>{mName(q, m)}{m.cost && <span className="tag">{T('coût', 'cost')}</span>}</td>
                      <td className="mut">{kindLabel(m.kind, KIND)}</td>
                      <td>{m.cost ? <span className="mut">–</span> : <span className={'cls cls-' + m.cls} title={`${ruleLabel(m.cls)}: ${ruleNote(m.cls)}`}>{m.cls}</span>}</td>
                      <td className={path[2027] < 0 ? 'up' : ''}>{signed(path[2027])}</td>
                      <td className={path[2032] < 0 ? 'up' : ''}>{signed(path[2032])}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <span className="cred" title={m.cost ? T('Part du coût annoncé réellement dépensée (au-delà de 100 % : coût sous-estimé)', 'Share of the announced cost actually spent (above 100%: cost underestimated)') : T('Part du gain annoncé qui se réalise', 'Share of the announced gain that materialises')}><input type="range" min={0} max={m.cost ? 2 : 1} step={0.05} value={c} onChange={e => setCred(m.id, +e.target.value)} /><b>{pct(c * 100, 0)}</b></span>
                      </td>
                      <td className={v < 0 ? 'up' : 'dn'}>{signed(v)}</td>
                    </tr>
                    {open === m.id && <tr className="detail"><td colSpan={7}><p>{mDetail(q, m)}</p><p className="warn">⚠ {mFlag(q, m)}</p></td></tr>}
                  </React.Fragment>
                )
              })}
              <tr className="tot">
                <td>{T('Effet net', 'Net effect')}</td><td></td><td></td>
                <td>{signed(q.measures.reduce((s, m) => s + interpolate(m.points)[2027], 0))}</td>
                <td>{signed(q.measures.reduce((s, m) => s + interpolate(m.points)[2032], 0))}</td>
                <td></td>
                <td>{signed(q.measures.reduce((s, m) => s + interpolate(m.points)[2032] * (cred[m.id] ?? 1), 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <details className="about"><summary>{T('Origine des montants', 'Where the amounts come from')}</summary><p className="sub">{pMeasuresNote(q)}</p></details>
      </Card>

      <Card title={T('Année par année', 'Year by year')} sub={T(`${q.short}, administrations publiques`, `${q.short}, general government`)}>
        <div className="t-wrap">
          <table className="t">
            <thead><tr><th></th>{PROJ.map(y => <th key={y}>{y}</th>)}</tr></thead>
            <tbody>
              {[
                [T('Mesures nettes, Md€', `Net measures, ${unitBn()}`), r => r.year > 2026 ? fmt(r.measures) : '–'],
                [T('Recettes, % du PIB', 'Revenue, % of GDP'), r => fmt(r.revenuePct)],
                [T('Dépenses, % du PIB', 'Spending, % of GDP'), r => fmt(r.spendingPct)],
                [T('dont intérêts', 'of which interest'), r => fmt(r.interestPct), 'sub'],
                [T('Déficit, % du PIB', 'Deficit, % of GDP'), r => fmt(r.deficitPct), 'em'],
                [T('Déficit à politique inchangée', 'Deficit, unchanged policy'), r => fmt(at(base, r.year).deficitPct), 'sub'],
                [T('Dette, % du PIB', 'Debt, % of GDP'), r => fmt(r.debtPct), 'em'],
                [T('Dette à politique inchangée', 'Debt, unchanged policy'), r => fmt(at(base, r.year).debtPct), 'sub'],
                [T('Dette, Md€', `Debt, ${unitBn()}`), r => fmt(r.debt, 0)],
                [T('Taux moyen de la dette', 'Average rate on the debt'), r => pct(r.rate * 100, 2)],
              ].map(([label, f, cls]) => (
                <tr key={label} className={cls === 'em' ? 'em' : cls === 'sub' ? 'mutrow' : ''}>
                  <td>{label}</td>{scen.filter(r => r.year >= 2026).map(r => <td key={r.year}>{f(r)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
