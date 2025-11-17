/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,email]` on the table `drivers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,licenseNumber]` on the table `drivers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,phoneNumber]` on the table `drivers` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."drivers_email_key";

-- DropIndex
DROP INDEX "public"."drivers_licenseNumber_key";

-- DropIndex
DROP INDEX "public"."drivers_phoneNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "drivers_organizationId_email_key" ON "public"."drivers"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_organizationId_licenseNumber_key" ON "public"."drivers"("organizationId", "licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_organizationId_phoneNumber_key" ON "public"."drivers"("organizationId", "phoneNumber");
