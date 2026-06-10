/**
 * @file controle.repository.ts
 * @description Contrat IControleRepository.
 *
 * OPÉRATIONS :
 * - findByMission → tous les contrôles d'une mission
 * - findById      → un contrôle par ID
 * - create        → nouveau contrôle avec calcul statut automatique
 * - update        → modifier un contrôle (BROUILLON seulement)
 * - delete        → supprimer un contrôle (BROUILLON seulement)
 */

import type { ControleEntity } from '../entities/controle.entity.js'

export type CreateControleData = {
  missionId: string
  type: 'IMPLANTATION' | 'ALTIMETRIE' | 'VERTICALITY' | 'RECEPTION' | 'CONTRADICTOIRE'
  ecartX?: number
  ecartY?: number
  ecartZ?: number
  toleranceX?: number
  toleranceY?: number
  toleranceZ?: number
  observations?: string
}

export interface IControleRepository {

  /**
   * Retourne tous les contrôles d'une mission.
   *
   * SCÉNARIO :
   * IGT examine la mission → voit tous les contrôles
   * avec leurs écarts et statuts
   */
  findByMission(missionId: string): Promise<ControleEntity[]>

  /**
   * Retourne un contrôle par son ID.
   */
  findById(id: string): Promise<ControleEntity | null>

  /**
   * Crée un nouveau contrôle.
   * Le statut est calculé automatiquement selon les écarts et tolérances.
   */
  create(data: CreateControleData): Promise<ControleEntity>

  /**
   * Met à jour un contrôle existant.
   * Recalcule le statut automatiquement.
   */
  update(
    id: string,
    data: Partial<Omit<CreateControleData, 'missionId'>>
  ): Promise<ControleEntity>

  /**
   * Supprime un contrôle.
   */
  delete(id: string): Promise<void>
}