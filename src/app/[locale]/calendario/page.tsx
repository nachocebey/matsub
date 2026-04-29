export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CalendarClient } from './CalendarClient'
import type { TripWithAvailability } from '@/types'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = { title: 'Calendari de sortides' }

export default async function CalendarioPage() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const t = await getTranslations('calendar')

  const [{ data }, { data: { user } }] = await Promise.all([
    supabase
      .from('trips_with_availability')
      .select('*')
      .eq('status', 'active')
      .gte('date', today)
      .order('date', { ascending: true }),
    supabase.auth.getUser(),
  ])

  const trips = (data ?? []) as TripWithAvailability[]

  let bookedTripIds: string[] = []
  if (user) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('trip_id')
      .eq('user_id', user.id)
      .neq('status', 'cancelled')
    bookedTripIds = (bookings ?? []).map(b => b.trip_id)
  }

  return (
    <div className="pt-16">
      <div className="bg-ocean-950 text-white py-16">
        <div className="container-main">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{t('title')}</h1>
          <p className="text-ocean-300 text-lg max-w-2xl">
            {t('subtitle')}
          </p>
        </div>
      </div>
      <CalendarClient trips={trips} bookedTripIds={bookedTripIds} />
    </div>
  )
}
