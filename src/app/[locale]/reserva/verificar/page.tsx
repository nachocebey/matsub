export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = { title: 'Verificació de reserva' }

export default async function VerificarPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token
  const t = await getTranslations('verify')

  if (!token) {
    return <Result type="invalid" t={t} />
  }

  const admin = createAdminClient()

  const { data: booking } = await admin
    .from('bookings')
    .select('id, verified, status, guest_name, trip:trips(title, date)')
    .eq('verification_token', token)
    .single()

  if (!booking) {
    return <Result type="invalid" t={t} />
  }

  // Supabase returns joined fields as arrays in some versions — normalise
  const tripRaw = Array.isArray(booking.trip) ? booking.trip[0] : booking.trip
  const trip = tripRaw as { title: string; date: string } | null

  if (booking.verified) {
    return <Result type="already" name={booking.guest_name} trip={trip} t={t} />
  }

  if (booking.status === 'cancelled') {
    return <Result type="cancelled" t={t} />
  }

  await admin
    .from('bookings')
    .update({ verified: true, verification_token: null })
    .eq('id', booking.id)

  return <Result type="success" name={booking.guest_name} trip={trip} t={t} />
}

function Result({
  type,
  name,
  trip,
  t,
}: {
  type: 'success' | 'already' | 'invalid' | 'cancelled'
  name?: string | null
  trip?: { title: string; date: string } | null
  t: Awaited<ReturnType<typeof getTranslations<'verify'>>>
}) {
  const configs = {
    success: {
      icon: <CheckCircle className="h-14 w-14 text-green-500" />,
      title: t('success.title'),
      message: t('success.message', { name: name ?? '', trip: trip?.title ?? '' }),
      color: 'bg-green-50 border-green-200',
    },
    already: {
      icon: <CheckCircle className="h-14 w-14 text-ocean-500" />,
      title: t('already.title'),
      message: t('already.message', { trip: trip?.title ?? '' }),
      color: 'bg-ocean-50 border-ocean-200',
    },
    invalid: {
      icon: <XCircle className="h-14 w-14 text-red-400" />,
      title: t('invalid.title'),
      message: t('invalid.message'),
      color: 'bg-red-50 border-red-200',
    },
    cancelled: {
      icon: <Clock className="h-14 w-14 text-yellow-500" />,
      title: t('cancelled.title'),
      message: t('cancelled.message'),
      color: 'bg-yellow-50 border-yellow-200',
    },
  }

  const c = configs[type]

  return (
    <div className="min-h-screen flex items-center justify-center bg-ocean-50 px-4 pt-16">
      <div className={`card max-w-md w-full p-10 text-center border ${c.color}`}>
        <div className="flex justify-center mb-5">{c.icon}</div>
        <h1 className="text-2xl font-bold text-ocean-950 mb-3">{c.title}</h1>
        <p className="text-ocean-600 leading-relaxed mb-8">{c.message}</p>
        <div className="flex flex-col gap-3">
          <Link href="/calendario" className="btn-primary">{t('viewTrips')}</Link>
          <Link href="/contacto" className="btn-secondary">{t('contactUs')}</Link>
        </div>
      </div>
    </div>
  )
}
