import React, { useMemo, useState } from 'react'
import { usePolls, today, daysBefore } from '../lib/usePolls.js'
import { PARTY_COLOR, average, trend, WIKI_PAGE, pollBlackout, marginOfError, COMMISSION_URL } from '../lib/polls.js'
import { SOURCES } from '../data/election2027.js'
import { Card, Seg } from './ui.jsx'
import { INSTITUTES, INSTITUTE_STANCE, INSTITUTE_STANCE_EN } from '../data/institutes.js'
import { T, isEn } from '../i18n.js'
import { SRC_EN } from '../data/sourcesEn.js'
import { LineChart } from '../lib/charts.jsx'
import { fmt, pct, signed, dateFr, monthFr } from '../lib/format.js'

const FIRST_ROUND = '2027-04-18'
const WINDOW = 45
export { PARTY_COLOR }
const colorOf = party => PARTY_COLOR[party] || '#9aa4b2'
const SRC_WIKI = { label: 'Wikipédia, « Liste de sondages sur l’élection présidentielle française de 2027 »', url: WIKI_PAGE }
const yearFrac = iso => { const d = new Date(iso + 'T00:00:00Z'); const y = d.getUTCFullYear(); return y + (d - Date.UTC(y, 0, 1)) / (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1)) }
const fromFrac = x => { const y = Math.floor(x); const t = Date.UTC(y, 0, 1) + (x - y) * (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1)); return new Date(t).toISOString().slice(0, 10) }

export function PollStatus({ state }) {
  const { data, status } = state
  const rev = data.timestamp ? `${dateFr(data.timestamp)} ${T('à', 'at')} ${data.timestamp.slice(11, 16)} UTC` : '?'
  return (
    <span className={'live ' + status} title={status === 'error' ? state.error : ''}>
      <i />{status === 'live' ? T(`En direct · Wikipédia, version du ${rev}`, `Live · Wikipedia, version of ${rev}`) : status === 'error' ? T(`Wikipédia inaccessible · instantané du ${rev}`, `Wikipedia unreachable · snapshot of ${rev}`) : T('Chargement des derniers sondages…', 'Loading the latest polls…')}
    </span>
  )
}

// Période de réserve : aucun sondage la veille et le jour du scrutin (loi du 19 juillet 1977).
export function BlackoutNotice({ b }) {
  return (
    <Card title={T('Sondages suspendus', 'Polls suspended')} className="blackout">
      <p className="sub">{T(`Conformément à la loi du 19 juillet 1977, aucun sondage ne peut être publié, diffusé ni commenté la veille et le jour du ${b.label}. Les sondages reviennent le ${b.end}.`, `Under the French law of 19 July 1977, no poll may be published, broadcast or commented on the day before and the day of the ${b.labelEn}. Polls return on ${b.endEn}.`)}</p>
    </Card>
  )
}

// Mentions exigées pour la publication d'un sondage (loi du 19 juillet 1977, art. 2).
export function PollMentions() {
  return (
    <p className="mentions">
      {T('Sondages réalisés par les instituts cités, selon la méthode des quotas. Marge d’erreur indiquée par référence à la méthode aléatoire, à 95 %, pour un score de 50 %.', 'Polls carried out by the institutes named, using the quota method. Margin of error given by reference to random sampling, at 95%, for a 50% score.')}{' '}
      {T('Commanditaires, questions posées et notices : ', 'Sponsors, questions asked and methodology notices: ')}<a href={COMMISSION_URL} target="_blank" rel="noreferrer">{T('Commission des sondages', 'Commission des sondages (polling commission)')}</a>.{' '}
      {T('Les moyennes sont calculées par ce site à partir de ces sondages et ne constituent pas un sondage ; les sondages commandés par un parti ou un candidat en sont exclus.', 'Averages are computed by this site from these polls and are not themselves a poll; polls commissioned by a party or candidate are left out.')}
    </p>
  )
}

