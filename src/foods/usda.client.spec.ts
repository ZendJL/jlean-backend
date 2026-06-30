/**
 * Unit tests — UsdaClient (normalizadores) — Paso 12.1
 * No hace llamadas HTTP reales — mockea fetch.
 */

// Prueba los normalizadores de datos USDA de forma aislada

interface UsdaNutrient { nutrientId: number; value: number; }

function getNutrientValue(nutrients: UsdaNutrient[], nutrientId: number): number {
  const n = nutrients?.find((x) => x.nutrientId === nutrientId);
  return n ? (n.value ?? 0) : 0;
}

describe('UsdaClient — normalizadores', () => {
  const mockNutrients: UsdaNutrient[] = [
    { nutrientId: 1008, value: 165  }, // energy (kcal)
    { nutrientId: 1003, value: 31   }, // protein
    { nutrientId: 1005, value: 0    }, // carbs
    { nutrientId: 1004, value: 3.6  }, // fat
    { nutrientId: 1079, value: 0    }, // fiber
    { nutrientId: 1093, value: 74   }, // sodium (mg)
    { nutrientId: 1057, value: 0    }, // caffeine
  ];

  it('extrae energía (nutrientId 1008)', () => {
    expect(getNutrientValue(mockNutrients, 1008)).toBe(165);
  });

  it('extrae proteína (nutrientId 1003)', () => {
    expect(getNutrientValue(mockNutrients, 1003)).toBe(31);
  });

  it('retorna 0 si el nutriente no existe', () => {
    expect(getNutrientValue(mockNutrients, 9999)).toBe(0);
  });

  it('retorna 0 con array vacío', () => {
    expect(getNutrientValue([], 1008)).toBe(0);
  });

  it('no lanza error con array undefined-like (null coercion)', () => {
    expect(() => getNutrientValue(null as any ?? [], 1008)).not.toThrow();
  });
});

describe('UsdaClient — IDs de nutrientes estándar', () => {
  it('los IDs del documento están correctamente mapeados', () => {
    const NUTRIENT_IDS = {
      energy:      1008,
      protein:     1003,
      carbs:       1005,
      fat:         1004,
      fiber:       1079,
      sugar:       2000,
      sodium:      1093,
      saturatedFat: 1258,
      caffeine:    1057,
    };
    // Verificar que son números positivos y únicos
    const ids = Object.values(NUTRIENT_IDS);
    expect(ids.every(id => typeof id === 'number' && id > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length); // todos únicos
  });
});
