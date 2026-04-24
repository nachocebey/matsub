'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function ResetPasswordForm() {
  const t = useTranslations('auth.reset')
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const email = (new FormData(e.currentTarget)).get('email') as string

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    })

    if (error) {
      toast.error(t('error'))
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-ocean-100 flex items-center justify-center mx-auto">
          <Mail className="h-6 w-6 text-ocean-600" />
        </div>
        <h3 className="font-semibold text-ocean-950">{t('successTitle')}</h3>
        <p className="text-sm text-ocean-600">
          {t('successDesc')}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="form-label" htmlFor="email">{t('email')}</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="form-input"
          placeholder="correu@exemple.com"
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? (
          <>
            <LoadingSpinner size="sm" />
            {t('loading')}
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            {t('submit')}
          </>
        )}
      </button>
    </form>
  )
}
