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
  title: "NeuReed - Intelligent RSS Reader",
  description: "A highly customizable, LLM-focused RSS reader with semantic search capabilities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
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
            <ThemeProvider>{children}</ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
