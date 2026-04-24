'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import { formatDate, formatPrice, TRIP_TYPE_LABELS } from '@/lib/utils'
import { I18nTextFields } from '@/components/ui/I18nTextFields'
import { Plus, Edit2, XCircle, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TripWithAvailability, Spot, TripType, Difficulty, I18nField } from '@/types'

interface Props {
  trips: TripWithAvailability[]
  spots: Pick<Spot, 'id' | 'name' | 'name_i18n'>[]
}

interface TripForm {
  type: TripType
  spot_id: string
  title_i18n: I18nField
  description_i18n: I18nField
  date: string
  time: string
  duration_minutes: number
  max_participants: number
  price: number
  difficulty_level: Difficulty | ''
}

const EMPTY_FORM: TripForm = {
  type: 'dive',
  spot_id: '',
  title_i18n: {},
  description_i18n: {},
  date: '',
  time: '09:00',
  duration_minutes: 120,
  max_participants: 8,
  price: 45,
  difficulty_level: '',
}

export function TripsManager({ trips: initial, spots }: Props) {
  const supabase = createClient()
  const [trips, setTrips] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TripForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof TripForm>(k: K, v: TripForm[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (trip: TripWithAvailability) => {
    setEditingId(trip.id)
    setForm({
      type: trip.type,
      spot_id: trip.spot_id ?? '',
      title_i18n: trip.title_i18n ?? { es: trip.title },
      description_i18n: trip.description_i18n ?? (trip.description ? { es: trip.description } : {}),
      date: trip.date,
      time: trip.time.slice(0, 5),
      duration_minutes: trip.duration_minutes,
      max_participants: trip.max_participants,
      price: trip.price,
      difficulty_level: trip.difficulty_level ?? '',
    })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const displayTitle = form.title_i18n.es || form.title_i18n.ca || form.title_i18n.en || ''
    const displayDesc = form.description_i18n.es || form.description_i18n.ca || null

    const payload = {
      type: form.type,
      spot_id: form.spot_id || null,
      title: displayTitle,
      description: displayDesc,
      title_i18n: form.title_i18n,
      description_i18n: form.description_i18n,
      date: form.date,
      time: form.time,
      duration_minutes: Number(form.duration_minutes),
      max_participants: Number(form.max_participants),
      price: Number(form.price),
      difficulty_level: form.difficulty_level || null,
    }

    if (editingId) {
      const { error } = await supabase.from('trips').update(payload).eq('id', editingId)
      if (error) { toast.error('Error al guardar.'); setSaving(false); return }
      setTrips(prev => prev.map(t => t.id === editingId ? { ...t, ...payload } as TripWithAvailability : t))
      toast.success('¡Salida actualizada!')
    } else {
      const { data, error } = await supabase.from('trips').insert(payload).select().single()
      if (error) { toast.error('Error al crear la salida.'); setSaving(false); return }
      setTrips(prev => [{ ...data, available_spots: payload.max_participants, confirmed_participants: 0 } as TripWithAvailability, ...prev])
      toast.success('¡Salida creada!')
    }

    setShowForm(false)
    setSaving(false)
  }

  const handleCancel = async (id: string) => {
    if (!confirm('¿Cancelar esta salida? Las reservas existentes quedarán afectadas.')) return
    const { error } = await supabase.from('trips').update({ status: 'cancelled' }).eq('id', id)
    if (error) { toast.error('Error.'); return }
    setTrips(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' } : t))
    toast.success('Salida cancelada.')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ocean-950">Gestión de salidas</h1>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nueva salida
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-ocean-100 flex items-center justify-between">
              <h2 className="font-semibold text-ocean-950">{editingId ? 'Editar salida' : 'Nueva salida'}</h2>
              <button onClick={() => setShowForm(false)} className="text-ocean-400 hover:text-ocean-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label">Tipo</label>
                  <select className="form-input" value={form.type} onChange={e => set('type', e.target.value as TripType)}>
                    <option value="dive">Inmersión</option>
                    <option value="course">Curso</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Spot</label>
                  <select className="form-input" value={form.spot_id} onChange={e => set('spot_id', e.target.value)}>
                    <option value="">Sin spot</option>
                    {spots.map(s => (
                      <option key={s.id} value={s.id}>{s.name_i18n?.es || s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <I18nTextFields
                label="Título"
                required
                value={form.title_i18n}
                onChange={v => set('title_i18n', v)}
              />

              <I18nTextFields
                label="Descripción"
                multiline
                value={form.description_i18n}
                onChange={v => set('description_i18n', v)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label">Fecha *</label>
                  <input required type="date" className="form-input" value={form.date} onChange={e => set('date', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Hora *</label>
                  <input required type="time" className="form-input" value={form.time} onChange={e => set('time', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Duración (min)</label>
                  <input type="number" min={30} className="form-input" value={form.duration_minutes} onChange={e => set('duration_minutes', Number(e.target.value))} />
                </div>
                <div>
                  <label className="form-label">Máx. participantes</label>
                  <input type="number" min={1} className="form-input" value={form.max_participants} onChange={e => set('max_participants', Number(e.target.value))} />
                </div>
                <div>
                  <label className="form-label">Precio (€)</label>
                  <input type="number" min={0} step={0.01} className="form-input" value={form.price} onChange={e => set('price', Number(e.target.value))} />
                </div>
                <div>
                  <label className="form-label">Dificultad</label>
                  <select className="form-input" value={form.difficulty_level} onChange={e => set('difficulty_level', e.target.value as Difficulty)}>
                    <option value="">Sin especificar</option>
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ocean-50 border-b border-ocean-100">
              <tr>
                {['Título', 'Tipo', 'Fecha', 'Plazas', 'Precio', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-ocean-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ocean-50">
              {trips.map(trip => (
                <tr key={trip.id} className="hover:bg-ocean-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ocean-950">{trip.title_i18n?.es || trip.title}</p>
                    {trip.spot_name && <p className="text-xs text-ocean-400">{trip.spot_name}</p>}
                    <div className="flex gap-1 mt-1">
                      {trip.title_i18n?.es && <span className="bg-ocean-50 text-ocean-500 px-1.5 py-0.5 rounded text-xs">ES</span>}
                      {trip.title_i18n?.ca && <span className="bg-ocean-50 text-ocean-500 px-1.5 py-0.5 rounded text-xs">CA</span>}
                      {trip.title_i18n?.en && <span className="bg-ocean-50 text-ocean-500 px-1.5 py-0.5 rounded text-xs">EN</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('badge', trip.type === 'dive' ? 'badge-blue' : 'badge-yellow')}>
                      {TRIP_TYPE_LABELS[trip.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ocean-600 whitespace-nowrap">{formatDate(trip.date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-ocean-600">
                      <Users className="h-3.5 w-3.5" />
                      {trip.confirmed_participants}/{trip.max_participants}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-ocean-800">{formatPrice(trip.price)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('badge', trip.status === 'active' ? 'badge-green' : 'badge-red')}>
                      {trip.status === 'active' ? 'Activa' : 'Cancelada'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(trip)} className="text-ocean-500 hover:text-ocean-700">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {trip.status === 'active' && (
                        <button onClick={() => handleCancel(trip.id)} className="text-red-400 hover:text-red-600">
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-ocean-400">Sin salidas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
