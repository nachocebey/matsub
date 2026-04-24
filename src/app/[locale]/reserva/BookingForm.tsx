'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/components/ui/Toaster'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { DifficultyBadge } from '@/components/ui/DifficultyBadge'
import { formatDate, formatTime, formatPrice, formatDuration, EQUIPMENT_TYPE_LABELS, getI18n } from '@/lib/utils'
import { Calendar, Clock, Users, Euro, MapPin, Package, CheckCircle, AlertTriangle, Mail } from 'lucide-react'
import type { TripWithAvailability, Profile, EquipmentType } from '@/types'
import { useTranslations, useLocale } from 'next-intl'

const EQUIPMENT_TYPES: EquipmentType[] = ['wetsuit', 'bcd', 'regulator', 'fins', 'mask', 'tank']
const EQUIPMENT_ICONS: Record<EquipmentType, string> = {
  wetsuit: '🤿', bcd: '🦺', regulator: '🔧', fins: '🐟', mask: '👓', tank: '🫙',
}

interface Props {
  trip: TripWithAvailability
  profile: Profile | null
  existingBooking: { id: string; status: string } | null
}

export function BookingForm({ trip, profile, existingBooking }: Props) {
  const t = useTranslations('booking')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isLoggedIn = !!profile
  const formOpenTime = useRef(Date.now())

  const equipmentFromUrl = (searchParams.get('equipment') ?? '')
    .split(',')
    .filter((e): e is EquipmentType => EQUIPMENT_TYPES.includes(e as EquipmentType))

  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType[]>(equipmentFromUrl)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Guest fields
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  // Honeypot (hidden, must stay empty)
  const [honeypot, setHoneypot] = useState('')

  const isFull = trip.available_spots <= 0
  const isPast = new Date(trip.date) < new Date()


  const toggleEquipment = (type: EquipmentType) => {
    setSelectedEquipment(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isFull || isPast) return
    setLoading(true)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: trip.id,
          needed_equipment: selectedEquipment,
          notes,
          // Guest fields (ignored by API if user is logged in)
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          // Anti-spam
          _hp: honeypot,
          _t: formOpenTime.current,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error desconegut')

      if (data.pending) {
        // Guest booking — awaiting email verification
        setEmailSent(true)
      } else {
        toast.success(t('success'))
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error en realitzar la reserva.')
    } finally {
      setLoading(false)
    }
  }

  // Already booked
  if (existingBooking && existingBooking.status !== 'cancelled') {
    return (
      <div className="card p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-ocean-950 mb-2">{t('alreadyBooked.title')}</h2>
        <p className="text-ocean-600 mb-6">{t('alreadyBooked.subtitle')}</p>
        <Link href="/dashboard" className="btn-primary">{t('alreadyBooked.viewBookings')}</Link>
      </div>
    )
  }

  // Guest booking submitted — awaiting email
  if (emailSent) {
    return (
      <div className="card p-8 text-center">
        <Mail className="h-12 w-12 text-ocean-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-ocean-950 mb-3">{t('checkEmail.title')}</h2>
        <p className="text-ocean-600 leading-relaxed mb-2"
          dangerouslySetInnerHTML={{ __html: t('checkEmail.sent', { email: guestEmail }) }}
        />
        <p className="text-ocean-500 text-sm mb-8">
          {t('checkEmail.instruction')}
        </p>
        <Link href="/calendario" className="btn-secondary">{t('checkEmail.backToCalendar')}</Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Honeypot — invisible to humans, bots fill it */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={e => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Trip summary */}
      <div className="card p-6">
        <h2 className="font-semibold text-ocean-950 text-lg mb-4">{t('summary')}</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xl text-ocean-950">{getI18n(trip.title_i18n, locale, trip.title)}</span>
            {trip.difficulty_level && <DifficultyBadge difficulty={trip.difficulty_level} />}
          </div>
          {trip.spot_name && (
            <div className="flex items-center gap-2 text-sm text-ocean-600">
              <MapPin className="h-4 w-4 text-ocean-400" />
              {trip.spot_name}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2 text-sm text-ocean-600">
              <Calendar className="h-4 w-4 text-ocean-400" />
              {formatDate(trip.date, locale)}
            </div>
            <div className="flex items-center gap-2 text-sm text-ocean-600">
              <Clock className="h-4 w-4 text-ocean-400" />
              {formatTime(trip.time)} · {formatDuration(trip.duration_minutes)}
            </div>
            <div className="flex items-center gap-2 text-sm text-ocean-600">
              <Users className="h-4 w-4 text-ocean-400" />
              {isFull
                ? <span className="text-red-600 font-medium">{t('full')}</span>
                : <span>{t('spotsAvailable', { count: trip.available_spots })}</span>
              }
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-ocean-800">
              <Euro className="h-4 w-4 text-ocean-400" />
              {formatPrice(trip.price)}
            </div>
          </div>
          {trip.description && (
            <p className="text-sm text-ocean-600 leading-relaxed pt-2 border-t border-ocean-100">
              {trip.description}
            </p>
          )}
        </div>
      </div>

      {/* Warnings */}
      {isFull && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-red-700">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{t('warnings.full')}</p>
        </div>
      )}
      {isPast && !isFull && (
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4 flex items-center gap-3 text-yellow-700">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{t('warnings.past')}</p>
        </div>
      )}

      {!isFull && !isPast && (
        <>
          {/* Equipment selection — only for dive trips */}
          {trip.type === 'dive' && (
            <div className="card p-6">
              <h3 className="font-semibold text-ocean-950 mb-1 flex items-center gap-2">
                <Package className="h-4 w-4 text-ocean-400" />
                {t('equipment.title')}
              </h3>
              <p className="text-sm text-ocean-500 mb-4">{t('equipment.subtitle')}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {EQUIPMENT_TYPES.map(type => {
                  const isSelected = selectedEquipment.includes(type)
                  return (
                    <label
                      key={type}
                      className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                        isSelected ? 'border-ocean-500 bg-ocean-50' : 'border-ocean-100 hover:border-ocean-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleEquipment(type)}
                        className="rounded border-ocean-300 text-ocean-600 focus:ring-ocean-500"
                      />
                      <span className="text-lg">{EQUIPMENT_ICONS[type]}</span>
                      <p className="text-sm font-medium text-ocean-950">{EQUIPMENT_TYPE_LABELS[type]}</p>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Guest contact fields (only when not logged in) */}
          {!isLoggedIn && (
            <div className="card p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-ocean-950 mb-1">{t('guestData.title')}</h3>
                <p className="text-sm text-ocean-500">
                  {t('guestData.subtitle')}{' '}
                  <Link href={`/auth/login?redirect=/reserva?trip=${trip.id}`} className="text-ocean-600 hover:underline">
                    {t('guestData.signIn')}
                  </Link>{' '}
                  {t('guestData.signInSuffix')}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label" htmlFor="guest_name">{t('guestData.fullName')}</label>
                  <input
                    id="guest_name"
                    type="text"
                    required
                    className="form-input"
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    placeholder={t('guestData.namePlaceholder')}
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="guest_phone">{t('guestData.phone')}</label>
                  <input
                    id="guest_phone"
                    type="tel"
                    className="form-input"
                    value={guestPhone}
                    onChange={e => setGuestPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                  />
                </div>
              </div>
              <div>
                <label className="form-label" htmlFor="guest_email">{t('guestData.email')}</label>
                <input
                  id="guest_email"
                  type="email"
                  required
                  className="form-input"
                  value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)}
                  placeholder="correu@exemple.com"
                />
                <p className="text-xs text-ocean-400 mt-1">
                  {t('guestData.emailHint')}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="form-label" htmlFor="notes">{t('notes')}</label>
            <textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="form-input resize-none"
              placeholder={t('notesPlaceholder')}
            />
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                {isLoggedIn ? t('processing') : t('sending')}
              </>
            ) : isLoggedIn ? (
              t('confirmBtn', { price: formatPrice(trip.price) })
            ) : (
              t('requestBtn', { price: formatPrice(trip.price) })
            )}
          </button>

          {!isLoggedIn && (
            <p className="text-center text-xs text-ocean-400">
              {t('emailHint')}
            </p>
          )}
        </>
      )}

      {(isFull || isPast) && (
        <Link href="/calendario" className="btn-secondary w-full text-center">
          {t('viewOther')}
        </Link>
      )}
    </form>
  )
}
