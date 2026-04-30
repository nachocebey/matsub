import { Resend } from 'resend'
import { formatDate, formatTime } from './utils'
import { BRANDING } from '@/config/branding'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = `${BRANDING.name} <${process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'}>`
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'n.cebey@gmail.com'

type Locale = 'es' | 'ca' | 'en'

const t = {
  es: {
    bookingConfirmed: {
      subject: (title: string) => `Reserva confirmada: ${title}`,
      heading: 'Reserva confirmada ✅',
      greeting: (name: string) => `Hola, <strong>${name}</strong>!`,
      body: (title: string) => `Tu reserva para la salida <strong>${title}</strong> ha sido procesada correctamente.`,
      dateLabel: '📅 Fecha',
      timeLabel: '⏰ Hora',
      bookingLabel: '🔖 Nº reserva',
      arriveEarly: 'Recuerda presentarte al centro <strong>30 minutos antes</strong> de la hora de salida para preparar el equipo y completar los trámites.',
      cta: 'Ver mis reservas',
      addToCalendar: '📅 Añadir al Google Calendar',
    },
    guestVerification: {
      subject: (title: string) => `Confirma tu reserva: ${title}`,
      heading: 'Confirma tu reserva',
      greeting: (name: string) => `Hola, <strong>${name}</strong>!`,
      body: (title: string, date: string, time: string) =>
        `Has solicitado una reserva para <strong>${title}</strong> el <strong>${date}</strong> a las <strong>${time}</strong>.`,
      instruction: 'Para confirmar tu plaza, haz clic en el botón siguiente. El link caduca en <strong>24 horas</strong>.',
      cta: '✅ Confirmar reserva',
      ignore: 'Si no has hecho ninguna reserva, ignora este correo.',
    },
    contactReply: {
      subject: (brand: string) => `Hemos recibido tu mensaje – ${brand}`,
      heading: (name: string) => `¡Gracias por contactarnos, ${name}!`,
      body: 'Hemos recibido tu mensaje y te responderemos en las próximas 24 horas.',
      team: (brand: string) => `— El equipo de ${brand}`,
    },
  },
  ca: {
    bookingConfirmed: {
      subject: (title: string) => `Reserva confirmada: ${title}`,
      heading: 'Reserva confirmada ✅',
      greeting: (name: string) => `Hola, <strong>${name}</strong>!`,
      body: (title: string) => `La teva reserva per a la sortida <strong>${title}</strong> ha estat processada correctament.`,
      dateLabel: '📅 Data',
      timeLabel: '⏰ Hora',
      bookingLabel: '🔖 Nº reserva',
      arriveEarly: 'Recorda presentar-te al centre <strong>30 minuts abans</strong> de l\'hora de sortida per preparar l\'equip i completar els tràmits.',
      cta: 'Veure les meves reserves',
      addToCalendar: '📅 Afegir al Google Calendar',
    },
    guestVerification: {
      subject: (title: string) => `Confirma la teva reserva: ${title}`,
      heading: 'Confirma la teva reserva',
      greeting: (name: string) => `Hola, <strong>${name}</strong>!`,
      body: (title: string, date: string, time: string) =>
        `Has sol·licitat una reserva per a <strong>${title}</strong> el <strong>${date}</strong> a les <strong>${time}</strong>.`,
      instruction: 'Per confirmar la teva plaça, fes clic al botó següent. El link caduca en <strong>24 hores</strong>.',
      cta: '✅ Confirmar reserva',
      ignore: 'Si no has fet cap reserva, ignora aquest correu.',
    },
    contactReply: {
      subject: (brand: string) => `Hem rebut el teu missatge – ${brand}`,
      heading: (name: string) => `Gràcies per contactar-nos, ${name}!`,
      body: 'Hem rebut el teu missatge i et respondrem en les pròximes 24 hores.',
      team: (brand: string) => `— L'equip de ${brand}`,
    },
  },
  en: {
    bookingConfirmed: {
      subject: (title: string) => `Booking confirmed: ${title}`,
      heading: 'Booking confirmed ✅',
      greeting: (name: string) => `Hi, <strong>${name}</strong>!`,
      body: (title: string) => `Your booking for the trip <strong>${title}</strong> has been successfully processed.`,
      dateLabel: '📅 Date',
      timeLabel: '⏰ Time',
      bookingLabel: '🔖 Booking #',
      arriveEarly: 'Please arrive at the center <strong>30 minutes before</strong> the departure time to prepare your equipment and complete the paperwork.',
      cta: 'View my bookings',
      addToCalendar: '📅 Add to Google Calendar',
    },
    guestVerification: {
      subject: (title: string) => `Confirm your booking: ${title}`,
      heading: 'Confirm your booking',
      greeting: (name: string) => `Hi, <strong>${name}</strong>!`,
      body: (title: string, date: string, time: string) =>
        `You have requested a booking for <strong>${title}</strong> on <strong>${date}</strong> at <strong>${time}</strong>.`,
      instruction: 'To confirm your spot, click the button below. The link expires in <strong>24 hours</strong>.',
      cta: '✅ Confirm booking',
      ignore: "If you didn't make a booking, please ignore this email.",
    },
    contactReply: {
      subject: (brand: string) => `We received your message – ${brand}`,
      heading: (name: string) => `Thanks for reaching out, ${name}!`,
      body: "We've received your message and will get back to you within 24 hours.",
      team: (brand: string) => `— The ${brand} team`,
    },
  },
}

