import type { Metadata } from 'next'
import Link from 'next/link'
import { ResetPasswordForm } from './ResetPasswordForm'
import { Waves } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = { title: 'Recuperar contrasenya' }

export default async function ResetPasswordPage() {
  const t = await getTranslations('auth.reset')

  return (
    <div className="min-h-screen flex items-center justify-center bg-ocean-50 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-ocean-600 font-bold text-2xl mb-6">
            <Waves className="h-7 w-7" />
            MATSUB
          </Link>
          <h1 className="text-2xl font-bold text-ocean-950">{t('title')}</h1>
          <p className="text-ocean-500 mt-2">{t('subtitle')}</p>
        </div>

        <div className="card p-8">
          <ResetPasswordForm />
        </div>

        <p className="text-center text-sm text-ocean-500 mt-6">
          <Link href="/auth/login" className="text-ocean-600 font-medium hover:text-ocean-800">
            {t('backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  )
}
