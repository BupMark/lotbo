import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'Lotbo — Événement'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
    let ev: any = null
    try {
      if (!supabaseUrl || !supabaseKey || !id) {
        console.error('Params manquants:', { id, supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey })
      } else {
        const fetchUrl = `${supabaseUrl}/rest/v1/evenements?id=eq.${id}&statut=eq.approuve&select=titre,lieu,date,categorie,image_url&limit=1`
        const res = await fetch(fetchUrl, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          cache: 'no-store'
        })
        const data = await res.json()
        console.log('OG data:', JSON.stringify(data))
        ev = data?.[0] || null
      }
    } catch (e) {
      console.error('OG fetch error:', e)
      ev = null
    }

  const titre = ev?.titre || 'Événement sur Lotbo'
  const lieu = ev?.lieu || ''
  const date = ev?.date || ''
  const categorie = ev?.categorie || ''
  const imageUrl = ev?.image_url || null

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative',
          background: '#1A1410',
          fontFamily: 'serif',
        }}
      >
        {/* Image de fond si disponible */}
        {imageUrl && (
          <img
            src={imageUrl}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.35,
            }}
          />
        )}

        {/* Overlay gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(26,20,16,0.95) 0%, rgba(26,20,16,0.7) 100%)',
            display: 'flex',
          }}
        />

        {/* Contenu */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px 72px',
            width: '100%',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 32, fontWeight: 700, fontStyle: 'italic',
              color: '#F7F2E8', letterSpacing: '-0.02em'
            }}>lot</span>
            <span style={{
              fontSize: 32, fontWeight: 700, fontStyle: 'italic',
              color: '#C8431A', letterSpacing: '-0.02em'
            }}>bo</span>
          </div>

          {/* Titre + infos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Badge catégorie */}
            {categorie && (
              <div style={{
                display: 'flex',
                background: 'rgba(200,67,26,0.2)',
                border: '1px solid rgba(200,67,26,0.5)',
                borderRadius: 999,
                padding: '6px 18px',
                alignSelf: 'flex-start',
              }}>
                <span style={{ color: '#C8431A', fontSize: 16, fontWeight: 600 }}>
                  {categorie}
                </span>
              </div>
            )}

            {/* Titre */}
            <div style={{
              fontSize: titre.length > 40 ? 48 : 60,
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#F7F2E8',
              lineHeight: 1.15,
              maxWidth: '900px',
              display: 'flex',
            }}>
              {titre}
            </div>

            {/* Lieu + Date */}
            <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
              {lieu && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>📍</span>
                  <span style={{ color: '#E8E0D0', fontSize: 22 }}>{lieu}</span>
                </div>
              )}
              {date && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>📅</span>
                  <span style={{ color: '#E8E0D0', fontSize: 22 }}>{date}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ color: '#8C5A40', fontSize: 18 }}>
              app.lotbo.app
            </span>
            <div style={{
              background: '#C8431A',
              borderRadius: 10,
              padding: '10px 24px',
              display: 'flex',
            }}>
              <span style={{ color: '#F7F2E8', fontSize: 18, fontWeight: 600 }}>
                Voir l'événement →
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}