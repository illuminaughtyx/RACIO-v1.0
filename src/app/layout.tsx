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
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "RACIO — The Ratio Engine",
    description: "Paste once. Post everywhere. Convert videos to all social formats instantly.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "RACIO — The Ratio Engine",
    description: "Paste once. Post everywhere. Convert videos to all social formats instantly.",
    images: ["/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${jetbrains.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
