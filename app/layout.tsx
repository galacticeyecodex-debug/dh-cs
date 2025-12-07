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
 * - Sets default SEO metadata (title, description).
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { ToastProvider } from "@/components/providers/toast-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
