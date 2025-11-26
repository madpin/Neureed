# React Hook Form Integration Plan

## Executive Summary

This document outlines a comprehensive plan to integrate React Hook Form into the NeuReed application to improve form handling, validation, and user experience. The integration will modernize form state management, reduce boilerplate code, and provide better performance through reduced re-renders.

**Target Forms**: FeedManagementModal and PreferencesModal
**Timeline**: Estimated 8-12 hours of development + 4-6 hours of testing
**Risk Level**: Low (incremental adoption, full backward compatibility)

---

## Current State Analysis

### Existing Form Infrastructure

The application currently uses:
- **State Management**: Local React state (`useState`) for form values
- **Validation**: Mix of client-side checks and Zod schemas in API routes
- **Dependencies**: Zod (`^3.23.8`) already installed and actively used
- **Pattern**: Manual form handling with controlled components

### Pain Points Identified

1. **Manual State Management**: Each form field requires individual state declaration
2. **Scattered Validation**: Validation logic split between client and server
3. **Re-render Performance**: Full component re-renders on every input change
4. **Boilerplate Code**: Repetitive onChange handlers and value binding
5. **Error Handling**: Manual error state management per field
6. **Form Reset Logic**: Complex reset and revert logic in PreferencesModal
7. **Unsaved Changes Detection**: Custom dirty state tracking

---

## Selected Forms for Migration

### Priority 1: FeedManagementModal - Feed Settings View

**File**: `/Users/tpinto/madpin/neureed/app/components/feeds/FeedManagementModal.tsx` (Lines 1191-1918)

**Why This Form First**:
- ✅ Medium complexity (8 fields) - ideal learning curve
- ✅ Clear validation rules already defined
- ✅ Nested state with multiple sections
- ✅ Mix of text inputs, numbers, selects, and checkboxes
- ✅ Benefits most from validation improvements

**Current Implementation Analysis**:
```typescript
// Current state management (Lines 1221-1247)
const [customName, setCustomName] = useState("");
const [selectedCategory, setSelectedCategory] = useState("");
const [fetchInterval, setFetchInterval] = useState(60);
const [summarizationEnabled, setSummarizationEnabled] = useState(false);
const [minContentLength, setMinContentLength] = useState(5000);
const [includeKeyPoints, setIncludeKeyPoints] = useState(true);
const [includeTopics, setIncludeTopics] = useState(true);
const [extractionMethod, setExtractionMethod] = useState<...>("readability");
// ... more state declarations
```

**Form Fields**:
1. `customName` - Text input (optional)
2. `selectedCategory` - Select dropdown
3. `fetchInterval` - Number input (5-1440 range)
4. `extractionMethod` - Select dropdown
5. `requiresAuth` - Checkbox
6. `contentMergeStrategy` - Select dropdown
7. `summarizationEnabled` - Checkbox
8. `minContentLength` - Number input (100-100,000 range)

**Validation Requirements**:
- Fetch interval: 5-1440 minutes
- Min content length: 100-100,000 characters
- Category: Must be valid or empty
- All changes tracked for dirty state

**Benefits of Migration**:
- Eliminate 15+ useState declarations
- Automatic validation on blur/submit
- Built-in dirty state tracking
- Simplified save/reset logic
- Performance: Only relevant fields re-render

---

### Priority 2: PreferencesModal - Multiple Views

**File**: `/Users/tpinto/madpin/neureed/app/components/preferences/PreferencesModal.tsx` (Lines 1-1652)

**Why Second**:
- ✅ High complexity (40+ fields across 7 views)
- ✅ Complex validation rules per section
- ✅ Most impactful for user experience
- ✅ Demonstrates scalability of solution

**Current Implementation Analysis**:
```typescript
// Single state object for all preferences (Lines 32-33)
const [localPreferences, setLocalPreferences] = useState<UserPreferences | null>(null);
const [originalPreferences, setOriginalPreferences] = useState<UserPreferences | null>(null);

// Manual change tracking (Lines 106-109)
const hasUnsavedChanges = () => {
  if (!localPreferences || !originalPreferences) return false;
  return JSON.stringify(localPreferences) !== JSON.stringify(originalPreferences);
};

// Manual validation (Lines 217-241)
const validationIssues = [];
if (localPreferences.articleCardBorderWidth && !["none", "thin", "normal", "thick"].includes(...)) {
  validationIssues.push(`Invalid borderWidth: ${localPreferences.articleCardBorderWidth}`);
}
// ... more validation
```

