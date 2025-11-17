-- AlterTable
ALTER TABLE "public"."routes" ADD COLUMN     "locationId" TEXT;

-- CreateIndex
CREATE INDEX "routes_locationId_idx" ON "public"."routes"("locationId");

-- AddForeignKey
ALTER TABLE "public"."routes" ADD CONSTRAINT "routes_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
