/**
 * @file exporter-rapport-excel.use-case.ts
 * @description Use-case : génère le fichier Excel récap mensuel.
 */

import ExcelJS from 'exceljs'
import { prisma } from '../../infrastructure/prisma/prisma.js'
import { NotFoundError } from '../../domain/errors.js'

// ── CONSTANTES FORMAT ──────────────────────────────────────────────

/**
 * Types d'ouvrages — colonnes du tableau.
 * Ordre exact du fichier Excel original GEOCODING.
 */
const TYPES_OUVRAGES = [
  'Poteau',
  'Poutre crémaillère AV bétonnage',
  'Poutre crémaillère AP bétonnage',
  'Gradins',
  'Voile',
  'Chambord',
  'Vomitoire',
  'Semelle filante',
  'Semelle isoleé',
  'Dalles',
  'Mur de soutènement',
  'Terrassement',
  'Corbeau',
  'Platine',
  'Autre',
  'Assainissement'
]

// Couleurs charte GEOCODING
const NAVY = '0D3B66'
const LIGHT_BLUE = 'D9EAF5'
const WHITE = 'FFFFFF'
const TEAL = '00897B'

/**
 * Mappe le type d'ouvrage de la BDD vers la colonne Excel.
 * La BDD stocke les types en majuscules (PLATINE, POTEAU...)
 * Le fichier Excel utilise des noms complets.
 */
function getTypeOuvrageIndex(type: string, designation: string): number {
  const label = designation.toLowerCase()

  if (label.includes('crémaillère') && label.includes('av')) return 1
  if (label.includes('crémaillère') && label.includes('ap')) return 2
  if (type === 'GRADIN' || label.includes('gradin')) return 3
  if (type === 'VOILE' || label.includes('voile')) return 4
  if (label.includes('chambord')) return 5
  if (label.includes('vomitoire')) return 6
  if (label.includes('semelle filante')) return 7
  if (label.includes('semelle') && label.includes('isol')) return 8
  if (label.includes('dalle')) return 9
  if (label.includes('mur') || label.includes('soutènement')) return 10
  if (label.includes('terrassement') || label.includes('vrd')) return 11
  if (label.includes('corbeau')) return 12
  if (type === 'PLATINE' || label.includes('platine')) return 13
  if (label.includes('assainissement')) return 15
  if (type === 'POTEAU' || label.includes('poteau')) return 0
  return 14 // Autre
}

/**
 * Traduit le jour de la semaine en français.
 */
function getJourSemaine(date: Date): string {
  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  return jours[date.getDay()]
}

// ── USE-CASE PRINCIPAL ────────────────────────────────────────────

