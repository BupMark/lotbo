'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Granularite = 'jour' | 'semaine' | 'mois'

interface DonneesGraphique {
  granularite: Granularite
  evenements_soumis: Record<string, number>
  evenements_approuves: Record<string, number>
  nouveaux_membres: Record<string, number>
  membres_actifs: Record<string, number>
}

interface Props {
  accessToken: string
}

const LABELS_GRANULARITE: Record<Granularite, string> = {
  jour: 'Par jour',
  semaine: 'Par semaine',
  mois: 'Par mois',
}

function fusionnerSeries(donnees: DonneesGraphique | null) {
  if (!donnees) return []
  const toutesLesCles = new Set([
    ...Object.keys(donnees.evenements_soumis),
    ...Object.keys(donnees.evenements_approuves),
    ...Object.keys(donnees.nouveaux_membres),
    ...Object.keys(donnees.membres_actifs),
  ])
  return Array.from(toutesLesCles)
    .sort()
    .map(cle => ({
      periode: cle,
      'Événements soumis': donnees.evenements_soumis[cle] || 0,
      'Événements approuvés': donnees.evenements_approuves[cle] || 0,
      'Nouveaux membres': donnees.nouveaux_membres[cle] || 0,
      'Membres actifs': donnees.membres_actifs[cle] || 0,
    }))
}

export default function GraphiqueStatsAdmin({ accessToken }: Props) {
  const [granularite, setGranularite] = useState<Granularite>('jour')
  const [donnees, setDonnees] = useState<DonneesGraphique | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/stats-temporelles?granularite=${granularite}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(setDonnees)
      .catch(() => setDonnees(null))
      .finally(() => setLoading(false))
  }, [granularite, accessToken])

  const data = fusionnerSeries(donnees)

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', borderRadius: 12, padding: 20, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <p style={{ color: '#F7F2E8', fontSize: 14, fontWeight: 'bold', margin: 0 }}>📈 Statistiques temporelles</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['jour', 'semaine', 'mois'] as Granularite[]).map(g => (
            <button
              key={g}
              onClick={() => setGranularite(g)}
              style={{
                background: granularite === g ? '#C8431A' : 'rgba(255,255,255,0.06)',
                color: granularite === g ? 'white' : '#8C5A40',
                border: 'none', borderRadius: 8, padding: '6px 12px',
                fontSize: 12, fontWeight: 'bold', cursor: 'pointer',
              }}
            >
              {LABELS_GRANULARITE[g]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#8C5A40', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Chargement…</p>
      ) : data.length === 0 ? (
        <p style={{ color: '#8C5A40', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Aucune donnée disponible pour cette période.</p>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="periode" stroke="#8C5A40" style={{ fontSize: 11 }} />
            <YAxis stroke="#8C5A40" style={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1A1410', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#F7F2E8' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Événements soumis" stroke="#C8431A" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Événements approuvés" stroke="#2D9E6B" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Nouveaux membres" stroke="#4A90D9" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Membres actifs" stroke="#D4A820" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
