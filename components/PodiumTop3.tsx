import { NIVEAUX, getInitiales, medallePosition } from '../lib/classementUtils'
import { calculerNiveau } from '../lib/points'
import { getTraductions, type Langue } from '../lib/i18n'

interface PodiumTop3Props {
  top3: { id: string; nom: string | null; photo_url: string | null; points_total: number; niveau: string }[]
  isDesktop: boolean
  langue?: Langue
}

export default function PodiumTop3({ top3, isDesktop, langue = 'fr' }: PodiumTop3Props) {
  const t = getTraductions(langue)
  return (
    <>
      <style>{`
        @keyframes lotboRiseIn {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes lotboGoldPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,168,32,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(212,168,32,0); }
        }
        .lotbo-podium-step { animation: lotboRiseIn 0.5s ease-out both; }
        .lotbo-gold-glow { animation: lotboGoldPulse 2s ease-in-out infinite; }
      `}</style>
      {top3.length > 0 && (
        <div style={{
          background: 'white', borderRadius: 16,
          padding: isDesktop ? '24px' : '0',
          border: isDesktop ? '1px solid #E8E0D0' : 'none',
          marginBottom: isDesktop ? 0 : 24,
        }}>
          {isDesktop && (
            <p style={{ fontWeight: 'bold', fontSize: 14, color: '#8C5A40', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t.podium.top3}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            {[top3[1], top3[0], top3[2]].map((membre, i) => {
              if (!membre) return null
              const pos  = i === 0 ? 2 : i === 1 ? 1 : 3
              const haut = pos === 1 ? 140 : pos === 2 ? 110 : 90

              const animationDelay = pos === 1 ? '0.9s' : pos === 2 ? '0.5s' : '0.1s'

              return (
                <div
                  key={membre.id}
                  className="lotbo-podium-step"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: pos === 1 ? 1.2 : 1, animationDelay }}
                >
                  <div
                    className={pos === 1 ? 'lotbo-gold-glow' : undefined}
                    style={{ position: 'relative', marginBottom: 8, borderRadius: pos === 1 ? '50%' : undefined }}
                  >
                    {membre.photo_url ? (
                      <img src={membre.photo_url} alt={membre.nom || ''} style={{
                        width: pos === 1 ? 72 : 56, height: pos === 1 ? 72 : 56,
                        borderRadius: '50%', objectFit: 'cover',
                        border: `3px solid ${pos === 1 ? '#D4A820' : pos === 2 ? '#8C8C8C' : '#C8431A'}`,
                      }} />
                    ) : (
                      <div style={{
                        width: pos === 1 ? 72 : 56, height: pos === 1 ? 72 : 56,
                        borderRadius: '50%', background: '#C8431A',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 'bold', fontSize: pos === 1 ? 24 : 18,
                        border: `3px solid ${pos === 1 ? '#D4A820' : pos === 2 ? '#8C8C8C' : '#C8431A'}`,
                      }}>
                        {getInitiales(membre.nom)}
                      </div>
                    )}
                    <span style={{ position: 'absolute', bottom: -4, right: -4, fontSize: 18 }}>
                      {medallePosition(pos)}
                    </span>
                  </div>

                  <p style={{ fontWeight: 'bold', fontSize: pos === 1 ? 14 : 12, color: '#1A1410', textAlign: 'center', marginBottom: 2, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {membre.nom || t.podium.membreParDefaut}
                  </p>
                  <p style={{ color: '#C8431A', fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>{membre.points_total} {t.podium.points}</p>

                  <div style={{
                    width: '100%', height: haut,
                    background: pos === 1 ? 'rgba(212,168,32,0.2)' : pos === 2 ? 'rgba(140,140,140,0.15)' : 'rgba(200,67,26,0.15)',
                    borderRadius: '8px 8px 0 0',
                    border: `2px solid ${pos === 1 ? 'rgba(212,168,32,0.4)' : pos === 2 ? 'rgba(140,140,140,0.3)' : 'rgba(200,67,26,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 28, opacity: 0.6 }}>
                      {NIVEAUX[calculerNiveau(membre.points_total)]?.emoji || '🌱'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
