-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "defaultMaxArticleAge" INTEGER NOT NULL DEFAULT 90,
ADD COLUMN     "defaultMaxArticlesPerFeed" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "defaultRefreshInterval" INTEGER NOT NULL DEFAULT 60;
