/*
  Warnings:

  - A unique constraint covering the columns `[driverId]` on the table `vehicles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "vehicles_driverId_key" ON "public"."vehicles"("driverId");
