/**
 * ROOT LAYOUT
 * ----------------------------------------------------------------------------
 * This is the top-level layout component that wraps the entire application.
 *
 * FUNCTIONALITY:
 * - Defines the HTML structure (`html`, `body`) shared by all pages.
 * - Applies global fonts (`Geist` and `Geist_Mono`) via Next.js Font optimization.
 * - Imports global CSS (`globals.css`) for Tailwind and custom styles.
 * - Injects global providers, such as the `ToastProvider` for notifications, ensuring
 *   they are available throughout the app hierarchy.
 * - Initializes the modifier aggregator cache at app startup.
 * - Sets default SEO metadata (title, description).
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import localFont from "next/font/local";

import "./globals.css";
import { ToastProvider } from "@/components/providers/toast-provider";
import RootLayoutClient from "./layout-client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

const eveleth = localFont({
  src: "./fonts/Eveleth-Clean-Regular.woff2",
  variable: "--font-eveleth",
});

export const metadata: Metadata = {
  title: "Daggerheart Companion",
  description: "Digital Character Sheet for Daggerheart RPG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} ${eveleth.variable} antialiased`}
      >
        <RootLayoutClient>
          <ToastProvider />
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}
