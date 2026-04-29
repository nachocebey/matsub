import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/Toaster'
import { locales, type Locale } from '@/i18n'
import { notFound } from 'next/navigation'
import NextTopLoader from 'nextjs-toploader'
import type { Metadata } from 'next'
import { BRANDING } from '@/config/branding'
import { Inter } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

type Props = { params: { locale: string } }

export function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    title: {
      default: `${BRANDING.name} – ${BRANDING.tagline}`,
      template: `%s | ${BRANDING.name}`,
    },
    description: t('description'),
    keywords: t('keywords').split(',').map(k => k.trim()),
  }
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!locales.includes(locale as Locale)) notFound()

  const messages = await getMessages()

  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <NextTopLoader color="#0ea5e9" showSpinner={false} />
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
        </NextIntlClientProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
