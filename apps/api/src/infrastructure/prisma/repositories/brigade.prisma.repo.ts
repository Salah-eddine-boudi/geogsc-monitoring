/**
 * @file brigade.prisma.repo.ts
 * @description Implémentation Prisma du IBrigadeRepository.
    * C'est la SEULE couche qui connaît Prisma.
 */

import { prisma } from '../prisma.js'
import type { IBrigadeRepository } from '../../../domain/brigade.repository.js'
import type { BrigadeEntity, BrigadeWithMembers } from '../../../domain/entities/brigade.entity.js'

export class BrigadePrismaRepository implements IBrigadeRepository {

  /**
   * Récupère toutes les brigades.
   *
   * @param includeInactive - false par défaut → retourne seulement actif: true
   *
   
   */
  async findAll(includeInactive = false): Promise<BrigadeEntity[]> {
    return prisma.brigade.findMany({
      where: includeInactive ? undefined : { actif: true },
      
      orderBy: { nom: 'asc' }
      
    })
  }


  async findById(id: string): Promise<BrigadeWithMembers | null> {
    return prisma.brigade.findUnique({
      where: { id },
      include: {
        membres: {
          
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true
          }
        }
      }
    }) as Promise<BrigadeWithMembers | null>
  }

 
  async findByNom(nom: string): Promise<BrigadeEntity | null> {
    return prisma.brigade.findUnique({
      where: { nom }
      
    })
  }

 
  async create(data: { nom: string; chef: string }): Promise<BrigadeEntity> {
    return prisma.brigade.create({
      data: {
        nom: data.nom,
        chef: data.chef
        
      }
    })
  }

  
  async update(
    id: string,
    data: Partial<{ nom: string; chef: string; actif: boolean }>
  ): Promise<BrigadeEntity> {
    return prisma.brigade.update({
      where: { id },
      data
      
    })
  }
}