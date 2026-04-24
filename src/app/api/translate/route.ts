import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// MyMemory: free tier, no key needed (1000 words/day)
// Set MYMEMORY_EMAIL in .env.local to raise limit to 10,000 words/day
const MYMEMORY_EMAIL = process.env.MYMEMORY_EMAIL ?? ''

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { text, source, target } = await request.json()
  if (!text || !source || !target) {
    return NextResponse.json({ error: 'Missing text, source or target' }, { status: 400 })
  }

  const params = new URLSearchParams({
    q: text,
    langpair: `${source}|${target}`,
    ...(MYMEMORY_EMAIL && { de: MYMEMORY_EMAIL }),
  })

  const res = await fetch(`https://api.mymemory.translated.net/get?${params}`)

  if (!res.ok) {
    return NextResponse.json({ error: `MyMemory error: ${res.status}` }, { status: 502 })
  }

  const data = await res.json()

  if (data.responseStatus !== 200) {
    return NextResponse.json({ error: data.responseDetails ?? 'Translation failed' }, { status: 502 })
  }

  return NextResponse.json({ translatedText: data.responseData.translatedText })
}
