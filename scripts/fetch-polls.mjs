// Télécharge la liste Wikipédia des sondages 2027 et écrit un instantané de secours (src/data/polls-snapshot.json).
// Le site affiche les sondages en direct ; cet instantané sert si Wikipédia est inaccessible.
// Lancé par `npm run polls` et avant chaque build. En cas d'échec réseau, l'instantané existant est conservé.
import fs from 'node:fs'
import { DOMParser } from 'linkedom'
import { fetchLivePolls } from '../src/lib/polls.js'

const out = 'src/data/polls-snapshot.json'
try {
  const data = await fetchLivePolls(html => new DOMParser().parseFromString(`<!doctype html><html><body>${html}</body></html>`, 'text/html'))
  fs.writeFileSync(out, JSON.stringify(data))
  console.log(`sondages : ${data.first.length} (1er tour), ${data.second.length} (2nd tour), révision ${data.revid} du ${data.timestamp}`)
} catch (e) {
  if (!fs.existsSync(out)) throw e
  console.warn(`sondages : échec du téléchargement (${e.message}), instantané existant conservé`)
}