**Form Views**:
1. **Profile** - Display only (no form)
2. **Appearance** - 5 fields (theme, fontSize, defaultView, section-specific sizes)
3. **Article Display** - 12 fields (density, visibility toggles, borders, spacing, order)
4. **Reading** - 10 fields (reading mode, panel settings, pagination, toggles)
5. **Learning** - 4 fields (thresholds, weights, decay periods)
6. **LLM Settings** - 6 fields (provider, models, API keys, base URL)

**Total Fields**: 37 interactive fields

**Validation Requirements**:
- Enums: Multiple fields with specific allowed values
- Ranges: fontSize, thresholds, intervals, panel sizes
- Conditional validation: LLM fields dependent on provider
- Cross-field validation: Some settings affect others
- Custom validation: ArticleCardSectionOrder array

**Complex Features**:
- Unsaved changes warning with browser back/forward
- Live preview updates during editing
- Section-specific validation
- Reset to defaults functionality
- Cascade priority (user → category → system defaults)

**Benefits of Migration**:
- Eliminate ~40 field update handlers
- Automatic dirty state tracking replaces manual JSON comparison
- Schema-based validation replaces 100+ lines of manual checks
- Better TypeScript inference for field types
- Simplified nested form handling

---

## Technical Approach

### Installation

```bash
npm install react-hook-form @hookform/resolvers
```

**Package Versions**:
- `react-hook-form`: Latest stable (^7.x)
- `@hookform/resolvers`: Latest stable (^3.x) - for Zod integration

**No Breaking Changes**: Both packages are mature and stable.

---

## Migration Strategy

### Phase 1: Foundation Setup (2-3 hours)

#### 1.1 Create Shared Validation Schemas

**File**: `/Users/tpinto/madpin/neureed/src/lib/validation/feed-schemas.ts` (new)

```typescript
import { z } from "zod";

/**
 * Validation schema for feed settings form
 * Used by both client (React Hook Form) and server (API routes)
 */
export const feedSettingsSchema = z.object({
  customName: z.string().max(200).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  fetchInterval: z.number().int().min(5).max(1440),
  extractionMethod: z.enum(["rss", "readability", "playwright", "custom"]),
  requiresAuth: z.boolean(),
  contentMergeStrategy: z.enum(["replace", "prepend", "append"]),
});

/**
 * Validation schema for summarization settings
 */
export const summarizationSettingsSchema = z.object({
  enabled: z.boolean(),
  minContentLength: z.number().int().min(100).max(100000),
  includeKeyPoints: z.boolean(),
  includeTopics: z.boolean(),
});

/**
 * Combined schema for the entire feed settings form
 */
export const combinedFeedSettingsSchema = z.object({
  feedSettings: feedSettingsSchema,
  summarization: summarizationSettingsSchema,
});

// Export types for TypeScript
export type FeedSettingsFormData = z.infer<typeof feedSettingsSchema>;
export type SummarizationSettingsFormData = z.infer<typeof summarizationSettingsSchema>;
export type CombinedFeedSettingsFormData = z.infer<typeof combinedFeedSettingsSchema>;
```

**File**: `/Users/tpinto/madpin/neureed/src/lib/validation/preferences-schemas.ts` (new)

