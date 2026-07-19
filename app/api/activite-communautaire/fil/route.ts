import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierUtilisateurConnecte } from '../../../../lib/adminAuth'

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const TYPES_AVEC_PRENOMS = new Set(['badge_debloque', 'palier_anciennete', 'anniversaire'])

const LIBELLES: Record<string, (n: number, ville: string | null) => string> = {
  evenement_approuve:  (n, ville) => `${n} nouvel${n > 1 ? 's' : ''} événement${n > 1 ? 's' : ''} approuvé${n > 1 ? 's' : ''}${ville ? ` à ${ville}` : ''}`,
  nouveau_membre:      (n) => `${n} nouveau${n > 1 ? 'x' : ''} membre${n > 1 ? 's' : ''} ${n > 1 ? 'ont' : 'a'} rejoint LOTBO`,
  objectif_enqueteur:  (n, ville) => `${n} enquêteur${n > 1 ? 's' : ''} terrain ${n > 1 ? 'ont' : 'a'} atteint son objectif${ville ? ` à ${ville}` : ''}`,
  badge_debloque:      () => 'ont débloqué un badge',
  palier_anciennete:   () => 'fêtent un palier d\'ancienneté sur LOTBO',
  anniversaire:        () => 'fêtent leur anniversaire aujourd\'hui',
}

function formatNoms(prenoms: string[], suffixe: string): string {
  if (prenoms.length === 0) return `Des membres ${suffixe}`
  if (prenoms.length <= 3) return `${prenoms.join(', ')} ${suffixe}`
  const reste = prenoms.length - 3
  return `${prenoms.slice(0, 3).join(', ')} et ${reste} autre${reste > 1 ? 's' : ''} ${suffixe}`
}

export async function GET(request: Request) {
  const acces = await verifierUtilisateurConnecte(request)
  if (!acces.ok) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const admin = makeAdminClient()

  try {
    const { data: entrees } = await admin
      .from('activite_communautaire')
      .select('id, type, user_id, ville, contenu, created_at')
      .order('created_at', { ascending: false })
      .limit(500)

    if (!entrees || entrees.length === 0) {
      return NextResponse.json({ fil: [] })
    }

    // Résout les prénoms nécessaires en une seule requête groupée
    const userIds = [...new Set(entrees.filter(e => e.user_id && TYPES_AVEC_PRENOMS.has(e.type)).map(e => e.user_id))]
    const prenomsMap = new Map<string, string>()
    if (userIds.length > 0) {
      const { data: profils } = await admin.from('profiles').select('id, nom').in('id', userIds)
      for (const p of profils || []) {
        prenomsMap.set(p.id, (p.nom || '').split(' ')[0] || 'Un membre')
      }
    }

    // Regroupe par type + ville + jour
    const groupes = new Map<string, typeof entrees>()
    for (const e of entrees) {
      const jour = e.created_at.slice(0, 10)
      const cle = `${e.type}|${e.ville || ''}|${jour}`
      if (!groupes.has(cle)) groupes.set(cle, [])
      groupes.get(cle)!.push(e)
    }

    const fil = Array.from(groupes.entries()).map(([cle, items]) => {
      const [type, ville] = cle.split('|')
      const n = items.length
      const villeAffichee = ville || null
      const estHighlight = items.some(i =>
        (i.contenu as any)?.certificat === true ||
        ['legende', 'elite', 'champion'].includes((i.contenu as any)?.badge)
      )

      let libelle: string
      if (TYPES_AVEC_PRENOMS.has(type)) {
        const prenoms = items.map(i => i.user_id ? prenomsMap.get(i.user_id) : null).filter(Boolean) as string[]
        libelle = formatNoms(prenoms, LIBELLES[type](n, villeAffichee))
      } else {
        libelle = LIBELLES[type]?.(n, villeAffichee) || type
      }

      return {
        type, ville: villeAffichee, count: n, libelle,
        highlight: estHighlight,
        derniere_activite: items[0].created_at,
      }
    }).sort((a, b) => new Date(b.derniere_activite).getTime() - new Date(a.derniere_activite).getTime())

    return NextResponse.json({ fil: fil.slice(0, 30) })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
