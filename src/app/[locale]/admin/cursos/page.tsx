export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { CoursesManager } from './CoursesManager'
import type { Course } from '@/types'

export default async function AdminCoursesPage() {
  const supabase = createClient()
  const { data } = await supabase.from('courses').select('*').order('title')
  return <CoursesManager courses={(data ?? []) as Course[]} />
}
