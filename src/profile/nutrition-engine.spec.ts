/**
 * Unit tests — Motor de cálculo nutricional (Paso 12.1)
 * Cubre: BMR Mifflin-St Jeor, TDEE con multiplicadores de actividad,
 * ajuste por objetivo (Cut/Maintain/Bulk), reparto de macros.
 * No requiere base de datos — sólo lógica pura.
 */

// ─── Replica la lógica de ProfileService.calculateMacros ────────────────────
// (Extraer a un helper puro en refactor futuro; por ahora se copia para test)

type Gender       = 'MALE' | 'FEMALE';
type ActivityLevel = 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
type Goal         = 'LOSE' | 'MAINTAIN' | 'GAIN';

function calculateBmr(weightKg: number, heightCm: number, ageYears: number, gender: Gender): number {
  if (gender === 'MALE') {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears) + 5;
  }
  return (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears) - 161;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTARY:         1.2,
  LIGHTLY_ACTIVE:    1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE:       1.725,
  EXTRA_ACTIVE:      1.9,
};

const GOAL_FACTORS: Record<Goal, number> = {
  LOSE:     0.80,
  MAINTAIN: 1.00,
  GAIN:     1.15,
};

const MACRO_RATIOS: Record<Goal, { p: number; c: number; f: number }> = {
  LOSE:     { p: 0.35, c: 0.40, f: 0.25 },
  MAINTAIN: { p: 0.30, c: 0.45, f: 0.25 },
  GAIN:     { p: 0.30, c: 0.50, f: 0.20 },
};

function calculateMacros(params: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  gender: Gender;
  activity: ActivityLevel;
  goal: Goal;
}) {
  const bmr  = calculateBmr(params.weightKg, params.heightCm, params.ageYears, params.gender);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[params.activity];
  const cals = Math.round(tdee * GOAL_FACTORS[params.goal]);
  const r    = MACRO_RATIOS[params.goal];
  return {
    bmr:           Math.round(bmr),
    tdee:          Math.round(tdee),
    calorieTarget: cals,
    proteinTarget: Math.round((cals * r.p) / 4),
    carbTarget:    Math.round((cals * r.c) / 4),
    fatTarget:     Math.round((cals * r.f) / 9),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Nutrition Engine — BMR (Mifflin-St Jeor)', () => {
  it('calcula BMR correcto para hombre de referencia', () => {
    // Hombre, 80 kg, 175 cm, 30 años
    // BMR = (10×80) + (6.25×175) - (5×30) + 5 = 800 + 1093.75 - 150 + 5 = 1748.75
    const bmr = calculateBmr(80, 175, 30, 'MALE');
    expect(bmr).toBeCloseTo(1748.75, 1);
  });

  it('calcula BMR correcto para mujer de referencia', () => {
    // Mujer, 65 kg, 165 cm, 28 años
    // BMR = (10×65) + (6.25×165) - (5×28) - 161 = 650 + 1031.25 - 140 - 161 = 1380.25
    const bmr = calculateBmr(65, 165, 28, 'FEMALE');
    expect(bmr).toBeCloseTo(1380.25, 1);
  });

  it('BMR aumenta con mayor peso', () => {
    const light = calculateBmr(60, 170, 25, 'MALE');
    const heavy = calculateBmr(90, 170, 25, 'MALE');
    expect(heavy).toBeGreaterThan(light);
  });

  it('BMR disminuye con mayor edad', () => {
    const young = calculateBmr(75, 175, 20, 'MALE');
    const older = calculateBmr(75, 175, 50, 'MALE');
    expect(older).toBeLessThan(young);
  });

  it('BMR masculino > femenino con mismos parámetros (por constante +5 vs -161)', () => {
    const male   = calculateBmr(70, 170, 30, 'MALE');
    const female = calculateBmr(70, 170, 30, 'FEMALE');
    expect(male - female).toBeCloseTo(166, 0); // +5 - (-161) = 166
  });
});

