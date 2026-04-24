'use client'

import { useState } from 'react'
import { Loader2, Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'
import type { I18nField } from '@/types'

const LOCALES = [
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'ca', label: 'CA', flag: '🏴' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
] as const

interface Props {
  label: string
  value: I18nField
  onChange: (value: I18nField) => void
  multiline?: boolean
  required?: boolean
  sourceLocale?: string
}

export function I18nTextFields({ label, value, onChange, multiline = false, required = false, sourceLocale = 'es' }: Props) {
  const [activeLocale, setActiveLocale] = useState<string>(sourceLocale)
  const [translating, setTranslating] = useState<string | null>(null)

  const handleChange = (locale: string, text: string) => {
    onChange({ ...value, [locale]: text })
  }

  const autoTranslate = async (targetLocale: string) => {
    const sourceText = value[sourceLocale as keyof I18nField]
    if (!sourceText?.trim()) return

    setTranslating(targetLocale)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText, source: sourceLocale, target: targetLocale }),
      })
      const data = await res.json()
      if (data.translatedText) {
        onChange({ ...value, [targetLocale]: data.translatedText })
      } else {
        toast.error(`Error al traducir: ${data.error ?? 'respuesta vacía'}`)
      }
    } catch (err) {
      toast.error(`Error de conexión: ${err instanceof Error ? err.message : 'desconocido'}`)
    } finally {
      setTranslating(null)
    }
  }

  const translateAll = async () => {
    const targets = LOCALES.map(l => l.code).filter(c => c !== sourceLocale)
    for (const target of targets) {
      await autoTranslate(target)
    }
  }

  const sourceText = value[sourceLocale as keyof I18nField] ?? ''

  return (
    <div className="space-y-2">
      {/* Header with label and translate-all button */}
      <div className="flex items-center justify-between">
        <label className="form-label mb-0">{label}{required && ' *'}</label>
        {sourceText && (
          <button
            type="button"
            onClick={translateAll}
            disabled={!!translating}
            className="flex items-center gap-1 text-xs text-ocean-500 hover:text-ocean-700 transition-colors disabled:opacity-50"
          >
            {translating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Languages className="h-3 w-3" />
            )}
            Auto-traducir todo
          </button>
        )}
      </div>

      {/* Locale tabs */}
      <div className="border border-ocean-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-ocean-100 bg-ocean-50">
          {LOCALES.map(({ code, label: localeLabel, flag }) => (
            <button
              key={code}
              type="button"
              onClick={() => setActiveLocale(code)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
                activeLocale === code
                  ? 'bg-white text-ocean-700 border-b-2 border-ocean-500'
                  : 'text-ocean-400 hover:text-ocean-600'
              )}
            >
              <span>{flag}</span>
              <span>{localeLabel}</span>
              {value[code as keyof I18nField] && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              )}
            </button>
          ))}
        </div>

        {LOCALES.map(({ code }) => (
          <div key={code} className={cn('relative', activeLocale !== code && 'hidden')}>
            {multiline ? (
              <textarea
                className="form-input rounded-none border-0 ring-0 focus:ring-0 resize-none w-full"
                rows={4}
                value={value[code as keyof I18nField] ?? ''}
                onChange={e => handleChange(code, e.target.value)}
                required={required && code === sourceLocale}
                placeholder={code === sourceLocale ? `Texto en ${code.toUpperCase()}...` : `Traducción en ${code.toUpperCase()} (opcional)`}
              />
            ) : (
              <input
                type="text"
                className="form-input rounded-none border-0 ring-0 focus:ring-0 w-full"
                value={value[code as keyof I18nField] ?? ''}
                onChange={e => handleChange(code, e.target.value)}
                required={required && code === sourceLocale}
                placeholder={code === sourceLocale ? `Texto en ${code.toUpperCase()}...` : `Traducción en ${code.toUpperCase()} (opcional)`}
              />
            )}
            {/* Translate button for non-source locales */}
            {code !== sourceLocale && sourceText && (
              <button
                type="button"
                onClick={() => autoTranslate(code)}
                disabled={translating === code}
                className="absolute right-2 top-2 flex items-center gap-1 text-xs bg-ocean-50 hover:bg-ocean-100 text-ocean-500 hover:text-ocean-700 px-2 py-1 rounded-lg border border-ocean-200 transition-colors disabled:opacity-50"
              >
                {translating === code ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Languages className="h-3 w-3" />
                )}
                Traducir
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
