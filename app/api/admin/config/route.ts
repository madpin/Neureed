import { env } from "@/env";
import fs from "fs";
import path from "path";
import { createHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

/**
 * Admin Configuration API
 * Returns system configuration with masked sensitive values
 */

// Helper function to mask sensitive values
function maskSensitiveValue(value: string | undefined | null): string {
  if (!value) return "Not configured";
  if (value.length <= 8) return "••••••••";
  
  const first = value.substring(0, 4);
  const last = value.substring(value.length - 4);
  const middle = "•".repeat(Math.min(value.length - 8, 20));
  
  return `${first}${middle}${last}`;
}

// Get Node.js version
function getNodeVersion(): string {
  return process.version;
}

// Get Next.js version from package.json
function getNextVersion(): string {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return packageJson.dependencies.next || "Unknown";
  } catch {
    return "Unknown";
  }
}

// Get Prisma version from package.json
function getPrismaVersion(): string {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return packageJson.dependencies["@prisma/client"] || "Unknown";
  } catch {
    return "Unknown";
  }
}

// Get React version from package.json
function getReactVersion(): string {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return packageJson.dependencies.react || "Unknown";
  } catch {
    return "Unknown";
  }
}

// Get TypeScript version from package.json
function getTypeScriptVersion(): string {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return packageJson.devDependencies.typescript || "Unknown";
  } catch {
    return "Unknown";
  }
}

