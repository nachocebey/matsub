import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { I18nField } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getI18n(field: I18nField | null | undefined, locale: string, fallback = ''): string {
  if (!field) return fallback
  return field[locale as keyof I18nField] || field.es || fallback
}

const LOCALE_BCP47: Record<string, string> = { es: 'es-ES', ca: 'ca-ES', en: 'en-GB' }

export function formatDate(dateStr: string, locale = 'es'): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString(LOCALE_BCP47[locale] ?? 'es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5)
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ca-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Principiant',
  intermediate: 'Intermedi',
  advanced: 'Avançat',
}

export const TRIP_TYPE_LABELS: Record<string, string> = {
  dive: 'Immersió',
  course: 'Curs',
}

export const CERTIFICATION_LABELS: Record<string, string> = {
  none: 'Sense certificació',
  open_water: 'Open Water',
  advanced: 'Advanced',
  rescue: 'Rescue',
  divemaster: 'Divemaster',
}

export const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  wetsuit: 'Neoprè',
  bcd: 'BCD (Chaleco)',
  regulator: 'Regulador',
  fins: 'Aletes',
  mask: 'Màscara',
  tank: 'Bombona',
}

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendent',
  confirmed: 'Confirmada',
  cancelled: 'Cancel·lada',
}
