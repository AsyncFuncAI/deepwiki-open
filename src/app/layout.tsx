import type { Metadata } from "next";
import { Noto_Sans_JP, Noto_Serif_JP, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MsalWrapper } from "@/components/MsalWrapper";
import { AuthGate } from "@/components/AuthGate";

// Japanese-friendly fonts
const notoSansJP = Noto_Sans_JP({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-serif-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deepwiki.AI",
  description: "Created by Observability Team",
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${notoSansJP.variable} ${notoSerifJP.variable} ${geistMono.variable} antialiased`}
      >
        <MsalWrapper>
          <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
            <LanguageProvider>
              <AuthGate>
                {children}
              </AuthGate>
            </LanguageProvider>
          </ThemeProvider>
        </MsalWrapper>
      </body>
    </html>
  );
}
