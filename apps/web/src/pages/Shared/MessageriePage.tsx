/**
 * @file MessageriePage.tsx — M6
 * Messagerie interne IGT ↔ Brigades
 * MOCK : données statiques, à connecter à /api/messagerie
 */
import { useState } from 'react'
import { Send, Users } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { useAuth }    from '../../hooks/useAuth'

const MOCK_CONVERSATIONS = [
  { id: 'diffusion', nom: 'Diffusion générale', subtitle: 'Visible par toutes les équipes', unread: 0,
    messages: [
      { id: 1, auteur: 'Hakim CHAACHOUI (CP)', heure: 'Lun 08:05', texte: 'Bonjour à tous. Merci de prioriser les réceptions avant bétonnage cette semaine sur la Zone B.', moi: true },
      { id: 2, auteur: 'Hakim CHAACHOUI (CP)', heure: 'Lun 08:06', texte: 'Rappel : photos géoréférencées obligatoires pour chaque non-conformité.', moi: true },
    ]
  },
  { id: 'e01', nom: 'Équipe 01', subtitle: 'Bien reçu.', unread: 2,
    messages: [
      { id: 1, auteur: 'Hakim CHAACHOUI (CP)', heure: 'Lun 09:00', texte: 'Vous avez reçu les nouvelles tolérances pour les poteaux ?', moi: true },
      { id: 2, auteur: 'Marouane AIT KADIR', heure: 'Lun 09:15', texte: 'Oui, bien reçu. On applique dès aujourd\'hui.', moi: false },
    ]
  },
  { id: 'e02', nom: 'Équipe 02', subtitle: 'Merci, bonne journée.', unread: 0,
    messages: [
      { id: 1, auteur: 'Hakim CHAACHOUI (CP)', heure: 'Mar 08:00', texte: 'Zone B — priorité aux crémaillères axe B7 à B12 cette semaine.', moi: true },
      { id: 2, auteur: 'Youssef BENNANI',      heure: 'Mar 08:30', texte: 'Compris. Démarrage demain matin.', moi: false },
    ]
  },
  { id: 'e03', nom: 'Équipe 03', subtitle: 'Vignette du Kangoo bientôt échue, je signale.', unread: 1, messages: [] },
  { id: 'e04', nom: 'Équipe 04', subtitle: 'Pense au relevé km mensuel avant le 25.', unread: 0, messages: [] },
]

export function MessageriePage() {
  const { user } = useAuth()
  const [conv, setConv] = useState(MOCK_CONVERSATIONS[0])
  const [texte, setTexte] = useState('')

  const envoyer = () => {
    if (!texte.trim()) return
    setTexte('')
  }

  return (
    <PageLayout title="Messagerie interne">
      <div className="flex gap-0 h-[calc(100vh-140px)] rounded-2xl overflow-hidden border border-gray-200 bg-white">

        {/* ── SIDEBAR CONVERSATIONS ── */}
        <div className="w-72 flex-none border-r border-gray-100 flex flex-col bg-gray-50/50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {MOCK_CONVERSATIONS.map(c => (
              <button key={c.id} onClick={() => setConv(c)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white transition-colors border-b border-gray-100/50 ${conv.id === c.id ? 'bg-white border-l-4 border-l-[#1B6B93]' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                  c.id === 'diffusion' ? 'bg-[#0D3B66] text-white' : 'bg-[#D9EAF5] text-[#1B6B93]'
                }`}>
                  {c.id === 'diffusion' ? <Users size={18} /> : c.nom.slice(-2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 truncate">{c.nom}</span>
                    {c.unread > 0 && (
                      <span className="ml-2 w-5 h-5 rounded-full bg-[#1B6B93] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{c.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── ZONE MESSAGES ── */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">{conv.nom}</p>
            <p className="text-xs text-[#1B6B93]">{conv.subtitle}</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {conv.messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-300 text-sm">
                Aucun message — commencez la conversation
              </div>
            ) : (
              conv.messages.map(m => (
                <div key={m.id} className={`flex ${m.moi ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-lg px-4 py-3 rounded-2xl text-sm ${
                    m.moi
                      ? 'bg-[#0D3B66] text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    <p>{m.texte}</p>
                    <p className={`text-[10px] mt-1 ${m.moi ? 'text-white/60' : 'text-gray-400'}`}>
                      {m.auteur} · {m.heure}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <input
              type="text" value={texte}
              onChange={e => setTexte(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && envoyer()}
              placeholder={conv.id === 'diffusion' ? 'Écrire une instruction générale...' : `Message à ${conv.nom}...`}
              className="flex-1 h-12 px-4 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-[#1B6B93] bg-white"
            />
            <button onClick={envoyer}
              className="w-12 h-12 rounded-xl bg-[#0D3B66] text-white flex items-center justify-center hover:bg-[#1B6B93] transition-colors flex-shrink-0">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}