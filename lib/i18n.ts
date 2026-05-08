import fr from '../app/messages/fr.json'
import en from '../app/messages/en.json'
import es from '../app/messages/es.json'
import pt from '../app/messages/pt.json'
import ht from '../app/messages/ht.json'

export const langues = {
  fr: { nom: 'Français', drapeau: '🇫🇷' },
  en: { nom: 'English', drapeau: '🇬🇧' },
  es: { nom: 'Español', drapeau: '🇪🇸' },
  pt: { nom: 'Português', drapeau: '🇧🇷' },
  ht: { nom: 'Kreyòl', drapeau: '🇭🇹' }
}

export type Langue = keyof typeof langues

const traductions: Record<Langue, any> = { fr, en, es, pt, ht }

export function getTraductions(langue: Langue) {
  return traductions[langue] || traductions.fr
}