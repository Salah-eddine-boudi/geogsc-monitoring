/**
 * @file brigade.repository.ts
 * @description Contrat (interface) du repository Brigade.
    * C'est la couche d'abstraction entre les use-cases et la BDD.
 *
 * OPÉRATIONS DISPONIBLES :
 * - findAll    → liste toutes les brigades (pour le dashboard IGT)
 * - findById   → une brigade par ID (pour voir ses fiches)
 * - findByNom  → vérifier si un nom existe déjà (éviter les doublons)
 * - create     → créer une nouvelle brigade (ADMIN seulement)
 * - update     → modifier une brigade existante (ADMIN seulement)
 */

import type { BrigadeEntity, BrigadeWithMembers } from './entities/brigade.entity.js'

export interface IBrigadeRepository {

  /**
    * Retourne toutes les brigades.
   * @param includeInactive - si true, inclut aussi les brigades désactivées
   */
  findAll(includeInactive?: boolean): Promise<BrigadeEntity[]>

  /**
   * Retourne une brigade par son ID avec ses membres.
   *
   * SCÉNARIO :
   * IGT clique sur "Brigade 01" → voit AIT KADIR + ses 2 topographes.
   *
   * @param id - identifiant unique de la brigade
   */
  findById(id: string): Promise<BrigadeWithMembers | null>

  /**
   * Vérifie si un nom de brigade existe déjà.
   * Utilisé avant la création pour éviter les doublons.
   *
   * SCÉNARIO :
   * Admin essaie de créer "Équipe 01" qui existe déjà → ConflictError.
   *
   * @param nom - nom à vérifier (ex: "Équipe 01")
   */
  findByNom(nom: string): Promise<BrigadeEntity | null>

  /**
   * Crée une nouvelle brigade en BDD.
   *
   * SCÉNARIO :
   * Le projet GSC s'agrandit → ADMIN crée une "Équipe 05".
   *
   * @param data - données de la nouvelle brigade
   */
  create(data: { nom: string; chef: string }): Promise<BrigadeEntity>

  /**
   * Met à jour une brigade existante.
   *
   * SCÉNARIO :
   * Changement de chef d'équipe → ADMIN met à jour le champ chef.
   *
   * @param id   - ID de la brigade à modifier
   * @param data - champs à mettre à jour (partiels)
   */
  update(id: string, data: Partial<{ nom: string; chef: string; actif: boolean }>): Promise<BrigadeEntity>
}