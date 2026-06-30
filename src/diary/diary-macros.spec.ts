/**
 * Tests unitarios — DiaryService: cálculo de macros (Pasos 7.2, 7.3)
 * Prueba la lógica pura de calcItemMacros y calcConsumed sin base de datos.
 * Replica las funciones privadas del servicio en forma pura para testing.
 */

interface MacroResult {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Replica de DiaryService.calcItemMacros
 * FIX BUG-02: guard explícito para item huérfano (food === null && recipe === null)
 */
function calcItemMacros(item: {
  quantityG: number;
  food: { calories: number; protein: number; carbs: number; fat: number; servingSizeG: number } | null;
  recipe: {
    servings: number;
    items: Array<{
      quantityG: number;
      food: { calories: number; protein: number; carbs: number; fat: number; servingSizeG: number };
    }>;
  } | null;
}): MacroResult {
  // BUG-02 fix: guard para item huérfano
  if (!item.food && !item.recipe) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  const r: MacroResult = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  if (item.food) {
    const ratio = item.quantityG / (item.food.servingSizeG || 100);
    r.calories = item.food.calories * ratio;
    r.protein  = item.food.protein  * ratio;
    r.carbs    = item.food.carbs    * ratio;
    r.fat      = item.food.fat      * ratio;
  }

  if (item.recipe) {
    const portions = item.quantityG;
    const servings = item.recipe.servings || 1;
    for (const ri of item.recipe.items ?? []) {
      const grams = ri.quantityG * (portions / servings);
      const ratio = grams / (ri.food.servingSizeG || 100);
      r.calories += ri.food.calories * ratio;
      r.protein  += ri.food.protein  * ratio;
      r.carbs    += ri.food.carbs    * ratio;
      r.fat      += ri.food.fat      * ratio;
    }
  }

  return {
    calories: round(r.calories),
    protein:  round(r.protein),
    carbs:    round(r.carbs),
    fat:      round(r.fat),
  };
}

function calcConsumed(items: Parameters<typeof calcItemMacros>[0][]): MacroResult {
  const t: MacroResult = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const item of items) {
    const m = calcItemMacros(item);
    t.calories += m.calories;
    t.protein  += m.protein;
    t.carbs    += m.carbs;
    t.fat      += m.fat;
  }
  return {
    calories: round(t.calories),
    protein:  round(t.protein),
    carbs:    round(t.carbs),
    fat:      round(t.fat),
  };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CHICKEN_100G = { calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSizeG: 100 };
const RICE_100G    = { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, servingSizeG: 100 };
const OAT_100G     = { calories: 389, protein: 17, carbs: 66, fat: 7, servingSizeG: 100 };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DiaryService — calcItemMacros (food directo)', () => {
  it('retorna ceros si food y recipe son null (BUG-02 fix: item huérfano)', () => {
    const result = calcItemMacros({ quantityG: 100, food: null, recipe: null });
    expect(result).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it('100g de pollo: 165 kcal, 31g prot, 0g carbs, 3.6g fat', () => {
    const result = calcItemMacros({ quantityG: 100, food: CHICKEN_100G, recipe: null });
    expect(result.calories).toBeCloseTo(165, 0);
    expect(result.protein).toBeCloseTo(31, 0);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBeCloseTo(3.6, 1);
  });

  it('200g de pollo: macros dobles', () => {
    const result = calcItemMacros({ quantityG: 200, food: CHICKEN_100G, recipe: null });
    expect(result.calories).toBeCloseTo(330, 0);
    expect(result.protein).toBeCloseTo(62, 0);
  });

  it('50g de pollo: macros a la mitad', () => {
    const result = calcItemMacros({ quantityG: 50, food: CHICKEN_100G, recipe: null });
    expect(result.calories).toBeCloseTo(82.5, 0);
    expect(result.protein).toBeCloseTo(15.5, 0);
  });

  it('ratio correcto con servingSizeG distinto de 100 (ej. avena, serving=40g)', () => {
    const oat40g = { ...OAT_100G, servingSizeG: 40 };
    // 40g avena → 40g porción de 40g → ratio=1 → mismos valores que el food
    const result = calcItemMacros({ quantityG: 40, food: oat40g, recipe: null });
    expect(result.calories).toBeCloseTo(389, 0);
  });

  it('todos los valores son >= 0', () => {
    const result = calcItemMacros({ quantityG: 150, food: RICE_100G, recipe: null });
    expect(result.calories).toBeGreaterThan(0);
    expect(result.protein).toBeGreaterThanOrEqual(0);
    expect(result.carbs).toBeGreaterThan(0);
    expect(result.fat).toBeGreaterThanOrEqual(0);
  });
});

describe('DiaryService — calcItemMacros (recipe)', () => {
  const singlePortionRecipe = {
    servings: 1,
    items: [
      { quantityG: 150, food: CHICKEN_100G },
      { quantityG: 80,  food: RICE_100G   },
    ],
  };

  it('recipe de 1 porción, consumir 1 porción → mismos macros que sumar ingredientes', () => {
    const expected = calcConsumed([
      { quantityG: 150, food: CHICKEN_100G, recipe: null },
      { quantityG: 80,  food: RICE_100G,   recipe: null },
    ]);
    const result = calcItemMacros({ quantityG: 1, food: null, recipe: singlePortionRecipe });
    expect(result.calories).toBeCloseTo(expected.calories, 0);
    expect(result.protein).toBeCloseTo(expected.protein, 0);
  });

  it('recipe de 2 porciones, consumir 1 → la mitad de los macros', () => {
    const twoServingsRecipe = { ...singlePortionRecipe, servings: 2 };
    const full = calcItemMacros({ quantityG: 1, food: null, recipe: singlePortionRecipe });
    const half = calcItemMacros({ quantityG: 1, food: null, recipe: twoServingsRecipe });
    expect(half.calories).toBeCloseTo(full.calories / 2, 0);
    expect(half.protein).toBeCloseTo(full.protein / 2, 0);
  });
});

describe('DiaryService — calcConsumed (resumen del día)', () => {
  it('lista vacía → todos los totales en 0', () => {
    const result = calcConsumed([]);
    expect(result).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it('suma correcta de múltiples items', () => {
    const items = [
      { quantityG: 100, food: CHICKEN_100G, recipe: null },
      { quantityG: 100, food: RICE_100G,   recipe: null },
    ];
    const result = calcConsumed(items);
    expect(result.calories).toBeCloseTo(165 + 130, 0);
    expect(result.protein).toBeCloseTo(31 + 2.7, 0);
  });

  it('resultado remaining = target - consumed, puede ser negativo (sobrepaso)', () => {
    const consumed = calcConsumed([
      { quantityG: 300, food: CHICKEN_100G, recipe: null },
    ]);
    const target = { calories: 400, protein: 80, carbs: 200, fat: 50 };
    const remaining = {
      calories: round(target.calories - consumed.calories),
      protein:  round(target.protein  - consumed.protein),
    };
    // 300g pollo = 495 kcal → sobrepasa target de 400
    expect(remaining.calories).toBeLessThan(0);
    expect(remaining.protein).toBeGreaterThan(0); // 93g vs 80 target
  });

  it('item huérfano (food=null, recipe=null) no suma nada (BUG-02 regression test)', () => {
    const items = [
      { quantityG: 100, food: CHICKEN_100G, recipe: null },
      { quantityG: 100, food: null, recipe: null },  // huérfano
    ];
    const withOrphan    = calcConsumed(items);
    const withoutOrphan = calcConsumed([items[0]]);
    expect(withOrphan.calories).toBe(withoutOrphan.calories);
    expect(withOrphan.protein).toBe(withoutOrphan.protein);
  });
});
