-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "articleSortDirection" TEXT NOT NULL DEFAULT 'desc',
ADD COLUMN     "articleSortOrder" TEXT NOT NULL DEFAULT 'publishedAt';
