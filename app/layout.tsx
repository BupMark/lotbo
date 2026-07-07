import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import CookieBanner from "../components/CookieBanner";
import StoreBanner from "../components/StoreBanner";
import AnalyticsBanner from "../components/AnalyticsBanner";
import Preloader from "../components/Preloader";
import TabBarGlobal from "../components/TabBarGlobal";
import { Analytics } from "@vercel/analytics/react";
import AmplitudeInit from "../components/AmplitudeInit";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
});

export const metadata: Metadata = {
  title: "Lotbo — Tous les événements, un seul endroit",
  description: "Découvre les événements autour de toi. Concerts, marchés, expos, conférences.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lotbo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta name="google-site-verification" content="8wSKUg7KlocohGadZaoocuZIJiMhGtwWUtf8UNwzais" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#C8431A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Lotbo" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" href="/Logomark.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${dmSans.variable} ${playfairDisplay.variable} antialiased`}>
        <Preloader />
        {children}
        <TabBarGlobal />
        <StoreBanner />
        <CookieBanner />
        <AnalyticsBanner />
        <Analytics />
        <AmplitudeInit />
        {/* ── Enregistrement Service Worker PWA ─────────────────────────── */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) {
                      console.log('SW enregistré:', reg.scope);
                    })
                    .catch(function(err) {
                      console.log('SW erreur:', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
