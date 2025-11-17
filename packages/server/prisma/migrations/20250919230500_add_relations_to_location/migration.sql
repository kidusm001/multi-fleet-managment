-- AlterTable
ALTER TABLE "public"."employees" ADD COLUMN     "locationId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
