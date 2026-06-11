/**
 * @file LoginPage.tsx
 * @description Page de connexion — première page vue par l'utilisateur.
 *
 * DESIGN :
 * → Fond Navy #0D3B66 (charte GEOCODING)
 * → Card blanche centrée avec logo + formulaire
 * → Mobile-first — parfait sur smartphone au chantier
 *
 * FLUX :
 * 1. Utilisateur saisit email + password
 * 2. Clic "Se connecter" → appel POST /auth/login
 * 3. Succès → token stocké → redirection selon rôle
 * 4. Erreur → message d'erreur affiché
 *
 * BIBLIOTHÈQUES UTILISÉES :
 * → react-hook-form : gestion du formulaire (validation, état)
 * → zod : schéma de validation des champs
 * → @hookform/resolvers : connecte zod à react-hook-form
 * → react-hot-toast : notification de succès/erreur
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Mail, Lock, HardHat } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../hooks/useAuth'

// ─── SCHÉMA DE VALIDATION ─────────────────────────────────────────
/**
 * Zod définit les règles de validation du formulaire.
 *
 * POURQUOI ZOD ?
 * → Validation TypeScript-first
 * → Messages d'erreur personnalisés en français
 * → Intégration native avec react-hook-form
 *
 * z.object() → définit la forme attendue du formulaire
 * z.string().email() → valide le format email
 * z.string().min(6) → minimum 6 caractères
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est obligatoire')
    .email('Format email invalide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est obligatoire')
    .min(6, 'Minimum 6 caractères')
})

/**
 * Type inféré depuis le schéma Zod.
 * TypeScript connaît automatiquement la forme du formulaire.
 * Pas besoin de redéclarer l'interface manuellement.
 */
type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  /**
   * useState pour gérer l'erreur globale du formulaire.
   * Ex: "Email ou mot de passe incorrect" (erreur 401 du serveur).
   * Différent des erreurs de validation Zod qui sont par champ.
   */
  const [serverError, setServerError] = useState<string | null>(null)

  /**
   * useForm → hook principal de react-hook-form.
   *
   * register → connecte un champ au formulaire
   * handleSubmit → wrapper qui valide avant d'appeler notre fonction
   * formState.errors → erreurs de validation par champ
   * formState.isSubmitting → true pendant la soumission (pour le loader)
   *
   * zodResolver(loginSchema) → utilise notre schéma Zod pour valider
   */
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  /**
   * onSubmit → appelé par handleSubmit APRÈS validation Zod réussie.
   * Si la validation échoue, cette fonction n'est pas appelée.
   *
   * @param data - données validées { email, password }
   */
  const onSubmit = async (data: LoginFormData) => {
    // Réinitialise l'erreur serveur à chaque tentative
    setServerError(null)

    try {
      // Appel au store Zustand qui appelle le service auth
      await login(data.email, data.password)

      // Succès → notification + redirection
      toast.success('Connexion réussie !')

      // La redirection est gérée par PublicRoute dans le router
      // mais on force quand même pour être sûr
      navigate('/')

    } catch (error: unknown) {
      // Erreur → affiche le message approprié
      // On vérifie si c'est une erreur Axios avec une réponse
      const axiosError = error as {
        response?: { status: number; data?: { message?: string } }
      }

      if (axiosError.response?.status === 401) {
        // 401 = mauvais credentials (message volontairement vague
        // pour ne pas révéler si l'email existe)
        setServerError('Email ou mot de passe incorrect')
      } else {
        setServerError('Erreur de connexion. Réessayez.')
      }
    }
  }

  return (
    /**
     * min-h-screen → prend toute la hauteur de l'écran
     * bg-[#0D3B66] → fond Navy GEOCODING
     * flex items-center justify-center → centre la card
     */
    <div className="min-h-screen bg-[#0D3B66] flex flex-col items-center justify-center p-4">

      {/* ── CARD DE LOGIN ────────────────────────────────────────── */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* En-tête coloré avec logo */}
        <div className="bg-[#0D3B66] px-6 pt-8 pb-6 text-center">

          {/* Icône casque de chantier */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1B6B93] rounded-2xl mb-4 shadow-lg">
            <HardHat size={32} className="text-white" />
          </div>

          {/* Nom de l'application */}
          <h1 className="text-2xl font-bold text-white">
            GeoGSC
            <span className="text-[#00897B]"> Monitoring</span>
          </h1>

          {/* Sous-titre */}
          <p className="text-blue-200 text-sm mt-1">
            Grand Stade de Casablanca
          </p>

          {/* Contexte projet */}
          <p className="text-blue-300 text-xs mt-0.5">
            GEOCODING × ANEP — Marché 05/2025
          </p>
        </div>

        {/* ── FORMULAIRE ───────────────────────────────────────────── */}
        <div className="px-6 py-6">

          {/* Titre de la section */}
          <h2 className="text-lg font-semibold text-gray-800 mb-5">
            Connexion
          </h2>

          {/**
           * handleSubmit(onSubmit) :
           * 1. Intercepte le submit natif du formulaire
           * 2. Valide avec Zod
           * 3. Si valide → appelle onSubmit(data)
           * 4. Si invalide → met à jour errors sans appeler onSubmit
           */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* Champ email */}
            <Input
              label="Adresse email"
              type="email"
              placeholder="prenom.nom@geocoding.ma"
              autoComplete="email"
              required
              leftIcon={<Mail size={18} />}
              error={errors.email?.message}
              /**
               * ...register('email') :
               * Connecte le champ au formulaire.
               * Injecte : name, ref, onChange, onBlur
               * pour que react-hook-form suive la valeur.
               */
              {...register('email')}
            />

            {/* Champ mot de passe */}
            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              leftIcon={<Lock size={18} />}
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Erreur serveur (401, réseau...) */}
            {serverError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600 text-center">
                  {serverError}
                </p>
              </div>
            )}

            {/* Bouton de connexion */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="mt-2"
            >
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </div>

        {/* Footer de la card */}
        <div className="px-6 pb-4 text-center">
          <p className="text-xs text-gray-400">
            Application réservée au personnel GEOCODING
          </p>
        </div>
      </div>

      {/* Mention légale sous la card */}
      <p className="mt-6 text-blue-200 text-xs text-center">
        © 2026 GEOCODING S.A.R.L — Tous droits réservés
      </p>
    </div>
  )
}