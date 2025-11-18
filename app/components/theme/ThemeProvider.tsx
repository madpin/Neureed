"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { useSession } from "next-auth/react";

type ThemeMode = "light" | "dark" | "nord-light" | "nord-dark" | "solarized-light" | "solarized-dark" | "barbie-light" | "barbie-dark" | "purple-light" | "purple-dark" | "orange-light" | "orange-dark" | "system";

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

  // Apply font size to document
  const applyFontSize = useCallback((size: string) => {
    const root = document.documentElement;
    const sizeMap: Record<string, string> = {
      small: "14px",
      medium: "16px",
      large: "18px",
    };
    root.style.fontSize = sizeMap[size] || size || "16px";
  }, []);

  // Apply theme logic
  const applyTheme = useCallback((themeMode: ThemeMode) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "nord-light", "nord-dark", "solarized-light", "solarized-dark", "barbie-light", "barbie-dark", "purple-light", "purple-dark", "orange-light", "orange-dark");

    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      root.classList.toggle("dark", mediaQuery.matches);
    } else if (themeMode === "nord-dark" || themeMode === "solarized-dark" || themeMode === "barbie-dark" || themeMode === "purple-dark" || themeMode === "orange-dark") {
      // Apply both theme class and dark so dark: utilities work
      root.classList.add(themeMode, "dark");
    } else {
      root.classList.add(themeMode);
    }
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
      if (!session?.user) {
        setMounted(true);
        return;
      }

      try {
        const response = await fetch("/api/user/preferences");
        const data = await response.json();
        const prefs = data.data?.preferences;

        if (prefs?.theme && ["light", "dark", "nord-light", "nord-dark", "solarized-light", "solarized-dark", "barbie-light", "barbie-dark", "purple-light", "purple-dark", "orange-light", "orange-dark", "system"].includes(prefs.theme)) {
          setTheme(prefs.theme as ThemeMode);
        }
        
        if (prefs?.fontSize) {
          setFontSize(prefs.fontSize);
        }
      } catch (err) {
        console.error("Failed to load theme settings:", err);
      } finally {
        setMounted(true);
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
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Listen for preference updates
  useEffect(() => {
    const handlePreferencesUpdate = (event: CustomEvent) => {
      const { theme: themeName, fontSize: newFont } = event.detail;
      if (themeName && ["light", "dark", "nord-light", "nord-dark", "solarized-light", "solarized-dark", "barbie-light", "barbie-dark", "purple-light", "purple-dark", "orange-light", "orange-dark", "system"].includes(themeName)) {
        setTheme(themeName as ThemeMode);
      }
      if (newFont) {
        setFontSize(newFont);
      }
    };

    window.addEventListener("preferencesUpdated" as any, handlePreferencesUpdate);
    return () => window.removeEventListener("preferencesUpdated" as any, handlePreferencesUpdate);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, fontSize, setTheme, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}
