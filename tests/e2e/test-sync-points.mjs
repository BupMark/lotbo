import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const API_SECRET   = process.env.INTERNAL_API_SECRET    || ''
const BASE_URL     = process.env.LOTBO_BASE_URL          || 'https://app.lotbo.app'
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
  if (!(await context.cookies()).some(c => c.name.includes('sb-'))) throw new Error('Session non établie')
  return page
}

async function run() {
  const results = []
  let browser

  try {
    browser = await chromium.launch({ headless: true })

    // ── Snapshot DB avant ────────────────────────────────────────────────
    console.log('\n── DB AVANT ─────────────────────────────────────────────')
    const { data: avant } = await db.from('profiles')
      .select('points_total, niveau, roles_actifs')
      .eq('id', CHERSIE_ID).single()
    const { data: txs } = await db.from('transactions_points')
      .select('points').eq('user_id', CHERSIE_ID)
    const totalTx = Math.max(0, (txs || []).reduce((s, t) => s + (t.points || 0), 0))
    console.log(`  profiles.points_total = ${avant?.points_total}`)
    console.log(`  SUM(transactions)     = ${totalTx}`)
    console.log(`  roles_actifs          = ${JSON.stringify(avant?.roles_actifs)}`)

    // ── TEST 1 : /profil Chersie — sync points au chargement ─────────────
    console.log('\n── TEST 1 : /profil sync points ─────────────────────────')
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await magicLinkSession(CHERSIE_EMAIL, ctx)

    await page.goto(`${BASE_URL}/profil`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(3000)  // laisser le sync s'exécuter
    await page.screenshot({ path: '/tmp/profil-chersie-points.png' })

    const bodyText = await page.evaluate(() => document.body.innerText)
    console.log('  Extrait:\n' + bodyText.slice(0, 500))

    // Vérifier DB après chargement (sync doit avoir mis à jour)
    await new Promise(r => setTimeout(r, 2000))
    const { data: apres } = await db.from('profiles')
      .select('points_total, niveau').eq('id', CHERSIE_ID).single()
    console.log(`  profiles.points_total après sync = ${apres?.points_total}`)

    if (apres?.points_total === totalTx) {
      results.push(`✅ points_total synchronisé avec transactions: ${totalTx}`)
    } else if (totalTx === 0 && apres?.points_total === 0) {
      results.push(`✅ Aucune transaction — points_total = 0 (correct)`)
    } else {
      results.push(`❌ points_total=${apres?.points_total} ≠ SUM(tx)=${totalTx}`)
    }

    // Niveau correct
    const niveauAttendu = totalTx >= 500 ? 'legende'
      : totalTx >= 251 ? 'elite'
      : totalTx >= 101 ? 'top_contributeur'
      : totalTx >= 51  ? 'contributeur'
      : totalTx >= 21  ? 'actif'
      : 'decouvreur'
    if (apres?.niveau === niveauAttendu) {
      results.push(`✅ Niveau correct: ${apres?.niveau}`)
    } else {
      results.push(`❌ Niveau: ${apres?.niveau} ≠ attendu ${niveauAttendu}`)
    }

    // ── TEST 2 : Badges affichés ──────────────────────────────────────────
    console.log('\n── TEST 2 : Badges ──────────────────────────────────────')
    const { data: evs } = await db.from('evenements')
      .select('soumis_en_tant_que, statut').eq('user_id', CHERSIE_ID)
    const nbContrib = (evs || []).filter(e => e.soumis_en_tant_que === 'contributeur').length
    const nbOrga    = (evs || []).filter(e => e.soumis_en_tant_que === 'organisateur').length
    console.log(`  Événements: contrib=${nbContrib}, orga=${nbOrga}`)

    // Aller sur onglet badges
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')]
      btns.find(b => b.textContent?.includes('Badges'))?.click()
    })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: '/tmp/profil-chersie-badges.png' })
    const badgesText = await page.evaluate(() => document.body.innerText)

    if (nbContrib > 0) {
      if (badgesText.includes('Badges Contributeur')) {
        results.push(`✅ Section Badges Contributeur présente (${nbContrib} soumissions)`)
      } else {
        results.push(`❌ Section Badges Contributeur absente malgré ${nbContrib} soumissions contrib`)
      }
    } else {
      results.push(`⚠️  Aucune soumission contributeur — pas de badges contrib attendus`)
    }

    if (nbOrga > 0) {
      if (badgesText.includes('Badges Organisateur')) {
        results.push(`✅ Section Badges Organisateur présente (${nbOrga} soumissions)`)
      } else {
        results.push(`❌ Section Badges Organisateur absente malgré ${nbOrga} soumissions orga`)
      }
    } else {
      results.push(`⚠️  Aucune soumission organisateur — pas de badges orga attendus`)
    }

    await ctx.close()

    // ── TEST 3 : Classement global ────────────────────────────────────────
    console.log('\n── TEST 3 : Classement global ───────────────────────────')
    const { data: classement } = await db.from('profiles')
      .select('id, nom, points_total').gt('points_total', 0)
      .order('points_total', { ascending: false }).limit(100)

    const posChersie = (classement || []).findIndex(m => m.id === CHERSIE_ID)
    console.log(`  Chersie position dans classement global: ${posChersie >= 0 ? posChersie + 1 : 'absente'}`)
    console.log(`  Top 5:`, (classement || []).slice(0, 5).map(m => `${m.nom}(${m.points_total})`).join(', '))

    if (totalTx > 0 && posChersie >= 0) {
      results.push(`✅ Chersie dans classement global (position ${posChersie + 1}, ${totalTx} pts)`)
    } else if (totalTx === 0) {
      results.push(`⚠️  Chersie a 0 points → absente du classement (normal)`)
    } else {
      results.push(`❌ Chersie absente du classement global malgré ${totalTx} pts`)
    }

    // ── TEST 4 : PATCH role → sync points ────────────────────────────────
    console.log('\n── TEST 4 : PATCH role → sync points ────────────────────')
    const ptAvant = apres?.points_total || 0

    await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': API_SECRET },
      body: JSON.stringify({ id: CHERSIE_ID, role: 'contributeur' }),
    })
    await new Promise(r => setTimeout(r, 1500))

    const { data: apresRole } = await db.from('profiles')
      .select('points_total, niveau').eq('id', CHERSIE_ID).single()
    console.log(`  points_total après PATCH: ${apresRole?.points_total}`)

    if (apresRole?.points_total === totalTx) {
      results.push(`✅ PATCH recalcule points depuis transactions: ${apresRole?.points_total}`)
    } else {
      results.push(`❌ PATCH points: ${apresRole?.points_total} ≠ attendu ${totalTx}`)
    }

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
