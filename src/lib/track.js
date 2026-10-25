// Mesure d'audience Umami (sans cookie, exemptée de consentement). Ne fait rien si le script n'est pas chargé.
export function track(name, data) {
  try { window.umami?.track(name, data) } catch { /* mesure indisponible */ }
}
