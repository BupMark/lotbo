import { NextResponse } from 'next/server'
import { makeAdminClient, verifierAdmin } from '../../../../lib/adminAuth'
import { geocode } from '../../../../lib/geocodage'
import { normaliserVille } from '../../../../lib/normalisation'

// GET — liste les entrées en attente de révision manuelle (statut = 'a_reviser')
export async function GET(request: Request) {
  const auth = await verifierAdmin(request)
  if (!auth.ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const admin = makeAdminClient()
    const { data, error } = await admin
      .from('revision_geolocalisation')
      .select('id, source, source_id, titre, ville_brute, adresse_brute, pays_brut, code_pays, lien_source, date_expiration, donnees_evenement, created_at')
      .eq('statut', 'a_reviser')
      .order('created_at', { ascending: true })
      .limit(2000)
    if (error) throw error
    return NextResponse.json({ entrees: data || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

interface CorpsRequete {
  id: string
  action: 'publier' | 'skip'
  // Pour action = 'publier' :
  mode?: 'adresse' | 'coordonnees'
  adresse?: string           // mode 'adresse' — texte libre à géocoder
  latitude?: number          // mode 'coordonnees' — saisie directe
  longitude?: number
  ville?: string              // ville finale à assigner (peut différer de ville_brute)
  ajouter_a_lieux_connus?: boolean
}

// POST — traite une entrée : publie l'événement (via adresse géocodée ou
// coordonnées directes) ou la marque comme "skip" (non publiée, retirée
// de la file active)
export async function POST(request: Request) {
  const auth = await verifierAdmin(request)
  if (!auth.ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = (await request.json()) as CorpsRequete
    const admin = makeAdminClient()

    const { data: entree, error: erreurFetch } = await admin
      .from('revision_geolocalisation')
      .select('*')
      .eq('id', body.id)
      .single()
    if (erreurFetch || !entree) {
      return NextResponse.json({ error: 'Entrée introuvable' }, { status: 404 })
    }
    if (entree.statut !== 'a_reviser') {
      return NextResponse.json({ error: 'Entrée déjà traitée' }, { status: 409 })
    }

    if (body.action === 'skip') {
      await admin
        .from('revision_geolocalisation')
        .update({ statut: 'skip', traite_par: auth.userId, traite_le: new Date().toISOString() })
        .eq('id', body.id)
      return NextResponse.json({ success: true })
    }

    // action === 'publier'
    let latitude: number | null = null
    let longitude: number | null = null

    if (body.mode === 'coordonnees') {
      if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
        return NextResponse.json({ error: 'Latitude/longitude requises' }, { status: 400 })
      }
      latitude = body.latitude
      longitude = body.longitude
    } else if (body.mode === 'adresse') {
      if (!body.adresse) {
        return NextResponse.json({ error: 'Adresse requise' }, { status: 400 })
      }
      const villePourGeocode = body.ville || entree.ville_brute || ''
      const coords = await geocode(
        admin,
        body.adresse,
        villePourGeocode,
        entree.code_pays || '',
        entree.pays_brut || ''
      )
      if (!coords) {
        return NextResponse.json({ error: 'Géocodage échoué — essayez le mode coordonnées directes' }, { status: 422 })
      }
      latitude = coords.latitude
      longitude = coords.longitude
    } else {
      return NextResponse.json({ error: 'Mode de publication requis (adresse ou coordonnees)' }, { status: 400 })
    }

    const ville = normaliserVille(body.ville || entree.ville_brute || '')
    const donnees = entree.donnees_evenement as Record<string, unknown>

    const { error: erreurInsert } = await admin.from('evenements').insert([{
      titre: donnees.titre,
      lieu: (donnees.venue_name as string) || ville,
      ville,
      pays: entree.pays_brut,
      date: donnees.date_debut,
      date_debut: donnees.date_debut,
      date_fin: donnees.date_fin,
      heure_debut: donnees.heure_debut || null,
      description: donnees.description || null,
      categorie: donnees.categorie || 'Célébration communautaire',
      latitude,
      longitude,
      image_url: donnees.image_url || null,
      organisateur: donnees.organisateur || null,
      prix: donnees.prix || 'payant',
      acces: donnees.acces || 'public',
      statut: 'approuve',
      visibilite: 'public',
      source: entree.source,
      source_id: entree.source_id,
      lien: donnees.lien || entree.lien_source,
    }])
    if (erreurInsert) throw erreurInsert

    // Checkbox "ajouter à lieux_connus" — jamais automatique, à la
    // discrétion de l'admin (décision produit du 18 août)
    if (body.ajouter_a_lieux_connus && body.adresse) {
      await admin.from('lieux_connus').insert([{
        nom_normalise: body.adresse.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(),
        nom_affichage: body.adresse,
        ville,
        pays: entree.pays_brut,
        latitude,
        longitude,
        source: 'revision_manuelle',
        nb_utilisations: 1,
      }])
    }

    await admin
      .from('revision_geolocalisation')
      .update({ statut: 'traite', traite_par: auth.userId, traite_le: new Date().toISOString(), ajoute_a_lieux_connus: !!body.ajouter_a_lieux_connus })
      .eq('id', body.id)

    return NextResponse.json({ success: true, latitude, longitude })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
