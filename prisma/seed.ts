/**
 * @file seed.ts
 * @description Données initiales — utilisateurs de test pour le développement.
 * NE JAMAIS exécuter en production avec de vrais mots de passe.
 */

import { PrismaClient, TypeOuvrage } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {

  // Créer les brigades
  const brigade1 = await prisma.brigade.upsert({
    where: { nom: 'Équipe 01' },
    update: {},
    create: {
      nom: 'Équipe 01',
      chef: 'M. Marouane AIT KADIR'
    }
  })

  const brigade2 = await prisma.brigade.upsert({
    where: { nom: 'Équipe 02' },
    update: {},
    create: {
      nom: 'Équipe 02',
      chef: 'M. Hamid TAKI'
    }
  })

  // Hash des mots de passe
  const passwordHash = await bcrypt.hash('password123', 10)

  // Créer utilisateur ADMIN
  await prisma.user.upsert({
    where: { email: 'admin@geocoding.ma' },
    update: {},
    create: {
      nom: 'CHAACHOUI',
      prenom: 'Hakim',
      email: 'admin@geocoding.ma',
      password: passwordHash,
      role: 'IGT',
    }
  })

  // Créer utilisateur Brigade
  await prisma.user.upsert({
    where: { email: 'brigade1@geocoding.ma' },
    update: {},
    create: {
      nom: 'AIT KADIR',
      prenom: 'Marouane',
      email: 'brigade1@geocoding.ma',
      password: passwordHash,
      role: 'BRIGADE',
      brigadeId: brigade1.id
    }
  })

  await prisma.user.upsert({
    where: { email: 'brigade2@geocoding.ma' },
    update: {},
    create: {
      nom: 'TAKI',
      prenom: 'Hamid',
      email: 'brigade2@geocoding.ma',
      password: passwordHash,
      role: 'BRIGADE',
      brigadeId: brigade2.id
    }
  })

  console.log('✅ Seed terminé — utilisateurs créés')

  // Ouvrages de référence GSC
  const ouvrages = [
    { reference: 'PLT-A-01', designation: 'Platine charpente axe A-01', type: TypeOuvrage.PLATINE, axe: 'Axe A', niveau: 'R+1' },
    { reference: 'PLT-A-02', designation: 'Platine charpente axe A-02', type: TypeOuvrage.PLATINE, axe: 'Axe A', niveau: 'R+1' },
    { reference: 'POT-B-01', designation: 'Poteau béton axe B-01', type: TypeOuvrage.POTEAU, axe: 'Axe B', niveau: 'RDC' },
    { reference: 'POT-B-02', designation: 'Poteau béton axe B-02', type: TypeOuvrage.POTEAU, axe: 'Axe B', niveau: 'RDC' },
    { reference: 'GRD-N-01', designation: 'Gradin Tribune Nord secteur 1', type: TypeOuvrage.GRADIN, axe: 'Tribune Nord', niveau: null },
    { reference: 'GRD-N-02', designation: 'Gradin Tribune Nord secteur 2', type: TypeOuvrage.GRADIN, axe: 'Tribune Nord', niveau: null },
    { reference: 'VRD-001', designation: 'Réseau VRD zone parking', type: TypeOuvrage.VRD, axe: null, niveau: null },
    { reference: 'FON-001', designation: 'Fondation pieux forés zone A', type: TypeOuvrage.FONDATION, axe: 'Zone A', niveau: null },
  ]

  for (const ouvrage of ouvrages) {
    await prisma.ouvrage.upsert({
      where: { reference: ouvrage.reference },
      update: {},
      create: ouvrage
    })
  }

  console.log('✅ Ouvrages créés')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())