export async function exporterRapportExcelUseCase(
  brigadeId: string,
  periode: string  // format "YYYY-MM"
): Promise<Buffer> {

  // ── Vérifie la brigade ─────────────────────────────────────────
  const brigade = await prisma.brigade.findUnique({
    where: { id: brigadeId },
    include: {
      membres: {
        where: { actif: true },
        select: { nom: true, prenom: true },
        take: 1
      }
    }
  })
  if (!brigade) throw new NotFoundError('Brigade')

  // ── Calcule la plage de dates ──────────────────────────────────
  const [annee, mois] = periode.split('-').map(Number)
  const dateDebut = new Date(annee, mois - 1, 1)
  const dateFin = new Date(annee, mois, 0, 23, 59, 59)

  // ── Récupère les fiches validées ───────────────────────────────
  const fiches = await prisma.ficheJournaliere.findMany({
    where: {
      brigadeId,
      statut: 'VALIDEE',
      date: { gte: dateDebut, lte: dateFin }
    },
    include: {
      missions: {
        include: {
          ouvrage: true,
          controles: { select: { statut: true } }
        },
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { date: 'asc' }
  })

  // ── Crée le workbook ExcelJS ───────────────────────────────────
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'GeoGSC Monitoring — GEOCODING'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Rapport', {
    pageSetup: {
      paperSize: 9, // A3
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1
    }
  })

  // ── Largeurs des colonnes ──────────────────────────────────────
  // Col A = Jour, B = Date, C-R = Ouvrages (16 colonnes), S = Partie, T = Conforme, U = Fiche, V = Obs
  sheet.columns = [
    { key: 'jour', width: 12 },      // A - Jour
    { key: 'date', width: 14 },      // B - Date
    ...TYPES_OUVRAGES.map(() => ({ width: 8 })),  // C-R - 16 colonnes ouvrages
    { key: 'partie', width: 35 },    // S - Partie d'ouvrage
    { key: 'conforme', width: 10 },  // T - CONFORME
    { key: 'fiche', width: 8 },      // U - Fiche
    { key: 'observations', width: 40 } // V - Observations
  ]

  // ── LIGNE 1 : Titre ───────────────────────────────────────────
  const titreCell = sheet.getCell('A1')
  titreCell.value = 'RAPPORT JOURNALIER DU CONTRÔLE TOPOGRAPHIQUE DU GRAND STADE DE CASABLANCA'
  titreCell.font = { bold: true, size: 14, color: { argb: WHITE } }
  titreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
  titreCell.alignment = { horizontal: 'center', vertical: 'middle' }
  // Fusionne les colonnes A à V (22 colonnes)
  sheet.mergeCells('A1:V1')
  sheet.getRow(1).height = 30

  // ── LIGNE 2 : vide ─────────────────────────────────────────────
  sheet.getRow(2).height = 8

  // ── LIGNE 3 : logo GEOCODING (texte) ──────────────────────────
  const logoCell = sheet.getCell('A3')
  logoCell.value = 'GEOCODING S.A.R.L — Marché N°05/2025/ANEP — Contrôle topographique extérieur GSC'
  logoCell.font = { italic: true, size: 10, color: { argb: NAVY } }
  sheet.mergeCells('A3:V3')

  // ── LIGNE 4 : Nom complet ──────────────────────────────────────
  sheet.getCell('A4').value = 'Nom complet :'
  sheet.getCell('A4').font = { bold: true }
  const nomChef = brigade.chef
  sheet.getCell('B4').value = nomChef
  sheet.getCell('B4').font = { bold: true, color: { argb: NAVY } }
  sheet.mergeCells('B4:E4')

  // ── LIGNE 5 : vide ─────────────────────────────────────────────
  sheet.getRow(5).height = 8

  // ── LIGNE 6 : Mois de travail ──────────────────────────────────
  sheet.getCell('A6').value = 'Mois de Travail :'
  sheet.getCell('A6').font = { bold: true }
  sheet.getCell('B6').value = dateDebut
  sheet.getCell('B6').numFmt = 'MMMM YYYY'
  sheet.getCell('B6').font = { bold: true, color: { argb: NAVY } }
  sheet.mergeCells('B6:E6')

  // ── LIGNE 7 : vide ─────────────────────────────────────────────
  sheet.getRow(7).height = 8

  // ── LIGNE 8 : En-têtes niveau 1 ───────────────────────────────
  const styleEnTete1 = {
    font: { bold: true, color: { argb: WHITE }, size: 11 },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: NAVY } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    border: {
      top: { style: 'thin' as const }, bottom: { style: 'thin' as const },
      left: { style: 'thin' as const }, right: { style: 'thin' as const }
    }
  }

  sheet.getCell('A8').value = 'Jour'
  Object.assign(sheet.getCell('A8'), styleEnTete1)
  sheet.mergeCells('A8:A9') // Jour fusionne ligne 8 et 9

  sheet.getCell('B8').value = 'Date'
  Object.assign(sheet.getCell('B8'), styleEnTete1)
  sheet.mergeCells('B8:B9') // Date fusionne ligne 8 et 9

  sheet.getCell('C8').value = 'Ouvrage'
  Object.assign(sheet.getCell('C8'), styleEnTete1)
  // Fusionne les 16 colonnes types d'ouvrages
  sheet.mergeCells(`C8:R8`)

  sheet.getCell('S8').value = "Partie d'Ouvrage"
  Object.assign(sheet.getCell('S8'), styleEnTete1)
  sheet.mergeCells('S8:S9')

  sheet.getCell('T8').value = 'CONFORME'
  Object.assign(sheet.getCell('T8'), {
    ...styleEnTete1,
    font: { bold: true, color: { argb: WHITE }, size: 11 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL } }
  })
  sheet.mergeCells('T8:T9')

  sheet.getCell('U8').value = 'Fiche'
  Object.assign(sheet.getCell('U8'), styleEnTete1)
  sheet.mergeCells('U8:U9')

  sheet.getCell('V8').value = 'Observations'
  Object.assign(sheet.getCell('V8'), styleEnTete1)
  sheet.mergeCells('V8:V9')

  sheet.getRow(8).height = 25

  // ── LIGNE 9 : Sous-en-têtes types d'ouvrages ──────────────────
  const styleEnTete2 = {
    font: { bold: true, size: 9, color: { argb: NAVY } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: LIGHT_BLUE } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    border: {
      top: { style: 'thin' as const }, bottom: { style: 'thin' as const },
      left: { style: 'thin' as const }, right: { style: 'thin' as const }
    }
  }

  TYPES_OUVRAGES.forEach((type, i) => {
    const col = String.fromCharCode(67 + i) // C=67, D=68...
    const cell = sheet.getCell(`${col}9`)
    cell.value = type
    Object.assign(cell, styleEnTete2)
  })

  sheet.getRow(9).height = 45

  // ── LIGNES DE DONNÉES ─────────────────────────────────────────
  let rowIndex = 10

  /**
   * Style pour les cellules de données.
   * Alternance de couleurs pour la lisibilité.
   */
  const getStyleData = (isEven: boolean) => ({
    fill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: isEven ? 'F8FBFF' : WHITE }
    },
    border: {
      top: { style: 'thin' as const, color: { argb: 'E0E0E0' } },
      bottom: { style: 'thin' as const, color: { argb: 'E0E0E0' } },
      left: { style: 'thin' as const, color: { argb: 'E0E0E0' } },
      right: { style: 'thin' as const, color: { argb: 'E0E0E0' } }
    },
    alignment: { vertical: 'middle' as const, wrapText: true }
  })

  let ligneCount = 0

  for (const fiche of fiches) {
    const dateFiche = new Date(fiche.date)

    for (const mission of fiche.missions) {
      const isEven = ligneCount % 2 === 0
      const styleData = getStyleData(isEven)
      const row = sheet.getRow(rowIndex)

      // Détermine si la mission est conforme
      const nbControles = mission.controles.length
      const nbConformes = mission.controles.filter(c => c.statut === 'CONFORME').length
      const estConforme = nbControles > 0 && nbNonConformes(mission.controles) === 0

      // ── Jour ──
      const cellJour = row.getCell(1)
      cellJour.value = getJourSemaine(dateFiche)
      Object.assign(cellJour, {
        ...styleData,
        font: { bold: true, color: { argb: NAVY } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      })

      // ── Date ──
      const cellDate = row.getCell(2)
      cellDate.value = dateFiche
      cellDate.numFmt = 'DD/MM/YYYY'
      Object.assign(cellDate, {
        ...styleData,
        alignment: { horizontal: 'center', vertical: 'middle' }
      })

      // ── Colonnes ouvrages (C à R) — marque X dans la bonne colonne ──
      const typeIndex = getTypeOuvrageIndex(
        mission.ouvrage.type,
        mission.ouvrage.designation
      )

      for (let i = 0; i < TYPES_OUVRAGES.length; i++) {
        const cell = row.getCell(3 + i)
        if (i === typeIndex) {
          cell.value = 'X'
          cell.font = { bold: true, color: { argb: NAVY } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } }
        } else {
          Object.assign(cell, styleData)
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = styleData.border
      }

      // ── Partie d'ouvrage ──
      const cellPartie = row.getCell(19) // colonne S
      cellPartie.value = `${mission.ouvrage.reference} — ${mission.ouvrage.designation}`
      Object.assign(cellPartie, styleData)

      // ── CONFORME ──
      const cellConforme = row.getCell(20) // colonne T
      if (estConforme) {
        cellConforme.value = 'X'
        cellConforme.font = { bold: true, color: { argb: WHITE } }
        cellConforme.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL } }
      } else {
        Object.assign(cellConforme, styleData)
      }
      cellConforme.alignment = { horizontal: 'center', vertical: 'middle' }

      // ── Fiche ──
      const cellFiche = row.getCell(21) // colonne U
      cellFiche.value = 'X'
      cellFiche.font = { bold: true, color: { argb: NAVY } }
      Object.assign(cellFiche, {
        ...styleData,
        alignment: { horizontal: 'center', vertical: 'middle' }
      })

      // ── Observations ──
      const cellObs = row.getCell(22) // colonne V
      cellObs.value = mission.observations ?? ''
      Object.assign(cellObs, styleData)

      row.height = 20
      rowIndex++
      ligneCount++
    }
  }

  // ── LIGNE TOTAUX ───────────────────────────────────────────────
  const rowTotal = sheet.getRow(rowIndex)
  rowTotal.getCell(1).value = 'TOTAL'
  rowTotal.getCell(1).font = { bold: true, color: { argb: WHITE } }
  rowTotal.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
  sheet.mergeCells(`A${rowIndex}:B${rowIndex}`)

  // Compte les X dans la colonne CONFORME
  rowTotal.getCell(20).value = `=COUNTIF(T10:T${rowIndex - 1},"X")`
rowTotal.getCell(21).value = `=COUNTA(U10:U${rowIndex - 1})`
  rowTotal.getCell(20).font = { bold: true, color: { argb: WHITE } }
  rowTotal.getCell(20).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL } }
  rowTotal.getCell(20).alignment = { horizontal: 'center' }

  rowTotal.getCell(21).value = { formula: `=COUNTA(U10:U${rowIndex - 1})` }
  rowTotal.getCell(21).font = { bold: true }
  rowTotal.getCell(21).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } }
  rowTotal.getCell(21).alignment = { horizontal: 'center' }

  rowTotal.height = 22

  // ── Génère le buffer ──────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/**
 * Compte les contrôles NON_CONFORMES.
 */
function nbNonConformes(controles: { statut: string }[]): number {
  return controles.filter(c => c.statut === 'NON_CONFORME').length
}