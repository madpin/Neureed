-- CreateTable
CREATE TABLE "saved_searches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "icon" TEXT DEFAULT '🔍',
    "threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "categoryId" TEXT,
    "notifyOnMatch" BOOLEAN NOT NULL DEFAULT false,
    "notifyThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    "dailyDigest" BOOLEAN NOT NULL DEFAULT false,
    "recencyBias" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "prioritySources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMatchedAt" TIMESTAMP(3),
    "totalMatches" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_search_matches" (
    "id" TEXT NOT NULL,
    "savedSearchId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL,
    "matchedTerms" JSONB NOT NULL,
    "matchReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "saved_search_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_searches_userId_idx" ON "saved_searches"("userId");

-- CreateIndex
CREATE INDEX "saved_searches_userId_archived_idx" ON "saved_searches"("userId", "archived");

-- CreateIndex
CREATE INDEX "saved_search_matches_savedSearchId_relevanceScore_idx" ON "saved_search_matches"("savedSearchId", "relevanceScore");

-- CreateIndex
CREATE INDEX "saved_search_matches_articleId_idx" ON "saved_search_matches"("articleId");

-- CreateIndex
CREATE INDEX "saved_search_matches_createdAt_idx" ON "saved_search_matches"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "saved_search_matches_savedSearchId_articleId_key" ON "saved_search_matches"("savedSearchId", "articleId");

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "user_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_search_matches" ADD CONSTRAINT "saved_search_matches_savedSearchId_fkey" FOREIGN KEY ("savedSearchId") REFERENCES "saved_searches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_search_matches" ADD CONSTRAINT "saved_search_matches_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
