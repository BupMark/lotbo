import { chromium } from 'playwright'

const API_SECRET  = process.env.INTERNAL_API_SECRET  || ''
const BASE_URL    = process.env.LOTBO_BASE_URL        || 'https://app.lotbo.app'
const ADMIN_EMAIL = process.env.LOTBO_ADMIN_EMAIL     || 'agencebupmark@gmail.com'

async function run() {
  const results = []
  let browser

  try {
    // Magic link
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': API_SECRET },
      body: JSON.stringify({ email: ADMIN_EMAIL }),
    })
    const { link, error: linkErr } = await res.json()
    if (!link) throw new Error(`Magic link: ${linkErr}`)
    console.log('✅ Magic link généré')

    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await context.newPage()

    // Étape 1 : aller au magic link → récupérer le hash
    await page.goto(link, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(1000)
    const url = page.url()
    const hashPart = url.includes('#') ? url.slice(url.indexOf('#')) : ''
    if (!hashPart.includes('access_token=')) throw new Error('Pas de hash token dans URL')

    // Étape 2 : /login#hash → setSession() → cookies
    await page.goto(`${BASE_URL}/login${hashPart}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    try { await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 12000 }) } catch {}
    await page.waitForTimeout(2500)

    const cookies = await context.cookies()
    const authCookies = cookies.filter(c => c.name.includes('auth') || c.name.includes('sb-'))
    if (!authCookies.length) throw new Error('Aucun cookie auth — session non établie')
    console.log(`✅ Session établie (${authCookies.length} cookies)`)

    // ── TEST 1 : /admin onglet Utilisateurs ─────────────────────────────
    console.log('\n── TEST 1 : /admin stats ───────────────────────────────')
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Cliquer onglet Utilisateurs (bypass overlay)
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Utilisateurs'))
      btn?.click()
    })
    await page.waitForTimeout(2000)
    await page.screenshot({ path: '/tmp/admin-utilisateurs.png' })

    // Lire le texte de la page
    const statsText = await page.evaluate(() => document.body.innerText)
    console.log('  Extrait stats:', statsText.slice(0, 500))

    // Cards stats
    if (statsText.includes('Membres')) {
      results.push('✅ Card "Membres" présente')
    } else {
      results.push('❌ Card "Membres" absente')
    }
    if (statsText.includes('Sans action')) {
      results.push('✅ Card "Sans action" présente')
    } else {
      results.push('❌ Card "Sans action" absente')
    }
    if (!statsText.includes('\nTotal\n') && !statsText.match(/^\d+\nTotal/m)) {
      results.push('✅ Card "Total" absente (remplacée par Membres)')
    } else {
      results.push('⚠️  Card "Total" encore présente')
    }

    // Email dans tableau
    const emailVisible = await page.evaluate(() => {
      const tds = [...document.querySelectorAll('td')]
      for (const td of tds) {
        if (/@[a-z]+\.[a-z]+/.test(td.innerText)) return td.innerText.slice(0, 60)
      }
      return null
    })
    if (emailVisible) {
      results.push(`❌ Email visible dans tableau: "${emailVisible}"`)
    } else {
      results.push('✅ Aucun email visible dans le tableau')
    }

    // Tooltip email
    const titleWithEmail = await page.evaluate(() => {
      const divs = [...document.querySelectorAll('[title]')]
      const found = divs.find(d => /@/.test(d.getAttribute('title') || ''))
      return found?.getAttribute('title')?.slice(0, 40) || null
    })
    if (titleWithEmail) {
      results.push(`✅ Email en tooltip (title): "${titleWithEmail}…"`)
    } else {
      results.push('⚠️  Aucun tooltip email trouvé (vérifier screenshot)')
    }

    // ── TEST 2 : /profil ─────────────────────────────────────────────────
    console.log('\n── TEST 2 : /profil ─────────────────────────────────────')
    await page.goto(`${BASE_URL}/profil`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)
    await page.screenshot({ path: '/tmp/profil-role.png' })

    const profilText = await page.evaluate(() => document.body.innerText)
    console.log('  Extrait profil:', profilText.slice(0, 300))

    if (profilText.includes('⚙️ Administrateur')) {
      results.push('✅ /profil affiche "⚙️ Administrateur" pour admin')
    } else if (profilText.includes('Organisateur Lotbo')) {
      results.push('❌ /profil affiche encore "Organisateur Lotbo" — fix non déployé')
    } else {
      const labelTrouve = ['Administrateur', 'Ambassadeur', 'Organisateur', 'Contributeur Terrain', 'Contributeur', 'Membre LOTBO', 'Membre'].find(l => profilText.includes(l))
      results.push(labelTrouve ? `✅ /profil affiche "${labelTrouve}"` : '⚠️  Aucun label rôle reconnu sur /profil')
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
