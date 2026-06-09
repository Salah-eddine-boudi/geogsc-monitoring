/**
 * @file mission.prisma.repo.ts
 * @description Implémentation Prisma du IMissionRepository.
 * Seule couche qui connaît Prisma — les use-cases ne voient que l'interface.
 */

import { prisma } from '../prisma.js'
import type { IMissionRepository } from '../../../domain/repositories/mission.repository.js'
import type { MissionEntity, MissionWithRelations } from '../../../domain/entities/mission.entity.js'

export class MissionPrismaRepository implements IMissionRepository {

 
  async findByFiche(ficheId: string): Promise<MissionWithRelations[]> {
    return prisma.mission.findMany({
      where: { ficheId },
      include: {
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
      },
      orderBy: { createdAt: 'asc' }
    }) as Promise<MissionWithRelations[]>
  }

  
  async findById(id: string): Promise<MissionWithRelations | null> {
    return prisma.mission.findUnique({
      where: { id },
      include: {
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
      }
    }) as Promise<MissionWithRelations | null>
  }


  async create(data: {
    ficheId: string
    ouvrageId: string
    observations?: string
  }): Promise<MissionEntity> {
    return prisma.mission.create({
      data: {
        ficheId: data.ficheId,
        ouvrageId: data.ouvrageId,
        observations: data.observations ?? null,
        statut: 'PLANIFIEE'
      }
    })
  }

  async update(
    id: string,
    data: Partial<{
      statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE'
      heureDebut: Date
      heureFin: Date
      observations: string
    }>
  ): Promise<MissionEntity> {
    return prisma.mission.update({
      where: { id },
      data
    })
  }

 
  async delete(id: string): Promise<void> {
    await prisma.mission.delete({
      where: { id }
    })
  }
}