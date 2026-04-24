-- Add owned equipment to user profiles
alter table public.profiles
  add column if not exists owned_equipment text[] not null default '{}';

-- Add needed equipment to bookings (types selected by user when booking)
alter table public.bookings
  add column if not exists needed_equipment text[] not null default '{}';
