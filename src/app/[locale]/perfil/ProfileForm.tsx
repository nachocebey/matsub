'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EQUIPMENT_TYPE_LABELS } from '@/lib/utils'
import { Save, Package } from 'lucide-react'
import type { Profile, EquipmentType } from '@/types'
import { useTranslations } from 'next-intl'

const EQUIPMENT_TYPES: EquipmentType[] = ['wetsuit', 'bcd', 'regulator', 'fins', 'mask', 'tank']
const EQUIPMENT_ICONS: Record<EquipmentType, string> = {
  wetsuit: '🤿', bcd: '🦺', regulator: '🔧', fins: '🐟', mask: '👓', tank: '🫙',
}

export function ProfileForm({ profile, userId }: { profile: Profile | null; userId: string }) {
  const t = useTranslations('profile')
  const supabase = createClient()

  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName] = useState(profile?.last_name ?? '')
  const [ownedEquipment, setOwnedEquipment] = useState<EquipmentType[]>(profile?.owned_equipment ?? [])
  const [loading, setLoading] = useState(false)

  const toggleEquipment = (type: EquipmentType) => {
    setOwnedEquipment(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const full_name = `${firstName} ${lastName}`.trim()

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name,
        owned_equipment: ownedEquipment,
      })
      .eq('id', userId)

    if (error) {
      toast.error(t('saveError'))
    } else {
      toast.success(t('saveSuccess'))
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name fields */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-ocean-950">{t('personalData')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="form-label" htmlFor="first_name">{t('firstName')}</label>
            <input
              id="first_name"
              type="text"
              className="form-input"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder={t('firstNamePlaceholder')}
              required
            />
          </div>
          <div>
            <label className="form-label" htmlFor="last_name">{t('lastName')}</label>
            <input
              id="last_name"
              type="text"
              className="form-input"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder={t('lastNamePlaceholder')}
              required
            />
          </div>
        </div>
      </div>

      {/* Equipment */}
      <div className="card p-6">
        <h2 className="font-semibold text-ocean-950 mb-1 flex items-center gap-2">
          <Package className="h-4 w-4 text-ocean-400" />
          {t('equipment.title')}
        </h2>
        <p className="text-sm text-ocean-500 mb-4">
          {t('equipment.subtitle')}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {EQUIPMENT_TYPES.map(type => {
            const selected = ownedEquipment.includes(type)
            return (
              <label
                key={type}
                className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                  selected ? 'border-ocean-500 bg-ocean-50' : 'border-ocean-100 hover:border-ocean-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleEquipment(type)}
                  className="rounded border-ocean-300 text-ocean-600 focus:ring-ocean-500"
                />
                <span className="text-lg">{EQUIPMENT_ICONS[type]}</span>
                <span className="text-sm font-medium text-ocean-950">{EQUIPMENT_TYPE_LABELS[type]}</span>
              </label>
            )
          })}
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? (
          <>
            <LoadingSpinner size="sm" />
            {t('saving')}
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            {t('save')}
          </>
        )}
      </button>
    </form>
  )
}
