import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const API_SECRET   = process.env.INTERNAL_API_SECRET   || ''
const BASE_URL     = process.env.LOTBO_BASE_URL         || 'https://app.lotbo.app'
const ADMIN_EMAIL  = process.env.LOTBO_ADMIN_EMAIL      || 'agencebupmark@gmail.com'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Utilisateur test pour vérif points : Chersie (contributeur)
const CHERSIE_ID   = 'cd9657ce-f41b-472e-95ee-75f8bea39227'

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  const results = []
  let browser

  try {
    // Magic link admin
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': API_SECRET },
      body: JSON.stringify({ email: ADMIN_EMAIL }),
    })
    const { link } = await res.json()
    if (!link) throw new Error('Magic link non généré')

    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await context.newPage()

    // Auth via /login#hash
    await page.goto(link, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(1000)
    const hashPart = (() => { const u = page.url(); const i = u.indexOf('#'); return i >= 0 ? u.slice(i) : '' })()
    if (!hashPart.includes('access_token=')) throw new Error('Pas de token hash')
    await page.goto(`${BASE_URL}/login${hashPart}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    try { await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 12000 }) } catch {}
    await page.waitForTimeout(2500)
    const authCookies = (await context.cookies()).filter(c => c.name.includes('sb-'))
    if (!authCookies.length) throw new Error('Session non établie')
    console.log('✅ Session admin établie')

    // ── TEST 1 : Stats admin — Sans action ──────────────────────────────
    console.log('\n── TEST 1 : Stats admin ─────────────────────────────────')
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Utilisateurs'))
      btn?.click()
    })
    await page.waitForTimeout(2000)
    await page.screenshot({ path: '/tmp/admin-stats-fix.png' })

    const bodyText = await page.evaluate(() => document.body.innerText)

    // Extraire les valeurs numériques de chaque card (chiffre avant le label)
    const extractCard = (label) => {
      const re = new RegExp('(\\d+)\\s*\\n\\s*' + label, 'i')
      const m  = bodyText.match(re)
      return m ? parseInt(m[1], 10) : null
    }

    const membres      = extractCard('MEMBRES')
    const sansAction   = extractCard('SANS ACTION')
    const contributeurs = extractCard('CONTRIBUTEURS')

    console.log(`  MEMBRES: ${membres}`)
    console.log(`  SANS ACTION: ${sansAction}`)
    console.log(`  CONTRIBUTEURS: ${contributeurs}`)

    if (membres !== null && sansAction !== null && contributeurs !== null) {
      const attendu = membres - contributeurs
      if (sansAction === attendu) {
        results.push(`✅ Sans action = ${membres} - ${contributeurs} = ${sansAction} ✓`)
      } else {
        results.push(`❌ Sans action = ${sansAction} ≠ attendu ${attendu} (${membres} - ${contributeurs})`)
      }
      results.push(`✅ Membres=${membres}, Contributeurs=${contributeurs}, Sans action=${sansAction}`)
    } else {
      results.push(`❌ Cards non trouvées (membres=${membres}, sansAction=${sansAction}, contributeurs=${contributeurs})`)
    }

    // ── TEST 2 : Points préservés au changement de rôle ─────────────────
    console.log('\n── TEST 2 : Points préservés ────────────────────────────')

    // Lire les points actuels de Chersie
    const { data: avant } = await admin.from('profiles')
      .select('nom, role, points_total, niveau')
      .eq('id', CHERSIE_ID).single()
    console.log(`  Avant : role=${avant?.role}, points=${avant?.points_total}, niveau=${avant?.niveau}`)

    // Changer son rôle via PATCH (contributeur → membre → contributeur)
    const cookies = authCookies.map(c => `${c.name}=${c.value}`).join('; ')
    const patchRes = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': API_SECRET,
        'Cookie': cookies,
      },
      body: JSON.stringify({ id: CHERSIE_ID, role: 'membre' }),
    })
    const patchData = await patchRes.json()
    console.log(`  PATCH response:`, JSON.stringify(patchData))

    // Vérifier que la réponse ne contient PAS points_total
    if (patchData.points_total !== undefined) {
      results.push(`❌ PATCH retourne encore points_total=${patchData.points_total} (recalcul non supprimé)`)
    } else {
      results.push('✅ PATCH ne retourne plus points_total')
    }

    // Vérifier les points en DB après changement
    const { data: apres } = await admin.from('profiles')
      .select('nom, role, points_total, niveau')
      .eq('id', CHERSIE_ID).single()
    console.log(`  Après : role=${apres?.role}, points=${apres?.points_total}, niveau=${apres?.niveau}`)

    if (apres?.points_total === avant?.points_total) {
      results.push(`✅ Points inchangés après changement de rôle (${avant?.points_total} → ${apres?.points_total})`)
    } else {
      results.push(`❌ Points modifiés : ${avant?.points_total} → ${apres?.points_total} (régression)`)
    }

    // Remettre le rôle d'origine
    await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': API_SECRET, 'Cookie': cookies },
      body: JSON.stringify({ id: CHERSIE_ID, role: avant?.role || 'contributeur' }),
    })
    console.log(`  ✅ Rôle restauré → ${avant?.role}`)

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
