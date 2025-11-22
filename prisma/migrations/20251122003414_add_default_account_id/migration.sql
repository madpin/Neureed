-- AlterTable
ALTER TABLE "accounts" ALTER COLUMN "id" SET DEFAULT ('acc_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20));

