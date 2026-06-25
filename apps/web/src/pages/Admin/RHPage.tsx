/**
 * @file RHPage.tsx
 * @description M10 — Gestion RH.
 * Liste des ressources affectées au projet avec flag GEOCODING / Externe.
 * Gestion des demandes de congé, attestations.
 *
 * ROUTES : /rh
 * ACCÈS  : ADMIN, IGT (Assistante via rôle ADMIN)
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserCheck, Users, Briefcase, Calendar, Plus, FileText, Filter } from 'lucide-react'
import { PageLayout }  from '../../components/layout/PageLayout'
import { Card }        from '../../components/ui/Card'
import { Button }      from '../../components/ui/Button'
import { Badge }       from '../../components/ui/Badge'
import { SpinnerPage } from '../../components/ui/Spinner'
import api from '../../services/api'
import toast from 'react-hot-toast'

// ─── TYPES ────────────────────────────────────────────────────────

interface Ressource {
  id:        string
  nom:       string
  prenom:    string
  email:     string
  role:      string
  gsm?:      string
  brigadeId?: string
  brigade?:   { nom: string }
  actif:     boolean
  flagRh?:   'GEOCODING' | 'EXTERNE'
}

// ─── HELPERS ──────────────────────────────────────────────────────

function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    BRIGADE: 'Chef de brigade — Topographe',
    IGT:     'IGT — Chef de projet',
    ADMIN:   'Administrateur — DP',
  }
  return map[role] ?? role
}

function getInitiales(nom: string, prenom: string) {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()
}

function getAvatarColor(role: string) {
  const colors: Record<string, string> = {
    BRIGADE: 'bg-[#1B6B93] text-white',
    IGT:     'bg-[#00897B] text-white',
    ADMIN:   'bg-[#0D3B66] text-white',
  }
  return colors[role] ?? 'bg-gray-400 text-white'
}

// ─── PAGE ─────────────────────────────────────────────────────────

export function RHPage() {
  const [filtre, setFiltre] = useState<'TOUS' | 'GEOCODING' | 'EXTERNE' | 'CONGE'>('TOUS')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['users-all'],
    queryFn:  async () => {
      const { data } = await api.get('/users')
      return (data.users ?? data.data ?? []) as Ressource[]
    },
  })

  if (isLoading) return <SpinnerPage />

  const ressources = data ?? []
  const geocoding  = ressources.filter(r => r.flagRh !== 'EXTERNE' && r.actif)
  const externes   = ressources.filter(r => r.flagRh === 'EXTERNE' && r.actif)
  const total      = ressources.filter(r => r.actif).length

  const filtrees = filtre === 'TOUS'      ? ressources.filter(r => r.actif)
                 : filtre === 'GEOCODING' ? geocoding
                 : filtre === 'EXTERNE'   ? externes
                 : ressources.filter(r => r.actif) // CONGE — à implémenter

  return (
    <PageLayout
      title="Ressources RH"
      action={
        <Button variant="primary" size="sm" onClick={() => {}}>
          <FileText size={16} />
          Attestation de travail
        </Button>
      }
    >
      <div className="space-y-4">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <Card.Body>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#0D3B66]">{total}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Effectif projet</div>
                  <div className="text-xs text-gray-400">affecté au stade</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#D9EAF5]">
                  <Users size={20} className="text-[#1B6B93]" />
                </div>
              </div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#1B6B93]">{geocoding.length}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Ressources GEOCODING</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#D9EAF5]">
                  <Briefcase size={20} className="text-[#1B6B93]" />
                </div>
              </div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-600">{externes.length}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Ressources externes</div>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-100">
                  <UserCheck size={20} className="text-gray-500" />
                </div>
              </div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">0</div>
                  <div className="text-xs text-gray-500 mt-0.5">En congé</div>
                  <div className="text-xs text-gray-400">ce mois</div>
                </div>
                <div className="p-2.5 rounded-xl bg-orange-50">
                  <Calendar size={20} className="text-orange-500" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* ── FILTRES ── */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['TOUS', 'GEOCODING', 'EXTERNE', 'CONGE'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtre === f
                  ? 'bg-[#0D3B66] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-[#1B6B93]'
              }`}
            >
              {f === 'TOUS' ? 'Tous' : f === 'CONGE' ? 'Congés' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* ── LISTE RESSOURCES ── */}
        <Card>
          <Card.Body className="p-0">
            {filtrees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Users size={28} className="mb-2 text-gray-200" />
                <p className="text-sm">Aucune ressource dans cette catégorie</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtrees.map((r) => (
                  <div key={r.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarColor(r.role)}`}>
                      {getInitiales(r.nom, r.prenom)}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {r.prenom} {r.nom}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          r.flagRh === 'EXTERNE'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-[#D9EAF5] text-[#1B6B93]'
                        }`}>
                          {r.flagRh === 'EXTERNE' ? 'Externe' : 'GEOCODING'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {getRoleLabel(r.role)}
                        {r.brigade && ` · ${r.brigade.nom}`}
                      </div>
                      {r.gsm && (
                        <div className="text-xs text-gray-400 mt-0.5">{r.gsm}</div>
                      )}
                    </div>

                    {/* Action congé */}
                    <Button variant="secondary" size="sm" onClick={() => {}}>
                      Congés
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>

      </div>
    </PageLayout>
  )
}