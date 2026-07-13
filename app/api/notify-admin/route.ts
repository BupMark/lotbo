import { NextResponse } from 'next/server'
import { verifierUtilisateurConnecte } from '../../../lib/adminAuth'

export async function POST(request: Request) {
  const acces = await verifierUtilisateurConnecte(request)
  if (!acces.ok) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { titre, lieu, date, categorie } = await request.json()

    const contenuEmail = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1410;padding:32px;border-radius:12px">
        <div style="margin-bottom:24px">
          <span style="font-family:Georgia,serif;font-style:italic;font-size:24px;font-weight:bold">
            <span style="color:#F7F2E8">lot</span><span style="color:#C8431A">bo</span>
          </span>
        </div>
        <h1 style="color:#F7F2E8;font-size:18px;margin-bottom:8px">
          🎉 Nouvel événement en attente de validation
        </h1>
        <p style="color:#8C5A40;font-size:14px;margin-bottom:24px">
          Un événement vient d'être soumis sur Lotbo et attend ton approbation.
        </p>
        <div style="background:rgba(255,255,255,0.06);border:1px solid #2a2a2a;border-radius:10px;padding:20px;margin-bottom:24px">
          <p style="color:#F7F2E8;font-size:16px;font-weight:bold;margin-bottom:12px">${titre}</p>
          <p style="color:#8C5A40;font-size:13px;margin-bottom:6px">📍 ${lieu}</p>
          <p style="color:#8C5A40;font-size:13px;margin-bottom:6px">📅 ${date}</p>
          <p style="color:#8C5A40;font-size:13px">🏷️ ${categorie}</p>
        </div>
        <a href="https://app.lotbo.app/admin"
           style="background:#C8431A;color:#F7F2E8;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">
          Aller sur le panel admin →
        </a>
        <p style="color:#2a2a2a;font-size:11px;margin-top:24px">
          Lotbo · app.lotbo.app
        </p>
      </div>
    `

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!
      },
      body: JSON.stringify({
        sender: { name: 'Lotbo', email: 'hello@lotbo.app' },
        to: [{ email: 'sambayo23@gmail.com', name: 'Handgod' }],
        subject: `🎉 Nouvel événement : ${titre}`,
        htmlContent: contenuEmail
      })
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
