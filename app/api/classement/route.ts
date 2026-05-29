import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculerNiveau } from '../../../lib/points'

interface ProfileRow {
  id: string
  nom: string | null
  photo_url: string | null
  points_total: number
  points_utilisateur: number
  points_organisateur: number
  niveau: string
}

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET /api/classement?filtre=global|contributeur|organisateur
// Fusionne top 100 + rôles spéciaux, résout les noms manquants depuis auth.users
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filtre = searchParams.get('filtre') ?? 'global'

  const colonne = filtre === 'contributeur'
    ? 'points_utilisateur'
    : filtre === 'organisateur'
      ? 'points_organisateur'
      : 'points_total'

  try {
    const admin = makeAdmin()

    // 1. Top 100 par points
    const { data: topPoints } = await admin
      .from('profiles')
      .select('id, nom, photo_url, points_total, points_utilisateur, points_organisateur, niveau')
      .gt(colonne, 0)
      .order(colonne, { ascending: false })
      .limit(100)

    // 2. Rôles spéciaux avec points > 0
    const { data: rolesSpeciaux } = await admin
      .from('profiles')
      .select('id, nom, photo_url, points_total, points_utilisateur, points_organisateur, niveau')
      .in('role', ['admin', 'ambassadeur', 'contributeur_terrain'])
      .gt('points_total', 0)
      .limit(200)

    // 3. Fusion sans doublon
    const seenIds = new Set((topPoints || []).map((m: ProfileRow) => m.id))
    const merged: ProfileRow[] = [
      ...(topPoints || []),
      ...(rolesSpeciaux || []).filter((m: ProfileRow) => !seenIds.has(m.id)),
    ]

    // 4. Résoudre les noms manquants depuis auth.users (email prefix)
    const idsNomNull = merged.filter(m => !m.nom).map(m => m.id)
    if (idsNomNull.length > 0) {
      const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 })
      const emailMap: Record<string, string> = {}
      for (const u of authData?.users ?? []) {
        if (idsNomNull.includes(u.id) && u.email) {
          emailMap[u.id] = u.email.split('@')[0]
        }
      }
      for (const m of merged) {
        if (!m.nom && emailMap[m.id]) {
          m.nom = emailMap[m.id]
        }
      }
    }

    // 5. Tri final par colonne décroissante
    merged.sort((a, b) => {
      const va = (a[colonne as keyof ProfileRow] as number) || 0
      const vb = (b[colonne as keyof ProfileRow] as number) || 0
      return vb - va
    })

    // 6. Recalcul niveau depuis points (fiable même si DB désynchronisée)
    const membres = merged.map(m => ({
      ...m,
      niveau: calculerNiveau(m.points_total),
    }))

    return NextResponse.json({ membres })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
