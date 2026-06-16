/**
 * @file create-mission.use-case.test.ts
 * @description Tests unitaires — création d'une mission.
 *
 * CE QU'ON TESTE :
 * ✅ Création réussie dans une fiche BROUILLON
 * ❌ Fiche inexistante → NotFoundError
 * ❌ Fiche d'une autre brigade → ForbiddenError
 * ❌ Fiche non BROUILLON → AppError STATUT_INVALIDE
 * ❌ Ouvrage inexistant → NotFoundError
 * ❌ Ouvrage inactif → NotFoundError
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMissionUseCase } from '../create-mission.use-case.js'
import { NotFoundError, ForbiddenError, AppError } from '../../../domain/errors.js'
import type { IMissionRepository } from '../../../domain/repositories/mission.repository.js'
import type { IFicheRepository } from '../../../domain/repositories/fiche.repository.js'
import type { IOuvrageRepository } from '../../../domain/repositories/ouvrage.repository.js'
import type { FicheWithRelations } from '../../../domain/entities/fiche.entity.js'
import type { OuvrageEntity } from '../../../domain/entities/ouvrage.entity.js'
import type { MissionEntity } from '../../../domain/entities/mission.entity.js'

// ─── DONNÉES DE TEST ──────────────────────────────────────────────────────────

const ficheBrouillon: FicheWithRelations = {
  id: 'fiche-001',
  date: new Date('2026-06-09'),
  statut: 'BROUILLON',
  observations: null,
  brigadeId: 'brigade-01',
  createurId: 'user-001',
  validateurId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  brigade: { id: 'brigade-01', nom: 'Équipe 01', chef: 'M. AIT KADIR' },
  createur: { id: 'user-001', nom: 'AIT KADIR', prenom: 'Marouane' },
  validateur: null,
  missions: [],
  _count: { missions: 0 }
}

const ficheSoumise: FicheWithRelations = {
  ...ficheBrouillon,
  statut: 'SOUMISE'
}

const ficheValidee: FicheWithRelations = {
  ...ficheBrouillon,
  statut: 'VALIDEE'
}

const ouvrageActif: OuvrageEntity = {
  id: 'ouvrage-001',
  reference: 'PLT-A-01',
  designation: 'Platine charpente axe A-01',
  type: 'PLATINE',
  axe: 'Axe A',
  niveau: 'R+1',
  actif: true,
  createdAt: new Date()
}

const ouvrageInactif: OuvrageEntity = {
  ...ouvrageActif,
  actif: false
}

const missionCreee: MissionEntity = {
  id: 'mission-001',
  statut: 'PLANIFIEE',
  heureDebut: null,
  heureFin: null,
  observations: null,
  ficheId: 'fiche-001',
  ouvrageId: 'ouvrage-001',
  createdAt: new Date(),
  updatedAt: new Date()
}

// ─── MOCKS ────────────────────────────────────────────────────────────────────

const mockMissionRepository: IMissionRepository = {
  findByFiche: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn()
}

const mockFicheRepository: IFicheRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findByBrigadeAndDate: vi.fn(),
  create: vi.fn(),
  updateStatut: vi.fn(),
  update: vi.fn()
}

const mockOuvrageRepository: IOuvrageRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findByReference: vi.fn()
}

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('createMissionUseCase', () => {

  beforeEach(() => vi.clearAllMocks())

  describe('✅ Création réussie', () => {

    it('crée une mission en statut PLANIFIEE', async () => {
      // ARRANGE
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockOuvrageRepository.findById).mockResolvedValue(ouvrageActif)
      vi.mocked(mockMissionRepository.create).mockResolvedValue(missionCreee)

      // ACT
      const result = await createMissionUseCase(
        {
          ficheId: 'fiche-001',
          ouvrageId: 'ouvrage-001',
          userBrigadeId: 'brigade-01',
          userRole: 'BRIGADE'
        },
        mockMissionRepository,
        mockFicheRepository,
        mockOuvrageRepository
      )

      // ASSERT
      expect(result.statut).toBe('PLANIFIEE')
      expect(result.heureDebut).toBeNull()
      expect(result.heureFin).toBeNull()
      expect(result.ficheId).toBe('fiche-001')
    })

    it('appelle create avec les bonnes données', async () => {
      // ARRANGE
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockOuvrageRepository.findById).mockResolvedValue(ouvrageActif)
      vi.mocked(mockMissionRepository.create).mockResolvedValue(missionCreee)

      // ACT
      await createMissionUseCase(
        {
          ficheId: 'fiche-001',
          ouvrageId: 'ouvrage-001',
          observations: 'Conditions météo bonnes',
          userBrigadeId: 'brigade-01',
          userRole: 'BRIGADE'
        },
        mockMissionRepository,
        mockFicheRepository,
        mockOuvrageRepository
      )

      // ASSERT
      expect(mockMissionRepository.create).toHaveBeenCalledWith({
        ficheId: 'fiche-001',
        ouvrageId: 'ouvrage-001',
        observations: 'Conditions météo bonnes'
      })
    })

    it('IGT peut créer une mission dans n\'importe quelle fiche', async () => {
      // ARRANGE
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockOuvrageRepository.findById).mockResolvedValue(ouvrageActif)
      vi.mocked(mockMissionRepository.create).mockResolvedValue(missionCreee)

      // ACT & ASSERT — pas d'erreur pour IGT
      await expect(
        createMissionUseCase(
          {
            ficheId: 'fiche-001',
            ouvrageId: 'ouvrage-001',
            userBrigadeId: undefined, // IGT n'a pas de brigade
            userRole: 'IGT'
          },
          mockMissionRepository,
          mockFicheRepository,
          mockOuvrageRepository
        )
      ).resolves.toBeDefined()
    })
  })

  describe('❌ Cas d\'erreur', () => {

    it('lance NotFoundError si la fiche n\'existe pas', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(null)

      await expect(
        createMissionUseCase(
          { ficheId: 'fiche-inexistante', ouvrageId: 'ouvrage-001', userBrigadeId: 'brigade-01', userRole: 'BRIGADE' },
          mockMissionRepository, mockFicheRepository, mockOuvrageRepository
        )
      ).rejects.toThrow(NotFoundError)
    })

    it('lance ForbiddenError si la fiche appartient à une autre brigade', async () => {
      // SCÉNARIO : Brigade 02 essaie d'ajouter une mission à la fiche de Brigade 01
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      // ficheBrouillon.brigadeId = 'brigade-01'
      // userBrigadeId = 'brigade-02' → accès interdit

      await expect(
        createMissionUseCase(
          { ficheId: 'fiche-001', ouvrageId: 'ouvrage-001', userBrigadeId: 'brigade-02', userRole: 'BRIGADE' },
          mockMissionRepository, mockFicheRepository, mockOuvrageRepository
        )
      ).rejects.toThrow(ForbiddenError)
    })

    it('lance AppError STATUT_INVALIDE si fiche SOUMISE', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheSoumise)

      const erreur = await createMissionUseCase(
        { ficheId: 'fiche-001', ouvrageId: 'ouvrage-001', userBrigadeId: 'brigade-01', userRole: 'BRIGADE' },
        mockMissionRepository, mockFicheRepository, mockOuvrageRepository
      ).catch(e => e)

      expect(erreur).toBeInstanceOf(AppError)
      expect(erreur.code).toBe('STATUT_INVALIDE')
    })

    it('lance AppError STATUT_INVALIDE si fiche VALIDEE', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheValidee)

      const erreur = await createMissionUseCase(
        { ficheId: 'fiche-001', ouvrageId: 'ouvrage-001', userBrigadeId: 'brigade-01', userRole: 'BRIGADE' },
        mockMissionRepository, mockFicheRepository, mockOuvrageRepository
      ).catch(e => e)

      expect(erreur).toBeInstanceOf(AppError)
      expect(erreur.code).toBe('STATUT_INVALIDE')
    })

    it('lance NotFoundError si l\'ouvrage n\'existe pas', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockOuvrageRepository.findById).mockResolvedValue(null)

      await expect(
        createMissionUseCase(
          { ficheId: 'fiche-001', ouvrageId: 'ouvrage-inexistant', userBrigadeId: 'brigade-01', userRole: 'BRIGADE' },
          mockMissionRepository, mockFicheRepository, mockOuvrageRepository
        )
      ).rejects.toThrow(NotFoundError)
    })

    it('lance NotFoundError si l\'ouvrage est inactif', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockOuvrageRepository.findById).mockResolvedValue(ouvrageInactif)

      await expect(
        createMissionUseCase(
          { ficheId: 'fiche-001', ouvrageId: 'ouvrage-001', userBrigadeId: 'brigade-01', userRole: 'BRIGADE' },
          mockMissionRepository, mockFicheRepository, mockOuvrageRepository
        )
      ).rejects.toThrow(NotFoundError)
    })

    it('ne crée pas si fiche SOUMISE', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheSoumise)

      await createMissionUseCase(
        { ficheId: 'fiche-001', ouvrageId: 'ouvrage-001', userBrigadeId: 'brigade-01', userRole: 'BRIGADE' },
        mockMissionRepository, mockFicheRepository, mockOuvrageRepository
      ).catch(() => {})

      expect(mockMissionRepository.create).not.toHaveBeenCalled()
    })
  })
})