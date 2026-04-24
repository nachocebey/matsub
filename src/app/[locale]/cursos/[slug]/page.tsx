export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TripCard } from '@/components/ui/TripCard'
import { BookOpen, Award, ArrowLeft } from 'lucide-react'
import type { Course, TripWithAvailability } from '@/types'
import { getTranslations, getLocale } from 'next-intl/server'
import { getI18n } from '@/lib/utils'

interface Props {
  params: { slug: string }
}

const CERT_LABELS: Record<string, string> = {
  open_water: 'Open Water',
  advanced: 'Advanced Open Water',
  rescue: 'Rescue Diver',
  divemaster: 'Divemaster',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: course } = await supabase
    .from('courses')
    .select('title, description')
    .eq('slug', params.slug)
    .single()

  if (!course) return { title: 'Curso no encontrado' }
  return {
    title: course.title,
    description: course.description ?? undefined,
  }
}

export default async function CourseDetailPage({ params }: Props) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const t = await getTranslations('courses')

  const [courseRes, tripsRes] = await Promise.all([
    supabase.from('courses').select('*').eq('slug', params.slug).single(),
    supabase
      .from('trips_with_availability')
      .select('*')
      .eq('status', 'active')
      .gte('date', today)
      .order('date', { ascending: true }),
  ])

  if (!courseRes.data) notFound()

  const course = courseRes.data as Course
  const allTrips = (tripsRes.data ?? []) as TripWithAvailability[]
  const trips = allTrips.filter(trip => trip.course_id === course.id)

  const locale = await getLocale()
  const courseTitle = getI18n(course.title_i18n, locale, course.title)
  const courseDesc = getI18n(course.description_i18n, locale, course.description ?? '')

  return (
    <div className="pt-16">
      {/* Header */}
      <div className="bg-ocean-950 text-white py-16">
        <div className="container-main">
          <Link href="/cursos" className="inline-flex items-center gap-1.5 text-ocean-400 hover:text-ocean-300 text-sm mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('allCourses')}
          </Link>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              {course.certification_obtained && (
                <div className="flex items-center gap-1.5 text-ocean-400 text-sm mb-4">
                  <Award className="h-4 w-4" />
                  {t('certification', { cert: CERT_LABELS[course.certification_obtained] ?? course.certification_obtained })}
                </div>
              )}
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">{courseTitle}</h1>
              {courseDesc && (
                <p className="text-ocean-300 text-lg leading-relaxed">{courseDesc}</p>
              )}
            </div>

            <div className="rounded-2xl overflow-hidden bg-ocean-900 h-64 lg:h-72 flex items-center justify-center">
              <BookOpen className="h-20 w-20 text-ocean-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming trips for this course */}
      <div className="container-main py-16">
        <h2 className="text-2xl font-bold text-ocean-950 mb-8">
          {t('upcomingTrips', { name: courseTitle })}
        </h2>

        {trips.length === 0 ? (
          <div className="card p-12 text-center text-ocean-500">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-2">{t('noTrips')}</p>
            <p className="text-sm">{t('noTripsDesc')}</p>
            <div className="flex justify-center gap-3 mt-6">
              <Link href="/calendario" className="btn-primary">{t('viewCalendar')}</Link>
              <Link href="/contacto" className="btn-secondary">{t('contactUs')}</Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
