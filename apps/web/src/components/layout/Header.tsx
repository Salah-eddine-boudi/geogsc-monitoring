/**
 * @file Header.tsx
 * @description Barre de navigation supérieure — logo GEOCODING + user info.

 */

import { LogOut, Wifi, WifiOff, HardHat } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

export function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  
  const [isOnline, setIsOnline] = useState(navigator.onLine)

 
  useEffect(() => {
    // Fonctions qui mettent à jour l'état réseau
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Écoute les événements natifs du navigateur
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup — supprime les écouteurs quand le composant est démonté
    // Évite les memory leaks
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, []) 

  const handleLogout = () => {
    logout()
    navigate('/login')
  }


  const getRoleLabel = () => {
    switch (user?.role) {
      case 'BRIGADE': return 'Brigade terrain'
      case 'IGT': return 'Ingénieur Géomètre'
      case 'ADMIN': return 'Administrateur'
      default: return ''
    }
  }

  return (
    <header className="bg-[#0D3B66] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* ── LOGO + TITRE ──────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Icône casque de chantier — représente le terrain */}
          <div className="bg-[#1B6B93] p-2 rounded-xl">
            <HardHat size={20} className="text-white" />
          </div>

          <div>
            {/* Nom de l'application */}
            <div className="font-bold text-sm leading-none">
              GeoGSC
              <span className="text-[#00897B]"> Monitoring</span>
            </div>

            {/* Sous-titre — caché sur mobile pour gagner de la place */}
            <div className="text-xs text-blue-200 hidden sm:block leading-none mt-0.5">
              Grand Stade de Casablanca
            </div>
          </div>
        </div>

        {/* ── PARTIE DROITE ─────────────────────────────────────── */}
        <div className="flex items-center gap-3">

          {/* Indicateur réseau online/offline */}
          <div className={`
            flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
            ${isOnline
              ? 'bg-teal-500/20 text-teal-200'
              : 'bg-red-500/20 text-red-200'
            }
          `}>
            {isOnline
              ? <Wifi size={12} />
              : <WifiOff size={12} />
            }
            {/* Texte caché sur mobile */}
            <span className="hidden sm:inline">
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>

          {/* Infos utilisateur — caché sur mobile */}
          {user && (
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold leading-none">
                {user.prenom} {user.nom}
              </div>
              <div className="text-xs text-blue-200 leading-none mt-0.5">
                {getRoleLabel()}
              </div>
            </div>
          )}

          {/* Bouton déconnexion */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            title="Se déconnecter"
            aria-label="Se déconnecter"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}