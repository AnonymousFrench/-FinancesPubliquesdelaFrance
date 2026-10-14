import React, { useMemo } from 'react'
import { usePolls, today, daysBefore } from '../lib/usePolls.js'
import { average, trend, WIKI_PAGE, pollBlackout, marginOfError, COMMISSION_URL } from '../lib/polls.js'
import { SOURCES } from '../data/election2027.js'
import { Card } from './ui.jsx'
import { LineChart } from '../lib/charts.jsx'
import { fmt, pct, signed, dateFr, monthFr } from '../lib/format.js'

const FIRST_ROUND = '2027-04-18'
const WINDOW = 45
export const PARTY_COLOR = {
  LFI: '#c0392b', PP: '#d6457a', PS: '#d6457a', RE: '#e0a100', EPR: '#e0a100', HOR: '#0e9aa7', LR: '#2d6cdf', RN: '#1b2a6b',
  REC: '#6b4423', LE: '#2a9d4a', EELV: '#2a9d4a', PCF: '#a4161a', LO: '#7a1010', DLF: '#5566aa', LFH: '#8e7cc3', 'NPA-A': '#a33', RES: '#8a7a5a', 'D!': '#e07a5f',
}
const colorOf = party => PARTY_COLOR[party] || '#9aa4b2'
const SRC_WIKI = { label: 'Wikipédia, « Liste de sondages sur l’élection présidentielle française de 2027 »', url: WIKI_PAGE }
const yearFrac = iso => { const d = new Date(iso + 'T00:00:00Z'); const y = d.getUTCFullYear(); return y + (d - Date.UTC(y, 0, 1)) / (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1)) }
const fromFrac = x => { const y = Math.floor(x); const t = Date.UTC(y, 0, 1) + (x - y) * (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1)); return new Date(t).toISOString().slice(0, 10) }

export function PollStatus({ state }) {
  const { data, status } = state
  const rev = data.timestamp ? `${dateFr(data.timestamp)} à ${data.timestamp.slice(11, 16)} UTC` : '?'
  return (
    <span className={'live ' + status} title={status === 'error' ? state.error : ''}>
      <i />{status === 'live' ? `En direct · Wikipédia, version du ${rev}` : status === 'error' ? `Wikipédia inaccessible · instantané du ${rev}` : 'Chargement des derniers sondages…'}
    </span>
  )
}

// Période de réserve : aucun sondage la veille et le jour du scrutin (loi du 19 juillet 1977).
export function BlackoutNotice({ b }) {
  return (
    <Card title="Sondages suspendus" className="blackout">
      <p className="sub">Conformément à la loi du 19 juillet 1977, aucun sondage ne peut être publié, diffusé ni commenté la veille et le jour du {b.label}. Les sondages reviennent le {b.end}.</p>
    </Card>
  )
}

