import { SupabaseClient } from '@supabase/supabase-js'

export interface ResultatLiaison {
  linked: boolean
  enqueteurId?: string
  statutCandidature: 'en_attente' | 'valide' | 'rejete' | null
}

export async function lierEnqueteurSiEmailCorrespond(
  admin: SupabaseClient,
  userId: string,
  email: string
): Promise<ResultatLiaison> {
  const emailNorm = email.trim().toLowerCase()

  const { data: lie } = await admin
    .from('enqueteurs')
    .update({ user_id: userId })
    .eq('email', emailNorm)
    .is('user_id', null)
    .select('id')
    .maybeSingle()

  if (lie) {
    return { linked: true, enqueteurId: lie.id, statutCandidature: 'valide' }
  }

  const { data: candidature } = await admin
    .from('enqueteurs_consentements')
    .select('statut_traitement')
    .eq('email', emailNorm)
    .order('signature_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    linked: false,
    statutCandidature: (candidature?.statut_traitement as ResultatLiaison['statutCandidature']) ?? null,
  }
}
