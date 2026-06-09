/**
 * @file fiche.repository.ts
 * @description Contrat IBrigadeRepository pour les fiches journalières.
 *
 * OPÉRATIONS :
 * - findAll    → liste avec filtres (brigade, date, statut)
 * - findById   → une fiche complète avec missions
 * - findByBrigadeAndDate → vérifie doublon du jour
 * - create     → nouvelle fiche BROUILLON
 * - updateStatut → changement de statut (soumettre/valider/rejeter)
 * - update     → modifier observations (BROUILLON seulement)
 */

import type { FicheEntity, FicheWithRelations } from '../entities/fiche.entity.js'

/**
 * Filtres pour la liste des fiches.
 *
 * SCÉNARIOS :
 * - IGT voit toutes les fiches → pas de filtre brigadeId
 * - Brigade voit ses fiches → brigadeId = sa brigade
 * - Filtrer par statut → statut = 'SOUMISE' (fiches à valider)
 * - Filtrer par date → dateDebut/dateFin pour un rapport mensuel
 */
export type FicheFilters = {
  brigadeId?: string
  statut?: 'BROUILLON' | 'SOUMISE' | 'VALIDEE' | 'REJETEE'
  dateDebut?: Date
  dateFin?: Date
  page?: number
  limit?: number
}

export interface IFicheRepository {

  /**
   * Liste les fiches avec filtres et pagination.
   *
   * SCÉNARIO IGT :
   * Dashboard → toutes les fiches SOUMISES du jour pour validation
   *
   * SCÉNARIO BRIGADE :
   * Historique → ses fiches du mois en cours
   */
  findAll(filters: FicheFilters): Promise<{
    fiches: FicheEntity[]
    total: number
  }>

  /**
   * Retourne une fiche complète avec toutes ses relations.
   * Brigade + Créateur + Validateur + Missions + Ouvrages
   */
  findById(id: string): Promise<FicheWithRelations | null>

  /**
   * Vérifie si une fiche existe déjà pour cette brigade ce jour.
   * Utilisé avant création pour éviter les doublons.
   *
   * RÈGLE MÉTIER :
   * 1 brigade = 1 fiche maximum par jour
   */
  findByBrigadeAndDate(brigadeId: string, date: Date): Promise<FicheEntity | null>

  /**
   * Crée une nouvelle fiche en statut BROUILLON.
   */
  create(data: {
    date: Date
    brigadeId: string
    createurId: string
    observations?: string
  }): Promise<FicheEntity>

  /**
   * Met à jour le statut d'une fiche.
   * Utilisé pour : soumettre, valider, rejeter.
   *
   * @param validateurId - ID de l'IGT qui valide/rejette (null pour soumettre)
   */
  updateStatut(id: string, data: {
    statut: 'SOUMISE' | 'VALIDEE' | 'REJETEE'
    validateurId?: string
    observations?: string
  }): Promise<FicheEntity>

  /**
   * Met à jour les observations d'une fiche BROUILLON.
   * Impossible si la fiche est SOUMISE/VALIDEE/REJETEE.
   */
  update(id: string, data: {
    observations?: string
  }): Promise<FicheEntity>
}