```typescript
import { z } from "zod";

/**
 * Appearance preferences schema
 */
export const appearanceSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  fontSize: z.union([
    z.enum(["small", "medium", "large"]),
    z.string().regex(/^\d+px$/)
  ]),
  sidebarFontSize: z.enum(["smaller", "same", "larger"]).optional(),
  cardFontSize: z.enum(["smaller", "same", "larger"]).optional(),
  modalFontSize: z.enum(["smaller", "same", "larger"]).optional(),
  uiFontSize: z.enum(["smaller", "same", "larger"]).optional(),
  defaultView: z.enum(["compact", "expanded"]),
});

/**
 * Article display preferences schema
 */
export const articleDisplaySchema = z.object({
  articleCardDensity: z.enum(["compact", "normal", "comfortable"]),
  showArticleImage: z.boolean(),
  showArticleExcerpt: z.boolean(),
  showArticleAuthor: z.boolean(),
  showArticleFeedInfo: z.boolean(),
  showArticleDate: z.boolean(),
  articleCardSectionOrder: z.array(z.string()).min(1),
  articleCardBorderWidth: z.enum(["none", "thin", "normal", "thick"]),
  articleCardBorderRadius: z.enum(["sharp", "slight", "normal", "rounded"]),
  articleCardBorderContrast: z.enum(["subtle", "medium", "strong"]),
  articleCardSpacing: z.enum(["none", "compact", "normal", "comfortable", "spacious"]),
});

/**
 * Reading preferences schema
 */
export const readingSchema = z.object({
  readingMode: z.enum(["side_panel", "inline", "standalone"]),
  inlineAutoScroll: z.boolean(),
  readingPanelEnabled: z.boolean(),
  readingPanelPosition: z.enum(["right", "left", "top", "bottom"]),
  readingPanelSize: z.number().int().min(30).max(70),
  articlesPerPage: z.number().int().min(5).max(100),
  infiniteScrollMode: z.enum(["auto", "button", "both"]),
  showReadArticles: z.boolean(),
  autoMarkAsRead: z.boolean(),
  showRelatedExcerpts: z.boolean(),
  showReadingTime: z.boolean(),
  readingFontFamily: z.string(),
  readingFontSize: z.number().int().min(12).max(32),
  readingLineHeight: z.number().min(1.0).max(3.0),
  readingParagraphSpacing: z.number().min(0.5).max(3.0),
  breakLineSpacing: z.number().min(0).max(2.0),
});

/**
 * Learning preferences schema
 */
export const learningSchema = z.object({
  bounceThreshold: z.number().min(0.1).max(0.5),
  showLowRelevanceArticles: z.boolean(),
  searchRecencyWeight: z.number().min(0).max(1),
  searchRecencyDecayDays: z.number().int().min(7).max(180),
});

/**
 * LLM settings schema with conditional validation
 */
export const llmSettingsSchema = z.object({
  llmProvider: z.enum(["openai", "ollama"]).nullable(),
  llmSummaryModel: z.string().nullable(),
  llmEmbeddingModel: z.string().nullable(),
  llmDigestModel: z.string().nullable(),
  llmApiKey: z.string().nullable(),
  llmBaseUrl: z.string().url().nullable().or(z.literal("")),
}).refine(
  (data) => {
    // If OpenAI is selected, API key is required
    if (data.llmProvider === "openai" && !data.llmApiKey) {
      return false;
    }
    return true;
  },
  {
    message: "API key is required for OpenAI provider",
    path: ["llmApiKey"],
  }
);

/**
 * Combined preferences schema
 */
export const userPreferencesSchema = z.object({
  appearance: appearanceSchema,
  articleDisplay: articleDisplaySchema,
  reading: readingSchema,
  learning: learningSchema,
  llm: llmSettingsSchema,
  embeddingsEnabled: z.boolean(),
});

// Export types
export type UserPreferencesFormData = z.infer<typeof userPreferencesSchema>;
export type AppearanceFormData = z.infer<typeof appearanceSchema>;
export type ArticleDisplayFormData = z.infer<typeof articleDisplaySchema>;
export type ReadingFormData = z.infer<typeof readingSchema>;
export type LearningFormData = z.infer<typeof learningSchema>;
export type LLMSettingsFormData = z.infer<typeof llmSettingsSchema>;
```

#### 1.2 Create Form Component Wrappers

**File**: `/Users/tpinto/madpin/neureed/app/components/forms/FormField.tsx` (new)

```typescript
import { useFormContext } from "react-hook-form";

interface FormFieldProps {
  name: string;
  label: string;
  type?: "text" | "number" | "select" | "checkbox" | "textarea";
  placeholder?: string;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
  className?: string;
}

/**
 * Reusable form field component integrated with React Hook Form
 */
export function FormField({
  name,
  label,
  type = "text",
  placeholder,
  description,
  required,
  min,
  max,
  options,
  className,
}: FormFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];
  const errorMessage = error?.message as string | undefined;

  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === "select" && options ? (
        <select
          id={name}
          {...register(name, { valueAsNumber: type === "number" })}
          className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-muted"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === "checkbox" ? (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={name}
            {...register(name)}
            className="h-4 w-4 rounded border-border cursor-pointer"
          />
          {description && (
            <span className="text-sm text-foreground/60">{description}</span>
          )}
        </div>
      ) : type === "textarea" ? (
        <textarea
          id={name}
          {...register(name)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-muted"
          rows={4}
        />
      ) : (
        <input
          type={type}
          id={name}
          {...register(name, { valueAsNumber: type === "number" })}
          placeholder={placeholder}
          min={min}
          max={max}
          className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-muted"
        />
      )}

      {description && type !== "checkbox" && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}

      {errorMessage && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
```

---

### Phase 2: FeedManagementModal Migration (3-4 hours)

#### 2.1 Refactor FeedSettingsView Component

**Changes to**: `/Users/tpinto/madpin/neureed/app/components/feeds/FeedManagementModal.tsx`

**Before** (Lines 1191-1918):
```typescript
function FeedSettingsView({ feedId, onRefreshData, onClose }: {...}) {
  // 15+ useState declarations
  const [customName, setCustomName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  // ... more state

  // Manual initialization
  useEffect(() => {
    if (feed) {
      setCustomName(feed.name || "");
      setSelectedCategory(feed.category?.id || "");
      // ... more setters
    }
  }, [feed]);

  // Manual save handler
  const handleSave = async () => {
    const settings = {
      customName: customName.trim() || null,
      refreshInterval: fetchInterval,
      // ... more fields
    };
    await updateFeedSettingsMutation.mutateAsync({ feedId, settings });
  };
}
```

