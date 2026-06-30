/**
 * Fase 12.1 — Unit tests para el motor de cálculo nutricional.
 * Ejecutar con: npx jest src/profile/calc.service.spec.ts
 */
import { CalcService } from './calc.service';

describe('CalcService', () => {
  let svc: CalcService;

  beforeEach(() => { svc = new CalcService(); });

  // ─── BMR ──────────────────────────────────────────────────────────────────
  describe('calculateBMR', () => {
    it('calcula BMR masculino correctamente (Mifflin-St Jeor)', () => {
      // Hombre, 30 años, 80kg, 180cm
      // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
      const bmr = svc.calculateBMR({ weightKg: 80, heightCm: 180, age: 30, gender: 'MALE' });
      expect(bmr).toBeCloseTo(1780, 0);
    });

    it('calcula BMR femenino correctamente', () => {
      // Mujer, 25 años, 60kg, 165cm
      // BMR = 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
      const bmr = svc.calculateBMR({ weightKg: 60, heightCm: 165, age: 25, gender: 'FEMALE' });
      expect(bmr).toBeCloseTo(1345, 0);
    });
  });

  // ─── TDEE ─────────────────────────────────────────────────────────────────
  describe('calculateTDEE', () => {
    it('aplica multiplicador SEDENTARY (1.2)', () => {
      expect(svc.calculateTDEE(1780, 'SEDENTARY')).toBeCloseTo(2136, 0);
    });

    it('aplica multiplicador VERY_ACTIVE (1.725)', () => {
      expect(svc.calculateTDEE(1780, 'VERY_ACTIVE')).toBeCloseTo(3070.5, 0);
    });
  });

  // ─── Macro split ──────────────────────────────────────────────────────────
  describe('calculateMacros', () => {
    it('split LOSE: 35% protein, 40% carbs, 25% fat — deficit 20%', () => {
      const result = svc.calculateMacros(2500, 'LOSE');
      // Target cals = 2500 * 0.80 = 2000
      expect(result.targetCalories).toBe(2000);
      expect(result.proteinG).toBeCloseTo((2000 * 0.35) / 4, 0);
      expect(result.carbsG).toBeCloseTo((2000 * 0.40) / 4, 0);
      expect(result.fatG).toBeCloseTo((2000 * 0.25) / 9, 0);
    });

    it('split MAINTAIN: 30% protein, 45% carbs, 25% fat', () => {
      const result = svc.calculateMacros(2000, 'MAINTAIN');
      expect(result.targetCalories).toBe(2000);
      expect(result.proteinG).toBeCloseTo((2000 * 0.30) / 4, 0);
    });

    it('split GAIN: 30% protein, 50% carbs, 20% fat — surplus 15%', () => {
      const result = svc.calculateMacros(2000, 'GAIN');
      expect(result.targetCalories).toBe(2300);
    });
  });

  // ─── Validación de macros ─────────────────────────────────────────────────
  describe('validateMacroConsistency', () => {
    it('no lanza error cuando los macros son consistentes', () => {
      expect(() =>
        svc.validateMacroConsistency({ calories: 400, protein: 30, carbs: 40, fat: 10 })
      ).not.toThrow();
      // 30*4 + 40*4 + 10*9 = 120+160+90 = 370 — dentro del 5%+10 de tolerancia
    });

    it('lanza error cuando hay discrepancia mayor al 5%+10 kcal', () => {
      expect(() =>
        svc.validateMacroConsistency({ calories: 900, protein: 10, carbs: 10, fat: 5 })
        // calculado: 40+40+45 = 125 kcal, declarado 900 → mismatch
      ).toThrow();
    });

    it('lanza error si algún macro es negativo', () => {
      expect(() =>
        svc.validateMacroConsistency({ calories: 400, protein: -5, carbs: 40, fat: 10 })
      ).toThrow();
    });
  });
});
