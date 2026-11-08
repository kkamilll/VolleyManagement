import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SeasonArchiveProvider } from '@/lib/season-archive-context';
import ArchiveModeBanner from '@/components/ArchiveModeBanner';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import Footer from '@/components/Footer';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';

export const metadata: Metadata = {
  title: 'Angels ZTP Volleyball Team',
  description: 'Oficjalny system drużyny siatkarskiej Angels ZTP: Sparingi, Mecze ligowe, statystyki VolleyStation, Turnieje oraz Składki.',
  applicationName: 'Angels ZTP',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Angels ZTP',
  },
  icons: {
    icon: [
      { url: '/logo.jpg' },
      { url: '/icon-192.jpg', sizes: '192x192', type: 'image/jpeg' },
      { url: '/icon-512.jpg', sizes: '512x512', type: 'image/jpeg' }
    ],
    apple: [
      { url: '/apple-touch-icon.jpg', sizes: '180x180', type: 'image/jpeg' }
    ]
  },
};

export const viewport: Viewport = {
  themeColor: '#07090c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Angels ZTP" />
      </head>
      <body className="font-sans antialiased flex flex-col min-h-screen bg-[#05070b] text-slate-100 selection:bg-sky-500 selection:text-slate-950 relative">
        {/* Dynamic Cyber-Athletic Court Background */}
        <div className="cyber-court-bg" />
        <div className="court-lines-overlay" />

        <div className="relative z-10 flex flex-col min-h-screen">
          <AuthProvider>
            <SeasonArchiveProvider>
              <ArchiveModeBanner />
              <Navbar />
              <main className="flex-1 pb-24 md:pb-16">
                {children}
              </main>
              <Footer />
              <BottomNav />
              <PwaInstallPrompt />
            </SeasonArchiveProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
