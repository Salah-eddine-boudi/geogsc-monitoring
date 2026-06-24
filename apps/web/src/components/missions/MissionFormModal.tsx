/**
 * @file MissionFormModal.tsx — v8
 *
 * AJOUT v8 :
 * ✅ Section 4 — Photos (0 à 3, optionnel)
 * ✅ Upload automatique après soumission réussie
 * ✅ Aperçu local avant upload
 * ✅ Support photos existantes en mode édition
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  ChevronDown, ChevronRight, MapPin, Wrench,
  CheckCircle, AlertTriangle, Camera
} from 'lucide-react'
import { Modal }    from '../ui/Modal'
import { Button }   from '../ui/Button'
import { useMissionForm } from '../../hooks/useMissionForm'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ouvragesService } from '../../services/ouvrages.service'
import { photosService }   from '../../services/photos.service'
import { cn } from '../../lib/utils'
import { PhotosSection, type PhotoLocale } from './PhotosSection'

import {
  ZONES_GSC, NATURES_INTERVENTION, PROVENANCES_APPAREIL,
  STADES_COLLAGE, RESULTATS_CONTROLE, TYPES_OUVRAGE,
  CATEGORIES_ASSAINISSEMENT, NIVEAUX_ETAGE,
  AXES_PAR_ZONE, TOUS_LES_AXES, FILS, TOLERANCES_OUVRAGES,
} from '../../constants/mission.constants'

import type { Mission } from '../../types/api.types'

// ─── STYLES ───────────────────────────────────────────────────────────────────
const inputClass = `
  w-full h-12 sm:h-14 px-3 sm:px-4 rounded-xl border-2 border-gray-200
  text-base font-medium bg-white text-gray-900
  focus:outline-none focus:border-[#1B6B93] focus:ring-2 focus:ring-[#D9EAF5]
  transition-all duration-200 appearance-none
`
const inputErrorClass = `
  w-full h-12 sm:h-14 px-3 sm:px-4 rounded-xl border-2 border-red-300 bg-red-50
  text-base font-medium text-red-900
  focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100
  transition-all duration-200
`
const textareaClass = `
  w-full px-3 sm:px-4 py-3 rounded-xl border-2 border-gray-200
  text-base font-medium bg-white text-gray-900 resize-none
  focus:outline-none focus:border-[#1B6B93] focus:ring-2 focus:ring-[#D9EAF5]
  transition-all duration-200
`

// ─── DIALOG CONFIRMATION ──────────────────────────────────────────────────────
function ConfirmCloseDialog({ onConfirm, onCancel }: {
  onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center px-4 rounded-2xl"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-orange-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-[15px]">Fermer sans enregistrer ?</h3>
            <p className="text-[13px] text-gray-500 mt-1">Les données saisies seront perdues.</p>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onCancel}
            className="flex-1 h-11 rounded-xl border-2 border-gray-200 font-semibold text-sm hover:bg-gray-50 active:scale-95 transition-all">
            Continuer
          </button>
          <button type="button" onClick={onConfirm}
            className="flex-1 h-11 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 active:scale-95 transition-all">
            Oui, fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── BANNIÈRE ERREUR ──────────────────────────────────────────────────────────
function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mx-3 mb-3 p-3 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-2">
      <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm font-medium text-red-700 leading-snug">{message}</p>
    </div>
  )
}

// ─── SECTION ACCORDÉON ────────────────────────────────────────────────────────
function SectionAccordeon({ titre, icone: Icone, isOpen, onToggle, children, hasError = false }: {
  titre: string; icone: React.ElementType; isOpen: boolean
  onToggle: () => void; children: React.ReactNode; hasError?: boolean
}) {
  return (
    <div className={cn(
      'border-2 rounded-xl overflow-hidden transition-all duration-300',
      hasError ? 'border-red-300' : isOpen ? 'border-[#1B6B93] shadow-md' : 'border-gray-100'
    )}>
      <button type="button" onClick={onToggle} className={cn(
        'w-full flex items-center gap-2 px-3 sm:px-4 py-3 text-left transition-colors',
        isOpen ? 'bg-[#D9EAF5]' : 'bg-white hover:bg-gray-50'
      )}>
        <div className={cn('p-1.5 rounded-lg shrink-0',
          isOpen ? 'bg-[#1B6B93] text-white' : 'bg-gray-100 text-gray-500')}>
          <Icone size={18} />
        </div>
        <span className={cn('flex-1 text-[14px] font-bold truncate',
          isOpen ? 'text-[#0D3B66]' : 'text-gray-700')}>
          {titre}
        </span>
        {hasError && (
          <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-md font-bold uppercase shrink-0">
            Erreur
          </span>
        )}
        {isOpen ? <ChevronDown size={18} className="text-[#1B6B93] shrink-0" />
                : <ChevronRight size={18} className="text-gray-400 shrink-0" />}
      </button>
      {isOpen && (
        <div className="p-3 sm:p-4 bg-white space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── CHAMP FORMULAIRE ─────────────────────────────────────────────────────────
function FormField({ label, required = false, error, hint, children }: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[13px] sm:text-sm font-bold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {hint && <span className="ml-1.5 text-[11px] font-normal text-gray-400">{hint}</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs font-medium text-red-600 flex items-center gap-1 mt-0.5">
          <span className="inline-block w-1 h-1 rounded-full bg-red-600 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

// ─── TOGGLE ───────────────────────────────────────────────────────────────────
function ToggleField({ options, value, onChange }: {
  options: readonly { value: string; label: string }[]
  value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex rounded-xl border-2 border-gray-200 overflow-hidden">
      {options.map(opt => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
          className={cn('flex-1 h-12 text-sm font-semibold transition-colors',
            value === opt.value ? 'bg-[#0D3B66] text-white'
              : 'bg-white text-gray-500 hover:bg-[#D9EAF5] hover:text-[#0D3B66]')}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

interface MissionFormModalProps {
  isOpen:    boolean
  onClose:   () => void
  ficheId:   string
  mission?:  Mission
  onSuccess: () => void
}

export function MissionFormModal({ isOpen, onClose, ficheId, mission, onSuccess }: MissionFormModalProps) {

  const queryClient                           = useQueryClient()
  const [openSection, setOpenSection]         = useState<1 | 2 | 3 | 4>(1)
  const [showConfirm, setShowConfirm]         = useState(false)
  const [apiError, setApiError]               = useState<string | null>(null)
  const [photosLocales, setPhotosLocales]     = useState<PhotoLocale[]>([])
  const [isUploading, setIsUploading]         = useState(false)
  // ID de la mission juste créée — pour uploader les photos après
  const missionCreeeRef                       = useRef<string | null>(null)

  const handleRequestClose = useCallback(() => setShowConfirm(true), [])
  const handleConfirmClose = useCallback(() => {
    setShowConfirm(false); setApiError(null); setPhotosLocales([])
    onClose()
  }, [onClose])
  const handleCancelClose = useCallback(() => setShowConfirm(false), [])

  const { data: ouvrages = [] } = useQuery({
    queryKey: ['ouvrages'], queryFn: () => ouvragesService.getAll(), enabled: isOpen,
  })

  // Upload photos APRÈS que la mission est créée avec succès
  const uploadPhotosApresCreation = useCallback(async (newMissionId: string) => {
    if (!photosLocales.length) return
    setIsUploading(true)
    try {
      await photosService.upload(ficheId, newMissionId, photosLocales.map(p => p.file))
      await queryClient.invalidateQueries({ queryKey: ['fiche', ficheId] })
    } catch {
      // Upload échoué → non bloquant, la réception est quand même créée
      setApiError("Réception enregistrée mais l'upload des photos a échoué. Vous pouvez les rajouter depuis la fiche.")
    } finally {
      setIsUploading(false)
    }
  }, [photosLocales, ficheId, queryClient])

  const handleSuccess = useCallback(async () => {
    setApiError(null)
    // Si des photos locales → uploader maintenant
    if (photosLocales.length > 0 && missionCreeeRef.current) {
      await uploadPhotosApresCreation(missionCreeeRef.current)
    }
    setPhotosLocales([])
    onSuccess()
  }, [photosLocales, uploadPhotosApresCreation, onSuccess])

  const {
    register, handleSubmit, errors, isSubmitting, isEditMode, watch, setValue,
  } = useMissionForm({
    ficheId, mission,
    onSuccess: handleSuccess,
    onClose,
    onError: (msg: string) => setApiError(msg),
    onMissionCreated: (id: string) => { missionCreeeRef.current = id },
  })

  const selectedTypeOuvrage = watch('typeOuvrage')
  const selectedResultat    = watch('resultat')
  const selectedProvenance  = watch('provenanceAppareil')
  const selectedZone        = watch('zone')
  const ecartSaisi          = watch('ecartMm')

  // Auto-calcul conformité depuis l'écart + tolérance
  useEffect(() => {
    if (selectedTypeOuvrage && ecartSaisi !== undefined && ecartSaisi !== '') {
      const tolerance = TOLERANCES_OUVRAGES[selectedTypeOuvrage]
      if (tolerance !== undefined) {
        const v = Math.abs(parseFloat(ecartSaisi as string))
        if (!isNaN(v)) {
          if (v > tolerance)          setValue('resultat', 'NON_CONFORME', { shouldValidate: true })
          else if (v > tolerance * 0.8) setValue('resultat', 'RESERVE',      { shouldValidate: true })
          else                         setValue('resultat', 'CONFORME',      { shouldValidate: true })
        }
      }
    }
  }, [ecartSaisi, selectedTypeOuvrage, setValue])

  // Auto-assign premier ouvrage
  useEffect(() => {
    if (ouvrages.length > 0 && !watch('ouvrageId')) {
      setValue('ouvrageId', ouvrages[0].id)
    }
  }, [ouvrages, setValue, watch])

  const axesDisponibles = selectedZone && AXES_PAR_ZONE[selectedZone]
    ? AXES_PAR_ZONE[selectedZone] : TOUS_LES_AXES

  const section1HasError = !!(errors.typeOuvrage || errors.categorieAssainissement || errors.partieOuvrage)
  const section2HasError = !!(errors.nature || errors.travailRealise)
  const section3HasError = !!(errors.resultat || errors.observations || errors.ficheReference)
  const toggleSection    = (s: 1 | 2 | 3 | 4) => setOpenSection(s)

  // Photos existantes en mode édition
  const photosExistantes = (mission as any)?.photos ?? []

  return (
    <Modal isOpen={isOpen} onClose={handleRequestClose}
      title={isEditMode ? 'Modifier la réception' : 'Nouvelle réception'} size="lg">
      <div className="relative">
        {showConfirm && <ConfirmCloseDialog onConfirm={handleConfirmClose} onCancel={handleCancelClose} />}

        <form onSubmit={handleSubmit} className="flex flex-col w-full overflow-x-hidden">
          {apiError && <ErrorBanner message={apiError} />}

          <div className="space-y-3 pb-4">

            {/* ══ §1 IDENTIFICATION ══ */}
            <SectionAccordeon titre="1. Identification de l'ouvrage" icone={MapPin}
              isOpen={openSection === 1} onToggle={() => toggleSection(1)} hasError={section1HasError}>

              <FormField label="Type d'ouvrage" error={errors.typeOuvrage?.message}>
                <select className={inputClass} {...register('typeOuvrage')}>
                  <option value="">Sélectionner le type...</option>
                  {TYPES_OUVRAGE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </FormField>

              {selectedTypeOuvrage === 'ASSAINISSEMENT' && (
                <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl animate-in zoom-in-95 fade-in duration-300">
                  <FormField label="Catégorie assainissement" required error={errors.categorieAssainissement?.message}>
                    <select className={errors.categorieAssainissement ? inputErrorClass : inputClass} {...register('categorieAssainissement')}>
                      <option value="">Préciser l'étape...</option>
                      {CATEGORIES_ASSAINISSEMENT.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </FormField>
                </div>
              )}

              <FormField label="Zone du stade">
                <div className="grid grid-cols-4 gap-2">
                  {ZONES_GSC.map(z => {
                    const [, , dir] = z.label.split(' ')
                    const code = z.value
                    return (
                      <button key={z.value} type="button"
                        onClick={() => { setValue('zone', z.value, { shouldValidate: true }); setValue('axe', '') }}
                        className={cn('h-14 rounded-xl border-2 font-bold text-sm transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5',
                          selectedZone === z.value ? 'bg-[#0D3B66] border-[#0D3B66] text-white shadow-sm'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-[#1B6B93] hover:text-[#1B6B93]')}>
                        <span className="text-base font-black">{code}</span>
                        <span className="text-[9px] font-normal opacity-70">{dir}</span>
                      </button>
                    )
                  })}
                </div>
                <input type="hidden" {...register('zone')} />
              </FormField>

              <FormField label="Sous-zone" hint="ex : Tribune inf.">
                <input type="text" placeholder="Optionnel" className={inputClass} {...register('sousZone')} />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Axe" hint={selectedZone ? `${selectedZone}1–${selectedZone}25` : 'A1–D25'}>
                  <select className={inputClass} {...register('axe')}>
                    <option value="">— Axe —</option>
                    {axesDisponibles.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Fil" hint="A à M">
                  <select className={inputClass} {...register('fil')}>
                    <option value="">— Fil —</option>
                    {FILS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </FormField>
              </div>

              <FormField label="Niveau / Étage">
                <select className={inputClass} {...register('niveau')}>
                  <option value="">Non renseigné</option>
                  {NIVEAUX_ETAGE.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </FormField>

              <FormField label="Partie d'ouvrage" required hint="description libre" error={errors.partieOuvrage?.message}>
                <input type="text" placeholder="ex: Crémaillère inf. Axe A14/A16 fil H/J"
                  className={errors.partieOuvrage ? inputErrorClass : inputClass} {...register('partieOuvrage')} />
              </FormField>

              <Button type="button" variant="secondary" size="md" onClick={() => setOpenSection(2)} className="w-full mt-3 font-bold">
                Passer à l'intervention →
              </Button>
            </SectionAccordeon>

            {/* ══ §2 INTERVENTION ══ */}
            <SectionAccordeon titre="2. Intervention" icone={Wrench}
              isOpen={openSection === 2} onToggle={() => toggleSection(2)} hasError={section2HasError}>

              <FormField label="Nature de l'intervention">
                <select className={inputClass} {...register('nature')}>
                  <option value="">Non renseignée</option>
                  {NATURES_INTERVENTION.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </FormField>

              <FormField label="Stade (collage / levée)">
                <select className={inputClass} {...register('stadeCollage')}>
                  <option value="">Non renseigné</option>
                  {STADES_COLLAGE.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </FormField>

              <FormField label="Appareil de mesure">
                <ToggleField options={PROVENANCES_APPAREIL} value={selectedProvenance ?? 'GEOCODING'}
                  onChange={v => setValue('provenanceAppareil', v, { shouldValidate: true })} />
                <input type="hidden" {...register('provenanceAppareil')} />
              </FormField>

              <FormField label="Nom / N° de l'appareil" hint="optionnel">
                <input type="text" placeholder="ex: Station Leica TS16 N°2" className={inputClass} {...register('nomAppareil')} />
              </FormField>

              <FormField label="Écart mesuré (mm)" hint="3 points">
                <input type="number" placeholder="ex: 12" className={inputClass} min={0} max={9999} step={1} {...register('ecartMm')} />
              </FormField>

              <FormField label="Travail réalisé">
                <textarea rows={3} placeholder="Décrivez le travail effectué..." className={textareaClass} {...register('travailRealise')} />
              </FormField>

              <div className="flex gap-2 mt-3">
                <Button type="button" variant="secondary" size="md" onClick={() => setOpenSection(1)} className="flex-1 font-bold">← Retour</Button>
                <Button type="button" variant="secondary" size="md" onClick={() => setOpenSection(3)} className="flex-1 font-bold">Suivant →</Button>
              </div>
            </SectionAccordeon>

            {/* ══ §3 RÉSULTAT ══ */}
            <SectionAccordeon titre="3. Résultat de la réception" icone={CheckCircle}
              isOpen={openSection === 3} onToggle={() => toggleSection(3)} hasError={section3HasError}>

              <FormField label="Résultat">
                <div className="grid grid-cols-3 gap-2">
                  {RESULTATS_CONTROLE.map(r => (
                    <label key={r.value} className="relative cursor-pointer">
                      <input type="radio" value={r.value} className="sr-only peer" {...register('resultat')} />
                      <div className={cn('flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all cursor-pointer min-h-[60px] border-gray-200 text-gray-500 hover:bg-gray-50',
                        r.value === 'CONFORME'     ? 'peer-checked:border-teal-500 peer-checked:bg-teal-50 peer-checked:text-teal-700'
                        : r.value === 'NON_CONFORME' ? 'peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700'
                                                     : 'peer-checked:border-orange-400 peer-checked:bg-orange-50 peer-checked:text-orange-700')}>
                        <span className="text-[15px] font-extrabold">{r.short}</span>
                        <span className="text-[10px] font-semibold uppercase mt-1 opacity-80">{r.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </FormField>

              {selectedResultat === 'NON_CONFORME' && (
                <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl animate-in zoom-in-95 fade-in duration-300">
                  <FormField label="Détail de la non-conformité">
                    <textarea rows={2} placeholder="Nature de l'écart, cause probable, action demandée..."
                      className={`${textareaClass} border-red-200 focus:border-red-400`} {...register('observationsNc')} />
                  </FormField>
                </div>
              )}

              <FormField label="Référence fiche papier" hint="optionnel">
                <input type="text" placeholder="ex: F-TOPO-012" className={inputClass} {...register('ficheReference')} />
              </FormField>

              <FormField label="Observations">
                <textarea rows={3} placeholder="Remarques, réserves, suite à donner..." className={textareaClass} maxLength={500} {...register('observations')} />
              </FormField>

              <div className="flex gap-2 mt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setOpenSection(2)} className="w-auto font-bold">← Retour</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setOpenSection(4)} className="flex-1 font-bold">Photos →</Button>
              </div>
            </SectionAccordeon>

            {/* ══ §4 PHOTOS ══ */}
            <SectionAccordeon
              titre={`4. Photos${photosLocales.length > 0 ? ` (${photosLocales.length})` : ' — optionnel'}`}
              icone={Camera}
              isOpen={openSection === 4}
              onToggle={() => toggleSection(4)}
            >
              <p className="text-xs text-gray-400 leading-relaxed">
                1 à 3 photos par réception. Optionnel — vous pouvez en ajouter après l'enregistrement.
                La compression est automatique.
              </p>

              <PhotosSection
                photosExistantes={photosExistantes}
                onPhotosChange={setPhotosLocales}
                onDeleteExistante={isEditMode ? async (photoId) => {
                  try {
                    await photosService.delete(ficheId, mission!.id, photoId)
                    await queryClient.invalidateQueries({ queryKey: ['fiche', ficheId] })
                  } catch {
                    setApiError("Impossible de supprimer la photo.")
                  }
                } : undefined}
                isUploading={isUploading}
                maxPhotos={3}
              />

              <Button type="button" variant="secondary" size="sm" onClick={() => setOpenSection(3)} className="w-auto font-bold mt-2">
                ← Retour
              </Button>
            </SectionAccordeon>

          </div>

          {/* ── BOUTONS SOUMISSION ─── */}
          <div className="sticky bottom-0 bg-white pt-3 pb-2 border-t-2 border-gray-100 flex gap-3 z-10">
            <Button type="button" variant="secondary" size="lg" onClick={handleRequestClose} className="flex-[1] font-bold">
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="lg"
              loading={isSubmitting || isUploading}
              className="flex-[2] font-bold shadow-lg shadow-blue-900/20">
              {isSubmitting   ? 'Enregistrement...'
               : isUploading  ? 'Upload photos...'
               : isEditMode   ? 'Mettre à jour'
               :                'Soumettre la réception'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}