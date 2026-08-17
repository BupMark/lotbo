export interface ContextePayload {
  type: string
  nom: string
  date_debut: string | null
  date_fin: string | null
  heure_debut: string | null
  heure_fin: string | null
  mois_debut: number | null
  mois_fin: number | null
  priorite: number
  illustrations: string[] | null
  messages: Record<string, string>
}

export function selectionnerContexte(
  contextes: ContextePayload[],
  langue: string
): { message: string; illustration: string | null; nom: string; type: string } | null {
  const maintenant = new Date()
  const auj = `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}-${String(maintenant.getDate()).padStart(2, '0')}`
  const moisActuel = maintenant.getMonth() + 1
  const heureActuelle = `${String(maintenant.getHours()).padStart(2, '0')}:${String(maintenant.getMinutes()).padStart(2, '0')}:00`

  const evenement = contextes
    .filter(c => c.type === 'evenement' && c.date_debut && c.date_fin)
    .find(c => auj >= c.date_debut! && auj <= c.date_fin!)

  const saison = contextes
    .filter(c => c.type === 'saison' && c.mois_debut != null && c.mois_fin != null)
    .find(c => {
      const debut = c.mois_debut!, fin = c.mois_fin!
      return debut <= fin ? (moisActuel >= debut && moisActuel <= fin) : (moisActuel >= debut || moisActuel <= fin)
    })

  const moment = contextes
    .filter(c => c.type === 'moment_journee' && c.heure_debut && c.heure_fin)
    .find(c => {
      const debut = c.heure_debut!, fin = c.heure_fin!
      return debut <= fin ? (heureActuelle >= debut && heureActuelle <= fin) : (heureActuelle >= debut || heureActuelle <= fin)
    })

  const defaut = contextes.find(c => c.type === 'defaut')
  const choisi = evenement || saison || moment || defaut
  if (!choisi) return null

  const message = choisi.messages?.[langue] || choisi.messages?.fr
  if (!message) return null

  return { message, illustration: choisi.illustrations?.[0] || null, nom: choisi.nom, type: choisi.type }
}
