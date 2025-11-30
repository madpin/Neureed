"use client";

import { Card, CardBody } from "@/app/components/ui";
import { SelectSettingField, TextInputField } from "@/app/components/shared/settings";
import { PasswordField, ConditionalSection } from "@/app/components/preferences/shared";
import type { UserPreferences } from "@/hooks/queries/use-user-preferences";

export interface LLMViewProps {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}

/**
 * LLM View - LLM provider and model configuration
 */
export function LLMView({ preferences, updatePreference }: LLMViewProps) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">LLM Settings</h2>
      <Card className="mb-4 border-primary/20 bg-primary/10 dark:border-primary/30 dark:bg-primary/20">
        <CardBody>
          <p className="text-sm text-primary dark:text-primary">
            Configure your personal LLM settings for article summarization and key points extraction.
            Leave blank to use system defaults.
          </p>
        </CardBody>
      </Card>
      <div className="space-y-6">
        {/* LLM Provider */}
        <SelectSettingField
          label="LLM Provider"
          value={preferences.llmProvider ?? null}
          onChange={(value) => updatePreference("llmProvider", value)}
          options={[
            { value: "openai", label: "OpenAI" },
            { value: "ollama", label: "Ollama (Local)" },
          ]}
          placeholder="System Default"
          helperText="Choose your LLM provider for summaries and embeddings"
        />

        {/* Summary Model */}
        <TextInputField
          label="Summarization Model"
          value={preferences.llmSummaryModel ?? null}
          onChange={(value) => updatePreference("llmSummaryModel", value)}
          placeholder={
            preferences.llmProvider === "openai" ? "e.g., gpt-4o-mini" :
            preferences.llmProvider === "ollama" ? "e.g., llama2" :
            "Use system default"
          }
          helperText={
            preferences.llmProvider === "openai" ? "For article summaries. Recommended: gpt-4o-mini, gpt-4o, gpt-3.5-turbo" :
            preferences.llmProvider === "ollama" ? "For article summaries. Examples: llama2, mistral, codellama" :
            "Model for generating article summaries"
          }
        />

        {/* Embedding Model */}
        <TextInputField
          label="Embedding Model"
          value={preferences.llmEmbeddingModel ?? null}
          onChange={(value) => updatePreference("llmEmbeddingModel", value)}
          placeholder={
            preferences.llmProvider === "openai" ? "e.g., text-embedding-3-small" :
            preferences.llmProvider === "ollama" ? "e.g., nomic-embed-text" :
            "Use system default"
          }
          helperText={
            preferences.llmProvider === "openai" ? "For semantic search. Recommended: text-embedding-3-small, text-embedding-3-large" :
            preferences.llmProvider === "ollama" ? "For semantic search. Example: nomic-embed-text" :
            "Model for generating embeddings (semantic search)"
          }
        />

        {/* Digest Model */}
        <TextInputField
          label="Digest Model"
          value={preferences.llmDigestModel ?? null}
          onChange={(value) => updatePreference("llmDigestModel", value)}
          placeholder={
            preferences.llmProvider === "openai" ? "e.g., gpt-4o" :
            preferences.llmProvider === "ollama" ? "e.g., mistral" :
            "Use system default"
          }
          helperText={
            preferences.llmProvider === "openai" ? "For digest generation (future). Recommended: gpt-4o, gpt-4-turbo" :
            preferences.llmProvider === "ollama" ? "For digest generation (future). Example: mistral" :
            "Model for generating daily digests (future feature)"
          }
        />

        {/* API Key (OpenAI only) */}
        <ConditionalSection show={preferences.llmProvider === "openai"}>
          <PasswordField
            label="OpenAI API Key"
            value={preferences.llmApiKey || ""}
            onChange={(value) => updatePreference("llmApiKey", value || null)}
            placeholder="sk-..."
            helperText="🔒 Your API key is encrypted and stored securely"
          />
        </ConditionalSection>

        {/* Base URL */}
        <ConditionalSection show={preferences.llmProvider === "openai" || preferences.llmProvider === "ollama"}>
          <TextInputField
            label={preferences.llmProvider === "openai" ? "Base URL (Optional)" : "Ollama Base URL"}
            value={preferences.llmBaseUrl ?? null}
            onChange={(value) => updatePreference("llmBaseUrl", value)}
            type="url"
            placeholder={
              preferences.llmProvider === "openai" ? "https://api.openai.com/v1" :
              "http://localhost:11434"
            }
            helperText={
              preferences.llmProvider === "openai" ?
                "For OpenAI-compatible endpoints (e.g., Azure OpenAI, local proxies). Leave blank for default OpenAI API." :
                "URL where your Ollama instance is running"
            }
          />
        </ConditionalSection>
      </div>
    </div>
  );
}
