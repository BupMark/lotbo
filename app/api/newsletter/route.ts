import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierAdmin } from '../../../lib/adminAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  const secretValide = secret === process.env.INTERNAL_API_SECRET
  if (!secretValide) {
    const acces = await verifierAdmin(request)
    if (!acces.ok) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
  }

  try {
    const uneSemanneAgo = new Date()
    uneSemanneAgo.setDate(uneSemanneAgo.getDate() - 7)
    const dateStr = uneSemanneAgo.toISOString()

    const { data: evenements } = await supabase
      .from('evenements')
      .select('*')
      .eq('statut', 'approuve')
      .gte('created_at', dateStr)
      .order('created_at', { ascending: false })

    if (!evenements || evenements.length === 0) {
      return NextResponse.json({ message: 'Aucun nouvel evenement cette semaine' })
    }

    const contenuEmail = `
      <h1 style="color:#C8431A;font-family:Georgia,serif;font-style:italic">
        Kisa k'ap pase sou Lotbo cette semaine ?
      </h1>
      <p style="color:#1A1410;font-family:Arial,sans-serif">
        Voici les nouveaux evenements pres de toi :
      </p>
      ${evenements.map(ev => `
        <div style="border:1px solid #E8E0D0;padding:16px;margin:16px 0;border-radius:8px;background:#ffffff">
          <h2 style="margin:0 0 8px;color:#1A1410;font-family:Georgia,serif">${ev.titre}</h2>
          <p style="color:#8C5A40;margin:4px 0;font-family:Arial,sans-serif">📍 ${ev.lieu}</p>
          <p style="color:#8C5A40;margin:4px 0;font-family:Arial,sans-serif">📅 ${ev.date}</p>
          <p style="color:#8C5A40;margin:4px 0;font-family:Arial,sans-serif">${ev.categorie} · ${ev.prix}</p>
          <a href="https://app.lotbo.app/evenement/${ev.id}"
             style="background:#C8431A;color:#F7F2E8;padding:8px 16px;border-radius:4px;text-decoration:none;display:inline-block;margin-top:8px;font-family:Arial,sans-serif;font-weight:500">
            Voir l'evenement →
          </a>
        </div>
      `).join('')}
      <p style="color:#8C5A40;font-size:12px;margin-top:32px;font-family:Arial,sans-serif">
        Tu recois cet email car tu t'es inscrit sur lotbo.app
      </p>
    `

    const response = await fetch('https://api.brevo.com/v3/emailCampaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!
      },
      body: JSON.stringify({
        name: 'Resume hebdomadaire Lotbo - ' + new Date().toLocaleDateString(),
        subject: 'Kisa k ap pase sur Lotbo cette semaine ?',
        sender: { name: 'Lotbo', email: 'hello@lotbo.app' },
        type: 'classic',
        htmlContent: contenuEmail,
        recipients: { listIds: [3] }
      })
    })

    const result = await response.json()

    if (result.id) {
      await fetch('https://api.brevo.com/v3/emailCampaigns/' + result.id + '/sendNow', {
        method: 'POST',
        headers: { 'api-key': process.env.BREVO_API_KEY! }
      })
      return NextResponse.json({ success: true, message: evenements.length + ' evenements envoyes' })
    }

    return NextResponse.json({ error: result })

  } catch (error) {
    return NextResponse.json({ error: String(error) })
  }
}