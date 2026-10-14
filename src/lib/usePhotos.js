import { useEffect, useState } from 'react'

// Portraits des candidats : photo principale de leur article Wikipédia (Wikimedia Commons), chargée à la demande.
// Les licences varient selon la photo (domaine public, CC BY, CC BY-SA) : l'auteur et la licence sont indiqués sur la page Wikimedia liée.
const TITLES = ['Jean-Luc Mélenchon', 'Raphaël Glucksmann', 'Gabriel Attal', 'Édouard Philippe', 'Bruno Retailleau', 'Marine Le Pen']
const URL = `https://fr.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail|name&pithumbsize=160&redirects=1&format=json&formatversion=2&origin=*&titles=${encodeURIComponent(TITLES.join('|'))}`

let cache = null

export function usePhotos() {
  const [photos, setPhotos] = useState(cache || {})
  useEffect(() => {
    if (cache) return
    let on = true
    fetch(URL).then(r => r.json()).then(j => {
      const out = {}
      for (const p of j.query?.pages || []) if (p.thumbnail) out[p.title] = { src: p.thumbnail.source, file: p.pageimage }
      cache = out
      if (on) setPhotos(out)
    }).catch(() => {})
    return () => { on = false }
  }, [])
  return photos
}

export const PHOTO_CREDIT_URL = 'https://commons.wikimedia.org/wiki/Category:Politicians_of_France'
