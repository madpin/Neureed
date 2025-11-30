#!/usr/bin/env node

/**
 * Fix Next.js 16 route handler signatures
 * Changes: async () => { to async ({}) => {
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToFix = [
  'app/api/jobs/refresh-feeds/route.ts',
  'app/api/jobs/generate-embeddings/route.ts',
  'app/api/jobs/pattern-decay/route.ts',
  'app/api/user/articles/embeddings/route.ts',
  'app/api/admin/cron/history/route.ts',
  'app/api/admin/cron/status/route.ts',
  'app/api/admin/cleanup/route.ts',
  'app/api/admin/summarization/config/route.ts',
  'app/api/admin/config/route.ts',
  'app/api/admin/embeddings/route.ts',
  'app/api/admin/llm/config/route.ts',
  'app/api/admin/database/reset/route.ts',
  'app/api/admin/settings/route.ts',
  'app/api/admin/settings/defaults/route.ts',
  'app/api/admin/settings/providers/route.ts',
  'app/api/admin/settings/constraints/route.ts',
  'app/api/admin/settings/llm/route.ts',
  'app/api/admin/metrics/route.ts',
];

let fixedCount = 0;
let errorCount = 0;

for (const file of filesToFix) {
  const filePath = path.join(path.dirname(__dirname), file);

  try {
    // Read file
    let content = fs.readFileSync(filePath, 'utf-8');

    // Count occurrences before
    const beforeCount = (content.match(/async \(\) =>/g) || []).length;

    // Replace pattern
    content = content.replace(/async \(\) =>/g, 'async ({}) =>');

    // Count occurrences after
    const afterCount = (content.match(/async \(\) =>/g) || []).length;

    // Write back
    fs.writeFileSync(filePath, content, 'utf-8');

    const replacedCount = beforeCount - afterCount;
    if (replacedCount > 0) {
      console.log(`✅ ${file}: Fixed ${replacedCount} occurrence(s)`);
      fixedCount += replacedCount;
    } else {
      console.log(`⏭️  ${file}: No changes needed`);
    }
  } catch (error) {
    console.error(`❌ ${file}: ${error.message}`);
    errorCount++;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`Total fixes applied: ${fixedCount}`);
if (errorCount > 0) {
  console.log(`Errors encountered: ${errorCount}`);
  process.exit(1);
} else {
  console.log('✨ All files fixed successfully!');
}
