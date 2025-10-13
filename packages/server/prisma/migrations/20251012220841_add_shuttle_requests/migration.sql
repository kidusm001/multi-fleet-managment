/*
  Warnings:

  - The values [UPI] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `panNumber` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `gstNumber` on the `service_providers` table. All the data in the column will be lost.
  - You are about to drop the column `panNumber` on the `service_providers` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."PaymentMethod_new" AS ENUM ('BANK_TRANSFER', 'CASH', 'CHECK');
ALTER TABLE "public"."payroll_entries" ALTER COLUMN "paymentMethod" DROP DEFAULT;
ALTER TABLE "public"."payroll_entries" ALTER COLUMN "paymentMethod" TYPE "public"."PaymentMethod_new" USING ("paymentMethod"::text::"public"."PaymentMethod_new");
ALTER TYPE "public"."PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "public"."PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
ALTER TABLE "public"."payroll_entries" ALTER COLUMN "paymentMethod" SET DEFAULT 'BANK_TRANSFER';
COMMIT;

-- AlterTable
ALTER TABLE "public"."drivers" DROP COLUMN "panNumber";

-- AlterTable
ALTER TABLE "public"."service_providers" DROP COLUMN "gstNumber",
DROP COLUMN "panNumber";

-- CreateTable
CREATE TABLE "public"."shuttle_requests" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shiftId" TEXT NOT NULL,
    "pickupLocation" TEXT NOT NULL,
    "notes" TEXT,
    "status" "public"."RequestStatus" NOT NULL DEFAULT 'PENDING',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shuttle_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shuttle_requests_employeeId_idx" ON "public"."shuttle_requests"("employeeId");

-- CreateIndex
CREATE INDEX "shuttle_requests_organizationId_idx" ON "public"."shuttle_requests"("organizationId");

-- CreateIndex
CREATE INDEX "shuttle_requests_status_idx" ON "public"."shuttle_requests"("status");

-- AddForeignKey
ALTER TABLE "public"."shuttle_requests" ADD CONSTRAINT "shuttle_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shuttle_requests" ADD CONSTRAINT "shuttle_requests_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "public"."shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shuttle_requests" ADD CONSTRAINT "shuttle_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
