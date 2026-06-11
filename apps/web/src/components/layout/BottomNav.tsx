/**
 * @file BottomNav.tsx
 * @description Navigation mobile — barre fixe en bas de l'écran.
 *
 */

import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Users
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

/**
 * Définition d'un item de navigation.
 * Interface TypeScript pour typer le tableau navItems.
 */
interface NavItem {
  to: string           // route React Router
  icon: React.ElementType // composant icône Lucide
  label: string        // texte sous l'icône
  roles: string[]      // rôles autorisés à voir cet item
}

export function BottomNav() {
  const { user } = useAuth()

  /**
   * Tous les items de navigation possibles.
   * Filtrés selon le rôle de l'utilisateur connecté.
   */
  const navItems: NavItem[] = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      roles: ['IGT', 'ADMIN']
    },
    {
      to: '/fiches',
      icon: FileText,
      label: 'Fiches',
      roles: ['BRIGADE', 'IGT', 'ADMIN']
    },
    {
      to: '/rapports',
      icon: BarChart3,
      label: 'Rapports',
      roles: ['IGT', 'ADMIN']
    },
    {
      to: '/brigades',
      icon: Users,
      label: 'Brigades',
      roles: ['ADMIN']
    }
  ]

  /**
   * Filtre les items selon le rôle de l'utilisateur.
   * Un brigadier ne voit pas le dashboard IGT par exemple.
   */
  const visibleItems = navItems.filter(
    item => user && item.roles.includes(user.role)
  )

  return (
    /**
     * fixed bottom-0 → collé en bas de l'écran
     * md:hidden → disparaît sur desktop (≥ 768px)
     * safe-area → respecte les encoches iOS (iPhone X+)
     */
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-lg pb-safe">
      <div className="flex items-stretch">
        {visibleItems.map((item) => {
          const Icon = item.icon

          return (
            /**
             * NavLink → comme <Link> mais ajoute automatiquement
             * la classe "active" quand la route correspond.
             * On utilise cette classe pour styliser l'item actif.
             */
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex-1 flex flex-col items-center justify-center py-2 gap-1
                transition-colors duration-150
                ${isActive
                  ? 'text-[#0D3B66]'           // Navy quand actif
                  : 'text-gray-400 hover:text-gray-600'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  {/* Fond coloré sous l'icône quand actif */}
                  <div className={`
                    p-1.5 rounded-xl transition-all duration-150
                    ${isActive ? 'bg-[#D9EAF5]' : ''}
                  `}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  </div>

                  {/* Label sous l'icône */}
                  <span className={`
                    text-xs font-medium
                    ${isActive ? 'font-semibold' : ''}
                  `}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}