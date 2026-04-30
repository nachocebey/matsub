'use client'

import { useState, useMemo } from 'react'
import { toast } from '@/components/ui/Toaster'
import { formatDate, BOOKING_STATUS_LABELS, CERTIFICATION_LABELS, EQUIPMENT_TYPE_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, CalendarDays, Search, ChevronDown } from 'lucide-react'
import { CalendarGrid } from '@/components/ui/CalendarGrid'
import { format, parseISO } from 'date-fns'
import { ca, es, enUS } from 'date-fns/locale'
import type { BookingStatus } from '@/types'
import { useTranslations, useLocale } from 'next-intl'

const DATE_FNS_LOCALES = { es, ca, en: enUS }

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
  trip: { title: string; title_i18n: { es?: string; ca?: string; en?: string } | null; date: string; time: string; max_participants: number; type: string } | null
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

interface TripRow {
  id: string
  title: string
  title_i18n: { es?: string; ca?: string; en?: string } | null
  date: string
  time: string
  type: string
  max_participants: number
}

export function BookingsManager({ bookings: initial, trips }: { bookings: BookingRow[]; trips: TripRow[] }) {
  const t = useTranslations('admin.bookings')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const dfLocale = DATE_FNS_LOCALES[locale as keyof typeof DATE_FNS_LOCALES] ?? es
  const [bookings, setBookings] = useState(initial)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set())

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return bookings
    return bookings.filter(b =>
      b.profile?.full_name?.toLowerCase().includes(q) ||
      b.guest_name?.toLowerCase().includes(q) ||
      b.guest_email?.toLowerCase().includes(q) ||
      b.trip?.title?.toLowerCase().includes(q) ||
      b.trip?.title_i18n?.es?.toLowerCase().includes(q)
    )
  }, [search, bookings])

  // Last 5 bookings (already sorted by created_at desc from server)
  const recentBookings = bookings.slice(0, 5)

  // Group all bookings by trip date
  const bookingsByDate = useMemo(() => {
    const map: Record<string, BookingRow[]> = {}
    for (const b of filteredBookings) {
      const date = b.trip?.date
      if (!date) continue
      if (!map[date]) map[date] = []
      map[date].push(b)
    }
    return map
  }, [filteredBookings])

  // All trips per day with booking counts overlaid (for calendar pills)
  const tripsByDate = useMemo(() => {
    const map: Record<string, { id: string; title: string; type: string; confirmed: number; pending: number }[]> = {}
    for (const trip of trips) {
      if (!map[trip.date]) map[trip.date] = []
      map[trip.date].push({ id: trip.id, title: trip.title_i18n?.es ?? trip.title, type: trip.type, confirmed: 0, pending: 0 })
    }
    for (const b of bookings) {
      const date = b.trip?.date
      if (!date || !b.trip_id) continue
      const entry = map[date]?.find(t => t.id === b.trip_id)
      if (!entry) continue
      if (b.status === 'confirmed') entry.confirmed++
      else if (b.status === 'pending') entry.pending++
    }
    return map
  }, [trips, bookings])

  // All trips for selected day, with their bookings (may be empty)
  const dayTripGroups = useMemo(() => {
    if (!selectedDate) return []
    const dayTrips = trips.filter(t => t.date === selectedDate)
    const dayBookings = bookingsByDate[selectedDate] ?? []
    return dayTrips.map(trip => ({
      title: trip.title_i18n?.es ?? trip.title,
      time: trip.time,
      max: trip.max_participants,
      bookings: dayBookings.filter(b => b.trip_id === trip.id),
    }))
  }, [selectedDate, trips, bookingsByDate])

  const jumpToDate = (date?: string | null) => {
    if (!date) return
    setCurrentMonth(parseISO(date))
    setSelectedDate(date)
    setCollapsedGroups(new Set())
  }

  const updateStatus = async (id: string, status: BookingStatus) => {
    setUpdating(id)
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, locale }),
    })
    if (!res.ok) { toast.error(t('updateError')); setUpdating(null); return }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    toast.success(`Reserva ${BOOKING_STATUS_LABELS[status].toLowerCase()}.`)
    setUpdating(null)
  }

  return (
    <div className="container-main py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-ocean-950">{t('title')}</h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedDate(null) }}
            placeholder="Buscar por nombre, email o salida..."
            className="form-input pl-9 w-full text-sm"
          />
        </div>
      </div>

      {search.trim() ? (
        /* ── Search results ────────────────────────────────────────── */
        <div>
          <p className="text-sm text-ocean-500 mb-4">
            {filteredBookings.length} resultado{filteredBookings.length !== 1 ? 's' : ''} para <strong>&ldquo;{search}&rdquo;</strong>
          </p>
          {filteredBookings.length === 0 ? (
            <div className="card p-12 text-center text-ocean-400">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No se han encontrado reservas.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-ocean-50/50">
                    <tr>
                      {[t('user'), 'Salida', 'Fecha', t('status'), t('equipment'), t('actions')].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-ocean-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ocean-50">
                    {filteredBookings.map(b => (
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
                          <p className="font-medium text-ocean-950">{b.trip?.title_i18n?.es ?? b.trip?.title ?? '—'}</p>
                          <p className="text-xs text-ocean-400">{b.trip?.time?.slice(0, 5)}</p>
                        </td>
                        <td className="px-4 py-3 text-ocean-600 text-xs whitespace-nowrap">
                          {b.trip?.date ? formatDate(b.trip.date) : '—'}
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
                            {b.tank_size && <span className="badge badge-blue text-xs">🫙 {b.tank_size}</span>}
                            {b.wants_nitrox && <span className="badge text-xs bg-amber-100 text-amber-700 border border-amber-200">⚗️ Nitrox</span>}
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
          )}
        </div>
      ) : (
        <>
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
          <CalendarGrid
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            className="mb-8"
            footer={
              <div className="flex flex-wrap gap-5 text-xs text-ocean-700">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ocean-400" aria-hidden="true" /> Inmersión</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" /> Curso</span>
                <span className="flex items-center gap-1.5 text-green-700">✓ Confirmadas</span>
                <span className="flex items-center gap-1.5 text-amber-600">· Pendientes</span>
              </div>
            }
            renderCellContent={(_day, { dateStr, isSelected }) => {
              const dayTrips = tripsByDate[dateStr] ?? []
              return (
                <>
                  {dayTrips.length > 0 && (
                    <div className="hidden sm:flex flex-col gap-0.5 mt-1 overflow-hidden">
                      {dayTrips.slice(0, 2).map(trip => (
                        <div
                          key={trip.id}
                          className={cn(
                            'text-[10px] leading-tight px-1.5 py-0.5 rounded flex items-center gap-1 min-w-0',
                            isSelected
                              ? 'bg-white/20 text-white'
                              : trip.type === 'dive'
                                ? 'bg-ocean-100 text-ocean-700'
                                : 'bg-amber-100 text-amber-700'
                          )}
                        >
                          <span className="truncate flex-1">{trip.title}</span>
                          <span className={cn('shrink-0 font-semibold', isSelected ? 'text-green-200' : 'text-green-700')}>✓{trip.confirmed}</span>
                          {trip.pending > 0 && (
                            <span className={cn('shrink-0 font-semibold', isSelected ? 'text-amber-200' : 'text-amber-600')}>·{trip.pending}</span>
                          )}
                        </div>
                      ))}
                      {dayTrips.length > 2 && (
                        <div className={cn('text-[10px]', isSelected ? 'text-ocean-100' : 'text-ocean-700')}>
                          +{dayTrips.length - 2}
                        </div>
                      )}
                    </div>
                  )}
                  {dayTrips.length > 0 && (
                    <div className="absolute bottom-1 right-1 flex gap-0.5 sm:hidden">
                      {dayTrips.some(t => t.type === 'dive') && <span className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-white/60' : 'bg-ocean-500')} />}
                      {dayTrips.some(t => t.type === 'course') && <span className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-white/60' : 'bg-amber-500')} />}
                    </div>
                  )}
                </>
              )
            }}
          />

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
                  <p className="text-sm">No hay salidas este día.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dayTripGroups.map((group, gi) => {
                    const confirmed = group.bookings.filter(b => b.status === 'confirmed').length
                    const pending = group.bookings.filter(b => b.status === 'pending').length
                    const total = group.bookings.filter(b => b.status !== 'cancelled').length
                    const isCollapsed = collapsedGroups.has(gi)
                    const toggleCollapse = () => setCollapsedGroups(prev => {
                      const next = new Set(prev)
                      if (next.has(gi)) { next.delete(gi) } else { next.add(gi) }
                      return next
                    })
                    return (
                      <div key={gi} className="card overflow-hidden">
                        <button
                          onClick={toggleCollapse}
                          className="w-full px-5 py-3 bg-ocean-100 border-b border-ocean-200 text-left hover:bg-ocean-150 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-ocean-950">{group.title}</p>
                              <p className="text-xs text-ocean-600">{group.time?.slice(0, 5)}</p>
                            </div>
                            <div className="flex items-center gap-3 text-xs shrink-0">
                              <span className="text-green-700 font-medium">✓ {confirmed}</span>
                              {pending > 0 && <span className="text-amber-600 font-medium">· {pending}</span>}
                              <span className="text-ocean-500">{total}/{group.max}</span>
                              <ChevronDown className={cn('h-4 w-4 text-ocean-400 transition-transform', isCollapsed && '-rotate-90')} aria-hidden="true" />
                            </div>
                          </div>
                        </button>
                        {!isCollapsed && (() => {
                          const counts: Record<string, number> = {}
                          const tanks: Record<string, number> = {}
                          let nitrox = 0
                          for (const b of group.bookings) {
                            if (b.status === 'cancelled') continue
                            for (const type of b.needed_equipment ?? []) counts[type] = (counts[type] ?? 0) + 1
                            if (b.tank_size) tanks[b.tank_size] = (tanks[b.tank_size] ?? 0) + 1
                            if (b.wants_nitrox) nitrox++
                          }
                          const equipEntries = Object.entries(counts)
                          const tankEntries = Object.entries(tanks)
                          const hasEquip = equipEntries.length > 0 || tankEntries.length > 0 || nitrox > 0
                          return (
                            <>
                              {hasEquip && (
                                <div className="px-5 py-2 bg-ocean-50 border-b border-ocean-100 flex flex-wrap gap-1.5">
                                  {equipEntries.map(([type, count]) => (
                                    <span key={type} className="inline-flex items-center gap-1 bg-ocean-100 text-ocean-700 text-xs px-2 py-0.5 rounded-full">
                                      {EQUIPMENT_TYPE_LABELS[type] ?? type} <span className="font-semibold">×{count}</span>
                                    </span>
                                  ))}
                                  {tankEntries.map(([size, count]) => (
                                    <span key={size} className="inline-flex items-center gap-1 bg-ocean-100 text-ocean-700 text-xs px-2 py-0.5 rounded-full">
                                      🫙 {size} <span className="font-semibold">×{count}</span>
                                    </span>
                                  ))}
                                  {nitrox > 0 && (
                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                                      ⚗️ Nitrox <span className="font-semibold">×{nitrox}</span>
                                    </span>
                                  )}
                                </div>
                              )}
                              {group.bookings.length === 0 ? (
                                <p className="px-5 py-4 text-sm text-ocean-500">No hay reservas para esta salida.</p>
                              ) : (
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
                                              {b.tank_size && <span className="badge badge-blue text-xs">🫙 {b.tank_size}</span>}
                                              {b.wants_nitrox && <span className="badge text-xs bg-amber-100 text-amber-700 border border-amber-200">⚗️ Nitrox</span>}
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
                              )}
                            </>
                          )
                        })()}
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
        </>
      )}
    </div>
  )
}
