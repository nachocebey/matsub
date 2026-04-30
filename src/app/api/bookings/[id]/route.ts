import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { sendBookingConfirmation } from '@/lib/email'
import type { BookingStatus } from '@/types'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { status, locale }: { status: BookingStatus; locale?: string } = await request.json()

  if (!status) {
    return NextResponse.json({ error: 'status requerido' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await admin.from('bookings').update({ status }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (status === 'confirmed') {
    const { data: booking } = await admin
      .from('bookings')
      .select(`
        id, guest_name, guest_email, user_id,
        trip:trips(title, title_i18n, date, time),
        profile:profiles(full_name)
      `)
      .eq('id', params.id)
      .single()

    if (booking) {
      const profile = Array.isArray(booking.profile) ? booking.profile[0] : booking.profile
      const name = profile?.full_name ?? booking.guest_name ?? ''
      const email = booking.guest_email ?? (
        booking.user_id
          ? (await admin.auth.admin.getUserById(booking.user_id)).data.user?.email
          : null
      )
      const tripRaw = Array.isArray(booking.trip) ? booking.trip[0] : booking.trip
      const trip = tripRaw as { title: string; title_i18n?: { es?: string }; date: string; time: string } | null

      if (email && trip) {
        await sendBookingConfirmation({
          to: email,
          name,
          tripTitle: trip.title_i18n?.es ?? trip.title,
          tripDate: trip.date,
          tripTime: trip.time,
          bookingId: params.id,
          locale,
        }).catch(() => {})
      }
    }
  }

  return NextResponse.json({ ok: true })
}
