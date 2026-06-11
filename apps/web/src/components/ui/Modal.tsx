/**
 * @file Modal.tsx
 * @description Fenêtre modale — dialogue de confirmation ou formulaire.
 *
 * UTILISÉ POUR :
 * → Confirmation de soumission d'une fiche
 * → Formulaire de rejet avec motif
 * → Création d'une mission
 *
 * USAGE :
 * <Modal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Rejeter la fiche"
 * >
 *   <p>Motif du rejet...</p>
 * </Modal>
 */

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
// Simple classnames helper: joins truthy class strings.
const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ')

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}: ModalProps) {

  /**
   * useEffect → effet de bord React.
   * Ici : ferme la modale quand on appuie sur Échap.
   * C'est une exigence d'accessibilité (ARIA).
   *
   * Le cleanup (return) supprime l'écouteur quand le composant
   * est démonté — évite les memory leaks.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Empêche le scroll de la page derrière la modale
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Ne rend rien si la modale est fermée
  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  }

  return (
    /**
     * Portail — la modale est rendue au-dessus de tout le reste.
     * fixed inset-0 → couvre tout l'écran
     * z-50 → au-dessus de tous les autres éléments
     */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Overlay sombre derrière la modale — clic ferme la modale */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenu de la modale */}
      <div className={cn(
        'relative bg-white rounded-2xl shadow-xl w-full',
        'animate-in fade-in zoom-in-95 duration-200',
        sizes[size]
      )}>

        {/* En-tête avec titre et bouton fermer */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2
            id="modal-title"
            className="text-lg font-semibold text-[#0D3B66]"
          >
            {title}
          </h2>

          {/* Bouton fermer — X de Lucide React */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps de la modale — contenu passé en children */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}