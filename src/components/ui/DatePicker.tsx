'use client'

import ReactDatePicker, { registerLocale } from 'react-datepicker'
import { es } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'

registerLocale('es', es)

interface Props {
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
}

export function DatePicker({ value, onChange, required, className }: Props) {
  const selected = value ? new Date(value + 'T00:00:00') : null

  const handleChange = (date: Date | null) => {
    if (!date) { onChange(''); return }
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    onChange(`${y}-${m}-${d}`)
  }

  return (
    <div className={`datepicker-wrap ${className ?? ''}`}>
      <ReactDatePicker
        selected={selected}
        onChange={handleChange}
        locale="es"
        dateFormat="dd/MM/yyyy"
        calendarStartDay={1}
        required={required}
        placeholderText="DD/MM/AAAA"
        autoComplete="off"
      />
    </div>
  )
}
