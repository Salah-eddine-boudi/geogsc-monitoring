/**
 * @file FichesPage.tsx
 * @description Page liste des fiches journalières.
 *
 * RÔLES :
 * → BRIGADE : voit seulement ses fiches + bouton "Nouvelle fiche"
 * → IGT/ADMIN : voit toutes les fiches + filtres avancés
 *
 * FONCTIONNALITÉS :
 * → Liste des fiches avec badge statut
 * → Filtre par statut (BROUILLON/SOUMISE/VALIDEE/REJETEE)
 * → Pagination
 * → Créer une nouvelle fiche (BRIGADE)
 * → Clic sur une fiche → FicheDetailPage
 *
 * REACT QUERY :
 * useQuery → récupère les fiches depuis l'API avec cache intelligent.
 * Si les données sont fraîches (< 5min) → pas de re-fetch.
 * Si l'onglet revient au focus → re-fetch automatique.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, FileText, Calendar, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLayout } from '../../components/layout/PageLayout'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { SpinnerPage } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { fichesService } from '../../services/fiches.service'
import type { StatutFiche } from '../../types/api.types'

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(dateString))
}

function getStatutFicheLabel(statut: StatutFiche) {
  switch (statut) {
    case 'BROUILLON':
      return 'Brouillon'
    case 'SOUMISE':
      return 'Soumise'
    case 'VALIDEE':
      return 'Validée'
    case 'REJETEE':
      return 'Rejetée'
    default:
      return statut
  }
}

// ─── COMPOSANT FILTRE STATUT ──────────────────────────────────────

/**
 * Boutons de filtre par statut.
 * "Tous" + un bouton par statut possible.
 */
