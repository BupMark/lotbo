export type ActionCelebrable = 'inscription' | 'premier_favori' | 'premier_commentaire' | 'premiere_organisation_suivie'

export function celebrerPremiereFois(action: ActionCelebrable) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('lotbo:premiere_fois', { detail: { action } }))
}