// Get Tailwind themes from globals.css
function getTailwindThemes(): string[] {
  try {
    const cssPath = path.join(process.cwd(), "app", "globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");
    
    // Extract theme names from :root.theme-name patterns
    const themeRegex = /:root\.([\w-]+)\s*{/g;
    const themes = new Set<string>();
    
    let match;
    while ((match = themeRegex.exec(cssContent)) !== null) {
      themes.add(match[1]);
    }
    
    return Array.from(themes);
  } catch (error) {
    return [];
  }
}

// Get Next.js config
function getNextConfig() {
  try {
    const configPath = path.join(process.cwd(), "next.config.ts");
    const configContent = fs.readFileSync(configPath, "utf-8");
    
    // Extract key config values using regex (simple parsing)
    const outputMatch = configContent.match(/output:\s*['"](\w+)['"]/);
    const bodySizeLimitMatch = configContent.match(/bodySizeLimit:\s*['"]([^'"]+)['"]/);
    
    return {
      output: outputMatch ? outputMatch[1] : "default",
      serverActions: {
        bodySizeLimit: bodySizeLimitMatch ? bodySizeLimitMatch[1] : "2mb",
      },
      experimental: {
        staticGenerationRetryCount: 0,
      },
    };
  } catch (error) {
    return {
      output: "Unknown",
      serverActions: { bodySizeLimit: "Unknown" },
    };
  }
}

// Get TypeScript config
function getTypeScriptConfig() {
  try {
    const configPath = path.join(process.cwd(), "tsconfig.json");
    const configContent = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(configContent);
    
    return {
      target: config.compilerOptions?.target || "Unknown",
      lib: config.compilerOptions?.lib || [],
      module: config.compilerOptions?.module || "Unknown",
      strict: config.compilerOptions?.strict || false,
      paths: config.compilerOptions?.paths || {},
    };
  } catch (error) {
    return {
      target: "Unknown",
      lib: [],
      module: "Unknown",
      strict: false,
      paths: {},
    };
  }
}

export const GET = createHandler(
  async () => {

    // Get environment configuration
    const authProviders = [];
    if (env.GOOGLE_CLIENT_ID) authProviders.push("Google");
    if (env.GITHUB_CLIENT_ID) authProviders.push("GitHub");
    if (env.OAUTH_CLIENT_ID) authProviders.push(env.OAUTH_PROVIDER_NAME || "OAuth");

    const enabledFeatures = [];
    if (authProviders.length > 0) enabledFeatures.push("OAuth Authentication");
    if (env.OPENAI_API_KEY || env.EMBEDDING_PROVIDER === "local") enabledFeatures.push("Embeddings");
    if (env.LLM_PROVIDER) enabledFeatures.push("LLM");
    if (env.ENABLE_CRON_JOBS) enabledFeatures.push("Cron Jobs");
    if (env.CACHE_ENABLED) enabledFeatures.push("Redis Cache");
    if (env.PLAYWRIGHT_ENABLED) enabledFeatures.push("Content Extraction");

    const config = {
      // Server Info
      server: {
        nodeVersion: getNodeVersion(),
        nextVersion: getNextVersion(),
        reactVersion: getReactVersion(),
        prismaVersion: getPrismaVersion(),
        typeScriptVersion: getTypeScriptVersion(),
        environment: env.NODE_ENV,
        platform: process.platform,
        arch: process.arch,
      },

      // Overview Stats
      overview: {
        environment: env.NODE_ENV,
        totalEnvVars: Object.keys(process.env).length,
        configuredProviders: authProviders.length,
        enabledFeatures: enabledFeatures.length,
        enabledFeaturesList: enabledFeatures,
        authProviders: authProviders,
      },

      // Authentication Configuration
      authentication: {
        nextAuthUrl: env.NEXTAUTH_URL || "Not configured",
        nextAuthSecret: env.NEXTAUTH_SECRET ? "Configured" : "Not configured",
        authTrustHost: env.AUTH_TRUST_HOST,
        providers: authProviders,
        google: {
          configured: !!env.GOOGLE_CLIENT_ID,
          clientId: env.GOOGLE_CLIENT_ID ? maskSensitiveValue(env.GOOGLE_CLIENT_ID) : "Not configured",
        },
        github: {
          configured: !!env.GITHUB_CLIENT_ID,
          clientId: env.GITHUB_CLIENT_ID ? maskSensitiveValue(env.GITHUB_CLIENT_ID) : "Not configured",
        },
        oauth: {
          configured: !!env.OAUTH_CLIENT_ID,
          providerName: env.OAUTH_PROVIDER_NAME || "OAuth",
          clientId: env.OAUTH_CLIENT_ID ? maskSensitiveValue(env.OAUTH_CLIENT_ID) : "Not configured",
          issuer: env.OAUTH_ISSUER || "Not configured",
        },
      },

      // Embedding & AI Configuration
      embeddings: {
        provider: env.EMBEDDING_PROVIDER,
        model: env.EMBEDDING_MODEL,
        batchSize: env.EMBEDDING_BATCH_SIZE,
        autoGenerate: env.EMBEDDING_AUTO_GENERATE,
        openaiApiKey: env.OPENAI_API_KEY ? maskSensitiveValue(env.OPENAI_API_KEY) : "Not configured",
        openaiBaseUrl: env.OPENAI_BASE_URL || "Default (OpenAI)",
      },

      // LLM Configuration
      llm: {
        provider: env.LLM_PROVIDER,
        model: env.LLM_MODEL,
        ollamaBaseUrl: env.OLLAMA_BASE_URL,
        openaiApiKey: env.OPENAI_API_KEY ? maskSensitiveValue(env.OPENAI_API_KEY) : "Not configured",
      },

      // Cache & Storage
      cache: {
        enabled: env.CACHE_ENABLED,
        redisUrl: env.REDIS_URL ? maskSensitiveValue(env.REDIS_URL) : "Not configured",
        redisPassword: env.REDIS_PASSWORD ? "Configured" : "Not configured",
      },

      // Content Extraction
      contentExtraction: {
        playwrightEnabled: env.PLAYWRIGHT_ENABLED,
        extractionTimeout: env.EXTRACTION_TIMEOUT,
        encryptionConfigured: env.ENCRYPTION_SECRET ? true : false,
      },

      // Cron Jobs
      cronJobs: {
        enabled: env.ENABLE_CRON_JOBS,
        feedRefreshSchedule: env.FEED_REFRESH_SCHEDULE,
        cleanupSchedule: env.CLEANUP_SCHEDULE,
      },

      // Next.js Configuration
      nextjs: getNextConfig(),

      // Tailwind Configuration
      tailwind: {
        themes: getTailwindThemes(),
        themesCount: getTailwindThemes().length,
      },

      // TypeScript Configuration
      typescript: getTypeScriptConfig(),

      // Database
      database: {
        type: "PostgreSQL",
        prismaVersion: getPrismaVersion(),
        url: env.DATABASE_URL ? maskSensitiveValue(env.DATABASE_URL) : "Not configured",
      },

      // All Environment Variables (organized by category)
      environmentVariables: {
        system: {
          NODE_ENV: env.NODE_ENV,
          DATABASE_URL: maskSensitiveValue(env.DATABASE_URL),
        },
        authentication: {
          NEXTAUTH_URL: env.NEXTAUTH_URL || "Not set",
          NEXTAUTH_SECRET: env.NEXTAUTH_SECRET ? "Configured" : "Not set",
          AUTH_TRUST_HOST: env.AUTH_TRUST_HOST ? "true" : "false",
          GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID ? maskSensitiveValue(env.GOOGLE_CLIENT_ID) : "Not set",
          GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET ? "Configured" : "Not set",
          GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID ? maskSensitiveValue(env.GITHUB_CLIENT_ID) : "Not set",
          GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET ? "Configured" : "Not set",
          OAUTH_CLIENT_ID: env.OAUTH_CLIENT_ID ? maskSensitiveValue(env.OAUTH_CLIENT_ID) : "Not set",
          OAUTH_CLIENT_SECRET: env.OAUTH_CLIENT_SECRET ? "Configured" : "Not set",
          OAUTH_ISSUER: env.OAUTH_ISSUER || "Not set",
          OAUTH_AUTHORIZATION_URL: env.OAUTH_AUTHORIZATION_URL || "Not set",
          OAUTH_TOKEN_URL: env.OAUTH_TOKEN_URL || "Not set",
          OAUTH_USERINFO_URL: env.OAUTH_USERINFO_URL || "Not set",
          OAUTH_PROVIDER_NAME: env.OAUTH_PROVIDER_NAME || "OAuth",
        },
        embeddings: {
          OPENAI_API_KEY: env.OPENAI_API_KEY ? maskSensitiveValue(env.OPENAI_API_KEY) : "Not set",
          OPENAI_BASE_URL: env.OPENAI_BASE_URL || "Default",
          EMBEDDING_PROVIDER: env.EMBEDDING_PROVIDER,
          EMBEDDING_MODEL: env.EMBEDDING_MODEL,
          EMBEDDING_BATCH_SIZE: env.EMBEDDING_BATCH_SIZE.toString(),
          EMBEDDING_AUTO_GENERATE: env.EMBEDDING_AUTO_GENERATE ? "true" : "false",
        },
        llm: {
          LLM_PROVIDER: env.LLM_PROVIDER,
          LLM_MODEL: env.LLM_MODEL,
          OLLAMA_BASE_URL: env.OLLAMA_BASE_URL,
        },
        cache: {
          REDIS_URL: maskSensitiveValue(env.REDIS_URL),
          REDIS_PASSWORD: env.REDIS_PASSWORD ? "Configured" : "Not set",
          CACHE_ENABLED: env.CACHE_ENABLED ? "true" : "false",
        },
        extraction: {
          ENCRYPTION_SECRET: env.ENCRYPTION_SECRET ? "Configured" : "Not set",
          PLAYWRIGHT_ENABLED: env.PLAYWRIGHT_ENABLED ? "true" : "false",
          EXTRACTION_TIMEOUT: env.EXTRACTION_TIMEOUT.toString(),
        },
        cron: {
          ENABLE_CRON_JOBS: env.ENABLE_CRON_JOBS ? "true" : "false",
          FEED_REFRESH_SCHEDULE: env.FEED_REFRESH_SCHEDULE,
          CLEANUP_SCHEDULE: env.CLEANUP_SCHEDULE,
        },
      },
    };

    return {
      success: true,
      data: config,
    };
  },
  { requireAdmin: true }
);

