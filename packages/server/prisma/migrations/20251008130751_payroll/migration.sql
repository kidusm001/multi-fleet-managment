-- CreateEnum
CREATE TYPE "public"."PayrollType" AS ENUM ('SALARY', 'SERVICE_FEE', 'OVERTIME', 'BONUS', 'ALLOWANCE', 'PENALTY');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CASH', 'CHECK', 'UPI');

-- AlterEnum
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'PAID';

-- AlterTable
ALTER TABLE "public"."drivers" ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "baseSalary" DECIMAL(10,2),
ADD COLUMN     "hourlyRate" DECIMAL(10,2),
ADD COLUMN     "overtimeRate" DOUBLE PRECISION DEFAULT 1.5,
ADD COLUMN     "panNumber" TEXT;

-- AlterTable
ALTER TABLE "public"."vehicles" ADD COLUMN     "serviceProviderId" TEXT;

-- CreateTable
CREATE TABLE "public"."service_providers" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT,
    "monthlyRate" DECIMAL(10,2),
    "perKmRate" DECIMAL(10,2),
    "perTripRate" DECIMAL(10,2),
    "bankAccountNumber" TEXT,
    "bankName" TEXT,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance_records" (
    "id" TEXT NOT NULL,
    "driverId" TEXT,
    "vehicleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hoursWorked" DOUBLE PRECISION,
    "tripsCompleted" INTEGER NOT NULL DEFAULT 0,
    "kmsCovered" DOUBLE PRECISION,
    "fuelCost" DECIMAL(8,2),
    "tollCost" DECIMAL(8,2),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payroll_periods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payroll_entries" (
    "id" TEXT NOT NULL,
    "payrollPeriodId" TEXT NOT NULL,
    "driverId" TEXT,
    "serviceProviderId" TEXT,
    "vehicleId" TEXT,
    "payrollType" "public"."PayrollType" NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "bonuses" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(10,2) NOT NULL,
    "daysWorked" INTEGER NOT NULL DEFAULT 0,
    "hoursWorked" DOUBLE PRECISION,
    "tripsCompleted" INTEGER NOT NULL DEFAULT 0,
    "kmsCovered" DOUBLE PRECISION,
    "paymentMethod" "public"."PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_providers_organizationId_idx" ON "public"."service_providers"("organizationId");

-- CreateIndex
CREATE INDEX "service_providers_isActive_idx" ON "public"."service_providers"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "service_providers_organizationId_email_key" ON "public"."service_providers"("organizationId", "email");

-- CreateIndex
CREATE INDEX "attendance_records_organizationId_idx" ON "public"."attendance_records"("organizationId");

-- CreateIndex
CREATE INDEX "attendance_records_driverId_idx" ON "public"."attendance_records"("driverId");

-- CreateIndex
CREATE INDEX "attendance_records_vehicleId_idx" ON "public"."attendance_records"("vehicleId");

-- CreateIndex
CREATE INDEX "attendance_records_date_idx" ON "public"."attendance_records"("date");

-- CreateIndex
CREATE INDEX "payroll_periods_organizationId_idx" ON "public"."payroll_periods"("organizationId");

-- CreateIndex
CREATE INDEX "payroll_periods_startDate_endDate_idx" ON "public"."payroll_periods"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "payroll_entries_organizationId_idx" ON "public"."payroll_entries"("organizationId");

-- CreateIndex
CREATE INDEX "payroll_entries_payrollPeriodId_idx" ON "public"."payroll_entries"("payrollPeriodId");

-- CreateIndex
CREATE INDEX "payroll_entries_driverId_idx" ON "public"."payroll_entries"("driverId");

-- CreateIndex
CREATE INDEX "payroll_entries_serviceProviderId_idx" ON "public"."payroll_entries"("serviceProviderId");

-- CreateIndex
CREATE INDEX "payroll_entries_payrollType_idx" ON "public"."payroll_entries"("payrollType");

-- CreateIndex
CREATE INDEX "vehicles_serviceProviderId_idx" ON "public"."vehicles"("serviceProviderId");

-- AddForeignKey
ALTER TABLE "public"."service_providers" ADD CONSTRAINT "service_providers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "public"."service_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_periods" ADD CONSTRAINT "payroll_periods_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_entries" ADD CONSTRAINT "payroll_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_entries" ADD CONSTRAINT "payroll_entries_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "public"."payroll_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_entries" ADD CONSTRAINT "payroll_entries_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_entries" ADD CONSTRAINT "payroll_entries_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "public"."service_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_entries" ADD CONSTRAINT "payroll_entries_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
