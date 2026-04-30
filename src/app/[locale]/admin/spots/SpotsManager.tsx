'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import { DifficultyBadge } from '@/components/ui/DifficultyBadge'
import { I18nTextFields } from '@/components/ui/I18nTextFields'
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import { ImageUploader } from '@/components/ui/ImageUploader'
import type { Spot, Difficulty, I18nField } from '@/types'

interface SpotForm {
  name_i18n: I18nField
  slug: string
  description_i18n: I18nField
  depth_min: number | ''
  depth_max: number | ''
  difficulty: Difficulty
  lat: number | ''
  lng: number | ''
  images: string[]
  visible: boolean
}

const EMPTY: SpotForm = {
  name_i18n: {}, slug: '', description_i18n: {},
  depth_min: '', depth_max: '',
  difficulty: 'beginner',
  lat: '', lng: '',
  images: [],
  visible: true,
}

function toSlug(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function SpotsManager({ spots: initial }: { spots: Spot[] }) {
  const supabase = createClient()
  const [spots, setSpots] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SpotForm>(EMPTY)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof SpotForm>(k: K, v: SpotForm[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const openCreate = () => { setEditingId(null); setForm(EMPTY); setShowForm(true) }

  const openEdit = (s: Spot) => {
    setEditingId(s.id)
    setForm({
      name_i18n: s.name_i18n ?? { es: s.name },
      slug: s.slug,
      description_i18n: s.description_i18n ?? (s.description ? { es: s.description } : {}),
      depth_min: s.depth_min ?? '',
      depth_max: s.depth_max ?? '',
      difficulty: s.difficulty,
      lat: s.lat ?? '', lng: s.lng ?? '',
      images: s.images ?? [],
      visible: s.visible,
    })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const displayName = form.name_i18n.es || form.name_i18n.ca || form.name_i18n.en || ''
    const displayDesc = form.description_i18n.es || form.description_i18n.ca || null

    const payload = {
      name: displayName,
      slug: form.slug,
      description: displayDesc,
      name_i18n: form.name_i18n,
      description_i18n: form.description_i18n,
      depth_min: form.depth_min === '' ? null : Number(form.depth_min),
      depth_max: form.depth_max === '' ? null : Number(form.depth_max),
      difficulty: form.difficulty,
      lat: form.lat === '' ? null : Number(form.lat),
      lng: form.lng === '' ? null : Number(form.lng),
      images: form.images,
      visible: form.visible,
    }

    if (editingId) {
      const { error } = await supabase.from('spots').update(payload).eq('id', editingId)
      if (error) { toast.error('Error al guardar.'); setSaving(false); return }
      setSpots(prev => prev.map(s => s.id === editingId ? { ...s, ...payload } as Spot : s))
      toast.success('¡Spot actualizado!')
    } else {
      const { data, error } = await supabase.from('spots').insert(payload).select().single()
      if (error) { toast.error(error.message); setSaving(false); return }
      setSpots(prev => [...prev, data as Spot])
      toast.success('¡Spot creado!')
    }
    setShowForm(false)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este spot? Las salidas asociadas quedarán sin spot.')) return
    const { error } = await supabase.from('spots').delete().eq('id', id)
    if (error) { toast.error('Error al eliminar.'); return }
    setSpots(prev => prev.filter(s => s.id !== id))
    toast.success('Spot eliminado.')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ocean-950">Gestión de spots</h1>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuevo spot
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-ocean-100 flex items-center justify-between">
              <h2 className="font-semibold">{editingId ? 'Editar spot' : 'Nuevo spot'}</h2>
              <button onClick={() => setShowForm(false)} className="text-ocean-400 hover:text-ocean-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <I18nTextFields
                label="Nombre"
                required
                value={form.name_i18n}
                onChange={v => {
                  set('name_i18n', v)
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
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="form-label">Prof. mín (m)</label>
                  <input type="number" min={0} className="form-input" value={form.depth_min} onChange={e => set('depth_min', e.target.value as unknown as number)} />
                </div>
                <div>
                  <label className="form-label">Prof. máx (m)</label>
                  <input type="number" min={0} className="form-input" value={form.depth_max} onChange={e => set('depth_max', e.target.value as unknown as number)} />
                </div>
                <div>
                  <label className="form-label">Dificultad</label>
                  <select className="form-input" value={form.difficulty} onChange={e => set('difficulty', e.target.value as Difficulty)}>
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label">Latitud</label>
                  <input type="number" step="any" className="form-input" value={form.lat} onChange={e => set('lat', e.target.value as unknown as number)} />
                </div>
                <div>
                  <label className="form-label">Longitud</label>
                  <input type="number" step="any" className="form-input" value={form.lng} onChange={e => set('lng', e.target.value as unknown as number)} />
                </div>
              </div>
              <div>
                <label className="form-label">Imágenes</label>
                <ImageUploader folder="spots" images={form.images} onChange={v => set('images', v)} />
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
        {spots.map(spot => (
          <div key={spot.id} className="card p-5">
            <div className="flex items-start justify-between mb-2 gap-2">
              <h3 className="font-semibold text-ocean-950">{spot.name_i18n?.es || spot.name}</h3>
              <div className="flex items-center gap-1.5 shrink-0">
                {spot.visible
                  ? <Eye className="h-4 w-4 text-ocean-400" />
                  : <EyeOff className="h-4 w-4 text-ocean-300" />
                }
                <DifficultyBadge difficulty={spot.difficulty} />
              </div>
            </div>
            {(spot.description_i18n?.es || spot.description) && (
              <p className="text-sm text-ocean-500 line-clamp-2 mb-3">{spot.description_i18n?.es || spot.description}</p>
            )}
            {spot.depth_max && (
              <p className="text-xs text-ocean-400 mb-3">Profundidad: {spot.depth_min}–{spot.depth_max}m</p>
            )}
            <div className="text-xs text-ocean-300 mb-3 flex gap-1">
              {spot.name_i18n?.es && <span className="bg-ocean-50 text-ocean-500 px-1.5 py-0.5 rounded">ES</span>}
              {spot.name_i18n?.ca && <span className="bg-ocean-50 text-ocean-500 px-1.5 py-0.5 rounded">CA</span>}
              {spot.name_i18n?.en && <span className="bg-ocean-50 text-ocean-500 px-1.5 py-0.5 rounded">EN</span>}
            </div>
            <div className="flex gap-2 pt-3 border-t border-ocean-100">
              <button onClick={() => openEdit(spot)} className="btn-secondary flex-1 text-xs py-1.5">
                <Edit2 className="h-3.5 w-3.5" />
                Editar
              </button>
              <button onClick={() => handleDelete(spot.id)} className="text-red-400 hover:text-red-600 px-2">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {spots.length === 0 && (
          <div className="col-span-3 card p-8 text-center text-ocean-400">Sin spots</div>
        )}
      </div>
    </div>
  )
}
