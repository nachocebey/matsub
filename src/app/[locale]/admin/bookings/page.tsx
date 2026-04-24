export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { BookingsManager } from './BookingsManager'

export default async function AdminBookingsPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('bookings')
    .select(`
      *,
      trip:trips(title, title_i18n, date, time),
      profile:profiles(full_name, phone, certification_level)
    `)
    .order('created_at', { ascending: false })

  return <BookingsManager bookings={data ?? []} />
}
