export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DifficultyBadge } from '@/components/ui/DifficultyBadge'
import { TripCard } from '@/components/ui/TripCard'
import { MapPin, ArrowLeft, Waves, Anchor } from 'lucide-react'
import type { Spot, TripWithAvailability } from '@/types'
import { getTranslations, getLocale } from 'next-intl/server'
import { getI18n } from '@/lib/utils'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: spot } = await supabase
    .from('spots')
    .select('name, description')
    .eq('slug', params.slug)
    .single()

  if (!spot) return { title: 'Spot no trobat' }
  return {
    title: spot.name,
    description: spot.description ?? undefined,
  }
}

export default async function SpotDetailPage({ params }: Props) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const t = await getTranslations('spots')

  const [spotRes, tripsRes] = await Promise.all([
    supabase.from('spots').select('*').eq('slug', params.slug).single(),
    supabase
      .from('trips_with_availability')
      .select('*')
      .eq('spot_slug', params.slug)
      .eq('status', 'active')
      .gte('date', today)
      .order('date', { ascending: true }),
  ])

  if (!spotRes.data) notFound()

  const spot = spotRes.data as Spot
  const trips = (tripsRes.data ?? []) as TripWithAvailability[]
  const locale = await getLocale()
  const spotName = getI18n(spot.name_i18n, locale, spot.name)
  const spotDesc = getI18n(spot.description_i18n, locale, spot.description ?? '')

  return (
    <div className="pt-16">
      {/* Header */}
      <div className="bg-ocean-950 text-white py-16">
        <div className="container-main">
          <Link href="/spots" className="inline-flex items-center gap-1.5 text-ocean-400 hover:text-ocean-300 text-sm mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('allSpots')}
          </Link>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <DifficultyBadge difficulty={spot.difficulty} />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">{spotName}</h1>
              {spotDesc && (
                <p className="text-ocean-300 text-lg leading-relaxed">{spotDesc}</p>
              )}

              <div className="flex flex-wrap gap-6 mt-8 text-sm">
                {spot.depth_max && (
                  <div className="flex items-center gap-2 text-ocean-300">
                    <Anchor className="h-4 w-4 text-ocean-400" />
                    <span>{t('depth', { min: spot.depth_min ?? 0, max: spot.depth_max })}</span>
                  </div>
                )}
                {spot.lat && spot.lng && (
                  <div className="flex items-center gap-2 text-ocean-300">
                    <MapPin className="h-4 w-4 text-ocean-400" />
                    <span>{spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Image */}
            <div className="rounded-2xl overflow-hidden bg-ocean-900 h-64 lg:h-80 flex items-center justify-center">
              {spot.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={spot.images[0]} alt={spotName} className="w-full h-full object-cover" />
              ) : (
                <Waves className="h-20 w-20 text-ocean-700" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming trips at this spot */}
      <div className="container-main py-16">
        <h2 className="text-2xl font-bold text-ocean-950 mb-8">
          {t('upcomingTrips', { name: spotName })}
        </h2>

        {trips.length === 0 ? (
          <div className="card p-12 text-center text-ocean-500">
            <Waves className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-2">{t('noTrips')}</p>
            <p className="text-sm">{t('noTripsDesc')}</p>
            <div className="flex justify-center gap-3 mt-6">
              <Link href="/calendario" className="btn-primary">{t('viewCalendar')}</Link>
              <Link href="/contacto" className="btn-secondary">{t('contactUs')}</Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
