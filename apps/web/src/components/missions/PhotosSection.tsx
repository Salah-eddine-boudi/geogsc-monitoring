/**
 * @file PhotosSection.tsx
 * @description Section photos dans le formulaire de réception.
 *
 * COMPORTEMENT :
 * - Avant soumission  : photos sélectionnées localement (preview), pas encore uploadées
 * - Après soumission  : upload automatique vers le serveur
 * - Mission existante : photos déjà enregistrées + possibilité d'en ajouter
 *
 * RÈGLES CDC :
 * - 0 photo possible (optionnel)
 * - Max 3 photos par mission
 * - Compression côté serveur (Sharp 1200px, JPEG 80%)
 * - GPS automatique si disponible
 */

import { useRef, useState } from 'react'
import { Camera, X, Image, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface PhotoLocale {
  file:     File
  preview:  string   // URL.createObjectURL
  name:     string
}

export interface PhotoServeur {
  id:  string
  url: string
}

interface PhotosSectionProps {
  // Photos déjà sur le serveur (mode édition)
  photosExistantes?: PhotoServeur[]
  // Callback appelé quand l'utilisateur sélectionne des fichiers
  onPhotosChange: (photos: PhotoLocale[]) => void
  // Callback pour supprimer une photo serveur existante
  onDeleteExistante?: (photoId: string) => void
  // Chargement en cours (upload)
  isUploading?: boolean
  // Max photos (défaut 3)
  maxPhotos?: number
}

export function PhotosSection({
  photosExistantes = [],
  onPhotosChange,
  onDeleteExistante,
  isUploading = false,
  maxPhotos = 3,
}: PhotosSectionProps) {
  const [photosLocales, setPhotosLocales] = useState<PhotoLocale[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const totalPhotos = photosExistantes.length + photosLocales.length
  const peutAjouter = totalPhotos < maxPhotos && !isUploading

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    // Limiter au quota restant
    const quota  = maxPhotos - photosExistantes.length - photosLocales.length
    const valides = files.slice(0, quota).filter(f => f.type.startsWith('image/'))

    const nouvelles: PhotoLocale[] = valides.map(f => ({
      file:    f,
      preview: URL.createObjectURL(f),
      name:    f.name,
    }))

    const mises_a_jour = [...photosLocales, ...nouvelles]
    setPhotosLocales(mises_a_jour)
    onPhotosChange(mises_a_jour)

    // Reset input pour permettre de re-sélectionner le même fichier
    if (inputRef.current) inputRef.current.value = ''
  }

  const supprimerLocale = (index: number) => {
    const updated = photosLocales.filter((_, i) => i !== index)
    // Libérer l'URL objet pour éviter les fuites mémoire
    URL.revokeObjectURL(photosLocales[index].preview)
    setPhotosLocales(updated)
    onPhotosChange(updated)
  }

  return (
    <div className="space-y-3">

      {/* ── Photos existantes (serveur) ─────────────────────── */}
      {photosExistantes.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photosExistantes.map(photo => (
            <div key={photo.id} className="relative rounded-xl overflow-hidden aspect-square bg-gray-100">
              <img
                src={photo.url}
                alt="Photo réception"
                className="w-full h-full object-cover"
              />
              {onDeleteExistante && (
                <button
                  type="button"
                  onClick={() => onDeleteExistante(photo.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all shadow-sm"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Photos locales (sélectionnées, pas encore uploadées) */}
      {photosLocales.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photosLocales.map((photo, index) => (
            <div key={index} className="relative rounded-xl overflow-hidden aspect-square bg-gray-100">
              <img
                src={photo.preview}
                alt={photo.name}
                className="w-full h-full object-cover"
              />
              {/* Badge "En attente" */}
              <div className="absolute bottom-0 inset-x-0 bg-black/50 py-1 px-2">
                <p className="text-white text-[9px] font-medium truncate">{photo.name}</p>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => supprimerLocale(index)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all shadow-sm"
                >
                  <X size={12} />
                </button>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Loader2 size={20} className="text-white animate-spin" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Zone vide (aucune photo) ─────────────────────────── */}
      {totalPhotos === 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-dashed border-gray-200">
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Image size={18} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-400">
            Aucune photo — optionnel
          </p>
        </div>
      )}

      {/* ── Bouton ajouter photo ─────────────────────────────── */}
      {peutAjouter && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"   // ← ouvre la caméra arrière sur mobile
            multiple
            className="sr-only"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              'w-full h-11 rounded-xl border-2 border-dashed',
              'flex items-center justify-center gap-2',
              'text-sm font-semibold transition-all duration-150 active:scale-95',
              totalPhotos === 0
                ? 'border-[#1B6B93] text-[#1B6B93] hover:bg-[#D9EAF5]'
                : 'border-gray-200 text-gray-500 hover:border-[#1B6B93] hover:text-[#1B6B93]'
            )}
          >
            <Camera size={16} />
            {totalPhotos === 0
              ? 'Prendre une photo'
              : `Ajouter une photo (${totalPhotos}/${maxPhotos})`
            }
          </button>
        </>
      )}

      {/* ── Message quota atteint ────────────────────────────── */}
      {totalPhotos >= maxPhotos && (
        <p className="text-xs text-gray-400 text-center">
          Maximum {maxPhotos} photos atteint
        </p>
      )}
    </div>
  )
}