**After**:
```typescript
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { combinedFeedSettingsSchema, type CombinedFeedSettingsFormData } from "@/lib/validation/feed-schemas";

function FeedSettingsView({ feedId, onRefreshData, onClose }: {...}) {
  // Single form instance
  const methods = useForm<CombinedFeedSettingsFormData>({
    resolver: zodResolver(combinedFeedSettingsSchema),
    defaultValues: {
      feedSettings: {
        customName: "",
        categoryId: "",
        fetchInterval: 60,
        extractionMethod: "readability",
        requiresAuth: false,
        contentMergeStrategy: "replace",
      },
      summarization: {
        enabled: false,
        minContentLength: 5000,
        includeKeyPoints: true,
        includeTopics: true,
      },
    },
  });

  const { reset, handleSubmit, formState: { isDirty, isSubmitting } } = methods;

  // Auto-populate when feed loads
  useEffect(() => {
    if (feed) {
      reset({
        feedSettings: {
          customName: feed.name || "",
          categoryId: feed.category?.id || "",
          fetchInterval: feed.settings?.refreshInterval || 60,
          extractionMethod: feed.settings?.extraction?.method || "readability",
          requiresAuth: feed.settings?.extraction?.requiresAuth || false,
          contentMergeStrategy: feed.settings?.extraction?.contentMergeStrategy || "replace",
        },
        summarization: {
          enabled: summarizationConfig?.effectiveSettings?.enabled || false,
          minContentLength: summarizationConfig?.effectiveSettings?.minContentLength || 5000,
          includeKeyPoints: summarizationConfig?.effectiveSettings?.includeKeyPoints || true,
          includeTopics: summarizationConfig?.effectiveSettings?.includeTopics || true,
        },
      });
    }
  }, [feed, summarizationConfig, reset]);

  // Submit handler - automatic validation
  const onSubmit = async (data: CombinedFeedSettingsFormData) => {
    try {
      await updateFeedSettingsMutation.mutateAsync({
        feedId,
        settings: data.feedSettings,
      });

      if (summarizationConfig?.systemEnabled) {
        await updateSummarizationMutation.mutateAsync({
          feedId,
          settings: data.summarization,
        });
      }

      toast.success("Settings saved successfully");
      onRefreshData?.();
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-6">
        {/* Form fields using FormField component */}
        <div className="mb-6 space-y-4">
          <h2 className="text-lg font-semibold">Basic Settings</h2>

          <FormField
            name="feedSettings.categoryId"
            label="Category"
            type="select"
            options={[
              { value: "", label: "Uncategorized" },
              ...categories.map(cat => ({ value: cat.id, label: cat.name }))
            ]}
          />

          <FormField
            name="feedSettings.customName"
            label="Custom Feed Name"
            placeholder={feed?.name}
          />

          <FormField
            name="feedSettings.fetchInterval"
            label="Fetch Interval (minutes)"
            type="number"
            min={5}
            max={1440}
            description="How often to check for new articles (5-1440 minutes)"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            loading={isSubmitting}
            variant="primary"
          >
            Save Settings
          </Button>
          <Button
            type="button"
            onClick={() => reset()}
            disabled={!isDirty}
            variant="outline"
          >
            Reset
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
```

**Key Improvements**:
- ✅ Eliminated 15 useState declarations → 1 useForm hook
- ✅ Automatic validation on submit
- ✅ Built-in dirty state tracking (`isDirty`)
- ✅ Built-in submitting state (`isSubmitting`)
- ✅ Type-safe form data
- ✅ Easy reset functionality
- ✅ Validation errors automatically displayed

#### 2.2 Update API Route (Optional Enhancement)

**File**: `/Users/tpinto/madpin/neureed/app/api/feeds/[id]/route.ts`

```typescript
import { feedSettingsSchema } from "@/lib/validation/feed-schemas";

// Use the same schema for API validation
export const PATCH = createHandler(
  async ({ params, body, session }) => {
    // Validation already handled by createHandler with bodySchema
    const feedId = params.id;
    const userId = session!.user.id;

    await updateFeedSettings(feedId, userId, body);

    return { data: { success: true } };
  },
  {
    bodySchema: feedSettingsSchema, // Same schema as client
    requireAuth: true,
  }
);
```

---

### Phase 3: PreferencesModal Migration (4-5 hours)

#### 3.1 Refactor with Multi-Section Form

**Strategy**: Use form context with nested schemas per view

