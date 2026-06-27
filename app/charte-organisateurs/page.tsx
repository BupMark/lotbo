import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Charte des organisateurs · LOTBO",
  description: "En publiant un événement en tant qu'organisateur sur LOTBO, vous vous engagez à respecter la présente charte.",
}

const s = {
  section: { marginBottom: 40 } as React.CSSProperties,
  numBadge: {
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    background: 'rgba(200,67,26,0.15)', border: '1px solid rgba(200,67,26,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#C8431A', fontSize: 13, fontWeight: 700,
  } as React.CSSProperties,
  h2: {
    fontFamily: 'Georgia, serif', fontStyle: 'italic',
    fontSize: 'clamp(18px, 3vw, 22px)',
    fontWeight: 700, color: '#F7F2E8', lineHeight: 1.3, marginTop: 4,
  } as React.CSSProperties,
  body: { color: '#E8E0D0', fontSize: 14, lineHeight: 1.7 } as React.CSSProperties,
  divider: { height: 1, background: '#2a2a2a', marginTop: 40 } as React.CSSProperties,
  list: { paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 } as React.CSSProperties,
  italic: { color: '#8C5A40', fontSize: 13, fontStyle: 'italic', lineHeight: 1.6 } as React.CSSProperties,
}

export default function CharteOrganisateurs() {
  return (
    <main style={{ minHeight: '100dvh', background: '#1A1410', color: '#F7F2E8', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header sticky */}
      <div style={{ background: '#1A1410', borderBottom: '1px solid #2a2a2a', padding: '16px 20px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>← Retour</a>
        <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 20, fontWeight: 'bold', marginLeft: 'auto', marginRight: 'auto' }}>
          <span style={{ color: '#F7F2E8' }}>lot</span><span style={{ color: '#C8431A' }}>bo</span>
        </div>
        <div style={{ width: 48 }} />
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Titre */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ color: '#C8431A', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontWeight: 600 }}>Légal</p>
          <h1 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 700, color: '#F7F2E8', lineHeight: 1.15, marginBottom: 16 }}>
            Charte des organisateurs
          </h1>
          <p style={{ color: '#8C5A40', fontSize: 13, lineHeight: 1.6 }}>
            Dernière mise à jour : <strong style={{ color: '#F7F2E8' }}>23 juin 2026</strong><br />
            En publiant un événement en tant qu&apos;organisateur sur LOTBO, tu t&apos;engages à respecter la présente charte.
          </p>
        </div>

        <div style={{ height: 1, background: '#2a2a2a', marginBottom: 40 }} />

        {/* §1 */}
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={s.numBadge}>1</div>
            <h2 style={s.h2}>Qui est organisateur ?</h2>
          </div>
          <div style={{ paddingLeft: 48 }}>
            <p style={s.body}>Est organisateur toute personne ou entité qui publie un événement dont elle est à l&apos;origine ou qu&apos;elle représente officiellement. L&apos;organisateur se distingue du contributeur, qui publie des événements repérés sans en être l&apos;initiateur.</p>
          </div>
          <div style={s.divider} />
        </div>

        {/* §2 */}
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={s.numBadge}>2</div>
            <h2 style={s.h2}>Qualité des informations</h2>
          </div>
          <div style={{ paddingLeft: 48 }}>
            <p style={{ ...s.body, marginBottom: 12 }}>En publiant un événement, tu déclares et garantis que :</p>
            <ul style={s.list}>
              <li style={s.body}>Les informations fournies sont exactes, complètes et à jour au moment de la publication</li>
              <li style={s.body}>Tu es autorisé à publier cet événement</li>
              <li style={s.body}>Le contenu ne viole aucun droit de tiers (droits d&apos;auteur, marques, droits à l&apos;image)</li>
              <li style={s.body}>L&apos;événement est réel et n&apos;est pas du spam ou du contenu frauduleux</li>
              <li style={s.body}>Tu informeras LOTBO sans délai en cas d&apos;annulation ou de modification substantielle</li>
              <li style={s.body}>Tu es seul responsable de l&apos;obtention de toutes les autorisations, permis et assurances requis par les lois locales. LOTBO ne vérifie pas et ne garantit pas cette conformité.</li>
            </ul>
          </div>
          <div style={s.divider} />
        </div>

        {/* §3 */}
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={s.numBadge}>3</div>
            <h2 style={s.h2}>Contenu interdit</h2>
          </div>
          <div style={{ paddingLeft: 48 }}>
            <ul style={s.list}>
              <li style={s.body}>Contenu haineux, discriminatoire, raciste ou incitant à la violence</li>
              <li style={s.body}>Événements fictifs ou trompeurs</li>
              <li style={s.body}>Publicité déguisée ou spam</li>
              <li style={s.body}>Contenu portant atteinte à la vie privée d&apos;autrui</li>
              <li style={s.body}>Activités illégales ou non autorisées</li>
              <li style={s.body}>Contenu à caractère sexuellement explicite</li>
            </ul>
          </div>
          <div style={s.divider} />
        </div>

        {/* §4 */}
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={s.numBadge}>4</div>
            <h2 style={s.h2}>Gestion de ton événement</h2>
          </div>
          <div style={{ paddingLeft: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <p style={{ ...s.body, color: '#F7F2E8', fontWeight: 600, marginBottom: 8 }}>Modification et suppression</p>
              <p style={s.body}>Tu peux modifier ou supprimer ton événement à tout moment depuis ton tableau de bord organisateur. En cas d&apos;annulation, informe LOTBO dans les meilleurs délais pour que les participants puissent être notifiés.</p>
            </div>
            <div>
              <p style={{ ...s.body, color: '#F7F2E8', fontWeight: 600, marginBottom: 8 }}>Passage en mode privé</p>
              <p style={s.body}>Tu peux demander le passage de ton événement en mode privé (masqué de la carte publique). L&apos;événement reste en base de données sans être affiché. Tu peux continuer à y accéder et le modifier depuis ton tableau de bord, comme pour tout autre événement dont tu es propriétaire. Cette option est gratuite et sans délai minimum.</p>
              <p style={{ ...s.italic, marginTop: 8 }}>LOTBO ne gère pas les listes d&apos;invités ni le contrôle d&apos;accès. La gestion des invitations s&apos;effectue exclusivement en dehors de LOTBO.</p>
            </div>
            <div>
              <p style={{ ...s.body, color: '#F7F2E8', fontWeight: 600, marginBottom: 8 }}>Suppression complète</p>
              <p style={s.body}>Tu peux demander la suppression définitive de ton événement via privacy@lotbo.app. Cette demande est traitée dans un délai de 48 heures ouvrées. Un flag interne empêche la réimportation automatique de l&apos;événement.</p>
            </div>
          </div>
          <div style={s.divider} />
        </div>

        {/* §5 */}
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={s.numBadge}>5</div>
            <h2 style={s.h2}>Réclamation de propriété (CLAIM-1)</h2>
          </div>
          <div style={{ paddingLeft: 48 }}>
            <p style={s.body}>Si un contributeur a publié un de tes événements à ta place, tu peux en réclamer la propriété via le formulaire CLAIM-1 accessible sur la page de l&apos;événement. En cas de preuves suffisantes, LOTBO transfère la propriété dans un délai de 48 heures ouvrées. Le contributeur reçoit une notification.</p>
          </div>
          <div style={s.divider} />
        </div>

        {/* §6 */}
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={s.numBadge}>6</div>
            <h2 style={s.h2}>Co-organisation</h2>
          </div>
          <div style={{ paddingLeft: 48 }}>
            <p style={s.body}>LOTBO permet de désigner plusieurs co-organisateurs pour un même événement. Le propriétaire principal conserve les droits de modification et de suppression. Chaque co-organisateur est individuellement responsable du contenu associé à son rôle.</p>
          </div>
          <div style={s.divider} />
        </div>

        {/* §7 */}
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={s.numBadge}>7</div>
            <h2 style={s.h2}>Sanctions</h2>
          </div>
          <div style={{ paddingLeft: 48 }}>
            <p style={{ ...s.body, marginBottom: 12 }}>En cas de violation de la présente charte, LOTBO se réserve le droit de :</p>
            <ul style={s.list}>
              <li style={s.body}>Rejeter ou supprimer l&apos;événement concerné sans préavis</li>
              <li style={s.body}>Suspendre ou supprimer le compte organisateur</li>
              <li style={s.body}>Signaler le contenu aux autorités compétentes en cas de contenu illégal</li>
            </ul>
            <p style={{ ...s.body, marginTop: 12 }}>Tout organisateur dont l&apos;événement a été refusé ou supprimé peut contacter LOTBO à <a href="mailto:hello@lotbo.app" style={{ color: '#C8431A' }}>hello@lotbo.app</a> pour contester la décision.</p>
          </div>
          <div style={s.divider} />
        </div>

        {/* §8 */}
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={s.numBadge}>8</div>
            <h2 style={s.h2}>Contact</h2>
          </div>
          <div style={{ paddingLeft: 48, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={s.body}>Des questions sur ta publication ? <a href="mailto:hello@lotbo.app" style={{ color: '#C8431A' }}>hello@lotbo.app</a></p>
            <p style={s.body}>Demande de suppression de données : <a href="mailto:privacy@lotbo.app" style={{ color: '#C8431A' }}>privacy@lotbo.app</a></p>
          </div>
          <div style={s.divider} />
        </div>

        {/* Contact final */}
        <div style={{ background: 'rgba(200,67,26,0.08)', border: '1px solid rgba(200,67,26,0.2)', borderRadius: 16, padding: '24px 20px', textAlign: 'center', marginTop: 8 }}>
          <p style={{ color: '#F7F2E8', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Une question sur ta publication ?</p>
          <p style={{ color: '#8C5A40', fontSize: 13, marginBottom: 16 }}>Bup Mark Ltd · Office 12, Initial Business Centre, Manchester M40 8WN, UK</p>
          <a href="mailto:hello@lotbo.app" style={{ background: '#C8431A', color: '#F7F2E8', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 'bold', textDecoration: 'none', display: 'inline-block' }}>
            hello@lotbo.app
          </a>
        </div>

      </div>
    </main>
  )
}
