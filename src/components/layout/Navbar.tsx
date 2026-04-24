'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, Waves, ChevronDown, User, LogOut, LayoutDashboard, Settings, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useTranslations, useLocale } from 'next-intl'
import { locales, type Locale } from '@/i18n'
import type { Profile } from '@/types'

const LOCALE_LABELS: Record<Locale, string> = { es: 'ES', ca: 'CA', en: 'EN' }

export function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [scrolled, setScrolled] = useState(false)

  const NAV_LINKS = [
    { href: '/spots', label: t('spots') },
    { href: '/cursos', label: t('courses') },
    { href: '/calendario', label: t('calendar') },
    { href: '/sobre-nosotros', label: t('about') },
    { href: '/contacto', label: t('contact') },
  ]

  // Strip locale prefix from pathname for active link detection
  const strippedPath = pathname.replace(new RegExp(`^/(${locales.join('|')})`), '') || '/'

  const isHome = strippedPath === '/'

  useEffect(() => {
    const client = supabase
    const fetchUser = async () => {
      const { data: { user: authUser } } = await client.auth.getUser()
      setUser(authUser)
      if (!authUser) { setProfile(null); return }
      const { data } = await client.from('profiles').select('*').eq('id', authUser.id).single()
      setProfile(data)
    }
    fetchUser()

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) { setProfile(null); return }
      client.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => setProfile(data))
    })
    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
    setLangMenuOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setUser(null)
    router.push('/')
    router.refresh()
  }

  const switchLocale = (newLocale: Locale) => {
    // Replace current locale prefix in pathname
    const newPath = pathname.replace(new RegExp(`^/(${locales.join('|')})`), '') || '/'
    router.push(newLocale === 'es' ? newPath : `/${newLocale}${newPath}`)
    setLangMenuOpen(false)
  }

  const navBg = isHome && !scrolled
    ? 'bg-transparent'
    : 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-ocean-100'

  const textColor = isHome && !scrolled ? 'text-white' : 'text-ocean-800'
  const logoColor = isHome && !scrolled ? 'text-white' : 'text-ocean-600'

  return (
    <header className={cn('fixed inset-x-0 top-0 z-50 transition-all duration-300', navBg)}>
      <nav className="container-main flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className={cn('flex items-center gap-2 font-bold text-xl', logoColor)}>
          <Waves className="h-6 w-6" />
          MATSUB
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-ocean-400',
                strippedPath.startsWith(href) ? 'text-ocean-400' : textColor
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop right: lang + auth */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className={cn('flex items-center gap-1 text-xs font-medium transition-colors hover:text-ocean-400', textColor)}
            >
              <Globe className="h-3.5 w-3.5" />
              {LOCALE_LABELS[locale]}
              <ChevronDown className="h-3 w-3" />
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-24 rounded-xl bg-white shadow-lg ring-1 ring-ocean-100 py-1">
                {locales.map(l => (
                  <button
                    key={l}
                    onClick={() => switchLocale(l)}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm transition-colors',
                      l === locale ? 'text-ocean-600 font-semibold bg-ocean-50' : 'text-ocean-700 hover:bg-ocean-50'
                    )}
                  >
                    {LOCALE_LABELS[l]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auth */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={cn('flex items-center gap-2 text-sm font-medium transition-colors hover:text-ocean-400', textColor)}
              >
                <User className="h-4 w-4" />
                {profile ? `${profile.first_name} ${profile.last_name}`.trim() || profile.full_name : (user?.email ?? 'Usuari')}
                <ChevronDown className="h-4 w-4" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-white shadow-lg ring-1 ring-ocean-100 py-1">
                  <Link href="/perfil" className="flex items-center gap-2 px-4 py-2 text-sm text-ocean-700 hover:bg-ocean-50">
                    <User className="h-4 w-4" />
                    {t('profile')}
                  </Link>
                  <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-ocean-700 hover:bg-ocean-50">
                    <LayoutDashboard className="h-4 w-4" />
                    {t('bookings')}
                  </Link>
                  {profile?.is_admin && (
                    <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-ocean-700 hover:bg-ocean-50">
                      <Settings className="h-4 w-4" />
                      {t('admin')}
                    </Link>
                  )}
                  <hr className="my-1 border-ocean-100" />
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('signOut')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login" className={cn('text-sm font-medium transition-colors hover:text-ocean-400', textColor)}>
                {t('signIn')}
              </Link>
              <Link href="/auth/register" className="btn-primary text-xs px-4 py-2">
                {t('register')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className={cn('md:hidden', textColor)}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-ocean-100 shadow-lg animate-slide-up">
          <div className="container-main py-4 space-y-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  strippedPath.startsWith(href) ? 'bg-ocean-50 text-ocean-700' : 'text-ocean-800 hover:bg-ocean-50'
                )}
              >
                {label}
              </Link>
            ))}
            <hr className="my-2 border-ocean-100" />
            {/* Language switcher mobile */}
            <div className="flex gap-2 px-3 py-2">
              {locales.map(l => (
                <button
                  key={l}
                  onClick={() => switchLocale(l)}
                  className={cn(
                    'text-xs font-medium px-2 py-1 rounded border transition-colors',
                    l === locale ? 'bg-ocean-600 text-white border-ocean-600' : 'text-ocean-600 border-ocean-200 hover:border-ocean-400'
                  )}
                >
                  {LOCALE_LABELS[l]}
                </button>
              ))}
            </div>
            <hr className="my-2 border-ocean-100" />
            {user ? (
              <>
                <Link href="/perfil" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ocean-800 hover:bg-ocean-50">
                  {t('profile')}
                </Link>
                <Link href="/dashboard" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ocean-800 hover:bg-ocean-50">
                  {t('bookings')}
                </Link>
                {profile?.is_admin && (
                  <Link href="/admin" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ocean-800 hover:bg-ocean-50">
                    {t('admin')}
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  {t('signOut')}
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link href="/auth/login" className="btn-secondary flex-1 text-center">{t('signIn')}</Link>
                <Link href="/auth/register" className="btn-primary flex-1 text-center">{t('register')}</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
