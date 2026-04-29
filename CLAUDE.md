# MATSUB – Claude Code Guide

## Reglas antes de hacer push a master

Antes de cualquier push a `master`, ejecutar siempre en este orden:
1. `npx tsc --noEmit` — sin errores de TypeScript
2. `npm run build` — build de producción sin errores (incluye ESLint)

Si alguno falla, arreglarlo antes de mergear. Nunca hacer push a master sin estos checks.

Plataforma de reservas para un centro de buceo. Next.js 14 App Router + Supabase + Tailwind + next-intl.

## Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Base de datos / Auth**: Supabase (PostgreSQL + RLS + Auth)
- **Estilos**: Tailwind CSS con paleta custom `ocean-*` y `sand-*`
- **i18n**: next-intl — locales `es` (default), `ca`, `en`; prefijo "as-needed"
- **Email**: Resend
- **Deploy**: Vercel (push a `master` = deploy automático)
- **Ramas**: desarrollo en `dev`, producción en `master`

## Estructura de carpetas

```
src/
├── app/
│   ├── layout.tsx                  # Root layout — pass-through, solo importa globals.css
│   └── [locale]/
│       ├── layout.tsx              # Layout principal: html/body, Inter font, Navbar, Footer, i18n
│       ├── page.tsx                # Home
│       ├── spots/                  # Puntos de buceo (lista + detalle por slug)
│       ├── cursos/                 # Cursos (lista + detalle por slug)
│       ├── calendario/             # Calendario de salidas (CalendarClient.tsx)
│       ├── sobre-nosotros/         # Página de equipo/empresa
│       ├── contacto/               # Formulario de contacto
│       ├── auth/                   # login, register, reset-password, callback
│       ├── dashboard/              # Reservas del usuario (protegido)
│       ├── perfil/                 # Perfil de usuario (protegido)
│       ├── reserva/                # Formulario de reserva + verificación guest
│       └── admin/                  # Panel de admin (protegido, is_admin = true)
│           ├── page.tsx            # Stats generales
│           ├── spots/
│           ├── cursos/
│           ├── trips/
│           ├── bookings/           # BookingsManager.tsx — vista agrupada por salida
│           └── equipment/
├── components/
│   ├── layout/Navbar.tsx           # Menú + auth + selector de idioma
│   ├── layout/Footer.tsx           # Footer con branding desde env vars
│   ├── ui/TripCard.tsx             # Tarjeta de salida con disponibilidad
│   ├── ui/DifficultyBadge.tsx
│   ├── ui/DatePicker.tsx
│   ├── ui/I18nTextFields.tsx       # Campos multilingüe con auto-traducción
│   ├── ui/Toaster.tsx              # Sistema de toasts (Radix UI)
│   └── booking/BookingForm.tsx     # Reserva para usuarios auth y guests
├── lib/
│   ├── supabase/server.ts          # Cliente Supabase SSR (cookies)
│   ├── supabase/client.ts          # Cliente Supabase browser
│   ├── supabase/admin.ts           # Cliente service role (bypasa RLS)
│   ├── supabase/middleware.ts      # Helpers de auth en middleware
│   ├── utils.ts                    # cn(), formatDate/Time/Price, getI18n(), getBirthDateBounds(), label maps
│   └── email.ts                    # Templates Resend: confirmación, verificación guest, contacto
├── config/
│   └── branding.ts                 # BRANDING desde NEXT_PUBLIC_* env vars
├── types/index.ts                  # Todos los tipos TypeScript del dominio
├── i18n.ts                         # Configuración next-intl
├── middleware.ts                    # Protección de rutas + i18n routing
└── navigation.ts                   # Link/useRouter tipados de next-intl
```

## Base de datos (Supabase)

| Tabla | Columnas clave |
|---|---|
| `profiles` | `id` (= auth.users.id), `full_name`, `phone`, `birth_date`, `certification_level`, `is_admin`, `owned_equipment[]` |
| `spots` | `id`, `slug`, `name`, `name_i18n`, `description_i18n`, `depth_min/max`, `difficulty`, `lat/lng`, `images[]`, `visible` |
| `courses` | `id`, `slug`, `title`, `title_i18n`, `description_i18n`, `certification_obtained`, `visible` |
| `trips` | `id`, `type` (dive/course), `spot_id`, `course_id`, `title`, `title_i18n`, `date`, `time`, `duration_minutes`, `max_participants`, `price`, `difficulty_level`, `status` |
| `bookings` | `id`, `user_id` (nullable), `trip_id`, `status` (pending/confirmed/cancelled), `needed_equipment[]`, `guest_name/email/phone`, `verification_token`, `verified` |
| `equipment` | `id`, `name`, `type`, `size`, `status` (available/maintenance/retired) |
| `equipment_bookings` | `booking_id`, `equipment_id`, `status` (reserved/returned) |

**Vista**: `trips_with_availability` — trips + nombre del spot + `available_spots` + `confirmed_participants`.

## Auth y protección de rutas

- `middleware.ts` protege `/admin`, `/dashboard`, `/perfil`
- Admin requiere `is_admin = true` en `profiles`
- Sesión en cookies HTTP-only via `@supabase/ssr`
- Perfil creado automáticamente por trigger `handle_new_user` en Supabase
- Guest bookings: sin auth, verificación por email con token → `/reserva/verificar?token=...`

## Patrones y convenciones

**Páginas admin**: Server Component (`page.tsx`) carga datos, Client Component (`*Manager.tsx`) gestiona estado y acciones.

**i18n en componentes**:
- Server: `getTranslations(namespace)` + `getLocale()`
- Client: `useTranslations(namespace)` + `useLocale()`
- Campos DB multilingüe: `getI18n(field, locale, fallback)` en `utils.ts`

**Traducciones**: `messages/{es,ca,en}.json`. Auto-traducción via `/api/translate` (MyMemory API).

**Estilos globales** en `globals.css`: `.card`, `.btn-primary`, `.btn-secondary`, `.badge`, `.badge-green/yellow/red/blue`, `.form-input`, `.form-label`, `.section-title`, `.container-main`.

**Branding**: todo desde `src/config/branding.ts` → env vars `NEXT_PUBLIC_*`. Sin valores hardcodeados en el código.

**Páginas con datos en tiempo real**: `export const dynamic = 'force-dynamic'` en el Server Component.

## API Routes

- `POST /api/bookings` — crear reserva (auth o guest, envía email)
- `POST /api/translate` — auto-traducción para admin (MyMemory)
- `POST /api/contact` — formulario de contacto (email al admin + auto-reply)

## Variables de entorno relevantes

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_BUSINESS_NAME / TAGLINE / PHONE / EMAIL / ADDRESS / INSTAGRAM / FACEBOOK
RESEND_API_KEY
RESEND_FROM_EMAIL
ADMIN_EMAIL
```
