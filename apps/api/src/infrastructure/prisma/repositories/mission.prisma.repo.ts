/**
 * @file mission.prisma.repo.ts
 * @description Implémentation Prisma du IMissionRepository.
 *
 * RESPONSABILITÉ UNIQUE :
 * Ce fichier est la SEULE couche qui connaît Prisma.
 * Les use-cases ne voient que l'interface IMissionRepository.
 * Si on change de BDD demain → on modifie seulement ce fichier.
 */

import { prisma } from '../prisma.js'
import type { IMissionRepository } from '../../../domain/repositories/mission.repository.js'
import type { MissionEntity, MissionWithRelations } from '../../../domain/entities/mission.entity.js'

/**
 * Include standard — utilisé dans findByFiche et findById.
 * Défini une seule fois pour éviter la duplication.
 *
 * BONNE PRATIQUE : DRY (Don't Repeat Yourself)
 * Si on ajoute un champ à inclure → on modifie ici seulement.
 */
const MISSION_INCLUDE = {
  ouvrage: {
    select: {
      id: true,
      reference: true,
      designation: true,
      type: true,
      axe: true,
      niveau: true
    }
  },
  controles: true,
  _count: {
    select: { controles: true }
  }
} as const

export class MissionPrismaRepository implements IMissionRepository {

  async findByFiche(ficheId: string): Promise<MissionWithRelations[]> {
    return prisma.mission.findMany({
      where: { ficheId },
      include: MISSION_INCLUDE,
      orderBy: { createdAt: 'asc' }
    }) as Promise<MissionWithRelations[]>
  }

  async findById(id: string): Promise<MissionWithRelations | null> {
    return prisma.mission.findUnique({
      where: { id },
      include: MISSION_INCLUDE
    }) as Promise<MissionWithRelations | null>
  }

  /**
   * create() — sauvegarde une nouvelle mission avec tous les champs CDC.
   *
   * POURQUOI ?? null pour chaque champ optionnel ?
   * Prisma interprète undefined comme "ne pas modifier ce champ"
   * et null comme "mettre à null en BDD".
   * Pour une création, on veut null (valeur explicite), pas undefined.
   */
  async create(data: {
    ficheId: string
    ouvrageId: string

    // Localisation
    zone?:          string
    axe?:           string
    fil?:           string
    niveau?:        string
    partieOuvrage?: string

    // Intervention
    nature?:         string
    appareil?:       string
    travailRealise?: string
    stadeCollage?:   string

    // Résultat
    conditionMeteo?: string
    resultat?:       string
    observations?:   string
  }): Promise<MissionEntity> {
    return prisma.mission.create({
      data: {
        // Champs obligatoires
        ficheId:   data.ficheId,
        ouvrageId: data.ouvrageId,
        statut:    'PLANIFIEE',  // toujours PLANIFIEE à la création

        // Localisation — null si absent
        zone:          (data.zone as any)          ?? null,
        axe:           data.axe                    ?? null,
        fil:           data.fil                    ?? null,
        niveau:        data.niveau                 ?? null,
        partieOuvrage: data.partieOuvrage          ?? null,

        // Intervention — null si absent
        nature:         (data.nature as any)        ?? null,
        appareil:       (data.appareil as any)      ?? null,
        travailRealise: data.travailRealise          ?? null,
        stadeCollage:   (data.stadeCollage as any)  ?? null,

        // Résultat — null si absent
        conditionMeteo: (data.conditionMeteo as any) ?? null,
        resultat:       data.resultat                ?? null,
        observations:   data.observations            ?? null
      }
    })
  }

  /**
   * update() — modifie les champs fournis uniquement.
   *
   * PATCH = modification partielle.
   * On spread data directement → Prisma met à jour
   * seulement les champs présents dans l'objet.
   * Les champs absents restent inchangés en BDD.
   */
  async update(
    id: string,
    data: Partial<{
      statut:     'PLANIFIEE' | 'EN_COURS' | 'TERMINEE'
      heureDebut: Date
      heureFin:   Date

      // Localisation
      zone:          string
      axe:           string
      fil:           string
      niveau:        string
      partieOuvrage: string

      // Intervention
      nature:         string
      appareil:       string
      travailRealise: string
      stadeCollage:   string

      // Résultat
      conditionMeteo: string
      resultat:       string
      observations:   string
    }>
  ): Promise<MissionEntity> {
    return prisma.mission.update({
      where: { id },
      /**
       * On spread data directement.
       * Prisma ignore les champs undefined automatiquement.
       * Seuls les champs présents dans data sont mis à jour.
       *
       * EXEMPLE :
       * data = { axe: "Axe D03", resultat: "C" }
       * → Prisma UPDATE SET axe='Axe D03', resultat='C'
       * → Les autres champs restent inchangés
       */
      data: data as any
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.mission.delete({ where: { id } })
  }
}