function StatutFilter({
  value,
  onChange
}: {
  value: StatutFiche | undefined
  onChange: (statut: StatutFiche | undefined) => void
}) {
  const statuts: { value: StatutFiche | undefined; label: string }[] = [
    { value: undefined, label: 'Toutes' },
    { value: 'BROUILLON', label: 'Brouillon' },
    { value: 'SOUMISE', label: 'Soumises' },
    { value: 'VALIDEE', label: 'Validées' },
    { value: 'REJETEE', label: 'Rejetées' }
  ]

  return (
    // Scroll horizontal sur mobile si trop de boutons
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

// ─── COMPOSANT CARTE FICHE ────────────────────────────────────────

/**
 * FicheCard — représente une fiche dans la liste.
 *
 * Affiche :
 * → Date de la fiche
 * → Brigade (pour IGT)
 * → Nombre de missions
 * → Badge statut coloré
 * → Chevron pour indiquer que c'est cliquable
 */
function FicheCard({
  fiche,
  onClick
}: {
  fiche: {
    id: string
    date: string
    statut: StatutFiche
    brigade: { nom: string }  
    _count: { missions: number }
    observations: string | null
  }
  onClick: () => void
}) {
  // Map statut → variante Badge
  const badgeVariant: Record<StatutFiche, 'brouillon' | 'soumise' | 'validee' | 'rejetee'> = {
    BROUILLON: 'brouillon',
    SOUMISE: 'soumise',
    VALIDEE: 'validee',
    REJETEE: 'rejetee'
  }

  return (
    <Card onClick={onClick}>
      <div className="p-4 flex items-center gap-4">

        {/* Icône fichier */}
        <div className="flex-shrink-0 w-10 h-10 bg-[#D9EAF5] rounded-xl flex items-center justify-center">
          <FileText size={18} className="text-[#0D3B66]" />
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">

          {/* Ligne 1 : date + badge statut */}
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <Calendar size={14} className="text-gray-400" />
              {formatDate(fiche.date)}
            </div>
            <Badge variant={badgeVariant[fiche.statut]}>
              {getStatutFicheLabel(fiche.statut)}
            </Badge>
          </div>

          {/* Ligne 2 : brigade + nb missions */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="font-medium text-[#1B6B93]">
              {fiche.brigade?.nom ?? 'Brigade inconnue'}
            </span>
            <span>·</span>
            <span>
             {fiche._count?.missions ?? 0} mission{fiche._count.missions !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Observations (si présentes) — tronquées */}
          {fiche.observations && (
            <p className="text-xs text-gray-400 mt-1 truncate">
              {fiche.observations}
            </p>
          )}
        </div>

        {/* Chevron — indique que c'est cliquable */}
        <ChevronRight size={18} className="flex-shrink-0 text-gray-300" />
      </div>
    </Card>
  )
}

// ─── MODAL NOUVELLE FICHE ─────────────────────────────────────────

/**
 * Formulaire de création d'une nouvelle fiche.
 * Affiché dans une Modal.
 */
function NouvelleFicheModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  // Date d'aujourd'hui au format YYYY-MM-DD pour l'input date
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [observations, setObservations] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    // preventDefault → empêche le rechargement de la page
    // comportement natif des formulaires HTML
    e.preventDefault()
    setLoading(true)

    try {
      await fichesService.create({ date, observations: observations || undefined })
      toast.success('Fiche créée avec succès')
      onSuccess()
      onClose()
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string; code?: string } }
      }
      const code = axiosError.response?.data?.code
      if (code === 'CONFLICT') {
        toast.error('Une fiche existe déjà pour cette date')
      } else {
        toast.error('Erreur lors de la création')
      }
    } finally {
      // finally → s'exécute TOUJOURS, succès ou erreur
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle fiche journalière">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Champ date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={today}
            required
            className="w-full h-14 px-4 rounded-xl border-2 border-gray-200 text-base focus:outline-none focus:border-[#1B6B93] focus:ring-2 focus:ring-[#D9EAF5]"
          />
        </div>

        {/* Champ observations */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Observations <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Conditions météo, remarques générales..."
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
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="flex-1"
          >
            Créer
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────

export function FichesPage() {
  const { isBrigade } = useAuth()
  const navigate = useNavigate()

  // État du filtre statut
  const [statutFilter, setStatutFilter] = useState<StatutFiche | undefined>(undefined)

  // État de la pagination
  const [page, setPage] = useState(1)

  // État de la modal
  const [showModal, setShowModal] = useState(false)

  /**
   * useQuery → hook React Query pour fetcher les fiches.
   *
   * queryKey → clé unique du cache.
   * Si ['fiches', statutFilter, page] change → re-fetch automatique.
   * React Query compare les clés par valeur profonde.
   *
   * queryFn → fonction qui fetch les données.
   *
   * Retourne : { data, isLoading, isError, error, refetch }
   */
  const {
    data,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['fiches', statutFilter, page],
    queryFn: () => fichesService.getAll({
      statut: statutFilter,
      page,
      limit: 10
    })
  })

  // Spinner pendant le chargement initial
  if (isLoading) return <SpinnerPage />

  // Message d'erreur si l'API ne répond pas
  if (isError) return (
    <PageLayout title="Fiches journalières">
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Erreur de chargement</p>
        <Button variant="secondary" onClick={() => refetch()}>
          Réessayer
        </Button>
      </div>
    </PageLayout>
  )

  const fiches = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <PageLayout
      title="Fiches journalières"
      // Bouton "Nouvelle fiche" — visible seulement pour les brigades
      action={isBrigade ? (
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nouvelle fiche</span>
        </Button>
      ) : undefined}
    >
      {/* ── FILTRES ──────────────────────────────────────────────── */}
      <div className="mb-4">
        <StatutFilter
          value={statutFilter}
          onChange={(s) => {
            setStatutFilter(s)
            setPage(1) // Reset page quand filtre change
          }}
        />
      </div>

      {/* ── LISTE DES FICHES ─────────────────────────────────────── */}
      {fiches.length === 0 ? (

        // État vide — message contextuel selon le filtre
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
            <p className="text-gray-400 text-sm mb-4">
              Créez votre première fiche journalière
            </p>
          )}
          {isBrigade && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowModal(true)}
              className="mx-auto w-auto"
            >
              <Plus size={18} />
              Nouvelle fiche
            </Button>
          )}
        </div>

      ) : (

        // Liste des fiches
        <div className="space-y-3">
          {fiches.map((fiche) => (
            <FicheCard
              key={fiche.id}
              fiche={fiche}
              onClick={() => navigate(`/fiches/${fiche.id}`)}
            />
          ))}
        </div>
      )}

      {/* ── PAGINATION ───────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
          >
            ← Précédent
          </Button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page === totalPages}
          >
            Suivant →
          </Button>
        </div>
      )}

      {/* ── MODAL NOUVELLE FICHE ─────────────────────────────────── */}
      <NouvelleFicheModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => refetch()}
      />
    </PageLayout>
  )
}