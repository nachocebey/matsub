'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDate, formatTime, formatPrice, BOOKING_STATUS_LABELS, CERTIFICATION_LABELS, getI18n } from '@/lib/utils'
import { DifficultyBadge } from '@/components/ui/DifficultyBadge'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import { Calendar, Clock, Euro, User, Package, ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BookingWithDetails, BookingStatus, Profile } from '@/types'
import { useTranslations, useLocale } from 'next-intl'

interface Props {
  profile: Profile
  bookings: BookingWithDetails[]
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'badge-yellow',
  confirmed: 'badge-green',
  cancelled: 'badge-red',
}

export function UserDashboard({ profile, bookings: initialBookings }: Props) {
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const supabase = createClient()
  const [bookings, setBookings] = useState(initialBookings)
  const [filter, setFilter] = useState<'all' | BookingStatus>('all')
  const [cancelling, setCancelling] = useState<string | null>(null)

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter)

  const handleCancel = async (bookingId: string) => {
    if (!confirm(t('bookings.cancelConfirm'))) return
    setCancelling(bookingId)

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)

    if (error) {
      toast.error(t('bookings.cancelError'))
    } else {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
      toast.success(t('bookings.cancelled'))
    }
    setCancelling(null)
  }

  const upcoming = bookings.filter(b =>
    b.status !== 'cancelled' && new Date(b.trip?.date) >= new Date()
  ).length

  return (
    <div className="pt-16">
      {/* Header */}
      <div className="bg-ocean-950 text-white py-12">
        <div className="container-main">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">
                {t('greeting', { name: profile.full_name.split(' ')[0] })}
              </h1>
              <p className="text-ocean-400">{profile.is_admin ? t('admin') : CERTIFICATION_LABELS[profile.certification_level]}</p>
            </div>
            {profile.is_admin && (
              <Link href="/admin" className="btn-secondary border-ocean-700 bg-ocean-900 text-ocean-200 hover:bg-ocean-800">
                {t('adminPanel')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
            <div className="rounded-xl bg-ocean-900 p-4">
              <p className="text-ocean-400 text-xs font-medium mb-1">{t('stats.totalBookings')}</p>
              <p className="text-2xl font-bold">{bookings.length}</p>
            </div>
            <div className="rounded-xl bg-ocean-900 p-4">
              <p className="text-ocean-400 text-xs font-medium mb-1">{t('stats.upcomingTrips')}</p>
              <p className="text-2xl font-bold">{upcoming}</p>
            </div>
            <div className="rounded-xl bg-ocean-900 p-4 col-span-2 sm:col-span-1">
              <p className="text-ocean-400 text-xs font-medium mb-1 flex items-center gap-1">
                <User className="h-3 w-3" /> {t('stats.certification')}
              </p>
              <p className="font-semibold text-sm mt-1">{CERTIFICATION_LABELS[profile.certification_level]}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-main py-12">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <h2 className="text-xl font-bold text-ocean-950 mr-2">{t('bookings.title')}</h2>
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                filter === f
                  ? 'bg-ocean-600 text-white border-ocean-600'
                  : 'bg-white text-ocean-600 border-ocean-200 hover:border-ocean-400'
              )}
            >
              {f === 'all' ? t('bookings.all') : BOOKING_STATUS_LABELS[f]}
              {f === 'all' ? ` (${bookings.length})` : ` (${bookings.filter(b => b.status === f).length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card p-12 text-center text-ocean-500">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-2">{t('bookings.empty')}</p>
            <p className="text-sm mb-6">{t('bookings.emptyDesc')}</p>
            <Link href="/calendario" className="btn-primary">
              {t('bookings.viewTrips')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(booking => (
              <div key={booking.id} className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={cn('badge', STATUS_STYLES[booking.status])}>
                        {BOOKING_STATUS_LABELS[booking.status]}
                      </span>
                      {booking.trip?.difficulty_level && (
                        <DifficultyBadge difficulty={booking.trip.difficulty_level} />
                      )}
                    </div>

                    <h3 className="font-semibold text-ocean-950 text-lg">
                      {booking.trip ? getI18n(booking.trip.title_i18n, locale, booking.trip.title) : 'Salida eliminada'}
                    </h3>

                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-ocean-600">
                      {booking.trip?.date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-ocean-400" />
                          {formatDate(booking.trip.date, locale)}
                        </span>
                      )}
                      {booking.trip?.time && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-ocean-400" />
                          {formatTime(booking.trip.time)}
                        </span>
                      )}
                      {booking.trip?.price != null && (
                        <span className="flex items-center gap-1.5">
                          <Euro className="h-4 w-4 text-ocean-400" />
                          {formatPrice(booking.trip.price)}
                        </span>
                      )}
                    </div>

                    {booking.equipment_bookings?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Package className="h-4 w-4 text-ocean-400 mt-0.5" />
                        {booking.equipment_bookings.map(eb => (
                          <span key={eb.id} className="badge badge-blue">
                            {eb.equipment?.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {booking.notes && (
                      <p className="mt-2 text-xs text-ocean-500 italic">{booking.notes}</p>
                    )}
                  </div>

                  {/* Cancel button */}
                  {booking.status !== 'cancelled' && booking.trip?.date && new Date(booking.trip.date) > new Date() && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancelling === booking.id}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                      {cancelling === booking.id ? t('bookings.cancelling') : t('bookings.cancel')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/calendario" className="btn-primary">
            {t('bookings.newBooking')}
          </Link>
        </div>
      </div>
    </div>
  )
}
