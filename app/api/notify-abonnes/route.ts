import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { titre, lieu, date, categorie, id } = await request.json()

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: abonnes } = await supabase
      .from('abonnements')
      .select('email, ville, categories')

      if (!abonnes || abonnes.length === 0) {
        return NextResponse.json({ success: true, envoyes: 0 })
      }
  
      const normaliser = (s: string) => s.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
  
      const villeEvent = normaliser(lieu)
  
      const abonnesFiltres = abonnes.filter((ab: any) => {
        const villeAb = normaliser(ab.ville)
        const villeMatch = villeEvent.includes(villeAb) || villeAb.includes(villeEvent)
        const catMatch = ab.categories.length === 0 || ab.categories.includes(categorie)
        return villeMatch && catMatch
      })
    if (abonnesFiltres.length === 0) {
      return NextResponse.json({ success: true, envoyes: 0 })
    }

    let envoyes = 0
    for (const ab of abonnesFiltres) {
      const contenu = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1410;padding:32px;border-radius:12px">
          <div style="margin-bottom:24px">
            <span style="font-family:Georgia,serif;font-style:italic;font-size:24px;font-weight:bold">
              <span style="color:#F7F2E8">lot</span><span style="color:#C8431A">bo</span>
            </span>
          </div>
          <h1 style="color:#F7F2E8;font-size:18px;margin-bottom:8px">
            🎉 Nouvel événement près de ${ab.ville}
          </h1>
          <p style="color:#8C5A40;font-size:14px;margin-bottom:24px">
            Un événement qui pourrait t'intéresser vient d'être ajouté sur Lotbo.
          </p>
          <div style="background:rgba(255,255,255,0.06);border:1px solid #2a2a2a;border-radius:10px;padding:20px;margin-bottom:24px">
            <p style="color:#F7F2E8;font-size:16px;font-weight:bold;margin-bottom:12px">${titre}</p>
            <p style="color:#8C5A40;font-size:13px;margin-bottom:6px">📍 ${lieu}</p>
            <p style="color:#8C5A40;font-size:13px;margin-bottom:6px">📅 ${date}</p>
            <p style="color:#8C5A40;font-size:13px">🏷️ ${categorie}</p>
          </div>
          <a href="https://app.lotbo.app/evenement/${id}"
             style="background:#C8431A;color:#F7F2E8;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;margin-bottom:24px">
            Voir l'événement →
          </a>
          <p style="color:#2a2a2a;font-size:11px;margin-top:24px">
            Tu reçois cet email car tu t'es inscrit aux notifications Lotbo pour ${ab.ville}.
          </p>
        </div>
      `

      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY!
        },
        body: JSON.stringify({
          sender: { name: 'Lotbo', email: 'hello@lotbo.app' },
          to: [{ email: ab.email }],
          subject: `🎉 ${titre} · ${lieu}`,
          htmlContent: contenu
        })
      })
      envoyes++
    }

    return NextResponse.json({ success: true, envoyes })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}