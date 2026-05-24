import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const API_SECRET   = process.env.INTERNAL_API_SECRET    || ''
const BASE_URL     = process.env.LOTBO_BASE_URL          || 'https://app.lotbo.app'
const ADMIN_EMAIL  = process.env.LOTBO_ADMIN_EMAIL       || 'agencebupmark@gmail.com'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const CHERSIE_ID   = 'cd9657ce-f41b-472e-95ee-75f8bea39227'
const CHERSIE_EMAIL = 'cherliesaintilus1@gmail.com'

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function magicLinkSession(email, context) {
  const res = await fetch(`${BASE_URL}/api/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-internal-secret': API_SECRET },
    body: JSON.stringify({ email }),
  })
  const { link } = await res.json()
  if (!link) throw new Error(`Magic link non généré pour ${email}`)

  const page = await context.newPage()
  await page.goto(link, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1000)
  const hashPart = (() => { const u = page.url(); const i = u.indexOf('#'); return i >= 0 ? u.slice(i) : '' })()
  if (!hashPart.includes('access_token=')) throw new Error('Pas de token hash')
  await page.goto(`${BASE_URL}/login${hashPart}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  try { await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 12000 }) } catch {}
  await page.waitForTimeout(2500)
  const cookies = await context.cookies()
  if (!cookies.some(c => c.name.includes('sb-'))) throw new Error('Session non établie')
  return page
}

