/**
 * @file mission.prisma.repo.ts
 * @description Implémentation Prisma du IMissionRepository.
 *
 * NOTE : periode, ecartMm, observationsNc sont commentés
 * jusqu'à la migration BDD. Décommenter après :
 *   pnpm exec prisma migrate dev --name add_periode_ecartmm_observationsnc
 */

import { prisma } from '../prisma.js'
import type { IMissionRepository } from '../../../domain/repositories/mission.repository.js'
import type { MissionEntity, MissionWithRelations } from '../../../domain/entities/mission.entity.js'

const MISSION_INCLUDE = {
  ouvrage: {
    select: {
      id: true, reference: true, designation: true,
      type: true, axe: true, niveau: true
    }
  },
  controles: true,
  _count: { select: { controles: true } }
} as const

export class MissionPrismaRepository implements IMissionRepository {

  async findByFiche(ficheId: string): Promise<MissionWithRelations[]> {
    const result = await prisma.mission.findMany({
      where:   { ficheId, deletedAt: null },
      include: MISSION_INCLUDE,
      orderBy: { createdAt: 'asc' }
    })
    return result as unknown as MissionWithRelations[]
  }

  async findById(id: string): Promise<MissionWithRelations | null> {
    const result = await prisma.mission.findUnique({
      where:   { id },
      include: MISSION_INCLUDE
    })
    return result as unknown as MissionWithRelations | null
  }

  async create(data: {
    ficheId:   string
    ouvrageId: string
    zone?:          string
    sousZone?:      string
    axe?:           string
    fil?:           string
    niveau?:        string
    partieOuvrage?: string
    nature?:             string
    stadeCollage?:       string
    provenanceAppareil?: string
    nomAppareil?:        string
    appareil?:           string
    // periode?:         string   ← EN ATTENTE MIGRATION
    // ecartMm?:         number   ← EN ATTENTE MIGRATION
    travailRealise?:     string
    resultat?:           string
    // observationsNc?:  string   ← EN ATTENTE MIGRATION
    typeOuvrage?:             string
    categorieAssainissement?: string
    ficheReference?:          string
    observations?:            string
  }): Promise<MissionEntity> {
    const result = await prisma.mission.create({
      data: {
        ficheId:   data.ficheId,
        ouvrageId: data.ouvrageId,
        statut:    'PLANIFIEE',
        zone:               (data.zone as any)               ?? null,
        sousZone:            data.sousZone                   ?? null,
        axe:                 data.axe                        ?? null,
        fil:                 data.fil                        ?? null,
        niveau:              data.niveau                     ?? null,
        partieOuvrage:       data.partieOuvrage              ?? null,
        nature:             (data.nature as any)             ?? null,
        stadeCollage:       (data.stadeCollage as any)       ?? null,
        provenanceAppareil: (data.provenanceAppareil as any) ?? null,
        nomAppareil:         data.nomAppareil                ?? null,
        appareil:           (data.appareil as any)           ?? null,
        // periode et ecartMm retirés jusqu'à migration
        travailRealise:      data.travailRealise              ?? null,
        resultat:           (data.resultat as any)           ?? null,
        // observationsNc retiré jusqu'à migration
        typeOuvrage:        (data.typeOuvrage as any)        ?? null,
        categorieAssainissement: (data.categorieAssainissement as any) ?? null,
        ficheReference:      data.ficheReference             ?? null,
        observations:        data.observations               ?? null,
      } as any
    })
    return result as unknown as MissionEntity
  }

  async update(
    id: string,
    data: Partial<{
      statut:    'PLANIFIEE' | 'EN_COURS' | 'TERMINEE'
      heureDebut: Date
      heureFin:   Date
      zone:          string
      sousZone:      string
      axe:           string
      fil:           string
      niveau:        string
      partieOuvrage: string
      nature:             string
      stadeCollage:       string
      provenanceAppareil: string
      nomAppareil:        string
      appareil:           string
      travailRealise:     string
      resultat:       string
      typeOuvrage:             string
      categorieAssainissement: string
      ficheReference:          string
      observations:            string
    }>
  ): Promise<MissionEntity> {
    const result = await prisma.mission.update({
      where: { id },
      data:  data as any
    })
    return result as unknown as MissionEntity
  }

  async delete(id: string): Promise<void> {
    await prisma.mission.update({
      where: { id },
      data:  { deletedAt: new Date() }
    })
  }
}