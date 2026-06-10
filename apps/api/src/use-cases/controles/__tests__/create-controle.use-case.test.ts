/**
 * @file create-controle.use-case.test.ts
 * @description Tests unitaires — création d'un contrôle topographique.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createControleUseCase } from '../create-controle.use-case.js'
import { NotFoundError, ForbiddenError, AppError } from '../../../domain/errors.js'
import type { IControleRepository } from '../../../domain/repositories/controle.repository.js'
import type { IMissionRepository } from '../../../domain/repositories/mission.repository.js'
import type { IFicheRepository } from '../../../domain/repositories/fiche.repository.js'
import type { ControleEntity } from '../../../domain/entities/controle.entity.js'
import type { MissionWithRelations } from '../../../domain/entities/mission.entity.js'
import type { FicheWithRelations } from '../../../domain/entities/fiche.entity.js'

// ─── DONNÉES DE TEST ──────────────────────────────────────────────────────────

const ficheBrouillon: FicheWithRelations = {
  id: 'fiche-001',
  date: new Date(),
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
  _count: { missions: 1 }
}

const ficheSoumise: FicheWithRelations = { ...ficheBrouillon, statut: 'SOUMISE' }

const missionEnCours: MissionWithRelations = {
  id: 'mission-001',
  statut: 'EN_COURS',
  heureDebut: new Date(),
  heureFin: null,
  observations: null,
  ficheId: 'fiche-001',
  ouvrageId: 'ouvrage-001',
  createdAt: new Date(),
  updatedAt: new Date(),
  ouvrage: {
    id: 'ouvrage-001',
    reference: 'PLT-A-01',
    designation: 'Platine A-01',
    type: 'PLATINE',
    axe: 'Axe A',
    niveau: 'R+1'
  },
  controles: [],
  _count: { controles: 0 }
}

const controleConforme: ControleEntity = {
  id: 'controle-001',
  type: 'IMPLANTATION',
  statut: 'CONFORME',
  ecartX: 2, ecartY: -1, ecartZ: 1,
  toleranceX: 5, toleranceY: 5, toleranceZ: 3,
  observations: null,
  missionId: 'mission-001',
  createdAt: new Date()
}

const controleNonConforme: ControleEntity = {
  ...controleConforme,
  id: 'controle-002',
  statut: 'NON_CONFORME',
  ecartZ: 8  // 8mm > 3mm tolérance
}

// ─── MOCKS ────────────────────────────────────────────────────────────────────

const mockControleRepository: IControleRepository = {
  findByMission: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn()
}

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

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('createControleUseCase', () => {

  beforeEach(() => vi.clearAllMocks())

  describe('✅ Création réussie', () => {

    it('crée un contrôle CONFORME', async () => {
      // ARRANGE
      vi.mocked(mockMissionRepository.findById).mockResolvedValue(missionEnCours)
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockControleRepository.create).mockResolvedValue(controleConforme)

      // ACT
      const result = await createControleUseCase(
        {
          missionId: 'mission-001',
          type: 'IMPLANTATION',
          ecartX: 2, ecartY: -1, ecartZ: 1,
          toleranceX: 5, toleranceY: 5, toleranceZ: 3,
          userBrigadeId: 'brigade-01',
          userRole: 'BRIGADE'
        },
        mockControleRepository,
        mockMissionRepository,
        mockFicheRepository
      )

      expect(result.statut).toBe('CONFORME')
      expect(result.type).toBe('IMPLANTATION')
    })

    it('crée un contrôle NON_CONFORME si écart hors tolérance', async () => {
      // ARRANGE
      vi.mocked(mockMissionRepository.findById).mockResolvedValue(missionEnCours)
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockControleRepository.create).mockResolvedValue(controleNonConforme)

      // ACT
      const result = await createControleUseCase(
        {
          missionId: 'mission-001',
          type: 'IMPLANTATION',
          ecartZ: 8, toleranceZ: 3,
          userBrigadeId: 'brigade-01',
          userRole: 'BRIGADE'
        },
        mockControleRepository,
        mockMissionRepository,
        mockFicheRepository
      )

      expect(result.statut).toBe('NON_CONFORME')
    })

    it('IGT peut créer un contrôle', async () => {
      // ARRANGE
      vi.mocked(mockMissionRepository.findById).mockResolvedValue(missionEnCours)
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockControleRepository.create).mockResolvedValue(controleConforme)

      // ACT & ASSERT — pas d'erreur pour IGT
      await expect(
        createControleUseCase(
          {
            missionId: 'mission-001',
            type: 'IMPLANTATION',
            userBrigadeId: undefined,
            userRole: 'IGT'
          },
          mockControleRepository,
          mockMissionRepository,
          mockFicheRepository
        )
      ).resolves.toBeDefined()
    })
  })

  describe('❌ Cas d\'erreur', () => {

    it('lance NotFoundError si mission inexistante', async () => {
      vi.mocked(mockMissionRepository.findById).mockResolvedValue(null)

      await expect(
        createControleUseCase(
          { missionId: 'mission-inexistante', type: 'IMPLANTATION', userBrigadeId: 'brigade-01', userRole: 'BRIGADE' },
          mockControleRepository, mockMissionRepository, mockFicheRepository
        )
      ).rejects.toThrow(NotFoundError)
    })

    it('lance ForbiddenError si mission d\'une autre brigade', async () => {
      vi.mocked(mockMissionRepository.findById).mockResolvedValue(missionEnCours)
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)

      await expect(
        createControleUseCase(
          { missionId: 'mission-001', type: 'IMPLANTATION', userBrigadeId: 'brigade-02', userRole: 'BRIGADE' },
          mockControleRepository, mockMissionRepository, mockFicheRepository
        )
      ).rejects.toThrow(ForbiddenError)
    })

    it('lance AppError STATUT_INVALIDE si fiche SOUMISE', async () => {
      vi.mocked(mockMissionRepository.findById).mockResolvedValue(missionEnCours)
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheSoumise)

      const erreur = await createControleUseCase(
        { missionId: 'mission-001', type: 'IMPLANTATION', userBrigadeId: 'brigade-01', userRole: 'BRIGADE' },
        mockControleRepository, mockMissionRepository, mockFicheRepository
      ).catch(e => e)

      expect(erreur).toBeInstanceOf(AppError)
      expect(erreur.code).toBe('STATUT_INVALIDE')
    })

    it('ne crée pas si fiche SOUMISE', async () => {
      vi.mocked(mockMissionRepository.findById).mockResolvedValue(missionEnCours)
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheSoumise)

      await createControleUseCase(
        { missionId: 'mission-001', type: 'IMPLANTATION', userBrigadeId: 'brigade-01', userRole: 'BRIGADE' },
        mockControleRepository, mockMissionRepository, mockFicheRepository
      ).catch(() => {})

      expect(mockControleRepository.create).not.toHaveBeenCalled()
    })
  })
})