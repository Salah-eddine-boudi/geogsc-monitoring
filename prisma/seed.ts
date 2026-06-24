/**
 * @file seed.ts
 * @description Seeder de base — données minimales pour les tests.
 * VERSION COMPATIBLE — pas d'imports d'enums Prisma (évite les conflits de cache)
 * USAGE : pnpm exec prisma db seed
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const d = (offset: number) => {
  const dt = new Date()
  dt.setDate(dt.getDate() - offset)
  dt.setHours(8, 0, 0, 0)
  return dt
}

async function main() {
  console.log('🌱 Début du seeding GSC...')

  // ── NETTOYAGE ─────────────────────────────────────────────────
  await prisma.photo.deleteMany()
  await prisma.controle.deleteMany()
  await prisma.mission.deleteMany()
  await prisma.ficheJournaliere.deleteMany()
  await prisma.pointVigilanceCP.deleteMany()
  await prisma.evenementCP.deleteMany()
  await prisma.compteRenduCP.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.ouvrage.deleteMany()
  await prisma.brigade.deleteMany()
  console.log('🧹 Tables nettoyées')

  // ── BRIGADES ──────────────────────────────────────────────────
  const brigade1 = await prisma.brigade.create({ data: { nom: 'Équipe 01', chef: 'M. Marouane AIT KADIR' } })
  const brigade2 = await prisma.brigade.create({ data: { nom: 'Équipe 02', chef: 'M. Youssef BENNANI' } })

  // ── UTILISATEURS ─────────────────────────────────────────────
  const hash = await bcrypt.hash('password123', 10)
  await prisma.user.create({ data: { nom: 'CHAACHOUI', prenom: 'Hakim', email: 'admin@geocoding.ma', password: hash, role: 'ADMIN' } })
  const igt   = await prisma.user.create({ data: { nom: 'BOUDI', prenom: 'Salah-eddine', email: 'igt@geocoding.ma', password: hash, role: 'IGT' } })
  const chef1 = await prisma.user.create({ data: { nom: 'AIT KADIR', prenom: 'Marouane', email: 'equipe01@geocoding.ma', password: hash, role: 'BRIGADE', brigadeId: brigade1.id, gsm: '+212 661 234 567', stationTotale: 'Trimble SX12 — S/N 987654' } })
  const chef2 = await prisma.user.create({ data: { nom: 'BENNANI', prenom: 'Youssef', email: 'equipe02@geocoding.ma', password: hash, role: 'BRIGADE', brigadeId: brigade2.id, gsm: '+212 631 434 567', stationTotale: 'Trimble SX12 — S/N 997654' } })

  console.log('✅ Utilisateurs créés :')
  console.log('   admin@geocoding.ma    / password123  (ADMIN)')
  console.log('   igt@geocoding.ma      / password123  (IGT)')
  console.log('   equipe01@geocoding.ma / password123  (BRIGADE)')
  console.log('   equipe02@geocoding.ma / password123  (BRIGADE)')

  // ── OUVRAGES ──────────────────────────────────────────────────
  const o = await Promise.all([
    prisma.ouvrage.create({ data: { reference: 'POT-A-01', designation: 'Poteau Tribune A Axe 1',          type: 'POTEAU_AV_BETONNAGE',            axe: 'Axe A01', niveau: 'RDC' } }),
    prisma.ouvrage.create({ data: { reference: 'POT-A-02', designation: 'Poteau Tribune A Axe 2',          type: 'POTEAU_AV_BETONNAGE',            axe: 'Axe A02', niveau: 'RDC' } }),
    prisma.ouvrage.create({ data: { reference: 'POT-B-01', designation: 'Poteau Tribune B Axe 1',          type: 'POTEAU_AP_BETONNAGE',            axe: 'Axe B01', niveau: 'RDC' } }),
    prisma.ouvrage.create({ data: { reference: 'CRE-A-01', designation: 'Crémaillère inférieure Tribune A', type: 'POUTRE_CREMAILLERE_AV_BETONNAGE', axe: 'Axe A',  niveau: 'R+1' } }),
    prisma.ouvrage.create({ data: { reference: 'CRE-A-02', designation: 'Crémaillère intermédiaire Tribune A', type: 'POUTRE_CREMAILLERE_AP_BETONNAGE', axe: 'Axe A', niveau: 'R+2' } }),
    prisma.ouvrage.create({ data: { reference: 'CRE-B-01', designation: 'Crémaillère inférieure Tribune B', type: 'POUTRE_CREMAILLERE_AV_BETONNAGE', axe: 'Axe B',  niveau: 'R+1' } }),
    prisma.ouvrage.create({ data: { reference: 'GRA-A-01', designation: 'Gradin béton Tribune A rang 1',   type: 'GRADIN',                          axe: 'Axe A',  niveau: 'R+1' } }),
    prisma.ouvrage.create({ data: { reference: 'GRA-B-01', designation: 'Gradin béton Tribune B rang 1',   type: 'GRADIN',                          axe: 'Axe B',  niveau: 'R+1' } }),
    prisma.ouvrage.create({ data: { reference: 'VOI-A-01', designation: 'Voile béton Tribune A',            type: 'VOILE_AV_BETONNAGE',             axe: 'Axe A',  niveau: 'RDC' } }),
    prisma.ouvrage.create({ data: { reference: 'PLT-A-01', designation: 'Platine métallique Tribune A',    type: 'PLATINE',                         axe: 'Axe A',  niveau: 'RDC' } }),
  ])
  console.log('✅ Ouvrages créés')

  // ── FICHE 1 — Brigade 1 — VALIDEE ────────────────────────────
  const f1 = await prisma.ficheJournaliere.create({
    data: {
      date: d(5), statut: 'VALIDEE',
      conditionMeteo: 'BEAU',           // Q27 — météo sur la fiche
      observations: 'Bonnes conditions météo',
      brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id
    }
  })

  await prisma.mission.create({ data: {
    ficheId: f1.id, ouvrageId: o[0].id,
    zone: 'A', axe: 'A01', fil: 'M', niveau: 'RDC',
    partieOuvrage: 'Pied de poteau',
    nature: 'IMPLANTATION' as any,
    provenanceAppareil: 'GEOCODING' as any,
    nomAppareil: 'Trimble SX12',
    travailRealise: 'Implantation poteau P01 Tribune A',
    stadeCollage: 'AVANT_BETONNAGE' as any,
    resultat: 'CONFORME' as any,
    estNC: false,
    controles: { create: [
      { type: 'IMPLANTATION', statut: 'CONFORME', ecartX: 2.1, ecartY: 1.8, toleranceX: 5.0, toleranceY: 5.0 },
      { type: 'ALTIMETRIE',   statut: 'CONFORME', ecartZ: 1.2, toleranceZ: 3.0 }
    ]}
  }})

  await prisma.mission.create({ data: {
    ficheId: f1.id, ouvrageId: o[1].id,
    zone: 'A', axe: 'A02', fil: 'M', niveau: 'RDC',
    partieOuvrage: 'Corps de poteau',
    nature: 'CONTROLE_GEOMETRIQUE' as any,
    provenanceAppareil: 'GEOCODING' as any,
    nomAppareil: 'Trimble SX12',
    travailRealise: 'Contrôle géométrique poteau P02',
    stadeCollage: 'APRES_BETONNAGE' as any,
    resultat: 'RESERVE' as any,
    estNC: false,
    observations: 'Dépassement tolérance axe X',
    controles: { create: [
      { type: 'VERTICALITY', statut: 'RESERVE', ecartX: 6.5, ecartY: 4.2, toleranceX: 5.0, toleranceY: 5.0, observations: 'Dépassement tolérance axe X' }
    ]}
  }})

  // ── FICHE 2 — Brigade 1 — VALIDEE ────────────────────────────
  const f2 = await prisma.ficheJournaliere.create({
    data: {
      date: d(4), statut: 'VALIDEE',
      conditionMeteo: 'NUAGEUX',
      observations: 'Contrôle crémaillères Tribune A',
      brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id
    }
  })

  await prisma.mission.create({ data: {
    ficheId: f2.id, ouvrageId: o[3].id,
    zone: 'A', axe: 'A01', niveau: 'R+1',
    partieOuvrage: 'Crémaillère complète',
    nature: 'RECEPTION_AVANT_BETONNAGE' as any,
    provenanceAppareil: 'GEOCODING' as any,
    nomAppareil: 'Trimble SX12',
    stadeCollage: 'PREMIERE_LEVEE' as any,
    resultat: 'CONFORME' as any,
    estNC: false,
    controles: { create: [{ type: 'IMPLANTATION', statut: 'CONFORME', ecartX: 1.5, ecartY: 2.0, toleranceX: 5.0, toleranceY: 5.0 }] }
  }})

  await prisma.mission.create({ data: {
    ficheId: f2.id, ouvrageId: o[4].id,
    zone: 'A', axe: 'A02', niveau: 'R+2',
    partieOuvrage: 'Travée 2-3',
    nature: 'RECEPTION_AVANT_BETONNAGE' as any,
    provenanceAppareil: 'GEOCODING' as any,
    nomAppareil: 'Trimble SX12',
    stadeCollage: 'PREMIERE_LEVEE' as any,
    resultat: 'NON_CONFORME' as any,
    estNC: true,
    observations: 'Écarts hors tolérances — reprise nécessaire',
    controles: { create: [{ type: 'IMPLANTATION', statut: 'NON_CONFORME', ecartX: 12.3, ecartY: 8.7, toleranceX: 5.0, toleranceY: 5.0, observations: 'Écarts hors tolérances' }] }
  }})

  // ── FICHE 3 — Brigade 2 — VALIDEE ────────────────────────────
  const f3 = await prisma.ficheJournaliere.create({
    data: {
      date: d(3), statut: 'VALIDEE',
      conditionMeteo: 'BEAU',
      observations: 'Tribune B — résultats bons',
      brigadeId: brigade2.id, createurId: chef2.id, validateurId: igt.id
    }
  })

  await prisma.mission.create({ data: {
    ficheId: f3.id, ouvrageId: o[2].id,
    zone: 'B', axe: 'B01', niveau: 'RDC',
    partieOuvrage: 'Pied de poteau',
    nature: 'IMPLANTATION' as any,
    provenanceAppareil: 'GEOCODING' as any,
    nomAppareil: 'Leica TS16',
    stadeCollage: 'AVANT_BETONNAGE' as any,
    resultat: 'CONFORME' as any,
    estNC: false,
    controles: { create: [{ type: 'IMPLANTATION', statut: 'CONFORME', ecartX: 3.2, ecartY: 2.1, toleranceX: 5.0, toleranceY: 5.0 }] }
  }})

  // ── FICHE 4 — Brigade 1 — SOUMISE ────────────────────────────
  const f4 = await prisma.ficheJournaliere.create({
    data: {
      date: d(2), statut: 'SOUMISE',
      conditionMeteo: 'BEAU',
      observations: 'Contrôle gradins Tribune A',
      brigadeId: brigade1.id, createurId: chef1.id
    }
  })

  await prisma.mission.create({ data: {
    ficheId: f4.id, ouvrageId: o[6].id,
    zone: 'A', axe: 'A01', niveau: 'R+1',
    partieOuvrage: 'Gradins rangs 1-5',
    nature: 'RECEPTION_AVANT_BETONNAGE' as any,
    provenanceAppareil: 'GEOCODING' as any,
    nomAppareil: 'Trimble SX12',
    stadeCollage: 'LEVEE_FINALE' as any,
    resultat: 'CONFORME' as any,
    estNC: false,
    controles: { create: [{ type: 'ALTIMETRIE', statut: 'CONFORME', ecartZ: 2.0, toleranceZ: 5.0 }] }
  }})

  await prisma.mission.create({ data: {
    ficheId: f4.id, ouvrageId: o[8].id,
    zone: 'A', axe: 'A01', niveau: 'RDC',
    partieOuvrage: 'Voile complet',
    nature: 'CONTROLE_VERTICALITE' as any,
    provenanceAppareil: 'GEOCODING' as any,
    nomAppareil: 'Trimble SX12',
    stadeCollage: 'APRES_BETONNAGE' as any,
    resultat: 'NON_CONFORME' as any,
    estNC: true,
    observations: 'Déviation hors tolérance',
    controles: { create: [{ type: 'VERTICALITY', statut: 'NON_CONFORME', ecartX: 7.2, toleranceX: 5.0, observations: 'Déviation hors tolérance' }] }
  }})

  // ── FICHE 5 — Brigade 1 — BROUILLON ──────────────────────────
  await prisma.ficheJournaliere.create({
    data: {
      date: d(0), statut: 'BROUILLON',
      conditionMeteo: 'BEAU',
      brigadeId: brigade1.id, createurId: chef1.id
    }
  })

  // ── RÉSUMÉ ────────────────────────────────────────────────────
  const counts = {
    brigades:  await prisma.brigade.count(),
    users:     await prisma.user.count(),
    ouvrages:  await prisma.ouvrage.count(),
    fiches:    await prisma.ficheJournaliere.count(),
    missions:  await prisma.mission.count(),
    controles: await prisma.controle.count(),
  }
  const nbNC = await prisma.mission.count({ where: { estNC: true } })

  console.log('\n📊 Résumé :')
  Object.entries(counts).forEach(([k, v]) => console.log(`   ${v} ${k}`))
  console.log(`   ${nbNC} missions NC (estNC=true)`)
  console.log('\n🎉 Seeding terminé !')
}

main().catch(console.error).finally(() => prisma.$disconnect())