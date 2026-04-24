'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { CERTIFICATION_LABELS } from '@/lib/utils'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import type { CertificationLevel } from '@/types'
import { useTranslations } from 'next-intl'
import PhoneInput from 'react-phone-number-input'
import type { Value as E164Number } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

const CERTS: CertificationLevel[] = ['none', 'open_water', 'advanced', 'rescue', 'divemaster']

export function RegisterForm() {
  const t = useTranslations('auth.register')
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phone, setPhone] = useState<E164Number | undefined>()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string
    const password = form.get('password') as string
    const first_name = (form.get('first_name') as string).trim()
    const last_name = (form.get('last_name') as string).trim()
    const full_name = `${first_name} ${last_name}`.trim()
    const certification_level = form.get('certification_level') as CertificationLevel

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name, last_name, full_name, phone: phone ?? '', certification_level },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? t('errorExists')
        : t('errorGeneral'))
      setLoading(false)
      return
    }

    toast.success(t('success'))
    router.push('/auth/login')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="form-label" htmlFor="first_name">{t('firstName')}</label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            autoComplete="given-name"
            required
            className="form-input"
            placeholder={t('firstNamePlaceholder')}
          />
        </div>
        <div>
          <label className="form-label" htmlFor="last_name">{t('lastName')}</label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            autoComplete="family-name"
            required
            className="form-input"
            placeholder={t('lastNamePlaceholder')}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="form-label" htmlFor="email">{t('email')}</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="form-input"
            placeholder={t('emailPlaceholder')}
          />
        </div>
        <div>
          <label className="form-label">{t('phone')}</label>
          <PhoneInput
            value={phone}
            onChange={setPhone}
            defaultCountry="ES"
            international
            className="phone-input"
          />
        </div>
      </div>

      <div>
        <label className="form-label" htmlFor="certification_level">{t('certification')}</label>
        <select id="certification_level" name="certification_level" className="form-input">
          {CERTS.map(c => (
            <option key={c} value={c}>{CERTIFICATION_LABELS[c]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="form-label" htmlFor="password">{t('password')}</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
            className="form-input pr-10"
            placeholder={t('passwordPlaceholder')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ocean-400 hover:text-ocean-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? (
          <>
            <LoadingSpinner size="sm" />
            {t('loading')}
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            {t('submit')}
          </>
        )}
      </button>

      <p className="text-xs text-center text-ocean-400">
        {t('terms')}
      </p>
    </form>
  )
}
