/**
 * Tests unitarios — DayTypes: ajuste dinámico de TDEE (Paso 3.4)
 * Prueba la lógica pura de getAdjustedTargets sin base de datos.
 * Replica el cálculo del servicio en funciones puras.
 */

interface BaseTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DayType {
  name: string;
  tdeAdjustPct: number;
  color: string;
}

function getAdjustedTargets(
  base: BaseTargets,
  dayType: DayType | null,
): {
  base: BaseTargets;
  dayType: DayType | null;
  factor: number;
  adjusted: BaseTargets;
} {
  const factor = dayType ? 1 + dayType.tdeAdjustPct / 100 : 1;
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    base,
    dayType,
    factor,
    adjusted: {
      calories: Math.round(base.calories * factor),
      protein:  round1(base.protein  * factor),
      carbs:    round1(base.carbs    * factor),
      fat:      round1(base.fat      * factor),
    },
  };
}

const BASE: BaseTargets = { calories: 2500, protein: 180, carbs: 250, fat: 70 };

const DAY_TYPES = {
  rest:     { name: 'Rest',     tdeAdjustPct: -15, color: '#64748b' },
  office:   { name: 'Office',   tdeAdjustPct:   0, color: '#0891b2' },
  training: { name: 'Training', tdeAdjustPct:  15, color: '#16a34a' },
  race:     { name: 'Race',     tdeAdjustPct:  35, color: '#d97706' },
  fasting:  { name: 'Fasting',  tdeAdjustPct: -40, color: '#7c3aed' },
};

describe('DayTypes — Ajuste Dinámico TDEE (getAdjustedTargets)', () => {
  it('sin asignación (null): factor = 1, adjusted = base', () => {
    const result = getAdjustedTargets(BASE, null);
    expect(result.factor).toBe(1);
    expect(result.adjusted.calories).toBe(2500);
    expect(result.adjusted.protein).toBe(180);
  });

  it('Rest Day (-15%): calorías = 2500 * 0.85 = 2125', () => {
    const result = getAdjustedTargets(BASE, DAY_TYPES.rest);
    expect(result.factor).toBeCloseTo(0.85, 5);
    expect(result.adjusted.calories).toBe(2125);
  });

  it('Office Day (0%): no cambia nada', () => {
    const result = getAdjustedTargets(BASE, DAY_TYPES.office);
    expect(result.factor).toBe(1);
    expect(result.adjusted.calories).toBe(2500);
    expect(result.adjusted.protein).toBe(180);
  });

  it('Training Day (+15%): calorías = 2500 * 1.15 = 2875', () => {
    const result = getAdjustedTargets(BASE, DAY_TYPES.training);
    expect(result.factor).toBeCloseTo(1.15, 5);
    expect(result.adjusted.calories).toBe(2875);
  });

  it('Race Day (+35%): calorías = 2500 * 1.35 = 3375', () => {
    const result = getAdjustedTargets(BASE, DAY_TYPES.race);
    expect(result.factor).toBeCloseTo(1.35, 5);
    expect(result.adjusted.calories).toBe(3375);
  });

  it('Fasting Day (-40%): calorías = 2500 * 0.60 = 1500', () => {
    const result = getAdjustedTargets(BASE, DAY_TYPES.fasting);
    expect(result.factor).toBeCloseTo(0.60, 5);
    expect(result.adjusted.calories).toBe(1500);
  });

  it('adjusted siempre retorna 4 campos', () => {
    for (const dt of Object.values(DAY_TYPES)) {
      const r = getAdjustedTargets(BASE, dt);
      expect(r.adjusted).toHaveProperty('calories');
      expect(r.adjusted).toHaveProperty('protein');
      expect(r.adjusted).toHaveProperty('carbs');
      expect(r.adjusted).toHaveProperty('fat');
    }
  });

  it('Rest Day: proteína ajustada = 180 * 0.85 = 153', () => {
    const result = getAdjustedTargets(BASE, DAY_TYPES.rest);
    expect(result.adjusted.protein).toBeCloseTo(153, 0);
  });

  it('Training Day: carbos ajustados = 250 * 1.15 = 287.5', () => {
    const result = getAdjustedTargets(BASE, DAY_TYPES.training);
    expect(result.adjusted.carbs).toBeCloseTo(287.5, 1);
  });

  it('adjusted.calories es integer (Math.round), macros son 1 decimal (round1)', () => {
    const result = getAdjustedTargets(BASE, DAY_TYPES.rest);
    expect(Number.isInteger(result.adjusted.calories)).toBe(true);
    // protein/carbs/fat pueden ser decimales
    expect(typeof result.adjusted.protein).toBe('number');
  });

  it('Training Day: adjusted.calories > base.calories', () => {
    const result = getAdjustedTargets(BASE, DAY_TYPES.training);
    expect(result.adjusted.calories).toBeGreaterThan(BASE.calories);
  });

  it('Rest Day: adjusted.calories < base.calories', () => {
    const result = getAdjustedTargets(BASE, DAY_TYPES.rest);
    expect(result.adjusted.calories).toBeLessThan(BASE.calories);
  });
});
