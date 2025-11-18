"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { useSession } from "next-auth/react";

interface Theme {
  id: string;
  name: string;
  css?: string;
  isCustom: boolean;
}

interface ThemeContextType {
  theme: Theme;
  fontSize: string;
  setTheme: (theme: Theme) => void;
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
  const [theme, setThemeState] = useState<Theme>({ id: "system", name: "system", isCustom: false });
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

  // Apply theme logic (Classes + CSS Injection)
  const applyTheme = useCallback((themeToApply: Theme) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    // Remove existing custom style
    const existingStyle = document.getElementById("custom-theme-css");
    if (existingStyle) {
      existingStyle.remove();
    }

    if (themeToApply.isCustom && themeToApply.css) {
      // Custom Theme Logic
      root.setAttribute("data-theme", themeToApply.id);
      
      const styleTag = document.createElement("style");
      styleTag.id = "custom-theme-css";
      styleTag.textContent = themeToApply.css;
      document.head.appendChild(styleTag);
      
      // Most custom themes are dark-based, but we could parse this from CSS in the future
      // For now, assume custom = dark base to ensure white text defaults if not specified
      root.classList.add("dark"); 
    } else {
      // Built-in Theme Logic
      root.removeAttribute("data-theme");
      
      if (themeToApply.name === "system") {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        root.classList.toggle("dark", mediaQuery.matches);
      } else {
        root.classList.add(themeToApply.name.toLowerCase());
      }
    }
  }, []);

  // Public setters that update state and apply immediately
  const setTheme = (newTheme: Theme) => {
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
        const [prefsRes, themesRes] = await Promise.all([
          fetch("/api/user/preferences"),
          fetch("/api/user/themes"),
        ]);

        const prefsData = await prefsRes.json();
        const themesData = await themesRes.json();

        const prefs = prefsData.data?.preferences;
        const activeCustomTheme = themesData.data?.activeTheme;

        let newTheme: Theme = { id: "system", name: "system", isCustom: false };

        if (activeCustomTheme) {
          newTheme = {
            id: activeCustomTheme.id,
            name: activeCustomTheme.name,
            css: activeCustomTheme.css,
            isCustom: true,
          };
        } else if (prefs?.theme) {
          newTheme = { id: prefs.theme, name: prefs.theme, isCustom: false };
        }

        setTheme(newTheme);
        
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
  }, [session, applyTheme, applyFontSize]);

  // System theme listener
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme.name === "system") {
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme.name]);

  // Listen for legacy event (for backward compatibility during refactor)
  useEffect(() => {
    const handleLegacyEvent = (event: CustomEvent) => {
       const { theme: themeName, fontSize: newFont, activeTheme } = event.detail;
       if (activeTheme?.css) {
         setTheme({ id: activeTheme.id, name: activeTheme.id, css: activeTheme.css, isCustom: true });
       } else if (themeName) {
         setTheme({ id: themeName, name: themeName, isCustom: false });
       }
       if (newFont) setFontSize(newFont);
    };

    window.addEventListener("preferencesUpdated" as any, handleLegacyEvent);
    return () => window.removeEventListener("preferencesUpdated" as any, handleLegacyEvent);
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

