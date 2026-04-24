-- ============================================================
-- MATSUB Diving Center - Supabase Schema
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  phone text,
  certification_level text not null default 'none'
    check (certification_level in ('none', 'open_water', 'advanced', 'rescue', 'divemaster')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- SPOTS
-- ============================================================
create table public.spots (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  depth_min integer,
  depth_max integer,
  difficulty text not null default 'beginner'
    check (difficulty in ('beginner', 'intermediate', 'advanced')),
  lat numeric(10, 7),
  lng numeric(10, 7),
  images text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.spots enable row level security;

create policy "Anyone can view spots"
  on public.spots for select
  using (true);

create policy "Admins can manage spots"
  on public.spots for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- ============================================================
-- TRIPS
-- ============================================================
create table public.trips (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('dive', 'course')),
  spot_id uuid references public.spots(id) on delete set null,
  title text not null,
  description text,
  date date not null,
  time time not null,
  duration_minutes integer not null default 120,
  max_participants integer not null default 8,
  price numeric(10, 2) not null default 0,
  difficulty_level text check (difficulty_level in ('beginner', 'intermediate', 'advanced')),
  status text not null default 'active'
    check (status in ('active', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.trips enable row level security;

create policy "Anyone can view active trips"
  on public.trips for select
  using (status = 'active' or (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  ));

create policy "Admins can manage trips"
  on public.trips for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- ============================================================
-- BOOKINGS
-- ============================================================
create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  trip_id uuid references public.trips(id) on delete cascade not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, trip_id)
);

alter table public.bookings enable row level security;

create policy "Users can view their own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "Users can create bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "Users can cancel their own bookings"
  on public.bookings for update
  using (auth.uid() = user_id);

create policy "Admins can manage all bookings"
  on public.bookings for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- ============================================================
-- EQUIPMENT
-- ============================================================
create table public.equipment (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null
    check (type in ('wetsuit', 'bcd', 'regulator', 'fins', 'mask', 'tank')),
  size text,
  status text not null default 'available'
    check (status in ('available', 'maintenance', 'retired')),
  created_at timestamptz not null default now()
);

alter table public.equipment enable row level security;

create policy "Anyone can view available equipment"
  on public.equipment for select
  using (status != 'retired');

create policy "Admins can manage equipment"
  on public.equipment for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- ============================================================
-- EQUIPMENT BOOKINGS
-- ============================================================
create table public.equipment_bookings (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references public.bookings(id) on delete cascade not null,
  equipment_id uuid references public.equipment(id) on delete cascade not null,
  status text not null default 'reserved'
    check (status in ('reserved', 'returned')),
  created_at timestamptz not null default now()
);

alter table public.equipment_bookings enable row level security;

create policy "Users can view their equipment bookings"
  on public.equipment_bookings for select
  using (
    exists (
      select 1 from public.bookings
      where id = booking_id and user_id = auth.uid()
    )
  );

create policy "Users can create equipment bookings"
  on public.equipment_bookings for insert
  with check (
    exists (
      select 1 from public.bookings
      where id = booking_id and user_id = auth.uid()
    )
  );

create policy "Admins can manage equipment bookings"
  on public.equipment_bookings for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- ============================================================
-- HELPER VIEWS
-- ============================================================

-- Trip with available spots count
create or replace view public.trips_with_availability as
select
  t.*,
  s.name as spot_name,
  s.slug as spot_slug,
  s.difficulty as spot_difficulty,
  t.max_participants - count(b.id) filter (where b.status != 'cancelled') as available_spots,
  count(b.id) filter (where b.status != 'cancelled') as confirmed_participants
from public.trips t
left join public.spots s on t.spot_id = s.id
left join public.bookings b on t.id = b.trip_id
group by t.id, s.id;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public)
values ('spots', 'spots', true)
on conflict do nothing;

create policy "Anyone can view spot images"
  on storage.objects for select
  using (bucket_id = 'spots');

create policy "Admins can upload spot images"
  on storage.objects for insert
  with check (
    bucket_id = 'spots' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can delete spot images"
  on storage.objects for delete
  using (
    bucket_id = 'spots' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- ============================================================
-- SEED DATA (sample spots around Mataró)
-- ============================================================
insert into public.spots (name, slug, description, depth_min, depth_max, difficulty, lat, lng) values
(
  'El Farell',
  'el-farell',
  'Roca submergida a poca distància de la costa. Ideal per a tot nivell per la seva accessibilitat i diversitat marina. S''hi poden trobar morenes, polps i nombrosos peixos de roca.',
  5, 28, 'beginner', 41.5389, 2.4612
),
(
  'La Pedrera de l''Àncora',
  'la-pedrera-de-lancora',
  'Zona de blocs i esquerdes amb molta vida bentònica. Excel·lent per a fotografia submarina. Profunditat moderada adequada per a bussejadors intermedis.',
  12, 40, 'intermediate', 41.5301, 2.4558
),
(
  'El Cap de Creus (Mataró)',
  'cap-de-creus-mataro',
  'Punt avançat amb corrents ocasionals. Gorgònies, cors de coral vermell i fauna pelàgica. Reservat per a bussejadors avançats amb experiència en corrents.',
  20, 55, 'advanced', 41.5445, 2.4701
);
