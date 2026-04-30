'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, isBefore, startOfToday } from 'date-fns'
import { ca, es, enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useLocale } from 'next-intl'

const DATE_FNS_LOCALES = { es, ca, en: enUS }
const DEFAULT_DAY_HEADERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export interface DayMeta {
  dateStr: string
  isSelected: boolean
  isToday: boolean
  isPast: boolean
}

interface Props {
  currentMonth: Date
  onMonthChange: (date: Date) => void
  selectedDate: string | null
  onSelectDate: (dateStr: string | null) => void
  renderCellContent: (day: Date, meta: DayMeta) => React.ReactNode
  dayHeaders?: string[]
  footer?: React.ReactNode
  className?: string
}

export function CalendarGrid({
  currentMonth,
  onMonthChange,
  selectedDate,
  onSelectDate,
  renderCellContent,
  dayHeaders = DEFAULT_DAY_HEADERS,
  footer,
  className,
}: Props) {
  const locale = useLocale()
  const dfLocale = DATE_FNS_LOCALES[locale as keyof typeof DATE_FNS_LOCALES] ?? es

  const monthStart = startOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(currentMonth) })
  const startPad = (monthStart.getDay() + 6) % 7
  const paddedDays = [...Array(startPad).fill(null), ...days]

  return (
    <div className={cn('card p-6', className)}>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => { onMonthChange(subMonths(currentMonth, 1)); onSelectDate(null) }}
          className="p-1.5 rounded-lg hover:bg-ocean-50 text-ocean-700"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <h2 className="font-semibold text-ocean-950 capitalize text-lg">
          {format(currentMonth, 'MMMM yyyy', { locale: dfLocale })}
        </h2>
        <button
          onClick={() => { onMonthChange(addMonths(currentMonth, 1)); onSelectDate(null) }}
          className="p-1.5 rounded-lg hover:bg-ocean-50 text-ocean-700"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-ocean-100">
        {dayHeaders.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-ocean-600 py-2 uppercase tracking-wide">
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

          const dateStr = format(day, 'yyyy-MM-dd')
          const isSelected = selectedDate === dateStr
          const todayDay = isToday(day)
          const isPast = isBefore(day, startOfToday())
          const meta: DayMeta = { dateStr, isSelected, isToday: todayDay, isPast }

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              className={cn(
                'relative border-r border-b border-ocean-100 min-h-[56px] sm:min-h-[90px] p-1.5 sm:p-2 text-left transition-colors w-full',
                isSelected ? 'bg-ocean-600' : todayDay ? 'bg-ocean-50' : isPast ? 'bg-slate-50' : 'hover:bg-ocean-50/60'
              )}
            >
              <span className={cn(
                'inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium',
                isSelected ? 'bg-white text-ocean-700' : todayDay ? 'bg-ocean-600 text-white' : isPast ? 'text-slate-400' : 'text-ocean-700'
              )}>
                {format(day, 'd')}
              </span>
              {renderCellContent(day, meta)}
            </button>
          )
        })}
      </div>

      {/* Footer slot */}
      {footer && (
        <div className="mt-4 pt-4 border-t border-ocean-100">
          {footer}
        </div>
      )}
    </div>
  )
}
