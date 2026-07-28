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

type Langue = 'fr' | 'en' | 'es' | 'pt' | 'ht'
const LANGUES_VALIDES: Langue[] = ['fr', 'en', 'es', 'pt', 'ht']

const TYPES_AVEC_PRENOMS = new Set(['badge_debloque', 'palier_anciennete', 'anniversaire'])

type LibelleFn = (n: number, ville: string | null) => string

const LIBELLES: Record<string, Record<Langue, LibelleFn>> = {
  evenement_approuve: {
    fr: (n, ville) => `${n} nouvel${n > 1 ? 's' : ''} événement${n > 1 ? 's' : ''} approuvé${n > 1 ? 's' : ''}${ville ? ` à ${ville}` : ''}`,
    en: (n, ville) => `${n} new event${n > 1 ? 's' : ''} approved${ville ? ` in ${ville}` : ''}`,
    es: (n, ville) => `${n} nuevo${n > 1 ? 's' : ''} evento${n > 1 ? 's' : ''} aprobado${n > 1 ? 's' : ''}${ville ? ` en ${ville}` : ''}`,
    pt: (n, ville) => `${n} novo${n > 1 ? 's' : ''} evento${n > 1 ? 's' : ''} aprovado${n > 1 ? 's' : ''}${ville ? ` em ${ville}` : ''}`,
    ht: (n, ville) => `${n} nouvo evènman apwouve${ville ? ` nan ${ville}` : ''}`,
  },
  nouveau_membre: {
    fr: (n) => `${n} nouveau${n > 1 ? 'x' : ''} membre${n > 1 ? 's' : ''} ${n > 1 ? 'ont' : 'a'} rejoint LOTBO`,
    en: (n) => `${n} new member${n > 1 ? 's' : ''} joined LOTBO`,
    es: (n) => `${n} nuevo${n > 1 ? 's' : ''} miembro${n > 1 ? 's' : ''} se ${n > 1 ? 'unieron' : 'unió'} a LOTBO`,
    pt: (n) => `${n} novo${n > 1 ? 's' : ''} membro${n > 1 ? 's' : ''} ${n > 1 ? 'entraram' : 'entrou'} no LOTBO`,
    ht: (n) => `${n} nouvo manm vin jwenn LOTBO`,
  },
  objectif_enqueteur: {
    fr: (n, ville) => `${n} enquêteur${n > 1 ? 's' : ''} terrain ${n > 1 ? 'ont' : 'a'} atteint son objectif${ville ? ` à ${ville}` : ''}`,
    en: (n, ville) => `${n} field investigator${n > 1 ? 's' : ''} reached their goal${ville ? ` in ${ville}` : ''}`,
    es: (n, ville) => `${n} investigador${n > 1 ? 'es' : ''} de campo ${n > 1 ? 'alcanzaron' : 'alcanzó'} su objetivo${ville ? ` en ${ville}` : ''}`,
    pt: (n, ville) => `${n} investigador${n > 1 ? 'es' : ''} de campo ${n > 1 ? 'atingiram' : 'atingiu'} sua meta${ville ? ` em ${ville}` : ''}`,
    ht: (n, ville) => `${n} anketè teren atenn objektif yo${ville ? ` nan ${ville}` : ''}`,
  },
  badge_debloque: {
    fr: () => 'ont débloqué un badge',
    en: () => 'unlocked a badge',
    es: () => 'desbloquearon una insignia',
    pt: () => 'desbloquearam um badge',
    ht: () => 'debloke yon badj',
  },
  palier_anciennete: {
    fr: () => 'fêtent un palier d\'ancienneté sur LOTBO',
    en: () => 'are celebrating a milestone on LOTBO',
    es: () => 'están celebrando un hito en LOTBO',
    pt: () => 'estão celebrando um marco no LOTBO',
    ht: () => 'ap selebre yon etap sou LOTBO',
  },
  anniversaire: {
    fr: () => 'fêtent leur anniversaire aujourd\'hui',
    en: () => 'are celebrating their birthday today',
    es: () => 'están celebrando su cumpleaños hoy',
    pt: () => 'estão celebrando seu aniversário hoje',
    ht: () => 'ap fete anivèsè yo jodi a',
  },
  ville_top_changee: {
    fr: (n, ville) => `${ville} est maintenant #1 sur LOTBO`,
    en: (n, ville) => `${ville} is now #1 on LOTBO`,
    es: (n, ville) => `${ville} es ahora #1 en LOTBO`,
    pt: (n, ville) => `${ville} agora é #1 no LOTBO`,
    ht: (n, ville) => `${ville} se #1 kounye a sou LOTBO`,
  },
}