// Mentions exigées pour la publication d'un sondage (loi du 19 juillet 1977, art. 2).
export function PollMentions() {
  return (
    <p className="mentions">
      Sondages réalisés par les instituts cités, selon la méthode des quotas. Marge d’erreur indiquée par référence à la méthode aléatoire, à 95 %, pour un score de 50 %.
      Commanditaires, questions posées et notices : <a href={COMMISSION_URL} target="_blank" rel="noreferrer">Commission des sondages</a>.
      Les moyennes sont calculées par ce site à partir de ces sondages et ne constituent pas un sondage.
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
  const t = today()
  const days = Math.max(0, Math.round((new Date(FIRST_ROUND) - new Date(t)) / 864e5))

  const { now, before, names } = useMemo(() => {
    const now = average(first, t, WINDOW), before = average(first, daysBefore(t, 30), WINDOW)
    return { now, before, names: now.rows.filter(r => r.n >= 2).slice(0, 8).map(r => r.name) }
  }, [first, t])
  const prevOf = name => before.rows.find(r => r.name === name)
  const max = Math.ceil((now.rows[0]?.v || 40) / 5) * 5

  const tr = useMemo(() => trend(first, names, { from: daysBefore(t, 300), to: t, stepDays: 7, windowDays: WINDOW }), [first, names, t])
  const partyOf = name => now.rows.find(r => r.name === name)?.party
  const ticks = useMemo(() => {
    const out = [], d = new Date(daysBefore(t, 300) + 'T00:00:00Z')
    for (let k = 0; k < 12; k++) { const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + k + 1, 1)); if (m > new Date(t)) break; if (k % 2 === 0) out.push(yearFrac(m.toISOString().slice(0, 10))) }
    return out
  }, [t])

  const latest = first.slice(0, 10)
  const cols = names
  const duels = useMemo(() => {
    const g = new Map()
    for (const p of second) if (!g.has(p.hypothesis)) g.set(p.hypothesis, [])
    for (const p of second) g.get(p.hypothesis).push(p)
    return [...g.entries()].map(([h, ps]) => {
      const recent = ps.filter(p => p.date >= daysBefore(t, WINDOW))
      const use = recent.length ? recent : ps.slice(0, 1)
      const [a, b] = ps[0].results
      const avg = k => use.reduce((s, p) => s + p.results[k].v, 0) / use.length
      return { h, a: { ...a, v: avg(0) }, b: { ...b, v: avg(1) }, n: use.length, last: ps[0].date }
    }).filter(d => d.last >= daysBefore(t, 120)).sort((x, y) => y.last.localeCompare(x.last) || y.n - x.n)
  }, [second, t])

  return (
    <>
      <Card title="Sondages de la présidentielle 2027"
        sub={`Premier tour : moyenne du dernier sondage de chaque institut sur ${WINDOW} jours.`}
        right={<div className="countdown"><b>J−{days}</b><span>1er tour le 18 avril 2027</span></div>}
        src={[SRC_WIKI, SOURCES.votons]}>
        <div className="poll-meta"><PollStatus state={state} /><span className="mut">{now.pollsters.join(' · ')}</span></div>
        <div className="grid2 flat poll-top">
          <div className="bars ranking">
            {now.rows.filter(r => r.v >= 0.5).map(r => {
              const p = prevOf(r.name), d = p ? r.v - p.v : null
              return (
                <div key={r.name} className="bar-row">
                  <span className="bar-n"><i className="dot-c" style={{ background: colorOf(r.party) }} />{r.name} <span className="mut">({r.party})</span></span>
                  <span className="bar-t"><span className="bar-f" style={{ width: `${r.v / max * 100}%`, background: colorOf(r.party) }} /></span>
                  <span className="bar-v"><b>{pct(r.v)}</b><span className={'bar-p ' + (d == null ? '' : d > 0.25 ? 'dn' : d < -0.25 ? 'up' : '')}>{d == null ? 'nouveau' : Math.abs(d) < 0.05 ? 'stable sur 30 j' : `${signed(d)} pt sur 30 j`}</span></span>
                </div>
              )
            })}
          </div>
          <div className="second">
            <h4>Second tour le plus probable</h4>
            {now.rows.length >= 2 && (
              <div className="duel-head">
                {now.rows.slice(0, 2).map(r => <div key={r.name} style={{ '--pc': colorOf(r.party) }}><b>{r.name}</b><span>{pct(r.v)} au 1er tour</span></div>)}
              </div>
            )}
            <h4>Seconds tours testés</h4>
            {duels.slice(0, 7).map(d => (
              <div key={d.h} className="duel">
                <div className="duel-l"><span>{d.a.name}</span><span>{d.b.name}</span></div>
                <div className="duel-bar">
                  <span style={{ width: `${d.a.v}%`, background: colorOf(d.a.party) }}>{fmt(d.a.v, 0)}</span>
                  <span style={{ width: `${d.b.v}%`, background: colorOf(d.b.party) }}>{fmt(d.b.v, 0)}</span>
                </div>
                <div className="duel-s mut">{d.n} sondage{d.n > 1 ? 's' : ''} · dernier le {dateFr(d.last)}</div>
              </div>
            ))}
          </div>
        </div>
        <PollMentions />
      </Card>

      <Card title="Dynamique de la campagne" sub={`Moyenne glissante sur ${WINDOW} jours.`} src={SRC_WIKI}>
        <LineChart height={300}
          series={names.map(n => ({ name: n, color: colorOf(partyOf(n)), width: n === names[0] ? 2.8 : 2.2, points: tr[n].map(([ts, v]) => [yearFrac(new Date(ts).toISOString().slice(0, 10)), v]) }))}
          xTicks={ticks} xFmt={x => { const d = fromFrac(x + 0.001); return monthFr(+d.slice(0, 4), +d.slice(5, 7)) }}
          tipX={x => `Semaine du ${dateFr(fromFrac(x))}`}
          yMin={0}
          axes={{ left: { fmt: v => fmt(v, 0) + ' %', tipFmt: v => pct(v) } }} />
      </Card>

      <Card title="Derniers sondages" sub="Premier tour, hypothèse principale de chaque enquête." src={SRC_WIKI}>
        <div className="t-wrap">
          <table className="t">
            <thead><tr><th>Institut</th><th>Fin du terrain</th><th>Échantillon</th><th>Marge d’erreur</th>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {latest.map((p, k) => (
                <tr key={k}>
                  <td>{p.pollster}</td><td>{dateFr(p.date)}</td><td>{p.sample ? fmt(p.sample, 0) : '–'}</td><td>{p.sample ? `± ${fmt(marginOfError(p.sample), 1)} pt` : '–'}</td>
                  {cols.map(c => { const r = p.results.find(x => x.name === c); return <td key={c}>{r ? pct(r.v, r.v % 1 ? 1 : 0) : '–'}</td> })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PollMentions />
      </Card>

    </>
  )
}
