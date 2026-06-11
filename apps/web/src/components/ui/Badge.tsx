/**
 * @file Badge.tsx
 * @description Badge de statut coloré — charte GEOCODING.
 *
 * UTILISÉ POUR :
 * → Statut fiche     : BROUILLON (gris) / SOUMISE (bleu) / VALIDEE (vert) / REJETEE (rouge)
 * → Statut mission   : PLANIFIEE (gris) / EN_COURS (orange) / TERMINEE (vert)
 * → Statut contrôle  : CONFORME (vert) / RESERVE (orange) / NON_CONFORME (rouge)
 *
 * USAGE :
 * <Badge variant="conforme">Conforme</Badge>
 * <Badge variant="validee">Validée</Badge>
 */

import React from 'react'

const cn = (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' ')

interface BadgeProps {
  /** Variante visuelle — détermine la couleur */
  variant:
    | 'conforme'      // Teal — positif
    | 'non-conforme'  // Rouge — critique
    | 'reserve'       // Orange — attention
    | 'brouillon'     // Gris — neutre
    | 'soumise'       // Bleu — en attente
    | 'validee'       // Teal — validé
    | 'rejetee'       // Rouge — rejeté
    | 'planifiee'     // Gris — pas encore commencé
    | 'en-cours'      // Orange — en progression
    | 'terminee'      // Teal — fini

  children: React.ReactNode
  className?: string
}

export function Badge({ variant, children, className }: BadgeProps) {

  // Classes de base communes à tous les badges
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border'

  // Couleurs par variante — cohérentes avec la charte GEOCODING
  const variants = {
    // Vert Teal GEOCODING — résultat positif
    conforme:     'bg-teal-50 text-teal-700 border-teal-200',
    validee:      'bg-teal-50 text-teal-700 border-teal-200',
    terminee:     'bg-teal-50 text-teal-700 border-teal-200',

    // Rouge — problème critique, action requise
    'non-conforme': 'bg-red-50 text-red-700 border-red-200',
    rejetee:        'bg-red-50 text-red-700 border-red-200',

    // Orange — attention, à surveiller
    reserve:   'bg-orange-50 text-orange-700 border-orange-200',
    'en-cours': 'bg-orange-50 text-orange-700 border-orange-200',

    // Bleu GEOCODING — en attente de traitement
    soumise: 'bg-blue-50 text-[#1B6B93] border-blue-200',

    // Gris neutre — état initial
    brouillon: 'bg-gray-100 text-gray-600 border-gray-200',
    planifiee: 'bg-gray-100 text-gray-600 border-gray-200',
  }

  return (
    <span className={cn(base, variants[variant], className)}>
      {children}
    </span>
  )
}