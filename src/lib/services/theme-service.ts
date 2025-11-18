/**
 * Theme Service
 * Manages user custom themes with validation and sanitization
 */

import { prisma } from "../db";
import { logger } from "../logger";
import type { UserTheme } from "@prisma/client";

/**
 * CSS validation result
 */
interface CSSValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Theme creation input
 */
export interface CreateThemeInput {
  userId: string;
  name: string;
  description?: string;
  css: string;
  isPublic?: boolean;
}

/**
 * Theme update input
 */
export interface UpdateThemeInput {
  name?: string;
  description?: string;
  css?: string;
  isActive?: boolean;
  isPublic?: boolean;
}

/**
 * Validate CSS content for security and syntax
 */
export function validateCSS(css: string): CSSValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /javascript:/gi,
    /expression\(/gi,
    /behavior:/gi,
    /@import\s+url\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(css)) {
      errors.push(`Potentially dangerous pattern detected: ${pattern.source}`);
    }
  }

  // Check for external resource loading (warn but don't block)
  if (/@import/.test(css)) {
    warnings.push("@import rules detected - may affect performance");
  }

  if (/url\(/.test(css)) {
    warnings.push("External URLs detected - ensure they are from trusted sources");
  }

  // Basic syntax validation
  const openBraces = (css.match(/\{/g) || []).length;
  const closeBraces = (css.match(/\}/g) || []).length;

  if (openBraces !== closeBraces) {
    errors.push("Mismatched braces in CSS");
  }

  // Check for reasonable size (max 500KB)
  if (css.length > 500000) {
    errors.push("CSS is too large (max 500KB)");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize CSS content
 */
export function sanitizeCSS(css: string): string {
  // Remove potentially dangerous patterns
  let sanitized = css;

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, "");

  // Remove expression() calls (IE specific)
  sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, "");

  // Remove behavior properties (IE specific)
  sanitized = sanitized.replace(/behavior\s*:[^;]+;/gi, "");

  // Remove vbscript: URLs
  sanitized = sanitized.replace(/vbscript:/gi, "");

  return sanitized.trim();
}

/**
 * Create a new theme
 */
export async function createTheme(
  input: CreateThemeInput
): Promise<UserTheme> {
  const { userId, name, description, css, isPublic = false } = input;

  // Validate CSS
  const validation = validateCSS(css);
  if (!validation.isValid) {
    throw new Error(`Invalid CSS: ${validation.errors.join(", ")}`);
  }

  // Sanitize CSS
  const sanitizedCSS = sanitizeCSS(css);

  // Check if theme name already exists for this user
  const existing = await prisma.userTheme.findUnique({
    where: {
      userId_name: {
        userId,
        name,
      },
    },
  });

  if (existing) {
    throw new Error(`Theme with name "${name}" already exists`);
  }

  // Create theme
  const theme = await prisma.userTheme.create({
    data: {
      userId,
      name,
      description,
      css: sanitizedCSS,
      isPublic,
      isActive: false,
      isPreset: false,
    },
  });

  logger.info("Theme created", { themeId: theme.id, userId, name });

  return theme;
}

/**
 * Get user themes
 */
export async function getUserThemes(userId: string): Promise<UserTheme[]> {
  return prisma.userTheme.findMany({
    where: { userId },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
  });
}

/**
 * Get theme by ID
 */
export async function getTheme(
  themeId: string,
  userId: string
): Promise<UserTheme | null> {
  return prisma.userTheme.findFirst({
    where: {
      id: themeId,
      userId,
    },
  });
}

/**
 * Get active theme for user
 */
export async function getActiveTheme(
  userId: string
): Promise<UserTheme | null> {
  return prisma.userTheme.findFirst({
    where: {
      userId,
      isActive: true,
    },
  });
}

/**
 * Update theme
 */
export async function updateTheme(
  themeId: string,
  userId: string,
  updates: UpdateThemeInput
): Promise<UserTheme> {
  // Verify ownership
  const theme = await getTheme(themeId, userId);
  if (!theme) {
    throw new Error("Theme not found");
  }

  // Don't allow updating preset themes
  if (theme.isPreset) {
    throw new Error("Cannot modify preset themes");
  }

  // Validate CSS if provided
  if (updates.css) {
    const validation = validateCSS(updates.css);
    if (!validation.isValid) {
      throw new Error(`Invalid CSS: ${validation.errors.join(", ")}`);
    }
    updates.css = sanitizeCSS(updates.css);
  }

  // If activating this theme, deactivate others
  if (updates.isActive === true) {
    await prisma.userTheme.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
  }

  // Update theme
  const updated = await prisma.userTheme.update({
    where: { id: themeId },
    data: updates,
  });

  logger.info("Theme updated", { themeId, userId });

  return updated;
}

/**
 * Delete theme
 */
