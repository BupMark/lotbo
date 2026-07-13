import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_UUID = 'ff21f2e0-135d-4996-9713-4a0e20c38fe1'

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function verifierAppelant(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return null
  const admin = makeAdminClient()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return null
  return user.id
}

export async function POST(request: Request) {
  const callerId = await verifierAppelant(request)
  if (!callerId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { kind, record_id } = await request.json() as { kind: 'proposition' | 'reclamation'; record_id: string }
    if (!kind || !record_id) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const admin = makeAdminClient()

    if (kind === 'proposition') {
      const { data: prop } = await admin
        .from('propositions_modifications')
        .select('evenement_id, proposant_id, champ_modifie')
        .eq('id', record_id)
        .single()
      if (!prop || prop.proposant_id !== callerId) {
        return NextResponse.json({ error: 'Introuvable ou non autorisé' }, { status: 403 })
      }
      const { data: ev } = await admin.from('evenements').select('titre').eq('id', prop.evenement_id).single()
      const { data: prof } = await admin.from('profiles').select('nom').eq('id', callerId).single()

      await admin.from('notifications').insert([{
        user_id: ADMIN_UUID,
        type: 'proposition_modification',
        titre: `Correction proposée — ${ev?.titre ?? 'Événement'}`,
        message: `${prof?.nom ?? 'Un utilisateur'} propose de corriger "${prop.champ_modifie}"`,
        lien: '/admin',
        lu: false,
      }])
    } else if (kind === 'reclamation') {
      const { data: rec } = await admin
        .from('reclamations_evenements')
        .select('evenement_id, reclamant_id')
        .eq('id', record_id)
        .single()
      if (!rec || rec.reclamant_id !== callerId) {
        return NextResponse.json({ error: 'Introuvable ou non autorisé' }, { status: 403 })
      }
      const { data: ev } = await admin.from('evenements').select('titre').eq('id', rec.evenement_id).single()
      const { data: prof } = await admin.from('profiles').select('nom').eq('id', callerId).single()

      await admin.from('notifications').insert([{
        user_id: ADMIN_UUID,
        type: 'reclamation',
        titre: `Réclamation — ${ev?.titre ?? 'Événement'}`,
        message: `${prof?.nom ?? 'Un utilisateur'} réclame la propriété de "${ev?.titre ?? 'cet événement'}"`,
        lien: '/admin',
        lu: false,
      }])
    } else {
      return NextResponse.json({ error: 'kind invalide' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
