'use client'

export interface BadgeDef {
  id: string
  emoji: string
  seuil: number
  label: string
  desc?: string
}

interface BadgeProgressionProps {
  nbContrib: number
  nbApprouves: number
  badgesContributeur: BadgeDef[]
  badgesOrganisateur: BadgeDef[]
  titreContributeur: (badgeActuel: BadgeDef | null) => string
  titreOrganisateur: (badgeActuel: BadgeDef | null) => string
  labelProchainBadge: string
  texteRestantContributeur?: (nRestant: number) => string
  texteRestantOrganisateur?: (nRestant: number) => string
  onCustomizeContributeur?: (badge: BadgeDef) => void
  onCustomizeOrganisateur?: (badge: BadgeDef) => void
}

const PALETTES = {
  contributeur: {
    couleurTexte: '#D4A820',
    fondObtenu: 'rgba(212,168,32,0.12)',
    borderObtenu: '1px solid rgba(212,168,32,0.4)',
    fondBarre: 'rgba(212,168,32,0.06)',
  },
  organisateur: {
    couleurTexte: '#C8431A',
    fondObtenu: 'rgba(200,67,26,0.12)',
    borderObtenu: '1px solid rgba(200,67,26,0.4)',
    fondBarre: 'rgba(200,67,26,0.06)',
  },
} as const

function getBadgeActuel(nb: number, badges: BadgeDef[]): BadgeDef | null {
  const obtenus = badges.filter(b => nb >= b.seuil)
  return obtenus[obtenus.length - 1] || null
}

function getProchainBadge(nb: number, badges: BadgeDef[]): BadgeDef | null {
  return badges.find(b => nb < b.seuil) || null
}

function GrilleBadges({
  badges, nb, variante, onCustomize,
}: {
  badges: BadgeDef[]
  nb: number
  variante: keyof typeof PALETTES
  onCustomize?: (badge: BadgeDef) => void
}) {
  const p = PALETTES[variante]
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {badges.map(b => {
        const obtenu = nb >= b.seuil
        return (
          <div key={b.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '12px 16px', borderRadius: 12, minWidth: 80,
            background: obtenu ? p.fondObtenu : 'rgba(26,20,16,0.03)',
            border: obtenu ? p.borderObtenu : '1px solid #E8E0D0',
            opacity: obtenu ? 1 : 0.4,
          }}>
            <span style={{ fontSize: 24 }}>{b.emoji}</span>
            <p style={{ color: obtenu ? p.couleurTexte : '#8C5A40', fontSize: 11, fontWeight: 'bold', textAlign: 'center', margin: 0 }}>{b.label}</p>
            {b.desc && (
              <p style={{ color: '#8C5A40', fontSize: 10, textAlign: 'center', margin: 0 }}>{b.desc}</p>
            )}
            {obtenu && onCustomize && (
              <button
                onClick={() => onCustomize(b)}
                style={{ background: 'rgba(200,67,26,0.12)', border: 'none', borderRadius: 6, padding: '3px 8px', color: '#C8431A', fontSize: 10, cursor: 'pointer', fontWeight: 'bold', marginTop: 2 }}
              >
                🎨
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function BarreProgression({
  nb, prochainBadge, labelProchainBadge, variante, texteRestant,
}: {
  nb: number
  prochainBadge: BadgeDef | null
  labelProchainBadge: string
  variante: keyof typeof PALETTES
  texteRestant?: (nRestant: number) => string
}) {
  if (!prochainBadge) return null
  const p = PALETTES[variante]
  const restant = prochainBadge.seuil - nb
  return (
    <div style={{ marginTop: 16, background: p.fondBarre, borderRadius: 10, padding: '12px 14px' }}>
      <p style={{ color: p.couleurTexte, fontSize: 12, marginBottom: 6 }}>
        {labelProchainBadge} : {prochainBadge.emoji} {prochainBadge.label}
      </p>
      <div style={{ background: 'rgba(26,20,16,0.06)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
        <div style={{
          background: p.couleurTexte, height: '100%', borderRadius: 999,
          width: `${Math.min(100, (nb / prochainBadge.seuil) * 100)}%`,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 6 }}>
        {nb} / {prochainBadge.seuil}{texteRestant ? ` — ${texteRestant(restant)}` : ''}
      </p>
    </div>
  )
}

export default function BadgeProgression({
  nbContrib, nbApprouves, badgesContributeur, badgesOrganisateur,
  titreContributeur, titreOrganisateur, labelProchainBadge,
  texteRestantContributeur, texteRestantOrganisateur,
  onCustomizeContributeur, onCustomizeOrganisateur,
}: BadgeProgressionProps) {
  const badgeContribActuel = getBadgeActuel(nbContrib, badgesContributeur)
  const prochainBadgeContrib = getProchainBadge(nbContrib, badgesContributeur)
  const badgeOrgaActuel = getBadgeActuel(nbApprouves, badgesOrganisateur)
  const prochainBadgeOrga = getProchainBadge(nbApprouves, badgesOrganisateur)

  const carte = { background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 20, marginBottom: 16 }

  return (
    <>
      <div style={carte}>
        <h3 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
          {titreContributeur(badgeContribActuel)}
        </h3>
        <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 16 }}>
          {nbContrib} contribution{nbContrib > 1 ? 's' : ''} repérée{nbContrib > 1 ? 's' : ''}
        </p>
        <GrilleBadges badges={badgesContributeur} nb={nbContrib} variante="contributeur" onCustomize={onCustomizeContributeur} />
        <BarreProgression nb={nbContrib} prochainBadge={prochainBadgeContrib} labelProchainBadge={labelProchainBadge} variante="contributeur" texteRestant={texteRestantContributeur} />
      </div>

      <div style={carte}>
        <h3 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
          {titreOrganisateur(badgeOrgaActuel)}
        </h3>
        <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 16 }}>
          {nbApprouves} événement{nbApprouves > 1 ? 's' : ''} approuvé{nbApprouves > 1 ? 's' : ''}
        </p>
        <GrilleBadges badges={badgesOrganisateur} nb={nbApprouves} variante="organisateur" onCustomize={onCustomizeOrganisateur} />
        <BarreProgression nb={nbApprouves} prochainBadge={prochainBadgeOrga} labelProchainBadge={labelProchainBadge} variante="organisateur" texteRestant={texteRestantOrganisateur} />
      </div>
    </>
  )
}
