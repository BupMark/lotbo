import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function pageConfirmation(titre: string, message: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titre}</title></head><body style="font-family:Arial,sans-serif;background:#F7F2E8;padding:40px 20px;text-align:center"><div style="max-width:480px;margin:0 auto;background:white;border-radius:12px;padding:32px 24px"><h1 style="color:#C8431A;font-size:20px">${titre}</h1><p style="color:#1A1410;font-size:14px;line-height:1.5">${message}</p><a href="https://lotbo.app/enqueteurs" style="display:inline-block;margin-top:20px;color:#C8431A;font-size:13px">← Retour à lotbo.app</a></div></body></html>`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return new NextResponse(pageConfirmation('Lien invalide', 'Ce lien est invalide ou incomplet.'), { status: 400, headers: { 'Content-Type': 'text/html' } })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await admin
    .from('enqueteurs')
    .update({ fiche_masquee: true, masque_le: new Date().toISOString() })
    .eq('id', id)
    .is('anonymise_le', null)
    .select('id')
    .maybeSingle()

  if (error || !data) {
    return new NextResponse(pageConfirmation('Fiche introuvable', 'Cette fiche enquêteur est introuvable ou a déjà été anonymisée.'), { status: 404, headers: { 'Content-Type': 'text/html' } })
  }

  return new NextResponse(pageConfirmation('Fiche masquée', 'Ta fiche a été masquée de la page publique. Tu peux la réactiver à tout moment en nous contactant à privacy@lotbo.app.'), { status: 200, headers: { 'Content-Type': 'text/html' } })
}
