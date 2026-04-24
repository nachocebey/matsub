-- Add visible flag to spots
alter table spots add column if not exists visible boolean not null default true;

-- Courses catalogue
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  title_i18n jsonb not null default '{}',
  description text,
  description_i18n jsonb not null default '{}',
  certification_obtained text,
  visible boolean not null default true,
  created_at timestamptz default now()
);

-- Link trips to a course (nullable)
alter table trips add column if not exists course_id uuid references courses(id) on delete set null;

-- RLS for courses
alter table courses enable row level security;

create policy "Public can view visible courses"
  on courses for select
  using (visible = true);

create policy "Admins can do everything on courses"
  on courses for all
  using (is_admin())
  with check (is_admin());
