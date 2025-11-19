-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "keyPoints" JSONB,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "topics" TEXT[];

-- CreateTable
CREATE TABLE "user_themes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "css" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isPreset" BOOLEAN NOT NULL DEFAULT false,
    "previewUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_themes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_themes_userId_idx" ON "user_themes"("userId");

-- CreateIndex
CREATE INDEX "user_themes_userId_isActive_idx" ON "user_themes"("userId", "isActive");

-- CreateIndex
CREATE INDEX "user_themes_isPublic_idx" ON "user_themes"("isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "user_themes_userId_name_key" ON "user_themes"("userId", "name");

-- AddForeignKey
ALTER TABLE "user_themes" ADD CONSTRAINT "user_themes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
