-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "bounceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
ADD COLUMN     "showLowRelevanceArticles" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "article_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "feedbackType" TEXT NOT NULL,
    "feedbackValue" DOUBLE PRECISION NOT NULL,
    "timeSpent" INTEGER,
    "estimatedTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_patterns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "feedbackCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_feedback_userId_idx" ON "article_feedback"("userId");

-- CreateIndex
CREATE INDEX "article_feedback_articleId_idx" ON "article_feedback"("articleId");

-- CreateIndex
CREATE INDEX "article_feedback_userId_createdAt_idx" ON "article_feedback"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "article_feedback_feedbackType_idx" ON "article_feedback"("feedbackType");

-- CreateIndex
CREATE UNIQUE INDEX "article_feedback_userId_articleId_key" ON "article_feedback"("userId", "articleId");

-- CreateIndex
CREATE INDEX "user_patterns_userId_idx" ON "user_patterns"("userId");

-- CreateIndex
CREATE INDEX "user_patterns_userId_weight_idx" ON "user_patterns"("userId", "weight");

-- CreateIndex
CREATE INDEX "user_patterns_updatedAt_idx" ON "user_patterns"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_patterns_userId_keyword_key" ON "user_patterns"("userId", "keyword");

-- AddForeignKey
ALTER TABLE "article_feedback" ADD CONSTRAINT "article_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_feedback" ADD CONSTRAINT "article_feedback_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_patterns" ADD CONSTRAINT "user_patterns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
