import type { Metadata } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "RACIO — The Ratio Engine",
  description: "Convert any video to Reels, Shorts & Feed formats instantly. No watermarks, no login required.",
  keywords: ["video converter", "aspect ratio", "reels", "shorts", "youtube", "instagram", "tiktok"],
  icons: {
    icon: [
      { url: "/favicon.svg", sizes: "32x32", type: "image/svg+xml" },
      { url: "/favicon-16.svg", sizes: "16x16", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
  },
  openGraph: {
    title: "RACIO — The Ratio Engine",
    description: "Paste once. Post everywhere. Convert videos to all social formats instantly.",
    type: "website",
    url: "https://racio.app",
    siteName: "RACIO",
    images: [{ url: "https://racio.app/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "RACIO — The Ratio Engine",
    description: "Paste once. Post everywhere. Convert videos to all social formats instantly.",
    images: ["https://racio.app/og-image.png"],
    creator: "@racioapp",
  },
  metadataBase: new URL("https://racio.app"),
};

import GoogleAnalytics from "@/components/GoogleAnalytics";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${jetbrains.variable}`}>
      <body className={inter.className}>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
