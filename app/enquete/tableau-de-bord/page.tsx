import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

interface PageProps {
  searchParams: Promise<{ enqueteur?: string; from?: string; to?: string }>
}

interface EnqueteTerrain {
  id: string
  enqueteur: string | null
  date: string | null
  heure: string | null
  zone: string | null
  profil: string | null
  enthousiasme: string | null
  type: string | null
  ville: string | null
  pays: string | null
  created_at: string
}

const ENQUETEUR_NOMS: Record<string, string> = {
  gaetchens: 'Gaetchens Pierre Louis',
  nancy: 'Nancy Gilot',
  aicha: 'Aïcha Jeffkina Gaëlla',
  syndia: 'Syndia Alexis',
  osny: 'Osny Pierre Louis',
}

function getTodayHaiti(): string {
  return new Date().toLocaleString('sv', { timeZone: 'America/Port-au-Prince' }).slice(0, 10)
}

export default async function TableauDeBord({ searchParams }: PageProps) {
  const cookieStore = await cookies()
  const params = await searchParams

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const role = profile?.role ?? user.user_metadata?.role
  if (role !== 'contributeur_terrain' && role !== 'admin') {
    return (
      <main style={{ background: '#F7F2E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#C8431A', fontSize: '1.1rem', fontWeight: 600 }}>Accès refusé — rôle insuffisant.</p>
      </main>
    )
  }

  // ── Requête principale ────────────────────────────────────────────────────
  const enqueteurFilter = params.enqueteur || ''
  const defaultFrom = '2026-06-08'
  const fromDate = params.from || defaultFrom
  const toDate = params.to || getTodayHaiti()

  let query = supabase
    .from('enquetes_terrain')
    .select('id, enqueteur, date, heure, zone, profil, enthousiasme, type, ville, pays, created_at')
    .order('created_at', { ascending: false })
    .limit(2000)

  if (enqueteurFilter) query = query.eq('enqueteur', enqueteurFilter)
  if (fromDate) query = query.gte('date', fromDate)
  if (toDate) query = query.lte('date', toDate)

  const { data: rows } = await query
  const enquetes: EnqueteTerrain[] = rows ?? []

  // ── Tous les enquêteurs distincts (pour le sélecteur) ────────────────────
  const { data: allRows } = await supabase
    .from('enquetes_terrain')
    .select('enqueteur')
    .not('enqueteur', 'is', null)
    .limit(2000)
  const enqueteurs = Array.from(
    new Set((allRows ?? []).map((r: { enqueteur: string | null }) => r.enqueteur).filter(Boolean))
  ).sort() as string[]

  // ── Bloc 1 : compteur du jour ─────────────────────────────────────────────
  const todayHaiti = getTodayHaiti()
  const todayCount = enquetes.filter((e) => e.date === todayHaiti).length

  // ── Bloc 3 : totaux terrain vs public ────────────────────────────────────
  const terrainCount = enquetes.filter((e) => e.type === 'terrain').length
  const publicCount  = enquetes.filter((e) => e.type === 'public').length
  const totalCount   = enquetes.length

  // ── Styles inline ─────────────────────────────────────────────────────────
  const S = {
    page:    { background: '#F7F2E8', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#1A1410', padding: '0 0 4rem' },
    header:  { background: '#1A1410', color: '#F7F2E8', padding: '1rem 1.25rem', position: 'sticky' as const, top: 0, zIndex: 10 },
    h1:      { margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#C8431A' },
    section: { background: '#fff', borderRadius: '0.75rem', margin: '1rem', padding: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,.08)' },
    label:   { fontSize: '.75rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '.06em', color: '#888', marginBottom: '.4rem', display: 'block' },
    big:     { fontSize: '2.5rem', fontWeight: 800, color: '#C8431A', lineHeight: 1 },
    select:  { width: '100%', padding: '.6rem .8rem', borderRadius: '.5rem', border: '1.5px solid #ddd', background: '#F7F2E8', fontSize: '1rem', color: '#1A1410' },
    input:   { padding: '.6rem .8rem', borderRadius: '.5rem', border: '1.5px solid #ddd', background: '#F7F2E8', fontSize: '.95rem', color: '#1A1410', width: '100%', boxSizing: 'border-box' as const },
    btn:     { background: '#C8431A', color: '#fff', border: 'none', borderRadius: '.5rem', padding: '.65rem 1.25rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', width: '100%', marginTop: '.5rem' },
    row:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' },
    stat:    { background: '#F7F2E8', borderRadius: '.5rem', padding: '.75rem 1rem' },
    table:   { width: '100%', borderCollapse: 'collapse' as const, fontSize: '.82rem' },
    th:      { background: '#1A1410', color: '#F7F2E8', padding: '.5rem .6rem', textAlign: 'left' as const, fontWeight: 600, fontSize: '.75rem' },
    td:      { padding: '.45rem .6rem', borderBottom: '1px solid #eee', verticalAlign: 'top' as const },
  }

  return (
    <main style={S.page}>
      {/* Header sticky */}
      <header style={S.header}>
        <h1 style={S.h1}>Tableau de bord — Enquêteurs</h1>
      </header>

      {/* Bloc 0 : filtre enquêteur */}
      <section style={S.section}>
        <span style={S.label}>Filtrer par enquêteur</span>
        <form method="GET">
          <select name="enqueteur" style={S.select} defaultValue={enqueteurFilter}>
            <option value="">— Tous les enquêteurs —</option>
            {enqueteurs.map((e) => (
              <option key={e} value={e}>{ENQUETEUR_NOMS[e] ?? e}</option>
            ))}
          </select>
          <input type="hidden" name="from" value={fromDate} />
          {params.to && <input type="hidden" name="to" value={params.to} />}
          <button type="submit" style={S.btn}>Appliquer</button>
        </form>
      </section>

      {/* Bloc 1 : compteur aujourd'hui */}
      <section style={S.section}>
        <span style={S.label}>Aujourd&apos;hui ({todayHaiti})</span>
        <p style={S.big}>{todayCount}</p>
        <p style={{ margin: '.3rem 0 0', fontSize: '.85rem', color: '#666' }}>
          enquête{todayCount !== 1 ? 's' : ''} enregistrée{todayCount !== 1 ? 's' : ''}
        </p>
      </section>

      {/* Bloc 2 : filtre période */}
      <section style={S.section}>
        <span style={S.label}>Période</span>
        <form method="GET" style={{ display: 'flex', flexDirection: 'column' as const, gap: '.5rem' }}>
          {enqueteurFilter && <input type="hidden" name="enqueteur" value={enqueteurFilter} />}
          <div style={S.row}>
            <div>
              <label style={{ ...S.label, marginBottom: '.2rem' }}>Du</label>
              <input type="date" name="from" defaultValue={fromDate} style={S.input} />
            </div>
            <div>
              <label style={{ ...S.label, marginBottom: '.2rem' }}>Au</label>
              <input type="date" name="to" defaultValue={toDate} style={S.input} />
            </div>
          </div>
          <button type="submit" style={S.btn}>Filtrer</button>
        </form>
      </section>

      {/* Bloc 3 : totaux */}
      <section style={S.section}>
        <span style={S.label}>Total — {fromDate} → {toDate}</span>
        <div style={S.row}>
          <div style={S.stat}>
            <span style={{ ...S.label, marginBottom: '.15rem' }}>Terrain</span>
            <p style={{ ...S.big, fontSize: '1.8rem' }}>{terrainCount}</p>
          </div>
          <div style={S.stat}>
            <span style={{ ...S.label, marginBottom: '.15rem' }}>Public</span>
            <p style={{ ...S.big, fontSize: '1.8rem' }}>{publicCount}</p>
          </div>
        </div>
        <p style={{ marginTop: '.75rem', fontWeight: 700, fontSize: '1.1rem' }}>
          Total combiné : <span style={{ color: '#C8431A' }}>{totalCount}</span>
        </p>
      </section>

      {/* Tableau détaillé */}
      <section style={{ ...S.section, overflowX: 'auto' }}>
        <span style={S.label}>Détail ({totalCount} entrée{totalCount !== 1 ? 's' : ''})</span>
        {totalCount === 0 ? (
          <p style={{ color: '#888', fontStyle: 'italic', margin: '.5rem 0 0' }}>Aucune enquête pour ces critères.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                {['Date', 'Heure', 'Enquêteur', 'Type', 'Zone', 'Profil', 'Enthous.', 'Ville', 'Pays'].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enquetes.map((e, i) => (
                <tr key={e.id} style={{ background: i % 2 === 0 ? '#fff' : '#faf9f6' }}>
                  <td style={S.td}>{e.date ?? '—'}</td>
                  <td style={S.td}>{e.heure ?? '—'}</td>
                  <td style={S.td}>{e.enqueteur ? (ENQUETEUR_NOMS[e.enqueteur] ?? e.enqueteur) : <em style={{ color: '#aaa' }}>anon</em>}</td>
                  <td style={S.td}>
                    <span style={{
                      background: e.type === 'terrain' ? '#1A1410' : '#E8620A',
                      color: '#F7F2E8', borderRadius: '.25rem', padding: '1px 6px', fontSize: '.72rem', fontWeight: 700
                    }}>
                      {e.type ?? '—'}
                    </span>
                  </td>
                  <td style={S.td}>{e.zone ?? '—'}</td>
                  <td style={S.td}>{e.profil ?? '—'}</td>
                  <td style={S.td}>{e.enthousiasme ?? '—'}</td>
                  <td style={S.td}>{e.ville ?? '—'}</td>
                  <td style={S.td}>{e.pays ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}
