/**
 * @file controle.prisma.repo.ts
 * @description Implémentation Prisma du IControleRepository.
 *
 * PARTICULARITÉ :
 * Le statut est calculé automatiquement via le service domaine
 * calculerStatutControle() avant chaque create/update.
 * Jamais le frontend ne passe le statut directement.
 */

import { prisma } from '../prisma.js'
import type { IControleRepository, CreateControleData } from '../../../domain/repositories/controle.repository.js'
import type { ControleEntity } from '../../../domain/entities/controle.entity.js'
import { calculerStatutControle } from '../../../domain/services/controle.service.js'

export class ControlePrismaRepository implements IControleRepository {

  async findByMission(missionId: string): Promise<ControleEntity[]> {
    return prisma.controle.findMany({
      where: { missionId },
      orderBy: { createdAt: 'asc' }
    }) as Promise<ControleEntity[]>
  }

  async findById(id: string): Promise<ControleEntity | null> {
    return prisma.controle.findUnique({
      where: { id }
    }) as Promise<ControleEntity | null>
  }

  async create(data: CreateControleData): Promise<ControleEntity> {
    // Calcule le statut automatiquement
    const statut = calculerStatutControle({
      ecartX: data.ecartX,
      ecartY: data.ecartY,
      ecartZ: data.ecartZ,
      toleranceX: data.toleranceX,
      toleranceY: data.toleranceY,
      toleranceZ: data.toleranceZ
    })

    return prisma.controle.create({
      data: {
        missionId: data.missionId,
        type: data.type,
        statut,
        // ?? null → si non fourni, stocké comme null
        ecartX: data.ecartX ?? null,
        ecartY: data.ecartY ?? null,
        ecartZ: data.ecartZ ?? null,
        toleranceX: data.toleranceX ?? null,
        toleranceY: data.toleranceY ?? null,
        toleranceZ: data.toleranceZ ?? null,
        observations: data.observations ?? null
      }
    }) as Promise<ControleEntity>
  }

  async update(
    id: string,
    data: Partial<Omit<CreateControleData, 'missionId'>>
  ): Promise<ControleEntity> {

    // Récupère le contrôle existant pour merger les valeurs
    const existing = await prisma.controle.findUnique({ where: { id } })
    if (!existing) throw new Error('Contrôle introuvable')

    // Fusionne les nouvelles valeurs avec les existantes
    const merged = {
      ecartX: data.ecartX ?? existing.ecartX,
      ecartY: data.ecartY ?? existing.ecartY,
      ecartZ: data.ecartZ ?? existing.ecartZ,
      toleranceX: data.toleranceX ?? existing.toleranceX,
      toleranceY: data.toleranceY ?? existing.toleranceY,
      toleranceZ: data.toleranceZ ?? existing.toleranceZ
    }

    // Recalcule le statut avec les nouvelles valeurs fusionnées
    const statut = calculerStatutControle(merged)

    return prisma.controle.update({
      where: { id },
      data: { ...data, statut }
    }) as Promise<ControleEntity>
  }

  async delete(id: string): Promise<void> {
    await prisma.controle.delete({ where: { id } })
  }
}