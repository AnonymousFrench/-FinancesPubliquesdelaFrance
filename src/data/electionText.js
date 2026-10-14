// Accès aux textes des programmes dans la langue courante (français : election2027.js ; anglais : election2027.en.js).
import { isEn } from '../i18n.js'
import { EN } from './election2027.en.js'
import { baseline, governmentPlan, RULE, reviewsOf } from './election2027.js'

const P = q => EN.parties[q.id]
export const pName = q => (isEn() ? P(q).name : q.name)
export const pPosition = q => (isEn() ? P(q).position : q.position)
export const pRole = q => (isEn() ? P(q).role : q.profile.role)
export const pDocument = q => (isEn() ? P(q).document : q.document)
export const pHeadline = q => (isEn() ? P(q).headline : q.headline)
export const pGrowthNote = q => (isEn() ? P(q).growthNote : q.growthNote)
export const pMeasuresNote = q => (isEn() ? P(q).measuresNote : q.measuresNote)
const M = (q, m, i) => (isEn() ? P(q).measures[m.id]?.[i] ?? ['name', 'detail', 'flag'][i] : null)
export const mName = (q, m) => (isEn() ? M(q, m, 0) : m.name)
export const mDetail = (q, m) => (isEn() ? M(q, m, 1) : m.detail)
export const mFlag = (q, m) => (isEn() ? M(q, m, 2) : m.flag)

export const ruleLabel = k => (isEn() ? EN.rule[k].label : RULE[k].label)
export const ruleNote = k => (isEn() ? EN.rule[k].note : RULE[k].note)
export const kindLabel = (k, fr) => (isEn() ? EN.kind[k] : fr[k])
export const baselineNotes = () => (isEn() ? EN.baseline : baseline.notes)
export const govLabel = () => (isEn() ? EN.government.label : governmentPlan.label)
export const extLabel = l => (isEn() ? EN.external[l] || l : l)

// Libellé d'une analyse (« Institut de l'Entreprise », « iFRAP », « Barème commun »…).
export const reviewLabel = (q, r) => {
  if (r.id === 'standard') return isEn() ? EN.standard : r.label
  return isEn() ? P(q).reviews[r.id] || r.label : r.label
}
export const reviewBy = (q, r) => {
  if (r.id === 'standard') return isEn() ? EN.standard.toLowerCase() : r.by
  if (isEn()) return P(q).reviewBy?.[r.id] || reviewLabel(q, r)
  return r.by || r.label
}
// Note d'explication d'une analyse indépendante (dans la langue courante).
export const reviewNoteText = (q, r) => {
  if (!isEn()) return q.reviewNote ? q.reviewNote(r) : r.note || ''
  const e = P(q)
  if (!e.reviewNote) return r.note || ''
  if (r.net2031 != null) { const v = r.net2031; return e.reviewNote(`${v >= 0 ? '+' : '−'}€${Math.abs(v)}`) }
  return e.reviewNote(e.reviewNotes[r.id])
}
export { reviewsOf }
