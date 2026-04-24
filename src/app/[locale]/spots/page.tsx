export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DifficultyBadge } from '@/components/ui/DifficultyBadge'
import { MapPin, Waves } from 'lucide-react'
import type { Spot } from '@/types'
import { getTranslations, getLocale } from 'next-intl/server'
import { getI18n } from '@/lib/utils'

export const metadata: Metadata = { title: 'Spots de busseig' }

export default async function SpotsPage() {
  const supabase = createClient()
  const { data: spots } = await supabase
    .from('spots')
    .select('*')
    .eq('visible', true)
    .order('name', { ascending: true })

  const spotsList = (spots ?? []) as Spot[]
  const [t, locale] = await Promise.all([getTranslations('spots'), getLocale()])

  return (
    <div className="pt-16">
      {/* Header */}
      <div className="bg-ocean-950 text-white py-20">
        <div className="container-main">
          <div className="flex items-center gap-2 text-ocean-400 text-sm font-medium mb-4">
            <Waves className="h-4 w-4" />
            {t('title')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            {t('ourSpots')}
          </h1>
          <p className="text-ocean-300 text-lg max-w-2xl leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Spots grid */}
      <div className="container-main py-16">
        {spotsList.length === 0 ? (
          <div className="text-center py-20 text-ocean-500">
            <Waves className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>{t('empty')}</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {spotsList.map(spot => (
              <Link
                key={spot.id}
                href={`/spots/${spot.slug}`}
                className="card overflow-hidden group hover:shadow-lg transition-shadow"
              >
                {/* Image placeholder */}
                <div className="h-48 bg-gradient-to-br from-ocean-700 to-ocean-900 flex items-center justify-center">
                  {spot.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={spot.images[0]}
                      alt={getI18n(spot.name_i18n, locale, spot.name)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Waves className="h-16 w-16 text-ocean-500" />
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="font-semibold text-ocean-950 group-hover:text-ocean-600 transition-colors text-lg">
                      {getI18n(spot.name_i18n, locale, spot.name)}
                    </h2>
                    <DifficultyBadge difficulty={spot.difficulty} />
                  </div>

                  {getI18n(spot.description_i18n, locale, spot.description ?? '') && (
                    <p className="text-sm text-ocean-600 leading-relaxed line-clamp-3 mb-4">
                      {getI18n(spot.description_i18n, locale, spot.description ?? '')}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-ocean-500">
                    {spot.depth_max && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {t('depth', { min: spot.depth_min ?? 0, max: spot.depth_max })}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
