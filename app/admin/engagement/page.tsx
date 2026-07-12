'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type PieceType = 'ninu' | 'passeport' | 'autre'
type TypeAffichage = 'vrai_nom' | 'prenom_initiale' | 'username'

interface PreFill {
  nom_complet: string
  email: string
  ville: string
  fiches_total_initial: number
}

interface FormData {
  pieceType: PieceType | null
  pieceNumero: string
  piecePays: string
  nomAffichageType: TypeAffichage | null
  nomAffichageValeur: string
  consentPhoto: boolean
  consentProfil: boolean
  engagementConf: boolean[]
  engagementAdmin: boolean[]
}

const initialForm: FormData = {
  pieceType: null, pieceNumero: '', piecePays: 'Haiti',
  nomAffichageType: null, nomAffichageValeur: '',
  consentPhoto: false, consentProfil: false,
  engagementConf: [false, false, false, false, false, false],
  engagementAdmin: [false, false, false, false],
}

const styles = {
  main: { minHeight: '100dvh', background: '#F7F2E8', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '32px 16px' },
  logo: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 26, fontWeight: 'bold' as const, marginBottom: 8 },
  sousLogo: { color: '#8C5A40', fontSize: 12, marginBottom: 24 },
  carte: { background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: 24, width: '100%', maxWidth: 480 },
  label: { fontSize: 11, fontWeight: 'bold' as const, color: '#8C5A40', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 6, display: 'block' },
  input: { width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #E8E0D0', fontSize: 14, marginBottom: 16, color: '#1A1410', boxSizing: 'border-box' as const },
  inputDisabled: { width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #E8E0D0', fontSize: 14, marginBottom: 16, color: '#8C5A40', background: '#F7F2E8', boxSizing: 'border-box' as const },
  boutonPrincipal: (actif: boolean) => ({ width: '100%', padding: '13px 20px', borderRadius: 10, border: 'none', background: actif ? '#C8431A' : '#E8E0D0', color: actif ? 'white' : '#8C5A40', fontSize: 14, fontWeight: 'bold' as const, cursor: actif ? 'pointer' : 'default' }),
  boutonSecondaire: { width: '100%', padding: '13px 20px', borderRadius: 10, border: '1px solid #E8E0D0', background: 'white', color: '#8C5A40', fontSize: 13, fontWeight: 'bold' as const, cursor: 'pointer', marginTop: 10 },
  checkboxLabel: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16, cursor: 'pointer' },
  checkboxText: { fontSize: 13, color: '#4A3830', lineHeight: 1.6 },
}

function EngagementContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [statut, setStatut] = useState<'chargement' | 'invalide' | 'pret'>('chargement')
  const [invalideRaison, setInvalideRaison] = useState('')
  const [preFill, setPreFill] = useState<PreFill | null>(null)
  const [etape, setEtape] = useState(1)
  const [data, setData] = useState<FormData>(initialForm)
  const [soumission, setSoumission] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')

  useEffect(() => {
    if (!token) { setStatut('invalide'); setInvalideRaison('Lien manquant.'); return }
    fetch(`/api/admin-engagement/${token}`)
      .then(res => res.json())
      .then(json => {
        if (!json.valid) {
          setStatut('invalide')
          setInvalideRaison(json.reason === 'deja_utilise' ? 'Ce lien a déjà été utilisé.' : json.reason === 'expire' ? 'Ce lien a expiré.' : 'Ce lien est introuvable.')
          return
        }
        setPreFill(json)
        setStatut('pret')
      })
      .catch(() => { setStatut('invalide'); setInvalideRaison('Erreur de chargement.') })
  }, [token])

  const maj = (patch: Partial<FormData>) => setData(prev => ({ ...prev, ...patch }))

  const toggleConf = (i: number) => setData(prev => ({ ...prev, engagementConf: prev.engagementConf.map((v, idx) => idx === i ? !v : v) }))
  const toggleAdmin = (i: number) => setData(prev => ({ ...prev, engagementAdmin: prev.engagementAdmin.map((v, idx) => idx === i ? !v : v) }))

  const tousConf = data.engagementConf.every(Boolean)
  const tousAdmin = data.engagementAdmin.every(Boolean)

  const soumettre = async () => {
    setSoumission('loading')
    try {
      const res = await fetch('/api/admin-engagement/soumettre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          piece_type: data.pieceType,
          piece_numero: data.pieceNumero,
          piece_pays: data.piecePays,
          nom_affichage_type: data.nomAffichageType,
          nom_affichage_valeur: data.nomAffichageValeur,
          consent_photo: data.consentPhoto,
          engagement_conf: data.engagementConf,
          engagement_admin: data.engagementAdmin,
        }),
      })
      if (!res.ok) throw new Error('Échec soumission')
      setSoumission('success')
      setEtape(7)
    } catch {
      setSoumission('error')
    }
  }

  if (statut === 'chargement') {
    return <main style={styles.main}><p style={{ color: '#8C5A40' }}>Chargement...</p></main>
  }

  if (statut === 'invalide') {
    return (
      <main style={styles.main}>
        <div style={styles.logo}><span style={{ color: '#1A1410' }}>lot</span><span style={{ color: '#C8431A' }}>bo</span></div>
        <div style={styles.carte}>
          <p style={{ color: '#C8431A', fontSize: 14, textAlign: 'center' }}>{invalideRaison}</p>
          <p style={{ color: '#8C5A40', fontSize: 13, textAlign: 'center', marginTop: 12 }}>Contacte handgod@lotbo.app pour obtenir un nouveau lien.</p>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.main}>
      <div style={styles.logo}><span style={{ color: '#1A1410' }}>lot</span><span style={{ color: '#C8431A' }}>bo</span></div>
      <p style={styles.sousLogo}>Engagement LOTBO</p>

      <div style={styles.carte}>

        {etape === 1 && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 20, fontWeight: 'bold', color: '#1A1410', marginBottom: 8 }}>Engagement LOTBO</h1>
            <p style={{ color: '#8C5A40', fontSize: 13, marginBottom: 16 }}>Coordinatrice Terrain Mondiale</p>
            <p style={{ color: '#1A1410', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>Ce formulaire officialise votre rôle au sein de LOTBO. Il couvre trois dimensions et prend moins de 5 minutes.</p>
            <button style={styles.boutonPrincipal(true)} onClick={() => setEtape(2)}>Commencer</button>
          </div>
        )}

        {etape === 2 && preFill && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 'bold', color: '#1A1410', marginBottom: 16 }}>Votre identité</h2>
            <label style={styles.label}>Nom complet</label>
            <div style={styles.inputDisabled}>{preFill.nom_complet}</div>
            <label style={styles.label}>Email professionnel</label>
            <div style={styles.inputDisabled}>{preFill.email}</div>
            <label style={styles.label}>Type de pièce d'identité</label>
            {(['ninu', 'passeport', 'autre'] as PieceType[]).map(type => (
              <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: data.pieceType === type ? '1px solid #C8431A' : '1px solid #E8E0D0', borderRadius: 8, marginBottom: 8, cursor: 'pointer' }}>
                <input type="radio" name="pieceType" checked={data.pieceType === type} onChange={() => maj({ pieceType: type })} style={{ accentColor: '#C8431A' }} />
                <span style={{ fontSize: 14, color: '#1A1410' }}>{type === 'ninu' ? 'NINU (Carte d\'Identité Nationale Unique)' : type === 'passeport' ? 'Passeport' : 'Autre'}</span>
              </label>
            ))}
            <label style={{ ...styles.label, marginTop: 12 }}>Numéro de la pièce</label>
            <input style={styles.input} value={data.pieceNumero} onChange={e => maj({ pieceNumero: e.target.value })} />
            <label style={styles.label}>Pays d'émission</label>
            <input style={styles.input} value={data.piecePays} onChange={e => maj({ piecePays: e.target.value })} />
            <p style={{ color: '#8C5A40', fontSize: 11, marginBottom: 16, lineHeight: 1.5 }}>Le numéro de votre pièce d'identité est utilisé uniquement pour authentifier cet engagement. Aucune copie n'est conservée.</p>
            <button style={styles.boutonPrincipal(!!(data.pieceType && data.pieceNumero))} disabled={!(data.pieceType && data.pieceNumero)} onClick={() => setEtape(3)}>Suivant</button>
          </div>
        )}

        {etape === 3 && preFill && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 'bold', color: '#1A1410', marginBottom: 12 }}>Partie 1 — Publication de votre profil</h2>
            <p style={{ color: '#1A1410', fontSize: 13, marginBottom: 12 }}>Les informations suivantes apparaîtront publiquement sur la page lotbo.app/enqueteurs :</p>
            <ul style={{ color: '#4A3830', fontSize: 13, lineHeight: 1.8, marginBottom: 16, paddingLeft: 20 }}>
              <li>Nom d'affichage (selon choix ci-dessous)</li>
              <li>Photo de profil (si fournie)</li>
              <li>Ville : {preFill.ville}</li>
              <li>Zone de couverture : {preFill.ville} et environs</li>
              <li>Nombre de fiches : {preFill.fiches_total_initial}</li>
              <li>Statut : Certifiée</li>
            </ul>
            <label style={styles.label}>Nom d'affichage</label>
            {([
              { type: 'vrai_nom' as TypeAffichage, label: `Mon vrai nom : ${preFill.nom_complet}` },
              { type: 'prenom_initiale' as TypeAffichage, label: `Prénom + initiale : ${preFill.nom_complet.split(' ')[0]} ${preFill.nom_complet.split(' ').slice(-1)[0]?.[0] || ''}.` },
              { type: 'username' as TypeAffichage, label: "Nom d'utilisateur" },
            ]).map(opt => (
              <label key={opt.type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: data.nomAffichageType === opt.type ? '1px solid #C8431A' : '1px solid #E8E0D0', borderRadius: 8, marginBottom: 8, cursor: 'pointer' }}>
                <input type="radio" name="nomAffichage" checked={data.nomAffichageType === opt.type} onChange={() => maj({ nomAffichageType: opt.type, nomAffichageValeur: opt.type === 'vrai_nom' ? preFill.nom_complet : '' })} style={{ accentColor: '#C8431A' }} />
                <span style={{ fontSize: 14, color: '#1A1410' }}>{opt.label}</span>
              </label>
            ))}
            {data.nomAffichageType === 'username' && (
              <input style={styles.input} placeholder="Nom d'utilisateur" value={data.nomAffichageValeur} onChange={e => maj({ nomAffichageValeur: e.target.value })} />
            )}
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={data.consentPhoto} onChange={e => maj({ consentPhoto: e.target.checked })} style={{ accentColor: '#C8431A', marginTop: 3, flexShrink: 0 }} />
              <span style={styles.checkboxText}>J'accepte que la photo que je fournis apparaisse publiquement sur la page des enquêteurs LOTBO. <em>(Si oui, envoyer la photo à hello@lotbo.app)</em></span>
            </label>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={data.consentProfil} onChange={e => maj({ consentProfil: e.target.checked })} style={{ accentColor: '#C8431A', marginTop: 3, flexShrink: 0 }} />
              <span style={styles.checkboxText}>J'accepte que mon nom d'affichage, ma zone, ma ville et mon nombre de fiches apparaissent publiquement sur lotbo.app/enqueteurs, visible par tous les utilisateurs dans le monde entier et indexé par les moteurs de recherche. Je peux retirer ce consentement à tout moment via privacy@lotbo.app.</span>
            </label>
            <p style={{ color: '#8C5A40', fontSize: 11, marginBottom: 16 }}>Ce consentement est valable pour une durée d'un an. Un email de renouvellement vous sera envoyé 30 jours avant expiration.</p>
            <button style={styles.boutonPrincipal(!!data.nomAffichageType && data.consentProfil && (data.nomAffichageType !== 'username' || !!data.nomAffichageValeur))} disabled={!data.nomAffichageType || !data.consentProfil || (data.nomAffichageType === 'username' && !data.nomAffichageValeur)} onClick={() => setEtape(4)}>Suivant</button>
            <button style={styles.boutonSecondaire} onClick={() => setEtape(2)}>Retour</button>
          </div>
        )}

        {etape === 4 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 'bold', color: '#1A1410', marginBottom: 8 }}>Partie 2 — Confidentialité des données enquêteurs</h2>
            <p style={{ color: '#1A1410', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>En tant que Coordinatrice Terrain, vous avez accès aux données personnelles des candidats et enquêteurs LOTBO. Ces données comprennent : noms, emails, WhatsApp, photos, zones, statuts, progressions.</p>
            {[
              "Je m'engage à traiter ces données de façon strictement confidentielle, uniquement à des fins de coordination du programme terrain LOTBO.",
              "Je m'engage à ne jamais partager, transmettre ni divulguer ces données à des tiers sans autorisation explicite et écrite de Bup Mark Ltd.",
              "Je m'engage à ne pas utiliser ces données à des fins personnelles, commerciales ou étrangères au programme LOTBO.",
              "Je m'engage à signaler immédiatement à handgod@lotbo.app toute violation ou suspicion de violation de confidentialité dont j'aurais connaissance.",
              "Je comprends que ces obligations s'appliquent pendant toute la durée de mes fonctions et après leur cessation, sans limite de durée.",
              "Je comprends que le non-respect de ces engagements peut engager ma responsabilité personnelle et entraîner la suspension de mon accès aux outils LOTBO.",
            ].map((texte, i) => (
              <label key={i} style={styles.checkboxLabel}>
                <input type="checkbox" checked={data.engagementConf[i]} onChange={() => toggleConf(i)} style={{ accentColor: '#C8431A', marginTop: 3, flexShrink: 0 }} />
                <span style={styles.checkboxText}>{texte}</span>
              </label>
            ))}
            <button style={styles.boutonPrincipal(tousConf)} disabled={!tousConf} onClick={() => setEtape(5)}>Suivant</button>
            <button style={styles.boutonSecondaire} onClick={() => setEtape(3)}>Retour</button>
          </div>
        )}

        {etape === 5 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 'bold', color: '#1A1410', marginBottom: 8 }}>Partie 3 — Accès administrateur enquêteurs</h2>
            <p style={{ color: '#1A1410', fontSize: 13, marginBottom: 12 }}>Le rôle admin_enqueteur vous donne accès aux fonctions suivantes et uniquement à celles-ci :</p>
            <p style={{ color: '#2D9E6B', fontSize: 12, fontWeight: 'bold', marginBottom: 6 }}>✓ Accessible</p>
            <ul style={{ color: '#4A3830', fontSize: 13, lineHeight: 1.8, marginBottom: 16, paddingLeft: 20 }}>
              <li>Validation et rejet des candidatures enquêteur</li>
              <li>Modification du statut enquêteur (candidat, actif, certifié, inactif)</li>
              <li>Consultation des données enquêteurs</li>
              <li>Gestion des demandes de badge physique</li>
            </ul>
            <p style={{ color: '#e57373', fontSize: 12, fontWeight: 'bold', marginBottom: 6 }}>✗ Non accessible</p>
            <ul style={{ color: '#4A3830', fontSize: 13, lineHeight: 1.8, marginBottom: 16, paddingLeft: 20 }}>
              <li>Comptes et données des membres LOTBO</li>
              <li>Événements et modération</li>
              <li>Données de paiement</li>
              <li>Suspension de comptes membres</li>
              <li>Scrapers et imports automatiques</li>
              <li>Données techniques de la plateforme</li>
            </ul>
            {[
              "Je confirme avoir pris connaissance du périmètre exact de mon accès administrateur tel que listé ci-dessus.",
              "Je m'engage à ne pas tenter d'accéder à des données ou fonctions situées hors de ce périmètre.",
              "Je m'engage à signaler immédiatement à handgod@lotbo.app toute découverte accidentelle de données hors périmètre.",
              "Je comprends que tout accès hors périmètre, même accidentel et non signalé, peut entraîner la révocation immédiate de mon accès administrateur.",
            ].map((texte, i) => (
              <label key={i} style={styles.checkboxLabel}>
                <input type="checkbox" checked={data.engagementAdmin[i]} onChange={() => toggleAdmin(i)} style={{ accentColor: '#C8431A', marginTop: 3, flexShrink: 0 }} />
                <span style={styles.checkboxText}>{texte}</span>
              </label>
            ))}
            <button style={styles.boutonPrincipal(tousAdmin)} disabled={!tousAdmin} onClick={() => setEtape(6)}>Suivant</button>
            <button style={styles.boutonSecondaire} onClick={() => setEtape(4)}>Retour</button>
          </div>
        )}

        {etape === 6 && preFill && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 'bold', color: '#1A1410', marginBottom: 16 }}>Récapitulatif</h2>
            <div style={{ background: '#F7F2E8', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 13, color: '#1A1410', lineHeight: 1.8 }}>
              <p><strong>Nom :</strong> {preFill.nom_complet}</p>
              <p><strong>Email :</strong> {preFill.email}</p>
              <p><strong>Pièce :</strong> {data.pieceType} — {data.pieceNumero}</p>
              <p>Partie 1 : case cochée ✅</p>
              <p>Partie 2 : 6 cases cochées ✅</p>
              <p>Partie 3 : 4 cases cochées ✅</p>
            </div>
            <p style={{ color: '#1A1410', fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>En soumettant ce formulaire, je confirme avoir lu et accepte l'ensemble des engagements des Parties 1, 2 et 3. Cette soumission a valeur d'engagement formel entre moi et Bup Mark Ltd.</p>
            <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 16 }}>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            {soumission === 'error' && <p style={{ color: '#C8431A', fontSize: 13, marginBottom: 12 }}>Une erreur est survenue. Réessaie.</p>}
            <button style={styles.boutonPrincipal(soumission !== 'loading')} disabled={soumission === 'loading'} onClick={soumettre}>{soumission === 'loading' ? 'Envoi en cours...' : 'Soumettre mon engagement'}</button>
            {soumission !== 'loading' && <button style={styles.boutonSecondaire} onClick={() => setEtape(5)}>Retour</button>}
          </div>
        )}

        {etape === 7 && preFill && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <h1 style={{ fontSize: 18, fontWeight: 'bold', color: '#1A1410', marginBottom: 12 }}>Engagement enregistré</h1>
            <p style={{ color: '#8C5A40', fontSize: 14, lineHeight: 1.6 }}>Votre engagement a été enregistré avec succès. Bienvenue dans l'équipe LOTBO, {preFill.nom_complet.split(' ')[0]}. Un email de confirmation vous a été envoyé à {preFill.email}. Votre accès administrateur sera activé par Handgod dans les prochaines heures.</p>
          </div>
        )}

      </div>
    </main>
  )
}

export default function PageEngagement() {
  return (
    <Suspense fallback={<main style={styles.main}><p style={{ color: '#8C5A40' }}>Chargement...</p></main>}>
      <EngagementContent />
    </Suspense>
  )
}
