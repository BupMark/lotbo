'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Profil() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [evenements, setEvenements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push('/login')
        return
      }
      setUser(data.session.user)

      const { data: evs } = await supabase
        .from('evenements')
        .select('*')
        .eq('user_id', data.session.user.id)
        .order('created_at', { ascending: false })
      setEvenements(evs || [])
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-gray-400">Chargement...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mon Profil</h1>
          <a href="/" className="text-gray-400 hover:text-white text-sm">Retour a la carte</a>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-2xl font-bold">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-lg">{user?.email}</p>
              <p className="text-gray-400 text-sm">Organisateur Lotbo</p>
            </div>
          </div>
          <div className="mt-4 flex gap-4">
            <div className="bg-gray-800 rounded-lg p-3 text-center flex-1">
              <p className="text-2xl font-bold text-green-400">{evenements.length}</p>
              <p className="text-gray-400 text-xs">Evenements</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center flex-1">
              <p className="text-2xl font-bold text-green-400">
                {evenements.filter(ev => ev.statut === 'approuve').length}
              </p>
              <p className="text-gray-400 text-xs">Approuves</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center flex-1">
              <p className="text-2xl font-bold text-yellow-400">
                {evenements.filter(ev => ev.statut === 'en_attente').length}
              </p>
              <p className="text-gray-400 text-xs">En attente</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Mes evenements</h2>
          <a href="/ajouter" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold">
            + Ajouter
          </a>
        </div>

        {evenements.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-8 text-center">
            <p className="text-gray-400 mb-4">Tu n'as pas encore publie d'evenement</p>
            <a href="/ajouter" className="bg-green-600 text-white px-6 py-3 rounded-full font-bold">
              Publier mon premier evenement
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {evenements.map(ev => (
              <div key={ev.id} className="bg-gray-900 rounded-xl p-4 flex gap-4 items-start">
                {ev.image_url && (
                  <img src={ev.image_url} alt={ev.titre} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="font-bold">{ev.titre}</h3>
                  <p className="text-gray-400 text-sm">{ev.lieu}</p>
                  <p className="text-gray-400 text-sm">{ev.date}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="bg-green-900 text-green-400 px-2 py-1 rounded text-xs">{ev.categorie}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      ev.statut === 'approuve' ? 'bg-green-900 text-green-400' :
                      ev.statut === 'rejete' ? 'bg-red-900 text-red-400' :
                      'bg-yellow-900 text-yellow-400'
                    }`}>
                      {ev.statut === 'approuve' ? 'Approuve' : ev.statut === 'rejete' ? 'Rejete' : 'En attente'}
                    </span>
                  </div>
                </div>
                <a href={'/evenement/' + ev.id} className="text-gray-400 hover:text-white text-sm">
                  Voir
                </a>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}