// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthShell from '@/components/layout/AuthShell'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

export const viewport = {
  width: 'device-width',
  initialScale: 1
}

export const metadata: Metadata = {
  title: 'SEO Keyword Rankings — IT Training Institute',
  description: 'Premium SEO Keyword Ranking Dashboard for IT training hub courses.',
  robots: 'noindex, nofollow'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full bg-slate-50 font-sans text-slate-900 antialiased selection:bg-emerald-500/10 selection:text-emerald-700">
        {/* AuthShell handles everything:
            - /login and /register → full-screen, NO sidebar
            - all other routes    → sidebar + main layout */}
        <AuthShell>{children}</AuthShell>
      </body>
    </html>
  )
}
