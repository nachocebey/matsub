import type { Metadata } from 'next'
import { ContactForm } from './ContactForm'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = { title: 'Contacte' }

export default async function ContactoPage() {
  const t = await getTranslations('contact')

  const INFO = [
    {
      icon: MapPin,
      label: t('address'),
      value: t('addressValue'),
    },
    {
      icon: Phone,
      label: t('phone'),
      value: '+34 937 00 12 34',
      href: 'tel:+34937001234',
    },
    {
      icon: Mail,
      label: t('email'),
      value: 'info@matsub.cat',
      href: 'mailto:info@matsub.cat',
    },
    {
      icon: Clock,
      label: t('hours'),
      value: t('hoursValue'),
    },
  ]

  return (
    <div className="pt-16">
      <div className="bg-ocean-950 text-white py-16">
        <div className="container-main">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{t('title')}</h1>
          <p className="text-ocean-300 text-lg max-w-2xl">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <div className="container-main py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Contact info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-ocean-950 mb-6">{t('whereToFind')}</h2>
              <div className="space-y-6">
                {INFO.map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ocean-100 shrink-0">
                      <Icon className="h-5 w-5 text-ocean-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ocean-500 mb-0.5">{label}</p>
                      {href ? (
                        <a href={href} className="text-ocean-800 hover:text-ocean-600 font-medium transition-colors">
                          {value}
                        </a>
                      ) : (
                        <p className="text-ocean-800 font-medium whitespace-pre-line">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map placeholder */}
            <div className="rounded-2xl bg-ocean-100 h-64 flex items-center justify-center text-ocean-400 border border-ocean-200">
              <div className="text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{t('mapAlt')}</p>
                <p className="text-xs">{t('mapLabel')}</p>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h2 className="text-2xl font-bold text-ocean-950 mb-6">{t('formTitle')}</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  )
}
