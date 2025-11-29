import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/auth/AuthProvider";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { QueryProvider } from "./components/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeuReed - AI-Powered RSS Feed Reader | Semantic Search & Personalization",
  description: "Your RSS reader, but way smarter. Self-hosted feed reader with AI personalization, semantic search powered by pgvector, and 14 beautiful themes. Privacy-first, open source, and completely free.",
  keywords: ["RSS reader", "feed reader", "AI RSS", "semantic search", "self-hosted", "open source", "pgvector", "personalization", "Next.js"],
  authors: [{ name: "madpin", url: "https://github.com/madpin" }],
  creator: "madpin",
  publisher: "madpin",
  openGraph: {
    title: "NeuReed - AI-Powered RSS Feed Reader",
    description: "Your RSS reader, but way smarter. Self-hosted with AI personalization, semantic search, and beautiful themes.",
    url: "https://neureed.madpin.dev",
    siteName: "NeuReed",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NeuReed - AI-Powered RSS Feed Reader",
    description: "Your RSS reader, but way smarter. Self-hosted with AI personalization and semantic search.",
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
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Try to get theme from localStorage (set by ThemeProvider)
                  const savedTheme = localStorage.getItem('neureed-theme');
                  const savedFontSize = localStorage.getItem('neureed-fontSize');
                  
                  if (savedTheme && savedTheme !== 'system') {
                    const allThemes = ['light', 'dark', 'nord-light', 'nord-dark', 'solarized-light', 'solarized-dark', 'barbie-light', 'barbie-dark', 'purple-light', 'purple-dark', 'orange-light', 'orange-dark', 'rainbow-light', 'rainbow-dark'];
                    document.documentElement.classList.remove(...allThemes);
                    document.documentElement.classList.add(savedTheme);
                    
                    // Add dark class for dark variants
                    if (savedTheme.includes('-dark') || savedTheme === 'dark') {
                      document.documentElement.classList.add('dark');
                    }
                  } else if (savedTheme === 'system') {
                    // Apply system preference
                    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (isDark) {
                      document.documentElement.classList.add('dark');
                    }
                  }
                  
                  // Apply font size
                  if (savedFontSize) {
                    const sizeMap = { small: '14px', medium: '16px', large: '18px' };
                    document.documentElement.style.fontSize = sizeMap[savedFontSize] || savedFontSize || '16px';
                  }
                } catch (e) {
                  // Ignore errors
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              {children}
              {modal}
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
