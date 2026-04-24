export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Users, Calendar, Package, CheckCircle } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function AdminDashboardPage() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const t = await getTranslations('admin')

  const [usersRes, tripsRes, bookingsRes, equipmentRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('trips').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('date', today),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('equipment').select('id', { count: 'exact', head: true }).eq('status', 'available'),
  ])

  const stats = [
    { label: t('stats.users'), value: usersRes.count ?? 0, icon: Users, color: 'bg-ocean-100 text-ocean-600' },
    { label: t('stats.activeTrips'), value: tripsRes.count ?? 0, icon: Calendar, color: 'bg-green-100 text-green-600' },
    { label: t('stats.confirmedBookings'), value: bookingsRes.count ?? 0, icon: CheckCircle, color: 'bg-yellow-100 text-yellow-600' },
    { label: t('stats.availableEquipment'), value: equipmentRes.count ?? 0, icon: Package, color: 'bg-purple-100 text-purple-600' },
  ]

  // Recent bookings
  const { data: recentBookings } = await supabase
    .from('bookings')
    .select('*, trip:trips(title, date), profile:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div>
      <h1 className="text-2xl font-bold text-ocean-950 mb-8">{t('title')}</h1>

      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ocean-950">{value}</p>
              <p className="text-xs text-ocean-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-ocean-100">
          <h2 className="font-semibold text-ocean-950">{t('recentBookings')}</h2>
        </div>
        <div className="divide-y divide-ocean-50">
          {(recentBookings ?? []).length === 0 ? (
            <p className="text-center text-ocean-400 py-8 text-sm">{t('noBookings')}</p>
          ) : (
            recentBookings!.map((b: { id: string; status: string; profile?: { full_name: string }; trip?: { title: string; date: string } }) => (
              <div key={b.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-ocean-950 text-sm">{b.profile?.full_name}</p>
                  <p className="text-xs text-ocean-500">{b.trip?.title} · {b.trip?.date}</p>
                </div>
                <span className={`badge ${
                  b.status === 'confirmed' ? 'badge-green' :
                  b.status === 'pending' ? 'badge-yellow' : 'badge-red'
                }`}>
                  {b.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
