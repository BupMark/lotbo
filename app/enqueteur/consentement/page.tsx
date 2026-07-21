'use client'

// FEAT-ENQUETEUR-MONDIAL-1 — T-3
// Page consentement numérique enquêteur — token seul, sans session Supabase
// Accessible publiquement : app.lotbo.app/enqueteur/consentement
// Phase 1 : FR + HT uniquement

import { useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'

type Langue = 'fr' | 'ht'
type TypeAffichage = 'vrai_nom' | 'prenom_initiale' | 'username'
type Genre = 'f' | 'h' | null

interface FormData {
  nomComplet: string
  ville: string
  email: string
  whatsapp: string
  genre: Genre
  typeAffichage: TypeAffichage | null
  valeurAffichage: string
  photoFile: File | null
  photoPreview: string | null
  consentPhoto: boolean
  consentPublication: boolean
  consentVolontariat: boolean
  consentAge: boolean
  signatureTexte: string
}

const initialFormData: FormData = {
  nomComplet: '', ville: '', email: '', whatsapp: '', genre: null,
  typeAffichage: null, valeurAffichage: '',
  photoFile: null, photoPreview: null,
  consentPhoto: false, consentPublication: false,
  consentVolontariat: false, consentAge: false,
  signatureTexte: '',
}

export default function PageConsentementEnqueteur() {
  const [langue, setLangue]     = useState<Langue>('fr')
  const [etape, setEtape]       = useState(1)
  const [data, setData]         = useState<FormData>(initialFormData)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [soumission, setSoumission] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [prenomConfirmation, setPrenomConfirmation] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const maj = (patch: Partial<FormData>) => setData(prev => ({ ...prev, ...patch }))

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    maj({ photoFile: file, photoPreview: preview })
  }

  const uploaderPhotoSiPresente = async (): Promise<string | null> => {
    if (!data.photoFile) return null
    setUploadingPhoto(true)
    try {
      const ext  = data.photoFile.name.split('.').pop()
      const path = `candidats/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage
        .from('enqueteurs-photos')
        .upload(path, data.photoFile, { upsert: false })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage
        .from('enqueteurs-photos')
        .getPublicUrl(path)
      return publicUrl
    } catch (err) {
      console.error('[Consentement] Erreur upload photo:', err)
      return null
    } finally {
      setUploadingPhoto(false)
    }
  }

  const soumettre = async () => {
    setSoumission('loading')
    try {
      const photoUrl = await uploaderPhotoSiPresente()

      const res = await fetch('/api/enqueteur/soumettre-consentement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom_complet: data.nomComplet,
          ville: data.ville,
          email: data.email,
          whatsapp: data.whatsapp || null,
          genre: data.genre,
          type_affichage: data.typeAffichage,
          valeur_affichage: data.valeurAffichage,
          consent_publication: data.consentPublication,
          consent_volontariat: data.consentVolontariat,
          consent_age: data.consentAge,
          consent_photo: data.consentPhoto,
          photo_url: photoUrl,
          signature_texte: data.signatureTexte,
          langue,
        }),
      })

      if (!res.ok) throw new Error('Échec soumission')

      setPrenomConfirmation(data.nomComplet.split(' ')[0] || '')
      setSoumission('success')
      setEtape(7)

      try {
        if (window.fbq && localStorage.getItem('lotbo_analytics_consent') === 'true') {
          window.fbq('trackCustom', 'CandidatureEnqueteur')
        }
      } catch (e) {}
    } catch (err) {
      console.error('[Consentement] Erreur soumission:', err)
      setSoumission('error')
    }
  }

  const troisConsentements = data.consentPublication && data.consentVolontariat && data.consentAge

  const styles = {
    main: { minHeight: '100dvh', background: '#F7F2E8', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '32px 16px' },
    logo: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 26, fontWeight: 'bold' as const, marginBottom: 24 },
    carte: { background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: 24, width: '100%', maxWidth: 480 },
    label: { fontSize: 11, fontWeight: 'bold' as const, color: '#8C5A40', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 6, display: 'block' },
    input: { width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #E8E0D0', fontSize: 14, marginBottom: 16, color: '#1A1410', boxSizing: 'border-box' as const },
    boutonPrincipal: (actif: boolean) => ({
      width: '100%', padding: '13px 20px', borderRadius: 10, border: 'none',
      background: actif ? '#C8431A' : '#E8E0D0', color: actif ? 'white' : '#8C5A40',
      fontSize: 14, fontWeight: 'bold' as const, cursor: actif ? 'pointer' : 'default',
    }),
    boutonSecondaire: { width: '100%', padding: '13px 20px', borderRadius: 10, border: '1px solid #E8E0D0', background: 'white', color: '#8C5A40', fontSize: 13, fontWeight: 'bold' as const, cursor: 'pointer', marginTop: 10 },
  }

  const t = {
    intro: {
      titre:   { fr: 'Programme Terrain LOTBO',                ht: 'Pwogram Tèren LOTBO' },
      duree:   { fr: 'Ce formulaire prend moins de 2 minutes.', ht: 'Fòmilè sa a pran mwens ke 2 minit.' },
      bouton:  { fr: 'Commencer',                               ht: 'Kòmanse' },
    },
    identite: {
      titre: { fr: 'Tes informations', ht: 'Enfòmasyon ou yo' },
      nom:   { fr: 'Nom complet',      ht: 'Non konplè' },
      ville: { fr: 'Ville',            ht: 'Vil' },
      email: { fr: 'Email',            ht: 'Imèl' },
      whatsapp: { fr: 'WhatsApp (optionnel)', ht: 'WhatsApp (opsyonèl)' },
      genre: { fr: 'Genre', ht: 'Sèks' },
      femme: { fr: 'Femme', ht: 'Fi' },
      homme: { fr: 'Homme', ht: 'Gason' },
    },
    affichage: {
      titre:      { fr: 'Comment voulez-vous apparaître ?', ht: 'Kijan ou vle parèt ?' },
      vraiNom:    { fr: 'Mon vrai nom',                       ht: 'Non reyèl mwen' },
      initiale:   { fr: 'Prénom + initiale (ex : Marie D.)',  ht: 'Prenon + inisyal (egz : Marie D.)' },
      username:   { fr: 'Un nom d’utilisateur',          ht: 'Yon non itilizatè' },
    },
    photo: {
      titre:    { fr: 'Photo de profil (optionnelle)', ht: 'Foto pwofil (opsyonèl)' },
      note:     { fr: 'Si vous n’en ajoutez pas, une icône générique sera affichée.', ht: 'Si ou pa mete youn, yon ikòn jenerik pral parèt.' },
      consentPhoto: { fr: 'J’accepte que cette photo apparaisse publiquement sur la page des enquêteurs.', ht: 'Mwen aksepte foto sa a parèt piblikman sou paj ankètè a.' },
    },
    consentements: {
      c1: { fr: 'J’accepte que mon nom d’affichage, ma zone, ma ville et mon nombre de fiches apparaissent publiquement sur lotbo.app/enqueteurs, visible par tous les utilisateurs dans le monde entier et indexé par les moteurs de recherche. Je peux retirer mon consentement à tout moment depuis mon profil.',
           ht: 'Mwen aksepte non mwen, zòn mwen, vil mwen ak kantite fich mwen yo parèt piblikman sou lotbo.app/enqueteurs, vizib pa tout itilizatè nan lemonn epi endekse pa motè rechèch yo. Mwen ka retire konsantman mwen nenpòt ki lè depi pwofil mwen.' },
      c2: { fr: 'Je confirme que ma participation est entièrement volontaire, sans rémunération ni contrepartie financière, et ne constitue pas un contrat de travail.',
           ht: 'Mwen konfime patisipasyon mwen se volontè nèt, san salè ni kontreparti finansyè, epi li pa konstitye yon kontra travay.' },
      c3: { fr: 'Je déclare avoir 16 ans ou plus.', ht: 'Mwen deklare m gen 16 an oswa plis.' },
      dureeConsentement: {
        fr: "Ce consentement est valable pour une durée d'un an. Un email de renouvellement vous sera envoyé 30 jours avant expiration.",
        ht: "Konsantman sa a valab pou yon ane. Yon imèl renouvèlman ap voye ba ou 30 jou anvan dat ekspirasyon an.",
      },
    },
    signature: {
      titre: { fr: 'Tapez votre nom complet ci-dessous. Cette saisie vaut signature.', ht: 'Tape non konplè ou anba a. Antre sa a vale siyati.' },
    },
    confirmation: {
      merci: { fr: `Merci ${prenomConfirmation} !`, ht: `Mèsi ${prenomConfirmation} !` },
      corps: { fr: 'Votre consentement a été enregistré. Votre fiche sera publiée prochainement. Un email de confirmation vous a été envoyé.',
               ht: 'Konsantman ou anrejistre. Fich ou a pral pibliye nan yon ti tan. Yon imèl konfimasyon ap vin jwenn ou.' },
    },
    boutons: {
      suivant:  { fr: 'Suivant',  ht: 'Apre' },
      retour:   { fr: 'Retour',  ht: 'Retounen' },
      soumettre: { fr: 'Envoyer', ht: 'Voye' },
      envoiEnCours: { fr: 'Envoi en cours...', ht: 'Ap voye kounye a...' },
    },
  }

  return (
    <main style={styles.main}>
      <div style={styles.logo}>
        <span style={{ color: '#1A1410' }}>lot</span><span style={{ color: '#C8431A' }}>bo</span>
      </div>

      {etape < 7 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => setLangue('fr')} style={{ padding: '6px 14px', borderRadius: 999, border: langue === 'fr' ? '1px solid #C8431A' : '1px solid #E8E0D0', background: langue === 'fr' ? 'rgba(200,67,26,0.08)' : 'white', color: langue === 'fr' ? '#C8431A' : '#8C5A40', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}>FR</button>
          <button onClick={() => setLangue('ht')} style={{ padding: '6px 14px', borderRadius: 999, border: langue === 'ht' ? '1px solid #C8431A' : '1px solid #E8E0D0', background: langue === 'ht' ? 'rgba(200,67,26,0.08)' : 'white', color: langue === 'ht' ? '#C8431A' : '#8C5A40', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}>HT</button>
        </div>
      )}

      <div style={styles.carte}>

        {etape === 1 && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 20, fontWeight: 'bold', color: '#1A1410', marginBottom: 12 }}>{t.intro.titre[langue]}</h1>
            <p style={{ color: '#8C5A40', fontSize: 14, marginBottom: 24 }}>{t.intro.duree[langue]}</p>
            <button style={styles.boutonPrincipal(true)} onClick={() => setEtape(2)}>{t.intro.bouton[langue]}</button>
          </div>
        )}

        {etape === 2 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 'bold', color: '#1A1410', marginBottom: 16 }}>{t.identite.titre[langue]}</h2>
            <label style={styles.label}>{t.identite.nom[langue]}</label>
            <input style={styles.input} value={data.nomComplet} onChange={e => maj({ nomComplet: e.target.value })} />
            <label style={styles.label}>{t.identite.ville[langue]}</label>
            <input style={styles.input} value={data.ville} onChange={e => maj({ ville: e.target.value })} />
            <label style={styles.label}>{t.identite.email[langue]}</label>
            <input style={styles.input} type="email" value={data.email} onChange={e => maj({ email: e.target.value })} />
            <label style={styles.label}>{t.identite.whatsapp[langue]}</label>
            <input style={styles.input} value={data.whatsapp} onChange={e => maj({ whatsapp: e.target.value })} />

            <label style={styles.label}>{t.identite.genre[langue]}</label>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="radio" name="genre" checked={data.genre === 'f'} onChange={() => maj({ genre: 'f' })} style={{ accentColor: '#C8431A' }} />
                <span style={{ fontSize: 14, color: '#1A1410' }}>{t.identite.femme[langue]}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="radio" name="genre" checked={data.genre === 'h'} onChange={() => maj({ genre: 'h' })} style={{ accentColor: '#C8431A' }} />
                <span style={{ fontSize: 14, color: '#1A1410' }}>{t.identite.homme[langue]}</span>
              </label>
            </div>

            <button
              style={styles.boutonPrincipal(!!(data.nomComplet && data.ville && data.email))}
              disabled={!(data.nomComplet && data.ville && data.email)}
              onClick={() => setEtape(3)}
            >
              {t.boutons.suivant[langue]}
            </button>
            <button style={styles.boutonSecondaire} onClick={() => setEtape(1)}>{t.boutons.retour[langue]}</button>
          </div>
        )}

        {etape === 3 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 'bold', color: '#1A1410', marginBottom: 16 }}>{t.affichage.titre[langue]}</h2>

            {(['vrai_nom', 'prenom_initiale', 'username'] as TypeAffichage[]).map(type => (
              <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: data.typeAffichage === type ? '1px solid #C8431A' : '1px solid #E8E0D0', borderRadius: 8, marginBottom: 10, cursor: 'pointer' }}>
                <input type="radio" name="typeAffichage" checked={data.typeAffichage === type} onChange={() => maj({ typeAffichage: type })} style={{ accentColor: '#C8431A' }} />
                <span style={{ fontSize: 14, color: '#1A1410' }}>
                  {type === 'vrai_nom' && t.affichage.vraiNom[langue]}
                  {type === 'prenom_initiale' && t.affichage.initiale[langue]}
                  {type === 'username' && t.affichage.username[langue]}
                </span>
              </label>
            ))}

            {data.typeAffichage === 'username' && (
              <input style={styles.input} placeholder={t.affichage.username[langue]} value={data.valeurAffichage} onChange={e => maj({ valeurAffichage: e.target.value })} />
            )}

            <button
              style={styles.boutonPrincipal(!!data.typeAffichage && (data.typeAffichage !== 'username' || !!data.valeurAffichage))}
              disabled={!data.typeAffichage || (data.typeAffichage === 'username' && !data.valeurAffichage)}
              onClick={() => {
                if (data.typeAffichage === 'vrai_nom') {
                  maj({ valeurAffichage: data.nomComplet })
                } else if (data.typeAffichage === 'prenom_initiale') {
                  const parts = data.nomComplet.trim().split(/\s+/)
                  const prenom = parts[0] ?? data.nomComplet
                  const initiale = parts.length > 1 ? parts[parts.length - 1][0]?.toUpperCase() : ''
                  maj({ valeurAffichage: initiale ? `${prenom} ${initiale}.` : prenom })
                }
                setEtape(4)
              }}
            >
              {t.boutons.suivant[langue]}
            </button>
            <button style={styles.boutonSecondaire} onClick={() => setEtape(2)}>{t.boutons.retour[langue]}</button>
          </div>
        )}

        {etape === 4 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 'bold', color: '#1A1410', marginBottom: 8 }}>{t.photo.titre[langue]}</h2>
            <p style={{ color: '#8C5A40', fontSize: 13, marginBottom: 16 }}>{t.photo.note[langue]}</p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#F7F2E8', border: '1px solid #E8E0D0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                {data.photoPreview ? <img src={data.photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhotoChange} />
            <button style={styles.boutonSecondaire} onClick={() => fileInputRef.current?.click()}>
              {langue === 'fr' ? 'Choisir une photo' : 'Chwazi yon foto'}
            </button>

            {data.photoFile && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 16, cursor: 'pointer' }}>
                <input type="checkbox" checked={data.consentPhoto} onChange={e => maj({ consentPhoto: e.target.checked })} style={{ accentColor: '#C8431A', marginTop: 3 }} />
                <span style={{ fontSize: 13, color: '#4A3830', lineHeight: 1.5 }}>{t.photo.consentPhoto[langue]}</span>
              </label>
            )}

            <div style={{ marginTop: 20 }}>
              <button
                style={styles.boutonPrincipal(!data.photoFile || data.consentPhoto)}
                disabled={!!data.photoFile && !data.consentPhoto}
                onClick={() => setEtape(5)}
              >
                {t.boutons.suivant[langue]}
              </button>
              <button style={styles.boutonSecondaire} onClick={() => setEtape(3)}>{t.boutons.retour[langue]}</button>
            </div>
          </div>
        )}

        {etape === 5 && (
          <div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={data.consentPublication} onChange={e => maj({ consentPublication: e.target.checked })} style={{ accentColor: '#C8431A', marginTop: 3, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#4A3830', lineHeight: 1.6 }}>{t.consentements.c1[langue]}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={data.consentVolontariat} onChange={e => maj({ consentVolontariat: e.target.checked })} style={{ accentColor: '#C8431A', marginTop: 3, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#4A3830', lineHeight: 1.6 }}>{t.consentements.c2[langue]}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={data.consentAge} onChange={e => maj({ consentAge: e.target.checked })} style={{ accentColor: '#C8431A', marginTop: 3, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#4A3830', lineHeight: 1.6 }}>{t.consentements.c3[langue]}</span>
            </label>

            <p style={{ color: '#8C5A40', fontSize: 11, marginBottom: 16, lineHeight: 1.5 }}>
              {t.consentements.dureeConsentement[langue]}
            </p>

            <button style={styles.boutonPrincipal(troisConsentements)} disabled={!troisConsentements} onClick={() => setEtape(6)}>
              {t.boutons.suivant[langue]}
            </button>
            <button style={styles.boutonSecondaire} onClick={() => setEtape(4)}>{t.boutons.retour[langue]}</button>
          </div>
        )}

        {etape === 6 && (
          <div>
            <p style={{ fontSize: 14, color: '#1A1410', lineHeight: 1.6, marginBottom: 16 }}>{t.signature.titre[langue]}</p>
            <input style={styles.input} value={data.signatureTexte} onChange={e => maj({ signatureTexte: e.target.value })} />
            <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 16 }}>
              {new Date().toLocaleDateString('fr-FR')}
            </p>

            {soumission === 'error' && (
              <p style={{ color: '#C8431A', fontSize: 13, marginBottom: 12 }}>
                {langue === 'fr' ? 'Une erreur est survenue. Réessaie.' : 'Gen yon erè ki fèt. Eseye ankò.'}
              </p>
            )}

            <button
              style={styles.boutonPrincipal(!!data.signatureTexte && soumission !== 'loading')}
              disabled={!data.signatureTexte || soumission === 'loading' || uploadingPhoto}
              onClick={soumettre}
            >
              {soumission === 'loading' ? t.boutons.envoiEnCours[langue] : t.boutons.soumettre[langue]}
            </button>
            {soumission !== 'loading' && (
              <button style={styles.boutonSecondaire} onClick={() => setEtape(5)}>{t.boutons.retour[langue]}</button>
            )}
          </div>
        )}

        {etape === 7 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <h1 style={{ fontSize: 18, fontWeight: 'bold', color: '#1A1410', marginBottom: 12 }}>{t.confirmation.merci[langue]}</h1>
            <p style={{ color: '#8C5A40', fontSize: 14, lineHeight: 1.6 }}>{t.confirmation.corps[langue]}</p>
          </div>
        )}

      </div>
    </main>
  )
}
