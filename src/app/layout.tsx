import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Finanças — Daniel & Priscila | AG Security',
  description: 'Controle financeiro pessoal e empresarial',
  manifest: '/manifest.json',
  themeColor: '#1a56db',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}
