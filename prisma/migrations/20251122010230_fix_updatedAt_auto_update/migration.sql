-- AlterTable
-- This migration adds @updatedAt directive to various models in schema.prisma
-- The @updatedAt directive is a Prisma-level feature that automatically updates
-- the field when records are modified. No database schema changes are needed.

-- The following models now have @updatedAt on their updatedAt fields:
-- User, admin_settings, article_feedback, articles, categories, feeds,
-- user_categories, user_feeds, user_patterns, user_preferences, user_notifications

-- This is a no-op migration as the database schema doesn't change,
-- but it ensures the migration history is consistent with the schema.prisma changes.

