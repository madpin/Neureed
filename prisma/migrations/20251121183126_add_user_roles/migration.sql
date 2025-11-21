-- CreateEnum
DO $$ BEGIN
 CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'GUEST');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'USER';

-- Set madpin@gmail.com as ADMIN
UPDATE "users" SET "role" = 'ADMIN' WHERE "email" = 'madpin@gmail.com';

