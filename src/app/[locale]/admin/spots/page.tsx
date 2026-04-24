export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { SpotsManager } from './SpotsManager'
import type { Spot } from '@/types'

export default async function AdminSpotsPage() {
  const supabase = createClient()
  const { data } = await supabase.from('spots').select('*').order('name')
  return <SpotsManager spots={(data ?? []) as Spot[]} />
}