function googleCalendarUrl(tripTitle: string, tripDate: string, tripTime: string, bookingId: string): string {
  const dateStr = tripDate.replace(/-/g, '')
  const [h, m] = tripTime.split(':').map(Number)
  const startTime = `${h.toString().padStart(2, '0')}${(m || 0).toString().padStart(2, '0')}00`
  const endH = (h + 3) % 24
  const endTime = `${endH.toString().padStart(2, '0')}${(m || 0).toString().padStart(2, '0')}00`
  const dates = `${dateStr}T${startTime}/${dateStr}T${endTime}`
  const text = encodeURIComponent(`🤿 ${tripTitle}`)
  const details = encodeURIComponent(`Reserva #${bookingId.split('-')[0].toUpperCase()}\n\n⏰ Recuerda llegar 30 minutos antes para preparar el equipo.\n\n${BRANDING.name} · ${BRANDING.phone}`)
  const location = encodeURIComponent(BRANDING.address.replace('\n', ', '))
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`
}

function getLang(locale?: string): Locale {
  if (locale === 'ca' || locale === 'en') return locale
  return 'es'
}

function emailShell(lang: Locale, content: string) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f0f9ff;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0369a1;padding:32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🌊 ${BRANDING.name}</h1>
          <p style="margin:8px 0 0;color:#bae6fd;font-size:14px;">${BRANDING.tagline}</p>
        </td></tr>
        ${content}
        <tr><td style="padding:24px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:13px;">
            ${BRANDING.name} · ${BRANDING.address.replace('\n', ' · ')}<br/>
            <a href="mailto:${BRANDING.email}" style="color:#0369a1;">${BRANDING.email}</a> ·
            <a href="tel:${BRANDING.phone.replace(/\s/g, '')}" style="color:#0369a1;">${BRANDING.phone}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendBookingConfirmation({
  to, name, tripTitle, tripDate, tripTime, bookingId, locale,
}: {
  to: string
  name: string
  tripTitle: string
  tripDate: string
  tripTime: string
  bookingId: string
  locale?: string
}) {
  const lang = getLang(locale)
  const tr = t[lang].bookingConfirmed
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const calUrl = googleCalendarUrl(tripTitle, tripDate, tripTime, bookingId)

  await resend.emails.send({
    from: FROM,
    to,
    subject: tr.subject(tripTitle),
    html: emailShell(lang, `
      <tr><td style="padding:32px;">
        <h2 style="margin:0 0 16px;color:#082f49;font-size:20px;">${tr.heading}</h2>
        <p style="margin:0 0 24px;color:#0369a1;font-size:16px;">${tr.greeting(name)}</p>
        <p style="margin:0 0 24px;color:#475569;line-height:1.6;">${tr.body(tripTitle)}</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border-radius:12px;overflow:hidden;margin-bottom:24px;">
          <tr><td style="padding:20px;">
            <table width="100%" cellpadding="4" cellspacing="0">
              <tr>
                <td style="color:#0369a1;font-size:13px;font-weight:600;width:40%;">${tr.dateLabel}</td>
                <td style="color:#082f49;font-size:14px;font-weight:600;">${formatDate(tripDate, lang)}</td>
              </tr>
              <tr>
                <td style="color:#0369a1;font-size:13px;font-weight:600;">${tr.timeLabel}</td>
                <td style="color:#082f49;font-size:14px;">${formatTime(tripTime)}</td>
              </tr>
              <tr>
                <td style="color:#0369a1;font-size:13px;font-weight:600;">${tr.bookingLabel}</td>
                <td style="color:#082f49;font-size:12px;font-family:monospace;">${bookingId.split('-')[0].toUpperCase()}</td>
              </tr>
            </table>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;margin-bottom:24px;">
          <tr><td style="padding:16px;">
            <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">${tr.arriveEarly}</p>
          </td></tr>
        </table>
        <a href="${siteUrl}/dashboard" style="display:inline-block;background:#0369a1;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;margin-bottom:12px;">${tr.cta}</a>
        <br/>
        <a href="${calUrl}" style="display:inline-block;background:#ffffff;color:#0369a1;text-decoration:none;padding:11px 28px;border-radius:8px;font-weight:600;font-size:14px;border:2px solid #0369a1;">${tr.addToCalendar}</a>
      </td></tr>
    `),
  })
}

export async function sendGuestBookingVerification({
  to, name, tripTitle, tripDate, tripTime, verificationUrl, locale,
}: {
  to: string
  name: string
  tripTitle: string
  tripDate: string
  tripTime: string
  verificationUrl: string
  locale?: string
}) {
  const lang = getLang(locale)
  const tr = t[lang].guestVerification

  await resend.emails.send({
    from: FROM,
    to,
    subject: tr.subject(tripTitle),
    html: emailShell(lang, `
      <tr><td style="padding:32px;">
        <h2 style="margin:0 0 16px;color:#082f49;font-size:20px;">${tr.heading}</h2>
        <p style="margin:0 0 8px;color:#0369a1;font-size:16px;">${tr.greeting(name)}</p>
        <p style="margin:0 0 24px;color:#475569;line-height:1.6;">${tr.body(tripTitle, formatDate(tripDate, lang), formatTime(tripTime))}</p>
        <p style="margin:0 0 24px;color:#475569;line-height:1.6;">${tr.instruction}</p>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${verificationUrl}" style="display:inline-block;background:#0369a1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">${tr.cta}</a>
        </div>
        <p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;">${tr.ignore}</p>
      </td></tr>
    `),
  })
}

export async function sendContactEmail({
  name, email, subject, message, locale,
}: {
  name: string
  email: string
  subject: string
  message: string
  locale?: string
}) {
  const lang = getLang(locale)
  const tr = t[lang].contactReply

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    replyTo: email,
    subject: `[${BRANDING.name}] ${subject}`,
    html: `<html><body style="font-family:system-ui,sans-serif;color:#082f49;padding:32px;">
  <h2 style="color:#0369a1;">Nuevo mensaje de contacto</h2>
  <table cellpadding="8" cellspacing="0" style="background:#f0f9ff;border-radius:8px;margin-bottom:16px;">
    <tr><td style="font-weight:600;color:#0369a1;width:100px;">Nombre:</td><td>${name}</td></tr>
    <tr><td style="font-weight:600;color:#0369a1;">Email:</td><td><a href="mailto:${email}">${email}</a></td></tr>
    <tr><td style="font-weight:600;color:#0369a1;">Asunto:</td><td>${subject}</td></tr>
  </table>
  <div style="background:#ffffff;border:1px solid #bae6fd;border-radius:8px;padding:16px;white-space:pre-wrap;">${message}</div>
</body></html>`,
  })

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: tr.subject(BRANDING.name),
    html: `<html><body style="font-family:system-ui,sans-serif;color:#082f49;padding:32px;">
  <h2 style="color:#0369a1;">${tr.heading(name)}</h2>
  <p>${tr.body}</p>
  <p style="color:#475569;">${tr.team(BRANDING.name)}</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
  <p style="font-size:12px;color:#94a3b8;">${BRANDING.name} · ${BRANDING.address.replace('\n', ' · ')} · ${BRANDING.email}</p>
</body></html>`,
  })
}
