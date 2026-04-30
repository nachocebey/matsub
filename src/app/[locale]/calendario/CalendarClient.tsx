'use client'

import { useState, useMemo } from 'react'
import { TripCard } from '@/components/ui/TripCard'
import { CalendarGrid } from '@/components/ui/CalendarGrid'
import { Waves, CalendarDays } from 'lucide-react'
import { cn, getI18n } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const filtered = useMemo(() =>
    trips.filter(t => filter === 'all' || t.type === filter),
    [trips, filter]
  )

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  const monthTrips = useMemo(() =>
    filtered.filter(t => t.date >= format(monthStart, 'yyyy-MM-dd') && t.date <= format(monthEnd, 'yyyy-MM-dd')),
    [filtered, monthStart, monthEnd]
  )

  const displayTrips = selectedDate
    ? filtered.filter(t => t.date === selectedDate)
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
        <span className="ml-auto text-sm text-ocean-700">
          {monthTrips.length} {t('trips')}
        </span>
      </div>

      <CalendarGrid
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        dayHeaders={DAY_HEADERS}
        className="mb-10"
        footer={
          <div className="flex flex-wrap gap-4 text-xs text-ocean-700">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-ocean-500" aria-hidden="true" /> {t('dive')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" /> {t('course')}
            </span>
            {bookedTripIds.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" /> Apuntado
              </span>
            )}
          </div>
        }
        renderCellContent={(day, { dateStr, isSelected }) => {
          const dayTrips = filtered.filter(t => t.date === dateStr)
          const hasDive = dayTrips.some(t => t.type === 'dive')
          const hasCourse = dayTrips.some(t => t.type === 'course')
          const hasBooked = dayTrips.some(t => bookedSet.has(t.id))
          return (
            <>
              {hasBooked && (
                <span className={cn(
                  'absolute top-1 right-1 h-4 w-4 flex items-center justify-center rounded-full text-[9px] font-bold',
                  isSelected ? 'bg-white text-green-600' : 'bg-green-500 text-white'
                )}>✓</span>
              )}
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
                    <div className={cn('text-[11px]', isSelected ? 'text-ocean-100' : 'text-ocean-700')}>
                      +{dayTrips.length - 2}
                    </div>
                  )}
                </div>
              )}
              {dayTrips.length > 0 && (
                <div className="absolute bottom-1.5 right-1.5 flex gap-0.5 sm:hidden">
                  {hasDive && <span className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-white/60' : 'bg-ocean-500')} />}
                  {hasCourse && <span className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-white/60' : 'bg-amber-500')} />}
                </div>
              )}
            </>
          )
        }}
      />

      {/* Trips below calendar */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-ocean-950 text-lg capitalize">
            {selectedDate
              ? format(parseISO(selectedDate), "EEEE, d 'de' MMMM", { locale: dfLocale })
              : format(currentMonth, 'MMMM yyyy', { locale: dfLocale })
            }
          </h3>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="text-sm text-ocean-700 hover:text-ocean-900"
            >
              {t('viewAll')}
            </button>
          )}
        </div>

        {/* Mobile: prompt when no day selected */}
        {!selectedDate && (
          <div className="sm:hidden card p-10 text-center text-ocean-600">
            <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
            <p className="text-sm font-medium text-ocean-700">{t('selectDay')}</p>
          </div>
        )}

        {/* Mobile: day selected */}
        {selectedDate && (
          <div className="sm:hidden">
            {displayTrips.length === 0 ? (
              <div className="card p-10 text-center text-ocean-500">
                <Waves className="h-10 w-10 mx-auto mb-3 opacity-30" aria-hidden="true" />
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

        {/* Desktop: always show */}
        <div className="hidden sm:block">
          {displayTrips.length === 0 ? (
            <div className="card p-12 text-center text-ocean-500">
              <Waves className="h-10 w-10 mx-auto mb-3 opacity-30" aria-hidden="true" />
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