export async function deleteTheme(
  themeId: string,
  userId: string
): Promise<void> {
  // Verify ownership
  const theme = await getTheme(themeId, userId);
  if (!theme) {
    throw new Error("Theme not found");
  }

  // Don't allow deleting preset themes
  if (theme.isPreset) {
    throw new Error("Cannot delete preset themes");
  }

  await prisma.userTheme.delete({
    where: { id: themeId },
  });

  logger.info("Theme deleted", { themeId, userId });
}

/**
 * Activate theme
 */
export async function activateTheme(
  themeId: string,
  userId: string
): Promise<UserTheme> {
  // Verify ownership
  const theme = await getTheme(themeId, userId);
  if (!theme) {
    throw new Error("Theme not found");
  }

  // Deactivate all other themes
  await prisma.userTheme.updateMany({
    where: {
      userId,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  // Activate this theme
  const activated = await prisma.userTheme.update({
    where: { id: themeId },
    data: { isActive: true },
  });

  logger.info("Theme activated", { themeId, userId });

  return activated;
}

/**
 * Deactivate all themes (revert to default)
 */
export async function deactivateAllThemes(userId: string): Promise<void> {
  await prisma.userTheme.updateMany({
    where: {
      userId,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  logger.info("All themes deactivated", { userId });
}

/**
 * Get public themes for gallery
 */
export async function getPublicThemes(limit = 50): Promise<UserTheme[]> {
  return prisma.userTheme.findMany({
    where: {
      isPublic: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: limit,
  });
}

/**
 * Clone a public theme to user's collection
 */
export async function cloneTheme(
  sourceThemeId: string,
  userId: string,
  newName?: string
): Promise<UserTheme> {
  // Get source theme
  const sourceTheme = await prisma.userTheme.findFirst({
    where: {
      id: sourceThemeId,
      OR: [{ isPublic: true }, { userId }],
    },
  });

  if (!sourceTheme) {
    throw new Error("Theme not found or not accessible");
  }

  // Create clone
  const themeName = newName || `${sourceTheme.name} (Copy)`;

  return createTheme({
    userId,
    name: themeName,
    description: sourceTheme.description || undefined,
    css: sourceTheme.css,
    isPublic: false,
  });
}

/**
 * Preset themes
 */
export const PRESET_THEMES = {
  light: {
    name: "Light",
    description: "Clean light theme with high contrast",
    css: `
:root {
  --background: #ffffff;
  --foreground: #171717;
  --primary: #2563eb;
  --secondary: #64748b;
  --accent: #3b82f6;
  --muted: #f1f5f9;
  --border: #e2e8f0;
}
    `.trim(),
  },
  dark: {
    name: "Dark",
    description: "Modern dark theme easy on the eyes",
    css: `
:root {
  --background: #0a0a0a;
  --foreground: #ededed;
  --primary: #3b82f6;
  --secondary: #94a3b8;
  --accent: #60a5fa;
  --muted: #1e293b;
  --border: #334155;
}
    `.trim(),
  },
  solarized: {
    name: "Solarized Dark",
    description: "Popular Solarized color scheme",
    css: `
:root {
  --background: #002b36;
  --foreground: #839496;
  --primary: #268bd2;
  --secondary: #586e75;
  --accent: #2aa198;
  --muted: #073642;
  --border: #073642;
}
    `.trim(),
  },
  nord: {
    name: "Nord",
    description: "Arctic, north-bluish color palette",
    css: `
:root {
  --background: #2e3440;
  --foreground: #eceff4;
  --primary: #88c0d0;
  --secondary: #81a1c1;
  --accent: #5e81ac;
  --muted: #3b4252;
  --border: #4c566a;
}
    `.trim(),
  },
  dracula: {
    name: "Dracula",
    description: "Dark theme with vibrant colors",
    css: `
:root {
  --background: #282a36;
  --foreground: #f8f8f2;
  --primary: #bd93f9;
  --secondary: #6272a4;
  --accent: #ff79c6;
  --muted: #44475a;
  --border: #6272a4;
}
    `.trim(),
  },
};

/**
 * Initialize preset themes for a user
 */
export async function initializePresetThemes(userId: string): Promise<void> {
  for (const [key, preset] of Object.entries(PRESET_THEMES)) {
    // Skip light and dark - they're built-in preference themes, not DB themes
    if (key === "light" || key === "dark") continue;
    
    const existing = await prisma.userTheme.findUnique({
      where: {
        userId_name: {
          userId,
          name: preset.name,
        },
      },
    });

    if (!existing) {
      await prisma.userTheme.create({
        data: {
          userId,
          name: preset.name,
          description: preset.description,
          css: preset.css,
          isPreset: true,
          isPublic: false,
          isActive: false,
        },
      });
    }
  }

  logger.info("Preset themes initialized", { userId });
}

