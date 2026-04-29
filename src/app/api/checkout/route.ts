import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const { booking_id } = await request.json()

  if (!booking_id) {
    return NextResponse.json({ error: 'booking_id requerido' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, trip_id, status, stripe_payment_intent_id, trip:trips(title, price)')
    .eq('id', booking_id)
    .eq('user_id', user.id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  }

  if (booking.stripe_payment_intent_id) {
    // Retrieve existing intent instead of creating a new one
    const existing = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id)
    if (existing.status !== 'canceled') {
      return NextResponse.json({ clientSecret: existing.client_secret })
    }
  }

  const trip = booking.trip as unknown as { title: string; price: number } | null
  if (!trip) {
    return NextResponse.json({ error: 'Salida no encontrada' }, { status: 404 })
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(trip.price * 100), // cents
    currency: 'eur',
    metadata: { booking_id, user_id: user.id, trip_title: trip.title },
  })

  await supabase
    .from('bookings')
    .update({ stripe_payment_intent_id: paymentIntent.id })
    .eq('id', booking_id)

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
