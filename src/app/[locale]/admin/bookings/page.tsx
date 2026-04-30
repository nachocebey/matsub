export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { BookingsManager } from './BookingsManager'

export default async function AdminBookingsPage() {
  const supabase = createClient()
  const [bookingsRes, tripsRes] = await Promise.all([
    supabase
      .from('bookings')
      .select(`
        *,
        trip:trips(title, title_i18n, date, time, max_participants, type),
        profile:profiles(full_name, phone, certification_level)
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('trips')
      .select('id, title, title_i18n, date, time, type, max_participants')
      .eq('status', 'active')
      .order('date'),
  ])

  return <BookingsManager bookings={bookingsRes.data ?? []} trips={tripsRes.data ?? []} />
}
