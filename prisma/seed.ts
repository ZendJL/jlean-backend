/**
 * Seed de presets básicos — Paso 4.1
 * Ejecutar: npx ts-node prisma/seed.ts
 *
 * Presets cubiertos: proteínas animales, granos, lácteos, frutas/verduras,
 * suplementos deportivos. Macros por 100g salvo indicación.
 * Fuente de referencia: USDA FoodData Central.
 */
import 'dotenv/config';
import { PrismaClient, FoodSource, DataQuality } from '@prisma/client';

// Prisma v7 requiere datasourceUrl explícito fuera del contexto DI de NestJS
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

const PRESETS: Array<{
  name: string;
  brand?: string;
  servingSizeG: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  caffeineMg?: number;
}> = [
  // ─── Proteínas animales ──────────────────────────────────────────────────
  {
    name: 'Chicken Breast (cooked, no skin)',
    servingSizeG: 100, servingUnit: 'g',
    calories: 165, protein: 31, carbs: 0, fat: 3.6,
    sodium: 74, saturatedFat: 1.0,
  },
  {
    name: 'Ground Beef 90% Lean (cooked)',
    servingSizeG: 100, servingUnit: 'g',
    calories: 218, protein: 26.1, carbs: 0, fat: 12.7,
    sodium: 79, saturatedFat: 5.0,
  },
  {
    name: 'Salmon (Atlantic, cooked)',
    servingSizeG: 100, servingUnit: 'g',
    calories: 208, protein: 20.4, carbs: 0, fat: 13.4,
    sodium: 59, saturatedFat: 3.1,
  },
  {
    name: 'Tuna (canned in water, drained)',
    servingSizeG: 100, servingUnit: 'g',
    calories: 116, protein: 25.5, carbs: 0, fat: 0.8,
    sodium: 320, saturatedFat: 0.2,
  },
  {
    name: 'Egg (whole, large)',
    servingSizeG: 50, servingUnit: 'unit',
    calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8,
    sodium: 71, saturatedFat: 1.6,
  },
  {
    name: 'Egg White (large)',
    servingSizeG: 33, servingUnit: 'unit',
    calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1,
    sodium: 55,
  },
  {
    name: 'Turkey Breast (cooked, no skin)',
    servingSizeG: 100, servingUnit: 'g',
    calories: 189, protein: 28.7, carbs: 0, fat: 7.4,
    sodium: 77, saturatedFat: 2.0,
  },

  // ─── Lácteos ─────────────────────────────────────────────────────────────
  {
    name: 'Greek Yogurt (plain, non-fat)',
    servingSizeG: 100, servingUnit: 'g',
    calories: 59, protein: 10.2, carbs: 3.6, fat: 0.4,
    sugar: 3.2, sodium: 36, saturatedFat: 0.1,
  },
  {
    name: 'Cottage Cheese (low-fat 2%)',
    servingSizeG: 100, servingUnit: 'g',
    calories: 84, protein: 11.1, carbs: 3.4, fat: 2.3,
    sugar: 2.7, sodium: 321, saturatedFat: 1.4,
  },
  {
    name: 'Whole Milk (3.25%)',
    servingSizeG: 244, servingUnit: 'cup',
    calories: 149, protein: 8.0, carbs: 11.7, fat: 8.0,
    sugar: 12.3, sodium: 105, saturatedFat: 4.6,
  },
  {
    name: 'Cheddar Cheese',
    servingSizeG: 28, servingUnit: 'oz',
    calories: 113, protein: 7.0, carbs: 0.4, fat: 9.3,
    sodium: 174, saturatedFat: 5.3,
  },

  // ─── Granos y carbohidratos ──────────────────────────────────────────────
  {
    name: 'White Rice (cooked)',
    servingSizeG: 100, servingUnit: 'g',
    calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3,
    fiber: 0.4, sodium: 1,
  },
  {
    name: 'Brown Rice (cooked)',
    servingSizeG: 100, servingUnit: 'g',
    calories: 123, protein: 2.7, carbs: 25.6, fat: 1.0,
    fiber: 1.8, sodium: 3,
  },
  {
    name: 'Oatmeal (rolled oats, dry)',
    servingSizeG: 40, servingUnit: 'serving',
    calories: 150, protein: 5.0, carbs: 27.0, fat: 3.0,
    fiber: 4.0, sugar: 1.0, sodium: 0,
  },
  {
    name: 'Whole Wheat Bread',
    servingSizeG: 28, servingUnit: 'slice',
    calories: 69, protein: 3.6, carbs: 12.1, fat: 1.1,
    fiber: 1.9, sugar: 1.4, sodium: 132,
  },
  {
    name: 'Sweet Potato (cooked, baked)',
    servingSizeG: 100, servingUnit: 'g',
    calories: 90, protein: 2.0, carbs: 20.7, fat: 0.1,
    fiber: 3.3, sugar: 4.2, sodium: 36,
  },
  {
    name: 'Quinoa (cooked)',
    servingSizeG: 100, servingUnit: 'g',
    calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9,
    fiber: 2.8, sodium: 7,
  },
  {
    name: 'Pasta (cooked, enriched)',
    servingSizeG: 100, servingUnit: 'g',
    calories: 158, protein: 5.8, carbs: 30.9, fat: 0.9,
    fiber: 1.8, sodium: 1,
  },

  // ─── Grasas saludables ───────────────────────────────────────────────────
  {
    name: 'Avocado',
    servingSizeG: 100, servingUnit: 'g',
    calories: 160, protein: 2.0, carbs: 8.5, fat: 14.7,
    fiber: 6.7, sugar: 0.7, sodium: 7, saturatedFat: 2.1,
  },
  {
    name: 'Olive Oil (extra virgin)',
    servingSizeG: 13.5, servingUnit: 'tbsp',
    calories: 119, protein: 0, carbs: 0, fat: 13.5,
    saturatedFat: 1.9,
  },
  {
    name: 'Almond Butter',
    servingSizeG: 32, servingUnit: 'tbsp',
    calories: 190, protein: 7.0, carbs: 6.0, fat: 17.0,
    fiber: 3.5, sugar: 1.5, sodium: 0, saturatedFat: 1.5,
  },
  {
    name: 'Almonds (raw)',
    servingSizeG: 28, servingUnit: 'oz',
    calories: 164, protein: 6.0, carbs: 6.1, fat: 14.2,
    fiber: 3.5, sugar: 1.2, sodium: 0, saturatedFat: 1.1,
  },

  // ─── Frutas y verduras ───────────────────────────────────────────────────
  {
    name: 'Banana',
    servingSizeG: 118, servingUnit: 'unit',
    calories: 105, protein: 1.3, carbs: 27.0, fat: 0.4,
    fiber: 3.1, sugar: 14.4, sodium: 1,
  },
  {
    name: 'Apple (with skin)',
    servingSizeG: 182, servingUnit: 'unit',
    calories: 95, protein: 0.5, carbs: 25.1, fat: 0.3,
    fiber: 4.4, sugar: 18.9, sodium: 2,
  },
  {
    name: 'Blueberries',
    servingSizeG: 100, servingUnit: 'g',
    calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3,
    fiber: 2.4, sugar: 10.0, sodium: 1,
  },
  {
    name: 'Broccoli (raw)',
    servingSizeG: 100, servingUnit: 'g',
    calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4,
    fiber: 2.6, sugar: 1.7, sodium: 33,
  },
  {
    name: 'Spinach (raw)',
    servingSizeG: 100, servingUnit: 'g',
    calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4,
    fiber: 2.2, sodium: 79,
  },

  // ─── Suplementos deportivos ──────────────────────────────────────────────
  {
    name: 'Whey Protein Powder (vanilla, generic)',
    servingSizeG: 30, servingUnit: 'scoop',
    calories: 120, protein: 24, carbs: 3, fat: 1.5,
    sugar: 2.0, sodium: 150, saturatedFat: 0.5,
  },
  {
    name: 'Casein Protein Powder (chocolate, generic)',
    servingSizeG: 34, servingUnit: 'scoop',
    calories: 130, protein: 25, carbs: 7, fat: 1.5,
    fiber: 1.0, sugar: 3.0, sodium: 200, saturatedFat: 0.5,
  },
  {
    name: 'Creatine Monohydrate',
    servingSizeG: 5, servingUnit: 'scoop',
    calories: 0, protein: 0, carbs: 0, fat: 0,
    sodium: 0,
  },
  {
    name: 'Coffee (brewed, black)',
    servingSizeG: 240, servingUnit: 'cup',
    calories: 2, protein: 0.3, carbs: 0, fat: 0,
    sodium: 5, caffeineMg: 95,
  },
  {
    name: 'Pre-workout (generic, 1 scoop)',
    servingSizeG: 10, servingUnit: 'scoop',
    calories: 10, protein: 0, carbs: 2, fat: 0,
    sodium: 150, caffeineMg: 200,
  },
  {
    name: 'Protein Bar (generic, chocolate)',
    servingSizeG: 60, servingUnit: 'bar',
    calories: 220, protein: 20, carbs: 22, fat: 7,
    fiber: 5.0, sugar: 8.0, sodium: 200, saturatedFat: 2.0,
  },
];

async function main() {
  console.log('🌱 Seeding presets...');
  let created = 0;
  let skipped = 0;

  for (const preset of PRESETS) {
    const existing = await prisma.food.findFirst({
      where: { name: preset.name, source: FoodSource.PRESET },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.food.create({
      data: {
        ...preset,
        source:        FoodSource.PRESET,
        qualityStatus: DataQuality.COMPLETE,
      },
    });
    created++;
  }

  console.log(`✅ Seed completo: ${created} presets creados, ${skipped} ya existían.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
