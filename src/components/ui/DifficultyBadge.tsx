'use client'

import { cn } from '@/lib/utils'
import type { Difficulty } from '@/types'
import { useTranslations } from 'next-intl'

const STYLES: Record<Difficulty, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
}

export function DifficultyBadge({ difficulty, className }: { difficulty: Difficulty; className?: string }) {
  const t = useTranslations('common')

  return (
    <span className={cn('badge', STYLES[difficulty], className)}>
      {t(`difficulty.${difficulty}`)}
    </span>
  )
}
