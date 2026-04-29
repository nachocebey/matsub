'use client'

import Link from 'next/link'
import { Calendar, Clock, Users, Euro, MapPin } from 'lucide-react'
import { formatDate, formatTime, formatPrice, formatDuration, TRIP_TYPE_LABELS, getI18n } from '@/lib/utils'
import { DifficultyBadge } from './DifficultyBadge'
import { cn } from '@/lib/utils'
import type { TripWithAvailability } from '@/types'
import { useTranslations, useLocale } from 'next-intl'

interface TripCardProps {
  trip: TripWithAvailability
  compact?: boolean
  isBooked?: boolean
}

export function TripCard({ trip, compact = false, isBooked = false }: TripCardProps) {
  const t = useTranslations('common')
  const locale = useLocale()
  const isFull = trip.available_spots <= 0
  const isAlmostFull = trip.available_spots <= 2 && trip.available_spots > 0

  return (
    <div className={cn('card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow', compact && 'p-4 gap-3')}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <span className={cn(
            'badge',
            trip.type === 'dive' ? 'bg-ocean-100 text-ocean-700' : 'bg-sand-100 text-sand-700'
          )}>
            {TRIP_TYPE_LABELS[trip.type]}
          </span>
          {trip.difficulty_level && (
            <DifficultyBadge difficulty={trip.difficulty_level} />
          )}
        </div>
        {isBooked ? (
          <span className="badge bg-green-100 text-green-700">✓ Apuntado</span>
        ) : isFull ? (
          <span className="badge badge-red">{t('full')}</span>
        ) : isAlmostFull ? (
          <span className="badge badge-yellow">{t('almostFull')}</span>
        ) : null}
      </div>

      {/* Title */}
      <div>
        <h3 className={cn('font-semibold text-ocean-950', compact ? 'text-sm' : 'text-base')}>
          {getI18n(trip.title_i18n, locale, trip.title)}
        </h3>
        {trip.spot_name && (
          <div className="flex items-center gap-1 mt-1 text-ocean-500 text-xs">
            <MapPin className="h-3 w-3" />
            {trip.spot_name}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className={cn('grid gap-2 text-sm text-ocean-600', compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-2')}>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-ocean-400" />
          <span className="text-xs">{formatDate(trip.date, locale)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-ocean-400" />
          <span className="text-xs">{formatTime(trip.time)} · {formatDuration(trip.duration_minutes)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-ocean-400" />
          <span className="text-xs">
            {isFull ? t('noSpots') : t('spotsLeft', { count: trip.available_spots })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Euro className="h-3.5 w-3.5 text-ocean-400" />
          <span className="text-xs font-semibold text-ocean-800">{formatPrice(trip.price)}</span>
        </div>
      </div>

      {/* CTA */}
      {!compact && (
        <Link
          href={`/reserva?trip=${trip.id}`}
          className={cn(
            'btn-primary w-full mt-auto',
            isFull && 'opacity-50 pointer-events-none'
          )}
        >
          {isFull ? t('full') : t('bookNow')}
        </Link>
      )}
    </div>
  )
}
