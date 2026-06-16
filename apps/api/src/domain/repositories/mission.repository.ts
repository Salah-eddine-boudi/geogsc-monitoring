/**
 * @file mission.repository.ts
 * @description Contrat IBrigadeRepository pour les missions.
 *
 * OPÉRATIONS :
 * - findByFiche  → toutes les missions d'une fiche
 * - findById     → une mission complète avec contrôles
 * - create       → nouvelle mission PLANIFIEE
 * - update       → modifier statut/heures/observations
 * - delete       → supprimer une mission (BROUILLON seulement)
 */

import type { MissionEntity, MissionWithRelations } from '../entities/mission.entity.js'

export interface IMissionRepository {


  findByFiche(ficheId: string): Promise<MissionWithRelations[]>

  
  findById(id: string): Promise<MissionWithRelations | null>

  create(data: {
    ficheId: string
    ouvrageId: string
    observations?: string
  }): Promise<MissionEntity>

  
  update(id: string, data: Partial<{
    statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE'
    heureDebut: Date
    heureFin: Date
    observations: string
  }>): Promise<MissionEntity>

  
  delete(id: string): Promise<void>
}