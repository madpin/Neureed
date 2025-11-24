# Production Migration Guide: Relative Font Sizes

## Overview

This document explains how to safely deploy the relative font size feature to production. This feature adds four new columns to the `user_preferences` table to allow users to customize text sizes across different sections of the application.

## Migration Details

**Migration Name:** `20251124102956_add_relative_font_sizes`

**Changes:**
- Adds `sidebarFontSize` column (default: "smaller")
- Adds `cardFontSize` column (default: "same")
- Adds `modalFontSize` column (default: "same")
- Adds `uiFontSize` column (default: "same")

**Database Impact:**
- ✅ **Safe for production** - Uses `ALTER TABLE ADD COLUMN` with defaults
- ✅ **Non-breaking** - All columns have default values
- ✅ **No data loss** - Existing rows get default values automatically
- ✅ **Fast operation** - Adding columns with defaults is quick in PostgreSQL
- ⚠️ **Brief lock** - Table will be briefly locked during migration (typically <1 second)

## Pre-Deployment Checklist

- [ ] Verify all previous migrations are applied in production
- [ ] Ensure database backup is recent (or create new backup)
- [ ] Check production database connection string in environment variables
- [ ] Verify Prisma CLI is available in production environment
- [ ] Schedule deployment during low-traffic window (optional but recommended)
- [ ] Have rollback plan ready (see Rollback section below)

## Production Deployment Steps

### Option 1: Using Prisma Migrate (Recommended)

This is the safest and recommended approach for production deployments.

```bash
# 1. Pull the latest code with the migration
git pull origin main

# 2. Install dependencies (ensures Prisma CLI is available)
npm install

# 3. Apply the migration
npx prisma migrate deploy
```

**What happens:**
- Prisma reads all pending migrations
- Applies them in order to your production database
- Updates the `_prisma_migrations` table to track applied migrations
- No data is lost - existing users get default values

### Option 2: Manual SQL Execution

If you prefer to run SQL manually or need to review the changes first:

```bash
# 1. Review the migration SQL
cat prisma/migrations/20251124102956_add_relative_font_sizes/migration.sql

# 2. Connect to your production database
psql $DATABASE_URL

# 3. Run the SQL commands
ALTER TABLE "user_preferences"
  ADD COLUMN "cardFontSize" TEXT NOT NULL DEFAULT 'same',
  ADD COLUMN "modalFontSize" TEXT NOT NULL DEFAULT 'same',
  ADD COLUMN "sidebarFontSize" TEXT NOT NULL DEFAULT 'smaller',
  ADD COLUMN "uiFontSize" TEXT NOT NULL DEFAULT 'same';

# 4. Manually mark the migration as applied (if using Prisma)
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
  gen_random_uuid(),
  'your_checksum_here',
  NOW(),
  '20251124102956_add_relative_font_sizes',
  NULL,
  NULL,
  NOW(),
  1
);
```

### Option 3: Zero-Downtime Deployment (For High-Traffic Sites)

For applications that cannot tolerate any downtime:

```bash
# 1. Deploy code FIRST (without migration)
#    The app will work fine without the new columns initially
git pull origin main
npm install
npm run build
pm2 restart neureed  # or your process manager

# 2. Apply migration during low-traffic period
npx prisma migrate deploy

# 3. No restart needed - app will automatically use new columns
```

## Verification Steps

After deployment, verify the migration was successful:

```bash
# 1. Check migration status
npx prisma migrate status

# Expected output:
# Database schema is up to date!

# 2. Verify columns exist
psql $DATABASE_URL -c "\d user_preferences"

# Expected output should include:
# sidebarFontSize  | text | not null | default 'smaller'
# cardFontSize     | text | not null | default 'same'
# modalFontSize    | text | not null | default 'same'
# uiFontSize       | text | not null | default 'same'

# 3. Test the feature in production
# - Log in as a user
# - Navigate to Preferences → Display
# - Verify text size controls are visible
# - Change a setting and verify it persists
```

