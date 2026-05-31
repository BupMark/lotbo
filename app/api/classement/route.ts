import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculerNiveau } from '../../../lib/points'

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET /api/classement — classement unifié par points_total (source : transactions_points)
export async function GET(request: Request) {
  try {
    const admin = makeAdmin()

    // 1. Recalculer points_total depuis transactions_points pour tous
    const { data: txData } = await admin
      .from('transactions_points')
      .select('user_id, points')

    // Agréger par user_id
    const totauxMap: Record<string, number> = {}
    for (const tx of txData || []) {
      totauxMap[tx.user_id] = (totauxMap[tx.user_id] || 0) + (tx.points || 0)
    }

    // 2. Récupérer tous les profils avec points > 0
    const userIds = Object.keys(totauxMap).filter(id => totauxMap[id] > 0)
    if (userIds.length === 0) return NextResponse.json({ membres: [] })

    const { data: profiles } = await admin
      .from('profiles')
      .select('id, nom, photo_url, niveau')
      .in('id', userIds)

    // 3. Résoudre noms manquants
    const idsNomNull = (profiles || []).filter((p: { id: string; nom: string | null }) => !p.nom).map((p: { id: string }) => p.id)
    const emailMap: Record<string, string> = {}
    if (idsNomNull.length > 0) {
      const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 })
      for (const u of authData?.users ?? []) {
        if (idsNomNull.includes(u.id) && u.email) {
          emailMap[u.id] = u.email.split('@')[0]
        }
      }
    }

    // 4. Construire la liste finale
    const membres = (profiles || [])
      .map((p: { id: string; nom: string | null; photo_url: string | null; niveau: string }) => ({
        id:           p.id,
        nom:          p.nom || emailMap[p.id] || 'Membre LOTBO',
        photo_url:    p.photo_url,
        points_total: totauxMap[p.id] || 0,
        niveau:       calculerNiveau(totauxMap[p.id] || 0),
      }))
      .sort((a: { points_total: number }, b: { points_total: number }) => b.points_total - a.points_total)
      .slice(0, 100)

    return NextResponse.json({ membres })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
