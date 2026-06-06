'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

interface OrgForm {
  nom:            string
  slogan:         string
  description:    string
  ville:          string
  pays:           string
  site_web:       string
  email_contact:  string
  telephone:      string
  visible:        boolean
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#F7F2E8', border: '1px solid #E8E0D0',
  borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1A1410',
  outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, color: '#8C5A40', display: 'block', marginBottom: 4,
}

export default function PageParametresOrg() {
  const params = useParams()
  const router = useRouter()
  const slug   = params?.slug as string

  const [orgId, setOrgId]                   = useState<string | null>(null)
  const [orgNom, setOrgNom]                 = useState('')
  const [loading, setLoading]               = useState(true)
  const [saving, setSaving]                 = useState(false)
  const [saved, setSaved]                   = useState(false)
  const [confirmerSuppr, setConfirmerSuppr] = useState(false)
  const [suppression, setSuppression]       = useState(false)

  const [form, setForm] = useState<OrgForm>({
    nom: '', slogan: '', description: '', ville: '', pays: '',
    site_web: '', email_contact: '', telephone: '', visible: true,
  })

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user?.id
      if (!userId) { router.push('/login'); return }

      // On exclut `visible` du select initial — colonne optionnelle, requête séparée
      const { data: org, error } = await supabase
        .from('organisations')
        .select('id, nom, slogan, description, ville, pays, site_web, email_contact, telephone, owner_id')
        .eq('slug', slug)
        .single()

      if (error || !org) { router.push(`/organisation/${slug}`); return }
      if (org.owner_id !== userId) { router.push(`/organisation/${slug}`); return }

      // Tente de charger `visible` séparément (colonne peut ne pas exister encore)
      let visible = true
      try {
        const { data: vRow } = await supabase
          .from('organisations').select('visible').eq('id', org.id).single()
        if (typeof vRow?.visible === 'boolean') visible = vRow.visible
      } catch { /* colonne absente → on garde true par défaut */ }

      setOrgId(org.id)
      setOrgNom(org.nom || '')
      setForm({
        nom:           org.nom           || '',
        slogan:        org.slogan        || '',
        description:   org.description  || '',
        ville:         org.ville         || '',
        pays:          org.pays          || '',
        site_web:      org.site_web      || '',
        email_contact: org.email_contact || '',
        telephone:     org.telephone     || '',
        visible,
      })
      setLoading(false)
    }
    init()
  }, [slug, router])

  const handleSave = async () => {
    if (!orgId) return
    setSaving(true)
    await supabase.from('organisations').update({
      nom:           form.nom.trim(),
      slogan:        form.slogan.trim()        || null,
      description:   form.description.trim()  || null,
      ville:         form.ville.trim()         || null,
      pays:          form.pays.trim()          || null,
      site_web:      form.site_web.trim()      || null,
      email_contact: form.email_contact.trim() || null,
      telephone:     form.telephone.trim()     || null,
      updated_at:    new Date().toISOString(),
    }).eq('id', orgId)
    // visible séparé (colonne peut ne pas exister)
    try {
      await supabase.from('organisations').update({ visible: form.visible }).eq('id', orgId)
    } catch { /* silencieux si colonne absente */ }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleDelete = async () => {
    if (!orgId) return
    setSuppression(true)
    await supabase.from('organisations').delete().eq('id', orgId)
    router.push('/profil')
  }

  const set = (key: keyof OrgForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8C5A40' }}>Chargement…</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Header */}
        <a href={`/organisation/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#8C5A40', fontSize: 13, textDecoration: 'none', marginBottom: 20 }}>
          ← Retour à l&apos;organisation
        </a>
        <h1 style={{ fontSize: 20, fontWeight: 'bold', color: '#1A1410', marginBottom: 24 }}>
          ⚙️ Paramètres — {orgNom}
        </h1>

        {/* ── Accès rapide ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <a href={`/organisation/${slug}/modifier`} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: '20px 12px',
            textDecoration: 'none', color: '#1A1410',
          }}>
            <span style={{ fontSize: 28 }}>✏️</span>
            <span style={{ fontSize: 13, fontWeight: 'bold', color: '#C8431A' }}>Modifier la page</span>
            <span style={{ fontSize: 11, color: '#8C5A40', textAlign: 'center' }}>Logo, cover, visuels</span>
          </a>
          <a href={`/organisation/${slug}/membres`} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: '20px 12px',
            textDecoration: 'none', color: '#1A1410',
          }}>
            <span style={{ fontSize: 28 }}>👥</span>
            <span style={{ fontSize: 13, fontWeight: 'bold', color: '#C8431A' }}>Gérer les membres</span>
            <span style={{ fontSize: 11, color: '#8C5A40', textAlign: 'center' }}>Rôles et invitations</span>
          </a>
        </div>

        {/* ── Informations ── */}
        <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #E8E0D0', marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 'bold', color: '#1A1410', marginBottom: 16 }}>📋 Informations</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Nom de l&apos;organisation *</label>
              <input value={form.nom} onChange={set('nom')} style={inputStyle} placeholder="Ex: Club Sportif de Lyon" />
            </div>
            <div>
              <label style={labelStyle}>Slogan</label>
              <input value={form.slogan} onChange={set('slogan')} style={inputStyle} placeholder="Ex: Ensemble, on va plus loin" />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={set('description')} rows={4}
                style={{ ...inputStyle, resize: 'vertical' }} placeholder="Décrivez votre organisation…" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Ville</label>
                <input value={form.ville} onChange={set('ville')} style={inputStyle} placeholder="Paris" />
              </div>
              <div>
                <label style={labelStyle}>Pays</label>
                <input value={form.pays} onChange={set('pays')} style={inputStyle} placeholder="France" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Site web</label>
              <input value={form.site_web} onChange={set('site_web')} style={inputStyle} placeholder="https://…" type="url" />
            </div>
            <div>
              <label style={labelStyle}>Email de contact</label>
              <input value={form.email_contact} onChange={set('email_contact')} style={inputStyle} placeholder="contact@…" type="email" />
            </div>
            <div>
              <label style={labelStyle}>Téléphone</label>
              <input value={form.telephone} onChange={set('telephone')} style={inputStyle} placeholder="+33 6 …" type="tel" />
            </div>
          </div>
        </div>

        {/* ── Visibilité ── */}
        <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #E8E0D0', marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 'bold', color: '#1A1410', marginBottom: 12 }}>👁️ Visibilité</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.visible}
              onChange={e => setForm(f => ({ ...f, visible: e.target.checked }))}
              style={{ accentColor: '#C8431A', width: 18, height: 18, flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: '#1A1410' }}>Organisation publique</span>
          </label>
          <p style={{ fontSize: 12, color: '#8C5A40', marginTop: 8 }}>
            Si activé, votre organisation apparaît dans /organisations et est découvrable par tous.
          </p>
        </div>

        {/* ── Bouton sauvegarder ── */}
        <button onClick={handleSave} disabled={saving}
          style={{ width: '100%', background: saving ? 'rgba(200,67,26,0.6)' : '#C8431A', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer', marginBottom: 8 }}>
          {saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}
        </button>
        {saved && (
          <p style={{ color: '#2D9E6B', fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
            ✓ Paramètres enregistrés
          </p>
        )}

        {/* ── Zone dangereuse ── */}
        <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid rgba(200,67,26,0.3)', marginTop: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 'bold', color: '#C8431A', marginBottom: 12 }}>⚠️ Zone dangereuse</h2>
          {!confirmerSuppr ? (
            <button onClick={() => setConfirmerSuppr(true)}
              style={{ background: 'rgba(200,67,26,0.1)', color: '#C8431A', border: '1px solid rgba(200,67,26,0.4)', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>
              🗑️ Supprimer l&apos;organisation
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 13, color: '#1A1410', fontWeight: 'bold' }}>
                Confirmer la suppression ? Cette action est irréversible.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleDelete} disabled={suppression}
                  style={{ flex: 1, background: '#C8431A', color: 'white', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 'bold', cursor: suppression ? 'not-allowed' : 'pointer' }}>
                  {suppression ? 'Suppression…' : 'Oui, supprimer'}
                </button>
                <button onClick={() => setConfirmerSuppr(false)}
                  style={{ flex: 1, background: '#F0EBE3', color: '#8C5A40', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
