'use client'

export interface BadgeDef {
  id: string
  emoji: string
  seuil: number
  label: string
  desc?: string
}

export type Langue = 'fr' | 'en' | 'es' | 'pt' | 'ht'

export const PAS_ENCORE_BADGE: Record<Langue, string> = {
  fr: 'Pas encore de badge',
  en: 'No badge yet',
  es: 'Aún sin insignia',
  pt: 'Ainda sem badge',
  ht: 'Poko gen badj',
}

const AUTRES_BADGES: Record<Langue, (n: number) => string> = {
  fr: (n) => `+${n} autre${n > 1 ? 's' : ''} badge${n > 1 ? 's' : ''}`,
  en: (n) => `+${n} other badge${n > 1 ? 's' : ''}`,
  es: (n) => `+${n} otra${n > 1 ? 's' : ''} insignia${n > 1 ? 's' : ''}`,
  pt: (n) => `+${n} outro${n > 1 ? 's' : ''} badge${n > 1 ? 's' : ''}`,
  ht: (n) => `+${n} lòt badj ankò`,
}

const CONTRIBUTIONS_REPEREES: Record<Langue, (n: number) => string> = {
  fr: (n) => `${n} contribution${n > 1 ? 's' : ''} repérée${n > 1 ? 's' : ''}`,
  en: (n) => `${n} contribution${n > 1 ? 's' : ''} tracked`,
  es: (n) => `${n} contribución${n > 1 ? 'es' : ''} registrada${n > 1 ? 's' : ''}`,
  pt: (n) => `${n} contribuição${n > 1 ? 'ões' : ''} registrada${n > 1 ? 's' : ''}`,
  ht: (n) => `${n} kontribisyon repere`,
}

const EVENEMENTS_APPROUVES: Record<Langue, (n: number) => string> = {
  fr: (n) => `${n} événement${n > 1 ? 's' : ''} approuvé${n > 1 ? 's' : ''}`,
  en: (n) => `${n} event${n > 1 ? 's' : ''} approved`,
  es: (n) => `${n} evento${n > 1 ? 's' : ''} aprobado${n > 1 ? 's' : ''}`,
  pt: (n) => `${n} evento${n > 1 ? 's' : ''} aprovado${n > 1 ? 's' : ''}`,
  ht: (n) => `${n} evènman apwouve`,
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
  compact?: boolean
  langue?: Langue
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

function getBadgesObtenus(nb: number, badges: BadgeDef[]): BadgeDef[] {
  return badges.filter(b => nb >= b.seuil)
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
  compact,
  langue = 'fr',
}: BadgeProgressionProps) {
  const lang = langue || 'fr'
  const badgeContribActuel = getBadgeActuel(nbContrib, badgesContributeur)
  const prochainBadgeContrib = getProchainBadge(nbContrib, badgesContributeur)
  const badgeOrgaActuel = getBadgeActuel(nbApprouves, badgesOrganisateur)
  const prochainBadgeOrga = getProchainBadge(nbApprouves, badgesOrganisateur)

  const carte = { background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 20, marginBottom: 16 }

  if (compact) {
    const badgesObtenusContrib = getBadgesObtenus(nbContrib, badgesContributeur)
    const badgesObtenusOrga = getBadgesObtenus(nbApprouves, badgesOrganisateur)
    const pContrib = PALETTES.contributeur
    const pOrga = PALETTES.organisateur

    return (
      <>
        <style>{`
          @keyframes lotboMedalPop {
            0% { transform: scale(0.7); opacity: 0; }
            60% { transform: scale(1.08); opacity: 1; }
            100% { transform: scale(1); }
          }
          @keyframes lotboSpark {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          .lotbo-medal { animation: lotboMedalPop 0.5s ease-out; }
          .lotbo-spark { animation: lotboSpark 1.6s ease-in-out infinite; display: inline-block; }
        `}</style>

        <div style={carte}>
          <h3 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 12 }}>
            {titreContributeur(badgeContribActuel)}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="lotbo-medal" style={{
              width: 52, height: 52, borderRadius: '50%',
              background: pContrib.fondObtenu, border: `2px solid ${pContrib.couleurTexte}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, flexShrink: 0,
            }}>
              {badgeContribActuel ? badgeContribActuel.emoji : '🌱'}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#1A1410', margin: 0 }}>
                {badgeContribActuel ? badgeContribActuel.label : PAS_ENCORE_BADGE[lang]}
                {badgesObtenusContrib.length > 0 && <span className="lotbo-spark" style={{ marginLeft: 6 }}>✨</span>}
              </p>
              {badgesObtenusContrib.length > 1 && (
                <p style={{ fontSize: 12, color: '#8C5A40', margin: 0 }}>
                  {AUTRES_BADGES[lang](badgesObtenusContrib.length - 1)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div style={carte}>
          <h3 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 12 }}>
            {titreOrganisateur(badgeOrgaActuel)}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="lotbo-medal" style={{
              width: 52, height: 52, borderRadius: '50%',
              background: pOrga.fondObtenu, border: `2px solid ${pOrga.couleurTexte}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, flexShrink: 0,
            }}>
              {badgeOrgaActuel ? badgeOrgaActuel.emoji : '🎪'}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#1A1410', margin: 0 }}>
                {badgeOrgaActuel ? badgeOrgaActuel.label : PAS_ENCORE_BADGE[lang]}
                {badgesObtenusOrga.length > 0 && <span className="lotbo-spark" style={{ marginLeft: 6 }}>✨</span>}
              </p>
              {badgesObtenusOrga.length > 1 && (
                <p style={{ fontSize: 12, color: '#8C5A40', margin: 0 }}>
                  {AUTRES_BADGES[lang](badgesObtenusOrga.length - 1)}
                </p>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div style={carte}>
        <h3 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
          {titreContributeur(badgeContribActuel)}
        </h3>
        <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 16 }}>
          {CONTRIBUTIONS_REPEREES[lang](nbContrib)}
        </p>
        <GrilleBadges badges={badgesContributeur} nb={nbContrib} variante="contributeur" onCustomize={onCustomizeContributeur} />
        <BarreProgression nb={nbContrib} prochainBadge={prochainBadgeContrib} labelProchainBadge={labelProchainBadge} variante="contributeur" texteRestant={texteRestantContributeur} />
      </div>

      <div style={carte}>
        <h3 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
          {titreOrganisateur(badgeOrgaActuel)}
        </h3>
        <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 16 }}>
          {EVENEMENTS_APPROUVES[lang](nbApprouves)}
        </p>
        <GrilleBadges badges={badgesOrganisateur} nb={nbApprouves} variante="organisateur" onCustomize={onCustomizeOrganisateur} />
        <BarreProgression nb={nbApprouves} prochainBadge={prochainBadgeOrga} labelProchainBadge={labelProchainBadge} variante="organisateur" texteRestant={texteRestantOrganisateur} />
      </div>
    </>
  )
}
