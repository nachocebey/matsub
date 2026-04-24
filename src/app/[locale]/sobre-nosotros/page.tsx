import type { Metadata } from 'next'
import Link from 'next/link'
import { Award, Users, Calendar, Heart } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = { title: 'Sobre nosaltres' }

export default async function SobreNosotrosPage() {
  const t = await getTranslations('about')

  const STATS = [
    { label: t('stats.experienceLabel'), value: t('stats.experience') },
    { label: t('stats.diversLabel'), value: t('stats.divers') },
    { label: t('stats.divesLabel'), value: t('stats.dives') },
    { label: t('stats.spotsLabel'), value: t('stats.spots') },
  ]

  const TEAM = [
    {
      name: t('team.marc.name'),
      role: t('team.marc.role'),
      bio: t('team.marc.bio'),
      cert: t('team.marc.cert'),
    },
    {
      name: t('team.anna.name'),
      role: t('team.anna.role'),
      bio: t('team.anna.bio'),
      cert: t('team.anna.cert'),
    },
    {
      name: t('team.jordi.name'),
      role: t('team.jordi.role'),
      bio: t('team.jordi.bio'),
      cert: t('team.jordi.cert'),
    },
  ]

  const BADGES = [
    { icon: Award, label: t('badges.padi') },
    { icon: Users, label: t('badges.team') },
    { icon: Calendar, label: t('badges.yearRound') },
    { icon: Heart, label: t('badges.eco') },
  ]

  return (
    <div className="pt-16">
      {/* Header */}
      <div className="bg-ocean-950 text-white py-20">
        <div className="container-main max-w-4xl">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">{t('title')}</h1>
          <p className="text-ocean-300 text-xl leading-relaxed">
            {t('intro')}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-ocean-600 py-12">
        <div className="container-main">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
            {STATS.map(({ label, value }) => (
              <div key={label}>
                <div className="text-4xl font-bold mb-1">{value}</div>
                <div className="text-ocean-200 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story */}
      <section className="py-20">
        <div className="container-main max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-ocean-950 mb-5">{t('historyTitle')}</h2>
              <div className="space-y-4 text-ocean-600 leading-relaxed">
                <p>{t('history1')}</p>
                <p>{t('history2')}</p>
                <p>{t('history3')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {BADGES.map(({ icon: Icon, label }) => (
                <div key={label} className="card p-5 text-center">
                  <Icon className="h-8 w-8 text-ocean-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-ocean-800">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-ocean-50">
        <div className="container-main">
          <div className="text-center mb-14">
            <h2 className="section-title">{t('teamTitle')}</h2>
            <p className="section-subtitle">{t('teamSubtitle')}</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map(({ name, role, bio, cert }) => (
              <div key={name} className="card p-6">
                <div className="h-20 w-20 rounded-2xl bg-ocean-100 flex items-center justify-center mb-4 text-3xl font-bold text-ocean-600">
                  {name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="font-semibold text-ocean-950 text-lg">{name}</h3>
                <p className="text-ocean-500 text-sm mb-3">{role}</p>
                <p className="text-sm text-ocean-600 leading-relaxed mb-4">{bio}</p>
                <span className="badge badge-blue">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container-main text-center max-w-2xl">
          <h2 className="text-3xl font-bold text-ocean-950 mb-4">{t('ctaTitle')}</h2>
          <p className="text-ocean-600 mb-8">{t('ctaDesc')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contacto" className="btn-primary">{t('ctaContact')}</Link>
            <Link href="/calendario" className="btn-secondary">{t('ctaTrips')}</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