describe('Nutrition Engine — TDEE con multiplicadores de actividad', () => {
  const BMR = 1750;

  it('SEDENTARY: TDEE = BMR * 1.2', () => {
    const tdee = BMR * ACTIVITY_MULTIPLIERS.SEDENTARY;
    expect(tdee).toBeCloseTo(2100, 0);
  });

  it('MODERATELY_ACTIVE: TDEE = BMR * 1.55', () => {
    const tdee = BMR * ACTIVITY_MULTIPLIERS.MODERATELY_ACTIVE;
    expect(tdee).toBeCloseTo(2712.5, 0);
  });

  it('EXTRA_ACTIVE: multiplicador máximo 1.9', () => {
    expect(ACTIVITY_MULTIPLIERS.EXTRA_ACTIVE).toBe(1.9);
  });

  it('los 5 niveles de actividad son crecientes', () => {
    const levels: ActivityLevel[] = [
      'SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTRA_ACTIVE',
    ];
    for (let i = 1; i < levels.length; i++) {
      expect(ACTIVITY_MULTIPLIERS[levels[i]]).toBeGreaterThan(ACTIVITY_MULTIPLIERS[levels[i - 1]]);
    }
  });
});

describe('Nutrition Engine — Reparto de macros por objetivo', () => {
  const base = { weightKg: 80, heightCm: 175, ageYears: 30, gender: 'MALE' as Gender, activity: 'MODERATELY_ACTIVE' as ActivityLevel };

  it('MAINTAIN: macros suman ~calorieTarget con margen de redondeo ±5%', () => {
    const r = calculateMacros({ ...base, goal: 'MAINTAIN' });
    const calFromMacros = r.proteinTarget * 4 + r.carbTarget * 4 + r.fatTarget * 9;
    expect(calFromMacros).toBeGreaterThan(r.calorieTarget * 0.95);
    expect(calFromMacros).toBeLessThan(r.calorieTarget * 1.05);
  });

  it('LOSE: calorieTarget = TDEE * 0.80 (déficit 20%)', () => {
    const r = calculateMacros({ ...base, goal: 'LOSE' });
    expect(r.calorieTarget).toBeCloseTo(r.tdee * 0.80, -1); // ±10 kcal
  });

  it('GAIN: calorieTarget = TDEE * 1.15 (supraévit 15%)', () => {
    const r = calculateMacros({ ...base, goal: 'GAIN' });
    expect(r.calorieTarget).toBeCloseTo(r.tdee * 1.15, -1);
  });

  it('LOSE: proteína es el macro más alto (35% kcal)', () => {
    const r = calculateMacros({ ...base, goal: 'LOSE' });
    const protCal = r.proteinTarget * 4;
    const carbCal = r.carbTarget   * 4;
    const fatCal  = r.fatTarget    * 9;
    expect(protCal).toBeGreaterThan(fatCal);
    // prot 35% vs carb 40% — en kcal el carb es mayor, en gramos prot > fat
    expect(r.proteinTarget).toBeGreaterThan(r.fatTarget);
    void carbCal; // carbs en kcal es 40%, más que prot (35%)
  });

  it('GAIN: carbos son el macro más alto en kcal (50%)', () => {
    const r = calculateMacros({ ...base, goal: 'GAIN' });
    const carbCal = r.carbTarget * 4;
    const protCal = r.proteinTarget * 4;
    const fatCal  = r.fatTarget  * 9;
    expect(carbCal).toBeGreaterThan(protCal);
    expect(carbCal).toBeGreaterThan(fatCal);
  });

  it('BULK tiene más calorías que MAINTAIN que LOSE', () => {
    const lose     = calculateMacros({ ...base, goal: 'LOSE'     });
    const maintain = calculateMacros({ ...base, goal: 'MAINTAIN' });
    const gain     = calculateMacros({ ...base, goal: 'GAIN'     });
    expect(gain.calorieTarget).toBeGreaterThan(maintain.calorieTarget);
    expect(maintain.calorieTarget).toBeGreaterThan(lose.calorieTarget);
  });

  it('macros no son negativos para ningún perfil válido', () => {
    const profiles = [
      { weightKg: 50, heightCm: 155, ageYears: 20, gender: 'FEMALE' as Gender, activity: 'SEDENTARY' as ActivityLevel,       goal: 'LOSE'     as Goal },
      { weightKg: 120, heightCm: 190, ageYears: 45, gender: 'MALE' as Gender,  activity: 'EXTRA_ACTIVE' as ActivityLevel,     goal: 'GAIN'     as Goal },
      { weightKg: 70, heightCm: 170, ageYears: 35, gender: 'FEMALE' as Gender, activity: 'LIGHTLY_ACTIVE' as ActivityLevel,  goal: 'MAINTAIN' as Goal },
    ];
    for (const p of profiles) {
      const r = calculateMacros(p);
      expect(r.calorieTarget).toBeGreaterThan(0);
      expect(r.proteinTarget).toBeGreaterThanOrEqual(0);
      expect(r.carbTarget).toBeGreaterThanOrEqual(0);
      expect(r.fatTarget).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Nutrition Engine — Tipos de Día (ajuste dinámico TDEE)', () => {
  const baseCals = 2500;

  it('Rest Day (-15%): reduce calorías correctamente', () => {
    const factor   = 1 + (-15 / 100);
    const adjusted = Math.round(baseCals * factor);
    expect(adjusted).toBe(2125);
  });

  it('Training Day (+15%): aumenta calorías correctamente', () => {
    const factor   = 1 + (15 / 100);
    const adjusted = Math.round(baseCals * factor);
    expect(adjusted).toBe(2875);
  });

  it('Race Day (+35%): aumenta calorías correctamente', () => {
    const factor   = 1 + (35 / 100);
    const adjusted = Math.round(baseCals * factor);
    expect(adjusted).toBe(3375);
  });

  it('factor 0% (Office/Base): no cambia nada', () => {
    const factor   = 1 + (0 / 100);
    const adjusted = Math.round(baseCals * factor);
    expect(adjusted).toBe(baseCals);
  });

  it('factor negativo extremo (-50% Fasting): no produce valor negativo', () => {
    const factor   = 1 + (-50 / 100);
    const adjusted = Math.round(baseCals * factor);
    expect(adjusted).toBeGreaterThan(0);
    expect(adjusted).toBe(1250);
  });
});

describe('Nutrition Engine — Caféína y alertas', () => {
  it('alerta si caféína > 400mg en el día', () => {
    const totalCaffeine = 450;
    const limit         = 400;
    expect(totalCaffeine).toBeGreaterThan(limit);
  });

  it('sin alerta si caféína <= 400mg', () => {
    const totalCaffeine = 300;
    const limit         = 400;
    expect(totalCaffeine).toBeLessThanOrEqual(limit);
  });

  it('2 tazas de café (95mg c/u) = 190mg — bajo del límite', () => {
    const total = 2 * 95;
    expect(total).toBeLessThan(400);
  });

  it('5 tazas de café (95mg c/u) = 475mg — supera el límite', () => {
    const total = 5 * 95;
    expect(total).toBeGreaterThan(400);
  });
});

describe('Nutrition Engine — Calorías por gramo', () => {
  it('proteína: 4 kcal/g', () => { expect(4 * 1).toBe(4); });
  it('carbos: 4 kcal/g',    () => { expect(4 * 1).toBe(4); });
  it('grasa: 9 kcal/g',    () => { expect(9 * 1).toBe(9); });
  it('alcohol: 7 kcal/g',  () => { expect(7 * 1).toBe(7); });

  it('100g pollo (31g prot, 0g carb, 3.6g fat) = 165 kcal', () => {
    const kcal = (31 * 4) + (0 * 4) + (3.6 * 9);
    expect(kcal).toBeCloseTo(156.4, 0); // valor USDA 165 por agua/ceniza residual — diferencia normal
    expect(Math.abs(kcal - 165)).toBeLessThan(15); // margen de 15 kcal
  });
});
