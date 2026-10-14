// Langue du site : français par défaut, anglais au choix (mémorisé dans le navigateur).
// `T(fr, en)` renvoie le texte de la langue courante. La langue est un état de l'application (voir App.jsx),
// qui re-rend toute la page au changement ; les fonctions de format lisent aussi la langue courante.
let LANG = 'fr'
try { const s = localStorage.getItem('lang'); if (s === 'en' || s === 'fr') LANG = s } catch { /* stockage indisponible */ }

export const getLang = () => LANG
export function setLang(l) {
  LANG = l === 'en' ? 'en' : 'fr'
  try { localStorage.setItem('lang', LANG) } catch { /* ignoré */ }
  if (typeof document !== 'undefined') document.documentElement.lang = LANG
}
export const isEn = () => LANG === 'en'
export const T = (fr, en) => (LANG === 'en' && en != null ? en : fr)
// Un texte de données : { fr, en } ou chaîne simple.
export const L = v => (v && typeof v === 'object' && 'fr' in v ? (LANG === 'en' ? v.en ?? v.fr : v.fr) : v)
