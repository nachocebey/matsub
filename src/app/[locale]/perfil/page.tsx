export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './ProfileForm'
import type { Profile } from '@/types'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = { title: 'El meu perfil' }

export default async function PerfilPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/perfil')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const t = await getTranslations('profile')

  return (
    <div className="min-h-screen bg-ocean-50 py-12 px-4 pt-24">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-ocean-950 mb-8">{t('title')}</h1>
        <ProfileForm profile={profile as Profile | null} userId={user.id} />
      </div>
    </div>
  )
}
