import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

type Etape = 'j1' | 'j7'
type Langue = 'fr' | 'en' | 'es' | 'pt' | 'ht'

interface OrgRow {
  id: string
  nom: string
  slug: string
  logo_url: string | null
  description: string | null
  email_contact: string | null
  email_contact_verifie: boolean
  site_web: string | null
  created_at: string
}

interface ProfileRow {
  id: string
  nom: string | null
  charte_organisateur: boolean | null
  langue_preference: string | null
}

const TEXTES: Record<Langue, { sujet: string; intro: string; champs: Record<string, string>; cta: string; footer: string }> = {
  fr: {
    sujet: '📋 Complète le profil de {nom} sur LOTBO',
    intro: 'Ton organisation {nom} a été créée récemment. Voici ce qu\'il te reste à compléter pour une vitrine optimale :',
    champs: {
      logo: 'Ajouter un logo',
      description: 'Ajouter une description',
      email_verifie: 'Valider ton email de contact',
      site_web: 'Ajouter un site web',
      categorie: 'Choisir au moins une catégorie d\'activité',
      charte_organisateur: 'Accepter la charte des organisateurs (tous les admins)',
    },
    cta: 'Compléter mon profil',
    footer: 'Lotbo · app.lotbo.app',
  },
  en: {
    sujet: '📋 Complete {nom}\'s profile on LOTBO',
    intro: 'Your organization {nom} was recently created. Here\'s what\'s left to complete for an optimal showcase:',
    champs: {
      logo: 'Add a logo',
      description: 'Add a description',
      email_verifie: 'Verify your contact email',
      site_web: 'Add a website',
      categorie: 'Choose at least one activity category',
      charte_organisateur: 'Accept the organizer charter (all admins)',
    },
    cta: 'Complete my profile',
    footer: 'Lotbo · app.lotbo.app',
  },
  es: {
    sujet: '📋 Completa el perfil de {nom} en LOTBO',
    intro: 'Tu organización {nom} fue creada recientemente. Esto es lo que falta por completar para una vitrina óptima:',
    champs: {
      logo: 'Añadir un logo',
      description: 'Añadir una descripción',
      email_verifie: 'Verificar tu email de contacto',
      site_web: 'Añadir un sitio web',
      categorie: 'Elegir al menos una categoría de actividad',
      charte_organisateur: 'Aceptar la carta de organizadores (todos los administradores)',
    },
    cta: 'Completar mi perfil',
    footer: 'Lotbo · app.lotbo.app',
  },
  pt: {
    sujet: '📋 Complete o perfil de {nom} no LOTBO',
    intro: 'Sua organização {nom} foi criada recentemente. Aqui está o que falta completar para uma vitrine ideal:',
    champs: {
      logo: 'Adicionar um logo',
      description: 'Adicionar uma descrição',
      email_verifie: 'Verificar seu email de contato',
      site_web: 'Adicionar um site',
      categorie: 'Escolher pelo menos uma categoria de atividade',
      charte_organisateur: 'Aceitar a carta dos organizadores (todos os admins)',
    },
    cta: 'Completar meu perfil',
    footer: 'Lotbo · app.lotbo.app',
  },
  ht: {
    sujet: '📋 Complète le profil de {nom} sur LOTBO',
    intro: 'Ton organisation {nom} a été créée récemment. Voici ce qu\'il te reste à compléter pour une vitrine optimale :',
    champs: {
      logo: 'Ajouter un logo',
      description: 'Ajouter une description',
      email_verifie: 'Valider ton email de contact',
      site_web: 'Ajouter un site web',
      categorie: 'Choisir au moins une catégorie d\'activité',
      charte_organisateur: 'Accepter la charte des organisateurs (tous les admins)',
    },
    cta: 'Compléter mon profil',
    footer: 'Lotbo · app.lotbo.app',
  },
}

function champsManquants(org: OrgRow, chartesOk: boolean, hasCategorie: boolean): string[] {
  const manquants: string[] = []
  if (!org.logo_url) manquants.push('logo')
  if (!org.description || !org.description.trim()) manquants.push('description')
  if (!org.email_contact_verifie) manquants.push('email_verifie')
  if (!org.site_web || !org.site_web.trim()) manquants.push('site_web')
  if (!hasCategorie) manquants.push('categorie')
  if (!chartesOk) manquants.push('charte_organisateur')
  return manquants
}

