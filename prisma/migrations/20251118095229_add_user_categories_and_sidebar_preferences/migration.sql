-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "categoryStates" JSONB,
ADD COLUMN     "sidebarCollapsed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "user_categories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_feed_categories" (
    "id" TEXT NOT NULL,
    "userFeedId" TEXT NOT NULL,
    "userCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_feed_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_categories_userId_idx" ON "user_categories"("userId");

-- CreateIndex
CREATE INDEX "user_categories_userId_order_idx" ON "user_categories"("userId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "user_categories_userId_name_key" ON "user_categories"("userId", "name");

-- CreateIndex
CREATE INDEX "user_feed_categories_userFeedId_idx" ON "user_feed_categories"("userFeedId");

-- CreateIndex
CREATE INDEX "user_feed_categories_userCategoryId_idx" ON "user_feed_categories"("userCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "user_feed_categories_userFeedId_userCategoryId_key" ON "user_feed_categories"("userFeedId", "userCategoryId");

-- AddForeignKey
ALTER TABLE "user_categories" ADD CONSTRAINT "user_categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_feed_categories" ADD CONSTRAINT "user_feed_categories_userFeedId_fkey" FOREIGN KEY ("userFeedId") REFERENCES "user_feeds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_feed_categories" ADD CONSTRAINT "user_feed_categories_userCategoryId_fkey" FOREIGN KEY ("userCategoryId") REFERENCES "user_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