**Changes to**: `/Users/tpinto/madpin/neureed/app/components/preferences/PreferencesModal.tsx`

```typescript
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userPreferencesSchema, type UserPreferencesFormData } from "@/lib/validation/preferences-schemas";

export function PreferencesModal({ isOpen, onClose, initialView = 'profile' }: PreferencesModalProps) {
  const { data: cachedPreferences } = useUserPreferences();
  const updatePreferencesMutation = useUpdateUserPreferences();

  const [currentView, setCurrentView] = useState<ViewType>(initialView);

  // Single form instance for entire preferences
  const methods = useForm<UserPreferencesFormData>({
    resolver: zodResolver(userPreferencesSchema),
    mode: "onBlur", // Validate on blur for better UX
    defaultValues: {
      appearance: {
        theme: "system",
        fontSize: "medium",
        defaultView: "expanded",
        // ... more defaults
      },
      articleDisplay: {
        articleCardDensity: "normal",
        showArticleImage: true,
        // ... more defaults
      },
      // ... other sections
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isDirty, isSubmitting, dirtyFields },
  } = methods;

  // Initialize from cached data
  useEffect(() => {
    if (cachedPreferences) {
      reset({
        appearance: {
          theme: cachedPreferences.theme || "system",
          fontSize: cachedPreferences.fontSize || "medium",
          defaultView: cachedPreferences.defaultView || "expanded",
          // ... map all fields
        },
        // ... other sections
      });
    }
  }, [cachedPreferences, reset]);

  // Handle browser navigation with dirty state check
  const handleClose = () => {
    if (isDirty) {
      toast.warning("You have unsaved changes", {
        description: "Are you sure you want to close without saving?",
        action: {
          label: "Close anyway",
          onClick: () => {
            reset(); // Reset to original values
            onClose();
          },
        },
        cancel: { label: "Keep editing" },
      });
      return;
    }
    onClose();
  };

  // Submit handler
  const onSubmit = async (data: UserPreferencesFormData) => {
    try {
      // Flatten the nested structure back to UserPreferences format
      const flattened = {
        ...data.appearance,
        ...data.articleDisplay,
        ...data.reading,
        ...data.learning,
        ...data.llm,
        embeddingsEnabled: data.embeddingsEnabled,
      };

      await updatePreferencesMutation.mutateAsync(flattened);

      toast.success("Preferences saved successfully!");

      // Dispatch event for immediate UI update
      window.dispatchEvent(new CustomEvent("preferencesUpdated", { detail: flattened }));
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast.error("Failed to save preferences. Please try again.");
    }
  };

  return (
    <FormProvider {...methods}>
      <Modal isOpen={isOpen} onClose={handleClose} size="xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody padding={false} className="flex h-[70vh] overflow-hidden">
            {/* Navigation sidebar (unchanged) */}
            <aside className="hidden md:flex w-52 flex-shrink-0 border-r border-border bg-muted">
              {/* ... navigation items ... */}
            </aside>

            {/* Content area with form sections */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {currentView === 'appearance' && <AppearanceView />}
              {currentView === 'articleDisplay' && <ArticleDisplayView />}
              {currentView === 'reading' && <ReadingView />}
              {currentView === 'learning' && <LearningView />}
              {currentView === 'llm' && <LLMView />}
            </main>
          </ModalBody>

          <ModalFooter>
            {/* Show dirty indicator */}
            {isDirty && (
              <span className="text-xs text-foreground/60 mr-auto">
                {Object.keys(dirtyFields).length} unsaved change(s)
              </span>
            )}

            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !isDirty}
              loading={isSubmitting}
            >
              Save Preferences
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </FormProvider>
  );
}
```

#### 3.2 Refactor Sub-Views

**Example: AppearanceView**

```typescript
function AppearanceView() {
  const { register, watch, formState: { errors } } = useFormContext<UserPreferencesFormData>();

  // Watch values for live preview
  const theme = watch("appearance.theme");
  const fontSize = watch("appearance.fontSize");

  // Live preview updates (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("preferencesUpdated", {
        detail: { theme, fontSize }
      }));
    }, 100);
    return () => clearTimeout(timer);
  }, [theme, fontSize]);

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Appearance</h2>
      <div className="space-y-6">
        <FormField
          name="appearance.theme"
          label="Theme"
          type="select"
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "system", label: "System" },
          ]}
        />

        <FormField
          name="appearance.fontSize"
          label="Font Size"
          type="select"
          options={[
            { value: "small", label: "Small (14px)" },
            { value: "medium", label: "Medium (16px)" },
            { value: "large", label: "Large (18px)" },
          ]}
        />

        {/* Custom components can still use register */}
        <div>
          <label className="mb-3 block text-sm font-medium">Theme Palette</label>
          <ThemePalette
            selectedTheme={theme}
            onThemeChange={(newTheme) => {
              // Manually trigger change in form state
              methods.setValue("appearance.theme", newTheme, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
```

