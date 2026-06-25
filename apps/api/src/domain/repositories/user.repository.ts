/**
 * @file user.repository.ts
 * @description Interface contrat du repository User.
 *
 * MODIFICATION :
 * ✅ update() ajouté — nécessaire pour profil et changement de mot de passe
 * ✅ findAll() ajouté — pour la page RH/Admin
 */

import type { UserEntity } from '../entities/user.entity.js'

export type UpdateUserData = Partial<{
  email:    string
  gsm:      string
  password: string   // hash bcrypt uniquement
  actif:    boolean
}>

export interface IUserRepository {
  findByEmail(email: string): Promise<UserEntity | null>
  findById(id: string):       Promise<UserEntity | null>
  findAll():                  Promise<UserEntity[]>
  update(id: string, data: UpdateUserData): Promise<UserEntity>
}