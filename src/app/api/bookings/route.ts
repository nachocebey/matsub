import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { sendBookingConfirmation, sendGuestBookingVerification } from '@/lib/email'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  const body = await request.json()
  const { trip_id, needed_equipment = [], notes, guest_name, guest_email, guest_phone, _hp, _t } = body

  // Honeypot: bots fill hidden fields, humans don't
  if (_hp) {
    return NextResponse.json({ error: 'Bot detectat' }, { status: 400 })
  }

  // Timing check: form must be open at least 3 seconds
  if (!_t || Date.now() - _t < 3000) {
    return NextResponse.json({ error: 'Massa ràpid. Torna-ho a provar.' }, { status: 400 })
  }

  if (!trip_id) {
    return NextResponse.json({ error: 'trip_id és obligatori' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  // Fetch trip (using user client — respects RLS for active trips)
  const { data: trip } = await supabase
    .from('trips_with_availability')
    .select('*')
    .eq('id', trip_id)
    .single()

  if (!trip) return NextResponse.json({ error: 'Sortida no trobada' }, { status: 404 })
  if (trip.status !== 'active') return NextResponse.json({ error: 'Aquesta sortida no està disponible' }, { status: 400 })
  if (trip.available_spots <= 0) return NextResponse.json({ error: 'Aquesta sortida és completa' }, { status: 400 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // ── Authenticated booking ──────────────────────────────────────────────────
  if (user) {
    const { data: existing } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('trip_id', trip_id)
      .single()

    if (existing && existing.status !== 'cancelled') {
      return NextResponse.json({ error: 'Ja tens una reserva per a aquesta sortida' }, { status: 409 })
    }

    let bookingId: string

    if (existing?.status === 'cancelled') {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'pending', notes: notes || null, needed_equipment, verified: true })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      bookingId = data.id
    } else {
      const { data, error } = await supabase
        .from('bookings')
        .insert({ user_id: user.id, trip_id, status: 'pending', notes: notes || null, needed_equipment, verified: true })
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      bookingId = data.id
    }

    try {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      await sendBookingConfirmation({
        to: user.email!,
        name: profile?.full_name ?? 'Bussejador',
        tripTitle: trip.title,
        tripDate: trip.date,
        tripTime: trip.time,
        bookingId,
      })
    } catch { /* non-blocking */ }

    return NextResponse.json({ bookingId }, { status: 201 })
  }

  // ── Guest booking ──────────────────────────────────────────────────────────
  if (!guest_name || !guest_email) {
    return NextResponse.json({ error: 'Nom i email obligatoris per a reserves sense compte' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(guest_email)) {
    return NextResponse.json({ error: 'Email no vàlid' }, { status: 400 })
  }

  // Check for existing guest booking for this trip+email
  const { data: existingGuest } = await admin
    .from('bookings')
    .select('id, status, verified')
    .eq('guest_email', guest_email.toLowerCase())
    .eq('trip_id', trip_id)
    .single()

  if (existingGuest && existingGuest.status !== 'cancelled') {
    return NextResponse.json({ error: 'Ja existeix una reserva amb aquest email per a aquesta sortida' }, { status: 409 })
  }

  const verificationToken = randomUUID()

  const { data: booking, error } = await admin
    .from('bookings')
    .insert({
      trip_id,
      guest_name: guest_name.trim(),
      guest_email: guest_email.toLowerCase().trim(),
      guest_phone: guest_phone?.trim() || null,
      needed_equipment,
      notes: notes || null,
      status: 'pending',
      verified: false,
      verification_token: verificationToken,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    const verificationUrl = `${siteUrl}/reserva/verificar?token=${verificationToken}`
    await sendGuestBookingVerification({
      to: guest_email,
      name: guest_name,
      tripTitle: trip.title,
      tripDate: trip.date,
      tripTime: trip.time,
      verificationUrl,
    })
  } catch {
    // If email fails, delete the booking so they can retry
    await admin.from('bookings').delete().eq('id', booking.id)
    return NextResponse.json({ error: "Error en enviar l'email de verificació. Torna-ho a provar." }, { status: 500 })
  }

  return NextResponse.json({ pending: true }, { status: 201 })
}
