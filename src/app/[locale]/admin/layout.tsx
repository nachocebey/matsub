import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard, MapPin, Calendar, Users, Package, Waves, BookOpen } from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/spots', label: 'Spots', icon: MapPin },
  { href: '/admin/cursos', label: 'Cursos', icon: BookOpen },
  { href: '/admin/trips', label: 'Sortides', icon: Calendar },
  { href: '/admin/bookings', label: 'Reserves', icon: Users },
  { href: '/admin/equipment', label: 'Equipament', icon: Package },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  return (
    <div className="pt-16 min-h-screen bg-ocean-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 min-h-[calc(100vh-4rem)] bg-white border-r border-ocean-100 p-4 fixed left-0 top-16">
          <div className="flex items-center gap-2 px-2 py-3 mb-4">
            <Waves className="h-5 w-5 text-ocean-600" />
            <span className="font-bold text-ocean-950">Admin MATSUB</span>
          </div>
          <nav className="space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ocean-700 hover:bg-ocean-50 hover:text-ocean-900 transition-colors"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-4 border-t border-ocean-100">
            <Link href="/dashboard" className="flex items-center gap-2 text-xs text-ocean-400 hover:text-ocean-600 px-3 py-2">
              ← Tornar al dashboard
            </Link>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="lg:hidden w-full bg-white border-b border-ocean-100 px-4 py-2 flex gap-1 overflow-x-auto">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-ocean-700 hover:bg-ocean-50 whitespace-nowrap"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 lg:ml-60 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
