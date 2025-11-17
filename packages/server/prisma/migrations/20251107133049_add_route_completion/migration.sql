-- CreateTable
CREATE TABLE "public"."route_completions" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "organizationId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "route_completions_organizationId_idx" ON "public"."route_completions"("organizationId");

-- CreateIndex
CREATE INDEX "route_completions_routeId_idx" ON "public"."route_completions"("routeId");

-- CreateIndex
CREATE INDEX "route_completions_driverId_idx" ON "public"."route_completions"("driverId");

-- CreateIndex
CREATE INDEX "route_completions_completedAt_idx" ON "public"."route_completions"("completedAt");

-- AddForeignKey
ALTER TABLE "public"."route_completions" ADD CONSTRAINT "route_completions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."route_completions" ADD CONSTRAINT "route_completions_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."route_completions" ADD CONSTRAINT "route_completions_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
