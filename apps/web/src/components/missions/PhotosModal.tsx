/**
 * @file PhotosModal.tsx
 * @description Modal pour ajouter/voir les photos d'une mission existante.
 * Accessible même après soumission de la fiche (pour le rapport final).
 */

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Camera, X, Loader2, Image } from 'lucide-react'
import { Modal }  from '../ui/Modal'
import { Button } from '../ui/Button'
import { photosService } from '../../services/photos.service'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'
import type { Mission } from '../../types/api.types'

interface PhotosModalProps {
  isOpen:    boolean
  onClose:   () => void
  ficheId:   string
  mission:   Mission
}

export function PhotosModal({ isOpen, onClose, ficheId, mission }: PhotosModalProps) {
  const queryClient               = useQueryClient()
  const [isUploading, setUploading] = useState(false)

  // Photos existantes sur le serveur
  const photos = (mission as any).photos ?? []

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const quota   = 3 - photos.length
    const valides = files.slice(0, quota).filter(f => f.type.startsWith('image/'))
    if (!valides.length) return

    setUploading(true)
    try {
      await photosService.upload(ficheId, mission.id, valides)
      toast.success(`${valides.length} photo${valides.length > 1 ? 's' : ''} ajoutée${valides.length > 1 ? 's' : ''} ✓`)
      await queryClient.invalidateQueries({ queryKey: ['fiche', ficheId] })
    } catch {
      toast.error("Échec de l'upload. Réessayez.")
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (photoId: string) => {
    try {
      await photosService.delete(ficheId, mission.id, photoId)
      await queryClient.invalidateQueries({ queryKey: ['fiche', ficheId] })
      toast.success('Photo supprimée')
    } catch {
      toast.error('Impossible de supprimer la photo.')
    }
  }

  const peutAjouter = photos.length < 3 && !isUploading

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Photos de la réception"
      size="md"
    >
      <div className="space-y-4">

        {/* Info mission */}
        <div className="px-3 py-2 bg-[#D9EAF5] rounded-xl">
          <p className="text-xs font-semibold text-[#0D3B66]">
            {mission.ouvrage?.reference} — {mission.ouvrage?.designation}
          </p>
          {mission.partieOuvrage && (
            <p className="text-xs text-[#1B6B93] mt-0.5">{mission.partieOuvrage}</p>
          )}
        </div>

        {/* Grille photos */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo: any) => (
              <div key={photo.id} className="relative rounded-xl overflow-hidden aspect-square bg-gray-100">
                <img
                  src={photo.url}
                  alt="Photo réception"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDelete(photo.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 active:scale-95 shadow-sm"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {/* Slots vides */}
            {Array.from({ length: 3 - photos.length }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                <Image size={20} className="text-gray-300" />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center gap-2 text-gray-400">
            <Image size={32} className="text-gray-200" />
            <p className="text-sm">Aucune photo pour cette réception</p>
          </div>
        )}

        {/* Compteur */}
        <p className="text-xs text-gray-400 text-center">
          {photos.length} / 3 photo{photos.length > 1 ? 's' : ''}
          {photos.length === 3 && ' — maximum atteint'}
        </p>

        {/* Bouton ajouter */}
        {peutAjouter && (
          <label className={cn(
            'w-full h-12 rounded-xl border-2 border-dashed',
            'flex items-center justify-center gap-2 cursor-pointer',
            'text-sm font-semibold transition-all active:scale-95',
            'border-[#1B6B93] text-[#1B6B93] hover:bg-[#D9EAF5]'
          )}>
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Camera size={16} />
                Prendre / Choisir une photo
              </>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="sr-only"
              onChange={handleFiles}
              disabled={isUploading}
            />
          </label>
        )}

        <Button type="button" variant="secondary" size="md" onClick={onClose} className="w-full">
          Fermer
        </Button>
      </div>
    </Modal>
  )
}