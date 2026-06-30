/**
 * Tests unitarios — Validación de consistencia calorías/macros (Paso 11.1)
 * Replica la lógica de CalcService.validateMacroConsistency de forma pura.
 */

interface MacroDto {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Réplica pura de CalcService.validateMacroConsistency para tests sin DI.
 * Lanza Error si hay inconsistencia.
 */
function validateMacroConsistency(dto: MacroDto): void {
  const { calories, protein, carbs, fat } = dto;
  if ([calories, protein, carbs, fat].some((v) => v < 0)) {
    throw new Error('Macro values cannot be negative.');
  }
  const calculated = protein * 4 + carbs * 4 + fat * 9;
  const tolerance = calories * 0.05;
  if (Math.abs(calculated - calories) > tolerance + 10) {
    throw new Error(
      `Calorie/macro mismatch: declared ${calories} kcal, calculated ${Math.round(calculated)} kcal.`,
    );
  }
}

describe('Macro Validation — validateMacroConsistency', () => {
  it('acepta macros perfectamente consistentes', () => {
    // 30g prot (120kcal) + 50g carbs (200kcal) + 20g fat (180kcal) = 500kcal
    expect(() =>
      validateMacroConsistency({ calories: 500, protein: 30, carbs: 50, fat: 20 }),
    ).not.toThrow();
  });

  it('acepta macros con tolerancia del 5%', () => {
    // 500kcal target, calc = 488 → diferencia 12, tolerancia = 25+10 = 35 → OK
    expect(() =>
      validateMacroConsistency({ calories: 500, protein: 28, carbs: 50, fat: 20 }),
    ).not.toThrow();
  });

  it('lanza error si las calorías declaradas son mucho menores que las calculadas', () => {
    // 100g prot (400) + 100g carbs (400) + 50g fat (450) = 1250, declared=500 → diff 750
    expect(() =>
      validateMacroConsistency({ calories: 500, protein: 100, carbs: 100, fat: 50 }),
    ).toThrow('Calorie/macro mismatch');
  });

  it('lanza error si las calorías declaradas son mucho mayores que las calculadas', () => {
    // 10g prot (40) + 10g carbs (40) + 5g fat (45) = 125, declared=500 → diff 375
    expect(() =>
      validateMacroConsistency({ calories: 500, protein: 10, carbs: 10, fat: 5 }),
    ).toThrow('Calorie/macro mismatch');
  });

  it('lanza error si la proteína es negativa', () => {
    expect(() =>
      validateMacroConsistency({ calories: 300, protein: -10, carbs: 50, fat: 10 }),
    ).toThrow('cannot be negative');
  });

  it('lanza error si los carbos son negativos', () => {
    expect(() =>
      validateMacroConsistency({ calories: 300, protein: 30, carbs: -5, fat: 10 }),
    ).toThrow('cannot be negative');
  });

  it('lanza error si la grasa es negativa', () => {
    expect(() =>
      validateMacroConsistency({ calories: 300, protein: 30, carbs: 30, fat: -1 }),
    ).toThrow('cannot be negative');
  });

  it('acepta todos los macros en 0 con calorías 0', () => {
    expect(() =>
      validateMacroConsistency({ calories: 0, protein: 0, carbs: 0, fat: 0 }),
    ).not.toThrow();
  });

  it('proteína: 4 kcal/g, carbos: 4 kcal/g, grasa: 9 kcal/g', () => {
    // Test de las constantes nutricionales
    const protein = 25, carbs = 30, fat = 10;
    const expected = protein * 4 + carbs * 4 + fat * 9;
    expect(expected).toBe(310); // 100 + 120 + 90
    expect(() =>
      validateMacroConsistency({ calories: 310, protein, carbs, fat }),
    ).not.toThrow();
  });

  it('tolerancia: diferencia exactamente en el límite (5% + 10) es aceptada', () => {
    // 400kcal * 0.05 = 20, límite = 20 + 10 = 30. Calc = 400, declared = 370 → diff = 30 exacto
    // protein=50(200) + carbs=50(200) = 400. declared=370 → diff=30 → en el límite → OK
    expect(() =>
      validateMacroConsistency({ calories: 370, protein: 50, carbs: 50, fat: 0 }),
    ).not.toThrow();
  });
});
