// ── Normalisation des noms de villes et pays ──────────────────────────────────
// Clés stockées sans diacritiques / lowercase pour correspondre à n'importe
// quelle variante saisie ou renvoyée par Google Places / scrapers.

const VILLE_MAP: Record<string, string> = {
  'petion-ville':   'Pétionville',
  'petion ville':   'Pétionville',
  'petionville':    'Pétionville',
  'cap-haitien':    'Cap-Haïtien',
  'cap haitien':    'Cap-Haïtien',
  'okap':           'Cap-Haïtien',
  'les cayes':      'Les Cayes',
  'cayes':          'Les Cayes',
  'port-au-prince': 'Port-au-Prince',
  'pap':            'Port-au-Prince',
  'trou-du-nord':   'Trou-du-Nord',
  'trou du nord':   'Trou-du-Nord',
  'port-de-paix':   'Port-de-Paix',
  'port de paix':   'Port-de-Paix',
  'saint-marc':     'Saint-Marc',
  'saint marc':     'Saint-Marc',
}

function strip(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function capitaliserMots(s: string): string {
  return s.trim().toLowerCase().replace(/(^|[\s-])(\w)/g, (_, sep, c) => sep + c.toUpperCase())
}

export function normaliserVille(ville: string): string {
  return VILLE_MAP[strip(ville)] ?? capitaliserMots(ville)
}

export function normaliserPays(p: string): string {
  const s = strip(p)
  if (s === 'haiti' || s === 'ht') return 'Haiti'
  if (s === 'republique dominicaine' || s === 'dominican republic' || s === 'rd' || s === 'dom. rep.' || s === 'dom rep') return 'République Dominicaine'
  if (s === 'bahamas' || s === 'the bahamas') return 'Bahamas'
  return p.trim()
}
