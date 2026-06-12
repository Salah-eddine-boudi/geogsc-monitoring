/**
 * @file seed.ts
 * @description Seeder — peuple la BDD avec des données de test réalistes GSC.
 *
 * USAGE depuis la racine du monorepo :
 * npx tsx prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding GSC...')

  // ── NETTOYAGE ──────────────────────────────────────────────────
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

  // ── BRIGADES ───────────────────────────────────────────────────
  const brigade1 = await prisma.brigade.create({ data: { nom: 'Équipe 01', chef: 'M. Marouane AIT KADIR' } })
  const brigade2 = await prisma.brigade.create({ data: { nom: 'Équipe 02', chef: 'M. Youssef BENNANI' } })
  console.log('✅ Brigades créées')

  // ── UTILISATEURS ───────────────────────────────────────────────
  const hash = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.create({ data: { nom: 'CHAACHOUI', prenom: 'Hakim', email: 'admin@geocoding.ma', password: hash, role: 'ADMIN' } })
  const igt   = await prisma.user.create({ data: { nom: 'BOUDI', prenom: 'Salah-eddine', email: 'igt@geocoding.ma', password: hash, role: 'IGT' } })
  const chef1 = await prisma.user.create({ data: { nom: 'AIT KADIR', prenom: 'Marouane', email: 'equipe01@geocoding.ma', password: hash, role: 'BRIGADE', brigadeId: brigade1.id } })
  const chef2 = await prisma.user.create({ data: { nom: 'BENNANI', prenom: 'Youssef', email: 'equipe02@geocoding.ma', password: hash, role: 'BRIGADE', brigadeId: brigade2.id } })

  console.log('✅ Utilisateurs créés :')
  console.log('   admin@geocoding.ma    / password123  (ADMIN)')
  console.log('   igt@geocoding.ma      / password123  (IGT)')
  console.log('   equipe01@geocoding.ma / password123  (BRIGADE)')
  console.log('   equipe02@geocoding.ma / password123  (BRIGADE)')

  // ── OUVRAGES ───────────────────────────────────────────────────
  const o = await Promise.all([
    prisma.ouvrage.create({ data: { reference: 'POT-A-01', designation: 'Poteau Tribune A Axe 1', type: 'POTEAU', axe: 'Axe A01', niveau: 'N+0' } }),
    prisma.ouvrage.create({ data: { reference: 'POT-A-02', designation: 'Poteau Tribune A Axe 2', type: 'POTEAU', axe: 'Axe A02', niveau: 'N+0' } }),
    prisma.ouvrage.create({ data: { reference: 'POT-B-01', designation: 'Poteau Tribune B Axe 1', type: 'POTEAU', axe: 'Axe B01', niveau: 'N+0' } }),
    prisma.ouvrage.create({ data: { reference: 'CRE-A-01', designation: 'Crémaillère inférieure Tribune A', type: 'GRADIN', axe: 'Axe A', niveau: 'N+1' } }),
    prisma.ouvrage.create({ data: { reference: 'CRE-A-02', designation: 'Crémaillère intermédiaire Tribune A', type: 'GRADIN', axe: 'Axe A', niveau: 'N+2' } }),
    prisma.ouvrage.create({ data: { reference: 'CRE-B-01', designation: 'Crémaillère inférieure Tribune B', type: 'GRADIN', axe: 'Axe B', niveau: 'N+1' } }),
    prisma.ouvrage.create({ data: { reference: 'GRA-A-01', designation: 'Gradin béton Tribune A rang 1', type: 'GRADIN', axe: 'Axe A', niveau: 'N+1' } }),
    prisma.ouvrage.create({ data: { reference: 'GRA-B-01', designation: 'Gradin béton Tribune B rang 1', type: 'GRADIN', axe: 'Axe B', niveau: 'N+1' } }),
    prisma.ouvrage.create({ data: { reference: 'VOI-A-01', designation: 'Voile béton Tribune A', type: 'VOILE', axe: 'Axe A', niveau: 'N+0' } }),
    prisma.ouvrage.create({ data: { reference: 'PLT-A-01', designation: 'Platine métallique Tribune A', type: 'PLATINE', axe: 'Axe A', niveau: 'N+0' } }),
  ])
  console.log('✅ Ouvrages créés')

  // ── DATES ──────────────────────────────────────────────────────
  const d = (offset: number) => { const dt = new Date(); dt.setDate(dt.getDate() - offset); return dt }

  // ── FICHE 1 — Brigade 1 — VALIDEE ─────────────────────────────
  const f1 = await prisma.ficheJournaliere.create({ data: { date: d(5), statut: 'VALIDEE', observations: 'Bonnes conditions météo', brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id } })
  await prisma.mission.create({ data: { ficheId: f1.id, ouvrageId: o[0].id, zone: 'A', axe: 'Axe A01', nature: 'IMPLANTATION', appareil: 'TRIMBLE_SX12', travailRealise: 'Implantation poteau P01 Tribune A', stadeCollage: 'AVANT_BETONNAGE', conditionMeteo: 'BEAU', resultat: 'CONFORME', partieOuvrage: 'Pied de poteau', controles: { create: [{ type: 'IMPLANTATION', statut: 'CONFORME', ecartX: 2.1, ecartY: 1.8, toleranceX: 5.0, toleranceY: 5.0 }, { type: 'ALTIMETRIE', statut: 'CONFORME', ecartZ: 1.2, toleranceZ: 3.0 }] } } })
  await prisma.mission.create({ data: { ficheId: f1.id, ouvrageId: o[1].id, zone: 'A', axe: 'Axe A02', nature: 'CONTROLE_GEOMETRIQUE', appareil: 'TRIMBLE_SX12', travailRealise: 'Contrôle géométrique poteau P02', stadeCollage: 'APRES_BETONNAGE', conditionMeteo: 'BEAU', resultat: 'RESERVE', partieOuvrage: 'Corps de poteau', controles: { create: [{ type: 'VERTICALITY', statut: 'RESERVE', ecartX: 6.5, ecartY: 4.2, toleranceX: 5.0, toleranceY: 5.0, observations: 'Dépassement tolérance axe X' }] } } })

  // ── FICHE 2 — Brigade 1 — VALIDEE ─────────────────────────────
  const f2 = await prisma.ficheJournaliere.create({ data: { date: d(4), statut: 'VALIDEE', observations: 'Contrôle crémaillères Tribune A', brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id } })
  await prisma.mission.create({ data: { ficheId: f2.id, ouvrageId: o[3].id, zone: 'A', axe: 'Axe A C1-C2', nature: 'RECEPTION', appareil: 'TRIMBLE_SX12', travailRealise: 'Réception crémaillère C1-C2', stadeCollage: 'RECEPTION_FINALE', conditionMeteo: 'NUAGEUX', resultat: 'CONFORME', partieOuvrage: 'Crémaillère complète', controles: { create: [{ type: 'IMPLANTATION', statut: 'CONFORME', ecartX: 1.5, ecartY: 2.0, toleranceX: 5.0, toleranceY: 5.0 }] } } })
  await prisma.mission.create({ data: { ficheId: f2.id, ouvrageId: o[4].id, zone: 'A', axe: 'Axe A C2-C3', nature: 'RECEPTION', appareil: 'TRIMBLE_SX12', travailRealise: 'Réception crémaillère C2-C3', stadeCollage: 'RECEPTION_FINALE', conditionMeteo: 'NUAGEUX', resultat: 'NON_CONFORME', partieOuvrage: 'Travée 2-3', controles: { create: [{ type: 'IMPLANTATION', statut: 'NON_CONFORME', ecartX: 12.3, ecartY: 8.7, toleranceX: 5.0, toleranceY: 5.0, observations: 'Écarts hors tolérances — reprise nécessaire' }] } } })

  // ── FICHE 3 — Brigade 2 — VALIDEE ─────────────────────────────
  const f3 = await prisma.ficheJournaliere.create({ data: { date: d(3), statut: 'VALIDEE', observations: 'Tribune B — résultats bons', brigadeId: brigade2.id, createurId: chef2.id, validateurId: igt.id } })
  await prisma.mission.create({ data: { ficheId: f3.id, ouvrageId: o[2].id, zone: 'B', axe: 'Axe B01', nature: 'IMPLANTATION', appareil: 'LEICA_TS16', travailRealise: 'Implantation poteau B01', stadeCollage: 'AVANT_BETONNAGE', conditionMeteo: 'BEAU', resultat: 'CONFORME', partieOuvrage: 'Pied de poteau', controles: { create: [{ type: 'IMPLANTATION', statut: 'CONFORME', ecartX: 3.2, ecartY: 2.1, toleranceX: 5.0, toleranceY: 5.0 }] } } })
  await prisma.mission.create({ data: { ficheId: f3.id, ouvrageId: o[5].id, zone: 'B', axe: 'Axe B C1-C2', nature: 'CONTROLE_ALTIMETRIQUE', appareil: 'LEICA_NA730', travailRealise: 'Nivellement crémaillère B', stadeCollage: 'AVANT_BETONNAGE', conditionMeteo: 'BEAU', resultat: 'CONFORME', partieOuvrage: 'Travée 1-2', controles: { create: [{ type: 'ALTIMETRIE', statut: 'CONFORME', ecartZ: 1.5, toleranceZ: 3.0 }] } } })

  // ── FICHE 4 — Brigade 1 — SOUMISE ─────────────────────────────
  const f4 = await prisma.ficheJournaliere.create({ data: { date: d(2), statut: 'SOUMISE', observations: 'Contrôle gradins Tribune A', brigadeId: brigade1.id, createurId: chef1.id } })
  await prisma.mission.create({ data: { ficheId: f4.id, ouvrageId: o[6].id, zone: 'A', axe: 'Tribune A rangs 1-5', nature: 'RECEPTION', appareil: 'TRIMBLE_SX12', travailRealise: 'Réception gradins rangs 1-5', stadeCollage: 'RECEPTION_FINALE', conditionMeteo: 'BEAU', resultat: 'CONFORME', partieOuvrage: 'Gradins rangs 1-5', controles: { create: [{ type: 'ALTIMETRIE', statut: 'CONFORME', ecartZ: 2.0, toleranceZ: 5.0 }] } } })
  await prisma.mission.create({ data: { ficheId: f4.id, ouvrageId: o[8].id, zone: 'A', axe: 'Axe A voile V01', nature: 'CONTROLE_GEOMETRIQUE', appareil: 'TRIMBLE_SX12', travailRealise: 'Contrôle verticalité voile V01', stadeCollage: 'APRES_BETONNAGE', conditionMeteo: 'BEAU', resultat: 'RESERVE', partieOuvrage: 'Voile complet', controles: { create: [{ type: 'VERTICALITY', statut: 'RESERVE', ecartX: 5.8, toleranceX: 5.0, observations: 'Légère déviation' }] } } })

  // ── FICHE 5 — Brigade 2 — SOUMISE ─────────────────────────────
  const f5 = await prisma.ficheJournaliere.create({ data: { date: d(1), statut: 'SOUMISE', observations: 'Tribune B platines et gradins', brigadeId: brigade2.id, createurId: chef2.id } })
  await prisma.mission.create({ data: { ficheId: f5.id, ouvrageId: o[9].id, zone: 'B', axe: 'Axe B platine P01', nature: 'IMPLANTATION', appareil: 'TRIMBLE_S7', travailRealise: 'Implantation platine B-P01', stadeCollage: 'AVANT_SOUDURE', conditionMeteo: 'NUAGEUX', resultat: 'CONFORME', partieOuvrage: 'Platine complète', controles: { create: [{ type: 'IMPLANTATION', statut: 'CONFORME', ecartX: 2.5, ecartY: 1.9, toleranceX: 3.0, toleranceY: 3.0 }] } } })
  await prisma.mission.create({ data: { ficheId: f5.id, ouvrageId: o[7].id, zone: 'B', axe: 'Tribune B rangs 1-3', nature: 'RECEPTION', appareil: 'LEICA_TS16', travailRealise: 'Réception gradins B rangs 1-3', stadeCollage: 'RECEPTION_FINALE', conditionMeteo: 'NUAGEUX', resultat: 'NON_CONFORME', partieOuvrage: 'Gradins rangs 1-3', controles: { create: [{ type: 'ALTIMETRIE', statut: 'NON_CONFORME', ecartZ: 9.2, toleranceZ: 5.0, observations: 'Désafleurement important' }] } } })

  // ── FICHE 6 — Brigade 1 — BROUILLON ───────────────────────────
  const f6 = await prisma.ficheJournaliere.create({ data: { date: d(0), statut: 'BROUILLON', brigadeId: brigade1.id, createurId: chef1.id } })
  await prisma.mission.create({ data: { ficheId: f6.id, ouvrageId: o[0].id, zone: 'A', axe: 'Axe A01', nature: 'CONTROLE_ALTIMETRIQUE', appareil: 'LEICA_NA730', travailRealise: 'Nivellement tête poteau P01', conditionMeteo: 'BEAU', resultat: 'CONFORME', partieOuvrage: 'Tête de poteau', controles: { create: [{ type: 'ALTIMETRIE', statut: 'CONFORME', ecartZ: 0.5, toleranceZ: 3.0 }] } } })

  console.log('✅ Fiches et missions créées')

  const counts = {
    brigades:  await prisma.brigade.count(),
    users:     await prisma.user.count(),
    ouvrages:  await prisma.ouvrage.count(),
    fiches:    await prisma.ficheJournaliere.count(),
    missions:  await prisma.mission.count(),
    controles: await prisma.controle.count(),
  }

  console.log('\n📊 Résumé :')
  Object.entries(counts).forEach(([k, v]) => console.log(`   ${v} ${k}`))
  console.log('\n🎉 Seeding terminé !')
}

main().catch(console.error).finally(() => prisma.$disconnect())