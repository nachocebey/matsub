export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Award } from 'lucide-react'
import type { Course } from '@/types'
import { getTranslations, getLocale } from 'next-intl/server'
import { getI18n } from '@/lib/utils'

export const metadata: Metadata = { title: 'Cursos de buceo' }

const CERT_LABELS: Record<string, string> = {
  open_water: 'Open Water',
  advanced: 'Advanced Open Water',
  rescue: 'Rescue Diver',
  divemaster: 'Divemaster',
}

export default async function CoursesPage() {
  const supabase = createClient()
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('visible', true)
    .order('title', { ascending: true })

  const coursesList = (courses ?? []) as Course[]
  const [t, locale] = await Promise.all([getTranslations('courses'), getLocale()])

  return (
    <div className="pt-16">
      {/* Header */}
      <div className="bg-ocean-950 text-white py-20">
        <div className="container-main">
          <div className="flex items-center gap-2 text-ocean-400 text-sm font-medium mb-4">
            <BookOpen className="h-4 w-4" />
            {t('title')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            {t('ourCourses')}
          </h1>
          <p className="text-ocean-300 text-lg max-w-2xl leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Courses grid */}
      <div className="container-main py-16">
        {coursesList.length === 0 ? (
          <div className="text-center py-20 text-ocean-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>{t('empty')}</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {coursesList.map(course => {
              const title = getI18n(course.title_i18n, locale, course.title)
              const desc = getI18n(course.description_i18n, locale, course.description ?? '')
              return (
                <Link
                  key={course.id}
                  href={`/cursos/${course.slug}`}
                  className="card overflow-hidden group hover:shadow-lg transition-shadow"
                >
                  <div className="h-40 bg-gradient-to-br from-ocean-700 to-ocean-900 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-ocean-500" />
                  </div>

                  <div className="p-6">
                    <h2 className="font-semibold text-ocean-950 group-hover:text-ocean-600 transition-colors text-lg mb-3">
                      {title}
                    </h2>

                    {desc && (
                      <p className="text-sm text-ocean-600 leading-relaxed line-clamp-3 mb-4">
                        {desc}
                      </p>
                    )}

                    {course.certification_obtained && (
                      <div className="flex items-center gap-1.5 text-xs text-ocean-500">
                        <Award className="h-3.5 w-3.5" />
                        {t('certification', { cert: CERT_LABELS[course.certification_obtained] ?? course.certification_obtained })}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
