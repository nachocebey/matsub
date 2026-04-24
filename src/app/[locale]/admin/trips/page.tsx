export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { TripsManager } from './TripsManager'
import type { TripWithAvailability, Spot, Course } from '@/types'

export default async function AdminTripsPage() {
  const supabase = createClient()

  const [tripsRes, spotsRes, coursesRes] = await Promise.all([
    supabase
      .from('trips_with_availability')
      .select('*')
      .order('date', { ascending: false }),
    supabase.from('spots').select('id, name, name_i18n, description_i18n').order('name'),
    supabase.from('courses').select('id, title, title_i18n, description_i18n').order('title'),
  ])

  return (
    <TripsManager
      trips={(tripsRes.data ?? []) as TripWithAvailability[]}
      spots={(spotsRes.data ?? []) as Pick<Spot, 'id' | 'name' | 'name_i18n' | 'description_i18n'>[]}
      courses={(coursesRes.data ?? []) as Pick<Course, 'id' | 'title' | 'title_i18n' | 'description_i18n'>[]}
    />
  )
}
