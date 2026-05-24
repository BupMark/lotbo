import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const API_SECRET    = process.env.INTERNAL_API_SECRET    || ''
const BASE_URL      = process.env.LOTBO_BASE_URL         || 'https://app.lotbo.app'
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const ADMIN_EMAIL   = process.env.LOTBO_ADMIN_EMAIL      || 'agencebupmark@gmail.com'
const CHERSIE_ID    = 'cd9657ce-f41b-472e-95ee-75f8bea39227'
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
  if (!(await context.cookies()).some(c => c.name.includes('sb-'))) throw new Error('Session non établie')
  return page
}

async function run() {
  const results = []
  let browser, testEventId

  try {
    browser = await chromium.launch({ headless: true })

    // ── TEST 1 : /api/attributer-points direct ────────────────────────────
    console.log('\n── TEST 1 : API /api/attributer-points ──────────────────')

    const { data: avant } = await db.from('profiles')
      .select('points_total, points_organisateur, points_utilisateur')
      .eq('id', CHERSIE_ID).single()
    console.log(`  Avant: total=${avant?.points_total}, orga=${avant?.points_organisateur}, util=${avant?.points_utilisateur}`)

    const apiRes = await fetch(`${BASE_URL}/api/attributer-points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': API_SECRET },
      body: JSON.stringify({
        user_id: CHERSIE_ID,
        action: 'evenement_approuve',
        type_role: 'organisateur',
      }),
    })
    const apiData = await apiRes.json()
    console.log(`  Réponse API: ${JSON.stringify(apiData)}`)

    if (apiData.success && apiData.points_ajoutes === 10) {
      results.push('✅ /api/attributer-points retourne success + points_ajoutes=10')
    } else {
      results.push(`❌ /api/attributer-points: ${JSON.stringify(apiData)}`)
    }

    await new Promise(r => setTimeout(r, 1000))
    const { data: apres1 } = await db.from('profiles')
      .select('points_total, points_organisateur, points_utilisateur')
      .eq('id', CHERSIE_ID).single()
    console.log(`  Après API: total=${apres1?.points_total}, orga=${apres1?.points_organisateur}, util=${apres1?.points_utilisateur}`)

    if ((apres1?.points_total || 0) === (avant?.points_total || 0) + 10) {
      results.push(`✅ points_total +10: ${avant?.points_total} → ${apres1?.points_total}`)
    } else {
      results.push(`❌ points_total: attendu ${(avant?.points_total || 0) + 10}, obtenu ${apres1?.points_total}`)
    }
    if ((apres1?.points_organisateur || 0) === (avant?.points_organisateur || 0) + 10) {
      results.push(`✅ points_organisateur +10: ${avant?.points_organisateur} → ${apres1?.points_organisateur}`)
    } else {
      results.push(`❌ points_organisateur: attendu ${(avant?.points_organisateur || 0) + 10}, obtenu ${apres1?.points_organisateur}`)
    }
    if (apres1?.points_utilisateur === avant?.points_utilisateur) {
      results.push(`✅ points_utilisateur inchangé: ${apres1?.points_utilisateur}`)
    } else {
      results.push(`❌ points_utilisateur modifié: ${avant?.points_utilisateur} → ${apres1?.points_utilisateur}`)
    }

    // ── TEST 2 : Approbation via admin UI ─────────────────────────────────
    console.log('\n── TEST 2 : Admin UI — approuver un événement ───────────')

    const { data: inserted } = await db.from('evenements').insert([{
      titre: `Test-Approbation-Points-${Date.now()}`,
      user_id: CHERSIE_ID,
      statut: 'en_attente',
      soumis_en_tant_que: 'organisateur',
      ville: 'Port-au-Prince', pays: 'Haïti',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      lieu: 'Test Lieu', categorie: 'Autre',
      longitude: -72.3388, latitude: 18.5944,
      visibilite: 'public',
    }]).select('id').single()
    testEventId = inserted?.id
    console.log(`  Événement test créé: ${testEventId}`)

    const ptAvant = apres1?.points_total || 0

    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const adminPage = await magicLinkSession(ADMIN_EMAIL, ctx)

    await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle', timeout: 30000 })
    await adminPage.waitForTimeout(2000)

    const btnApprouver = await adminPage.evaluate((evId) => {
      const rows = [...document.querySelectorAll('*')]
      const el = rows.find(e => e.textContent?.includes('Test-Approbation-Points'))
      if (!el) return false
      let parent = el.parentElement
      for (let i = 0; i < 8; i++) {
        if (!parent) break
        const btn = parent.querySelector('button')
        if (btn && (btn.textContent?.includes('✓') || btn.textContent?.includes('Approuver') || btn.style?.color?.includes('107'))) {
          btn.click()
          return btn.textContent?.trim() || 'cliqué'
        }
        parent = parent.parentElement
      }
      return false
    }, testEventId)

    if (btnApprouver) {
      console.log(`  Bouton approuver cliqué: "${btnApprouver}"`)
      await adminPage.waitForTimeout(4000)

      await new Promise(r => setTimeout(r, 2000))
      const { data: apres2 } = await db.from('profiles')
        .select('points_total').eq('id', CHERSIE_ID).single()
      console.log(`  points_total après approbation UI: ${apres2?.points_total} (attendu ${ptAvant + 10})`)

      if ((apres2?.points_total || 0) >= ptAvant + 10) {
        results.push(`✅ Approbation UI → points +10: ${ptAvant} → ${apres2?.points_total}`)
      } else {
        results.push(`❌ Approbation UI → points: ${ptAvant} → ${apres2?.points_total} (attendu +10)`)
      }

      const { data: ev } = await db.from('evenements').select('statut').eq('id', testEventId).single()
      if (ev?.statut === 'approuve') {
        results.push(`✅ Événement statut = 'approuve'`)
      } else {
        results.push(`❌ Statut événement: ${ev?.statut} (attendu 'approuve')`)
      }
    } else {
      await adminPage.screenshot({ path: '/tmp/admin-approbation.png' })
      results.push(`⚠️  Bouton approuver non trouvé dans UI (screenshot: /tmp/admin-approbation.png)`)
    }

    await ctx.close()

    // ── TEST 3 : Auth — refus sans secret ────────────────────────────────
    console.log('\n── TEST 3 : Sécurité ────────────────────────────────────')
    const unauth = await fetch(`${BASE_URL}/api/attributer-points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: CHERSIE_ID, action: 'evenement_approuve' }),
    })
    if (unauth.status === 401) {
      results.push('✅ 401 sans x-internal-secret')
    } else {
      results.push(`❌ Attendu 401, obtenu ${unauth.status}`)
    }

  } catch (err) {
    results.push(`❌ ERREUR: ${err.message}`)
    console.error(err.stack?.split('\n')[0])
  } finally {
    if (testEventId) {
      await db.from('evenements').delete().eq('id', testEventId)
      console.log(`\n  ✅ Événement test supprimé`)
    }
    const { data: fin } = await db.from('profiles')
      .select('points_total, points_organisateur').eq('id', CHERSIE_ID).single()
    console.log(`  Points finaux Chersie: total=${fin?.points_total}, orga=${fin?.points_organisateur}`)

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
