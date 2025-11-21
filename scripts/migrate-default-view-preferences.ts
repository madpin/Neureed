/**
 * Data Migration Script: Convert defaultView to Article Display Preferences
 * 
 * This script migrates existing user preferences from the old `defaultView` 
 * field to the new granular article display customization fields.
 * 
 * Migration logic:
 * - "compact" → density="compact", showArticleImage=false, showArticleExcerpt=false
 * - "expanded" → density="normal", all toggles=true (default)
 * 
 * Run with: npx tsx scripts/migrate-default-view-preferences.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting defaultView migration...');

  // Get all user preferences
  const allPreferences = await prisma.user_preferences.findMany({
    select: {
      id: true,
      userId: true,
      defaultView: true,
      showArticleImage: true,
      showArticleExcerpt: true,
    },
  });

  console.log(`Found ${allPreferences.length} user preferences to migrate`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const pref of allPreferences) {
    // Skip if already migrated (custom values set)
    if (
      pref.showArticleImage === false ||
      pref.showArticleExcerpt === false
    ) {
      console.log(`Skipping user ${pref.userId} - already migrated`);
      skippedCount++;
      continue;
    }

    // Determine new values based on defaultView
    let updates: {
      articleCardDensity: string;
      showArticleImage?: boolean;
      showArticleExcerpt?: boolean;
    } = {
      articleCardDensity: 'normal',
    };

    if (pref.defaultView === 'compact') {
      updates = {
        articleCardDensity: 'compact',
        showArticleImage: false,
        showArticleExcerpt: false,
      };
      console.log(`Migrating user ${pref.userId}: compact → compact density, hide image/excerpt`);
    } else {
      // expanded or any other value → normal density with all visible
      updates = {
        articleCardDensity: 'normal',
      };
      console.log(`Migrating user ${pref.userId}: ${pref.defaultView} → normal density`);
    }

    // Update the preferences
    await prisma.user_preferences.update({
      where: { id: pref.id },
      data: updates,
    });

    migratedCount++;
  }

  console.log('\nMigration complete!');
  console.log(`Migrated: ${migratedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Total: ${allPreferences.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('Migration failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

