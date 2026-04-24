import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'MATSUB – Centre de Busseig de Mataró',
    template: '%s | MATSUB',
  },
  description: "Centro de buceo profesional en Mataró. Inmersiones, cursos PADI y alquiler de equipamiento para todos los niveles.",
  keywords: ['buceo', 'mataró', 'padi', 'inmersiones', 'cursos buceo', 'maresme'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
