'use client'

import { useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import { formatDate, BOOKING_STATUS_LABELS, CERTIFICATION_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronRight, Users, X } from 'lucide-react'
import type { BookingStatus } from '@/types'
import { useTranslations } from 'next-intl'

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

interface TripGroup {
  tripId: string
  tripTitle: string
  tripDate: string
  tripTime: string
  maxParticipants: number
  bookings: BookingRow[]
}

type FilterType = 'all' | BookingStatus

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'badge-yellow',
  confirmed: 'badge-green',
  cancelled: 'badge-red',
}

export function BookingsManager({ bookings: initial }: { bookings: BookingRow[] }) {
  const t = useTranslations('admin.bookings')
  const tCommon = useTranslations('common')
  const supabase = createClient()
  const [bookings, setBookings] = useState(initial)
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(initial.map(b => b.trip_id).filter(Boolean))
  )
  const [showAllForTrip, setShowAllForTrip] = useState<Set<string>>(new Set())

  const grouped = useMemo<TripGroup[]>(() => {
    const map = new Map<string, TripGroup>()
    for (const b of bookings) {
      if (!b.trip_id) continue
      if (!map.has(b.trip_id)) {
        map.set(b.trip_id, {
          tripId: b.trip_id,
          tripTitle: b.trip?.title_i18n?.es || b.trip?.title || '—',
          tripDate: b.trip?.date || '',
          tripTime: b.trip?.time || '',
          maxParticipants: b.trip?.max_participants || 0,
          bookings: [],
        })
      }
      map.get(b.trip_id)!.bookings.push(b)
    }
    return Array.from(map.values())
      .filter(g => !selectedDate || g.tripDate === selectedDate)
      .sort((a, b) => a.tripDate.localeCompare(b.tripDate))
  }, [bookings, selectedDate])

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter)
    const newExpanded = new Set<string>()
    for (const group of grouped) {
      if (newFilter === 'all' || group.bookings.some(b => b.status === newFilter)) {
        newExpanded.add(group.tripId)
      }
    }
    setExpanded(newExpanded)
    setShowAllForTrip(new Set())
  }

  const toggleExpanded = (tripId: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(tripId) ? next.delete(tripId) : next.add(tripId)
      return next
    })
  }

  const toggleShowAll = (tripId: string) => {
    setShowAllForTrip(prev => {
      const next = new Set(prev)
      next.has(tripId) ? next.delete(tripId) : next.add(tripId)
      return next
    })
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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-ocean-950">{t('title')}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center">
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              onClick={() => dateInputRef.current?.showPicker()}
              className={`py-1.5 text-xs border border-ocean-200 rounded-full text-ocean-700 focus:outline-none focus:border-ocean-400 bg-white ${selectedDate ? 'pl-3 pr-8' : 'px-3'}`}
            />
            {selectedDate && (
              <button onClick={() => setSelectedDate('')} className="absolute right-3 text-ocean-400 hover:text-ocean-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {(['all', 'pending', 'confirmed', 'cancelled'] as const).map(f => (
              <button key={f} onClick={() => handleFilterChange(f)}
                className={cn('rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                  filter === f
                    ? 'bg-ocean-600 text-white border-ocean-600'
                    : 'bg-white text-ocean-600 border-ocean-200 hover:border-ocean-400'
                )}>
                {f === 'all' ? t('all') : BOOKING_STATUS_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {grouped.length === 0 && (
          <div className="card p-8 text-center text-ocean-400">{t('none')}</div>
        )}
        {grouped.map(group => {
          const counts = {
            pending: group.bookings.filter(b => b.status === 'pending').length,
            confirmed: group.bookings.filter(b => b.status === 'confirmed').length,
            cancelled: group.bookings.filter(b => b.status === 'cancelled').length,
          }
          const isExp = expanded.has(group.tripId)
          const showingAll = showAllForTrip.has(group.tripId)
          const visibleBookings = filter === 'all' || showingAll
            ? group.bookings
            : group.bookings.filter(b => b.status === filter)
          const hiddenCount = group.bookings.length - visibleBookings.length

          return (
            <div key={group.tripId} className="card overflow-hidden">
              <button
                onClick={() => toggleExpanded(group.tripId)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-ocean-50/50 transition-colors"
              >
                {isExp
                  ? <ChevronDown className="h-4 w-4 text-ocean-400 shrink-0" />
                  : <ChevronRight className="h-4 w-4 text-ocean-400 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ocean-950 truncate">{group.tripTitle}</p>
                  <p className="text-xs text-ocean-400">{formatDate(group.tripDate)} · {group.tripTime?.slice(0, 5)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {counts.confirmed > 0 && (
                    <span className="badge badge-green">{counts.confirmed} confirmada{counts.confirmed !== 1 ? 's' : ''}</span>
                  )}
                  {counts.pending > 0 && (
                    <span className="badge badge-yellow">{counts.pending} pendiente{counts.pending !== 1 ? 's' : ''}</span>
                  )}
                  {counts.cancelled > 0 && (
                    <span className="badge badge-red">{counts.cancelled} cancelada{counts.cancelled !== 1 ? 's' : ''}</span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-ocean-400">
                    <Users className="h-3.5 w-3.5" />
                    {counts.confirmed}/{group.maxParticipants}
                  </span>
                </div>
              </button>

              {isExp && (
                <div className="border-t border-ocean-100">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-ocean-50">
                        <tr>
                          {[t('user'), t('status'), t('equipment'), t('date'), t('actions')].map(h => (
                            <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-ocean-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ocean-50">
                        {visibleBookings.map(b => (
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
                                {b.paid_at ? (
                                  <span className="badge badge-green text-xs">💳 Pagado</span>
                                ) : b.payment_method === 'at_center' ? (
                                  <span className="badge badge-blue text-xs">🏊 Pagar en centro</span>
                                ) : b.payment_method === 'stripe' ? (
                                  <span className="badge badge-yellow text-xs">💳 Pago pendiente</span>
                                ) : null}
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
                            <td className="px-4 py-3 text-ocean-500 text-xs whitespace-nowrap">
                              {new Date(b.created_at).toLocaleDateString('ca-ES')}
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
                        {visibleBookings.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-6 text-ocean-400 text-sm">{t('none')}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {hiddenCount > 0 && (
                    <div className="px-5 py-3 border-t border-ocean-50 bg-ocean-50/30">
                      <button onClick={() => toggleShowAll(group.tripId)}
                        className="text-xs text-ocean-500 hover:text-ocean-700 font-medium transition-colors">
                        {showingAll
                          ? `Mostrar solo ${BOOKING_STATUS_LABELS[filter as BookingStatus].toLowerCase()}`
                          : `Ver todas las reservas de esta salida (${group.bookings.length})`
                        }
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