function construireHtml(langue: Langue, nomOrg: string, slug: string, manquants: string[]): { sujet: string; html: string } {
  const t = TEXTES[langue] ?? TEXTES.fr
  const sujet = t.sujet.replace('{nom}', nomOrg)
  const intro = t.intro.replace('{nom}', nomOrg)
  const liste = manquants.map(m => `<li style="color:#F7F2E8;font-size:14px;margin-bottom:6px">${t.champs[m] ?? m}</li>`).join('')

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1410;padding:32px;border-radius:12px">
      <div style="margin-bottom:24px">
        <span style="font-family:Georgia,serif;font-style:italic;font-size:24px;font-weight:bold">
          <span style="color:#F7F2E8">lot</span><span style="color:#C8431A">bo</span>
        </span>
      </div>
      <h1 style="color:#F7F2E8;font-size:18px;margin-bottom:8px">${sujet}</h1>
      <p style="color:#8C5A40;font-size:14px;margin-bottom:16px">${intro}</p>
      <ul style="padding-left:20px;margin-bottom:24px">${liste}</ul>
      <a href="https://app.lotbo.app/organisation/${slug}/modifier"
         style="background:#C8431A;color:#F7F2E8;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">
        ${t.cta} →
      </a>
      <p style="color:#2a2a2a;font-size:11px;margin-top:24px">${t.footer}</p>
    </div>
  `
  return { sujet, html }
}

async function traiterEtape(
  admin: ReturnType<typeof makeAdminClient>,
  etape: Etape,
  emailMap: Map<string, string>,
  dryRun: boolean
): Promise<{ orgsTraitees: number; emailsEnvoyes: number; detail: Array<{ org: string; manquants: string[] }> }> {
  const now = new Date()
  const jours = etape === 'j1' ? 1 : 7
  const colonneEnvoi = etape === 'j1' ? 'verif_profil_j1_envoye_le' : 'verif_profil_j7_envoye_le'

  const debut = new Date(now.getTime() - (jours + 1) * 86400000).toISOString()
  const fin = new Date(now.getTime() - jours * 86400000).toISOString()

  const { data: orgs, error } = await admin
    .from('organisations')
    .select('id, nom, slug, logo_url, description, email_contact, email_contact_verifie, site_web, created_at')
    .gte('created_at', debut)
    .lt('created_at', fin)
    .is(colonneEnvoi, null)
    .limit(2000)

  if (error) throw error
  if (!orgs || orgs.length === 0) return { orgsTraitees: 0, emailsEnvoyes: 0, detail: [] }

  let emailsEnvoyes = 0
  const detail: Array<{ org: string; manquants: string[] }> = []

  for (const org of orgs as OrgRow[]) {
    const { data: membres } = await admin
      .from('organisation_membres')
      .select('user_id, role')
      .eq('org_id', org.id)
      .in('role', ['owner', 'admin'])

    // Marquer comme traité dans tous les cas — jamais de re-scan du même org à cette étape
    if (!dryRun) {
      await admin.from('organisations').update({ [colonneEnvoi]: now.toISOString() }).eq('id', org.id)
    }

    if (!membres || membres.length === 0) continue

    const adminIds = membres.map(m => m.user_id)
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, nom, charte_organisateur, langue_preference')
      .in('id', adminIds)

    const { count: nbCategories } = await admin
      .from('organisation_categories_liees')
      .select('organisation_id', { count: 'exact', head: true })
      .eq('organisation_id', org.id)

    const chartesOk = (profiles || []).every(p => p.charte_organisateur === true)
    const manquants = champsManquants(org, chartesOk, (nbCategories ?? 0) > 0)

    if (manquants.length === 0) continue // profil déjà complet

    detail.push({ org: org.nom, manquants })
    if (dryRun) continue

    for (const p of (profiles || []) as ProfileRow[]) {
      const email = emailMap.get(p.id)
      if (!email) continue

      const langue = (p.langue_preference as Langue) ?? 'fr'
      const { sujet, html } = construireHtml(langue, org.nom, org.slug, manquants)

      try {
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
          body: JSON.stringify({
            sender: { name: 'Lotbo', email: 'hello@lotbo.app' },
            to: [{ email, name: p.nom || email.split('@')[0] }],
            subject: sujet,
            htmlContent: html,
          }),
        })
        emailsEnvoyes++
      } catch (e) {
        console.error('[VerifProfilOrga] Email échoué pour', email, e)
      }
    }
  }

  return { orgsTraitees: orgs.length, emailsEnvoyes, detail }
}

export async function GET(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const url = new URL(request.url)
  const dryRun = url.searchParams.get('dry_run') === 'true'

  const admin = makeAdminClient()

  try {
    const { data: usersResponse } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const emailMap = new Map((usersResponse?.users ?? []).map(u => [u.id, u.email!]))

    const j1 = await traiterEtape(admin, 'j1', emailMap, dryRun)
    const j7 = await traiterEtape(admin, 'j7', emailMap, dryRun)

    return NextResponse.json({ success: true, dryRun, j1, j7 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
