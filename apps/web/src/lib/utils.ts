import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { StatutControle, StatutFiche, StatutMission } from '../types/api.types'

// ─── CLASSNAMES ───────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── DATES ────────────────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function formatPeriode(periode: string): string {
  const [annee, mois] = periode.split('-')
  const date = new Date(Number(annee), Number(mois) - 1)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export function formatHeure(dateStr: string | null): string {
  if (!dateStr) return '--:--'
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getPeriodeCourante(): string {
  const now = new Date()
  const mois = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${mois}`
}

// ─── STATUTS FICHES ───────────────────────────────────────────────────────────

export function getStatutFicheLabel(statut: StatutFiche): string {
  const labels: Record<StatutFiche, string> = {
    BROUILLON: 'Brouillon',
    SOUMISE: 'Soumise',
    VALIDEE: 'Validée',
    REJETEE: 'Rejetée'
  }
  return labels[statut]
}

export function getStatutFicheColor(statut: StatutFiche): string {
  const colors: Record<StatutFiche, string> = {
    BROUILLON: 'bg-gray-100 text-gray-700 border-gray-200',
    SOUMISE: 'bg-blue-100 text-blue-700 border-blue-200',
    VALIDEE: 'bg-teal-100 text-teal-700 border-teal-200',
    REJETEE: 'bg-red-100 text-red-700 border-red-200'
  }
  return colors[statut]
}

// ─── STATUTS MISSIONS ─────────────────────────────────────────────────────────

export function getStatutMissionLabel(statut: StatutMission): string {
  const labels: Record<StatutMission, string> = {
    PLANIFIEE: 'Planifiée',
    EN_COURS: 'En cours',
    TERMINEE: 'Terminée'
  }
  return labels[statut]
}

export function getStatutMissionColor(statut: StatutMission): string {
  const colors: Record<StatutMission, string> = {
    PLANIFIEE: 'bg-gray-100 text-gray-600',
    EN_COURS: 'bg-orange-100 text-orange-700',
    TERMINEE: 'bg-teal-100 text-teal-700'
  }
  return colors[statut]
}

// ─── STATUTS CONTRÔLES ────────────────────────────────────────────────────────

export function getStatutControleLabel(statut: StatutControle): string {
  const labels: Record<StatutControle, string> = {
    CONFORME: 'Conforme',
    NON_CONFORME: 'Non conforme',
    RESERVE: 'Réserve'
  }
  return labels[statut]
}

export function getStatutControleColor(statut: StatutControle): string {
  const colors: Record<StatutControle, string> = {
    CONFORME: 'bg-teal-100 text-teal-700 border-teal-200',
    NON_CONFORME: 'bg-red-100 text-red-700 border-red-200',
    RESERVE: 'bg-orange-100 text-orange-700 border-orange-200'
  }
  return colors[statut]
}

// ─── TYPES CONTRÔLES ─────────────────────────────────────────────────────────

export function getTypeControleLabel(type: string): string {
  const labels: Record<string, string> = {
    IMPLANTATION: 'Implantation',
    ALTIMETRIE: 'Altimétrie',
    VERTICALITY: 'Verticalité',
    RECEPTION: 'Réception',
    CONTRADICTOIRE: 'Contradictoire'
  }
  return labels[type] ?? type
}