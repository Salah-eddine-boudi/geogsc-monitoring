/**
 * @file useMissionForm.ts
 * @description Hook — logique du formulaire mission (affiché "Réception").
 *
 * FIXES v2.1 :
 * ✅ FIX erreur 2719 — z.preprocess() retiré, ecartMm = z.string()
 *    (le cast number se fait dans onSubmit, évite le conflit de types zodResolver)
 * ✅ FIX erreur 2352 — cast payload via "as unknown as"
 * ✅ FIX erreurs 2339/2551 — Mission étendu dans api.types.ts (voir patch)
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { missionsService, type CreateMissionPayload } from '../services/missions.service'
import type { Mission } from '../types/api.types'

// ─── SCHÉMA ZOD ──────────────────────────────────────────────────────────────
// RÈGLE : pas de z.preprocess() — ça crée des conflits de types avec zodResolver.
// Les transformations de type (string → number) se font dans onSubmit.

const missionSchema = z.object({
  // §1 Identification
  ouvrageId:               z.string().min(1, 'Veuillez sélectionner un ouvrage'),
  typeOuvrage:             z.string().optional(),
  categorieAssainissement: z.string().optional(),
  ficheReference:          z.string().max(100).optional(),

  // §2 Localisation
  zone:          z.string().optional(),
  sousZone:      z.string().max(100).optional(),
  axe:           z.string().max(50).optional(),
  fil:           z.string().max(20).optional(),
  niveau:        z.string().max(20).optional(),
  partieOuvrage: z.string().max(300).optional(),

  // §3 Intervention
  nature:             z.string().optional(),
  stadeCollage:       z.string().optional(),
  provenanceAppareil: z.string().optional(),
  nomAppareil:        z.string().max(100).optional(),
  periode:            z.string().optional(),
  // ecartMm : gardé en string dans le formulaire, converti en number dans onSubmit
  ecartMm:            z.string().optional(),
  travailRealise:     z.string().max(500).optional(),

  // §4 Résultat
  resultat:       z.string().optional(),
  observationsNc: z.string().max(500).optional(),

  // §5 Observations
  observations: z.string().max(500).optional(),
})

type MissionSchemaType = z.infer<typeof missionSchema>

// ─── TYPES DU HOOK ────────────────────────────────────────────────────────────

interface UseMissionFormProps {
  ficheId:   string
  mission?:  Mission
  onSuccess: () => void
  onClose:   () => void
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useMissionForm({
  ficheId,
  mission,
  onSuccess,
  onClose,
}: UseMissionFormProps) {

  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MissionSchemaType>({
    resolver: zodResolver(missionSchema),
    defaultValues: mission
      ? {
          ouvrageId:               mission.ouvrageId,
          typeOuvrage:             mission.typeOuvrage             ?? undefined,
          categorieAssainissement: mission.categorieAssainissement ?? undefined,
          ficheReference:          mission.ficheReference          ?? undefined,
          zone:                    mission.zone                    ?? undefined,
          sousZone:                mission.sousZone                ?? undefined,
          axe:                     mission.axe                     ?? undefined,
          fil:                     mission.fil                     ?? undefined,
          niveau:                  mission.niveau                  ?? undefined,
          partieOuvrage:           mission.partieOuvrage           ?? undefined,
          nature:                  mission.nature                  ?? undefined,
          stadeCollage:            mission.stadeCollage            ?? undefined,
          provenanceAppareil:      mission.provenanceAppareil      ?? undefined,
          nomAppareil:             mission.nomAppareil             ?? undefined,
          periode:                 mission.periode                 ?? 'JOUR',
          // ecartMm : number → string pour l'input HTML
          ecartMm:                 mission.ecartMm != null
                                     ? String(mission.ecartMm)
                                     : undefined,
          travailRealise:          mission.travailRealise          ?? undefined,
          resultat:                mission.resultat                ?? undefined,
          observationsNc:          mission.observationsNc          ?? undefined,
          observations:            mission.observations            ?? undefined,
        }
      : {
          periode:            'JOUR',
          provenanceAppareil: 'GEOCODING',
          stadeCollage:       'NA',
        },
  })

  const isEditMode = !!mission

  // ─── SOUMISSION ───────────────────────────────────────────────────────────

  const onSubmit = async (data: MissionSchemaType) => {
    try {
      // Nettoyage : "" → null (Prisma rejette les chaînes vides sur les optionnels)
      const cleaned: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(data)) {
        cleaned[key] = value === '' ? null : value
      }

      // Conversion ecartMm string → number | null
      if (cleaned.ecartMm !== null && cleaned.ecartMm !== undefined) {
        const parsed = parseFloat(cleaned.ecartMm as string)
        cleaned.ecartMm = Number.isNaN(parsed) ? null : parsed
      }

      // Cast sûr : on passe par "unknown" pour éviter l'erreur 2352
      const payload = cleaned as unknown as CreateMissionPayload

      if (isEditMode && mission) {
        await missionsService.update(ficheId, mission.id, payload)
        toast.success('Réception mise à jour ✓')
      } else {
        await missionsService.create(ficheId, payload)
        toast.success('Réception ajoutée ✓')
      }

      await queryClient.invalidateQueries({ queryKey: ['fiche', ficheId] })
      onSuccess()
      onClose()
      reset()

    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string; code?: string } }
      }
      const message =
        axiosError.response?.data?.message ?? 'Erreur lors de la sauvegarde'
      toast.error(message)
    }
  }

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    watch,
    setValue,
    errors,
    isSubmitting,
    isEditMode,
  }
}