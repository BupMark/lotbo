import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierAdmin } from '../../../../lib/adminAuth'

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET — liste les propositions en attente
export async function GET(request: Request) {
  const acces = await verifierAdmin(request)
  if (!acces.ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = makeAdminClient()
  try {
    const { data, error } = await admin
      .from('propositions_modifications')
      .select('id, evenement_id, proposant_id, champ_modifie, ancienne_valeur, nouvelle_valeur, statut, created_at, evenements(titre)')
      .eq('statut', 'en_attente')
      .order('created_at', { ascending: true })
      .limit(2000)
    if (error) throw error

    const propsAvecNoms = await Promise.all((data || []).map(async (p) => {
      if (!p.proposant_id) return { ...p, proposant_nom: null }
      const { data: prof } = await admin.from('profiles').select('nom').eq('id', p.proposant_id).maybeSingle()
      return { ...p, proposant_nom: prof?.nom ?? null }
    }))

    return NextResponse.json({ propositions: propsAvecNoms })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Mapping explicite champ_modifie → écriture réelle (certains sont composites)
function construireUpdate(champ: string, nouvelleValeur: string): Record<string, unknown> | null {
  switch (champ) {
    case 'titre': case 'lieu': case 'date': case 'description': case 'lien': case 'categorie':
      return { [champ]: nouvelleValeur }
    case 'image':
      return { image_url: nouvelleValeur }
    case 'emplacement_pin': {
      const parts = nouvelleValeur.split(',').map(s => parseFloat(s.trim()))
      if (parts.length !== 2 || parts.some(isNaN)) return null
      return { latitude: parts[0], longitude: parts[1] }
    }
    case 'heure': {
      const parts = nouvelleValeur.split('→').map(s => s.trim())
      if (parts.length !== 2) return null
      return { heure_debut: parts[0], heure_fin: parts[1] }
    }
    case 'prix_acces': {
      const parts = nouvelleValeur.split('·').map(s => s.trim())
      if (parts.length !== 2) return null
      return { prix: parts[0], acces: parts[1] }
    }
    default:
      return null
  }
}

// POST — applique ou rejette une proposition
export async function POST(request: Request) {
  const acces = await verifierAdmin(request)
  if (!acces.ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = makeAdminClient()
  try {
    const { propositionId, action } = await request.json() as { propositionId: string; action: 'appliquer' | 'rejeter' }
    if (!propositionId || !['appliquer', 'rejeter'].includes(action)) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const { data: prop, error: fetchErr } = await admin
      .from('propositions_modifications')
      .select('id, evenement_id, proposant_id, champ_modifie, nouvelle_valeur, statut')
      .eq('id', propositionId)
      .single()
    if (fetchErr || !prop) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
    if (prop.statut !== 'en_attente') return NextResponse.json({ error: 'Déjà traitée' }, { status: 409 })

    if (action === 'rejeter') {
      const { error: statutErr } = await admin.from('propositions_modifications').update({ statut: 'rejetee' }).eq('id', propositionId)
      if (statutErr) throw statutErr
      return NextResponse.json({ success: true, action: 'rejetee' })
    }

    const updatePayload = construireUpdate(prop.champ_modifie, prop.nouvelle_valeur)
    if (!updatePayload) {
      return NextResponse.json({ error: `Champ non reconnu ou valeur invalide : ${prop.champ_modifie}` }, { status: 400 })
    }

    const { error: updateErr } = await admin.from('evenements').update(updatePayload).eq('id', prop.evenement_id)
    if (updateErr) throw updateErr

    const { error: statutErr } = await admin.from('propositions_modifications').update({ statut: 'acceptee' }).eq('id', propositionId)
    if (statutErr) throw statutErr

    if (prop.proposant_id) {
      const { data: ev } = await admin.from('evenements').select('titre').eq('id', prop.evenement_id).single()
      await admin.from('notifications').insert([{
        user_id: prop.proposant_id,
        type: 'correction_appliquee',
        titre: 'Ta correction a été appliquée ✅',
        message: `Ta proposition sur "${ev?.titre ?? 'un événement'}" a été validée et appliquée.`,
        lien: `/evenement/${prop.evenement_id}`,
        lu: false,
      }])
    }

    return NextResponse.json({ success: true, action: 'applique' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
