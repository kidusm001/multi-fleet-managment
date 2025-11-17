-- Add a source location reference to routes
ALTER TABLE "routes" ADD COLUMN "sourceId" TEXT;

-- Default existing routes to use their current location as the source where possible
UPDATE "routes"
SET "sourceId" = "locationId"
WHERE "sourceId" IS NULL AND "locationId" IS NOT NULL;

-- Index for faster lookups by source
CREATE INDEX "routes_sourceId_idx" ON "routes" ("sourceId");

-- Maintain referential integrity with locations
ALTER TABLE "routes"
ADD CONSTRAINT "routes_sourceId_fkey"
FOREIGN KEY ("sourceId") REFERENCES "locations" ("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
