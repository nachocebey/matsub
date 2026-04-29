import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBookingConfirmation } from '@/lib/email'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook no configurado' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object
    const booking_id = intent.metadata?.booking_id

    if (booking_id) {
      const admin = createAdminClient()

      const { data: booking } = await admin
        .from('bookings')
        .select('id, user_id, guest_name, guest_email, trip:trips(title, date, time)')
        .eq('id', booking_id)
        .single()

      await admin
        .from('bookings')
        .update({ status: 'confirmed', paid_at: new Date().toISOString(), verified: true })
        .eq('id', booking_id)

      // Send confirmation email to guest users (registered users get it at booking time)
      if (booking && !booking.user_id && booking.guest_email) {
        const trip = booking.trip as unknown as { title: string; date: string; time: string } | null
        try {
          await sendBookingConfirmation({
            to: booking.guest_email,
            name: booking.guest_name ?? 'Cliente',
            tripTitle: trip?.title ?? '',
            tripDate: trip?.date ?? '',
            tripTime: trip?.time ?? '',
            bookingId: booking_id,
          })
        } catch { /* non-blocking */ }
      }
    }
  }

  return NextResponse.json({ received: true })
}
