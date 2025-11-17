-- CreateEnum
CREATE TYPE "public"."LocationType" AS ENUM ('BRANCH', 'HQ');

-- CreateTable
CREATE TABLE "public"."locations" (
    "id" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "type" "public"."LocationType" NOT NULL DEFAULT 'BRANCH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."locations" ADD CONSTRAINT "locations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