// Description de la source choisie, affichée en ligne sous le sélecteur (rien ne se superpose).
function SourceNote({ name }) {
  if (!name) return <p className="note-line">{T(`Pour chaque institut, son dernier sondage des ${WINDOW} derniers jours : chaque institut compte une fois, quel que soit le nombre de ses publications. Choisissez un institut pour le voir seul. Les sondages commandés par un parti ou un candidat sont exclus.`, `For each institute, its latest poll of the last ${WINDOW} days: each institute counts once, however often it publishes. Pick an institute to see it on its own. Polls commissioned by a party or candidate are left out.`)}</p>
  const f = INSTITUTES[name]
  return (
    <p className="note-line">
      <b>{name}</b> · {f ? T(f.about, f.aboutEn) : T('Institut de sondage.', 'Polling institute.')}
      {f?.owner && <> {T(`Propriétaire : ${f.owner}.`, `Owner: ${f.ownerEn}.`)}</>}
      {f?.clients && <> {T(`Principaux commanditaires de ses sondages présidentiels en 2026 : ${f.clients}.`, `Main buyers of its 2026 presidential polls: ${f.clients}.`)}</>}
      {' '}{T(INSTITUTE_STANCE, INSTITUTE_STANCE_EN)}
      {f?.wiki && <> <a href={`https://fr.wikipedia.org/wiki/${f.wiki}`} target="_blank" rel="noreferrer">{T('Wikipédia', 'Wikipedia (in French)')}</a></>}
    </p>
  )
}

export default function Polls() {
  const b = pollBlackout()
  return b ? <BlackoutNotice b={b} /> : <PollsLive />
}

