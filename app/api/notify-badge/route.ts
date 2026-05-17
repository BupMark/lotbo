import { NextResponse } from 'next/server'

function verifierSecret(request: Request): boolean {
  const secret = request.headers.get('x-internal-secret')
  return secret === process.env.INTERNAL_API_SECRET
}

export async function POST(request: Request) {
  if (!verifierSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { email, nom, badge_emoji, badge_label, badge_desc, nb_contributions, role } = await request.json()

    if (!email || !badge_label) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const isContrib   = role === 'contributeur'
    const nomAffiche  = nom || email.split('@')[0]
    const ordinal     = nb_contributions === 1 ? '1ère' : `${nb_contributions}e`
    const actionLabel = isContrib ? `${ordinal} contribution` : `${ordinal} événement soumis`

    const contenuEmail = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1410;padding:32px;border-radius:12px">

        <!-- Logo -->
        <div style="margin-bottom:32px">
          <span style="font-family:Georgia,serif;font-style:italic;font-size:28px;font-weight:bold">
            <span style="color:#F7F2E8">lot</span><span style="color:#C8431A">bo</span>
          </span>
        </div>

        <!-- Badge central -->
        <div style="text-align:center;margin-bottom:32px">
          <div style="font-size:72px;margin-bottom:16px;line-height:1">${badge_emoji || '🏅'}</div>
          <p style="color:#D4A820;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px">
            🏅 Badge débloqué !
          </p>
          <h1 style="color:#F7F2E8;font-size:26px;font-weight:bold;font-family:Georgia,serif;font-style:italic;margin-bottom:8px">
            ${badge_label}
          </h1>
          <p style="color:#8C5A40;font-size:14px;line-height:1.6">
            ${badge_desc || ''}
          </p>
        </div>

        <!-- Message personnalisé -->
        <div style="background:rgba(255,255,255,0.04);border:1px solid #2a2a2a;border-radius:12px;padding:24px;margin-bottom:24px">
          <p style="color:#F7F2E8;font-size:15px;line-height:1.7;margin:0">
            Félicitations ${nomAffiche} ! 🎉<br/><br/>
            ${isContrib
              ? `Tu viens de débloquer le badge <strong style="color:#D4A820">${badge_label}</strong> grâce à ta ${actionLabel} sur LOTBO. Chaque événement que tu ajoutes connecte des gens autour de moments qui comptent. Continue comme ça — la communauté te voit ! 🌍`
              : `Tu viens de débloquer le badge <strong style="color:#C8431A">${badge_label}</strong> avec ton ${actionLabel} sur LOTBO. Merci de faire vibrer ta communauté !`
            }
          </p>
        </div>

        <!-- Pill badge -->
        <div style="text-align:center;margin-bottom:32px">
          <span style="background:rgba(212,168,32,0.15);border:1px solid rgba(212,168,32,0.4);color:#D4A820;padding:8px 20px;border-radius:999px;font-size:13px;font-weight:bold;display:inline-block">
            ${badge_emoji} ${badge_label} · ${badge_desc}
          </span>
        </div>

        <!-- CTA -->
        <div style="text-align:center;margin-bottom:32px">
          <a href="https://app.lotbo.app/profil?onglet=badges"
             style="background:#C8431A;color:#F7F2E8;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">
            Voir ma collection de badges →
          </a>
        </div>

        <!-- Stats rapides -->
        <div style="background:rgba(200,67,26,0.08);border:1px solid rgba(200,67,26,0.2);border-radius:10px;padding:16px 20px;margin-bottom:32px;text-align:center">
          <p style="color:#C8431A;font-size:13px;font-weight:bold;margin-bottom:4px">
            ${isContrib ? `⭐ ${nb_contributions} contribution${nb_contributions > 1 ? 's' : ''} repérée${nb_contributions > 1 ? 's' : ''}` : `🎪 ${nb_contributions} événement${nb_contributions > 1 ? 's' : ''} soumis`}
          </p>
          <p style="color:#8C5A40;font-size:12px;margin:0">
            Né en Haïti · Présent dans le monde entier 🇭🇹🌍
          </p>
        </div>

        <!-- Footer -->
        <div style="border-top:1px solid #2a2a2a;padding-top:20px;text-align:center">
          <p style="color:#8C5A40;font-size:12px;margin-bottom:8px">
            <a href="https://app.lotbo.app" style="color:#C8431A;text-decoration:none">app.lotbo.app</a>
            · Tous les événements, un seul endroit.
          </p>
          <p style="color:#2a2a2a;font-size:11px;margin:0">
            Un produit de Bup Mark Ltd · Manchester, UK
          </p>
        </div>

      </div>
    `

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender:      { name: 'Lotbo', email: 'hello@lotbo.app' },
        to:          [{ email, name: nomAffiche }],
        subject:     `${badge_emoji || '🏅'} Tu viens de débloquer le badge ${badge_label} sur Lotbo !`,
        htmlContent: contenuEmail,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return NextResponse.json({ error: err }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}