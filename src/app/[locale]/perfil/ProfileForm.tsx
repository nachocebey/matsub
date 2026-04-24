'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Save } from 'lucide-react'
import type { Profile } from '@/types'
import { useTranslations } from 'next-intl'

export function ProfileForm({ profile, userId }: { profile: Profile | null; userId: string }) {
  const t = useTranslations('profile')
  const supabase = createClient()

  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName] = useState(profile?.last_name ?? '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const full_name = `${firstName} ${lastName}`.trim()

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name,
      })
      .eq('id', userId)

    if (error) {
      toast.error(t('saveError'))
    } else {
      toast.success(t('saveSuccess'))
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-ocean-950">{t('personalData')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="form-label" htmlFor="first_name">{t('firstName')}</label>
            <input
              id="first_name"
              type="text"
              className="form-input"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder={t('firstNamePlaceholder')}
              required
            />
          </div>
          <div>
            <label className="form-label" htmlFor="last_name">{t('lastName')}</label>
            <input
              id="last_name"
              type="text"
              className="form-input"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder={t('lastNamePlaceholder')}
              required
            />
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? (
          <>
            <LoadingSpinner size="sm" />
            {t('saving')}
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            {t('save')}
          </>
        )}
      </button>
    </form>
  )
}
