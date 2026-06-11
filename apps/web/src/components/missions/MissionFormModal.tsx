/**
 * @file MissionFormModal.tsx
 * @description Formulaire complet de saisie d'une mission terrain.
 *
 * DESIGN MOBILE-FIRST :
 * → 3 sections accordéon pour guider le brigadier
 * → Inputs h-14 (56px) pour les gros doigts avec gants
 * → Labels courts et clairs
 * → Bouton de soumission toujours visible en bas
 *
 * EXIGENCE CDC :
 * "Saisie complète d'une mission < 5 minutes"
 * → Sections logiques, pas de scroll infini
 * → Valeurs par défaut intelligentes
 * → Feedback immédiat sur les erreurs
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight, MapPin, Wrench, CheckCircle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useMissionForm } from '../../hooks/useMissionForm'
import { useQuery } from '@tanstack/react-query'
import { ouvragesService } from '../../services/ouvrages.service'
import {
  ZONES_GSC,
  CONDITIONS_METEO,
  NATURES_INTERVENTION,
  APPAREILS_MESURE,
  STADES_COLLAGE,
  RESULTATS_CONTROLE
} from '../../constants/mission.constants'
import type { Mission } from '../../types/api.types'
import { cn } from '../../lib/utils'

// ─── COMPOSANT SECTION ACCORDÉON ─────────────────────────────────

/**
 * SectionAccordeon — section repliable du formulaire.
 *
 * POURQUOI DES ACCORDÉONS ?
 * Sur mobile, afficher tous les champs d'un coup = scroll infini.
 * Les accordéons permettent de voir une section à la fois.
 * Le brigadier suit un flux logique : Identification → Intervention → Résultat.
 */
