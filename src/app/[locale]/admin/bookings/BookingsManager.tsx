'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import { formatDate, BOOKING_STATUS_LABELS, CERTIFICATION_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, isBefore, startOfToday, parseISO } from 'date-fns'
import { ca, es, enUS } from 'date-fns/locale'
import type { BookingStatus } from '@/types'
import { useTranslations, useLocale } from 'next-intl'

const DATE_FNS_LOCALES = { es, ca, en: enUS }
const DAY_HEADERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

interface BookingRow {
  id: string
  trip_id: string
  status: BookingStatus
  notes: string | null
  needed_equipment: string[]
  tank_size: string | null
  wants_nitrox: boolean
  verified: boolean
  payment_method: string | null
  paid_at: string | null
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  created_at: string
  trip: { title: string; title_i18n: { es?: string; ca?: string; en?: string } | null; date: string; time: string; max_participants: number } | null
  profile: { full_name: string; phone: string | null; certification_level: string } | null
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'badge-yellow',
  confirmed: 'badge-green',
  cancelled: 'badge-red',
}

function PaymentBadge({ b }: { b: BookingRow }) {
  if (b.paid_at) return <span className="badge badge-green text-xs">💳 Pagado</span>
  if (b.payment_method === 'at_center') return <span className="badge badge-blue text-xs">🏊 En centro</span>
  if (b.payment_method === 'stripe') return <span className="badge badge-yellow text-xs">💳 Pago pendiente</span>
  return null
}

