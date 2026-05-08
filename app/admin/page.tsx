'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Admin() {
  const router = useRouter()
  const [evenements, setEvenements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/login')
      } else {
        setUser(data.session.user)
        chargerEvenements()
      }
    })
  }, [])

  const chargerEvenements = async () => {
    const { data } = await supabase
      .from('evenements')
      .select('*')
      .order('created_at', { ascending: false })
    setEvenements(data || [])
    setLoading(false)
  }

  const supprimer = async (id: string) => {
    if (!confirm('Supprimer cet événement ?')) return
    await supabase.from('evenements').delete().eq('id', id)
    setEvenements(evenements.filter(ev => ev.id !== id))
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Panel Admin</h1>
          <a href="/" className="text-gray-400 hover:text-white text-sm">Retour a la carte</a>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 mb-6">
          <p className="text-gray-400 text-sm">Connecte en tant que <span className="text-green-400">{user?.email}</span></p>
          <p className="text-gray-400 text-sm mt-1">Total : <span className="text-white font-bold">{evenements.length} evenements</span></p>
        </div>

        {loading ? (
          <p className="text-gray-400">Chargement...</p>
        ) : (
          <div className="flex flex-col gap-4">
            {evenements.map(ev => (
              <div key={ev.id} className="bg-gray-900 rounded-xl p-4 flex gap-4 items-start">

                {ev.image_url && (
                  <img src={ev.image_url} alt={ev.titre} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                )}

                <div className="flex-1">
                  <h2 className="font-bold text-lg">{ev.titre}</h2>
                  <p className="text-gray-400 text-sm">{ev.lieu}</p>
                  <p className="text-gray-400 text-sm">{ev.date}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="bg-green-900 text-green-400 px-2 py-1 rounded text-xs">{ev.categorie}</span>
                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">{ev.acces}</span>
                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">{ev.prix}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <a href={'/evenement/' + ev.id} target="_blank" className="bg-gray-800 text-white px-3 py-2 rounded-lg text-xs text-center">
                    Voir
                  </a>
                  <button onClick={() => supprimer(ev.id)} className="bg-red-900 text-red-400 px-3 py-2 rounded-lg text-xs">
                    Supprimer
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}