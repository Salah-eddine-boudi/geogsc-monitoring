/**
 * @file get-all-brigades.use-case.test.ts
 * @description Tests unitaires — récupération de toutes les brigades.
 *
 * CE QU'ON TESTE :
 * 1. ADMIN → voit toutes les brigades (actives + inactives)
 * 2. IGT   → voit seulement les brigades actives
 * 3. BRIGADE → même chose que IGT
 * 4. Résultat vide → retourne tableau vide sans erreur
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAllBrigadesUseCase } from '../get-all-brigades.use-case.js'
import type { IBrigadeRepository } from '../../../domain/brigade.repository.js'
import type { BrigadeEntity } from '../../../domain/entities/brigade.entity.js'

// ─── DONNÉES DE TEST ──────────────────────────────────────────────────────────

/**
 * Brigades fictives représentant le chantier GSC.
 * 3 actives + 1 inactive (suspendue).
 */
const brigadesActives: BrigadeEntity[] = [
  {
    id: 'brigade-01',
    nom: 'Équipe 01',
    chef: 'M. Marouane AIT KADIR',
    actif: true,
    createdAt: new Date('2025-12-01')
  },
  {
    id: 'brigade-02',
    nom: 'Équipe 02',
    chef: 'M. Hamid TAKI',
    actif: true,
    createdAt: new Date('2025-12-01')
  },
  {
    id: 'brigade-03',
    nom: 'Équipe 03',
    chef: 'M. Rachid JEMI',
    actif: true,
    createdAt: new Date('2025-12-01')
  }
]

const brigadeInactive: BrigadeEntity = {
  id: 'brigade-04',
  nom: 'Équipe 04',
  chef: 'M. Youness ALLAOUI',
  actif: false,  // suspendue pendant Aid Al-Fitr
  createdAt: new Date('2025-12-01')
}

const toutesBrigades = [...brigadesActives, brigadeInactive]

// ─── MOCK REPOSITORY ──────────────────────────────────────────────────────────

const mockBrigadeRepository: IBrigadeRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findByNom: vi.fn(),
  create: vi.fn(),
  update: vi.fn()
}

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('getAllBrigadesUseCase', () => {

  beforeEach(() => vi.clearAllMocks())

  // ── ADMIN ────────────────────────────────────────────────────────────────────

  describe('👑 Rôle ADMIN', () => {

    it('voit toutes les brigades — actives ET inactives', async () => {
      // ARRANGE
      // ADMIN appelle findAll(true) → includeInactive = true
      vi.mocked(mockBrigadeRepository.findAll).mockResolvedValue(toutesBrigades)

      // ACT
      const result = await getAllBrigadesUseCase(
        { role: 'ADMIN' },
        mockBrigadeRepository
      )

      // ASSERT
      expect(result.brigades).toHaveLength(4)
      expect(result.total).toBe(4)

      // Vérifie que findAll a été appelé avec includeInactive = true
      expect(mockBrigadeRepository.findAll).toHaveBeenCalledWith(true)
    })

    it('voit la brigade inactive (Équipe 04 suspendue)', async () => {
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findAll).mockResolvedValue(toutesBrigades)

      // ACT
      const result = await getAllBrigadesUseCase(
        { role: 'ADMIN' },
        mockBrigadeRepository
      )

      // ASSERT — la brigade inactive est bien dans les résultats
      const brigade04 = result.brigades.find(b => b.id === 'brigade-04')
      expect(brigade04).toBeDefined()
      expect(brigade04?.actif).toBe(false)
    })
  })

  // ── IGT ──────────────────────────────────────────────────────────────────────

  describe('🔍 Rôle IGT', () => {

    it('voit seulement les brigades actives', async () => {
      // ARRANGE
      // IGT appelle findAll(false) → includeInactive = false
      vi.mocked(mockBrigadeRepository.findAll).mockResolvedValue(brigadesActives)

      // ACT
      const result = await getAllBrigadesUseCase(
        { role: 'IGT' },
        mockBrigadeRepository
      )

      // ASSERT
      expect(result.brigades).toHaveLength(3)
      expect(result.total).toBe(3)

      // Vérifie que findAll a été appelé avec includeInactive = false
      expect(mockBrigadeRepository.findAll).toHaveBeenCalledWith(false)
    })

    it('ne voit pas la brigade inactive', async () => {
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findAll).mockResolvedValue(brigadesActives)

      // ACT
      const result = await getAllBrigadesUseCase(
        { role: 'IGT' },
        mockBrigadeRepository
      )

      // ASSERT — brigade-04 absente des résultats
      const brigade04 = result.brigades.find(b => b.id === 'brigade-04')
      expect(brigade04).toBeUndefined()
    })
  })

  // ── BRIGADE ───────────────────────────────────────────────────────────────────

  describe('👷 Rôle BRIGADE', () => {

    it('voit seulement les brigades actives comme IGT', async () => {
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findAll).mockResolvedValue(brigadesActives)

      // ACT
      const result = await getAllBrigadesUseCase(
        { role: 'BRIGADE' },
        mockBrigadeRepository
      )

      // ASSERT
      expect(result.total).toBe(3)
      expect(mockBrigadeRepository.findAll).toHaveBeenCalledWith(false)
    })
  })

  // ── CAS LIMITES ───────────────────────────────────────────────────────────────

  describe('⚠️ Cas limites', () => {

    it('retourne un tableau vide si aucune brigade', async () => {
      // ARRANGE — aucune brigade en BDD
      vi.mocked(mockBrigadeRepository.findAll).mockResolvedValue([])

      // ACT
      const result = await getAllBrigadesUseCase(
        { role: 'IGT' },
        mockBrigadeRepository
      )

      // ASSERT — pas d'erreur, juste un tableau vide
      expect(result.brigades).toEqual([])
      expect(result.total).toBe(0)
    })

    it('appelle findAll exactement une fois', async () => {
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findAll).mockResolvedValue(brigadesActives)

      // ACT
      await getAllBrigadesUseCase({ role: 'IGT' }, mockBrigadeRepository)

      // ASSERT — pas d'appels multiples inutiles
      expect(mockBrigadeRepository.findAll).toHaveBeenCalledTimes(1)
    })
  })
})