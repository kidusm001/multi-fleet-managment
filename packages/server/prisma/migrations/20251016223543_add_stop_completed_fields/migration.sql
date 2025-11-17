-- AlterTable
ALTER TABLE "public"."stops" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT;
