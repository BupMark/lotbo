interface AttributerPointsParams {
  user_id: string
  action: string
  evenement_id?: string
  type_role?: 'utilisateur' | 'organisateur'
}

export function calculerNiveau(points: number): string {
  if (points >= 500) return 'legende'
  if (points >= 251) return 'elite'
  if (points >= 101) return 'top_contributeur'
  if (points >= 51)  return 'contributeur'
  if (points >= 21)  return 'actif'
  return 'decouvreur'
}

export async function attributerPoints(params: AttributerPointsParams): Promise<void> {
  try {
    const { supabase } = await import('./supabase')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await fetch('/api/points', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(params),
    })
  } catch {
    // Points non critiques
  }
}
