/**
 * @file me.use-case.test.ts
 * @description Tests unitaires du use-case Me.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { meUseCase } from '../me.use-case.js'
import { NotFoundError } from '../../../domain/errors.js'
import type { IUserRepository } from '../../../domain/repositories/user.repository.js'
import type { UserEntity } from '../../../domain/entities/user.entity.js'

const mockUser: UserEntity = {
  id: 'user-test-123',
  nom: 'CHAACHOUI',
  prenom: 'Hakim',
  email: 'admin@geocoding.ma',
  password: 'hashed',
  role: 'IGT',
  brigadeId: null,
  actif: true,
  createdAt: new Date()
}

const mockUserRepository: IUserRepository = {
  findByEmail: vi.fn(),
  findById: vi.fn()
}

describe('meUseCase', () => {

  beforeEach(() => vi.clearAllMocks())

  describe('✅ Cas nominal', () => {

    it('retourne le profil utilisateur sans le mot de passe', async () => {
      // ARRANGE
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser)

      // ACT
      const result = await meUseCase('user-test-123', mockUserRepository)

      // ASSERT
      expect(result.id).toBe('user-test-123')
      expect(result.nom).toBe('CHAACHOUI')
      expect(result.email).toBe('admin@geocoding.ma')
      expect(result.role).toBe('IGT')
      expect(result).not.toHaveProperty('password')
    })

    it('appelle findById avec le bon ID', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser)

      await meUseCase('user-test-123', mockUserRepository)

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-test-123')
      expect(mockUserRepository.findById).toHaveBeenCalledTimes(1)
    })
  })

  describe('❌ Cas d\'erreur', () => {

    it('lance NotFoundError si l\'utilisateur n\'existe pas', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

      await expect(
        meUseCase('inexistant-id', mockUserRepository)
      ).rejects.toThrow(NotFoundError)
    })

    it('lance NotFoundError si le compte est désactivé', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue({
        ...mockUser,
        actif: false
      })

      await expect(
        meUseCase('user-test-123', mockUserRepository)
      ).rejects.toThrow(NotFoundError)
    })
  })
})