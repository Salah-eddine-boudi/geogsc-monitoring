/**
 * @file FicheDetailPage.tsx
 * @description Page détail d'une fiche journalière.
 *
 * FLUX COMPLET :
 * Brigade  → saisit réceptions → "Envoyer la fiche" → SOUMISE
 * IGT/Admin → "Valider" → VALIDEE  |  "Rejeter" → REJETEE
 * Brigade  → corrige (si REJETEE) → "Renvoyer" → SOUMISE
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Plus, Play, CheckCircle, XCircle,
  ChevronDown, ChevronRight, Clock, Ruler,
  AlertTriangle, Send, Camera
} from 'lucide-react'
import { PageLayout }       from '../../components/layout/PageLayout'
import { Button }           from '../../components/ui/Button'
import { Badge }            from '../../components/ui/Badge'
import { Card }             from '../../components/ui/Card'
import { Modal }            from '../../components/ui/Modal'
import { SpinnerPage }      from '../../components/ui/Spinner'
import { MissionFormModal } from '../../components/missions/MissionFormModal'
import { PhotosModal }      from '../../components/missions/PhotosModal'
import { useAuth }          from '../../hooks/useAuth'
import { fichesService }    from '../../services/fiches.service'
import { missionsService }  from '../../services/missions.service'
import { controlesService } from '../../services/controles.service'
import type {
  Mission, Controle, StatutFiche,
  StatutMission, StatutControle, TypeControle
} from '../../types/api.types'

// ─── FORMATTERS ───────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric', month: 'long', year: 'numeric'
})
const heureFormatter = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit', minute: '2-digit'
})

function formatDate(date: string | Date) {
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? '' : dateFormatter.format(parsed)
}
function formatHeure(date: string | Date) {
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? '' : heureFormatter.format(parsed)
}

// ─── HELPERS ──────────────────────────────────────────────────────

function getStatutFicheLabel(statut: StatutFiche) {
  const labels: Record<StatutFiche, string> = {
    BROUILLON: 'En cours',
    SOUMISE:   'Soumise — en attente de validation',
    VALIDEE:   'Validée',
    REJETEE:   'Rejetée — correction requise'
  }
  return labels[statut] ?? statut
}

function getStatutMissionLabel(statut: StatutMission) {
  const labels: Record<StatutMission, string> = {
    PLANIFIEE: 'Planifiée', EN_COURS: 'En cours', TERMINEE: 'Terminée'
  }
  return labels[statut] ?? statut
}

function getStatutMissionColor(statut: StatutMission) {
  const colors: Record<StatutMission, string> = {
    PLANIFIEE: 'bg-yellow-100 text-yellow-800',
    EN_COURS:  'bg-blue-100 text-blue-800',
    TERMINEE:  'bg-green-100 text-green-800'
  }
  return colors[statut] ?? 'bg-gray-100 text-gray-700'
}

function getStatutControleLabel(statut: StatutControle) {
  const labels: Record<StatutControle, string> = {
    CONFORME: 'Conforme', NON_CONFORME: 'Non conforme', RESERVE: 'Réserve'
  }
  return labels[statut] ?? statut
}

function getStatutControleColor(statut: StatutControle) {
  const colors: Record<StatutControle, string> = {
    CONFORME:     'border-green-500 bg-green-100',
    RESERVE:      'border-yellow-500 bg-yellow-100',
    NON_CONFORME: 'border-red-500 bg-red-100'
  }
  return colors[statut] ?? 'border-gray-300 bg-gray-100'
}

function getTypeControleLabel(type: TypeControle) {
  const labels: Record<TypeControle, string> = {
    IMPLANTATION: 'Implantation', ALTIMETRIE: 'Altimétrie',
    VERTICALITY: 'Verticalité', RECEPTION: 'Réception',
    CONTRADICTOIRE: 'Contradictoire'
  }
  return labels[type] ?? type
}

// ─── BADGE STATUT FICHE ───────────────────────────────────────────

function StatutFicheBadge({ statut }: { statut: StatutFiche }) {
  const map: Record<StatutFiche, 'brouillon' | 'soumise' | 'validee' | 'rejetee'> = {
    BROUILLON: 'brouillon', SOUMISE: 'soumise',
    VALIDEE:   'validee',   REJETEE: 'rejetee'
  }
  return <Badge variant={map[statut]}>{getStatutFicheLabel(statut)}</Badge>
}

// ─── MODAL REJETER ────────────────────────────────────────────────

function RejeterModal({
  isOpen, onClose, ficheId, onSuccess
}: {
  isOpen: boolean; onClose: () => void; ficheId: string; onSuccess: () => void
}) {
  const [motif, setMotif]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (motif.trim().length < 10) {
      toast.error('Le motif doit contenir au moins 10 caractères')
      return
    }
    setLoading(true)
    try {
      await fichesService.rejeter(ficheId, motif.trim())
      toast.success('Fiche rejetée — le brigadier va être notifié')
      onSuccess(); onClose(); setMotif('')
    } catch {
      toast.error('Erreur lors du rejet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rejeter la fiche" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">
            Le brigadier devra corriger ses réceptions et renvoyer la fiche.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Motif du rejet <span className="text-red-500">*</span>
          </label>
          <textarea
            value={motif} onChange={(e) => setMotif(e.target.value)}
            placeholder="Ex: Mission 2 — écart Z = 45mm dépasse la tolérance de ±10mm. Reprendre le coffrage axe A14."
            rows={4} minLength={10} required
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm resize-none focus:outline-none focus:border-red-400"
          />
          <div className={`text-xs text-right ${motif.length < 10 ? 'text-red-400' : 'text-gray-400'}`}>
            {motif.length}/500 (minimum 10 caractères)
          </div>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" size="md" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button type="submit" variant="danger" size="md" loading={loading} className="flex-1">
            Rejeter la fiche
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── MODAL NOUVEAU CONTRÔLE ───────────────────────────────────────

function NouveauControleModal({
  isOpen, onClose, ficheId, missionId, onSuccess
}: {
  isOpen: boolean; onClose: () => void
  ficheId: string; missionId: string; onSuccess: () => void
}) {
  const [type, setType]               = useState<TypeControle>('IMPLANTATION')
  const [ecartX, setEcartX]           = useState('')
  const [ecartY, setEcartY]           = useState('')
  const [ecartZ, setEcartZ]           = useState('')
  const [toleranceX, setToleranceX]   = useState('')
  const [toleranceY, setToleranceY]   = useState('')
  const [toleranceZ, setToleranceZ]   = useState('')
  const [observations, setObservations] = useState('')
  const [loading, setLoading]         = useState(false)

  const typesControle: TypeControle[] = [
    'IMPLANTATION', 'ALTIMETRIE', 'VERTICALITY', 'RECEPTION', 'CONTRADICTOIRE'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await controlesService.create(ficheId, missionId, {
        type,
        ecartX:     ecartX     ? Number(ecartX)     : undefined,
        ecartY:     ecartY     ? Number(ecartY)     : undefined,
        ecartZ:     ecartZ     ? Number(ecartZ)     : undefined,
        toleranceX: toleranceX ? Number(toleranceX) : undefined,
        toleranceY: toleranceY ? Number(toleranceY) : undefined,
        toleranceZ: toleranceZ ? Number(toleranceZ) : undefined,
        observations: observations || undefined
      })
      toast.success('Contrôle ajouté')
      onSuccess(); onClose()
    } catch {
      toast.error('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouveau contrôle" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Type <span className="text-red-500">*</span>
          </label>
          <select value={type} onChange={(e) => setType(e.target.value as TypeControle)}
            className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 text-sm bg-white focus:outline-none focus:border-[#1B6B93]">
            {typesControle.map((t) => (
              <option key={t} value={t}>{getTypeControleLabel(t)}</option>
            ))}
          </select>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Mesures en millimètres
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { axis: 'X', ecart: ecartX, setEcart: setEcartX, tolerance: toleranceX, setTolerance: setToleranceX },
              { axis: 'Y', ecart: ecartY, setEcart: setEcartY, tolerance: toleranceY, setTolerance: setToleranceY },
              { axis: 'Z', ecart: ecartZ, setEcart: setEcartZ, tolerance: toleranceZ, setTolerance: setToleranceZ }
            ].map(({ axis, ecart, setEcart, tolerance, setTolerance }) => (
              <div key={axis} className="space-y-1">
                <p className="text-xs font-semibold text-center text-[#0D3B66]">Axe {axis}</p>
                <input type="number" step="0.1" placeholder="Écart"
                  value={ecart} onChange={(e) => setEcart(e.target.value)}
                  className="w-full h-10 px-2 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:border-[#1B6B93]" />
                <input type="number" step="0.1" min="0" placeholder="Tolérance"
                  value={tolerance} onChange={(e) => setTolerance(e.target.value)}
                  className="w-full h-10 px-2 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:border-[#1B6B93]" />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Ligne 1 : écart mesuré</span>
            <span>Ligne 2 : tolérance admise</span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-[#D9EAF5] rounded-xl">
          <AlertTriangle size={16} className="text-[#1B6B93] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#1B6B93]">
            Le statut est calculé automatiquement selon les écarts et tolérances.
          </p>
        </div>

        <textarea value={observations} onChange={(e) => setObservations(e.target.value)}
          placeholder="Observations optionnelles..." rows={2}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm resize-none focus:outline-none focus:border-[#1B6B93]" />

        <div className="flex gap-3">
          <Button type="button" variant="secondary" size="md" onClick={onClose} className="flex-1">Annuler</Button>
          <Button type="submit" variant="primary" size="md" loading={loading} className="flex-1">Enregistrer</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── COMPOSANT CONTRÔLE ───────────────────────────────────────────

function ControleItem({ controle }: { controle: Controle }) {
  const colorClass = getStatutControleColor(controle.statut)
  return (
    <div className={`p-3 rounded-xl border ${colorClass} bg-opacity-50`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Ruler size={14} />
          <span className="text-xs font-semibold">{getTypeControleLabel(controle.type)}</span>
        </div>
        <Badge variant={
          controle.statut === 'CONFORME' ? 'conforme' :
          controle.statut === 'NON_CONFORME' ? 'non-conforme' : 'reserve'
        }>
          {getStatutControleLabel(controle.statut)}
        </Badge>
      </div>
      {(controle.ecartX !== null || controle.ecartY !== null || controle.ecartZ !== null) && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[
            { axis: 'X', ecart: controle.ecartX, tolerance: controle.toleranceX },
            { axis: 'Y', ecart: controle.ecartY, tolerance: controle.toleranceY },
            { axis: 'Z', ecart: controle.ecartZ, tolerance: controle.toleranceZ }
          ].map(({ axis, ecart, tolerance }) => ecart !== null && (
            <div key={axis} className="text-center">
              <div className="text-xs font-bold">Axe {axis}</div>
              <div className="text-sm font-mono">{ecart > 0 ? '+' : ''}{ecart}mm</div>
              {tolerance !== null && <div className="text-xs text-gray-500">±{tolerance}mm</div>}
            </div>
          ))}
        </div>
      )}
      {controle.observations && <p className="text-xs mt-2 opacity-75">{controle.observations}</p>}
    </div>
  )
}

// ─── COMPOSANT MISSION ────────────────────────────────────────────

function MissionItem({
  mission, ficheId, ficheStatut, isBrigade, onRefresh
}: {
  mission: Mission; ficheId: string; ficheStatut: StatutFiche
  isBrigade: boolean; onRefresh: () => void
}) {
  const [expanded, setExpanded]                   = useState(false)
  const [showControleModal, setShowControleModal] = useState(false)
  const [showPhotosModal, setShowPhotosModal]     = useState(false)
  const [actionLoading, setActionLoading]         = useState(false)

  const controles = mission.controles ?? []
  const photos    = (mission as any).photos ?? []
  // Brigade peut modifier si BROUILLON ou REJETEE (correction après rejet IGT)
  const canEdit   = isBrigade && (ficheStatut === 'BROUILLON' || ficheStatut === 'REJETEE')

  const handleDemarrer = async () => {
    setActionLoading(true)
    try {
      await missionsService.update(ficheId, mission.id, {
        heureDebut: new Date().toISOString()
      })
      toast.success('Mission démarrée')
      onRefresh()
    } catch { toast.error('Erreur') }
    finally { setActionLoading(false) }
  }

  const handleTerminer = async () => {
    setActionLoading(true)
    try {
      await missionsService.terminer(ficheId, mission.id)
      toast.success('Mission terminée')
      onRefresh()
    } catch { toast.error('Erreur') }
    finally { setActionLoading(false) }
  }

  return (
    <>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
            : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[#0D3B66]">
                {mission.ouvrage.reference}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatutMissionColor(mission.statut)}`}>
                {getStatutMissionLabel(mission.statut)}
              </span>
              {mission.resultat && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  mission.resultat === 'CONFORME'
                    ? 'bg-teal-100 text-teal-700'
                    : mission.resultat === 'NON_CONFORME'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-orange-100 text-orange-700'
                }`}>
                  {mission.resultat === 'CONFORME' ? 'C'
                   : mission.resultat === 'NON_CONFORME' ? 'NC' : 'R'}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {mission.ouvrage.designation}
              {mission.partieOuvrage && ` · ${mission.partieOuvrage}`}
            </div>
          </div>
          <div className="flex-shrink-0 text-right space-y-0.5">
            <div className="text-xs text-gray-400">
              {controles.length} contrôle{controles.length !== 1 ? 's' : ''}
            </div>
            {photos.length > 0 && (
              <div className="text-xs text-[#1B6B93] font-medium flex items-center justify-end gap-1">
                <Camera size={11} /> {photos.length}
              </div>
            )}
            {mission.heureDebut && (
              <div className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                <Clock size={10} />
                {formatHeure(mission.heureDebut)}
                {mission.heureFin && ` → ${formatHeure(mission.heureFin)}`}
              </div>
            )}
          </div>
        </button>

        {expanded && (
          <div className="border-t border-gray-100 p-3 bg-gray-50 space-y-3">
            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <>
                  {mission.statut === 'PLANIFIEE' && (
                    <Button variant="secondary" size="sm" loading={actionLoading} onClick={handleDemarrer}>
                      <Play size={14} /> Démarrer
                    </Button>
                  )}
                  {mission.statut === 'EN_COURS' && (
                    <Button variant="success" size="sm" loading={actionLoading} onClick={handleTerminer}>
                      <CheckCircle size={14} /> Terminer
                    </Button>
                  )}
                  {mission.statut !== 'TERMINEE' && (
                    <Button variant="secondary" size="sm" onClick={() => setShowControleModal(true)}>
                      <Plus size={14} /> Contrôle
                    </Button>
                  )}
                </>
              )}
              {/* Photos toujours accessibles pour le rapport final */}
              <Button variant="secondary" size="sm" onClick={() => setShowPhotosModal(true)}>
                <Camera size={14} />
                Photos{photos.length > 0 ? ` (${photos.length}/3)` : ''}
              </Button>
            </div>
            {controles.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">Aucun contrôle</p>
            ) : (
              <div className="space-y-2">
                {controles.map((c) => <ControleItem key={c.id} controle={c} />)}
              </div>
            )}
          </div>
        )}
      </div>

      <NouveauControleModal
        isOpen={showControleModal}
        onClose={() => setShowControleModal(false)}
        ficheId={ficheId} missionId={mission.id}
        onSuccess={onRefresh}
      />
      <PhotosModal
        isOpen={showPhotosModal}
        onClose={() => setShowPhotosModal(false)}
        ficheId={ficheId} mission={mission}
      />
    </>
  )
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────

