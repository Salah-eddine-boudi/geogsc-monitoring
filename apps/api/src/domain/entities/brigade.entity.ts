/**
 * @file brigade.entity.ts
 * @description Entité Brigade pure — aucune dépendance externe.
    * Représente le concept métier Brigade indépendamment de Prisma ou de la BDD.
 */

export type BrigadeEntity = {
  id: string         
  nom: string        
  chef: string        
  actif: boolean      
  createdAt: Date     
}


export type BrigadeWithMembers = BrigadeEntity & {
  membres: {
    id: string
    nom: string
    prenom: string
    email: string
    role: string
  }[]
}