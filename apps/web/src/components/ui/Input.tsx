/**
 * @file Input.tsx
 * @description Champ de saisie — mobile-first, accessible.
 *
 * EXIGENCE CDC :
 * "Champs larges p-4 border-2 rounded-lg text-base"
 * → Saisie facile sur smartphone au chantier

 */

import React from 'react'

function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(' ')
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label affiché au-dessus du champ */
  label?: string

  /** Message d'erreur affiché en rouge sous le champ */
  error?: string

  /** Icône affichée à gauche */
  leftIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  /**
   * React.forwardRef → permet au parent de passer une ref à l'input.
   * Nécessaire pour react-hook-form qui utilise des refs.
   */
  ({ label, error, leftIcon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">

        {/* Label — affiché seulement si fourni */}
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
            {/* Indicateur obligatoire si required */}
            {props.required && (
              <span className="text-red-500 ml-1" aria-label="obligatoire">*</span>
            )}
          </label>
        )}

        {/* Wrapper pour positionner l'icône */}
        <div className="relative">

          {/* Icône gauche — optionnelle */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              // Taille mobile-first — h-14 = 56px (CDC exige grands champs)
              'w-full h-14 rounded-xl border-2 bg-white',
              'text-base text-gray-900 placeholder:text-gray-400',
              'transition-colors duration-150',

              // Padding gauche plus grand si icône présente
              leftIcon ? 'pl-10 pr-4' : 'px-4',

              // Couleur de bordure selon l'état
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-200 focus:border-[#1B6B93] focus:ring-[#D9EAF5]',

              // Focus ring — accessibilité
              'focus:outline-none focus:ring-2',

              className
            )}
            {...props}
          />
        </div>

        {/* Message d'erreur — affiché seulement si error est défini */}
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1" role="alert">
            {/* Icône d'alerte */}
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)

// Nom affiché dans React DevTools pour le débogage
Input.displayName = 'Input'