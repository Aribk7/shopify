import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Script Writer - AI-Powered Script Generator',
  description: 'Generate scripts using xAI API',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

