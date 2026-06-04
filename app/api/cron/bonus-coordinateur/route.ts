import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const COORDINATRICE_ID = '431c6940-a730-4b42-a511-69dff94ce673' // Gaetchens

function verifierSecret(request: Request): boolean {
  return request.headers.get('x-internal-secret') === process.env.INTERNAL_API_SECRET
}

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  if (!verifierSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = makeAdmin()
  const maintenant = new Date()
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1).toISOString()
  const finMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 0, 23, 59, 59).toISOString()

  // 1. Compter les enquêteurs actifs ce mois (contributeur_terrain avec au moins 1 event)
  const { data: enqueteursActifs } = await supabase
    .from('evenements')
    .select('user_id')
    .gte('created_at', debutMois)
    .lte('created_at', finMois)
    .in('user_id', [
      '431c6940-a730-4b42-a511-69dff94ce673', // Gaetchens
      '1851f306-ba8a-43f9-b53d-869ed6573764', // Aïcha
      'b3412c33-5483-467f-bf82-45be9d9ed1a7', // Syndia
      '5f4f6566-b01a-4d92-84d3-08ce5d83598f', // Osny
    ])

  const idsActifs = [...new Set((enqueteursActifs || []).map(e => e.user_id))]
  const nbActifs = idsActifs.length

  if (nbActifs === 0) {
    return NextResponse.json({ success: true, message: 'Aucun enquêteur actif ce mois', points: 0 })
  }

  // 2. Calculer points de base : 200 pts par enquêteur actif
  let totalPoints = nbActifs * 200

  // 3. Compter événements ajoutés à Jacmel ce mois
  const { count: nbEvenementsJacmel } = await supabase
    .from('evenements')
    .select('id', { count: 'exact', head: true })
    .ilike('ville', '%jacmel%')
    .gte('created_at', debutMois)
    .lte('created_at', finMois)

  // 4. Bonus ville
  const nb = nbEvenementsJacmel || 0
  if (nb >= 100) totalPoints += 2500
  else if (nb >= 50) totalPoints += 1000

  // 5. Créditer Gaetchens via transactions_points
  const description = `Bonus coordinateur — ${nbActifs} enquêteur(s) actif(s) · ${nb} événements Jacmel`

  const { error } = await supabase.from('transactions_points').insert({
    user_id: COORDINATRICE_ID,
    points: totalPoints,
    type: 'bonus_coordinateur',
    description,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 6. Mettre à jour points_total de Gaetchens
  const { data: txs } = await supabase
    .from('transactions_points')
    .select('points')
    .eq('user_id', COORDINATRICE_ID)

  const nouveauTotal = Math.max(0, (txs || []).reduce((s: number, t: { points: number }) => s + t.points, 0))

  await supabase.from('profiles').update({
    points_total: nouveauTotal,
    updated_at: new Date().toISOString(),
  }).eq('id', COORDINATRICE_ID)

  // 7. Email Brevo à Gaetchens
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: { name: 'LOTBO', email: 'hello@lotbo.app' },
      to: [{ email: 'gaetchensp@gmail.com', name: 'Gaetchens' }],
      subject: `🎉 Ton bonus coordinateur LOTBO — ${totalPoints} points`,
      htmlContent: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
          <h2 style="color:#C8431A">Ton bonus coordinateur 🎉</h2>
          <p>Bonjour Gaetchens,</p>
          <p>Voici ton bonus pour le mois écoulé :</p>
          <div style="background:#F7F2E8;border-radius:12px;padding:16px;margin:16px 0">
            <p><strong>${nbActifs} enquêteur(s) actif(s)</strong> → ${nbActifs * 200} points</p>
            <p><strong>${nb} événements ajoutés à Jacmel</strong>${nb >= 100 ? ' → +2 500 points bonus' : nb >= 50 ? ' → +1 000 points bonus' : ''}</p>
            <p style="font-size:20px;color:#C8431A;font-weight:bold">Total : +${totalPoints} points</p>
          </div>
          <p>Continue comme ça — LOTBO grandit grâce à toi ! 🇭🇹</p>
          <a href="https://app.lotbo.app/profil" style="display:inline-block;background:#C8431A;color:white;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold">Voir mon profil →</a>
        </div>
      `,
    }),
  }).catch(() => {})

  return NextResponse.json({
    success: true,
    enqueteursActifs: nbActifs,
    evenementsJacmel: nb,
    pointsAttribues: totalPoints,
    description,
  })
}
