/**
 * @file Spinner.tsx
 * @description Indicateur de chargement animé.
 *
 * UTILISÉ POUR :
 * → Chargement de la liste des fiches
 * → Attente de la réponse API
 * → Soumission d'un formulaire
 *
 * USAGE :
 * <Spinner />                    // taille normale, couleur Navy
 * <Spinner size="lg" />          // grand spinner
 * <Spinner color="white" />      // blanc (sur fond sombre)
 */

function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(' ')
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'navy' | 'white' | 'teal'
  className?: string
}

export function Spinner({
  size = 'md',
  color = 'navy',
  className
}: SpinnerProps) {

  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3'
  }

  const colors = {
    navy:  'border-[#0D3B66] border-t-transparent',
    white: 'border-white border-t-transparent',
    teal:  'border-[#00897B] border-t-transparent'
  }

  return (
    <div
      role="status"
      aria-label="Chargement en cours"
      className={cn(
        'rounded-full animate-spin',
        sizes[size],
        colors[color],
        className
      )}
    />
  )
}

/**
 * Wrapper centré — pour afficher le spinner au milieu d'une page
 *
 * USAGE :
 * <SpinnerPage /> // spinner centré plein écran
 */
export function SpinnerPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size="lg" />
    </div>
  )
}