"use client";

interface Theme {
  id: string;
  name: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
  };
  isGradient?: boolean;
}

interface ThemePaletteProps {
  selectedTheme: string;
  onThemeChange: (theme: string) => void;
}

const themes: Theme[] = [
  // Light themes
  {
    id: "light",
    name: "Light",
    colors: { background: "#ffffff", foreground: "#171717", primary: "#2563eb" },
  },
  {
    id: "nord-light",
    name: "Nord",
    colors: { background: "#eceff4", foreground: "#2e3440", primary: "#5e81ac" },
  },
  {
    id: "solarized-light",
    name: "Solarized",
    colors: { background: "#fdf6e3", foreground: "#657b83", primary: "#268bd2" },
  },
  {
    id: "barbie-light",
    name: "Barbie",
    colors: { background: "#fce7f3", foreground: "#831843", primary: "#ec4899" },
  },
  {
    id: "purple-light",
    name: "Purple",
    colors: { background: "#faf5ff", foreground: "#581c87", primary: "#9333ea" },
  },
  {
    id: "orange-light",
    name: "Orange",
    colors: { background: "#fff7ed", foreground: "#7c2d12", primary: "#ea580c" },
  },
  {
    id: "rainbow-light",
    name: "Rainbow",
    colors: { background: "#faf5ff", foreground: "#1a1a1a", primary: "#a855f7" },
    isGradient: true,
  },
  // Dark themes
  {
    id: "dark",
    name: "Dark",
    colors: { background: "#0a0a0a", foreground: "#ededed", primary: "#3b82f6" },
  },
  {
    id: "nord-dark",
    name: "Nord",
    colors: { background: "#2e3440", foreground: "#eceff4", primary: "#88c0d0" },
  },
  {
    id: "solarized-dark",
    name: "Solarized",
    colors: { background: "#002b36", foreground: "#839496", primary: "#268bd2" },
  },
  {
    id: "barbie-dark",
    name: "Barbie",
    colors: { background: "#500724", foreground: "#fce7f3", primary: "#ec4899" },
  },
  {
    id: "purple-dark",
    name: "Purple",
    colors: { background: "#3b0764", foreground: "#f3e8ff", primary: "#a855f7" },
  },
  {
    id: "orange-dark",
    name: "Orange",
    colors: { background: "#431407", foreground: "#ffedd5", primary: "#f97316" },
  },
  {
    id: "rainbow-dark",
    name: "Rainbow",
    colors: { background: "#1a0a2e", foreground: "#ffffff", primary: "#c084fc" },
    isGradient: true,
  },
];

const lightThemes = themes.filter((t) => t.id.includes("light") || t.id === "light");
const darkThemes = themes.filter((t) => t.id.includes("dark") || t.id === "dark");

export function ThemePalette({ selectedTheme, onThemeChange }: ThemePaletteProps) {
  return (
    <div className="space-y-6">
      {/* System Option */}
      <div>
        <button
          onClick={() => onThemeChange("system")}
          className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
            selectedTheme === "system"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-foreground/10 to-foreground/5">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <div className="font-medium">System</div>
              <div className="text-xs text-foreground/60">
                Automatically match your device settings
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Light Themes */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-foreground/70">Light Themes</h4>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-7">
          {lightThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                selectedTheme === theme.id
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="aspect-[2/1] p-1">
                {theme.isGradient ? (
                  <div
                    className="h-full w-full rounded-md"
                    style={{
                      background: "linear-gradient(135deg, #faf5ff 0%, #fce7f3 50%, #ffe4e6 100%)",
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col gap-1 rounded-md overflow-hidden">
                    <div
                      className="h-2/3 w-full"
                      style={{ backgroundColor: theme.colors.background }}
                    />
                    <div className="flex h-1/3 w-full gap-1">
                      <div
                        className="flex-1"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div
                        className="flex-1"
                        style={{ backgroundColor: theme.colors.foreground }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-border bg-muted px-1 py-0.5 text-center">
                <div className="text-[10px] font-medium truncate leading-tight">{theme.name}</div>
              </div>
              {selectedTheme === theme.id && (
                <div className="absolute right-1 top-1 rounded-full bg-primary p-0.5">
                  <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Dark Themes */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-foreground/70">Dark Themes</h4>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-7">
          {darkThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                selectedTheme === theme.id
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="aspect-[2/1] p-1">
                {theme.isGradient ? (
                  <div
                    className="h-full w-full rounded-md"
                    style={{
                      background:
                        "linear-gradient(135deg, #1a0a2e 0%, #2d1440 25%, #3d0a45 50%, #4a0e4e 75%, #500724 100%)",
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col gap-1 rounded-md overflow-hidden">
                    <div
                      className="h-2/3 w-full"
                      style={{ backgroundColor: theme.colors.background }}
                    />
                    <div className="flex h-1/3 w-full gap-1">
                      <div
                        className="flex-1"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div
                        className="flex-1"
                        style={{ backgroundColor: theme.colors.foreground }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-border bg-muted px-1 py-0.5 text-center">
                <div className="text-[10px] font-medium truncate leading-tight">{theme.name}</div>
              </div>
              {selectedTheme === theme.id && (
                <div className="absolute right-1 top-1 rounded-full bg-primary p-0.5">
                  <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

