import { Resend } from 'resend'
import { formatDate, formatTime } from './utils'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'MATSUB <onboarding@resend.dev>'
const ADMIN_EMAIL = 'n.cebey@gmail.com'

export async function sendBookingConfirmation({
  to,
  name,
  tripTitle,
  tripDate,
  tripTime,
  bookingId,
}: {
  to: string
  name: string
  tripTitle: string
  tripDate: string
  tripTime: string
  bookingId: string
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Reserva confirmada: ${tripTitle}`,
    html: `
<!DOCTYPE html>
<html lang="ca">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f0f9ff;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:#0369a1;padding:32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🌊 MATSUB</h1>
          <p style="margin:8px 0 0;color:#bae6fd;font-size:14px;">Centre de Busseig de Mataró</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;color:#082f49;font-size:20px;">Reserva confirmada! ✅</h2>
          <p style="margin:0 0 24px;color:#0369a1;font-size:16px;">Hola, <strong>${name}</strong>!</p>
          <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
            La teva reserva per a la sortida <strong>${tripTitle}</strong> ha estat processada correctament.
          </p>

          <!-- Trip details -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            <tr><td style="padding:20px;">
              <table width="100%" cellpadding="4" cellspacing="0">
                <tr>
                  <td style="color:#0369a1;font-size:13px;font-weight:600;width:40%;">📅 Data</td>
                  <td style="color:#082f49;font-size:14px;font-weight:600;">${formatDate(tripDate)}</td>
                </tr>
                <tr>
                  <td style="color:#0369a1;font-size:13px;font-weight:600;">⏰ Hora</td>
                  <td style="color:#082f49;font-size:14px;">${formatTime(tripTime)}</td>
                </tr>
                <tr>
                  <td style="color:#0369a1;font-size:13px;font-weight:600;">🔖 Nº reserva</td>
                  <td style="color:#082f49;font-size:12px;font-family:monospace;">${bookingId.split('-')[0].toUpperCase()}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
            Et confirmarem la reserva en breu. Si tens qualsevol dubte, no dubtis en contactar-nos.
          </p>

          <a href="${siteUrl}/dashboard" style="display:inline-block;background:#0369a1;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">
            Veure les meves reserves
          </a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:13px;">
            MATSUB · Carrer de la Mar, 42 · 08301 Mataró<br/>
            <a href="mailto:info@matsub.cat" style="color:#0369a1;">info@matsub.cat</a> ·
            <a href="tel:+34937001234" style="color:#0369a1;">+34 937 00 12 34</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  })
}

export async function sendGuestBookingVerification({
  to,
  name,
  tripTitle,
  tripDate,
  tripTime,
  verificationUrl,
}: {
  to: string
  name: string
  tripTitle: string
  tripDate: string
  tripTime: string
  verificationUrl: string
}) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Confirma la teva reserva: ${tripTitle}`,
    html: `
<!DOCTYPE html>
<html lang="ca">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f0f9ff;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0369a1;padding:32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🌊 MATSUB</h1>
          <p style="margin:8px 0 0;color:#bae6fd;font-size:14px;">Centre de Busseig de Mataró</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;color:#082f49;font-size:20px;">Confirma la teva reserva</h2>
          <p style="margin:0 0 8px;color:#0369a1;font-size:16px;">Hola, <strong>${name}</strong>!</p>
          <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
            Has sol·licitat una reserva per a <strong>${tripTitle}</strong> el <strong>${formatDate(tripDate)}</strong> a les <strong>${formatTime(tripTime)}</strong>.
          </p>
          <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
            Per confirmar la teva plaça, fes clic al botó següent. El link caduca en <strong>24 hores</strong>.
          </p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${verificationUrl}" style="display:inline-block;background:#0369a1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
              ✅ Confirmar reserva
            </a>
          </div>
          <p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;">
            Si no has fet cap reserva, ignora aquest correu.
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:13px;">
            MATSUB · Carrer de la Mar, 42 · 08301 Mataró<br/>
            <a href="mailto:info@matsub.cat" style="color:#0369a1;">info@matsub.cat</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  })
}

export async function sendContactEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string
  email: string
  subject: string
  message: string
}) {
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    replyTo: email,
    subject: `[MATSUB Contacte] ${subject}`,
    html: `
<html><body style="font-family:system-ui,sans-serif;color:#082f49;padding:32px;">
  <h2 style="color:#0369a1;">Nou missatge de contacte</h2>
  <table cellpadding="8" cellspacing="0" style="background:#f0f9ff;border-radius:8px;margin-bottom:16px;">
    <tr><td style="font-weight:600;color:#0369a1;width:100px;">Nom:</td><td>${name}</td></tr>
    <tr><td style="font-weight:600;color:#0369a1;">Email:</td><td><a href="mailto:${email}">${email}</a></td></tr>
    <tr><td style="font-weight:600;color:#0369a1;">Assumpte:</td><td>${subject}</td></tr>
  </table>
  <div style="background:#ffffff;border:1px solid #bae6fd;border-radius:8px;padding:16px;white-space:pre-wrap;">${message}</div>
</body></html>
    `,
  })

  // Auto-reply to sender
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Hem rebut el teu missatge – MATSUB',
    html: `
<html><body style="font-family:system-ui,sans-serif;color:#082f49;padding:32px;">
  <h2 style="color:#0369a1;">Gràcies per contactar-nos, ${name}!</h2>
  <p>Hem rebut el teu missatge i et respondrem en les pròximes 24 hores.</p>
  <p style="color:#475569;">— L'equip de MATSUB</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
  <p style="font-size:12px;color:#94a3b8;">MATSUB · Carrer de la Mar, 42 · 08301 Mataró · info@matsub.cat</p>
</body></html>
    `,
  })
}
