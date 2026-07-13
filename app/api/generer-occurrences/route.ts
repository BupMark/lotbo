import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierUtilisateurConnecte } from '../../../lib/adminAuth'

function verifierSecret(request: Request): boolean {
  const secret = request.headers.get('x-internal-secret')
  return secret === process.env.INTERNAL_API_SECRET
}

interface RecurrenceRegle {
  type: 'quotidien' | 'hebdomadaire' | 'mensuel' | 'annuel'
  jours: string[]
  fin_type: 'date' | 'occurrences' | 'sans_fin'
  fin_date: string | null
  fin_occurrences: number | null
}

const JOURS_MAP: Record<string, number> = {
  'Lundi': 1, 'Mardi': 2, 'Mercredi': 3, 'Jeudi': 4,
  'Vendredi': 5, 'Samedi': 6, 'Dimanche': 0,
}

function genererDates(dateDebut: string, regle: RecurrenceRegle): string[] {
  const dates: string[] = []
  const debut    = new Date(dateDebut)
  const aujourdhui = new Date()
  const limite4sem = new Date(aujourdhui.getTime() + 28 * 24 * 60 * 60 * 1000) // 4 semaines

  // Date limite selon la règle
  let dateLimite = limite4sem
  if (regle.fin_type === 'date' && regle.fin_date) {
    const finDate = new Date(regle.fin_date)
    dateLimite = finDate < limite4sem ? finDate : limite4sem
  }

  const maxOccurrences = regle.fin_type === 'occurrences' && regle.fin_occurrences
    ? regle.fin_occurrences
    : 28 // max 28 occurrences générées à la fois

  let current = new Date(debut)
  current.setDate(current.getDate() + 1) // Commencer après la date de base

  let count = 0

  while (current <= dateLimite && count < maxOccurrences) {
    let ajouter = false

    switch (regle.type) {
      case 'quotidien':
        ajouter = true
        break

      case 'hebdomadaire':
        if (regle.jours.length === 0) {
          // Même jour de la semaine que la date de base
          ajouter = current.getDay() === debut.getDay()
        } else {
          ajouter = regle.jours.some(j => JOURS_MAP[j] === current.getDay())
        }
        break

      case 'mensuel':
        ajouter = current.getDate() === debut.getDate()
        break

      case 'annuel':
        ajouter = current.getDate() === debut.getDate() && current.getMonth() === debut.getMonth()
        break
    }

    if (ajouter) {
      dates.push(current.toISOString().split('T')[0])
      count++
    }

    current.setDate(current.getDate() + 1)
  }

  return dates
}

export async function POST(request: Request) {
  const acces = await verifierUtilisateurConnecte(request)
  if (!acces.ok) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { parent_id } = await request.json()
    if (!parent_id) return NextResponse.json({ error: 'parent_id manquant' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Récupérer l'événement parent
    const { data: parent, error: parentError } = await supabase
      .from('evenements')
      .select('*')
      .eq('id', parent_id)
      .single()

    if (parentError || !parent) {
      return NextResponse.json({ error: 'Événement parent introuvable' }, { status: 404 })
    }

    // Contrôle de propriété — empêche de générer des occurrences sur l'événement d'un autre utilisateur
    if (parent.user_id !== acces.userId) {
      return NextResponse.json({ error: 'Cet événement ne vous appartient pas' }, { status: 403 })
    }

    if (!parent.recurrence_regle || !parent.est_recurrent) {
      return NextResponse.json({ error: 'Événement non récurrent' }, { status: 400 })
    }

    const regle = parent.recurrence_regle as RecurrenceRegle
    const dates = genererDates(parent.date, regle)

    if (dates.length === 0) {
      return NextResponse.json({ success: true, generes: 0, message: 'Aucune date à générer' })
    }

    let generes  = 0
    let skipped  = 0

    for (const date of dates) {
      // Vérifier si cette occurrence existe déjà
      const { data: existing } = await supabase
        .from('evenements')
        .select('id')
        .eq('parent_id', parent_id)
        .eq('date', date)
        .single()

      if (existing) { skipped++; continue }

      const { error } = await supabase.from('evenements').insert([{
        titre:               parent.titre,
        lieu:                parent.lieu,
        nom_lieu:            parent.nom_lieu,
        adresse:             parent.adresse,
        ville:               parent.ville,
        pays:                parent.pays,
        date,
        date_debut:          date,
        date_fin:            null,
        heure_debut:         parent.heure_debut,
        heure_fin:           parent.heure_fin,
        fuseau_organisateur: parent.fuseau_organisateur,
        categorie:           parent.categorie,
        event_type_id:       parent.event_type_id,
        description:         parent.description,
        lien:                parent.lien,
        longitude:           parent.longitude,
        latitude:            parent.latitude,
        acces:               parent.acces,
        prix:                parent.prix,
        image_url:           parent.image_url,
        statut:              parent.statut,
        visibilite:          parent.visibilite,
        user_id:             parent.user_id,
        organisateur:        parent.organisateur,
        source:              parent.source || 'recurrence',
        // Liens récurrence
        parent_id,
        est_recurrent:       false, // Les occurrences ne sont pas récurrentes elles-mêmes
        recurrence_regle:    null,
      }])

      if (!error) generes++
    }

    return NextResponse.json({
      success: true,
      generes,
      skipped,
      dates_generees: dates,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET — Pour le CRON : régénère les occurrences de tous les événements récurrents actifs
export async function GET(request: Request) {
  if (!verifierSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: parents } = await supabase
    .from('evenements')
    .select('id')
    .eq('est_recurrent', true)
    .eq('statut', 'approuve')
    .is('parent_id', null)

  if (!parents || parents.length === 0) {
    return NextResponse.json({ success: true, traites: 0 })
  }

  let totalGeneres = 0

  for (const parent of parents) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://app.lotbo.app'}/api/generer-occurrences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '',
      },
      body: JSON.stringify({ parent_id: parent.id }),
    })
    const data = await res.json()
    totalGeneres += data.generes || 0
  }

  return NextResponse.json({ success: true, traites: parents.length, totalGeneres })
}