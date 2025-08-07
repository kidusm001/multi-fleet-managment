/*
  Warnings:

  - A unique constraint covering the columns `[vehicleId,shiftId,date]` on the table `vehicle_availability` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `totalPayment` to the `payroll_reports` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."RouteStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "public"."VehicleStatus" ADD VALUE 'INACTIVE';

-- DropForeignKey
ALTER TABLE "public"."payroll_reports" DROP CONSTRAINT "payroll_reports_driverId_fkey";

-- DropForeignKey
ALTER TABLE "public"."stops" DROP CONSTRAINT "stops_routeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."vehicle_availability" DROP CONSTRAINT "vehicle_availability_routeId_fkey";

-- AlterTable
ALTER TABLE "public"."drivers" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "rating" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."notifications" ADD COLUMN     "fromRole" TEXT,
ADD COLUMN     "importance" TEXT NOT NULL DEFAULT 'Medium',
ADD COLUMN     "localTime" TEXT,
ADD COLUMN     "relatedEntityId" TEXT,
ADD COLUMN     "toRoles" TEXT[];

-- AlterTable
ALTER TABLE "public"."payroll_reports" ADD COLUMN     "dailyRate" DECIMAL(10,2),
ADD COLUMN     "efficiency" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "insuranceCost" DECIMAL(10,2),
ADD COLUMN     "maintenanceCost" DECIMAL(10,2),
ADD COLUMN     "month" TEXT,
ADD COLUMN     "otherExpenses" DECIMAL(10,2),
ADD COLUMN     "payDate" TIMESTAMP(3),
ADD COLUMN     "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "totalPayment" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "utilizationRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vehicleId" TEXT,
ADD COLUMN     "workedDays" INTEGER,
ADD COLUMN     "year" INTEGER,
ALTER COLUMN "totalAmount" DROP NOT NULL,
ALTER COLUMN "driverId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."routes" ADD COLUMN     "date" TIMESTAMP(3),
ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "shiftId" TEXT,
ADD COLUMN     "startTime" TIMESTAMP(3),
ADD COLUMN     "status" "public"."RouteStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "totalDistance" DOUBLE PRECISION,
ADD COLUMN     "totalTime" DOUBLE PRECISION,
ADD COLUMN     "vehicleId" TEXT;

-- AlterTable
ALTER TABLE "public"."stops" ADD COLUMN     "estimatedArrivalTime" TIMESTAMP(3),
ADD COLUMN     "sequence" INTEGER DEFAULT 0,
ALTER COLUMN "order" SET DEFAULT 0,
ALTER COLUMN "routeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "name" TEXT,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'MANAGER';

-- AlterTable
ALTER TABLE "public"."vehicle_availability" ADD COLUMN     "available" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shiftId" TEXT,
ALTER COLUMN "routeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."vehicles" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "dailyRate" DECIMAL(10,2),
ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "driverId" TEXT,
ADD COLUMN     "make" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "nextMaintenance" TIMESTAMP(3),
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'in-house',
ADD COLUMN     "vendor" TEXT;

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shifts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "timeZone" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "assigned" BOOLEAN NOT NULL DEFAULT false,
    "departmentId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "stopId" TEXT,
    "tenantId" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vehicle_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vehicle_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "categoryId" TEXT,
    "dailyRate" DOUBLE PRECISION,
    "capacity" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "vendor" TEXT,
    "status" "public"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "comment" TEXT,
    "tenantId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_NotificationSeenBy" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NotificationSeenBy_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "public"."sessions"("token");

-- CreateIndex
CREATE INDEX "departments_tenantId_idx" ON "public"."departments"("tenantId");

-- CreateIndex
CREATE INDEX "shifts_tenantId_idx" ON "public"."shifts"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_stopId_key" ON "public"."employees"("stopId");

-- CreateIndex
CREATE INDEX "employees_tenantId_idx" ON "public"."employees"("tenantId");

-- CreateIndex
CREATE INDEX "employees_departmentId_idx" ON "public"."employees"("departmentId");

-- CreateIndex
CREATE INDEX "employees_shiftId_idx" ON "public"."employees"("shiftId");

-- CreateIndex
CREATE INDEX "vehicle_categories_tenantId_idx" ON "public"."vehicle_categories"("tenantId");

-- CreateIndex
CREATE INDEX "vehicle_requests_tenantId_idx" ON "public"."vehicle_requests"("tenantId");

-- CreateIndex
CREATE INDEX "vehicle_requests_categoryId_idx" ON "public"."vehicle_requests"("categoryId");

-- CreateIndex
CREATE INDEX "_NotificationSeenBy_B_index" ON "public"."_NotificationSeenBy"("B");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "public"."notifications"("createdAt");

-- CreateIndex
CREATE INDEX "payroll_reports_vehicleId_idx" ON "public"."payroll_reports"("vehicleId");

-- CreateIndex
CREATE INDEX "routes_vehicleId_idx" ON "public"."routes"("vehicleId");

-- CreateIndex
CREATE INDEX "routes_shiftId_idx" ON "public"."routes"("shiftId");

-- CreateIndex
CREATE INDEX "vehicle_availability_shiftId_idx" ON "public"."vehicle_availability"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_availability_vehicleId_shiftId_date_key" ON "public"."vehicle_availability"("vehicleId", "shiftId", "date");

-- CreateIndex
CREATE INDEX "vehicles_categoryId_idx" ON "public"."vehicles"("categoryId");

-- CreateIndex
CREATE INDEX "vehicles_driverId_idx" ON "public"."vehicles"("driverId");

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."departments" ADD CONSTRAINT "departments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shifts" ADD CONSTRAINT "shifts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "public"."shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "public"."stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_categories" ADD CONSTRAINT "vehicle_categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."vehicle_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."routes" ADD CONSTRAINT "routes_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."routes" ADD CONSTRAINT "routes_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "public"."shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stops" ADD CONSTRAINT "stops_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "public"."routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_availability" ADD CONSTRAINT "vehicle_availability_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "public"."routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_availability" ADD CONSTRAINT "vehicle_availability_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "public"."shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_reports" ADD CONSTRAINT "payroll_reports_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_reports" ADD CONSTRAINT "payroll_reports_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_requests" ADD CONSTRAINT "vehicle_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_requests" ADD CONSTRAINT "vehicle_requests_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."vehicle_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_NotificationSeenBy" ADD CONSTRAINT "_NotificationSeenBy_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_NotificationSeenBy" ADD CONSTRAINT "_NotificationSeenBy_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