function PollsLive() {
  const state = usePolls()
  const { first, second } = state.data
  const [sel, setSel] = useState('avg')
  const t = today()
  const days = Math.max(0, Math.round((new Date(FIRST_ROUND) - new Date(t)) / 864e5))

  // Instituts actifs sur les quatre derniers mois, du plus prolifique au moins prolifique.
  const institutes = useMemo(() => {
    const c = {}
    for (const p of first) if (p.date >= daysBefore(t, 120)) c[p.pollster] = (c[p.pollster] || 0) + 1
    return Object.keys(c).sort((x, y) => c[y] - c[x])
  }, [first, t])
  const inst = sel !== 'avg' && institutes.includes(sel) ? sel : null

  // Classement : moyenne des instituts, ou dernier sondage de l'institut choisi (variation vs son sondage précédent).
  const view = useMemo(() => {
    if (!inst) {
      const now = average(first, t, WINDOW), before = average(first, daysBefore(t, 30), WINDOW)
      return { rows: now.rows.filter(r => r.v >= 0.5), prev: name => before.rows.find(r => r.name === name)?.v, deltaLabel: T('sur 30 j', 'over 30 days'), info: now.pollsters.join(' · '), names: now.rows.filter(r => r.n >= 2).slice(0, 8).map(r => r.name) }
    }
    const mine = first.filter(p => p.pollster === inst)
    const cur = mine[0], prev = mine[1]
    const rows = cur.results.filter(r => r.v >= 0.5).slice().sort((x, y) => y.v - x.v)
    return { rows, prev: name => prev?.results.find(r => r.name === name)?.v, deltaLabel: T('vs sondage précédent', 'vs previous poll'), info: T(`${inst} · terrain jusqu’au ${dateFr(cur.date)}${cur.sample ? ` · ${fmt(cur.sample, 0)} personnes (± ${fmt(marginOfError(cur.sample), 1)} pt)` : ''}`, `${inst} · fieldwork until ${dateFr(cur.date)}${cur.sample ? ` · ${fmt(cur.sample, 0)} respondents (± ${fmt(marginOfError(cur.sample), 1)} pt)` : ''}`), names: rows.slice(0, 8).map(r => r.name) }
  }, [first, t, inst])
  const max = Math.ceil((view.rows[0]?.v || 40) / 5) * 5
  const names = view.names
  const partyOf = name => view.rows.find(r => r.name === name)?.party

  // Courbes : moyenne glissante, ou sondages successifs de l'institut choisi.
  const series = useMemo(() => {
    if (!inst) {
      const tr = trend(first, names, { from: daysBefore(t, 300), to: t, stepDays: 7, windowDays: WINDOW })
      return names.map(n => ({ name: n, color: colorOf(partyOf(n)), width: n === names[0] ? 2.8 : 2.2, points: tr[n].map(([ts, v]) => [yearFrac(new Date(ts).toISOString().slice(0, 10)), v]) }))
    }
    const mine = first.filter(p => p.pollster === inst && p.date >= daysBefore(t, 400)).slice().reverse()
    return names.map(n => ({ name: n, color: colorOf(partyOf(n)), dots: true, width: n === names[0] ? 2.8 : 2.2, points: mine.map(p => [yearFrac(p.date), p.results.find(r => r.name === n)?.v ?? null]) }))
  }, [first, names, t, inst])
  const ticks = useMemo(() => {
    const out = [], d = new Date(daysBefore(t, 300) + 'T00:00:00Z')
    for (let k = 0; k < 12; k++) { const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + k + 1, 1)); if (m > new Date(t)) break; if (k % 2 === 0) out.push(yearFrac(m.toISOString().slice(0, 10))) }
    return out
  }, [t])

  const latest = (inst ? first.filter(p => p.pollster === inst) : first).slice(0, 10)
  const cols = names

  // Seconds tours : moyenne récente par hypothèse, ou derniers résultats de l'institut choisi.
  const duels = useMemo(() => {
    const g = new Map()
    for (const p of second) { if (inst && p.pollster !== inst) continue; if (!g.has(p.hypothesis)) g.set(p.hypothesis, []); g.get(p.hypothesis).push(p) }
    return [...g.entries()].map(([h, ps]) => {
      const recent = inst ? [] : ps.filter(p => p.date >= daysBefore(t, WINDOW) && !p.partySponsor)
      const use = recent.length ? recent : ps.slice(0, 1)
      const [a, b] = ps[0].results
      const avg = k => use.reduce((s, p) => s + p.results[k].v, 0) / use.length
      return { h, a: { ...a, v: avg(0) }, b: { ...b, v: avg(1) }, n: use.length, last: ps[0].date }
    }).filter(d => d.last >= daysBefore(t, inst ? 240 : 120)).sort((x, y) => y.last.localeCompare(x.last) || y.n - x.n)
  }, [second, t, inst])

  return (
    <Card title={T('Sondages de la présidentielle 2027', '2027 presidential election polls')} className="group"
      sub={T('Premier tour', 'First round')}
      right={<div className="countdown"><b>{T('J−', 'D−')}{days}</b><span>{T('1er tour le 18 avril 2027', 'First round on 18 April 2027')}</span></div>}
      src={SRC_WIKI}>
      <div className="pick">
        <span className="ctl-l">{T('Source', 'Source')}</span>
        <Seg value={inst ? sel : 'avg'} onChange={setSel} options={[[T('Moyenne des instituts', 'Average of institutes'), 'avg'], ...institutes.map(i => [i, i])]} />
      </div>
      <SourceNote name={inst} />
      <div className="poll-meta"><PollStatus state={state} /><span className="mut">{view.info}</span></div>

      <div className="grid2 flat poll-top">
        <div>
          <h4>{inst ? T(`Intentions de vote, ${inst}`, `Voting intentions, ${inst}`) : T(`Intentions de vote, moyenne sur ${WINDOW} jours`, `Voting intentions, ${WINDOW}-day average`)}<span className="h4-note">{T('écart ', 'change ')}{view.deltaLabel}</span></h4>
          <div className="bars ranking">
            {view.rows.map(r => {
              const pv = view.prev(r.name), d = pv != null ? r.v - pv : null
              return (
                <div key={r.name} className="bar-row">
                  <span className="bar-n"><i className="dot-c" style={{ background: colorOf(r.party) }} />{r.name} <span className="mut">({r.party})</span></span>
                  <span className="bar-t"><span className="bar-f" style={{ width: `${r.v / max * 100}%`, background: colorOf(r.party) }} /></span>
                  <span className="bar-v"><b>{pct(r.v, r.v % 1 ? 1 : (inst ? 0 : 1))}</b><span className={'bar-p ' + (d == null ? '' : d > 0.25 ? 'dn' : d < -0.25 ? 'up' : '')}>{d == null ? T('nouveau', 'new') : Math.abs(d) < 0.05 ? T('stable', 'unchanged') : `${signed(d)} pt`}</span></span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="second">
          <h4>{inst ? T(`Seconds tours testés, ${inst}`, `Second-round matchups tested, ${inst}`) : T('Seconds tours testés (moyenne)', 'Second-round matchups tested (average)')}</h4>
          {duels.slice(0, 8).map(d => (
            <div key={d.h} className="duel">
              <div className="duel-l"><span>{d.a.name}</span><span>{d.b.name}</span></div>
              <div className="duel-bar">
                <span style={{ width: `${d.a.v}%`, background: colorOf(d.a.party) }}>{fmt(d.a.v, 0)}</span>
                <span style={{ width: `${d.b.v}%`, background: colorOf(d.b.party) }}>{fmt(d.b.v, 0)}</span>
              </div>
              <div className="duel-s mut">{T(`${d.n} sondage${d.n > 1 ? 's' : ''} · dernier le ${dateFr(d.last)}`, `${d.n} poll${d.n > 1 ? 's' : ''} · latest on ${dateFr(d.last)}`)}</div>
            </div>
          ))}
          {!duels.length && <p className="hint">{T('Aucun second tour testé récemment par cet institut.', 'No second round tested recently by this institute.')}</p>}
        </div>
      </div>

      <div className="sec">
        <h3>{T('Dynamique de la campagne', 'Campaign trend')} <span className="sec-s">{inst ? T(`${inst}, sondage par sondage`, `${inst}, poll by poll`) : T(`moyenne glissante sur ${WINDOW} jours`, `${WINDOW}-day rolling average`)}</span></h3>
        <LineChart height={290} series={series}
          xTicks={inst ? undefined : ticks} xFmt={x => { const d = fromFrac(x + 0.001); return monthFr(+d.slice(0, 4), +d.slice(5, 7)) }}
          tipX={x => inst ? dateFr(fromFrac(x)) : T(`Semaine du ${dateFr(fromFrac(x))}`, `Week of ${dateFr(fromFrac(x))}`)}
          yMin={0}
          axes={{ left: { fmt: v => pct(v, 0), tipFmt: v => pct(v) } }} />
      </div>

      <div className="sec">
        <h3>{T('Derniers sondages', 'Latest polls')} <span className="sec-s">{inst ? inst : T('tous instituts', 'all institutes')}{T(', hypothèse principale', ', main scenario')}</span></h3>
        <div className="t-wrap">
          <table className="t">
            <thead><tr><th>{T('Institut', 'Institute')}</th><th>{T('Commanditaire', 'Commissioned by')}</th><th>{T('Fin du terrain', 'Fieldwork end')}</th><th>{T('Échantillon', 'Sample')}</th><th>{T('Marge d’erreur', 'Margin of error')}</th>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {latest.map((p, k) => (
                <tr key={k}>
                  <td>{p.pollster}</td>
                  <td className="poll-sp">{p.sponsor || <a href={COMMISSION_URL} target="_blank" rel="noreferrer" title={T('Voir la notice de la Commission des sondages', 'See the Commission des sondages notice')}>{T('notice', 'notice')}</a>}{p.partySponsor && <em className="poll-party">{T('parti · hors moyenne', 'party · not averaged')}</em>}</td>
                  <td>{dateFr(p.date)}</td><td>{p.sample ? fmt(p.sample, 0) : '–'}</td><td>{p.sample ? `± ${fmt(marginOfError(p.sample), 1)} pt` : '–'}</td>
                  {cols.map(c => { const r = p.results.find(x => x.name === c); return <td key={c}>{r ? pct(r.v, r.v % 1 ? 1 : 0) : '–'}</td> })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <PollMentions />
    </Card>
  )
}
