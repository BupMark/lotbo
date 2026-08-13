export type ActionCelebrable = 'inscription' | 'premier_favori' | 'premier_commentaire' | 'premiere_organisation_suivie'

export function celebrerPremiereFois(action: ActionCelebrable) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('lotbo:premiere_fois', { detail: { action } }))
}

export function ouvrirChatLoyita(messagePreRempli?: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('lotbo:ouvrir_chat', { detail: { message: messagePreRempli } }))
}

export type ActionAmbiante = 'favori_repete' | 'commentaire_repete' | 'partage' | 'ville_suivie_repetee' | 'organisation_suivie_repetee'

const FREQUENCE_TOAST = 0.3 // ~1 action sur 3-4

export function toastAmbiantLoyita(action: ActionAmbiante) {
  if (typeof window === 'undefined') return
  if (Math.random() > FREQUENCE_TOAST) return
  window.dispatchEvent(new CustomEvent('lotbo:toast_ambiant', { detail: { action } }))
}
