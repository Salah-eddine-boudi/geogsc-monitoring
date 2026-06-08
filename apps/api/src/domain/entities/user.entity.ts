/**
 * @file user.entity.ts
 * @description Entité User pure — aucune dépendance externe.
 * Représente le concept métier User indépendamment de Prisma ou de la BDD.
 */

export type UserEntity = {
  id: string
  nom: string
  prenom: string
  email: string
  password: string
  role: string
  brigadeId: string | null
  actif: boolean
  createdAt: Date
}
