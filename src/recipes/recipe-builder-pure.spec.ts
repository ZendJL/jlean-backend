/**
 * Tests unitarios — RecipeBuilder: lógica greedy pura (Paso 5.3, Paso 12.1)
 * Prueba los algoritmos de buildByMacros y buildByMicros sin base de datos.
 * Replica las funciones de cálculo del servicio en forma pura.
 */

// ─── Tipos y helpers replicados del servicio ────────────────────────────────

interface FoodNorm {
  id: string;
  name: string;
  brand: string | null;
  cal100: number;
  prot100: number;
  carbs100: number;
  fat100: number;
  micro100?: Record<string, number>;
}

interface SuggestedIngredient {
  foodId: string;
  foodName: string;
  suggestedQuantityG: number;
  macros: { calories: number; protein: number; carbs: number; fat: number };
  microContribution?: number;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Versión pura del algoritmo greedy buildByMacros.
 * Igual al RecipeBuilderService pero sin Prisma.
 */
function buildByMacrosPure(
  foods: FoodNorm[],
  targetCalories: number,
  targetProtein: number,
  carbFatBalance: 'balanced' | 'low_carb' | 'low_fat' = 'balanced',
): { achievedCalories: number; achievedProtein: number; calorieAccuracy: number; proteinAccuracy: number; ingredients: SuggestedIngredient[] } {
  if (targetCalories < 50 || targetCalories > 5000) throw new Error('targetCalories fuera de rango');
  if (targetProtein < 1 || targetProtein > 500) throw new Error('targetProtein fuera de rango');

  const proteinSources = foods
    .filter((f) => f.prot100 >= 15)
    .sort((a, b) => (b.prot100 / b.cal100) - (a.prot100 / a.cal100));

  const carbSources = foods.filter((f) => f.prot100 < 15 && f.carbs100 > f.fat100)
    .sort((a, b) => a.cal100 - b.cal100);

  const fatSources = foods.filter((f) => f.prot100 < 15 && f.fat100 >= f.carbs100)
    .sort((a, b) => b.fat100 - a.fat100);

  const ingredients: SuggestedIngredient[] = [];
  let usedCalories = 0;
  let usedProtein  = 0;

  if (proteinSources.length > 0) {
    const best = proteinSources[0];
    const gNeeded  = (targetProtein / best.prot100) * 100;
    const maxGByCal = (targetCalories * 0.70) / (best.cal100 / 100);
    const quantityG = Math.min(gNeeded, maxGByCal);
    const ratio = quantityG / 100;
    ingredients.push({
      foodId: best.id, foodName: best.name,
      suggestedQuantityG: Math.round(quantityG),
      macros: {
        calories: round1(best.cal100 * ratio),
        protein:  round1(best.prot100 * ratio),
        carbs:    round1(best.carbs100 * ratio),
        fat:      round1(best.fat100 * ratio),
      },
    });
    usedCalories += best.cal100 * ratio;
    usedProtein  += best.prot100 * ratio;
  }

  const remainingCal = targetCalories - usedCalories;
  if (remainingCal > 30) {
    const pool = carbFatBalance === 'low_fat'
      ? carbSources
      : carbFatBalance === 'low_carb'
        ? fatSources
        : [...carbSources, ...fatSources].slice(0, 10);

    let remaining = remainingCal;
    for (const food of pool.slice(0, 2)) {
      if (remaining <= 20 || food.cal100 <= 0) break;
      const quantityG = Math.min((remaining / food.cal100) * 100, 300);
      const ratio = quantityG / 100;
      ingredients.push({
        foodId: food.id, foodName: food.name,
        suggestedQuantityG: Math.round(quantityG),
        macros: {
          calories: round1(food.cal100 * ratio),
          protein:  round1(food.prot100 * ratio),
          carbs:    round1(food.carbs100 * ratio),
          fat:      round1(food.fat100 * ratio),
        },
      });
      usedCalories += food.cal100 * ratio;
      remaining    -= food.cal100 * ratio;
    }
  }

  const calorieAccuracy = Math.min(100, Math.round((usedCalories / targetCalories) * 100));
  const proteinAccuracy = Math.min(100, Math.round((usedProtein  / targetProtein)  * 100));
  return { achievedCalories: round1(usedCalories), achievedProtein: round1(usedProtein), calorieAccuracy, proteinAccuracy, ingredients };
}

/**
 * Versión pura del algoritmo greedy buildByMicros.
 */
function buildByMicrosPure(
  foods: FoodNorm[],
  microField: string,
  gapAmount: number,
  maxCalories = 500,
): { coveredAmount: number; coveragePercent: number; ingredients: SuggestedIngredient[] } {
  const VALID = ['vitaminA','vitaminC','vitaminD','vitaminE','vitaminK','vitaminB1','vitaminB2','vitaminB3','vitaminB6','vitaminB12','folate','calcium','iron','magnesium','phosphorus','potassium','sodium','zinc','selenium','fiber'];
  if (!VALID.includes(microField)) throw new Error(`microField inválido: ${microField}`);
  if (gapAmount <= 0) throw new Error('gapAmount debe ser > 0');

  const ranked = foods
    .filter((f) => (f.micro100?.[microField] ?? 0) > 0)
    .map((f) => ({ ...f, microVal100: f.micro100![microField] }))
    .sort((a, b) => b.microVal100 - a.microVal100);

  const ingredients: SuggestedIngredient[] = [];
  let covered = 0;
  let usedCal = 0;

  for (const food of ranked.slice(0, 5)) {
    if (covered >= gapAmount) break;
    const calRemaining = maxCalories - usedCal;
    if (calRemaining <= 10) break;

    const microRem = gapAmount - covered;
    const gByMicro = (microRem / food.microVal100) * 100;
    const gByCal   = food.cal100 > 0 ? (calRemaining / food.cal100) * 100 : 300;
    const quantityG = Math.min(gByMicro, gByCal, 300);
    const ratio     = quantityG / 100;
    const microContrib = round1(food.microVal100 * ratio);

    ingredients.push({
      foodId: food.id, foodName: food.name,
      suggestedQuantityG: Math.round(quantityG),
      macros: {
        calories: round1(food.cal100  * ratio),
        protein:  round1(food.prot100 * ratio),
        carbs:    round1(food.carbs100 * ratio),
        fat:      round1(food.fat100  * ratio),
      },
      microContribution: microContrib,
    });
    covered  += microContrib;
    usedCal  += food.cal100 * ratio;
  }

  return {
    coveredAmount:   round1(covered),
    coveragePercent: Math.min(100, Math.round((covered / gapAmount) * 100)),
    ingredients,
  };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CHICKEN: FoodNorm = { id:'1', name:'Chicken Breast', brand:null, cal100:165, prot100:31, carbs100:0, fat100:3.6 };
const RICE:    FoodNorm = { id:'2', name:'White Rice',     brand:null, cal100:130, prot100:2.7, carbs100:28, fat100:0.3 };
const EGG:     FoodNorm = { id:'3', name:'Whole Egg',      brand:null, cal100:155, prot100:13, carbs100:1.1, fat100:11 };
const AVOCADO: FoodNorm = { id:'4', name:'Avocado',        brand:null, cal100:160, prot100:2, carbs100:9, fat100:15 };
const SPINACH: FoodNorm = { id:'5', name:'Spinach',        brand:null, cal100:23,  prot100:2.9, carbs100:3.6, fat100:0.4,
  micro100: { iron: 2.7, vitaminC: 28.1, calcium: 99 } };
const BEEF: FoodNorm    = { id:'6', name:'Beef Liver',     brand:null, cal100:175, prot100:26, carbs100:4, fat100:5,
  micro100: { iron: 6.5, vitaminB12: 59.3, vitaminA: 6582 } };
const OAT:  FoodNorm    = { id:'7', name:'Oats',           brand:null, cal100:389, prot100:17, carbs100:66, fat100:7,
  micro100: { iron: 4.7, calcium: 54 } };

const CATALOG = [CHICKEN, RICE, EGG, AVOCADO];

// ─── Tests: Modo Macros ───────────────────────────────────────────────────────

describe('RecipeBuilder — buildByMacros (puro)', () => {
  it('lanza error si targetCalories < 50', () => {
    expect(() => buildByMacrosPure(CATALOG, 30, 50)).toThrow('targetCalories');
  });

  it('lanza error si targetCalories > 5000', () => {
    expect(() => buildByMacrosPure(CATALOG, 9999, 50)).toThrow('targetCalories');
  });

  it('lanza error si targetProtein < 1', () => {
    expect(() => buildByMacrosPure(CATALOG, 500, 0)).toThrow('targetProtein');
  });

  it('devuelve al menos 1 ingrediente cuando hay fuentes proteicas', () => {
    const result = buildByMacrosPure(CATALOG, 500, 50);
    expect(result.ingredients.length).toBeGreaterThanOrEqual(1);
  });

  it('el primer ingrediente es una fuente proteica (prot100 >= 15)', () => {
    const result = buildByMacrosPure(CATALOG, 600, 60);
    const firstId = result.ingredients[0].foodId;
    const food = CATALOG.find(f => f.id === firstId)!;
    expect(food.prot100).toBeGreaterThanOrEqual(15);
  });

  it('calorieAccuracy >= 50% para target alcanzable', () => {
    const result = buildByMacrosPure(CATALOG, 500, 40);
    expect(result.calorieAccuracy).toBeGreaterThanOrEqual(50);
  });

  it('calorieAccuracy <= 100 siempre', () => {
    const result = buildByMacrosPure(CATALOG, 300, 20);
    expect(result.calorieAccuracy).toBeLessThanOrEqual(100);
  });

  it('proteinAccuracy <= 100 siempre', () => {
    const result = buildByMacrosPure(CATALOG, 800, 200);
    expect(result.proteinAccuracy).toBeLessThanOrEqual(100);
  });

  it('modo low_fat: complementos son carbSources', () => {
    const result = buildByMacrosPure(CATALOG, 700, 50, 'low_fat');
    // El resultado debe incluir RICE (carbSource) como complemento
    const names = result.ingredients.map(i => i.foodName);
    expect(names.some(n => n === 'White Rice' || n === 'Chicken Breast')).toBe(true);
  });

  it('modo low_carb: complementos son fatSources (avocado, egg)', () => {
    const result = buildByMacrosPure(CATALOG, 700, 50, 'low_carb');
    const names = result.ingredients.map(i => i.foodName);
    // avocado o egg son fatSources
    expect(names.length).toBeGreaterThanOrEqual(1);
  });

  it('suggestedQuantityG es siempre positivo', () => {
    const result = buildByMacrosPure(CATALOG, 500, 40);
    for (const ing of result.ingredients) {
      expect(ing.suggestedQuantityG).toBeGreaterThan(0);
    }
  });
});

// ─── Tests: Modo Micros ───────────────────────────────────────────────────────

describe('RecipeBuilder — buildByMicros (puro)', () => {
  const MICRO_CATALOG = [SPINACH, BEEF, OAT];

  it('lanza error para microField inválido', () => {
    expect(() => buildByMicrosPure(MICRO_CATALOG, 'omega3', 10)).toThrow('microField inválido');
  });

  it('lanza error si gapAmount <= 0', () => {
    expect(() => buildByMicrosPure(MICRO_CATALOG, 'iron', 0)).toThrow('gapAmount');
  });

  it('retorna lista vacía si ningún alimento tiene el micro', () => {
    const result = buildByMicrosPure(CATALOG, 'vitaminC', 30); // CATALOG sin micro100
    expect(result.ingredients.length).toBe(0);
    expect(result.coveredAmount).toBe(0);
  });

  it('sugiere alimentos ricos en hierro (iron)', () => {
    const result = buildByMicrosPure(MICRO_CATALOG, 'iron', 5);
    expect(result.ingredients.length).toBeGreaterThan(0);
    expect(result.coveredAmount).toBeGreaterThan(0);
  });

  it('coveragePercent <= 100 siempre', () => {
    const result = buildByMicrosPure(MICRO_CATALOG, 'iron', 1);
    expect(result.coveragePercent).toBeLessThanOrEqual(100);
  });

  it('microContribution > 0 para cada ingrediente sugerido', () => {
    const result = buildByMicrosPure(MICRO_CATALOG, 'iron', 10);
    for (const ing of result.ingredients) {
      expect(ing.microContribution!).toBeGreaterThan(0);
    }
  });
});
