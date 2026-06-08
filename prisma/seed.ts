/**
 * @file seed.ts
 * @description Données initiales — utilisateurs de test pour le développement.
 * NE JAMAIS exécuter en production avec de vrais mots de passe.
 */

import { PrismaClient } from '@prisma/client'
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
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())