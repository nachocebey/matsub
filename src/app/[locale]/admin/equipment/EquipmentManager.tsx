'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import { EQUIPMENT_TYPE_LABELS } from '@/lib/utils'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Equipment, EquipmentType, EquipmentStatus } from '@/types'

interface EquipForm {
  name: string
  type: EquipmentType
  size: string
  status: EquipmentStatus
}

const EMPTY: EquipForm = { name: '', type: 'wetsuit', size: '', status: 'available' }

const STATUS_STYLES: Record<EquipmentStatus, string> = {
  available: 'badge-green',
  maintenance: 'badge-yellow',
  retired: 'badge-gray',
}

const STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: 'Disponible',
  maintenance: 'Manteniment',
  retired: 'Retirat',
}

export function EquipmentManager({ equipment: initial }: { equipment: Equipment[] }) {
  const supabase = createClient()
  const [equipment, setEquipment] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EquipForm>(EMPTY)
  const [saving, setSaving] = useState(false)

  const set = (k: keyof EquipForm, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const openCreate = () => { setEditingId(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (e: Equipment) => {
    setEditingId(e.id)
    setForm({ name: e.name, type: e.type, size: e.size ?? '', status: e.status })
    setShowForm(true)
  }

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setSaving(true)
    const payload = { name: form.name, type: form.type, size: form.size || null, status: form.status }

    if (editingId) {
      const { error } = await supabase.from('equipment').update(payload).eq('id', editingId)
      if (error) { toast.error('Error.'); setSaving(false); return }
      setEquipment(prev => prev.map(e => e.id === editingId ? { ...e, ...payload } as Equipment : e))
      toast.success('Equip actualitzat!')
    } else {
      const { data, error } = await supabase.from('equipment').insert(payload).select().single()
      if (error) { toast.error('Error.'); setSaving(false); return }
      setEquipment(prev => [...prev, data as Equipment])
      toast.success('Equip afegit!')
    }
    setShowForm(false)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar aquest equip?')) return
    const { error } = await supabase.from('equipment').delete().eq('id', id)
    if (error) { toast.error('Error.'); return }
    setEquipment(prev => prev.filter(e => e.id !== id))
    toast.success('Equip eliminat.')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ocean-950">Gestió d&apos;equipament</h1>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nou equip
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-ocean-100 flex items-center justify-between">
              <h2 className="font-semibold">{editingId ? 'Editar equip' : 'Nou equip'}</h2>
              <button onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="form-label">Nom *</label>
                <input required className="form-input" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label">Tipus</label>
                  <select className="form-input" value={form.type} onChange={e => set('type', e.target.value as EquipmentType)}>
                    {Object.entries(EQUIPMENT_TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Talla</label>
                  <input className="form-input" value={form.size} onChange={e => set('size', e.target.value)} placeholder="S, M, L, XL..." />
                </div>
              </div>
              <div>
                <label className="form-label">Estat</label>
                <select className="form-input" value={form.status} onChange={e => set('status', e.target.value as EquipmentStatus)}>
                  <option value="available">Disponible</option>
                  <option value="maintenance">En manteniment</option>
                  <option value="retired">Retirat</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel·lar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Desant...' : 'Desar'}</button>
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
                {['Nom', 'Tipus', 'Talla', 'Estat', 'Accions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-ocean-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ocean-50">
              {equipment.map(e => (
                <tr key={e.id} className="hover:bg-ocean-50/50">
                  <td className="px-4 py-3 font-medium text-ocean-950">{e.name}</td>
                  <td className="px-4 py-3 text-ocean-600">{EQUIPMENT_TYPE_LABELS[e.type]}</td>
                  <td className="px-4 py-3 text-ocean-500">{e.size ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('badge', STATUS_STYLES[e.status])}>{STATUS_LABELS[e.status]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(e)} className="text-ocean-500 hover:text-ocean-700"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(e.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {equipment.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-ocean-400">Cap equipament</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
