'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams, useRouter } from 'next/navigation'

export default function EvenementPage() {
  const { id } = useParams()
  const router = useRouter()
  const [ev, setEv] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('evenements').select('*').eq('id', id).single().then(({ data }) => {
      setEv(data)
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-gray-400">Chargement...</p>
    </main>
  )

  if (!ev) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-gray-400">Evenement introuvable.</p>
    </main>
  )

  const urlEvenement = 'https://app.lotbo.app/evenement/' + ev.id
  const texteWhatsapp = 'Decouvre cet evenement sur Lotbo : ' + ev.titre + ' - ' + urlEvenement
  const urlWhatsapp = 'https://wa.me/?text=' + encodeURIComponent(texteWhatsapp)
  const urlFacebook = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(urlEvenement)

  return (
    <main className="min-h-screen bg-black text-white">

      {ev.image_url && (
        <div className="w-full h-64 overflow-hidden">
          <img src={ev.image_url} alt={ev.titre} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-2xl mx-auto p-8">

        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white text-sm mb-6 flex items-center gap-2">
          Retour a la carte
        </button>

        <h1 className="text-4xl font-bold mb-4">{ev.titre}</h1>

        <div className="flex gap-2 flex-wrap mb-6">
          <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">{ev.categorie}</span>
          <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">{ev.acces || 'public'}</span>
          <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">{ev.prix || 'gratuit'}</span>
        </div>

        <div className="flex flex-col gap-3 text-gray-300 mb-8">
          <p>📍 <span className="text-white">{ev.lieu}</span></p>
          <p>📅 <span className="text-white">{ev.date}</span></p>
          {ev.heure_fin && <p>⏰ <span className="text-white">Fin a {ev.heure_fin}</span></p>}
        </div>

        {ev.description && (
          <div className="bg-gray-900 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold mb-3">A propos</h2>
            <p className="text-gray-300 leading-relaxed">{ev.description}</p>
          </div>
        )}

        {ev.lien && (
          <a href={ev.lien} target="_blank"
            className="block w-full text-center bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl mb-4">
            Plus de details
          </a>
        )}

        <div className="flex gap-3 mt-4">
          <a href={urlWhatsapp} target="_blank"
            className="flex-1 text-center bg-green-700 hover:bg-green-600 text-white font-bold py-3 rounded-xl">
            WhatsApp
          </a>
          <a href={urlFacebook} target="_blank"
            className="flex-1 text-center bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 rounded-xl">
            Facebook
          </a>
        </div>

      </div>
    </main>
  )
}