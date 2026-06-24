/**
 * @file FichesPage.tsx
 * MODIFICATION : ajout de la météo dans NouvelleFicheModal (une par jour)
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, FileText, Calendar, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLayout }   from '../../components/layout/PageLayout'
import { Button }       from '../../components/ui/Button'
import { Badge }        from '../../components/ui/Badge'
import { Card }         from '../../components/ui/Card'
import { Modal }        from '../../components/ui/Modal'
import { SpinnerPage }  from '../../components/ui/Spinner'
import { useAuth }      from '../../hooks/useAuth'
import { fichesService } from '../../services/fiches.service'
import { CONDITIONS_METEO } from '../../constants/mission.constants'
import type { StatutFiche } from '../../types/api.types'

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(new Date(dateString))
}

function getStatutFicheLabel(statut: StatutFiche) {
  const labels: Record<StatutFiche, string> = {
    BROUILLON: 'Brouillon', SOUMISE: 'Soumise',
    VALIDEE: 'Validée',    REJETEE: 'Rejetée'
  }
  return labels[statut] ?? statut
}

// ─── FILTRE STATUT ────────────────────────────────────────────────

function StatutFilter({
  value, onChange
}: {
  value: StatutFiche | undefined
  onChange: (statut: StatutFiche | undefined) => void
}) {
  const statuts: { value: StatutFiche | undefined; label: string }[] = [
    { value: undefined,    label: 'Toutes'    },
    { value: 'BROUILLON', label: 'Brouillon' },
    { value: 'SOUMISE',   label: 'Soumises'  },
    { value: 'VALIDEE',   label: 'Validées'  },
    { value: 'REJETEE',   label: 'Rejetées'  },
  ]
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
      {statuts.map((s) => (
        <button
          key={s.label}
          onClick={() => onChange(s.value)}
          className={`
            flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium
            transition-colors duration-150 whitespace-nowrap
            ${value === s.value
              ? 'bg-[#0D3B66] text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-[#1B6B93]'
            }
          `}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

// ─── CARTE FICHE ──────────────────────────────────────────────────

function FicheCard({
  fiche, onClick
}: {
  fiche: {
    id: string; date: string; statut: StatutFiche
    brigade: { nom: string }
    _count: { missions: number }
    observations: string | null
    conditionMeteo?: string | null
  }
  onClick: () => void
}) {
  const badgeVariant: Record<StatutFiche, 'brouillon' | 'soumise' | 'validee' | 'rejetee'> = {
    BROUILLON: 'brouillon', SOUMISE: 'soumise',
    VALIDEE: 'validee',     REJETEE: 'rejetee'
  }

  // Emoji météo
  const meteoEmoji: Record<string, string> = {
    BEAU: '☀️', NUAGEUX: '⛅', PLUIE: '🌧️', VENT_FORT: '💨', BROUILLARD: '🌫️'
  }

  return (
    <Card onClick={onClick}>
      <div className="p-4 flex items-center gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-[#D9EAF5] rounded-xl flex items-center justify-center">
          <FileText size={18} className="text-[#0D3B66]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <Calendar size={14} className="text-gray-400" />
              {formatDate(fiche.date)}
            </div>
            <Badge variant={badgeVariant[fiche.statut]}>
              {getStatutFicheLabel(fiche.statut)}
            </Badge>
            {/* Météo en emoji — compact */}
            {fiche.conditionMeteo && (
              <span className="text-base" title={fiche.conditionMeteo}>
                {meteoEmoji[fiche.conditionMeteo] ?? ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="font-medium text-[#1B6B93]">
              {fiche.brigade?.nom ?? 'Brigade inconnue'}
            </span>
            <span>·</span>
            <span>
              {fiche._count?.missions ?? 0} réception{(fiche._count?.missions ?? 0) !== 1 ? 's' : ''}
            </span>
          </div>
          {fiche.observations && (
            <p className="text-xs text-gray-400 mt-1 truncate">{fiche.observations}</p>
          )}
        </div>
        <ChevronRight size={18} className="flex-shrink-0 text-gray-300" />
      </div>
    </Card>
  )
}

// ─── MODAL NOUVELLE FICHE ─────────────────────────────────────────
// Météo ajoutée ici — une seule météo par jour, par fiche

function NouvelleFicheModal({
  isOpen, onClose, onSuccess
}: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate]               = useState(today)
  const [conditionMeteo, setMeteo]    = useState('')
  const [observations, setObservations] = useState('')
  const [loading, setLoading]         = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fichesService.create({
        date,
        conditionMeteo: conditionMeteo || undefined,
        observations:   observations   || undefined,
      })
      toast.success('Fiche créée avec succès')
      onSuccess()
      onClose()
      // Reset
      setDate(today)
      setMeteo('')
      setObservations('')
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { code?: string } } }
      if (axiosError.response?.data?.code === 'CONFLICT') {
        toast.error('Une fiche existe déjà pour cette date')
      } else {
        toast.error('Erreur lors de la création')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle fiche journalière">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full h-14 px-4 rounded-xl border-2 border-gray-200 text-base focus:outline-none focus:border-[#1B6B93] focus:ring-2 focus:ring-[#D9EAF5]"
          />
        </div>

        {/* Météo — sélection par emoji */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Conditions météo <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {CONDITIONS_METEO.map((m) => {
              const emojis: Record<string, string> = {
                BEAU: '☀️', NUAGEUX: '⛅', PLUIE: '🌧️', VENT_FORT: '💨', BROUILLARD: '🌫️'
              }
              const isSelected = conditionMeteo === m.value
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMeteo(isSelected ? '' : m.value)}
                  className={`
                    h-14 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5
                    text-xs font-medium transition-all active:scale-95
                    ${isSelected
                      ? 'border-[#1B6B93] bg-[#D9EAF5] text-[#0D3B66]'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-[#1B6B93]'
                    }
                  `}
                  title={m.label}
                >
                  <span className="text-xl">{emojis[m.value]}</span>
                  <span className="text-[9px] leading-none text-center px-1">
                    {m.label.split(' ')[0]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Observations */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Observations <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Remarques générales sur la journée..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base resize-none focus:outline-none focus:border-[#1B6B93] focus:ring-2 focus:ring-[#D9EAF5]"
          />
          <div className="text-xs text-gray-400 text-right">
            {observations.length}/500
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" size="md" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="md" loading={loading} className="flex-1">
            Créer la fiche
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────

export function FichesPage() {
  const { isBrigade } = useAuth()
  const navigate      = useNavigate()

  const [statutFilter, setStatutFilter] = useState<StatutFiche | undefined>(undefined)
  const [page, setPage]     = useState(1)
  const [showModal, setShowModal] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['fiches', statutFilter, page],
    queryFn:  () => fichesService.getAll({ statut: statutFilter, page, limit: 10 })
  })

  if (isLoading) return <SpinnerPage />

  if (isError) return (
    <PageLayout title="Fiches journalières">
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Erreur de chargement</p>
        <Button variant="secondary" onClick={() => refetch()}>Réessayer</Button>
      </div>
    </PageLayout>
  )

  const fiches     = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <PageLayout
      title="Fiches journalières"
      action={isBrigade ? (
        <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span className="hidden sm:inline">Nouvelle fiche</span>
        </Button>
      ) : undefined}
    >
      <div className="mb-4">
        <StatutFilter value={statutFilter} onChange={(s) => { setStatutFilter(s); setPage(1) }} />
      </div>

      {fiches.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-gray-400" />
          </div>
          <h3 className="text-gray-600 font-medium mb-1">
            {statutFilter
              ? `Aucune fiche ${getStatutFicheLabel(statutFilter).toLowerCase()}`
              : 'Aucune fiche journalière'
            }
          </h3>
          {isBrigade && !statutFilter && (
            <p className="text-gray-400 text-sm mb-4">Créez votre première fiche journalière</p>
          )}
          {isBrigade && (
            <Button variant="primary" size="md" onClick={() => setShowModal(true)} className="mx-auto w-auto">
              <Plus size={18} />
              Nouvelle fiche
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {fiches.map((fiche) => (
            <FicheCard key={fiche.id} fiche={fiche} onClick={() => navigate(`/fiches/${fiche.id}`)} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
            ← Précédent
          </Button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
            Suivant →
          </Button>
        </div>
      )}

      <NouvelleFicheModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => refetch()}
      />
    </PageLayout>
  )
}