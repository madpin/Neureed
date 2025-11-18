"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { useSession } from "next-auth/react";
import { Toaster } from "sonner";

type ThemeMode = "light" | "dark" | "nord-light" | "nord-dark" | "solarized-light" | "solarized-dark" | "barbie-light" | "barbie-dark" | "purple-light" | "purple-dark" | "orange-light" | "orange-dark" | "rainbow-light" | "rainbow-dark" | "system";

interface ThemeContextType {
  theme: ThemeMode;
  fontSize: string;
  setTheme: (theme: ThemeMode) => void;
  setFontSize: (size: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [fontSize, setFontSizeState] = useState<string>("medium");
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Apply font size to document
  const applyFontSize = useCallback((size: string) => {
    const root = document.documentElement;
    const sizeMap: Record<string, string> = {
      small: "14px",
      medium: "16px",
      large: "18px",
    };
    root.style.fontSize = sizeMap[size] || size || "16px";
    // Save to localStorage for blocking script
    localStorage.setItem('neureed-fontSize', size);
  }, []);

  // Apply theme logic
  const applyTheme = useCallback((themeMode: ThemeMode) => {
    const root = document.documentElement;
    const body = document.body;
    const allThemes = ["light", "dark", "nord-light", "nord-dark", "solarized-light", "solarized-dark", "barbie-light", "barbie-dark", "purple-light", "purple-dark", "orange-light", "orange-dark", "rainbow-light", "rainbow-dark"];
    
    root.classList.remove(...allThemes);
    body.classList.remove(...allThemes);

    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      root.classList.toggle("dark", mediaQuery.matches);
      body.classList.toggle("dark", mediaQuery.matches);
    } else if (themeMode === "nord-dark" || themeMode === "solarized-dark" || themeMode === "barbie-dark" || themeMode === "purple-dark" || themeMode === "orange-dark" || themeMode === "rainbow-dark") {
      // Apply both theme class and dark so dark: utilities work
      root.classList.add(themeMode, "dark");
      body.classList.add(themeMode, "dark");
    } else {
      root.classList.add(themeMode);
      body.classList.add(themeMode);
    }
    
    // Save to localStorage for blocking script
    localStorage.setItem('neureed-theme', themeMode);
  }, []);

  // Public setters that update state and apply immediately
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  const setFontSize = (newSize: string) => {
    setFontSizeState(newSize);
    applyFontSize(newSize);
  };

  // Load initial preferences
  useEffect(() => {
    async function loadUserPreferences() {
      // First, try to load from localStorage immediately
      const savedTheme = localStorage.getItem('neureed-theme');
      const savedFontSize = localStorage.getItem('neureed-fontSize');
      
      if (savedTheme && ["light", "dark", "nord-light", "nord-dark", "solarized-light", "solarized-dark", "barbie-light", "barbie-dark", "purple-light", "purple-dark", "orange-light", "orange-dark", "rainbow-light", "rainbow-dark", "system"].includes(savedTheme)) {
        setThemeState(savedTheme as ThemeMode);
        applyTheme(savedTheme as ThemeMode);
      }
      
      if (savedFontSize) {
        setFontSizeState(savedFontSize);
        applyFontSize(savedFontSize);
      }
      
      if (!session?.user) {
        setMounted(true);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user/preferences");
        const data = await response.json();
        const prefs = data.data?.preferences;

        if (prefs?.theme && ["light", "dark", "nord-light", "nord-dark", "solarized-light", "solarized-dark", "barbie-light", "barbie-dark", "purple-light", "purple-dark", "orange-light", "orange-dark", "rainbow-light", "rainbow-dark", "system"].includes(prefs.theme)) {
          setTheme(prefs.theme as ThemeMode);
        }
        
        if (prefs?.fontSize) {
          setFontSize(prefs.fontSize);
        }
      } catch (err) {
        console.error("Failed to load theme settings:", err);
      } finally {
        setMounted(true);
        setIsLoading(false);
      }
    }

    loadUserPreferences();
  }, [session]);

  // System theme listener
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        document.documentElement.classList.toggle("dark", e.matches);
        document.body.classList.toggle("dark", e.matches);
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Listen for preference updates
  useEffect(() => {
    const handlePreferencesUpdate = (event: CustomEvent) => {
      const { theme: themeName, fontSize: newFont } = event.detail;
      if (themeName && ["light", "dark", "nord-light", "nord-dark", "solarized-light", "solarized-dark", "barbie-light", "barbie-dark", "purple-light", "purple-dark", "orange-light", "orange-dark", "rainbow-light", "rainbow-dark", "system"].includes(themeName)) {
        setTheme(themeName as ThemeMode);
      }
      if (newFont) {
        setFontSize(newFont);
      }
    };

    window.addEventListener("preferencesUpdated" as any, handlePreferencesUpdate);
    return () => window.removeEventListener("preferencesUpdated" as any, handlePreferencesUpdate);
  }, []);

  // Show loading state until theme is ready
  if (isLoading) {
    return (
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        background: 'var(--background)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        opacity: 0,
        animation: 'fadeIn 0.3s ease-in-out forwards',
        animationDelay: '0.1s'
      }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fadeIn {
            to { opacity: 1; }
          }
        `}} />
      </div>
    );
  }

  // Determine the Sonner theme based on current theme
  const getSonnerTheme = (): "light" | "dark" | "system" => {
    if (theme === "system") return "system";
    
    // Check if current theme is a dark variant (ends with "-dark" or is exactly "dark")
    if (theme === "dark" || theme.endsWith("-dark")) {
      return "dark";
    }
    
    // All other themes are light variants
    return "light";
  };

  return (
    <ThemeContext.Provider value={{ theme, fontSize, setTheme, setFontSize }}>
      {children}
      <Toaster position="top-right" theme={getSonnerTheme()} richColors />
    </ThemeContext.Provider>
  );
}
