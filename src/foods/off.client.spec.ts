/**
 * Unit tests — OffClient (evaluación de calidad) — Paso 12.1
 */

type OffQuality = 'COMPLETE' | 'PARTIAL' | 'UNVERIFIED' | 'CONFLICTED';

// Replica evaluateQuality del OffClient
function evaluateQuality(
  nutriments: Record<string, number>,
  productName: string,
): OffQuality {
  const calories = nutriments['energy-kcal_100g'] ?? 0;
  const protein  = nutriments['proteins_100g']        ?? 0;
  const carbs    = nutriments['carbohydrates_100g']    ?? 0;
  const fat      = nutriments['fat_100g']              ?? 0;

  if (!calories || (!protein && !carbs && !fat)) return 'UNVERIFIED';

  const calculated = protein * 4 + carbs * 4 + fat * 9;
  if (calculated > 0) {
    const diff = Math.abs(calories - calculated) / calculated;
    if (diff > 0.15) return 'CONFLICTED';
  }

  const hasMicros = nutriments['fiber_100g'] != null || nutriments['sodium_100g'] != null;
  if (!hasMicros) return 'PARTIAL';

  return 'COMPLETE';
}

describe('OffClient — evaluación de calidad de datos', () => {
  it('COMPLETE: macros consistentes y micros presentes', () => {
    // 31g prot + 0g carb + 3.6g fat = 124 + 32.4 = 156.4 kcal ≈ 165 (margen < 15%)
    const q = evaluateQuality({
      'energy-kcal_100g':     165,
      'proteins_100g':        31,
      'carbohydrates_100g':   0,
      'fat_100g':             3.6,
      'fiber_100g':           0,
      'sodium_100g':          0.074,
    }, 'Chicken Breast');
    expect(q).toBe('COMPLETE');
  });

  it('PARTIAL: macros OK pero sin micros (fibra ni sodio)', () => {
    const q = evaluateQuality({
      'energy-kcal_100g':   165,
      'proteins_100g':      31,
      'carbohydrates_100g': 0,
      'fat_100g':           3.6,
    }, 'Chicken Breast');
    expect(q).toBe('PARTIAL');
  });

  it('UNVERIFIED: calorías sin macros', () => {
    const q = evaluateQuality({
      'energy-kcal_100g': 200,
    }, 'Mystery Food');
    expect(q).toBe('UNVERIFIED');
  });

  it('UNVERIFIED: todo vacío', () => {
    const q = evaluateQuality({}, 'Empty Product');
    expect(q).toBe('UNVERIFIED');
  });

  it('CONFLICTED: calorías declaradas difieren >15% de las calculadas', () => {
    // Calculado: 10*4 + 10*4 + 10*9 = 170 kcal. Declarado: 300 — diferencia 76%
    const q = evaluateQuality({
      'energy-kcal_100g':   300,
      'proteins_100g':      10,
      'carbohydrates_100g': 10,
      'fat_100g':           10,
      'fiber_100g':         2,
    }, 'Conflicted Product');
    expect(q).toBe('CONFLICTED');
  });

  it('no es CONFLICTED si diferencia es <= 15%', () => {
    // Calculado: 25*4 + 30*4 + 8*9 = 100 + 120 + 72 = 292. Declarado: 300 — diff 2.7%
    const q = evaluateQuality({
      'energy-kcal_100g':   300,
      'proteins_100g':      25,
      'carbohydrates_100g': 30,
      'fat_100g':           8,
      'fiber_100g':         4,
    }, 'OK Product');
    expect(['COMPLETE', 'PARTIAL']).toContain(q);
  });
});
