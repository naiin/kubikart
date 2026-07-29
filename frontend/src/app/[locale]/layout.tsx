import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { AuthProvider } from "@/lib/auth";
import { getSiteUrl } from "@/lib/seo";
import "../globals.css";

const inter = localFont({
  src: "../../assets/fonts/inter/Inter-Variable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
  style: "normal",
});

const montserrat = localFont({
  src: "../../assets/fonts/montserrat/Montserrat-Variable.woff2",
  variable: "--font-montserrat",
  display: "swap",
  weight: "100 900",
  style: "normal",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "KubikArt – 3D-Druck, Lasergravur & Kreative Lösungen",
  description: "KubikArt bietet professionellen 3D-Druck, Lasergravur, Brand Kits und mehr. Ihr Partner für kreative Lösungen in Blaustein.",
  icons: {
    icon: [{ url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    siteName: "Kubikart",
    type: "website",
  },
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`@/messages/${locale}.json`)).default;

  return (
    <html lang={locale} className={`${inter.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CookieBanner />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
