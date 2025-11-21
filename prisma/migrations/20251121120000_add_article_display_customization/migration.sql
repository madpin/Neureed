-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN "showArticleImage" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "showArticleExcerpt" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "showArticleAuthor" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "showArticleFeedInfo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "showArticleDate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "articleCardSectionOrder" JSONB DEFAULT '["feedInfo","title","excerpt","actions"]',
ADD COLUMN "articleCardDensity" TEXT NOT NULL DEFAULT 'normal';

