'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import { I18nTextFields } from '@/components/ui/I18nTextFields'
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import type { Course, CertificationLevel, I18nField } from '@/types'

interface CourseForm {
  title_i18n: I18nField
  slug: string
  description_i18n: I18nField
  certification_obtained: CertificationLevel | ''
  visible: boolean
}

const EMPTY: CourseForm = {
  title_i18n: {}, slug: '', description_i18n: {},
  certification_obtained: '', visible: true,
}

const CERTIFICATIONS: { value: CertificationLevel | ''; label: string }[] = [
  { value: '', label: 'Ninguna' },
  { value: 'open_water', label: 'Open Water' },
  { value: 'advanced', label: 'Advanced Open Water' },
  { value: 'rescue', label: 'Rescue Diver' },
  { value: 'divemaster', label: 'Divemaster' },
]

function toSlug(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function CoursesManager({ courses: initial }: { courses: Course[] }) {
  const supabase = createClient()
  const [courses, setCourses] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CourseForm>(EMPTY)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof CourseForm>(k: K, v: CourseForm[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const openCreate = () => { setEditingId(null); setForm(EMPTY); setShowForm(true) }

  const openEdit = (c: Course) => {
    setEditingId(c.id)
    setForm({
      title_i18n: c.title_i18n ?? { es: c.title },
      slug: c.slug,
      description_i18n: c.description_i18n ?? (c.description ? { es: c.description } : {}),
      certification_obtained: c.certification_obtained ?? '',
      visible: c.visible,
    })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const displayTitle = form.title_i18n.es || form.title_i18n.ca || form.title_i18n.en || ''
    const displayDesc = form.description_i18n.es || form.description_i18n.ca || null

    const payload = {
      title: displayTitle,
      slug: form.slug,
      description: displayDesc,
      title_i18n: form.title_i18n,
      description_i18n: form.description_i18n,
      certification_obtained: form.certification_obtained || null,
      visible: form.visible,
    }

    if (editingId) {
      const { error } = await supabase.from('courses').update(payload).eq('id', editingId)
      if (error) { toast.error('Error al guardar.'); setSaving(false); return }
      setCourses(prev => prev.map(c => c.id === editingId ? { ...c, ...payload } as Course : c))
      toast.success('¡Curso actualizado!')
    } else {
      const { data, error } = await supabase.from('courses').insert(payload).select().single()
      if (error) { toast.error(error.message); setSaving(false); return }
      setCourses(prev => [...prev, data as Course])
      toast.success('¡Curso creado!')
    }
    setShowForm(false)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este curso?')) return
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) { toast.error('Error al eliminar.'); return }
    setCourses(prev => prev.filter(c => c.id !== id))
    toast.success('Curso eliminado.')
  }

  const certLabel = (val: CertificationLevel | null) =>
    CERTIFICATIONS.find(c => c.value === (val ?? ''))?.label ?? '—'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ocean-950">Gestión de cursos</h1>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuevo curso
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-ocean-100 flex items-center justify-between">
              <h2 className="font-semibold">{editingId ? 'Editar curso' : 'Nuevo curso'}</h2>
              <button onClick={() => setShowForm(false)} className="text-ocean-400 hover:text-ocean-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <I18nTextFields
                label="Título"
                required
                value={form.title_i18n}
                onChange={v => {
                  set('title_i18n', v)
                  if (!editingId && v.es) set('slug', toSlug(v.es))
                }}
              />
              <div>
                <label className="form-label">Slug *</label>
                <input required className="form-input" value={form.slug} onChange={e => set('slug', e.target.value)} />
              </div>
              <I18nTextFields
                label="Descripción"
                multiline
                value={form.description_i18n}
                onChange={v => set('description_i18n', v)}
              />
              <div>
                <label className="form-label">Certificación obtenida</label>
                <select
                  className="form-input"
                  value={form.certification_obtained}
                  onChange={e => set('certification_obtained', e.target.value as CertificationLevel | '')}
                >
                  {CERTIFICATIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.visible}
                  onChange={e => set('visible', e.target.checked)}
                  className="h-4 w-4 rounded border-ocean-300 text-ocean-600 focus:ring-ocean-500"
                />
                <span className="text-sm font-medium text-ocean-700">Visible en la web</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map(course => (
          <div key={course.id} className="card p-5">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-ocean-950">{course.title_i18n?.es || course.title}</h3>
              {course.visible
                ? <Eye className="h-4 w-4 text-ocean-400 shrink-0" />
                : <EyeOff className="h-4 w-4 text-ocean-300 shrink-0" />
              }
            </div>
            {(course.description_i18n?.es || course.description) && (
              <p className="text-sm text-ocean-500 line-clamp-2 mb-3">
                {course.description_i18n?.es || course.description}
              </p>
            )}
            {course.certification_obtained && (
              <p className="text-xs text-ocean-400 mb-3">Certificación: {certLabel(course.certification_obtained)}</p>
            )}
            <div className="text-xs text-ocean-300 mb-3 flex gap-1">
              {course.title_i18n?.es && <span className="bg-ocean-50 text-ocean-500 px-1.5 py-0.5 rounded">ES</span>}
              {course.title_i18n?.ca && <span className="bg-ocean-50 text-ocean-500 px-1.5 py-0.5 rounded">CA</span>}
              {course.title_i18n?.en && <span className="bg-ocean-50 text-ocean-500 px-1.5 py-0.5 rounded">EN</span>}
            </div>
            <div className="flex gap-2 pt-3 border-t border-ocean-100">
              <button onClick={() => openEdit(course)} className="btn-secondary flex-1 text-xs py-1.5">
                <Edit2 className="h-3.5 w-3.5" />
                Editar
              </button>
              <button onClick={() => handleDelete(course.id)} className="text-red-400 hover:text-red-600 px-2">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="col-span-3 card p-8 text-center text-ocean-400">Sin cursos</div>
        )}
      </div>
    </div>
  )
}
