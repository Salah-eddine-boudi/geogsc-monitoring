/**
 * @file BottomNav.tsx
 * @description Navigation mobile — barre fixe en bas de l'écran.
 */

import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  ClipboardList
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  roles: string[]
}

export function BottomNav() {
  const { user } = useAuth()

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
      // ✅ Item CP — visible seulement pour BRIGADE
      to: '/cp',
      icon: ClipboardList,
      label: 'CP',
      roles: ['BRIGADE']
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

  const visibleItems = navItems.filter(
    item => user && item.roles.includes(user.role)
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-lg pb-safe">
      <div className="flex items-stretch">
        {visibleItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex-1 flex flex-col items-center justify-center py-2 gap-1
                transition-colors duration-150
                ${isActive
                  ? 'text-[#0D3B66]'
                  : 'text-gray-400 hover:text-gray-600'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <div className={`
                    p-1.5 rounded-xl transition-all duration-150
                    ${isActive ? 'bg-[#D9EAF5]' : ''}
                  `}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  </div>
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