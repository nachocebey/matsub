'use client'

import { useState, useMemo } from 'react'
import { TripCard } from '@/components/ui/TripCard'
import { ChevronLeft, ChevronRight, Waves, CalendarDays } from 'lucide-react'
import { cn, getI18n } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isBefore, startOfToday, parseISO } from 'date-fns'
import { ca, es, enUS } from 'date-fns/locale'
import type { TripWithAvailability, TripType } from '@/types'
import { useTranslations, useLocale } from 'next-intl'

const DATE_FNS_LOCALES = { es, ca, en: enUS }

interface Props {
  trips: TripWithAvailability[]
  bookedTripIds?: string[]
}

type FilterType = 'all' | TripType

export function CalendarClient({ trips, bookedTripIds = [] }: Props) {
  const bookedSet = useMemo(() => new Set(bookedTripIds), [bookedTripIds])
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

  const startPad = (monthStart.getDay() + 6) % 7
  const paddedDays = [...Array(startPad).fill(null), ...days]

  const tripsOnDay = (day: Date) =>
    filtered.filter(t => isSameDay(parseISO(t.date), day))

  const monthTrips = useMemo(() =>
    filtered.filter(t => {
      const d = parseISO(t.date)
      return d >= monthStart && d <= monthEnd
    }),
    [filtered, monthStart, monthEnd]
  )

  const displayTrips = selectedDate
    ? filtered.filter(t => isSameDay(parseISO(t.date), selectedDate))
    : monthTrips

  const DAY_HEADERS = [
    t('days.mon'), t('days.tue'), t('days.wed'), t('days.thu'),
    t('days.fri'), t('days.sat'), t('days.sun'),
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
          {monthTrips.length} {t('trips')}
        </span>
      </div>

      {/* Full-width calendar */}
      <div className="card p-6 mb-10">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => { setCurrentMonth(subMonths(currentMonth, 1)); setSelectedDate(null) }}
            className="p-1.5 rounded-lg hover:bg-ocean-50 text-ocean-600"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-semibold text-ocean-950 capitalize text-lg">
            {format(currentMonth, 'MMMM yyyy', { locale: dfLocale })}
          </h2>
          <button
            onClick={() => { setCurrentMonth(addMonths(currentMonth, 1)); setSelectedDate(null) }}
            className="p-1.5 rounded-lg hover:bg-ocean-50 text-ocean-600"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-ocean-100 mb-0">
          {DAY_HEADERS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-ocean-400 py-2 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 border-l border-ocean-100">
          {paddedDays.map((day, i) => {
            if (!day) return (
              <div key={`pad-${i}`} className="border-r border-b border-ocean-100 min-h-[56px] sm:min-h-[90px] bg-ocean-50/30" />
            )

            const dayTrips = tripsOnDay(day)
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
            const isPast = isBefore(day, startOfToday())
            const hasDive = dayTrips.some(t => t.type === 'dive')
            const hasCourse = dayTrips.some(t => t.type === 'course')
            const hasBooked = dayTrips.some(t => bookedSet.has(t.id))

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className={cn(
                  'relative border-r border-b border-ocean-100 min-h-[56px] sm:min-h-[90px] p-1.5 sm:p-2 text-left transition-colors',
                  isSelected
                    ? 'bg-ocean-600'
                    : isToday(day)
                    ? 'bg-ocean-50'
                    : isPast
                    ? 'bg-slate-100 cursor-default'
                    : 'hover:bg-ocean-50/60'
                )}
              >
                <span className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium',
                  isSelected
                    ? 'bg-white text-ocean-700'
                    : isToday(day)
                    ? 'bg-ocean-600 text-white'
                    : isPast
                    ? 'text-slate-400'
                    : 'text-ocean-700'
                )}>
                  {format(day, 'd')}
                </span>

                {/* Booked indicator */}
                {hasBooked && (
                  <span className={cn(
                    'absolute top-1 right-1 h-4 w-4 flex items-center justify-center rounded-full text-[9px] font-bold',
                    isSelected ? 'bg-white text-green-600' : 'bg-green-500 text-white'
                  )}>✓</span>
                )}

                {/* Trip titles — desktop only */}
                {dayTrips.length > 0 && (
                  <div className="hidden sm:block mt-1.5 space-y-0.5">
                    {dayTrips.slice(0, 2).map(trip => (
                      <div
                        key={trip.id}
                        className={cn(
                          'text-[11px] leading-tight truncate rounded px-1 py-0.5',
                          isSelected
                            ? 'bg-white/20 text-white'
                            : bookedSet.has(trip.id)
                            ? 'bg-green-100 text-green-700'
                            : trip.type === 'dive'
                            ? 'bg-ocean-100 text-ocean-700'
                            : 'bg-amber-100 text-amber-700'
                        )}
                      >
                        {getI18n(trip.title_i18n, locale, trip.title)}
                      </div>
                    ))}
                    {dayTrips.length > 2 && (
                      <div className={cn('text-[11px]', isSelected ? 'text-ocean-100' : 'text-ocean-400')}>
                        +{dayTrips.length - 2}
                      </div>
                    )}
                  </div>
                )}

                {/* Dot indicators — mobile only */}
                {dayTrips.length > 0 && (
                  <div className="absolute bottom-1.5 right-1.5 flex gap-0.5 sm:hidden">
                    {hasDive && <span className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-white/60' : 'bg-ocean-500')} />}
                    {hasCourse && <span className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-white/60' : 'bg-amber-500')} />}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-ocean-100 text-xs text-ocean-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ocean-500" /> {t('dive')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> {t('course')}
          </span>
          {bookedTripIds.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" /> Apuntado
            </span>
          )}
        </div>
      </div>

      {/* Trips below calendar */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-ocean-950 text-lg capitalize">
            {selectedDate
              ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: dfLocale })
              : format(currentMonth, 'MMMM yyyy', { locale: dfLocale })
            }
          </h3>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="text-sm text-ocean-500 hover:text-ocean-700"
            >
              {t('viewAll')}
            </button>
          )}
        </div>

        {/* Mobile: prompt when no day selected */}
        {!selectedDate && (
          <div className="sm:hidden card p-10 text-center text-ocean-400">
            <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-ocean-500">{t('selectDay')}</p>
          </div>
        )}

        {/* Mobile: day selected — show trips or empty state */}
        {selectedDate && (
          <div className="sm:hidden">
            {displayTrips.length === 0 ? (
              <div className="card p-10 text-center text-ocean-500">
                <Waves className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t('noDayTrips')}</p>
              </div>
            ) : (
              <div className="grid gap-5">
                {displayTrips.map(trip => (
                  <TripCard key={trip.id} trip={trip} isBooked={bookedSet.has(trip.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Desktop: always show month or day trips */}
        <div className="hidden sm:block">
          {displayTrips.length === 0 ? (
            <div className="card p-12 text-center text-ocean-500">
              <Waves className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{selectedDate ? t('noDayTrips') : t('noTrips')}</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {displayTrips.map(trip => (
                <TripCard key={trip.id} trip={trip} isBooked={bookedSet.has(trip.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
