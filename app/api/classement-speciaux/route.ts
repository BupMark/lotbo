import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET — retourne les profils avec rôles spéciaux pour le classement
// Utilise le service role pour contourner les RLS sur la colonne 'role'
// Endpoint public — données non sensibles (nom, photo, points)
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nom, photo_url, points_total, points_utilisateur, points_organisateur, niveau')
      .in('role', ['admin', 'ambassadeur', 'contributeur_terrain'])
      .limit(200)

    if (error) throw error

    return NextResponse.json({ profiles: data || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
