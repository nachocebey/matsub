-- Allow guest bookings (user_id nullable)
alter table public.bookings alter column user_id drop not null;

-- Guest contact fields + email verification
alter table public.bookings
  add column if not exists guest_name text,
  add column if not exists guest_email text,
  add column if not exists guest_phone text,
  add column if not exists verification_token uuid,
  add column if not exists verified boolean not null default true;

-- Constraint: must have either user_id or guest_email
alter table public.bookings
  add constraint bookings_user_or_guest
  check (user_id is not null or guest_email is not null);

-- Authenticated bookings start verified; guest bookings start unverified
-- (handled in API, not DB)

-- RLS: allow anonymous insert for guest bookings
create policy "Allow guest booking insert"
  on public.bookings for insert
  with check (auth.uid() is null and user_id is null and guest_email is not null);
