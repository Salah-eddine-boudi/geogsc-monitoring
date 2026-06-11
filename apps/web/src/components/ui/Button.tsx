/**
 * @file Button.tsx
 * @description Composant bouton réutilisable — charte GEOCODING.
 */
// React est nécessaire pour JSX
import React from 'react'

const cn = (...classes: (string | undefined | null | false)[]) => 
  classes.filter(Boolean).join(' ')


interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visuelle du bouton */
  variant?: 'primary' | 'secondary' | 'danger' | 'success'

  /** Taille du bouton */
  size?: 'sm' | 'md' | 'lg'

  /** Affiche un spinner et désactive le bouton pendant le chargement */
  loading?: boolean

  /** Contenu du bouton — texte, icône, ou les deux */
  children: React.ReactNode
}

export function Button({
  variant = 'primary',  // valeur par défaut si non spécifié
  size = 'md',
  loading = false,
  children,
  className,    // classes additionnelles passées par le parent
  disabled,
  ...props      // toutes les autres props natives (onClick, type...)
}: ButtonProps) {

  // ── STYLES DE BASE ──────────────────────────────────────────────
  // Classes communes à tous les boutons
  const base = [
    'inline-flex items-center justify-center',  // flexbox centré
    'font-semibold rounded-xl',                  // texte semi-gras, coins arrondis
    'transition-all duration-200',               // animation fluide au hover
    'focus:outline-none focus:ring-2 focus:ring-offset-2', // accessibilité clavier
    'disabled:opacity-50 disabled:cursor-not-allowed'      // état désactivé
  ].join(' ')

  // ── STYLES PAR VARIANTE ──────────────────────────────────────────
  const variants = {
    // Navy → blanc — bouton principal GEOCODING
    primary: 'bg-[#0D3B66] text-white hover:bg-[#1B6B93] focus:ring-[#0D3B66]',

    // Transparent avec bordure — action secondaire
    secondary: 'bg-white text-gray-700 border-2 border-gray-300 hover:border-[#1B6B93] hover:text-[#1B6B93] focus:ring-gray-300',

    // Rouge — action destructive (rejeter, supprimer)
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',

    // Teal — validation, succès
    success: 'bg-[#00897B] text-white hover:bg-[#00796B] focus:ring-[#00897B]'
  }

  // ── STYLES PAR TAILLE ────────────────────────────────────────────
  const sizes = {
    sm: 'h-8 px-3 text-sm gap-1.5',    // compact — dans les tableaux
    md: 'h-10 px-4 text-sm gap-2',      // normal — formulaires
    lg: 'h-14 px-6 text-base gap-2 w-full' // grand — mobile terrain
    // h-14 = 56px — CDC exige des boutons grands pour les gros doigts
  }

  return (
    <button
      // cn() combine toutes les classes et résout les conflits
      className={cn(base, variants[variant], sizes[size], className)}

      // Désactive si loading OU si disabled est passé en prop
      disabled={loading || disabled}

      // Spread des props natives (onClick, type, form, etc.)
      {...props}
    >
      {/* Spinner affiché pendant le chargement */}
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}

      {/* Contenu du bouton — texte ou icône */}
      {children}
    </button>
  )
}