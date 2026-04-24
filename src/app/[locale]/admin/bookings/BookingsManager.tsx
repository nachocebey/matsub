'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import { formatDate, BOOKING_STATUS_LABELS, CERTIFICATION_LABELS, EQUIPMENT_TYPE_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import type { BookingStatus } from '@/types'
import { useTranslations } from 'next-intl'

interface BookingRow {
  id: string
  status: BookingStatus
  notes: string | null
  needed_equipment: string[]
  verified: boolean
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  created_at: string
  trip: { title: string; date: string; time: string } | null
  profile: { full_name: string; phone: string | null; certification_level: string } | null
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'badge-yellow',
  confirmed: 'badge-green',
  cancelled: 'badge-red',
}

export function BookingsManager({ bookings: initial }: { bookings: BookingRow[] }) {
  const t = useTranslations('admin.bookings')
  const supabase = createClient()
  const [bookings, setBookings] = useState(initial)
  const [filter, setFilter] = useState<'all' | BookingStatus>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

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
        <div className="flex gap-2">
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                filter === f ? 'bg-ocean-600 text-white border-ocean-600' : 'bg-white text-ocean-600 border-ocean-200 hover:border-ocean-400'
              )}>
              {f === 'all' ? t('all') : BOOKING_STATUS_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ocean-50 border-b border-ocean-100">
              <tr>
                {[t('user'), t('trip'), t('status'), t('equipment'), t('date'), t('actions')].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-ocean-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ocean-50">
              {filtered.map(b => (
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
                    <p className="font-medium text-ocean-950">{b.trip?.title_i18n?.es || b.trip?.title}</p>
                    {b.trip?.date && <p className="text-xs text-ocean-400">{formatDate(b.trip.date)} · {b.trip.time?.slice(0, 5)}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('badge', STATUS_STYLES[b.status])}>
                      {BOOKING_STATUS_LABELS[b.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {b.needed_equipment?.length > 0
                        ? b.needed_equipment.map((type) => (
                            <span key={type} className="badge badge-blue text-xs">
                              {EQUIPMENT_TYPE_LABELS[type] ?? type}
                            </span>
                          ))
                        : <span className="text-xs text-ocean-300">{t('noEquipment')}</span>
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ocean-500 text-xs whitespace-nowrap">
                    {new Date(b.created_at).toLocaleDateString('ca-ES')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {b.status !== 'confirmed' && (
                        <button
                          onClick={() => updateStatus(b.id, 'confirmed')}
                          disabled={updating === b.id}
                          className="text-green-500 hover:text-green-700"
                          title={t('confirm')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {b.status !== 'pending' && b.status !== 'cancelled' && (
                        <button
                          onClick={() => updateStatus(b.id, 'pending')}
                          disabled={updating === b.id}
                          className="text-yellow-500 hover:text-yellow-700"
                          title={t('setPending')}
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                      )}
                      {b.status !== 'cancelled' && (
                        <button
                          onClick={() => updateStatus(b.id, 'cancelled')}
                          disabled={updating === b.id}
                          className="text-red-400 hover:text-red-600"
                          title={t('cancel')}
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-ocean-400">{t('none')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
