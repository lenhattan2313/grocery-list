import { DialogService } from "@/components/common/dialog-service";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PerformanceMonitor } from "@/components/common/performance-monitor";
import { SplashScreen } from "@/components/common/splash-screen";
import { PWAInstallPrompt } from "@/components/dynamic-imports";
import { PWANavigationHandler } from "@/components/common/pwa-navigation-handler";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
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
    default: "Grocery App",
    template: "%s | Grocery App",
  },
  description:
    "A smart grocery shopping companion for families. Create shopping lists, manage recipes, and never forget what you need to buy.",
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
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icon512_rounded.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon512_maskable.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Grocery App",
    description:
      "A smart grocery shopping companion for families. Create shopping lists, manage recipes, and never forget what you need to buy.",
    siteName: "Grocery App",
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "Grocery App" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grocery App",
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
    statusBarStyle: "black-translucent",
    title: "Grocery App",
  },
  other: {
    "theme-color": "#000000",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "origin-when-cross-origin",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Grocery App",
    "mobile-web-app-capable": "yes",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Required iOS PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Grocery App" />
        <link rel="apple-touch-icon" href="/icon512_maskable.png" />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Check for standalone mode (iOS) or display mode standalone (Android/other)
              const isStandalone = window.navigator.standalone || 
                window.matchMedia('(display-mode: standalone)').matches ||
                window.matchMedia('(display-mode: window-controls-overlay)').matches;
              
              if (isStandalone) {
                // Store the current path to detect navigation changes
                let currentPath = window.location.pathname;
                
                document.addEventListener('click', function (e) {
                  const target = e.target.closest('a');
                  
                  // Only handle internal links
                  if (target && 
                      target.href && 
                      target.href.startsWith(window.location.origin) &&
                      !target.href.includes('#') && // Skip anchor links
                      !target.hasAttribute('download') && // Skip download links
                      !target.hasAttribute('target') && // Skip external links
                      !target.classList.contains('external-link')) {
                    
                    e.preventDefault();
                    
                    // Use history.pushState for client-side navigation
                    const url = new URL(target.href);
                    const path = url.pathname + url.search + url.hash;
                    
                    // Update the URL without full page reload
                    window.history.pushState({}, '', path);
                    
                    // Trigger a custom event to notify the app of navigation
                    window.dispatchEvent(new CustomEvent('pwa-navigation', {
                      detail: { path: url.pathname }
                    }));
                    
                    // Update current path
                    currentPath = url.pathname;
                  }
                });
                
                // Handle browser back/forward buttons
                window.addEventListener('popstate', function() {
                  const newPath = window.location.pathname;
                  if (newPath !== currentPath) {
                    window.dispatchEvent(new CustomEvent('pwa-navigation', {
                      detail: { path: newPath }
                    }));
                    currentPath = newPath;
                  }
                });
              }
            `,
          }}
        />
        <ThemeProvider>
          <AuthProvider>
            <QueryProvider>
              <SplashScreen>
                {children}
                <DialogService />
                <PerformanceMonitor />
                <PWAInstallPrompt />
                <PWANavigationHandler />
              </SplashScreen>
            </QueryProvider>
            <Toaster position="top-center" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
