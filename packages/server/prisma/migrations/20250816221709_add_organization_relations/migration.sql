/*
  Warnings:

  - You are about to drop the column `tenantId` on the `departments` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `payroll_reports` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `routes` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `shifts` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `stops` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `vehicle_availability` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `vehicle_categories` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `vehicle_requests` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the `_NotificationSeenBy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `memberships` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organizations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tenants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `verifications` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `organizationId` to the `departments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `drivers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `payroll_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `routes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `shifts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `stops` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `vehicle_availability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `vehicle_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `vehicle_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `vehicles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'SUPERADMIN';

-- DropForeignKey
ALTER TABLE "public"."_NotificationSeenBy" DROP CONSTRAINT "_NotificationSeenBy_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_NotificationSeenBy" DROP CONSTRAINT "_NotificationSeenBy_B_fkey";

-- DropForeignKey
ALTER TABLE "public"."accounts" DROP CONSTRAINT "accounts_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."departments" DROP CONSTRAINT "departments_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."drivers" DROP CONSTRAINT "drivers_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."employees" DROP CONSTRAINT "employees_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."memberships" DROP CONSTRAINT "memberships_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."memberships" DROP CONSTRAINT "memberships_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."notifications" DROP CONSTRAINT "notifications_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payroll_reports" DROP CONSTRAINT "payroll_reports_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."routes" DROP CONSTRAINT "routes_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sessions" DROP CONSTRAINT "sessions_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."shifts" DROP CONSTRAINT "shifts_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."stops" DROP CONSTRAINT "stops_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."vehicle_availability" DROP CONSTRAINT "vehicle_availability_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."vehicle_categories" DROP CONSTRAINT "vehicle_categories_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."vehicle_requests" DROP CONSTRAINT "vehicle_requests_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."vehicles" DROP CONSTRAINT "vehicles_tenantId_fkey";

-- DropIndex
DROP INDEX "public"."departments_tenantId_idx";

-- DropIndex
DROP INDEX "public"."drivers_tenantId_idx";

-- DropIndex
DROP INDEX "public"."employees_tenantId_idx";

-- DropIndex
DROP INDEX "public"."notifications_tenantId_idx";

-- DropIndex
DROP INDEX "public"."payroll_reports_tenantId_idx";

-- DropIndex
DROP INDEX "public"."routes_tenantId_idx";

-- DropIndex
DROP INDEX "public"."shifts_tenantId_idx";

-- DropIndex
DROP INDEX "public"."stops_tenantId_idx";

-- DropIndex
DROP INDEX "public"."vehicle_availability_tenantId_idx";

-- DropIndex
DROP INDEX "public"."vehicle_categories_tenantId_idx";

-- DropIndex
DROP INDEX "public"."vehicle_requests_tenantId_idx";

-- DropIndex
DROP INDEX "public"."vehicles_tenantId_idx";

-- AlterTable
ALTER TABLE "public"."departments" DROP COLUMN "tenantId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."drivers" DROP COLUMN "tenantId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."employees" DROP COLUMN "tenantId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."notifications" DROP COLUMN "tenantId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."payroll_reports" DROP COLUMN "tenantId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."routes" DROP COLUMN "tenantId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."shifts" DROP COLUMN "tenantId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."stops" DROP COLUMN "tenantId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."vehicle_availability" DROP COLUMN "tenantId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."vehicle_categories" DROP COLUMN "tenantId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."vehicle_requests" DROP COLUMN "tenantId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."vehicles" DROP COLUMN "tenantId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."_NotificationSeenBy";

-- DropTable
DROP TABLE "public"."accounts";

-- DropTable
DROP TABLE "public"."memberships";

-- DropTable
DROP TABLE "public"."organizations";

-- DropTable
DROP TABLE "public"."sessions";

-- DropTable
DROP TABLE "public"."tenants";

-- DropTable
DROP TABLE "public"."users";

-- DropTable
DROP TABLE "public"."verifications";

-- CreateTable
CREATE TABLE "public"."user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT,
    "banned" BOOLEAN,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,
    "activeOrganizationId" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "inviterId" TEXT NOT NULL,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "public"."session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "public"."organization"("slug");

-- CreateIndex
CREATE INDEX "departments_organizationId_idx" ON "public"."departments"("organizationId");

-- CreateIndex
CREATE INDEX "drivers_organizationId_idx" ON "public"."drivers"("organizationId");

-- CreateIndex
CREATE INDEX "employees_organizationId_idx" ON "public"."employees"("organizationId");

-- CreateIndex
CREATE INDEX "notifications_organizationId_idx" ON "public"."notifications"("organizationId");

-- CreateIndex
CREATE INDEX "payroll_reports_organizationId_idx" ON "public"."payroll_reports"("organizationId");

-- CreateIndex
CREATE INDEX "routes_organizationId_idx" ON "public"."routes"("organizationId");

-- CreateIndex
CREATE INDEX "shifts_organizationId_idx" ON "public"."shifts"("organizationId");

-- CreateIndex
CREATE INDEX "stops_organizationId_idx" ON "public"."stops"("organizationId");

-- CreateIndex
CREATE INDEX "vehicle_availability_organizationId_idx" ON "public"."vehicle_availability"("organizationId");

-- CreateIndex
CREATE INDEX "vehicle_categories_organizationId_idx" ON "public"."vehicle_categories"("organizationId");

-- CreateIndex
CREATE INDEX "vehicle_requests_organizationId_idx" ON "public"."vehicle_requests"("organizationId");

-- CreateIndex
CREATE INDEX "vehicles_organizationId_idx" ON "public"."vehicles"("organizationId");

-- AddForeignKey
ALTER TABLE "public"."departments" ADD CONSTRAINT "departments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shifts" ADD CONSTRAINT "shifts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."drivers" ADD CONSTRAINT "drivers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_categories" ADD CONSTRAINT "vehicle_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."routes" ADD CONSTRAINT "routes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stops" ADD CONSTRAINT "stops_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_availability" ADD CONSTRAINT "vehicle_availability_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_reports" ADD CONSTRAINT "payroll_reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_requests" ADD CONSTRAINT "vehicle_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
