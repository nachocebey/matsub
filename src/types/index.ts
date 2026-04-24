export type CertificationLevel = 'none' | 'open_water' | 'advanced' | 'rescue' | 'divemaster'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type TripType = 'dive' | 'course'
export type TripStatus = 'active' | 'cancelled'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'
export type EquipmentType = 'wetsuit' | 'bcd' | 'regulator' | 'fins' | 'mask' | 'tank'
export type EquipmentStatus = 'available' | 'maintenance' | 'retired'
export type EquipmentBookingStatus = 'reserved' | 'returned'

export interface Profile {
  id: string
  first_name: string
  last_name: string
  full_name: string
  phone: string | null
  certification_level: CertificationLevel
  owned_equipment: EquipmentType[]
  is_admin: boolean
  created_at: string
}

export type I18nField = { es?: string; ca?: string; en?: string }

export interface Course {
  id: string
  slug: string
  title: string
  title_i18n: I18nField
  description: string | null
  description_i18n: I18nField
  certification_obtained: CertificationLevel | null
  visible: boolean
  created_at: string
}

export interface Spot {
  id: string
  name: string
  slug: string
  description: string | null
  name_i18n: I18nField
  description_i18n: I18nField
  depth_min: number | null
  depth_max: number | null
  difficulty: Difficulty
  lat: number | null
  lng: number | null
  images: string[]
  visible: boolean
  created_at: string
}

export interface Trip {
  id: string
  type: TripType
  spot_id: string | null
  course_id: string | null
  title: string
  description: string | null
  title_i18n: I18nField
  description_i18n: I18nField
  date: string
  time: string
  duration_minutes: number
  max_participants: number
  price: number
  difficulty_level: Difficulty | null
  status: TripStatus
  created_at: string
}

export interface TripWithAvailability extends Trip {
  spot_name: string | null
  spot_slug: string | null
  spot_difficulty: Difficulty | null
  available_spots: number
  confirmed_participants: number
}

export interface Booking {
  id: string
  user_id: string
  trip_id: string
  status: BookingStatus
  notes: string | null
  needed_equipment: EquipmentType[]
  created_at: string
}

export interface BookingWithDetails extends Booking {
  trip: TripWithAvailability
  profile: Profile
  equipment_bookings: EquipmentBookingWithDetails[]
}

export interface Equipment {
  id: string
  name: string
  type: EquipmentType
  size: string | null
  status: EquipmentStatus
  created_at: string
}

export interface EquipmentBooking {
  id: string
  booking_id: string
  equipment_id: string
  status: EquipmentBookingStatus
  created_at: string
}

export interface EquipmentBookingWithDetails extends EquipmentBooking {
  equipment: Equipment
}
