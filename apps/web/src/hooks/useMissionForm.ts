/**
 * @file useMissionForm.ts — v4
 * Ajout : onMissionCreated(id) pour récupérer l'ID après création
 * → permet d'uploader les photos immédiatement après
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { missionsService, type CreateMissionPayload } from '../services/missions.service'
import { getErrorMessage } from '../utils/error-messages'
import type { Mission } from '../types/api.types'

const missionSchema = z.object({
  ouvrageId:               z.string().min(1, 'Veuillez sélectionner un ouvrage'),
  typeOuvrage:             z.string().optional(),
  categorieAssainissement: z.string().optional(),
  ficheReference:          z.string().max(100).optional(),
  zone:                    z.string().optional(),
  sousZone:                z.string().max(100).optional(),
  axe:                     z.string().max(50).optional(),
  fil:                     z.string().max(20).optional(),
  niveau:                  z.string().max(20).optional(),
  partieOuvrage:           z.string().max(300).optional(),
  nature:                  z.string().optional(),
  stadeCollage:            z.string().optional(),
  provenanceAppareil:      z.string().optional(),
  nomAppareil:             z.string().max(100).optional(),
  ecartMm:                 z.string().optional(),
  travailRealise:          z.string().max(500).optional(),
  resultat:                z.string().optional(),
  observationsNc:          z.string().max(500).optional(),
  observations:            z.string().max(500).optional(),
})

type MissionSchemaType = z.infer<typeof missionSchema>

interface UseMissionFormProps {
  ficheId:           string
  mission?:          Mission
  onSuccess:         () => void
  onClose:           () => void
  onError?:          (message: string) => void
  onMissionCreated?: (missionId: string) => void  // NEW — ID de la mission créée
}

export function useMissionForm({
  ficheId, mission, onSuccess, onClose, onError, onMissionCreated,
}: UseMissionFormProps) {

  const queryClient = useQueryClient()

  const {
    register, handleSubmit, watch, setValue, reset,
    formState: { errors, isSubmitting },
  } = useForm<MissionSchemaType>({
    resolver: zodResolver(missionSchema),
    defaultValues: mission ? {
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
      ecartMm:                 mission.ecartMm != null ? String(mission.ecartMm) : undefined,
      travailRealise:          mission.travailRealise          ?? undefined,
      resultat:                mission.resultat                ?? undefined,
      observationsNc:          mission.observationsNc          ?? undefined,
      observations:            mission.observations            ?? undefined,
    } : {
      provenanceAppareil: 'GEOCODING',
      stadeCollage:       'NA',
    },
  })

  const isEditMode = !!mission

  const onSubmit = async (data: MissionSchemaType) => {
    try {
      const cleaned: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(data)) {
        cleaned[k] = v === '' ? null : v
      }

      if (cleaned.ecartMm !== null && cleaned.ecartMm !== undefined) {
        const n = parseFloat(cleaned.ecartMm as string)
        cleaned.ecartMm = isNaN(n) ? null : n
      }

      const payload = cleaned as unknown as CreateMissionPayload

      if (isEditMode && mission) {
        await missionsService.update(ficheId, mission.id, payload)
        toast.success('Réception mise à jour ✓')
        onMissionCreated?.(mission.id)
      } else {
        const nouvelleMission = await missionsService.create(ficheId, payload)
        toast.success('Réception enregistrée ✓')
        // Transmettre l'ID pour que le modal puisse uploader les photos
        onMissionCreated?.(nouvelleMission.id)
      }

      await queryClient.invalidateQueries({ queryKey: ['fiche', ficheId] })
      onSuccess()
      onClose()
      reset()

    } catch (error: unknown) {
      const message = getErrorMessage(error)
      onError?.(message)
      toast.error(message, { duration: 5000 })
    }
  }

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    watch, setValue, errors, isSubmitting, isEditMode,
  }
}