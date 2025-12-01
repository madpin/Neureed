"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useLLMConfig,
  useEmbeddingConfig,
  useSummarizationConfig,
  useUpdateLLMConfig,
  useTestLLMConfig,
  useDeleteAllEmbeddings,
  useUpdateSummarizationConfig,
} from "@/hooks/queries/use-admin";

// Loading Spinner Component
function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      <span className="ml-3 text-foreground/60">{message}</span>
    </div>
  );
}

// LLM Test Result Interface
interface LLMTestResult {
  success?: boolean;
  error?: string;
  model?: string;
  testTime?: string;
  summary?: {
    success?: boolean;
    error?: string;
    model?: string;
    testTime?: string;
  };
  embedding?: {
    success?: boolean;
    error?: string;
    model?: string;
    testTime?: string;
  };
  digest?: {
    success?: boolean;
    error?: string;
    model?: string;
    testTime?: string;
  };
}

/**
 * LLMConfigTab component for system-wide LLM configuration management.
 * Manages OpenAI/Ollama provider settings, API keys, models, and embedding configuration.
 *
 * @example
 * ```tsx
 * <LLMConfigTab />
 * ```
 */
export function LLMConfigTab() {
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testResults, setTestResults] = useState<LLMTestResult | null>(null);
  const [pendingDeleteEmbeddings, setPendingDeleteEmbeddings] = useState(false);

  // Use React Query hooks
  const { data: configData, isLoading } = useLLMConfig();
  const { data: embeddingConfig } = useEmbeddingConfig();
  const { data: summarizationConfig } = useSummarizationConfig();
  const updateConfig = useUpdateLLMConfig();
  const testConfig = useTestLLMConfig();
  const deleteEmbeddings = useDeleteAllEmbeddings();
  const updateSummarizationConfig = useUpdateSummarizationConfig();

  // Summarization toggle state
  const [isSummarizationToggling, setIsSummarizationToggling] = useState(false);
  
  // Form state
  const [provider, setProvider] = useState<"openai" | "ollama">("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [summaryModel, setSummaryModel] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("");
  const [digestModel, setDigestModel] = useState("");
  const [embeddingProvider, setEmbeddingProvider] = useState<"openai" | "local">("openai");
  
  // Masked API key and sources for display
  const [maskedKey, setMaskedKey] = useState("");
  const [sources, setSources] = useState<{
    provider: string;
    apiKey: string;
    baseUrl: string;
    summaryModel: string;
    embeddingModel: string;
    digestModel: string;
  }>({
    provider: "environment",
    apiKey: "none",
    baseUrl: "none",
    summaryModel: "environment",
    embeddingModel: "environment",
    digestModel: "environment",
  });

  // Update form when data loads
  useEffect(() => {
    if (configData?.config) {
      const config = configData.config;
      setProvider(config.provider as "openai" | "ollama" || "openai");
      setBaseUrl(config.baseUrl || "");
      setSummaryModel(config.summaryModel || "");
      setEmbeddingModel(config.embeddingModel || "");
      setDigestModel(config.digestModel || "");
      setMaskedKey(config.apiKey || "");
      
      // Set sources
      setSources({
        provider: config.providerSource || "environment",
        apiKey: config.apiKeySource || "none",
        baseUrl: config.baseUrlSource || "none",
        summaryModel: config.summaryModelSource || "environment",
        embeddingModel: config.embeddingModelSource || "environment",
        digestModel: config.digestModelSource || "environment",
      });
    }
  }, [configData]);
  
  // Update embedding provider from config
  useEffect(() => {
    if (embeddingConfig) {
      setEmbeddingProvider(embeddingConfig.provider);
    }
  }, [embeddingConfig]);

  const handleSave = async () => {
    setSaveMessage(null);

    try {
      await updateConfig.mutateAsync({
        provider,
        apiKey: apiKey || undefined,
        baseUrl: baseUrl || undefined,
        summaryModel: summaryModel || undefined,
        embeddingModel: embeddingModel || undefined,
        digestModel: digestModel || undefined,
      });

      setSaveMessage({ type: "success", text: "Configuration saved successfully" });
      toast.success("LLM configuration saved");
      
      // Clear API key input
      setApiKey("");

      // Clear success message after 5 seconds
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error) {
      console.error("Failed to save LLM config:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save configuration";
      setSaveMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage);
    }
  };

  const handleTest = async () => {
    setSaveMessage(null);
    setTestResults(null);

    try {
      const result = await testConfig.mutateAsync({
        provider,
        apiKey: apiKey || undefined,
        baseUrl: baseUrl || undefined,
        summaryModel: summaryModel || undefined,
        embeddingModel: embeddingModel || undefined,
        digestModel: digestModel || undefined,
      });

      const results = result.results;
      setTestResults(results);

      if (!results || !results.success) {
        setSaveMessage({ type: "error", text: "Configuration test failed - see details below" });
        toast.error("LLM configuration test failed");
      } else {
        setSaveMessage({ type: "success", text: "Configuration test successful - see details below" });
        toast.success("LLM configuration test successful");
      }
    } catch (error) {
      console.error("Failed to test LLM config:", error);
      const errorMessage = error instanceof Error ? error.message : "Configuration test failed";
      setSaveMessage({ type: "error", text: errorMessage });
      setTestResults({ success: false, error: errorMessage });
      toast.error(errorMessage);
    }
  };
  
  const handleDeleteEmbeddings = async () => {
    if (!pendingDeleteEmbeddings) {
      setPendingDeleteEmbeddings(true);
      toast.warning("Delete all embeddings?", {
        description: "Click the button again to confirm. This will permanently delete all article embeddings and they will need to be regenerated.",
        duration: 5000,
      });
      setTimeout(() => setPendingDeleteEmbeddings(false), 5000);
      return;
    }

    setPendingDeleteEmbeddings(false);
    try {
      const result = await deleteEmbeddings.mutateAsync();
      toast.success(`Deleted embeddings for ${result.cleared} articles`);
      setSaveMessage({ type: "success", text: `Successfully deleted ${result.cleared} embeddings` });
    } catch (error) {
      console.error("Failed to delete embeddings:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete embeddings";
      setSaveMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage);
    }
  };

  const handleSummarizationToggle = async () => {
    if (!summarizationConfig) return;

    setIsSummarizationToggling(true);
    try {
      await updateSummarizationConfig.mutateAsync({
        autoGenerate: !summarizationConfig.autoGenerate,
      });
      toast.success(
        `Summarization ${!summarizationConfig.autoGenerate ? "enabled" : "disabled"}`
      );
    } catch (error) {
      console.error("Failed to toggle summarization:", error);
      toast.error("Failed to update summarization setting");
    } finally {
      setIsSummarizationToggling(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading LLM configuration..." />;
  }

  // Helper to render source badge
  const SourceBadge = ({ source }: { source: string }) => {
    if (source === "database") {
      return (
        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
          [Database Override]
        </span>
      );
    } else if (source === "environment") {
      return (
        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
          [Environment Variable]
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">System LLM Configuration</h2>
        <p className="mt-2 text-foreground/70">
          System-wide LLM configuration hierarchy: <strong>Environment Variables (.env)</strong> → <strong>Database Overrides (this form)</strong> → <strong>User Preferences</strong>
        </p>
        <p className="mt-1 text-sm text-foreground/60">
          Environment variables provide the base system defaults. Database settings here override those defaults. Users can further override with their own credentials in preferences.
        </p>
      </div>

      {/* Article Summarization Configuration */}
      <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-foreground">Article Summarization</h3>
            <p className="text-sm text-foreground/60 mt-1">
              Automatically generate summaries for RSS articles using LLM
            </p>
          </div>
          <button
            onClick={handleSummarizationToggle}
            disabled={isSummarizationToggling || !summarizationConfig}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              summarizationConfig?.autoGenerate
                ? "bg-blue-600"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                summarizationConfig?.autoGenerate ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded bg-muted/20 border border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Status</span>
              {summarizationConfig?.autoGenerateSource === "database" && (
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  Custom
                </span>
              )}
            </div>
            <span
              className={`text-sm font-medium ${
                summarizationConfig?.autoGenerate
                  ? "text-green-600 dark:text-green-400"
                  : "text-yellow-600 dark:text-yellow-400"
              }`}
            >
              {summarizationConfig?.autoGenerate ? "Enabled" : "Disabled"}
            </span>
          </div>

          <div className="text-xs text-foreground/60 space-y-1">
            <p>
              • When enabled, articles are automatically summarized after feed refresh
            </p>
            <p>• Users can configure per-feed settings once this is enabled</p>
            <p>• Summaries include key points and topics extraction</p>
            <p>• Uses user&apos;s configured LLM provider (OpenAI or Ollama)</p>
          </div>

          {summarizationConfig?.autoGenerate && (
            <div className="mt-4 p-3 rounded bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-300">
                ✓ Summarization is active. Users can now enable it for their feeds in feed
                settings.
              </p>
            </div>
          )}

          {!summarizationConfig?.autoGenerate && (
            <div className="mt-4 p-3 rounded bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                ⚠ Summarization is disabled. Users cannot configure it until you enable it
                here.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">LLM Provider</h3>
        
        <div className="space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              Provider
              <SourceBadge source={sources.provider} />
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as "openai" | "ollama")}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground"
            >
              <option value="openai">OpenAI</option>
              <option value="ollama">Ollama</option>
            </select>
            <p className="mt-1 text-sm text-foreground/60">
              Choose between OpenAI (cloud-based) or Ollama (self-hosted). Current: <strong>{provider}</strong>
            </p>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              API Key {provider === "openai" && "(optional)"}
              <SourceBadge source={sources.apiKey} />
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={maskedKey || "Enter API key..."}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground"
            />
            <p className="mt-1 text-sm text-foreground/60">
              {provider === "openai" 
                ? "Optional: Provide a system-wide API key. Users can also use their own keys."
                : "Your Ollama API key (if authentication is enabled)"}
            </p>
            {maskedKey && (
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                ✓ Current key: {maskedKey}
              </p>
            )}
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              Base URL (optional)
              <SourceBadge source={sources.baseUrl} />
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={provider === "openai" ? "https://api.openai.com/v1" : "http://localhost:11434"}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground"
            />
            <p className="mt-1 text-sm text-foreground/60">
              {provider === "openai" 
                ? "Use a custom OpenAI-compatible API endpoint"
                : "Your Ollama server URL"}
            </p>
          </div>

          {/* Model Names */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-3">
              Model Configuration
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
              Specify different models for different features
            </p>
            
            <div className="space-y-4">
              {/* Summary Model */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  Summary Model
                  <SourceBadge source={sources.summaryModel} />
                </label>
                <input
                  type="text"
                  value={summaryModel}
                  onChange={(e) => setSummaryModel(e.target.value)}
                  placeholder={provider === "openai" ? "gpt-4o-mini" : "llama2"}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground"
                />
                <p className="mt-1 text-sm text-foreground/60">
                  Model for generating article summaries. Current: <strong>{summaryModel || "not set"}</strong>
                </p>
              </div>

              {/* Embedding Model */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  Embedding Model
                  <SourceBadge source={sources.embeddingModel} />
                </label>
                <input
                  type="text"
                  value={embeddingModel}
                  onChange={(e) => setEmbeddingModel(e.target.value)}
                  placeholder={provider === "openai" ? "text-embedding-3-small" : "nomic-embed-text"}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground"
                />
                <p className="mt-1 text-sm text-foreground/60">
                  Model for generating vector embeddings for semantic search. Current: <strong>{embeddingModel || "not set"}</strong>
                </p>
              </div>

              {/* Digest Model */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  Digest Model
                  <SourceBadge source={sources.digestModel} />
                </label>
                <input
                  type="text"
                  value={digestModel}
                  onChange={(e) => setDigestModel(e.target.value)}
                  placeholder={provider === "openai" ? "gpt-4o-mini" : "llama2"}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground"
                />
                <p className="mt-1 text-sm text-foreground/60">
                  Model for generating daily digests (future feature). Current: <strong>{digestModel || "not set"}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Embedding Provider Selection & Management */}
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
            <h4 className="font-medium text-purple-900 dark:text-purple-200 mb-3">
              Embedding Provider Management
            </h4>
            <p className="text-sm text-purple-800 dark:text-purple-300 mb-4">
              Select which embedding provider to use for article semantic search
            </p>
            
            <div className="space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Active Embedding Provider
                </label>
                <select
                  value={embeddingProvider}
                  onChange={(e) => setEmbeddingProvider(e.target.value as "openai" | "local")}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground"
                >
                  <option value="openai">OpenAI (Cloud-based)</option>
                  <option value="local">Local (Self-hosted)</option>
                </select>
                <p className="mt-1 text-sm text-foreground/60">
                  Current active provider: <strong>{embeddingProvider}</strong>
                </p>
                <p className="mt-1 text-xs text-foreground/50">
                  Note: Changing providers requires regenerating all embeddings
                </p>
              </div>

              {/* Delete Embeddings Button */}
              <div className="border-t border-purple-300 dark:border-purple-700 pt-4">
                <button
                  onClick={handleDeleteEmbeddings}
                  disabled={deleteEmbeddings.isPending}
                  className={`rounded-lg px-6 py-2 font-medium text-white ${
                    pendingDeleteEmbeddings
                      ? "bg-red-700 hover:bg-red-800"
                      : "bg-red-600 hover:bg-red-700"
                  } disabled:opacity-50`}
                >
                  {deleteEmbeddings.isPending ? "Deleting..." : pendingDeleteEmbeddings ? "Confirm Delete?" : "Delete All Embeddings"}
                </button>
                <p className="mt-2 text-xs text-foreground/60">
                  This will permanently delete all article embeddings. They can be regenerated later.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={testConfig.isPending || updateConfig.isPending}
              className="rounded-lg border border-blue-600 bg-transparent px-6 py-2 font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-blue-900/20"
            >
              {testConfig.isPending ? "Testing..." : "Test Configuration"}
            </button>
            <button
              onClick={handleSave}
              disabled={updateConfig.isPending || testConfig.isPending}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {updateConfig.isPending ? "Saving..." : "Save Configuration"}
            </button>
          </div>

          {/* Status Message */}
          {saveMessage && (
            <div
              className={`rounded-lg p-4 ${
                saveMessage.type === "success"
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              }`}
            >
              {saveMessage.text}
            </div>
          )}

          {/* Test Results Display */}
          {testResults && (
            <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
              <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                <span>Test Results</span>
                {testResults.success ? (
                  <span className="text-green-600 dark:text-green-400">✓ Passed</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">✗ Failed</span>
                )}
              </h4>
              
              <div className="space-y-4">
                {/* Embedding Test */}
                {testResults.embedding && (
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Embedding Test</span>
                        {testResults.embedding.success ? (
                          <span className="text-green-600 dark:text-green-400 text-sm">✓ Success</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 text-sm">✗ Failed</span>
                        )}
                      </div>
                      {testResults.embedding.testTime && (
                        <span className="text-sm text-foreground/60">{testResults.embedding.testTime}ms</span>
                      )}
                    </div>
                    {testResults.embedding.model && (
                      <div className="text-sm text-foreground/70 mb-1">
                        Model: <span className="font-mono">{testResults.embedding.model}</span>
                      </div>
                    )}
                    {testResults.embedding.error && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
                        {testResults.embedding.error}
                      </div>
                    )}
                    {testResults.embedding.success && (
                      <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                        Embedding generation is working correctly
                      </div>
                    )}
                  </div>
                )}

                {/* Summary Test */}
                {testResults.summary && (
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Summary Test</span>
                        {testResults.summary.success ? (
                          <span className="text-green-600 dark:text-green-400 text-sm">✓ Success</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 text-sm">✗ Failed</span>
                        )}
                      </div>
                      {testResults.summary.testTime && (
                        <span className="text-sm text-foreground/60">{testResults.summary.testTime}ms</span>
                      )}
                    </div>
                    {testResults.summary.model && (
                      <div className="text-sm text-foreground/70 mb-1">
                        Model: <span className="font-mono">{testResults.summary.model}</span>
                      </div>
                    )}
                    {testResults.summary.error && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
                        {testResults.summary.error}
                      </div>
                    )}
                    {testResults.summary.success && (
                      <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                        Summary generation is working correctly
                      </div>
                    )}
                  </div>
                )}

                {/* General Error */}
                {testResults.error && !testResults.embedding && !testResults.summary && (
                  <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4">
                    <div className="font-medium text-red-800 dark:text-red-200 mb-2">Error</div>
                    <div className="text-sm text-red-700 dark:text-red-300">{testResults.error}</div>
                  </div>
                )}

                {/* Retry Button */}
                <button
                  onClick={handleTest}
                  disabled={testConfig.isPending}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {testConfig.isPending ? "Testing..." : "Retry Test"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Information Panel */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
        <h3 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2">
          💡 How It Works
        </h3>
        <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-300">
          <li>
            <strong>Environment Variables</strong> (from .env file) provide system-wide defaults
            <ul className="ml-4 mt-1 space-y-1">
              <li>• LLM_PROVIDER, OPENAI_API_KEY, OPENAI_BASE_URL</li>
              <li>• LLM_SUMMARY_MODEL, EMBEDDING_MODEL, LLM_DIGEST_MODEL</li>
            </ul>
          </li>
          <li>
            <strong>Database Overrides</strong> (set here) take precedence over environment variables
          </li>
          <li>
            <strong>User Preferences</strong> override both system settings with personal credentials
          </li>
          <li>
            For OpenAI: System credentials are optional - users can always provide their own keys
          </li>
        </ul>
      </div>
      
      {/* Environment Variables Reference */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h3 className="font-medium text-foreground mb-2">
          Environment Variables Reference
        </h3>
        <p className="text-sm text-foreground/70 mb-3">
          Configure these in your .env file for system-wide defaults:
        </p>
        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">LLM_PROVIDER</span>
            <span className="text-foreground/60">=</span>
            <span className="text-foreground/80">&quot;openai&quot; | &quot;ollama&quot;</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">OPENAI_API_KEY</span>
            <span className="text-foreground/60">=</span>
            <span className="text-foreground/80">&quot;sk-...&quot;</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">OPENAI_BASE_URL</span>
            <span className="text-foreground/60">=</span>
            <span className="text-foreground/80">&quot;https://api.openai.com/v1&quot;</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">LLM_SUMMARY_MODEL</span>
            <span className="text-foreground/60">=</span>
            <span className="text-foreground/80">&quot;gpt-4o-mini&quot;</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">EMBEDDING_MODEL</span>
            <span className="text-foreground/60">=</span>
            <span className="text-foreground/80">&quot;text-embedding-3-small&quot;</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">LLM_DIGEST_MODEL</span>
            <span className="text-foreground/60">=</span>
            <span className="text-foreground/80">&quot;gpt-4o-mini&quot;</span>
          </div>
        </div>
      </div>
    </div>
  );
}
