/*
  Warnings:

  - The values [OPEN_FOOD_FACTS] on the enum `FoodSource` will be removed. If these variants are still used in the database, this will fail.
  - The `qualityStatus` column on the `foods` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DataQuality" AS ENUM ('COMPLETE', 'PARTIAL', 'UNVERIFIED', 'CONFLICTED');

-- AlterEnum
BEGIN;
CREATE TYPE "FoodSource_new" AS ENUM ('CUSTOM', 'PRESET', 'USDA', 'OFF');
ALTER TABLE "public"."foods" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "foods" ALTER COLUMN "source" TYPE "FoodSource_new" USING ("source"::text::"FoodSource_new");
ALTER TYPE "FoodSource" RENAME TO "FoodSource_old";
ALTER TYPE "FoodSource_new" RENAME TO "FoodSource";
DROP TYPE "public"."FoodSource_old";
ALTER TABLE "foods" ALTER COLUMN "source" SET DEFAULT 'CUSTOM';
COMMIT;

-- DropForeignKey
ALTER TABLE "fasting_configs" DROP CONSTRAINT "fasting_configs_userId_fkey";

-- DropForeignKey
ALTER TABLE "sleep_entries" DROP CONSTRAINT "sleep_entries_userId_fkey";

-- DropForeignKey
ALTER TABLE "supplement_logs" DROP CONSTRAINT "supplement_logs_supplementId_fkey";

-- DropForeignKey
ALTER TABLE "supplement_logs" DROP CONSTRAINT "supplement_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "supplements" DROP CONSTRAINT "supplements_userId_fkey";

-- AlterTable
ALTER TABLE "fasting_configs" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "foods" DROP COLUMN "qualityStatus",
ADD COLUMN     "qualityStatus" "DataQuality" NOT NULL DEFAULT 'COMPLETE';

-- AlterTable
ALTER TABLE "sleep_entries" ALTER COLUMN "bedtime" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "wakeTime" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "supplement_logs" ALTER COLUMN "takenAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "supplements" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "user_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calorieTarget" INTEGER NOT NULL,
    "proteinTarget" DOUBLE PRECISION NOT NULL,
    "carbTarget" DOUBLE PRECISION NOT NULL,
    "fatTarget" DOUBLE PRECISION NOT NULL,
    "goal" "Goal" NOT NULL,
    "activityLevel" "ActivityLevel" NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day_types" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tdeAdjustPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "color" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "day_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayTypeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "day_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plan_items" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "meal" "Meal" NOT NULL DEFAULT 'OTHER',
    "foodId" TEXT,
    "recipeId" TEXT,
    "quantityG" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_goals_userId_effectiveFrom_idx" ON "user_goals"("userId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "day_types_userId_name_key" ON "day_types"("userId", "name");

-- CreateIndex
CREATE INDEX "day_assignments_userId_date_idx" ON "day_assignments"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "day_assignments_userId_date_key" ON "day_assignments"("userId", "date");

-- CreateIndex
CREATE INDEX "weight_logs_userId_recordedAt_idx" ON "weight_logs"("userId", "recordedAt");

-- CreateIndex
CREATE INDEX "meal_plans_userId_weekStart_idx" ON "meal_plans"("userId", "weekStart");

-- CreateIndex
CREATE INDEX "meal_plan_items_planId_date_idx" ON "meal_plan_items"("planId", "date");

-- CreateIndex
CREATE INDEX "food_logs_userId_date_idx" ON "food_logs"("userId", "date");

-- CreateIndex
CREATE INDEX "foods_name_idx" ON "foods"("name");

-- CreateIndex
CREATE INDEX "foods_barcode_idx" ON "foods"("barcode");

-- AddForeignKey
ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_types" ADD CONSTRAINT "day_types_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_assignments" ADD CONSTRAINT "day_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_assignments" ADD CONSTRAINT "day_assignments_dayTypeId_fkey" FOREIGN KEY ("dayTypeId") REFERENCES "day_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplements" ADD CONSTRAINT "supplements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplement_logs" ADD CONSTRAINT "supplement_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplement_logs" ADD CONSTRAINT "supplement_logs_supplementId_fkey" FOREIGN KEY ("supplementId") REFERENCES "supplements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sleep_entries" ADD CONSTRAINT "sleep_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fasting_configs" ADD CONSTRAINT "fasting_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_planId_fkey" FOREIGN KEY ("planId") REFERENCES "meal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
