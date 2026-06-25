/**
 * @file BottomNav.tsx
 * @description Navigation mobile bas d'écran — Brigade uniquement.
 * 4 onglets fixes : Fiches / Galerie / Messagerie / Profil
 */

import { NavLink } from 'react-router-dom'
import { FileText, Image, MessageSquare, UserCircle, Send } from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import { cn } from '../../lib/utils'

export function BottomNav() {
  const { user } = useAuthStore()

  // Visible uniquement sur mobile et pour les brigades
  if (!user || user.role !== 'BRIGADE') return null

  const items = [
    { to: '/fiches',     icon: FileText,       label: 'Fiches'     },
    { to: '/galerie',    icon: Image,          label: 'Photos'     },
    { to: '/demandes',   icon: Send,           label: 'Demandes'   },
    { to: '/messagerie', icon: MessageSquare,  label: 'Messages'   },
    { to: '/profil',     icon: UserCircle,     label: 'Profil'     },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-40 safe-area-bottom">
      <div className="flex items-stretch h-16">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
              isActive ? 'text-[#0D3B66]' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn(
                  'text-[10px] font-semibold leading-none',
                  isActive ? 'text-[#0D3B66]' : 'text-gray-400'
                )}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}