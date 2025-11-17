/*
  Warnings:

  - You are about to drop the column `phone` on the `drivers` table. All the data in the column will be lost.
  - The `status` column on the `drivers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `importance` column on the `notifications` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `type` column on the `vehicles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[email]` on the table `drivers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phoneNumber]` on the table `drivers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."DriverStatus" AS ENUM ('ACTIVE', 'OFF_DUTY', 'ON_BREAK', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."VehicleType" AS ENUM ('IN_HOUSE', 'OUTSOURCED');

-- CreateEnum
CREATE TYPE "public"."ImportanceLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "public"."drivers" DROP COLUMN "phone",
DROP COLUMN "status",
ADD COLUMN     "status" "public"."DriverStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "public"."employees" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."notifications" DROP COLUMN "importance",
ADD COLUMN     "importance" "public"."ImportanceLevel" NOT NULL DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "isSubscribed" BOOLEAN;

-- AlterTable
ALTER TABLE "public"."vehicles" DROP COLUMN "type",
ADD COLUMN     "type" "public"."VehicleType" NOT NULL DEFAULT 'IN_HOUSE';

-- CreateIndex
CREATE UNIQUE INDEX "drivers_email_key" ON "public"."drivers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_phoneNumber_key" ON "public"."drivers"("phoneNumber");

-- CreateIndex
CREATE INDEX "drivers_status_idx" ON "public"."drivers"("status");

-- CreateIndex
CREATE INDEX "drivers_isActive_idx" ON "public"."drivers"("isActive");

-- CreateIndex
CREATE INDEX "drivers_deleted_deletedAt_idx" ON "public"."drivers"("deleted", "deletedAt");

-- CreateIndex
CREATE INDEX "employees_assigned_idx" ON "public"."employees"("assigned");

-- CreateIndex
CREATE INDEX "employees_deleted_deletedAt_idx" ON "public"."employees"("deleted", "deletedAt");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "public"."vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicles_type_idx" ON "public"."vehicles"("type");

-- CreateIndex
CREATE INDEX "vehicles_isActive_idx" ON "public"."vehicles"("isActive");

-- CreateIndex
CREATE INDEX "vehicles_deleted_deletedAt_idx" ON "public"."vehicles"("deleted", "deletedAt");

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
