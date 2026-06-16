/**
 * @file useMissionForm.ts
 * @description Hook personnalisé — logique du formulaire mission.
 *
 * CE QUE CE HOOK GÈRE :
 * → État du formulaire (react-hook-form + Zod)
 * → Soumission (création ou modification)
 * → Invalidation du cache React Query après succès
 * → Messages toast succès/erreur
 *
 * CE QUE CE HOOK NE GÈRE PAS :
 * → L'affichage (JSX) → c'est le rôle de MissionFormModal
 * → La navigation → c'est le rôle du router
 *
 * PATTERN : Séparation logique/présentation
 * Documenté dans les bonnes pratiques du projet.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { missionsService } from '../services/missions.service'
import type { Mission } from '../types/api.types'

// ─── SCHÉMA ZOD ───────────────────────────────────────────────────────────────

/**
 * Schéma de validation côté frontend.
 *
 * POURQUOI DUPLIQUER LE SCHÉMA BACKEND ?
 * → Validation immédiate sans appel réseau
 * → Messages d'erreur en français directement dans le formulaire
 * → UX bien meilleure sur mobile terrain
 *
 * RÈGLE : seul ouvrageId est obligatoire.
 * Saisie progressive — le brigadier complète au fur et à mesure.
 */
const missionSchema = z.object({
  ouvrageId: z.string().min(1, 'Veuillez sélectionner un ouvrage'),

  // Localisation
  zone:          z.enum(['A', 'B', 'C', 'D', 'HORS_ZONE']).optional(),
  axe:           z.string().max(50).optional(),
  fil:           z.string().max(20).optional(),
  niveau:        z.string().max(20).optional(),
  partieOuvrage: z.string().max(200).optional(),

  // Intervention
  nature: z.enum([
    'IMPLANTATION', 'CONTROLE_GEOMETRIQUE', 'CONTROLE_ALTIMETRIQUE',
    'RECEPTION', 'CONTRADICTOIRE', 'RELEVE_TOPOGRAPHIQUE', 'PIQUETAGE'
  ]).optional(),
  appareil: z.enum([
    'TRIMBLE_SX12', 'TRIMBLE_S7', 'LEICA_TS16',
    'LEICA_NA730', 'GPS_TRIMBLE', 'NIVEAU_OPTIQUE', 'AUTRE'
  ]).optional(),
  travailRealise: z.string().max(500).optional(),
  stadeCollage: z.enum([
    'AVANT_BETONNAGE', 'APRES_BETONNAGE',
    'AVANT_SOUDURE', 'APRES_SOUDURE', 'RECEPTION_FINALE'
  ]).optional(),

  // Résultat
  conditionMeteo: z.enum([
    'BEAU', 'NUAGEUX', 'PLUIE', 'VENT_FORT', 'BROUILLARD'
  ]).optional(),
  resultat:     z.enum(['C', 'NC', 'R']).optional(),
  observations: z.string().max(500).optional()
})

/**
 * Type inféré depuis le schéma Zod.
 * TypeScript connaît automatiquement la forme du formulaire.
 */
type MissionSchemaType = z.infer<typeof missionSchema>

// ─── TYPES DU HOOK ────────────────────────────────────────────────────────────

interface UseMissionFormProps {
  ficheId: string

  /**
   * Mission existante → mode édition.
   * Undefined → mode création.
   */
  mission?: Mission

  onSuccess: () => void
  onClose: () => void
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useMissionForm({
  ficheId,
  mission,
  onSuccess,
  onClose
}: UseMissionFormProps) {

  /**
   * queryClient → permet d'invalider le cache React Query
   * après une mutation réussie.
   * Déclenche un re-fetch automatique de la fiche.
   */
  const queryClient = useQueryClient()

  /**
   * useForm → hook principal de react-hook-form.
   *
   * defaultValues → pré-remplit le formulaire en mode édition.
   * En mode création → champs vides.
   *
   * zodResolver → connecte notre schéma Zod à react-hook-form.
   * La validation est déclenchée automatiquement à la soumission
   * et optionnellement onChange/onBlur.
   */
  const {
    register,      // connecte un input au formulaire
    handleSubmit,  // wrapper qui valide avant d'appeler onSubmit
    watch,         // observe la valeur d'un champ en temps réel
    setValue,      // modifie programmatiquement la valeur d'un champ
    reset,         // réinitialise le formulaire
    formState: {
      errors,       // erreurs de validation par champ
      isSubmitting  // true pendant la soumission
    }
  } = useForm<MissionSchemaType>({
    resolver: zodResolver(missionSchema),

    /**
     * Valeurs par défaut :
     * Mode édition → prérempli avec la mission existante
     * Mode création → tout vide sauf ouvrageId si passé
     */
    defaultValues: mission ? {
      ouvrageId:      mission.ouvrageId,
      zone:           mission.zone           ?? undefined,
      axe:            mission.axe            ?? undefined,
      fil:            mission.fil            ?? undefined,
      niveau:         mission.niveau         ?? undefined,
      partieOuvrage:  mission.partieOuvrage  ?? undefined,
      nature:         mission.nature         ?? undefined,
      appareil:       mission.appareil       ?? undefined,
      travailRealise: mission.travailRealise ?? undefined,
      stadeCollage:   mission.stadeCollage   ?? undefined,
      conditionMeteo: mission.conditionMeteo ?? undefined,
      resultat:       mission.resultat       ?? undefined,
      observations:   mission.observations   ?? undefined
    } : {}
  })

  /**
   * isEditMode → true si on modifie une mission existante.
   * Utilisé pour changer le titre et le texte du bouton.
   */
  const isEditMode = !!mission

  /**
   * onSubmit → appelé par handleSubmit APRÈS validation Zod réussie.
   *
   * MODE CRÉATION → POST /fiches/:ficheId/missions
   * MODE ÉDITION  → PATCH /fiches/:ficheId/missions/:id
   */
  const onSubmit = async (data: MissionSchemaType) => {
    try {
      if (isEditMode && mission) {
        // Mode édition — PATCH
        await missionsService.update(ficheId, mission.id, data)
        toast.success('Mission mise à jour ✓')
      } else {
        // Mode création — POST
        await missionsService.create(ficheId, data)
        toast.success('Mission ajoutée ✓')
      }

      /**
       * Invalide le cache de la fiche.
       * React Query re-fetche automatiquement les données fraîches.
       * L'accordéon des missions se met à jour sans refresh manuel.
       */
      await queryClient.invalidateQueries({ queryKey: ['fiche', ficheId] })

      onSuccess()
      onClose()
      reset()

    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string; code?: string } }
      }
      const message = axiosError.response?.data?.message ?? 'Erreur lors de la sauvegarde'
      toast.error(message)
    }
  }

  return {
    // react-hook-form
    register,
    handleSubmit: handleSubmit(onSubmit),
    watch,
    setValue,
    errors,
    isSubmitting,

    // Métadonnées
    isEditMode
  }
}