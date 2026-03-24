import './globals.css';
import { I18nProvider } from '../lib/i18n';
import Navbar from '../components/Navbar';
import WhatsAppButton from '../components/WhatsAppButton';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cvplatform.com';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'CV Platform — Gestión Logística y Rastreo de Envíos',
    template: '%s | CV Platform',
  },
  description:
    'Plataforma SaaS de gestión logística con rastreo en tiempo real, casillero internacional, transporte nacional y gestión aduanera. Rastrea tu paquete sin necesidad de cuenta.',
  keywords: [
    'rastreo de paquetes',
    'casillero internacional',
    'logística',
    'envíos',
    'courier',
    'transporte nacional',
    'gestión aduanera',
    'importación',
    'seguimiento de envíos',
    'plataforma logística',
    'freight',
    'tracking',
  ],
  authors: [{ name: 'CV Platform' }],
  creator: 'CV Platform',
  publisher: 'CV Platform',
  verification: {
    google: 'UdD4G_Ehlprx75eLVin75rXJvSr2z53DBtHueMBLhCw',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    alternateLocale: ['en_US', 'de_DE', 'pt_BR', 'fr_FR', 'it_IT'],
    url: SITE_URL,
    siteName: 'CV Platform',
    title: 'CV Platform — Gestión Logística y Rastreo de Envíos',
    description:
      'Rastrea tus envíos en tiempo real. Casillero internacional, transporte nacional, gestión aduanera y más. Sin necesidad de cuenta para rastrear.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CV Platform — Sistema de Gestión Logística',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CV Platform — Gestión Logística y Rastreo de Envíos',
    description:
      'Rastrea tus envíos en tiempo real. Casillero internacional, transporte nacional y gestión aduanera.',
    images: ['/og-image.png'],
    creator: '@cvplatform',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.json',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1e3a5f' },
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'CV Platform',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    'Empresa logística con más de 10 años de experiencia en importación y transporte de mercancía. Casillero internacional, transporte nacional y gestión aduanera.',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['Spanish', 'English', 'German', 'Portuguese', 'French', 'Italian'],
  },
  service: [
    { '@type': 'Service', name: 'Casillero Internacional', description: 'Dirección en EE.UU. para compras online internacionales' },
    { '@type': 'Service', name: 'Transporte Nacional', description: 'Retiro y entrega puerta a puerta en todo el territorio nacional' },
    { '@type': 'Service', name: 'Gestión Aduanera', description: 'Tramitación de aranceles, documentación y liberación de mercancía' },
    { '@type': 'Service', name: 'Consolidación de Carga', description: 'Agrupación de paquetes para reducir costos de flete' },
    { '@type': 'Service', name: 'Entrega Express', description: 'Servicio prioritario para envíos urgentes con seguimiento por hora' },
    { '@type': 'Service', name: 'Portal Corporativo', description: 'Gestión multi-usuario para empresas con reportes y control de costos' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-gray-50 text-gray-900 font-sans antialiased min-h-screen flex flex-col">
        <I18nProvider>
          <Navbar />
          {children}
          <WhatsAppButton />
        </I18nProvider>
      </body>
    </html>
  );
}