const MEMBRES_DEFAUT: Record<Langue, string> = {
  fr: 'Des membres', en: 'Some members', es: 'Algunos miembros',
  pt: 'Alguns membros', ht: 'Kèk manm',
}

const AUTRES_MOT: Record<Langue, (reste: number) => string> = {
  fr: (r) => `et ${r} autre${r > 1 ? 's' : ''}`,
  en: (r) => `and ${r} other${r > 1 ? 's' : ''}`,
  es: (r) => `y ${r} otro${r > 1 ? 's' : ''}`,
  pt: (r) => `e mais ${r} outro${r > 1 ? 's' : ''}`,
  ht: (r) => `ak ${r} lòt ankò`,
}

function formatNoms(prenoms: string[], suffixe: string, langue: Langue): string {
  if (prenoms.length === 0) return `${MEMBRES_DEFAUT[langue]} ${suffixe}`
  if (prenoms.length <= 3) return `${prenoms.join(', ')} ${suffixe}`
  const reste = prenoms.length - 3
  return `${prenoms.slice(0, 3).join(', ')} ${AUTRES_MOT[langue](reste)} ${suffixe}`
}

export async function GET(request: Request) {
  const acces = await verifierUtilisateurConnecte(request)
  if (!acces.ok) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const url = new URL(request.url)
  const langueParam = url.searchParams.get('langue') || 'fr'
  const langue: Langue = LANGUES_VALIDES.includes(langueParam as Langue) ? (langueParam as Langue) : 'fr'

  const admin = makeAdminClient()

  try {
    const { data: entrees } = await admin
      .from('activite_communautaire')
      .select('id, type, user_id, ville, contenu, created_at')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (!entrees || entrees.length === 0) {
      return NextResponse.json({ fil_evenements: [], fil_autres: [] })
    }

    const userIds = [...new Set(entrees.filter(e => e.user_id && TYPES_AVEC_PRENOMS.has(e.type)).map(e => e.user_id))]
    const prenomsMap = new Map<string, string>()
    if (userIds.length > 0) {
      const { data: profils } = await admin.from('profiles').select('id, nom').in('id', userIds)
      for (const p of profils || []) {
        prenomsMap.set(p.id, (p.nom || '').split(' ')[0] || 'Un membre')
      }
    }

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

      const libelleFn = LIBELLES[type]?.[langue]
      let libelle: string
      if (TYPES_AVEC_PRENOMS.has(type)) {
        const prenoms = items.map(i => i.user_id ? prenomsMap.get(i.user_id) : null).filter(Boolean) as string[]
        libelle = libelleFn ? formatNoms(prenoms, libelleFn(n, villeAffichee), langue) : type
      } else {
        libelle = libelleFn ? libelleFn(n, villeAffichee) : type
      }

      const evenementIds = type === 'evenement_approuve'
        ? items.map(i => (i.contenu as any)?.evenement_id).filter(Boolean)
        : []

      const estCelebrationVille = type === 'ville_top_changee'

      return {
        type, ville: villeAffichee, evenement_ids: evenementIds, count: n, libelle,
        highlight: estHighlight,
        derniere_activite: items[0].created_at,
        celebration_ville: estCelebrationVille,
      }
    })

    const trierParRecence = (a: typeof fil[number], b: typeof fil[number]) =>
      new Date(b.derniere_activite).getTime() - new Date(a.derniere_activite).getTime()

    const groupesEvenements = fil.filter(g => g.type === 'evenement_approuve').sort(trierParRecence)
    const groupesAutres     = fil.filter(g => g.type !== 'evenement_approuve').sort(trierParRecence)

    return NextResponse.json({
      fil_evenements: groupesEvenements,
      fil_autres: groupesAutres.slice(0, 20),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
