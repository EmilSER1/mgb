
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Home, Users, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Главная',
      href: '/',
      icon: Home,
    },
    {
      name: 'Проектировщики',
      href: '/floors',
      icon: Building2,
    },
    {
      name: 'Турар',
      href: '/turar',
      icon: Users,
    },
    {
      name: 'Таблица соединения',
      href: '/connections',
      icon: Database,
    },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
              <Building2 className="w-6 h-6" />
              МГБ
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname?.startsWith(item.href))
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-blue-100 text-blue-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
            <Building2 className="w-4 h-4" />
            Проектировщики
          </div>
        </div>
      </div>
    </nav>
  )
}
