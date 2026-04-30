'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PhoneInput from 'react-phone-number-input'
import type { Value as E164Number } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Link from 'next/link'
import { toast } from '@/components/ui/Toaster'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { DifficultyBadge } from '@/components/ui/DifficultyBadge'
import { formatDate, formatTime, formatPrice, formatDuration, getI18n } from '@/lib/utils'
import { Calendar, Clock, Users, Euro, MapPin, Package, CheckCircle, AlertTriangle, Mail, Info, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TripWithAvailability, Profile, EquipmentType, PaymentMethod } from '@/types'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function StripeCheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations('booking')
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })
    if (stripeError) {
      setError(stripeError.message ?? 'Error en el pago')
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <button type="submit" disabled={!stripe || loading} className="btn-primary w-full py-3 text-base">
        {loading ? <><LoadingSpinner size="sm" /> {t('payment.processing')}</> : t('payment.confirm')}
      </button>
    </form>
  )
}

const EQUIPMENT_TYPES: EquipmentType[] = ['wetsuit', 'bcd', 'regulator', 'fins', 'mask']
const EQUIPMENT_ICONS: Record<string, string> = {
  wetsuit: '🤿', bcd: '🦺', regulator: '🔧', fins: '🐟', mask: '👓',
}

interface Props {
  trip: TripWithAvailability
  profile: Profile | null
  existingBooking: { id: string; status: string } | null
  spotImages?: string[]
}

