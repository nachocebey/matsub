import { NextResponse } from 'next/server'
import { sendContactEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { name, email, subject, message, locale } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Falten camps obligatoris' }, { status: 400 })
    }

    await sendContactEmail({ name, email, subject, message, locale })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error en enviar el missatge' }, { status: 500 })
  }
}
