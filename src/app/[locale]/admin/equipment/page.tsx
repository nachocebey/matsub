export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { EquipmentManager } from './EquipmentManager'
import type { Equipment } from '@/types'

export default async function AdminEquipmentPage() {
  const supabase = createClient()
  const { data } = await supabase.from('equipment').select('*').order('type').order('name')
  return <EquipmentManager equipment={(data ?? []) as Equipment[]} />
}
