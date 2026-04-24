'use client'

import { useState, useMemo } from 'react'
import { TripCard } from '@/components/ui/TripCard'
import { ChevronLeft, ChevronRight, Waves } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, parseISO } from 'date-fns'
import { ca, es, enUS } from 'date-fns/locale'
import type { TripWithAvailability, TripType } from '@/types'
import { useTranslations, useLocale } from 'next-intl'

const DATE_FNS_LOCALES = { es, ca, en: enUS }

interface Props {
  trips: TripWithAvailability[]
}

type FilterType = 'all' | TripType

export function CalendarClient({ trips }: Props) {
  const t = useTranslations('calendar')
  const locale = useLocale()
  const dfLocale = DATE_FNS_LOCALES[locale as keyof typeof DATE_FNS_LOCALES] ?? es
  const [filter, setFilter] = useState<FilterType>('all')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const filtered = useMemo(() =>
    trips.filter(t => filter === 'all' || t.type === filter),
    [trips, filter]
  )

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad to start on Monday
  const startPad = (monthStart.getDay() + 6) % 7
  const paddedDays = [
    ...Array(startPad).fill(null),
    ...days,
  ]

  const tripsOnDay = (day: Date) =>
    filtered.filter(t => isSameDay(parseISO(t.date), day))

  const selectedTrips = selectedDate
    ? filtered.filter(t => isSameDay(parseISO(t.date), selectedDate))
    : null

  const upcomingTrips = selectedDate ? selectedTrips! : filtered

  const DAY_HEADERS = [
    t('days.mon'),
    t('days.tue'),
    t('days.wed'),
    t('days.thu'),
    t('days.fri'),
    t('days.sat'),
    t('days.sun'),
  ]

  return (
    <div className="container-main py-12">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {(['all', 'dive', 'course'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors border',
              filter === f
                ? 'bg-ocean-600 text-white border-ocean-600'
                : 'bg-white text-ocean-700 border-ocean-200 hover:border-ocean-400'
            )}
          >
            {f === 'all' ? t('all') : f === 'dive' ? t('dives') : t('courses')}
          </button>
        ))}
        <span className="ml-auto text-sm text-ocean-500">
          {filtered.length} {t('trips')}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        {/* Mini calendar */}
        <div className="card p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-ocean-50 text-ocean-600">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="font-semibold text-ocean-950 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: dfLocale })}
            </h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-ocean-50 text-ocean-600">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-ocean-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {paddedDays.map((day, i) => {
              if (!day) return <div key={`pad-${i}`} />
              const dayTrips = tripsOnDay(day)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const hasDive = dayTrips.some(t => t.type === 'dive')
              const hasCourse = dayTrips.some(t => t.type === 'course')

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  className={cn(
                    'relative flex flex-col items-center py-1.5 rounded-lg text-sm transition-colors',
                    isSelected
                      ? 'bg-ocean-600 text-white'
                      : isToday(day)
                      ? 'bg-ocean-100 text-ocean-800 font-semibold'
                      : 'hover:bg-ocean-50 text-ocean-700',
                    dayTrips.length > 0 && !isSelected && 'font-medium'
                  )}
                >
                  <span>{format(day, 'd')}</span>
                  {dayTrips.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hasDive && <span className={cn('h-1 w-1 rounded-full', isSelected ? 'bg-ocean-200' : 'bg-ocean-500')} />}
                      {hasCourse && <span className={cn('h-1 w-1 rounded-full', isSelected ? 'bg-sand-200' : 'bg-sand-500')} />}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-ocean-100 text-xs text-ocean-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-ocean-500" /> {t('dive')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sand-500" /> {t('course')}
            </span>
          </div>
        </div>

        {/* Trip list */}
        <div>
          {selectedDate && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ocean-950 capitalize">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: dfLocale })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-sm text-ocean-500 hover:text-ocean-700"
              >
                {t('viewAll')}
              </button>
            </div>
          )}

          {upcomingTrips.length === 0 ? (
            <div className="card p-12 text-center text-ocean-500">
              <Waves className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{selectedDate ? t('noDayTrips') : t('noTrips')}</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {upcomingTrips.map(trip => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