async function run() {
  const results = []
  let browser

  try {
    browser = await chromium.launch({ headless: true })

    // ── TEST 1 : DB — colonne roles_actifs présente ──────────────────────
    console.log('\n── TEST 1 : DB roles_actifs ─────────────────────────────')
    const { data: prof, error: dbErr } = await db
      .from('profiles')
      .select('id, role, roles_actifs')
      .eq('id', CHERSIE_ID)
      .single()

    if (dbErr) {
      results.push(`❌ DB error: ${dbErr.message}`)
    } else if (prof?.roles_actifs === undefined) {
      results.push('❌ Colonne roles_actifs absente — migration non exécutée')
    } else {
      console.log(`  role=${prof.role}, roles_actifs=${JSON.stringify(prof.roles_actifs)}`)
      if (Array.isArray(prof.roles_actifs) && prof.roles_actifs.length > 0) {
        results.push(`✅ roles_actifs présent: ${JSON.stringify(prof.roles_actifs)}`)
      } else {
        results.push(`⚠️  roles_actifs vide [] — migration UPDATE non exécutée ou colonne vide`)
      }
    }

    // ── TEST 2 : /profil admin — affichage rôle + points ─────────────────
    console.log('\n── TEST 2 : /profil admin ───────────────────────────────')
    const ctxAdmin = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const adminPage = await magicLinkSession(ADMIN_EMAIL, ctxAdmin)

    await adminPage.goto(`${BASE_URL}/profil`, { waitUntil: 'networkidle', timeout: 30000 })
    await adminPage.waitForTimeout(2000)
    await adminPage.screenshot({ path: '/tmp/profil-admin-roles.png' })

    const profilText = await adminPage.evaluate(() => document.body.innerText)

    // Role label correct
    if (profilText.includes('⚙️ Administrateur')) {
      results.push('✅ /profil admin: label "⚙️ Administrateur" correct')
    } else {
      results.push(`❌ /profil admin: label rôle incorrect (cherché "⚙️ Administrateur")`)
    }

    // Points affichés (points_total dans CarteBadge)
    const pointsEl = await adminPage.evaluate(() => {
      const spans = [...document.querySelectorAll('*')]
      return spans.find(el => /^\d+ pts?$/i.test(el.textContent?.trim() || ''))?.textContent?.trim() || null
    })
    console.log(`  Points affichés: ${pointsEl}`)
    results.push(pointsEl !== null
      ? `✅ Points affichés sur /profil: "${pointsEl}"`
      : `⚠️  Points non visibles sur /profil (normal si 0)`)

    await ctxAdmin.close()

    // ── TEST 3 : roles_actifs update après changement rôle admin ─────────
    console.log('\n── TEST 3 : PATCH → roles_actifs ────────────────────────')

    // Snapshot avant
    const { data: avant } = await db.from('profiles').select('role, roles_actifs').eq('id', CHERSIE_ID).single()
    console.log(`  Avant: role=${avant?.role}, roles_actifs=${JSON.stringify(avant?.roles_actifs)}`)

    // PATCH via API interne
    const patchRes = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': API_SECRET },
      body: JSON.stringify({ id: CHERSIE_ID, role: 'organisateur' }),
    })
    const patchData = await patchRes.json()
    console.log(`  PATCH response: ${JSON.stringify(patchData)}`)

    await new Promise(r => setTimeout(r, 1000))
    const { data: apres } = await db.from('profiles').select('role, roles_actifs').eq('id', CHERSIE_ID).single()
    console.log(`  Après: role=${apres?.role}, roles_actifs=${JSON.stringify(apres?.roles_actifs)}`)

    if (apres?.role === 'organisateur') {
      results.push('✅ role mis à jour → organisateur')
    } else {
      results.push(`❌ role non mis à jour: ${apres?.role}`)
    }

    if (Array.isArray(apres?.roles_actifs) && apres.roles_actifs.includes('organisateur')) {
      results.push(`✅ roles_actifs inclut 'organisateur': ${JSON.stringify(apres.roles_actifs)}`)
    } else {
      results.push(`❌ roles_actifs ne contient pas 'organisateur': ${JSON.stringify(apres?.roles_actifs)}`)
    }

    // Vérifier que l'ancien rôle est préservé
    const ancienRole = avant?.role
    if (ancienRole && Array.isArray(apres?.roles_actifs) && apres.roles_actifs.includes(ancienRole)) {
      results.push(`✅ Ancien rôle '${ancienRole}' préservé dans roles_actifs`)
    } else if (ancienRole) {
      results.push(`⚠️  Ancien rôle '${ancienRole}' non retrouvé dans roles_actifs (${JSON.stringify(apres?.roles_actifs)})`)
    }

    // Restaurer le rôle d'origine
    await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': API_SECRET },
      body: JSON.stringify({ id: CHERSIE_ID, role: avant?.role || 'contributeur' }),
    })
    console.log(`  ✅ Rôle restauré → ${avant?.role}`)

    // ── TEST 4 : /profil Chersie — badges depuis roles_actifs ────────────
    console.log('\n── TEST 4 : /profil Chersie ─────────────────────────────')
    const ctxChersie = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const chersiePage = await magicLinkSession(CHERSIE_EMAIL, ctxChersie)

    await chersiePage.goto(`${BASE_URL}/profil`, { waitUntil: 'networkidle', timeout: 30000 })
    await chersiePage.waitForTimeout(2000)
    await chersiePage.screenshot({ path: '/tmp/profil-chersie-roles.png' })

    const chersieText = await chersiePage.evaluate(() => document.body.innerText)
    console.log('  Extrait:', chersieText.slice(0, 400))

    // Role label
    const labelRoleChersie = ['⚙️ Administrateur', '🤝 Ambassadeur', '🎪 Organisateur', '⭐ Contributeur Terrain', '⭐ Contributeur', '👤 Membre']
      .find(l => chersieText.includes(l))
    if (labelRoleChersie) {
      results.push(`✅ /profil Chersie: label rôle "${labelRoleChersie}"`)
    } else if (chersieText.includes('Organisateur Lotbo')) {
      results.push('❌ /profil Chersie: encore "Organisateur Lotbo" — fix non déployé')
    } else {
      results.push(`⚠️  /profil Chersie: label rôle non reconnu`)
    }

    await ctxChersie.close()

  } catch (err) {
    results.push(`❌ ERREUR: ${err.message}`)
    console.error(err.stack?.split('\n')[0])
  } finally {
    if (browser) await browser.close()
  }

  console.log('\n══════════════════════════════════════════════════════')
  console.log('RAPPORT FINAL')
  console.log('══════════════════════════════════════════════════════')
  for (const r of results) console.log(r)
  const fails = results.filter(r => r.startsWith('❌')).length
  console.log(`\n══ VERDICT : ${fails === 0 ? 'PASS ✅' : 'FAIL ❌'} (${fails} échec(s))`)
  process.exit(fails === 0 ? 0 : 1)
}

run()