export function BookingsManager({ bookings: initial }: { bookings: BookingRow[] }) {
  const t = useTranslations('admin.bookings')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const dfLocale = DATE_FNS_LOCALES[locale as keyof typeof DATE_FNS_LOCALES] ?? es
  const supabase = createClient()

  const [bookings, setBookings] = useState(initial)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  // Last 5 bookings (already sorted by created_at desc from server)
  const recentBookings = bookings.slice(0, 5)

  // Group all bookings by trip date
  const bookingsByDate = useMemo(() => {
    const map: Record<string, BookingRow[]> = {}
    for (const b of bookings) {
      const date = b.trip?.date
      if (!date) continue
      if (!map[date]) map[date] = []
      map[date].push(b)
    }
    return map
  }, [bookings])

  // Calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = (monthStart.getDay() + 6) % 7
  const paddedDays = [...Array(startPad).fill(null), ...days]

  // Bookings for selected day, grouped by trip
  const dayBookings = selectedDate ? (bookingsByDate[selectedDate] ?? []) : []
  const dayTripGroups = useMemo(() => {
    const map = new Map<string, { title: string; time: string; max: number; bookings: BookingRow[] }>()
    for (const b of dayBookings) {
      if (!b.trip_id) continue
      if (!map.has(b.trip_id)) {
        map.set(b.trip_id, {
          title: b.trip?.title_i18n?.es ?? b.trip?.title ?? '—',
          time: b.trip?.time ?? '',
          max: b.trip?.max_participants ?? 0,
          bookings: [],
        })
      }
      map.get(b.trip_id)!.bookings.push(b)
    }
    return Array.from(map.values())
  }, [dayBookings])

  const jumpToDate = (date?: string | null) => {
    if (!date) return
    const parsed = parseISO(date)
    setCurrentMonth(parsed)
    setSelectedDate(date)
  }

  const updateStatus = async (id: string, status: BookingStatus) => {
    setUpdating(id)
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
    if (error) { toast.error(t('updateError')); setUpdating(null); return }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    toast.success(`Reserva ${BOOKING_STATUS_LABELS[status].toLowerCase()}.`)
    setUpdating(null)
  }

  return (
    <div className="container-main py-8">
      <h1 className="text-2xl font-bold text-ocean-950 mb-8">{t('title')}</h1>

      {/* ── Recent bookings ──────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-ocean-500 uppercase tracking-wider mb-4">Últimas reservas</h2>
        {recentBookings.length === 0 ? (
          <p className="text-sm text-ocean-400">{t('none')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {recentBookings.map(b => (
              <button
                key={b.id}
                onClick={() => jumpToDate(b.trip?.date)}
                className="card p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className={cn('badge text-xs', STATUS_STYLES[b.status])}>
                    {BOOKING_STATUS_LABELS[b.status]}
                  </span>
                  <PaymentBadge b={b} />
                </div>
                <p className="font-semibold text-ocean-950 text-sm truncate">
                  {b.profile?.full_name ?? b.guest_name ?? '—'}
                  {!b.profile && <span className="ml-1 text-xs font-normal text-ocean-400">{t('guest')}</span>}
                </p>
                <p className="text-xs text-ocean-500 truncate mt-0.5">
                  {b.trip?.title_i18n?.es ?? b.trip?.title ?? '—'}
                </p>
                <p className="text-xs text-ocean-400 mt-1">{b.trip?.date ? formatDate(b.trip.date) : '—'}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Calendar ─────────────────────────────────────────────── */}
      <div className="card p-6 mb-8">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => { setCurrentMonth(subMonths(currentMonth, 1)); setSelectedDate(null) }}
            className="p-1.5 rounded-lg hover:bg-ocean-50 text-ocean-600"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-semibold text-ocean-950 capitalize text-lg">
            {format(currentMonth, 'MMMM yyyy', { locale: dfLocale })}
          </h2>
          <button
            onClick={() => { setCurrentMonth(addMonths(currentMonth, 1)); setSelectedDate(null) }}
            className="p-1.5 rounded-lg hover:bg-ocean-50 text-ocean-600"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-ocean-100 mb-0">
          {DAY_HEADERS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-ocean-400 py-2 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 border-l border-ocean-100">
          {paddedDays.map((day, i) => {
            if (!day) return (
              <div key={`pad-${i}`} className="border-r border-b border-ocean-100 min-h-[56px] sm:min-h-[80px] bg-ocean-50/30" />
            )

            const dateStr = format(day, 'yyyy-MM-dd')
            const dayBks = bookingsByDate[dateStr] ?? []
            const confirmed = dayBks.filter(b => b.status === 'confirmed').length
            const pending = dayBks.filter(b => b.status === 'pending').length
            const isSelected = selectedDate === dateStr
            const isPast = isBefore(day, startOfToday())

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={cn(
                  'relative border-r border-b border-ocean-100 min-h-[56px] sm:min-h-[80px] p-1.5 text-left transition-colors',
                  isSelected
                    ? 'bg-ocean-600'
                    : isToday(day)
                    ? 'bg-ocean-50'
                    : isPast
                    ? 'bg-slate-50'
                    : 'hover:bg-ocean-50/60'
                )}
              >
                <span className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium',
                  isSelected
                    ? 'bg-white text-ocean-700'
                    : isToday(day)
                    ? 'bg-ocean-600 text-white'
                    : isPast
                    ? 'text-slate-400'
                    : 'text-ocean-700'
                )}>
                  {format(day, 'd')}
                </span>

                {/* Desktop: counts */}
                {dayBks.length > 0 && (
                  <div className="hidden sm:flex flex-col gap-0.5 mt-1">
                    {confirmed > 0 && (
                      <span className={cn('text-[10px] font-semibold', isSelected ? 'text-green-200' : 'text-green-600')}>
                        ✓ {confirmed}
                      </span>
                    )}
                    {pending > 0 && (
                      <span className={cn('text-[10px] font-semibold', isSelected ? 'text-amber-200' : 'text-amber-500')}>
                        · {pending}
                      </span>
                    )}
                  </div>
                )}

                {/* Mobile: dots */}
                {dayBks.length > 0 && (
                  <div className="absolute bottom-1 right-1 flex gap-0.5 sm:hidden">
                    {confirmed > 0 && <span className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-green-300' : 'bg-green-500')} />}
                    {pending > 0 && <span className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-amber-300' : 'bg-amber-500')} />}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-5 mt-4 pt-4 border-t border-ocean-100 text-xs text-ocean-500">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500" /> Confirmadas</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Pendientes</span>
        </div>
      </div>

      {/* ── Day panel ────────────────────────────────────────────── */}
      {selectedDate ? (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-ocean-950 text-lg capitalize">
              {format(parseISO(selectedDate), "EEEE, d 'de' MMMM yyyy", { locale: dfLocale })}
            </h3>
            <button onClick={() => setSelectedDate(null)} className="text-sm text-ocean-500 hover:text-ocean-700">
              Ver todo el mes
            </button>
          </div>

          {dayTripGroups.length === 0 ? (
            <div className="card p-10 text-center text-ocean-400">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay reservas este día.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayTripGroups.map((group, gi) => {
                const confirmed = group.bookings.filter(b => b.status === 'confirmed').length
                return (
                  <div key={gi} className="card overflow-hidden">
                    <div className="px-5 py-3 bg-ocean-50 border-b border-ocean-100 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-ocean-950">{group.title}</p>
                        <p className="text-xs text-ocean-400">{group.time?.slice(0, 5)}</p>
                      </div>
                      <span className="text-xs text-ocean-400">{confirmed}/{group.max} confirmados</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-ocean-50/50">
                          <tr>
                            {[t('user'), t('status'), t('equipment'), t('actions')].map(h => (
                              <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-ocean-500 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ocean-50">
                          {group.bookings.map(b => (
                            <tr key={b.id} className="hover:bg-ocean-50/50">
                              <td className="px-4 py-3">
                                <p className="font-medium text-ocean-950">
                                  {b.profile?.full_name ?? b.guest_name}
                                  {!b.profile && <span className="ml-1.5 text-xs text-ocean-400">{t('guest')}</span>}
                                </p>
                                {b.profile?.certification_level && (
                                  <p className="text-xs text-ocean-400">{CERTIFICATION_LABELS[b.profile.certification_level]}</p>
                                )}
                                {(b.profile?.phone ?? b.guest_phone) && (
                                  <p className="text-xs text-ocean-400">{b.profile?.phone ?? b.guest_phone}</p>
                                )}
                                {b.guest_email && (
                                  <p className="text-xs text-ocean-400">{b.guest_email}</p>
                                )}
                                {!b.verified && (
                                  <span className="badge badge-yellow text-xs mt-1">{t('pendingVerification')}</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1">
                                  <span className={cn('badge', STATUS_STYLES[b.status])}>
                                    {BOOKING_STATUS_LABELS[b.status]}
                                  </span>
                                  <PaymentBadge b={b} />
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {b.needed_equipment?.length > 0
                                    ? b.needed_equipment.map(type => (
                                        <span key={type} className="badge badge-blue text-xs">
                                          {tCommon(`equipment.${type}`)}
                                        </span>
                                      ))
                                    : <span className="text-xs text-ocean-300">{t('noEquipment')}</span>
                                  }
                                  {b.tank_size && (
                                    <span className="badge badge-blue text-xs">🫙 {b.tank_size}</span>
                                  )}
                                  {b.wants_nitrox && (
                                    <span className="badge text-xs bg-amber-100 text-amber-700 border border-amber-200">⚗️ Nitrox</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  {b.status !== 'confirmed' && (
                                    <button onClick={() => updateStatus(b.id, 'confirmed')} disabled={updating === b.id}
                                      className="text-green-500 hover:text-green-700" title={t('confirm')}>
                                      <CheckCircle className="h-4 w-4" />
                                    </button>
                                  )}
                                  {b.status !== 'pending' && b.status !== 'cancelled' && (
                                    <button onClick={() => updateStatus(b.id, 'pending')} disabled={updating === b.id}
                                      className="text-yellow-500 hover:text-yellow-700" title={t('setPending')}>
                                      <Clock className="h-4 w-4" />
                                    </button>
                                  )}
                                  {b.status !== 'cancelled' && (
                                    <button onClick={() => updateStatus(b.id, 'cancelled')} disabled={updating === b.id}
                                      className="text-red-400 hover:text-red-600" title={t('cancel')}>
                                      <XCircle className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="card p-12 text-center text-ocean-400">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Selecciona un día para ver sus reservas.</p>
        </div>
      )}
    </div>
  )
}