export function BookingForm({ trip, profile, existingBooking, spotImages = [] }: Props) {
  const t = useTranslations('booking')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const isLoggedIn = !!profile
  const formOpenTime = useRef(Date.now())

  type Step = 'form' | 'stripe' | 'at_center_done' | 'email_sent' | 'stripe_done'

  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType[]>([])
  const [tankSize, setTankSize] = useState<'10L' | '12L' | '15L'>('12L')
  const [wantsNitrox, setWantsNitrox] = useState(false)
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('at_center')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  // Guest fields
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState<E164Number | undefined>()
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
          locale,
          payment_method: paymentMethod,
          needed_equipment: selectedEquipment,
          tank_size: tankSize,
          wants_nitrox: wantsNitrox,
          notes,
          // Guest fields (ignored by API if user is logged in)
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone ?? null,
          // Anti-spam
          _hp: honeypot,
          _t: formOpenTime.current,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error desconegut')

      if (data.clientSecret) {
        setClientSecret(data.clientSecret)
        setStep('stripe')
      } else if (data.pending) {
        setStep('email_sent')
      } else {
        setStep('at_center_done')
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

  // Registered user chose "pay at center"
  if (step === 'at_center_done') {
    return (
      <div className="card p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-ocean-950 mb-2">{t('atCenterDone.title')}</h2>
        <p className="text-ocean-600 mb-4">{t('atCenterDone.body')}</p>
        <div className="rounded-xl bg-ocean-50 border border-ocean-200 p-4 mb-6 flex items-start gap-3 text-left">
          <Info className="h-4 w-4 text-ocean-500 mt-0.5 shrink-0" />
          <p className="text-sm text-ocean-700">{t('atCenterDone.payLaterHint')}</p>
        </div>
        <Link href="/dashboard" className="btn-primary">{t('atCenterDone.viewBookings')}</Link>
      </div>
    )
  }

  // Guest booking submitted — awaiting email verification
  if (step === 'email_sent') {
    return (
      <div className="card p-8 text-center">
        <Mail className="h-12 w-12 text-ocean-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-ocean-950 mb-3">{t('checkEmail.title')}</h2>
        <p className="text-ocean-600 leading-relaxed mb-2">
          {t.rich('checkEmail.sent', {
            email: guestEmail,
            strong: chunks => <strong>{chunks}</strong>,
          })}
        </p>
        <p className="text-ocean-500 text-sm mb-8">
          {t('checkEmail.instruction')}
        </p>
        <Link href="/calendario" className="btn-secondary">{t('checkEmail.backToCalendar')}</Link>
      </div>
    )
  }

  // Guest paid with Stripe — booking confirmed
  if (step === 'stripe_done') {
    return (
      <div className="card p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-ocean-950 mb-2">{t('stripeDone.title')}</h2>
        <p className="text-ocean-600 mb-8">{t('stripeDone.body')}</p>
        <Link href="/calendario" className="btn-secondary">{t('stripeDone.backToCalendar')}</Link>
      </div>
    )
  }

  // Inline Stripe payment step
  if (step === 'stripe' && clientSecret) {
    const handleStripeSuccess = () => {
      if (isLoggedIn) {
        toast.success(t('success'))
        router.push('/dashboard')
      } else {
        setStep('stripe_done')
      }
    }

    return (
      <div className="space-y-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-ocean-950">{getI18n(trip.title_i18n, locale, trip.title)}</p>
              <p className="text-sm text-ocean-500">{formatDate(trip.date, locale)}</p>
            </div>
            <p className="text-lg font-bold text-ocean-950">{formatPrice(trip.price)}</p>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold text-ocean-950 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-ocean-400" />
            {t('payment.cardTitle')}
          </h2>
          <Elements stripe={stripePromise} options={{ clientSecret, locale: locale === 'en' ? 'en' : 'es' }}>
            <StripeCheckoutForm onSuccess={handleStripeSuccess} />
          </Elements>
        </div>
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
      <div className="card overflow-hidden">
        {spotImages[0] && (
          <div className="relative aspect-[16/7] w-full">
            <Image src={spotImages[0]} alt={getI18n(trip.title_i18n, locale, trip.title)} fill sizes="(max-width: 672px) 100vw, 672px" className="object-cover" />
          </div>
        )}
        <div className="p-6">
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
                      <p className="text-sm font-medium text-ocean-950">{tCommon(`equipment.${type}`)}</p>
                    </label>
                  )
                })}
              </div>

              <div className="border-t border-ocean-100 pt-4 mt-2 space-y-4">
                {/* Tank size */}
                <div>
                  <p className="text-sm font-medium text-ocean-950 mb-2">Tamaño de botella</p>
                  <div className="flex gap-2">
                    {(['10L', '12L', '15L'] as const).map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setTankSize(size)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          tankSize === size
                            ? 'bg-ocean-600 text-white border-ocean-600'
                            : 'bg-white text-ocean-600 border-ocean-200 hover:border-ocean-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nitrox */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wantsNitrox}
                    onChange={e => setWantsNitrox(e.target.checked)}
                    className="rounded border-ocean-300 text-ocean-600 focus:ring-ocean-500"
                  />
                  <span className="text-sm font-medium text-ocean-950">Quiero Nitrox</span>
                  <div className="relative group">
                    <Info className="h-4 w-4 text-amber-500 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-ocean-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 leading-relaxed text-center shadow-lg">
                      Para bucear con Nitrox es necesario disponer de la certificación Enriched Air Diver (PADI) o equivalente.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ocean-900" />
                    </div>
                  </div>
                </label>
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
                  <label className="form-label">{t('guestData.phone')}</label>
                  <PhoneInput
                    value={guestPhone}
                    onChange={setGuestPhone}
                    defaultCountry="ES"
                    international
                    className="phone-input"
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

          {/* Payment method */}
          <div className="card p-6">
            <h3 className="font-semibold text-ocean-950 mb-1">{t('payment.title')}</h3>
            <p className="text-sm text-ocean-500 mb-4">{t('payment.subtitle')}</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'stripe' as PaymentMethod, icon: CreditCard, label: t('payment.payNow'), desc: t('payment.payNowDesc') },
                { value: 'at_center' as PaymentMethod, icon: MapPin, label: t('payment.atCenter'), desc: t('payment.atCenterDesc') },
              ] as const).map(({ value, icon: Icon, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentMethod(value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-colors',
                    paymentMethod === value
                      ? 'border-ocean-500 bg-ocean-50'
                      : 'border-ocean-100 hover:border-ocean-300'
                  )}
                >
                  <Icon className={cn('h-6 w-6', paymentMethod === value ? 'text-ocean-600' : 'text-ocean-400')} />
                  <span className="text-sm font-medium text-ocean-950">{label}</span>
                  <span className="text-xs text-ocean-500">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Medical disclaimer */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed">
              <span className="font-semibold">{t('medicalWarningTitle')}: </span>
              {t('medicalWarning')}
            </p>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                {t('processing')}
              </>
            ) : paymentMethod === 'stripe' ? (
              t('payment.continueBtn', { price: formatPrice(trip.price) })
            ) : isLoggedIn ? (
              t('confirmBtn', { price: formatPrice(trip.price) })
            ) : (
              t('requestBtn', { price: formatPrice(trip.price) })
            )}
          </button>

          {!isLoggedIn && paymentMethod === 'at_center' && (
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
