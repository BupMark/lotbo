export const NIVEAUX: Record<string, { emoji: string; label: string; couleur: string }> = {
  'decouvreur':       { emoji: '🌱', label: 'Découvreur',       couleur: '#8C5A40' },
  'actif':            { emoji: '🔥', label: 'Actif',            couleur: '#D4A820' },
  'contributeur':     { emoji: '⭐', label: 'Engagé',           couleur: '#D4A820' },
  'top_contributeur': { emoji: '🏅', label: 'Top Contributeur', couleur: '#C8431A' },
  'elite':            { emoji: '🥇', label: 'Élite',            couleur: '#C8431A' },
  'legende':          { emoji: '👑', label: 'Légende LOTBO',    couleur: '#C8431A' },
}

export function getInitiales(nom: string | null): string {
  if (!nom) return 'LB'
  return nom.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function medallePosition(pos: number): string {
  if (pos === 1) return '🥇'
  if (pos === 2) return '🥈'
  if (pos === 3) return '🥉'
  return String(pos)
}