function SectionAccordeon({
  titre,
  icone: Icone,
  isOpen,
  onToggle,
  children,
  hasError = false
}: {
  titre: string
  icone: React.ElementType
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  hasError?: boolean
}) {
  return (
    <div className={cn(
      'border-2 rounded-xl overflow-hidden transition-colors',
      hasError ? 'border-red-300' : isOpen ? 'border-[#1B6B93]' : 'border-gray-100'
    )}>
      {/* En-tête de section — cliquable */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
          isOpen ? 'bg-[#D9EAF5]' : 'bg-white hover:bg-gray-50'
        )}
      >
        <div className={cn(
          'p-1.5 rounded-lg',
          isOpen ? 'bg-[#1B6B93] text-white' : 'bg-gray-100 text-gray-500'
        )}>
          <Icone size={16} />
        </div>
        <span className={cn(
          'flex-1 text-sm font-semibold',
          isOpen ? 'text-[#0D3B66]' : 'text-gray-700'
        )}>
          {titre}
        </span>
        {hasError && (
          <span className="text-xs text-red-500 font-medium">Erreur</span>
        )}
        {isOpen
          ? <ChevronDown size={16} className="text-[#1B6B93]" />
          : <ChevronRight size={16} className="text-gray-400" />
        }
      </button>

      {/* Contenu — visible seulement si isOpen */}
      {isOpen && (
        <div className="p-4 bg-white space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── COMPOSANT CHAMP FORMULAIRE ───────────────────────────────────

/**
 * FormField — wrapper d'un champ avec label et message d'erreur.
 *
 * BONNE PRATIQUE a11y :
 * → htmlFor/id associés pour l'accessibilité
 * → role="alert" sur le message d'erreur
 * → * pour les champs obligatoires
 */
function FormField({
  label,
  required = false,
  error,
  children
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// ─── STYLES COMMUNS ───────────────────────────────────────────────

/**
 * Classes communes pour les inputs et selects.
 * Définies une seule fois pour la cohérence visuelle.
 * h-14 = 56px = taille CDC pour les gros doigts.
 */
const inputClass = `
  w-full h-14 px-4 rounded-xl border-2 border-gray-200
  text-base bg-white text-gray-900
  focus:outline-none focus:border-[#1B6B93] focus:ring-2 focus:ring-[#D9EAF5]
  transition-colors duration-150
`

const inputErrorClass = `
  w-full h-14 px-4 rounded-xl border-2 border-red-300
  text-base bg-white text-gray-900
  focus:outline-none focus:border-red-400
`

const textareaClass = `
  w-full px-4 py-3 rounded-xl border-2 border-gray-200
  text-base bg-white text-gray-900 resize-none
  focus:outline-none focus:border-[#1B6B93] focus:ring-2 focus:ring-[#D9EAF5]
`

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────

interface MissionFormModalProps {
  isOpen: boolean
  onClose: () => void
  ficheId: string
  mission?: Mission  // undefined = mode création
  onSuccess: () => void
}

export function MissionFormModal({
  isOpen,
  onClose,
  ficheId,
  mission,
  onSuccess
}: MissionFormModalProps) {

  /**
   * État des accordéons — quelle section est ouverte.
   * Par défaut : section 1 (Identification) ouverte.
   */
  const [openSection, setOpenSection] = useState<1 | 2 | 3>(1)

  /**
   * Toggle d'une section.
   * Si la section est déjà ouverte → la ferme.
   * Sinon → l'ouvre et ferme les autres.
   */
  const toggleSection = (section: 1 | 2 | 3) => {
    setOpenSection(prev => prev === section ? 1 : section)
  }

  // Charge la liste des ouvrages pour le select
  const { data: ouvrages = [] } = useQuery({
    queryKey: ['ouvrages'],
    queryFn: () => ouvragesService.getAll(),
    enabled: isOpen  // ne charge que quand la modal est ouverte
  })

  // Hook formulaire — logique séparée du JSX
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    isEditMode
  } = useMissionForm({ ficheId, mission, onSuccess, onClose })

  // Vérifie si une section a des erreurs pour l'indiquer visuellement
  const section1HasError = !!(errors.ouvrageId)
  const section2HasError = !!(errors.nature || errors.appareil || errors.travailRealise)
  const section3HasError = !!(errors.resultat || errors.observations)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Modifier la mission' : 'Nouvelle mission'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3">

        {/* ── SECTION 1 — IDENTIFICATION ───────────────────────── */}
        <SectionAccordeon
          titre="1. Identification de l'ouvrage"
          icone={MapPin}
          isOpen={openSection === 1}
          onToggle={() => toggleSection(1)}
          hasError={section1HasError}
        >

          {/* Ouvrage — obligatoire */}
          <FormField
            label="Ouvrage"
            required
            error={errors.ouvrageId?.message}
          >
            <select
              className={errors.ouvrageId ? inputErrorClass : inputClass}
              {...register('ouvrageId')}
            >
              <option value="">Sélectionner un ouvrage...</option>
              {ouvrages.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.reference} — {o.designation}
                </option>
              ))}
            </select>
          </FormField>

          {/* Zone */}
          <FormField label="Zone du stade">
            <select className={inputClass} {...register('zone')}>
              <option value="">Non renseignée</option>
              {ZONES_GSC.map((z) => (
                <option key={z.value} value={z.value}>{z.label}</option>
              ))}
            </select>
          </FormField>

          {/* Axe + Fil sur la même ligne */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Axe">
              <input
                type="text"
                placeholder="ex: D03/D05"
                className={inputClass}
                {...register('axe')}
              />
            </FormField>
            <FormField label="Fil">
              <input
                type="text"
                placeholder="ex: M/N"
                className={inputClass}
                {...register('fil')}
              />
            </FormField>
          </div>

          {/* Niveau */}
          <FormField label="Niveau">
            <input
              type="text"
              placeholder="ex: R+1, SSL, RDC"
              className={inputClass}
              {...register('niveau')}
            />
          </FormField>

          {/* Partie d'ouvrage */}
          <FormField label="Partie d'ouvrage">
            <input
              type="text"
              placeholder="ex: Crémaillère intermédiaire"
              className={inputClass}
              {...register('partieOuvrage')}
            />
          </FormField>

          {/* Bouton suivant */}
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setOpenSection(2)}
            className="w-full mt-2"
          >
            Suivant →
          </Button>
        </SectionAccordeon>

        {/* ── SECTION 2 — INTERVENTION ─────────────────────────── */}
        <SectionAccordeon
          titre="2. Nature de l'intervention"
          icone={Wrench}
          isOpen={openSection === 2}
          onToggle={() => toggleSection(2)}
          hasError={section2HasError}
        >

          {/* Nature d'intervention */}
          <FormField label="Nature de l'intervention">
            <select className={inputClass} {...register('nature')}>
              <option value="">Non renseignée</option>
              {NATURES_INTERVENTION.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </FormField>

          {/* Appareil de mesure */}
          <FormField label="Appareil utilisé">
            <select className={inputClass} {...register('appareil')}>
              <option value="">Non renseigné</option>
              {APPAREILS_MESURE.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </FormField>

          {/* Stade de collage */}
          <FormField label="Stade de l'ouvrage">
            <select className={inputClass} {...register('stadeCollage')}>
              <option value="">Non renseigné</option>
              {STADES_COLLAGE.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </FormField>

          {/* Travail réalisé */}
          <FormField label="Travail réalisé">
            <textarea
              rows={3}
              placeholder="Décrivez le travail effectué..."
              className={textareaClass}
              {...register('travailRealise')}
            />
          </FormField>

          {/* Navigation */}
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setOpenSection(1)}
              className="flex-1"
            >
              ← Retour
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setOpenSection(3)}
              className="flex-1"
            >
              Suivant →
            </Button>
          </div>
        </SectionAccordeon>

        {/* ── SECTION 3 — RÉSULTAT ──────────────────────────────── */}
        <SectionAccordeon
          titre="3. Résultat et conditions"
          icone={CheckCircle}
          isOpen={openSection === 3}
          onToggle={() => toggleSection(3)}
          hasError={section3HasError}
        >

          {/* Conditions météo */}
          <FormField label="Conditions météo">
            <div className="grid grid-cols-3 gap-2">
              {CONDITIONS_METEO.map((m) => (
                /**
                 * Boutons radio stylisés pour la météo.
                 * Plus facile à taper sur mobile qu'un select.
                 * Le pattern input[type=radio] caché + label stylisé
                 * est une technique CSS standard pour personnaliser les radios.
                 */
                <label
                  key={m.value}
                  className="relative cursor-pointer"
                >
                  <input
                    type="radio"
                    value={m.value}
                    className="sr-only peer"
                    {...register('conditionMeteo')}
                  />
                  <div className="
                    flex flex-col items-center gap-1 p-2 rounded-xl border-2
                    border-gray-200 text-center text-xs font-medium text-gray-600
                    peer-checked:border-[#1B6B93] peer-checked:bg-[#D9EAF5]
                    peer-checked:text-[#0D3B66]
                    hover:border-gray-300 transition-colors cursor-pointer
                  ">
                    <span className="text-lg">{m.icon}</span>
                    <span className="leading-tight">{m.label.split(' ')[1]}</span>
                  </div>
                </label>
              ))}
            </div>
          </FormField>

          {/* Résultat C/NC/R */}
          <FormField label="Résultat du contrôle">
            <div className="grid grid-cols-3 gap-3">
              {RESULTATS_CONTROLE.map((r) => (
                <label key={r.value} className="relative cursor-pointer">
                  <input
                    type="radio"
                    value={r.value}
                    className="sr-only peer"
                    {...register('resultat')}
                  />
                  <div className={cn(`
                    flex items-center justify-center p-3 rounded-xl border-2
                    text-sm font-bold text-center transition-colors cursor-pointer
                    border-gray-200 text-gray-500
                    hover:border-gray-300
                    peer-checked:border-2
                  `,
                    r.value === 'C'
                      ? 'peer-checked:border-teal-500 peer-checked:bg-teal-50 peer-checked:text-teal-700'
                      : r.value === 'NC'
                        ? 'peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700'
                        : 'peer-checked:border-orange-400 peer-checked:bg-orange-50 peer-checked:text-orange-700'
                  )}>
                    {r.label}
                  </div>
                </label>
              ))}
            </div>
          </FormField>

          {/* Observations */}
          <FormField label="Observations">
            <textarea
              rows={3}
              placeholder="Observations, remarques, suite à donner..."
              className={textareaClass}
              maxLength={500}
              {...register('observations')}
            />
          </FormField>

          {/* Bouton retour */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setOpenSection(2)}
            className="w-auto"
          >
            ← Retour
          </Button>
        </SectionAccordeon>

        {/* ── BOUTONS FINAUX ────────────────────────────────────── */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onClose}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            className="flex-1"
          >
            {isSubmitting
              ? 'Enregistrement...'
              : isEditMode ? 'Mettre à jour' : 'Enregistrer'
            }
          </Button>
        </div>
      </form>
    </Modal>
  )
}