import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'News Globe — World News Map',
  description:
    'Explore global news sources on a 3D interactive globe. See where news is coming from in real time.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SCEFGPQ63Q"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SCEFGPQ63Q');
          `}
        </Script>
      </head>
      <body className="antialiased bg-black text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
