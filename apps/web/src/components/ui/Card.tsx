/**
 * @file Card.tsx
 * @description Composant carte — conteneur visuel avec ombre.
 *
 * UTILISÉ POUR :
 * → Carte fiche journalière dans la liste
 * → Carte KPI dans le dashboard IGT
 * → Formulaire de login
 * → Section rapport mensuel
 *
 * USAGE :
 * <Card>
 *   <Card.Header>Titre</Card.Header>
 *   <Card.Body>Contenu</Card.Body>
 * </Card>
 *
 * Ou simplement :
 * <Card className="p-4">Contenu libre</Card>
 */

import React from 'react'

const cn = (...classes: (string | undefined | null | boolean)[]) => 
  classes.filter(Boolean).join(' ')

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void  // rend la carte cliquable si défini
}

// ── COMPOSANT PRINCIPAL ────────────────────────────────────────────

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-sm border border-gray-100',
        // Si onClick défini → curseur pointer + hover effect
        onClick && 'cursor-pointer hover:shadow-md transition-shadow duration-200',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// ── SOUS-COMPOSANTS ────────────────────────────────────────────────
// Pattern "Compound Components" — Card.Header, Card.Body, Card.Footer
// Permet une API déclarative et lisible

/**
 * En-tête de la carte — fond légèrement coloré
 */
Card.Header = function CardHeader({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(
      'px-4 py-3 border-b border-gray-100 font-semibold text-[#0D3B66]',
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Corps de la carte — contenu principal
 */
Card.Body = function CardBody({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('p-4', className)}>
      {children}
    </div>
  )
}

/**
 * Pied de la carte — actions
 */
Card.Footer = function CardFooter({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(
      'px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl',
      className
    )}>
      {children}
    </div>
  )
}