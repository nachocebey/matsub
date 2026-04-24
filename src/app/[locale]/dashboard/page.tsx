export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserDashboard } from './UserDashboard'
import type { BookingWithDetails, Profile } from '@/types'

export const metadata: Metadata = { title: 'Les meves reserves' }

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/dashboard')

  const [profileRes, bookingsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('bookings')
      .select(`
        *,
        trip:trips_with_availability(*),
        equipment_bookings(*, equipment(*))
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  // If the profile trigger didn't fire (e.g. user created before trigger), create it now
  let profile = profileRes.data as Profile | null
  if (!profile) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({ id: user.id, full_name: user.user_metadata?.full_name ?? '', owned_equipment: [] })
      .select()
      .single()
    profile = newProfile as Profile | null
  }

  if (!profile) redirect('/auth/login')

  return (
    <UserDashboard
      profile={profile}
      bookings={(bookingsRes.data ?? []) as BookingWithDetails[]}
    />
  )
}