**Key Improvements**:
- ✅ Eliminated manual change tracking (JSON stringify comparison)
- ✅ Automatic dirty state with granular field tracking
- ✅ 100+ lines of manual validation replaced with schemas
- ✅ Built-in unsaved changes detection
- ✅ Live preview still works with `watch()`
- ✅ Easy integration with custom components

---

## Performance Considerations

### Optimizations

1. **Reduced Re-renders**:
   - Current: Full component re-renders on every field change
   - With RHF: Only changed fields re-render
   - Improvement: ~70% reduction in re-renders

2. **Validation Performance**:
   - Current: Manual validation on every keystroke
   - With RHF: Validation on blur/submit (configurable)
   - Improvement: Fewer validation cycles

3. **Form State Management**:
   - Current: Multiple state updates → multiple renders
   - With RHF: Uncontrolled inputs → minimal renders
   - Improvement: Up to 80% fewer state updates

### Benchmarks (Expected)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Re-renders per field change | 1 full component | 1 field only | 70-80% |
| Validation cycles | On every keystroke | On blur/submit | 50-70% |
| Bundle size | Current | +15KB gzipped | Acceptable |
| Time to interactive | Current | Same | No impact |

---

## Error Handling Strategy

### Client-Side Validation

```typescript
// Immediate feedback on blur
const methods = useForm({
  mode: "onBlur", // Validate when field loses focus
  reValidateMode: "onChange", // Re-validate on change after first error
});

// Field-level error display
function FormField({ name, ...props }: FormFieldProps) {
  const { formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <div>
      <input {...props} />
      {error && (
        <p className="mt-1 text-xs text-red-600">
          {error.message}
        </p>
      )}
    </div>
  );
}
```

### Server-Side Validation

```typescript
// API route still validates
export const POST = createHandler(
  async ({ body, session }) => {
    // Zod validation happens here automatically
    // If validation fails, proper error response sent
    await updateSettings(body);
    return { data: { success: true } };
  },
  {
    bodySchema: feedSettingsSchema, // Same schema as client
    requireAuth: true,
  }
);

// Client handles server errors
const onSubmit = async (data: FormData) => {
  try {
    await mutation.mutateAsync(data);
  } catch (error) {
    // Server validation errors
    if (error.data && Array.isArray(error.data)) {
      error.data.forEach((err) => {
        methods.setError(err.path.join("."), {
          message: err.message,
        });
      });
    } else {
      toast.error("Failed to save settings");
    }
  }
};
```

---

## Backward Compatibility

### Gradual Migration Approach

1. **Phase 1**: Migrate FeedManagementModal
   - Other forms continue working unchanged
   - No breaking changes to API

2. **Phase 2**: Migrate PreferencesModal
   - Existing saved preferences remain compatible
   - Same data structures

3. **Phase 3** (Future): Migrate remaining forms
   - AddFeedForm
   - SavedSearchModal
   - BulkFeedSettingsModal

### Rollback Plan

If issues arise:

1. **Git Revert**: Each phase is a separate commit
2. **Feature Flag**: Wrap new forms in feature flag

```typescript
const USE_REACT_HOOK_FORM = process.env.NEXT_PUBLIC_USE_RHF === "true";

export function FeedSettingsView(props) {
  if (USE_REACT_HOOK_FORM) {
    return <FeedSettingsViewRHF {...props} />;
  }
  return <FeedSettingsViewLegacy {...props} />;
}
```

3. **Parallel Implementation**: Keep old components for 1-2 releases

---

## Testing Strategy

### Unit Tests

```typescript
// tests/forms/FeedSettingsForm.test.tsx
import { renderHook, act } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { feedSettingsSchema } from "@/lib/validation/feed-schemas";

describe("FeedSettingsForm", () => {
  it("validates fetch interval range", async () => {
    const { result } = renderHook(() =>
      useForm({
        resolver: zodResolver(feedSettingsSchema),
      })
    );

    await act(async () => {
      result.current.setValue("fetchInterval", 5000); // Invalid: too high
      await result.current.trigger("fetchInterval");
    });

    expect(result.current.formState.errors.fetchInterval).toBeDefined();
  });

  it("marks form as dirty when fields change", async () => {
    const { result } = renderHook(() =>
      useForm({
        resolver: zodResolver(feedSettingsSchema),
        defaultValues: { customName: "Test" },
      })
    );

    expect(result.current.formState.isDirty).toBe(false);

    await act(async () => {
      result.current.setValue("customName", "Changed");
    });

    expect(result.current.formState.isDirty).toBe(true);
  });
});
```

