import { DialogService } from "@/components/common/dialog-service";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/session-provider";
import { PerformanceMonitor } from "@/components/common/performance-monitor";
// import { STATIC_CRITICAL_CSS } from "@/components/common/critical-css";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["monospace"],
});

export const metadata: Metadata = {
  title: {
    default: "Grocery App - Smart Shopping Lists & Recipes",
    template: "%s | Grocery App",
  },
  description:
    "A smart grocery shopping companion for families. Create shopping lists, manage recipes, and never forget what you need to buy. Perfect for family meal planning and grocery organization.",
  keywords: [
    "grocery app",
    "shopping list",
    "meal planning",
    "family shopping",
    "recipe management",
    "grocery organizer",
    "smart shopping",
    "family meals",
    "grocery lists",
    "meal prep",
  ],
  authors: [{ name: "Grocery App Team" }],
  creator: "Grocery App",
  publisher: "Grocery App",
  formatDetection: { email: false, address: false, telephone: false },
  metadataBase: new URL("http://localhost:3000"),
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/appicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/appicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/appicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/appicon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/appicon-256x256.png", sizes: "256x256", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Grocery App - Smart Shopping Lists & Recipes",
    description:
      "A smart grocery shopping companion for families. Create shopping lists, manage recipes, and never forget what you need to buy.",
    siteName: "Grocery App",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Grocery App - Smart Shopping Lists & Recipes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grocery App - Smart Shopping Lists & Recipes",
    description:
      "A smart grocery shopping companion for families. Create shopping lists, manage recipes, and never forget what you need to buy.",
    images: ["/og-image.png"],
    creator: "@groceryapp",
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Grocery App",
  },
  other: {
    "theme-color": "#000000",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "origin-when-cross-origin",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
      >
        <AuthProvider>
          <QueryProvider>
            {children}
            <DialogService />
            <PerformanceMonitor />
          </QueryProvider>
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
