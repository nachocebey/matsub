'use client'

import { useState } from 'react'
import { toast } from '@/components/ui/Toaster'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Send } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

export function ContactForm() {
  const t = useTranslations('contact')
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, locale }),
      })
      if (!res.ok) throw new Error()
      setSent(true)
      toast.success(t('sentToast'))
    } catch {
      toast.error(t('error'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="card p-8 text-center">
        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Send className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="font-semibold text-ocean-950 text-lg mb-2">{t('successTitle')}</h3>
        <p className="text-ocean-600 text-sm">
          {t('successDesc')}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="form-label" htmlFor="name">{t('name')}</label>
          <input id="name" name="name" type="text" required className="form-input" placeholder={t('namePlaceholder')} />
        </div>
        <div>
          <label className="form-label" htmlFor="email">{t('email')}</label>
          <input id="email" name="email" type="email" required className="form-input" placeholder="correu@exemple.com" />
        </div>
      </div>

      <div>
        <label className="form-label" htmlFor="subject">{t('subject')}</label>
        <input id="subject" name="subject" type="text" required className="form-input" placeholder="Com podem ajudar-te?" />
      </div>

      <div>
        <label className="form-label" htmlFor="message">{t('message')}</label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="form-input resize-none"
          placeholder={t('messagePlaceholder')}
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? (
          <>
            <LoadingSpinner size="sm" />
            {t('sending')}
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            {t('submit')}
          </>
        )}
      </button>
    </form>
  )
}
