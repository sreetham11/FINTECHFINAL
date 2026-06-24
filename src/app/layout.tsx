import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'NETS Quest — Every Tap Tells Your Story',
  description: 'NETS Quest reimagines payments as lifestyle moments. A fintech lifestyle app prototype for Gen Z & Millennials in Singapore — built for PolyFinTech100 API Hackathon 2026.',
  keywords: 'NETS, Singapore, fintech, payments, lifestyle, Gen Z, hackathon, PolyFinTech100',
  authors: [{ name: 'NETS Quest Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('nets-quest-theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        {/* Leaflet CSS for live map */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body>
        <div className="app-shell">
          <Header />
          {children}
          <BottomNav />
        </div>
        <div className="grain-overlay" />
      </body>
    </html>
  );
}
