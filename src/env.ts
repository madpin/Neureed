import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    
    // Authentication configuration
    NEXTAUTH_URL: z.string().url().optional(),
    NEXTAUTH_SECRET: z.string().min(32),
    AUTH_TRUST_HOST: z
      .enum(["true", "false"])
      .default("false")
      .transform((val) => val === "true"),
    
    // OAuth Providers - Google
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    
    // OAuth Providers - GitHub
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    
    // Generic OAuth2 Provider (optional)
    OAUTH_CLIENT_ID: z.string().optional(),
    OAUTH_CLIENT_SECRET: z.string().optional(),
    OAUTH_ISSUER: z.string().optional(),
    OAUTH_AUTHORIZATION_URL: z.string().url().optional(),
    OAUTH_TOKEN_URL: z.string().url().optional(),
    OAUTH_USERINFO_URL: z.string().url().optional(),
    OAUTH_PROVIDER_NAME: z.string().default("OAuth"),
    
    // Embedding configuration
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_BASE_URL: z.string().optional(), // For OpenAI-compatible endpoints
    EMBEDDING_PROVIDER: z
      .enum(["openai", "local"])
      .default("local"),
    EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
    EMBEDDING_BATCH_SIZE: z.coerce.number().default(10),
    EMBEDDING_AUTO_GENERATE: z
      .enum(["true", "false"])
      .default("false")
      .transform((val) => val === "true"),
    
    // Content Extraction configuration
    ENCRYPTION_SECRET: z.string().min(32).default(
      // Generate a default secret for development (NOT for production!)
      "dev-secret-key-change-in-production-32chars-please"
    ),
    PLAYWRIGHT_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((val) => val === "true"),
    EXTRACTION_TIMEOUT: z.coerce.number().default(30000),
    
    // Redis/Cache configuration
    REDIS_URL: z.string().default("redis://localhost:6379"),
    REDIS_PASSWORD: z.string().optional(),
    CACHE_ENABLED: z
      .enum(["true", "false"])
      .default("true")
      .transform((val) => val === "true"),
    
    // LLM configuration
    LLM_PROVIDER: z
      .enum(["openai", "ollama"])
      .default("openai"),
    LLM_SUMMARY_MODEL: z.string().default("gpt-4o-mini"), // Model for summarization
    LLM_DIGEST_MODEL: z.string().default("gpt-4o-mini"), // Model for digest generation
    OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),
    
    // Cron job configuration
    ENABLE_CRON_JOBS: z
      .enum(["true", "false"])
      .default("true")
      .transform((val) => val === "true"),
    FEED_REFRESH_SCHEDULE: z.string().default("*/30 * * * *"), // Every 30 minutes
    CLEANUP_SCHEDULE: z.string().default("0 3 * * *"), // Daily at 3 AM
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_APP_URL: z.string().url(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    
    // Authentication
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET: process.env.OAUTH_CLIENT_SECRET,
    OAUTH_ISSUER: process.env.OAUTH_ISSUER,
    OAUTH_AUTHORIZATION_URL: process.env.OAUTH_AUTHORIZATION_URL,
    OAUTH_TOKEN_URL: process.env.OAUTH_TOKEN_URL,
    OAUTH_USERINFO_URL: process.env.OAUTH_USERINFO_URL,
    OAUTH_PROVIDER_NAME: process.env.OAUTH_PROVIDER_NAME,
    
    // Embeddings
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER,
    EMBEDDING_MODEL: process.env.EMBEDDING_MODEL,
    EMBEDDING_BATCH_SIZE: process.env.EMBEDDING_BATCH_SIZE,
    EMBEDDING_AUTO_GENERATE: process.env.EMBEDDING_AUTO_GENERATE,
    
    // Content Extraction
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
    PLAYWRIGHT_ENABLED: process.env.PLAYWRIGHT_ENABLED,
    EXTRACTION_TIMEOUT: process.env.EXTRACTION_TIMEOUT,
    
    // Redis/Cache configuration
    REDIS_URL: process.env.REDIS_URL,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    CACHE_ENABLED: process.env.CACHE_ENABLED,
    
    // LLM configuration
    LLM_PROVIDER: process.env.LLM_PROVIDER,
    LLM_SUMMARY_MODEL: process.env.LLM_SUMMARY_MODEL,
    LLM_DIGEST_MODEL: process.env.LLM_DIGEST_MODEL,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    
    // Cron job configuration
    ENABLE_CRON_JOBS: process.env.ENABLE_CRON_JOBS,
    FEED_REFRESH_SCHEDULE: process.env.FEED_REFRESH_SCHEDULE,
    CLEANUP_SCHEDULE: process.env.CLEANUP_SCHEDULE,
    // NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});

