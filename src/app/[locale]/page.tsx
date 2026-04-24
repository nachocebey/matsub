export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TripCard } from '@/components/ui/TripCard'
import { Anchor, Fish, GraduationCap, Shield, ArrowRight, Waves } from 'lucide-react'
import type { TripWithAvailability, Spot } from '@/types'
import { getTranslations, getLocale } from 'next-intl/server'
import { getI18n } from '@/lib/utils'

async function getHomeData() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const [tripsRes, spotsRes] = await Promise.all([
    supabase
      .from('trips_with_availability')
      .select('*')
      .eq('status', 'active')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(3),
    supabase
      .from('spots')
      .select('*')
      .eq('visible', true)
      .order('created_at', { ascending: true })
      .limit(3),
  ])

  return {
    trips: (tripsRes.data ?? []) as TripWithAvailability[],
    spots: (spotsRes.data ?? []) as Spot[],
  }
}

export default async function HomePage() {
  const { trips, spots } = await getHomeData()
  const [t, tc, ts, locale] = await Promise.all([
    getTranslations('home'),
    getTranslations('common'),
    getTranslations('spots'),
    getLocale(),
  ])

  const FEATURES = [
    {
      icon: Anchor,
      title: t('why.dives'),
      description: t('why.divesDesc'),
    },
    {
      icon: GraduationCap,
      title: t('why.courses'),
      description: t('why.coursesDesc'),
    },
    {
      icon: Fish,
      title: t('why.seabed'),
      description: t('why.seabedDesc'),
    },
    {
      icon: Shield,
      title: t('why.safety'),
      description: t('why.safetyDesc'),
    },
  ]

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-ocean-950">
        <div className="absolute inset-0 bg-gradient-to-br from-ocean-950 via-ocean-800 to-ocean-600 opacity-90" />

        <div className="relative container-main text-center text-white py-32">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-ocean-200 mb-8 border border-white/20">
            <span className="h-2 w-2 rounded-full bg-ocean-400 animate-pulse" />
            {t('hero.subtitle')}
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            {t('hero.title1')}
            <span className="block text-ocean-300">{t('hero.title2')}</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-ocean-200 leading-relaxed mb-10">
            {t('hero.description')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/calendario" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-3 text-base font-semibold text-ocean-800 shadow-sm transition-colors hover:bg-ocean-50">
              {t('hero.cta')}
            </Link>
            <Link href="/sobre-nosotros" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-white/20 backdrop-blur-sm">
              {t('hero.ctaSecondary')}
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-ocean-400 animate-bounce">
          <Waves className="h-6 w-6" />
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-ocean-50">
        <div className="container-main">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="section-title">{t('why.title')}</h2>
            <p className="section-subtitle">{t('why.experience')}</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="card p-6 text-center hover:shadow-md transition-shadow">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ocean-100">
                  <Icon className="h-7 w-7 text-ocean-600" />
                </div>
                <h3 className="font-semibold text-ocean-950 mb-2">{title}</h3>
                <p className="text-sm text-ocean-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming trips */}
      {trips.length > 0 && (
        <section className="py-20">
          <div className="container-main">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="section-title">{t('trips.title')}</h2>
                <p className="section-subtitle max-w-lg">{t('trips.subtitle')}</p>
              </div>
              <Link href="/calendario" className="btn-secondary hidden sm:flex items-center gap-1">
                {t('trips.viewAll')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map(trip => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link href="/calendario" className="btn-secondary inline-flex items-center gap-1">
                {t('trips.viewAllLink')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Spots preview */}
      {spots.length > 0 && (
        <section className="py-20 bg-ocean-950 text-white">
          <div className="container-main">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="section-title text-white">{t('spots.title')}</h2>
                <p className="section-subtitle text-ocean-300 max-w-lg">{t('spots.subtitle')}</p>
              </div>
              <Link href="/spots" className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-ocean-700 bg-transparent px-5 py-2.5 text-sm font-semibold text-ocean-200 transition-colors hover:bg-ocean-800">
                {t('spots.viewAll')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {spots.map(spot => (
                <Link
                  key={spot.id}
                  href={`/spots/${spot.slug}`}
                  className="group rounded-2xl bg-ocean-900 ring-1 ring-ocean-800 p-6 hover:bg-ocean-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-white group-hover:text-ocean-200 transition-colors">
                      {getI18n(spot.name_i18n, locale, spot.name)}
                    </h3>
                    <span className={`badge ${
                      spot.difficulty === 'beginner' ? 'bg-green-900/50 text-green-300' :
                      spot.difficulty === 'intermediate' ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-red-900/50 text-red-300'
                    }`}>
                      {tc(`difficulty.${spot.difficulty}`)}
                    </span>
                  </div>
                  {getI18n(spot.description_i18n, locale, spot.description ?? '') && (
                    <p className="text-sm text-ocean-400 leading-relaxed line-clamp-2 mb-4">
                      {getI18n(spot.description_i18n, locale, spot.description ?? '')}
                    </p>
                  )}
                  {spot.depth_max && (
                    <p className="text-xs text-ocean-500">
                      {ts('depth', { min: spot.depth_min ?? 0, max: spot.depth_max })}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-ocean-600 to-ocean-800 text-white">
        <div className="container-main text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-ocean-200 text-lg mb-8 max-w-xl mx-auto">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-3 text-base font-semibold text-ocean-800 shadow-sm transition-colors hover:bg-ocean-50">
              {t('cta.register')}
            </Link>
            <Link href="/contacto" className="text-ocean-200 hover:text-white underline underline-offset-4 text-sm">
              {t('cta.contact')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