### Integration Tests

```typescript
// tests/integration/FeedManagementModal.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeedManagementModal } from "@/app/components/feeds/FeedManagementModal";

describe("FeedManagementModal Integration", () => {
  it("saves feed settings successfully", async () => {
    const user = userEvent.setup();
    const onRefreshData = jest.fn();

    render(
      <FeedManagementModal
        isOpen={true}
        onClose={() => {}}
        feedId="test-feed-id"
        onRefreshData={onRefreshData}
      />
    );

    // Change interval
    const intervalInput = screen.getByLabelText(/Fetch Interval/i);
    await user.clear(intervalInput);
    await user.type(intervalInput, "120");

    // Submit
    const saveButton = screen.getByRole("button", { name: /Save Settings/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onRefreshData).toHaveBeenCalled();
    });
  });

  it("shows validation errors for invalid input", async () => {
    const user = userEvent.setup();

    render(<FeedManagementModal isOpen={true} onClose={() => {}} feedId="test" />);

    const intervalInput = screen.getByLabelText(/Fetch Interval/i);
    await user.clear(intervalInput);
    await user.type(intervalInput, "5000"); // Invalid: too high
    await user.tab(); // Trigger blur validation

    expect(await screen.findByText(/must be less than/i)).toBeInTheDocument();
  });

  it("warns about unsaved changes", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<FeedManagementModal isOpen={true} onClose={onClose} feedId="test" />);

    // Make a change
    const nameInput = screen.getByLabelText(/Custom Feed Name/i);
    await user.type(nameInput, "Modified");

    // Try to close
    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    await user.click(cancelButton);

    // Should not close immediately
    expect(onClose).not.toHaveBeenCalled();
  });
});
```

### Manual Testing Checklist

**FeedManagementModal**:
- [ ] All fields populate correctly from existing feed
- [ ] Validation errors show on invalid input
- [ ] Form dirty state updates correctly
- [ ] Save button disabled when no changes
- [ ] Reset button restores original values
- [ ] Unsaved changes warning works
- [ ] Refresh feed action still works
- [ ] Delete feed action still works

**PreferencesModal**:
- [ ] All 37 fields populate correctly
- [ ] Navigation between views maintains form state
- [ ] Live preview updates work
- [ ] Theme changes apply immediately
- [ ] Validation works per section
- [ ] Browser back/forward maintains state
- [ ] Unsaved changes warning on navigation
- [ ] Save updates all sections
- [ ] Reset works per section

---

## Implementation Timeline

### Week 1: Foundation + FeedManagementModal

**Day 1-2** (4-5 hours):
- Install dependencies
- Create validation schemas
- Create FormField component
- Write unit tests for schemas

**Day 3-4** (4-5 hours):
- Migrate FeedSettingsView
- Update API routes (if needed)
- Manual testing
- Fix bugs

**Day 5** (2 hours):
- Integration tests
- Documentation updates
- Code review

### Week 2: PreferencesModal

**Day 1-2** (5-6 hours):
- Create preferences schemas
- Migrate main PreferencesModal component
- Implement form context

**Day 3-4** (5-6 hours):
- Migrate all sub-views (5 views)
- Test live preview functionality
- Test navigation and state persistence

**Day 5** (2-3 hours):
- Integration tests
- Performance testing
- Final bug fixes

### Week 3: Polish + Documentation

**Day 1** (2-3 hours):
- Performance benchmarking
- Accessibility audit
- Cross-browser testing

**Day 2** (2-3 hours):
- Update CLAUDE.md with new patterns
- Create developer guide for React Hook Form
- Update API documentation

**Day 3** (2 hours):
- Final code review
- Deploy to staging
- Monitor for issues

---

## Success Metrics

### Quantitative Metrics

1. **Code Reduction**:
   - Target: -200 lines of boilerplate code
   - Measurement: Git diff line count

2. **Performance**:
   - Target: 70% reduction in re-renders
   - Measurement: React DevTools Profiler

3. **Bug Reduction**:
   - Target: 50% fewer form-related bugs
   - Measurement: Issue tracker

4. **Developer Experience**:
   - Target: 30% faster form development
   - Measurement: Time to add new form field

### Qualitative Metrics

1. **Code Maintainability**: Easier to understand form logic
2. **Type Safety**: Better TypeScript inference
3. **User Experience**: Smoother validation feedback
4. **Consistency**: Unified form handling approach

---

## Risks and Mitigation

### Risk 1: Learning Curve

**Impact**: Medium
**Probability**: Medium

**Mitigation**:
- Start with simpler form (FeedManagementModal)
- Comprehensive documentation
- Code examples and patterns
- Pair programming sessions

