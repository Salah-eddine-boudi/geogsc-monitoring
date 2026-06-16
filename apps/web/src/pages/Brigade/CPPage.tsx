/**
 * @file CPPage.tsx
 * @description Page Compte Rendu hebdomadaire — Brigade.
 *
 * FONCTIONNALITÉS :
 * → Liste des CPs de la brigade
 * → Créer un nouveau CP pour la semaine courante
 * → Ajouter événements et points de vigilance
 * → Soumettre pour validation IGT
 *
 * MOBILE-FIRST :
 * → Formulaires h-14 pour les gros doigts
 * → Cards cliquables pour les listes
 */

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Plus, Calendar, AlertTriangle,
  Trash2, Send, ChevronRight,
  FileText
} from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { SpinnerPage } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { cpService } from '../../services/cp.service'
import type {
  CompteRenduCP, TypeEvenement,
  CriticiteVigilance, StatutCP
} from '../../types/api.types'
import { cn } from '../../lib/utils'

// ─── HELPERS ─────────────────────────────────────────────────────

/**
 * Calcule le numéro de semaine ISO d'une date.
 * Semaine ISO : commence le lundi, numéro 1 = semaine du 1er jeudi de janvier.
 */
function getSemaineISO(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const semaine1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(
    ((d.getTime() - semaine1.getTime()) / 86400000 - 3 + ((semaine1.getDay() + 6) % 7)) / 7
  )
}

function getStatutCPLabel(statut: StatutCP) {
  const labels: Record<StatutCP, string> = {
    BROUILLON: 'Brouillon', SOUMIS: 'Soumis', VALIDE: 'Validé'
  }
  return labels[statut]
}

function getStatutCPVariant(statut: StatutCP): 'brouillon' | 'soumise' | 'validee' {
  const map: Record<StatutCP, 'brouillon' | 'soumise' | 'validee'> = {
    BROUILLON: 'brouillon', SOUMIS: 'soumise', VALIDE: 'validee'
  }
  return map[statut]
}

function getCriticiteColor(criticite: CriticiteVigilance) {
  const colors: Record<CriticiteVigilance, string> = {
    HAUTE: 'bg-red-100 text-red-700 border-red-200',
    MOYENNE: 'bg-orange-100 text-orange-700 border-orange-200',
    FAIBLE: 'bg-gray-100 text-gray-600 border-gray-200'
  }
  return colors[criticite]
}

function getTypeEvenementLabel(type: TypeEvenement) {
  const labels: Record<TypeEvenement, string> = {
    VISITE_CHANTIER: 'Visite chantier',
    REUNION: 'Réunion',
    INCIDENT: 'Incident',
    CONSTAT: 'Constat',
    AUTRE: 'Autre'
  }
  return labels[type]
}

// ─── MODAL NOUVEAU CP ─────────────────────────────────────────────

