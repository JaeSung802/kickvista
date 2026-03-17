import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KickVista – Football Intelligence Hub",
  description: "Live football scores, standings & AI match analysis for all major leagues.",
};

/**
 * AdSense publisher ID is read at build time from NEXT_PUBLIC_ADSENSE_ID.
 * In development (env var absent) the script is never loaded and all ad
 * units show styled placeholders — no external requests, no policy risk.
 *
 * strategy="afterInteractive" loads the script after Next.js hydration so
 * it never blocks the critical rendering path or First Contentful Paint.
 */
const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        {ADSENSE_ID && (
          <Script
            id="adsense-init"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
