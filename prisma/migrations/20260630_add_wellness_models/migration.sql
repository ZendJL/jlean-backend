-- AddColumn caffeineMg and alcoholG to foods
ALTER TABLE "foods" ADD COLUMN IF NOT EXISTS "caffeineMg" DOUBLE PRECISION;
ALTER TABLE "foods" ADD COLUMN IF NOT EXISTS "alcoholG" DOUBLE PRECISION;
ALTER TABLE "foods" ADD COLUMN IF NOT EXISTS "qualityStatus" TEXT NOT NULL DEFAULT 'COMPLETE';

-- Rename OPEN_FOOD_FACTS -> OFF in FoodSource enum (handled via Prisma migrate)
-- snapshot columns on food_log_items
ALTER TABLE "food_log_items" ADD COLUMN IF NOT EXISTS "snapshotName"     TEXT;
ALTER TABLE "food_log_items" ADD COLUMN IF NOT EXISTS "snapshotCalories" DOUBLE PRECISION;
ALTER TABLE "food_log_items" ADD COLUMN IF NOT EXISTS "snapshotProtein"  DOUBLE PRECISION;
ALTER TABLE "food_log_items" ADD COLUMN IF NOT EXISTS "snapshotCarbs"    DOUBLE PRECISION;
ALTER TABLE "food_log_items" ADD COLUMN IF NOT EXISTS "snapshotFat"      DOUBLE PRECISION;

-- Supplements
CREATE TABLE IF NOT EXISTS "supplements" (
  "id"                TEXT NOT NULL PRIMARY KEY,
  "userId"            TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name"              TEXT NOT NULL,
  "doseAmount"        DOUBLE PRECISION NOT NULL,
  "doseUnit"          TEXT NOT NULL,
  "frequency"         TEXT,
  "timing"            TEXT,
  "notes"             TEXT,
  "caffeinePerDoseMg" DOUBLE PRECISION,
  "active"            BOOLEAN NOT NULL DEFAULT true,
  "createdAt"         TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "supplement_logs" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "userId"       TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "supplementId" TEXT NOT NULL REFERENCES "supplements"("id") ON DELETE CASCADE,
  "takenAt"      TIMESTAMP NOT NULL DEFAULT NOW(),
  "notes"        TEXT
);

-- Sleep
CREATE TABLE IF NOT EXISTS "sleep_entries" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "userId"       TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "bedtime"      TIMESTAMP NOT NULL,
  "wakeTime"     TIMESTAMP NOT NULL,
  "durationMin"  INTEGER NOT NULL,
  "qualityScore" DOUBLE PRECISION,
  "deepSleepMin" INTEGER,
  "remSleepMin"  INTEGER,
  "awakensCount" INTEGER,
  "createdAt"    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Fasting
CREATE TABLE IF NOT EXISTS "fasting_configs" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "userId"       TEXT NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "fastHours"    INTEGER NOT NULL,
  "eatHours"     INTEGER NOT NULL,
  "eatStartHour" INTEGER NOT NULL,
  "active"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMP NOT NULL DEFAULT NOW()
);
