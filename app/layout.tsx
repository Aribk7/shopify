import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Script Writer - AI-Powered Script Generator',
  description: 'Generate scripts using xAI API',
  icons: {
    icon: '/favicon.png',
  },
}

import { BrandProvider } from '@/context/BrandContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <BrandProvider>
          {children}
        </BrandProvider>
      </body>
    </html>
  )
}

