import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from './RegisterForm'
import { Waves } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = { title: 'Registrar-se' }

export default async function RegisterPage() {
  const t = await getTranslations('auth.register')

  return (
    <div className="min-h-screen flex items-center justify-center bg-ocean-50 px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-ocean-600 font-bold text-2xl mb-6">
            <Waves className="h-7 w-7" />
            MATSUB
          </Link>
          <h1 className="text-2xl font-bold text-ocean-950">{t('title')}</h1>
          <p className="text-ocean-500 mt-2">{t('subtitle')}</p>
        </div>

        <div className="card p-6 sm:p-8">
          <RegisterForm />
        </div>

        <p className="text-center text-sm text-ocean-500 mt-6">
          {t('hasAccount')}{' '}
          <Link href="/auth/login" className="text-ocean-600 font-medium hover:text-ocean-800">
            {t('signInLink')}
          </Link>
        </p>
      </div>
    </div>
  )
}