export function FicheDetailPage() {
  const { id }                      = useParams<{ id: string }>()
  const navigate                    = useNavigate()
  const { isBrigade, isIGTOrAdmin } = useAuth()
  const queryClient                 = useQueryClient()

  const [showMissionModal, setShowMissionModal] = useState(false)
  const [showRejetModal,   setShowRejetModal]   = useState(false)
  const [actionLoading,    setActionLoading]    = useState(false)

  const { data: fiche, isLoading, isError } = useQuery({
    queryKey: ['fiche', id],
    queryFn:  () => fichesService.getById(id!),
    enabled:  !!id
  })

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['fiche', id] })
    queryClient.invalidateQueries({ queryKey: ['fiches'] })
  }

  // Brigade soumet → SOUMISE (en attente validation IGT)
  const handleEnvoyer = async () => {
    setActionLoading(true)
    try {
      await fichesService.soumettre(id!)
      toast.success('Fiche envoyée — en attente de validation IGT')
      handleRefresh()
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { code?: string } } }
      if (axiosError.response?.data?.code === 'FICHE_VIDE') {
        toast.error('Ajoutez au moins une réception avant d\'envoyer')
      } else {
        toast.error('Erreur lors de l\'envoi')
      }
    } finally {
      setActionLoading(false)
    }
  }

  // IGT/Admin valide → VALIDEE
  const handleValider = async () => {
    setActionLoading(true)
    try {
      await fichesService.valider(id!)
      toast.success('Fiche validée ✓')
      handleRefresh()
    } catch {
      toast.error('Erreur lors de la validation')
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading) return <SpinnerPage />

  if (isError || !fiche) return (
    <PageLayout>
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Fiche introuvable</p>
        <Button variant="secondary" onClick={() => navigate('/fiches')}>
          Retour aux fiches
        </Button>
      </div>
    </PageLayout>
  )

  const canEdit    = isBrigade && (fiche.statut === 'BROUILLON' || fiche.statut === 'REJETEE')
  const canEnvoyer = isBrigade && (fiche.statut === 'BROUILLON' || fiche.statut === 'REJETEE')
  const canValider = isIGTOrAdmin && fiche.statut === 'SOUMISE'

  return (
    <PageLayout>
      <div className="space-y-4">

        {/* EN-TÊTE */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate('/fiches')}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-[#0D3B66]">
                Fiche du {formatDate(fiche.date)}
              </h1>
              <StatutFicheBadge statut={fiche.statut} />
            </div>
            <p className="text-sm text-gray-500">
              {fiche.brigade.nom} · {fiche.createur.prenom} {fiche.createur.nom}
            </p>
          </div>
        </div>

        {/* BANDEAU REJET — motif visible par la brigade */}
        {fiche.statut === 'REJETEE' && fiche.observations && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={16} className="text-red-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-red-700">
                Fiche rejetée — correction requise
              </span>
            </div>
            <p className="text-sm text-red-600">{fiche.observations}</p>
            {isBrigade && (
              <p className="text-xs text-red-500 mt-2">
                Corrigez vos réceptions puis renvoyez la fiche.
              </p>
            )}
          </div>
        )}

        {/* BOUTON ENVOYER — Brigade (BROUILLON ou REJETEE) */}
        {canEnvoyer && (
          <div className="p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {fiche._count.missions} réception{fiche._count.missions !== 1 ? 's' : ''} saisie{fiche._count.missions !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {fiche.statut === 'REJETEE'
                  ? 'Vérifiez vos corrections puis renvoyez'
                  : 'Vérifiez vos réceptions puis envoyez pour validation'
                }
              </p>
            </div>
            <Button
              variant="primary" size="md"
              loading={actionLoading}
              onClick={handleEnvoyer}
              className="flex-shrink-0"
            >
              <Send size={16} />
              {fiche.statut === 'REJETEE' ? 'Renvoyer' : 'Envoyer pour validation'}
            </Button>
          </div>
        )}

        {/* BANDEAU EN ATTENTE — visible par brigade si SOUMISE */}
        {isBrigade && fiche.statut === 'SOUMISE' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
            <CheckCircle size={18} className="text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700 font-medium">
              Fiche envoyée — en attente de validation par l'IGT
            </p>
          </div>
        )}

        {/* BANDEAU VALIDÉE */}
        {fiche.statut === 'VALIDEE' && (
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-3">
            <CheckCircle size={18} className="text-teal-600 flex-shrink-0" />
            <p className="text-sm text-teal-700 font-medium">
              Fiche validée ✓
            </p>
          </div>
        )}

        {/* ACTIONS IGT — Valider / Rejeter */}
        {canValider && (
          <div className="p-4 bg-white border border-gray-200 rounded-xl">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              Validation IGT — {fiche._count.missions} réception{fiche._count.missions !== 1 ? 's' : ''} à examiner
            </p>
            <div className="flex gap-3">
              <Button
                variant="primary" size="md"
                loading={actionLoading}
                onClick={handleValider}
                className="flex-1"
              >
                <CheckCircle size={16} />
                Valider la fiche
              </Button>
              <Button
                variant="danger" size="md"
                onClick={() => setShowRejetModal(true)}
                className="flex-1"
              >
                <XCircle size={16} />
                Rejeter
              </Button>
            </div>
          </div>
        )}

        {/* RÉCEPTIONS */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <span>Réceptions ({fiche.missions.length})</span>
              {canEdit && (
                <button onClick={() => setShowMissionModal(true)}
                  className="flex items-center gap-1 text-sm font-normal text-[#1B6B93] hover:text-[#0D3B66]">
                  <Plus size={16} /> Ajouter
                </button>
              )}
            </div>
          </Card.Header>
          <Card.Body className="space-y-3">
            {fiche.missions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mb-3">Aucune réception pour cette fiche</p>
                {canEdit && (
                  <Button variant="secondary" size="sm"
                    onClick={() => setShowMissionModal(true)} className="mx-auto w-auto">
                    <Plus size={16} /> Ajouter une réception
                  </Button>
                )}
              </div>
            ) : (
              fiche.missions.map((mission) => (
                <MissionItem
                  key={mission.id}
                  mission={mission}
                  ficheId={fiche.id}
                  ficheStatut={fiche.statut}
                  isBrigade={isBrigade}
                  onRefresh={handleRefresh}
                />
              ))
            )}
          </Card.Body>
        </Card>

      </div>

      <MissionFormModal
        isOpen={showMissionModal}
        onClose={() => setShowMissionModal(false)}
        ficheId={fiche.id}
        onSuccess={handleRefresh}
      />

      <RejeterModal
        isOpen={showRejetModal}
        onClose={() => setShowRejetModal(false)}
        ficheId={fiche.id}
        onSuccess={handleRefresh}
      />
    </PageLayout>
  )
}