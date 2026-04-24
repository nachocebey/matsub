export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookingForm } from './BookingForm'
import type { TripWithAvailability, Profile } from '@/types'
import { getTranslations, getLocale } from 'next-intl/server'
import { getI18n } from '@/lib/utils'

export const metadata: Metadata = { title: 'Reservar plaça' }

export default async function ReservaPage({
  searchParams,
}: {
  searchParams: { trip?: string }
}) {
  const supabase = createClient()
  const tripId = searchParams.trip
  if (!tripId) redirect('/calendario')

  const [t, locale] = await Promise.all([getTranslations('booking'), getLocale()])

  const { data: { user } } = await supabase.auth.getUser()

  const [tripRes, profileRes, existingRes] = await Promise.all([
    supabase
      .from('trips_with_availability')
      .select('*')
      .eq('id', tripId)
      .single(),
    user
      ? supabase.from('profiles').select('*').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from('bookings')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('trip_id', tripId)
          .single()
      : Promise.resolve({ data: null }),
  ])

  if (!tripRes.data) redirect('/calendario')

  return (
    <div className="pt-16">
      <div className="bg-ocean-950 text-white py-12">
        <div className="container-main">
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-ocean-400">{getI18n(tripRes.data.title_i18n, locale, tripRes.data.title)}</p>
        </div>
      </div>
      <div className="container-main py-12 max-w-2xl">
        <BookingForm
          trip={tripRes.data as TripWithAvailability}
          profile={profileRes.data as Profile | null}
          existingBooking={existingRes.data}
        />
      </div>
    </div>
  )
}
