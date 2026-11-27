import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ClubProvider } from '@/context/ClubContext';
import { SeasonArchiveProvider } from '@/lib/season-archive-context';
import ArchiveModeBanner from '@/components/ArchiveModeBanner';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import Footer from '@/components/Footer';
import UnreadAnnouncementPopup from '@/components/UnreadAnnouncementPopup';
import AuthGuard from '@/components/AuthGuard';
import { ToastProvider } from '@/components/ToastProvider';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
});

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
  themeColor: '#f6f8fb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className={`theme-light light ${plusJakartaSans.variable} ${outfit.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Angels ZTP" />
      </head>
      <body className="font-sans antialiased flex flex-col min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-amber-400 selection:text-slate-950 relative">
        {/* Dynamic Cyber-Athletic Court Background */}
        <div className="cyber-court-bg" />
        <div className="court-lines-overlay" />

        <div className="relative z-10 flex flex-col min-h-screen">
          <ToastProvider>
            <AuthProvider>
              <ClubProvider>
                <AuthGuard>
                  <SeasonArchiveProvider>
                    <ArchiveModeBanner />
                    <UnreadAnnouncementPopup />
                    <Navbar />
                    <main className="flex-1 flex flex-col">
                      {children}
                    </main>
                    <Footer />
                    <BottomNav />
                  </SeasonArchiveProvider>
                </AuthGuard>
              </ClubProvider>
            </AuthProvider>
          </ToastProvider>
        </div>
      </body>
    </html>
  );
}
