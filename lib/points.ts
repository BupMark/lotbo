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

/**
 * Recalcule points_total + niveau depuis transactions_points
 * et met à jour profiles si la valeur a changé.
 * Retourne le total réel.
 */
export async function syncUserPoints(userId: string): Promise<number> {
  try {
    const { supabase } = await import('./supabase')

    const { data: txs } = await supabase
      .from('transactions_points')
      .select('points')
      .eq('user_id', userId)

    const total  = Math.max(0, (txs || []).reduce((s: number, t: any) => s + (t.points || 0), 0))
    const niveau = calculerNiveau(total)

    await supabase
      .from('profiles')
      .update({ points_total: total, niveau, updated_at: new Date().toISOString() })
      .eq('id', userId)

    return total
  } catch {
    return 0
  }
}