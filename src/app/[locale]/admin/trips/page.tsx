export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { TripsManager } from './TripsManager'
import type { TripWithAvailability, Spot } from '@/types'

export default async function AdminTripsPage() {
  const supabase = createClient()

  const [tripsRes, spotsRes] = await Promise.all([
    supabase
      .from('trips_with_availability')
      .select('*')
      .order('date', { ascending: false }),
    supabase.from('spots').select('id, name, name_i18n').order('name'),
  ])

  return (
    <TripsManager
      trips={(tripsRes.data ?? []) as TripWithAvailability[]}
      spots={(spotsRes.data ?? []) as Pick<Spot, 'id' | 'name' | 'name_i18n'>[]}
    />
  )
}
