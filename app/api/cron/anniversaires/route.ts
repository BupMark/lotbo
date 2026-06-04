import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
  const today = new Date()
  const mm = today.getUTCMonth() + 1
  const dd = today.getUTCDate()

  // Récupérer tous les profils ayant une date_naissance
  const { data: profils, error } = await supabase
    .from('profiles')
    .select('id, nom, date_naissance')
    .not('date_naissance', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Filtrer ceux dont c'est l'anniversaire aujourd'hui (même mois + même jour)
  const anniversairesAujourdhui = (profils || []).filter(p => {
    if (!p.date_naissance) return false
    const d = new Date(p.date_naissance)
    return d.getUTCMonth() + 1 === mm && d.getUTCDate() === dd
  })

  if (anniversairesAujourdhui.length === 0) {
    return NextResponse.json({ success: true, envoyes: 0, message: 'Aucun anniversaire aujourd\'hui' })
  }

  // Récupérer les emails depuis auth.users
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  for (const u of authData?.users || []) {
    if (u.email) emailMap[u.id] = u.email
  }

  let envoyes = 0

  for (const profil of anniversairesAujourdhui) {
    const email = emailMap[profil.id]
    if (!email) continue

    const nom = profil.nom || 'Ami LOTBO'
    const anneeNaissance = new Date(profil.date_naissance).getUTCFullYear()
    const age = today.getUTCFullYear() - anneeNaissance

    // Créditer +50 pts via transactions_points
    const { error: txErr } = await supabase.from('transactions_points').insert({
      user_id: profil.id,
      points: 50,
      type: 'anniversaire',
      description: `Joyeux anniversaire ! +50 pts — ${age} ans`,
    })

    if (!txErr) {
      // Recalculer points_total
      const { data: txs } = await supabase
        .from('transactions_points')
        .select('points')
        .eq('user_id', profil.id)
      const nouveauTotal = Math.max(0, (txs || []).reduce((s: number, t: { points: number }) => s + t.points, 0))
      await supabase.from('profiles').update({
        points_total: nouveauTotal,
        updated_at: new Date().toISOString(),
      }).eq('id', profil.id)
    }

    // Envoyer email Brevo
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: { name: 'LOTBO', email: 'hello@lotbo.app' },
        to: [{ email, name: nom }],
        subject: `🎂 Joyeux anniversaire ${nom} !`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#F7F2E8;border-radius:16px">
            <div style="text-align:center;margin-bottom:24px">
              <span style="font-size:48px">🎂</span>
            </div>
            <h2 style="color:#C8431A;text-align:center;margin-bottom:8px">Joyeux anniversaire, ${nom} !</h2>
            <p style="color:#8C5A40;text-align:center;font-size:15px;margin-bottom:24px">
              Toute la communauté LOTBO te souhaite une belle journée 🇭🇹
            </p>
            <div style="background:white;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
              <p style="color:#8C5A40;font-size:13px;margin-bottom:8px">Cadeau d'anniversaire</p>
              <p style="font-size:32px;font-weight:bold;color:#C8431A;margin:0">+50 points</p>
              <p style="color:#8C5A40;font-size:12px;margin-top:4px">crédités sur ton compte</p>
            </div>
            <p style="color:#8C5A40;font-size:13px;text-align:center;margin-bottom:24px">
              Continue à cartographier le monde avec nous. Tu fais partie de quelque chose de grand.
            </p>
            <div style="text-align:center">
              <a href="https://app.lotbo.app/profil" style="display:inline-block;background:#C8431A;color:white;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:bold;font-size:14px">
                Voir mon profil →
              </a>
            </div>
            <p style="color:#C0B8B0;font-size:11px;text-align:center;margin-top:24px">
              LOTBO · Tous les événements, un seul endroit.
            </p>
          </div>
        `,
      }),
    }).catch(() => {})

    envoyes++
  }

  return NextResponse.json({ success: true, envoyes })
}