function NouveauCPModal({
  isOpen, onClose, brigadeId, onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  brigadeId: string
  onSuccess: () => void
}) {
  const now = new Date()
  const [semaine, setSemaine] = useState(getSemaineISO(now))
  const [annee, setAnnee] = useState(now.getFullYear())
  const [observations, setObservations] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await cpService.create({ semaine, annee, brigadeId, observations: observations || undefined })
      toast.success(`CP Semaine ${semaine} créé`)
      onSuccess()
      onClose()
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { code?: string } } }
      if (axiosError.response?.data?.code === 'CONFLICT') {
        toast.error(`Un CP existe déjà pour la semaine ${semaine}`)
      } else {
        toast.error('Erreur lors de la création')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouveau Compte Rendu CP">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Semaine <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min={1} max={53}
              value={semaine}
              onChange={(e) => setSemaine(Number(e.target.value))}
              className="w-full h-14 px-4 rounded-xl border-2 border-gray-200 text-base focus:outline-none focus:border-[#1B6B93]"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Année</label>
            <input
              type="number" min={2025} max={2030}
              value={annee}
              onChange={(e) => setAnnee(Number(e.target.value))}
              className="w-full h-14 px-4 rounded-xl border-2 border-gray-200 text-base focus:outline-none focus:border-[#1B6B93]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Observations générales <span className="text-gray-400">(optionnel)</span>
          </label>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Contexte de la semaine, remarques..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm resize-none focus:outline-none focus:border-[#1B6B93]"
          />
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" size="md" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="md" loading={loading} className="flex-1">
            Créer
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── MODAL AJOUT ÉVÉNEMENT ────────────────────────────────────────

function AjouterEvenementModal({
  isOpen, onClose, cpId, onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  cpId: string
  onSuccess: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [type, setType] = useState<TypeEvenement>('VISITE_CHANTIER')
  const [description, setDescription] = useState('')
  const [participants, setParticipants] = useState('')
  const [lieu, setLieu] = useState('')
  const [loading, setLoading] = useState(false)

  const typesEvenement: { value: TypeEvenement; label: string }[] = [
    { value: 'VISITE_CHANTIER', label: 'Visite chantier' },
    { value: 'REUNION', label: 'Réunion' },
    { value: 'INCIDENT', label: 'Incident' },
    { value: 'CONSTAT', label: 'Constat' },
    { value: 'AUTRE', label: 'Autre' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) { toast.error('Description obligatoire'); return }
    setLoading(true)
    try {
      await cpService.addEvenement(cpId, {
        date,
        type,
        description: description.trim(),
        participants: participants || undefined,
        lieu: lieu || undefined
      })
      toast.success('Événement ajouté')
      onSuccess()
      onClose()
      setDescription('')
      setParticipants('')
      setLieu('')
    } catch {
      toast.error('Erreur lors de l\'ajout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un événement">
      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date" value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-14 px-4 rounded-xl border-2 border-gray-200 text-base focus:outline-none focus:border-[#1B6B93]"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TypeEvenement)}
              className="w-full h-14 px-4 rounded-xl border-2 border-gray-200 text-sm bg-white focus:outline-none focus:border-[#1B6B93]"
            >
              {typesEvenement.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez l'événement..."
            rows={3}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm resize-none focus:outline-none focus:border-[#1B6B93]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Participants <span className="text-gray-400">(optionnel)</span>
          </label>
          <input
            type="text" value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            placeholder="ex: M. CHAACHOUI, M. AIT KADIR"
            className="w-full h-14 px-4 rounded-xl border-2 border-gray-200 text-base focus:outline-none focus:border-[#1B6B93]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Lieu <span className="text-gray-400">(optionnel)</span>
          </label>
          <input
            type="text" value={lieu}
            onChange={(e) => setLieu(e.target.value)}
            placeholder="ex: Tribune Nord, Zone D"
            className="w-full h-14 px-4 rounded-xl border-2 border-gray-200 text-base focus:outline-none focus:border-[#1B6B93]"
          />
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" size="md" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="md" loading={loading} className="flex-1">
            Ajouter
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── MODAL AJOUT VIGILANCE ────────────────────────────────────────

function AjouterVigilanceModal({
  isOpen, onClose, cpId, onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  cpId: string
  onSuccess: () => void
}) {
  const [criticite, setCriticite] = useState<CriticiteVigilance>('MOYENNE')
  const [description, setDescription] = useState('')
  const [action, setAction] = useState('')
  const [responsable, setResponsable] = useState('')
  const [echeance, setEcheance] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) { toast.error('Description obligatoire'); return }
    setLoading(true)
    try {
      await cpService.addVigilance(cpId, {
        criticite,
        description: description.trim(),
        action: action || undefined,
        responsable: responsable || undefined,
        echeance: echeance || undefined
      })
      toast.success('Point de vigilance ajouté')
      onSuccess()
      onClose()
      setDescription('')
      setAction('')
      setResponsable('')
      setEcheance('')
    } catch {
      toast.error('Erreur lors de l\'ajout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un point de vigilance">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Criticité — boutons radio stylisés */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Criticité <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['HAUTE', 'MOYENNE', 'FAIBLE'] as CriticiteVigilance[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCriticite(c)}
                className={cn(
                  'py-3 rounded-xl border-2 text-sm font-semibold transition-colors',
                  criticite === c
                    ? c === 'HAUTE'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : c === 'MOYENNE'
                        ? 'border-orange-400 bg-orange-50 text-orange-700'
                        : 'border-gray-300 bg-gray-50 text-gray-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                )}
              >
                {c === 'HAUTE' ? '🔴' : c === 'MOYENNE' ? '🟠' : '🟡'} {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez le point de vigilance..."
            rows={3}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm resize-none focus:outline-none focus:border-[#1B6B93]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Action requise <span className="text-gray-400">(optionnel)</span>
          </label>
          <input
            type="text" value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="ex: Vérifier avant coulage béton"
            className="w-full h-14 px-4 rounded-xl border-2 border-gray-200 text-base focus:outline-none focus:border-[#1B6B93]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Responsable</label>
            <input
              type="text" value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              placeholder="ex: M. CHAACHOUI"
              className="w-full h-14 px-4 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-[#1B6B93]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Échéance</label>
            <input
              type="date" value={echeance}
              onChange={(e) => setEcheance(e.target.value)}
              className="w-full h-14 px-4 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-[#1B6B93]"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" size="md" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="md" loading={loading} className="flex-1">
            Ajouter
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── COMPOSANT DÉTAIL CP ──────────────────────────────────────────

function CPDetail({
  cp, onRefresh
}: {
  cp: CompteRenduCP
  onRefresh: () => void
}) {
  const queryClient = useQueryClient()
  const [showEvenementModal, setShowEvenementModal] = useState(false)
  const [showVigilanceModal, setShowVigilanceModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canEdit = cp.statut === 'BROUILLON'

  const handleSoumettre = async () => {
    setSubmitting(true)
    try {
      await cpService.soumettre(cp.id)
      toast.success('CP soumis pour validation ✓')
      queryClient.invalidateQueries({ queryKey: ['cps'] })
      onRefresh()
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { code?: string; message?: string } } }
      const code = axiosError.response?.data?.code
      if (code === 'CP_VIDE') {
        toast.error('Ajoutez au moins un événement avant de soumettre')
      } else {
        toast.error('Erreur lors de la soumission')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteEvenement = async (evId: string) => {
    try {
      await cpService.deleteEvenement(cp.id, evId)
      toast.success('Événement supprimé')
      onRefresh()
    } catch {
      toast.error('Erreur')
    }
  }

  const handleDeleteVigilance = async (vId: string) => {
    try {
      await cpService.deleteVigilance(cp.id, vId)
      toast.success('Point de vigilance supprimé')
      onRefresh()
    } catch {
      toast.error('Erreur')
    }
  }

  return (
    <div className="space-y-4">

      {/* Actions */}
      {canEdit && (
        <div className="flex gap-3">
          <Button
            variant="secondary" size="md"
            onClick={() => setShowEvenementModal(true)}
          >
            <Plus size={16} />
            Événement
          </Button>
          <Button
            variant="secondary" size="md"
            onClick={() => setShowVigilanceModal(true)}
          >
            <AlertTriangle size={16} />
            Vigilance
          </Button>
          <Button
            variant="primary" size="md"
            loading={submitting}
            onClick={handleSoumettre}
          >
            <Send size={16} />
            Soumettre
          </Button>
        </div>
      )}

      {/* Événements */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#1B6B93]" />
            <span>Événements ({cp.evenements.length})</span>
          </div>
        </Card.Header>
        <Card.Body className="space-y-3">
          {cp.evenements.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Aucun événement cette semaine
            </p>
          ) : (
            cp.evenements.map((ev) => (
              <div key={ev.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#1B6B93] bg-[#D9EAF5] px-2 py-0.5 rounded-full">
                      {getTypeEvenementLabel(ev.type)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(ev.date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{ev.description}</p>
                  {ev.participants && (
                    <p className="text-xs text-gray-500 mt-1">
                      👥 {ev.participants}
                    </p>
                  )}
                  {ev.lieu && (
                    <p className="text-xs text-gray-500">📍 {ev.lieu}</p>
                  )}
                </div>
                {canEdit && (
                  <button
                    onClick={() => handleDeleteEvenement(ev.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </Card.Body>
      </Card>

      {/* Points de vigilance */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            <span>Points de vigilance ({cp.pointsVigilance.length})</span>
          </div>
        </Card.Header>
        <Card.Body className="space-y-3">
          {cp.pointsVigilance.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Aucun point de vigilance
            </p>
          ) : (
            cp.pointsVigilance.map((pv) => (
              <div key={pv.id} className={cn(
                'flex items-start gap-3 p-3 rounded-xl border',
                getCriticiteColor(pv.criticite)
              )}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold">
                      {pv.criticite === 'HAUTE' ? '🔴' : pv.criticite === 'MOYENNE' ? '🟠' : '🟡'}
                      {' '}{pv.criticite}
                    </span>
                    {pv.resolu && (
                      <span className="text-xs text-teal-600 font-medium">✓ Résolu</span>
                    )}
                  </div>
                  <p className="text-sm font-medium">{pv.description}</p>
                  {pv.action && (
                    <p className="text-xs mt-1 opacity-80">
                      ⚡ Action : {pv.action}
                    </p>
                  )}
                  {pv.responsable && (
                    <p className="text-xs opacity-70">👤 {pv.responsable}</p>
                  )}
                  {pv.echeance && (
                    <p className="text-xs opacity-70">
                      📅 {new Date(pv.echeance).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                {canEdit && (
                  <button
                    onClick={() => handleDeleteVigilance(pv.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </Card.Body>
      </Card>

      {/* Modals */}
      <AjouterEvenementModal
        isOpen={showEvenementModal}
        onClose={() => setShowEvenementModal(false)}
        cpId={cp.id}
        onSuccess={onRefresh}
      />
      <AjouterVigilanceModal
        isOpen={showVigilanceModal}
        onClose={() => setShowVigilanceModal(false)}
        cpId={cp.id}
        onSuccess={onRefresh}
      />
    </div>
  )
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────

export function CPPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showNouveauModal, setShowNouveauModal] = useState(false)
  const [selectedCP, setSelectedCP] = useState<CompteRenduCP | null>(null)

  const brigadeId = user?.brigadeId ?? ''

  const { data: cps = [], isLoading, refetch } = useQuery({
    queryKey: ['cps', brigadeId],
    queryFn: () => cpService.getBrigadeCPs(brigadeId),
    enabled: !!brigadeId
  })

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['cps', brigadeId] })
    // Refresh le CP sélectionné aussi
    if (selectedCP) {
      cpService.getById(brigadeId, selectedCP.id).then(setSelectedCP)
    }
  }

  if (isLoading) return <SpinnerPage />

  return (
    <PageLayout
      title="Comptes Rendus CP"
      action={
        <Button
          variant="primary" size="md"
          onClick={() => setShowNouveauModal(true)}
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nouveau CP</span>
        </Button>
      }
    >
      <div className="space-y-4">

        {/* Liste des CPs */}
        {!selectedCP && (
          <>
            {cps.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-[#D9EAF5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText size={28} className="text-[#0D3B66]" />
                </div>
                <h3 className="text-gray-600 font-medium mb-1">Aucun CP cette année</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Créez votre premier compte rendu hebdomadaire
                </p>
                <Button
                  variant="primary" size="md"
                  onClick={() => setShowNouveauModal(true)}
                  className="mx-auto w-auto"
                >
                  <Plus size={16} />
                  Nouveau CP
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {cps.map((cp) => (
                  <Card key={cp.id} onClick={() => setSelectedCP(cp)}>
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#D9EAF5] rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs text-[#1B6B93] font-medium">S</span>
                        <span className="text-lg font-bold text-[#0D3B66] leading-none">
                          {cp.semaine}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">
                            Semaine {cp.semaine} — {cp.annee}
                          </span>
                          <Badge variant={getStatutCPVariant(cp.statut)}>
                            {getStatutCPLabel(cp.statut)}
                          </Badge>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-500">
                          <span>
                            📅 {cp._count?.evenements ?? cp.evenements.length} événement(s)
                          </span>
                          <span>
                            ⚠️ {cp._count?.pointsVigilance ?? cp.pointsVigilance.length} vigilance(s)
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Détail CP sélectionné */}
        {selectedCP && (
          <>
            {/* En-tête avec retour */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedCP(null)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
              >
                <ChevronRight size={20} className="rotate-180" />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#0D3B66]">
                    CP Semaine {selectedCP.semaine} — {selectedCP.annee}
                  </h2>
                  <Badge variant={getStatutCPVariant(selectedCP.statut)}>
                    {getStatutCPLabel(selectedCP.statut)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {selectedCP.brigade.nom} · {selectedCP.createur.prenom} {selectedCP.createur.nom}
                </p>
              </div>
            </div>

            <CPDetail cp={selectedCP} onRefresh={handleRefresh} />
          </>
        )}
      </div>

      <NouveauCPModal
        isOpen={showNouveauModal}
        onClose={() => setShowNouveauModal(false)}
        brigadeId={brigadeId}
        onSuccess={() => { refetch(); }}
      />
    </PageLayout>
  )
}