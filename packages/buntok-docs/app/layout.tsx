import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = "https://buntok.pitok.my.id";

export const metadata: Metadata = {
  title: {
    default: "Buntok Framework - Fast Web Framework for Bun",
    template: "%s | Buntok Framework",
  },
  description:
    "A fast, type-safe web framework for Bun with built-in auth, validation, caching, rate limiting, and zero dependencies. Decorator-first or functional API.",
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Buntok Framework - Decorator-Powered Web Framework for Bun",
    description:
      "Fast, type-safe web framework for Bun. Built-in auth, validation, caching, rate limiting. Zero config, zero dependencies.",
    url: baseUrl,
    siteName: "Buntok Framework",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Buntok Framework - Decorator-Powered Web Framework for Bun",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buntok Framework - Decorator-Powered Web Framework for Bun",
    description:
      "Fast, type-safe web framework for Bun. Built-in auth, validation, caching, rate limiting. Zero config, zero dependencies.",
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "Buntok Framework - Decorator-Powered Web Framework for Bun",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Buntok Framework",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cross-platform",
    description:
      "A fast, type-safe web framework for Bun with built-in auth, validation, caching, rate limiting, and zero dependencies.",
    url: baseUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: "Buntok",
      url: baseUrl,
    },
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
