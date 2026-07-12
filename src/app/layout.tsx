import type { Metadata, Viewport } from "next";
export const dynamic = 'force-dynamic';
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Providers } from "@/lib/providers";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { OrganizationSchema, WebSiteSchema } from "@/lib/seo";
import Script from "next/script";
import ChatWidgetWrapper from "@/components/chat/chat-widget-wrapper";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://axel.marketplace";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#061A4A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    template: "%s | AXEL Marketplace",
    default: "AXEL Marketplace - Achetez maintenant, payez à votre rythme",
  },
  description: "La marketplace qui rend vos achats accessibles, simples et sécurisés. Paiement comptant ou à crédit.",
  keywords: "marketplace, e-commerce, credit, paiement, achats en ligne",
  manifest: "/manifest.json",
  icons: {
    icon: "/images/logo-favicon.png",
    shortcut: "/images/logo-favicon.png",
    apple: "/images/logo-favicon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AXEL",
  },
  openGraph: {
    title: "AXEL Marketplace",
    description: "La marketplace qui rend vos achats accessibles, simples et sécurisés.",
    type: "website",
    locale: "fr_FR",
    siteName: "AXEL",
    images: "/images/logo-favicon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
  metadataBase: new URL(SITE_URL),
  other: {
    "language": "fr-FR",
    "geo.region": "CI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${poppins.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/images/logo-favicon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`
          }}
        />
      </head>
      <body className="font-sans antialiased flex flex-col min-h-screen">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--bg-primary)] focus:border-2 focus:border-[var(--border-hover)] focus:rounded-lg focus:text-[var(--text-link)]">
          Aller au contenu principal
        </a>
        <OrganizationSchema />
        <WebSiteSchema />
        <Providers>
          <Navbar />
          <ErrorBoundary><main id="main-content" className="flex-1 w-full pt-20 lg:pt-24">{children}</main></ErrorBoundary>
          <Footer />
          <ChatWidgetWrapper />
        </Providers>
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ("serviceWorker" in navigator) {
                window.addEventListener("load", () => {
                  navigator.serviceWorker.register("/sw.js").catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