## Rollback Plan

If something goes wrong and you need to rollback:

### Immediate Rollback (Code Only)

```bash
# 1. Rollback to previous code version
git checkout <previous-commit-hash>
npm install
npm run build
pm2 restart neureed

# The new columns will remain in the database but won't be used
# This is safe - no data loss
```

### Full Rollback (Code + Database)

⚠️ **WARNING:** Only do this if absolutely necessary. This will remove the new columns.

```sql
-- Connect to production database
psql $DATABASE_URL

-- Remove the new columns
ALTER TABLE "user_preferences"
  DROP COLUMN IF EXISTS "sidebarFontSize",
  DROP COLUMN IF EXISTS "cardFontSize",
  DROP COLUMN IF EXISTS "modalFontSize",
  DROP COLUMN IF EXISTS "uiFontSize";

-- Mark migration as rolled back
UPDATE "_prisma_migrations"
SET rolled_back_at = NOW()
WHERE migration_name = '20251124102956_add_relative_font_sizes';
```

## Common Issues and Solutions

### Issue: "Migration already applied"

**Cause:** Migration was run multiple times

**Solution:** This is safe - Prisma will skip already-applied migrations

```bash
npx prisma migrate status  # Check current state
```

### Issue: "Database schema is not in sync"

**Cause:** Schema drift between code and database

**Solution:**
```bash
# Check what migrations are pending
npx prisma migrate status

# If safe, apply pending migrations
npx prisma migrate deploy

# If there's drift, you may need to resolve it manually
npx prisma migrate resolve --applied <migration-name>
```

### Issue: "Cannot add NOT NULL column without default"

**Cause:** This shouldn't happen with our migration (we have defaults)

**Solution:**
```bash
# Check the migration file
cat prisma/migrations/20251124102956_add_relative_font_sizes/migration.sql

# Ensure all columns have DEFAULT values
```

### Issue: Table lock timeout

**Cause:** Long-running transaction blocking the migration

**Solution:**
```bash
# Check for blocking queries
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Terminate blocking queries if safe
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND pid != pg_backend_pid();"

# Retry migration
npx prisma migrate deploy
```

## Monitoring After Deployment

Monitor these metrics after deployment:

1. **Application Errors:**
   - Watch for errors related to user_preferences
   - Check logs for Prisma query errors

2. **Database Performance:**
   - Monitor query performance for user_preferences table
   - Check for any slow queries

3. **User Experience:**
   - Verify users can access preferences
   - Check for UI errors in preferences modal
   - Confirm text sizes are applied correctly

## Docker/Container Deployments

If deploying via Docker:

```bash
# 1. Build new image with updated schema
docker build -t neureed:latest .

# 2. Run migration in a one-off container
docker run --rm neureed:latest npx prisma migrate deploy

# 3. Deploy new version
docker-compose up -d

# Or with Dokploy/similar platform:
# - Push code to repository
# - Dokploy will automatically build and deploy
# - Migration runs automatically if configured in start command
```

## Environment Variables

Ensure these environment variables are set in production:

```bash
DATABASE_URL=postgresql://user:password@host:port/neureed
NODE_ENV=production
```

## Support

If you encounter issues during deployment:

1. Check the Prisma migration logs
2. Review the application logs
3. Verify database connectivity
4. Check GitHub issues: https://github.com/anthropics/neureed/issues

## Summary

**Safe for production:** ✅ Yes
**Downtime required:** ❌ No (brief table lock only)
**Data loss risk:** ❌ None
**Reversible:** ✅ Yes
**Testing required:** ✅ Recommended

**Recommended deployment time:** During low-traffic hours (optional)

**Estimated deployment time:** < 5 minutes

---

**Last Updated:** 2024-11-24
**Migration Version:** 20251124102956_add_relative_font_sizes
