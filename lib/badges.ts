export interface BadgeDef {
  id: string
  emoji: string
  label: string
  seuil: number
  desc: string
}

export const BADGES_CONTRIBUTEUR: BadgeDef[] = [
  { id: 'decouvreur',       emoji: '🌱', label: 'Découvreur',       seuil: 1,    desc: '1re contribution' },
  { id: 'motive',           emoji: '💪', label: 'Motivé',           seuil: 3,    desc: '3 contributions' },
  { id: 'actif',            emoji: '⚡', label: 'Actif',            seuil: 5,    desc: '5 contributions' },
  { id: 'engage',           emoji: '⭐', label: 'Engagé',           seuil: 10,   desc: '10 contributions' },
  { id: 'habitue',          emoji: '🔥', label: 'Habitué',          seuil: 15,   desc: '15 contributions' },
  { id: 'top_contributeur', emoji: '🏅', label: 'Top Contributeur', seuil: 25,   desc: '25 contributions' },
  { id: 'confirme',         emoji: '🎯', label: 'Confirmé',         seuil: 35,   desc: '35 contributions' },
  { id: 'elite',            emoji: '🌟', label: 'Élite',            seuil: 50,   desc: '50 contributions' },
  { id: 'legende',          emoji: '👑', label: 'Légende LOTBO',    seuil: 100,  desc: '100 contributions' },
  { id: 'icone',            emoji: '💫', label: 'Icône',            seuil: 250,  desc: '250 contributions' },
  { id: 'mythique',         emoji: '🌌', label: 'Mythique',         seuil: 500,  desc: '500 contributions' },
  { id: 'titan',            emoji: '🔱', label: 'Titan',            seuil: 1000, desc: '1000 contributions' },
]

export const BADGES_ORGANISATEUR: BadgeDef[] = [
  { id: 'organisateur', emoji: '🎪', label: 'Organisateur', seuil: 1,   desc: '1er événement' },
  { id: 'debutant',     emoji: '🌱', label: 'Débutant',     seuil: 2,   desc: '2 événements' },
  { id: 'regulier',     emoji: '📅', label: 'Régulier',     seuil: 3,   desc: '3 événements' },
  { id: 'actif',        emoji: '⚡', label: 'Actif',        seuil: 6,   desc: '6 événements' },
  { id: 'premium',      emoji: '💎', label: 'Premium',      seuil: 10,  desc: '10 événements' },
  { id: 'confirme',     emoji: '🎯', label: 'Confirmé',     seuil: 15,  desc: '15 événements' },
  { id: 'vedette',      emoji: '🌟', label: 'Vedette',      seuil: 25,  desc: '25 événements' },
  { id: 'champion',     emoji: '🏆', label: 'Champion',     seuil: 50,  desc: '50 événements' },
  { id: 'icone',        emoji: '🎖️', label: 'Icône',        seuil: 75,  desc: '75 événements' },
  { id: 'souverain',    emoji: '👑', label: 'Souverain',    seuil: 120, desc: '120 événements' },
]

export function getBadgeActuel(nb: number, badges: BadgeDef[]): BadgeDef | null {
  const obtenus = badges.filter(b => nb >= b.seuil)
  return obtenus[obtenus.length - 1] || null
}

export function getProchainBadge(nb: number, badges: BadgeDef[]): BadgeDef | null {
  return badges.find(b => nb < b.seuil) || null
}