### Risk 2: Breaking Changes

**Impact**: High
**Probability**: Low

**Mitigation**:
- Extensive testing before merge
- Feature flags for easy rollback
- Gradual rollout (one form at a time)
- Keep old implementations for 1 release

### Risk 3: Performance Regression

**Impact**: Medium
**Probability**: Low

**Mitigation**:
- Performance testing before merge
- React DevTools profiling
- Lighthouse CI checks
- Monitor bundle size

### Risk 4: Third-Party Library Issues

**Impact**: Medium
**Probability**: Low

**Mitigation**:
- Use well-maintained libraries (RHF has 1M+ weekly downloads)
- Lock versions in package.json
- Regular dependency updates
- Monitor GitHub issues

---

## Future Enhancements (Post-Migration)

### Phase 4: Additional Forms

1. **AddFeedForm** (1-2 hours)
   - Simpler form, good candidate
   - Async validation for feed URL

2. **SavedSearchModal** (2-3 hours)
   - Medium complexity
   - Conditional fields

3. **BulkFeedSettingsModal** (2-3 hours)
   - Track modified fields automatically
   - Better UX with dirty state

### Phase 5: Advanced Features

1. **Form Wizard Component**:
   - Multi-step forms with validation per step
   - Progress tracking
   - Step navigation

2. **Dynamic Forms**:
   - Generate forms from schemas
   - Conditional field rendering
   - Custom field types

3. **Form Analytics**:
   - Track validation errors
   - Measure form completion rates
   - Identify problematic fields

---

## Resources and References

### Documentation

- **React Hook Form**: https://react-hook-form.com/
- **Zod Integration**: https://react-hook-form.com/get-started#SchemaValidation
- **TypeScript Support**: https://react-hook-form.com/ts

### Examples

- **CodeSandbox Template**: Will be created during implementation
- **Storybook Stories**: Form components with all states
- **Test Examples**: In `/tests/forms/` directory

### Internal References

- **Current API Handler Pattern**: `/Users/tpinto/madpin/neureed/src/lib/api-handler.ts`
- **Existing Schemas**: `/Users/tpinto/madpin/neureed/app/api/saved-searches/route.ts` (Lines 14-25)
- **Form Components**: `/Users/tpinto/madpin/neureed/app/components/ui/Form/`

---

## Appendix: Example Schemas

### Complete Feed Settings Schema

```typescript
// /Users/tpinto/madpin/neureed/src/lib/validation/feed-schemas.ts
import { z } from "zod";

export const feedSettingsSchema = z.object({
  customName: z.string().max(200).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  fetchInterval: z.number().int().min(5).max(1440),
  maxArticlesPerFeed: z.number().int().min(50).max(5000).optional(),
  maxArticleAge: z.number().int().min(1).max(365).optional(),
  extractionMethod: z.enum(["rss", "readability", "playwright", "custom"]),
  requiresAuth: z.boolean(),
  contentMergeStrategy: z.enum(["replace", "prepend", "append"]),
  cookies: z.string().optional(),
  headers: z.record(z.string()).optional(),
  customSelector: z.string().optional(),
  timeout: z.number().int().min(5).max(120).optional(),
});

export const summarizationSettingsSchema = z.object({
  enabled: z.boolean(),
  minContentLength: z.number().int().min(100).max(100000),
  includeKeyPoints: z.boolean(),
  includeTopics: z.boolean(),
});

export const combinedFeedSettingsSchema = z.object({
  feedSettings: feedSettingsSchema,
  summarization: summarizationSettingsSchema,
});

export type FeedSettingsFormData = z.infer<typeof feedSettingsSchema>;
export type SummarizationSettingsFormData = z.infer<typeof summarizationSettingsSchema>;
export type CombinedFeedSettingsFormData = z.infer<typeof combinedFeedSettingsSchema>;
```

---

## Conclusion

This integration plan provides a comprehensive roadmap for adopting React Hook Form in NeuReed. The approach is:

- **Incremental**: Start with one form, learn, then scale
- **Low-Risk**: Feature flags and parallel implementations
- **Well-Tested**: Comprehensive test coverage
- **Performance-Focused**: Measurable improvements
- **Developer-Friendly**: Better DX and maintainability

**Estimated Total Effort**: 16-20 hours development + 6-8 hours testing = **22-28 hours**

**Next Steps**:
1. Review and approve this plan
2. Create feature branch: `feature/react-hook-form-integration`
3. Start with Phase 1: Foundation + FeedManagementModal
4. Iterate based on learnings

---

**Document Version**: 1.0
**Last Updated**: 2025-11-25
**Author**: Claude (Anthropic)
**Review Status**: Draft - Awaiting Approval
