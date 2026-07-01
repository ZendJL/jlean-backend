/**
 * Tests del DashboardService — Fase 12.1 (actualizado: Bug-2 y Bug-3)
 * Cubre: targets, consumed ratio-based, insights determinísticos,
 *        pendingSupplements, fastingStatus.
 */
import { DashboardService } from './dashboard.service';

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const PROFILE_MOCK = {
  calorieTarget: 2000, proteinTarget: 150,
  carbTarget:    225,  fatTarget:     56,
};

/** Pollo: 165 kcal / 100g, 31g prot, 0g carbs, 3.6g fat */
const FOOD_CHICKEN = {
  id: 'f-1', name: 'Chicken', servingSizeG: 100,
  calories: 165, protein: 31, carbs: 0, fat: 3.6,
  caffeineMg: 0,
};

/** Café: 95mg cafeína por 240ml */
const FOOD_COFFEE = {
  id: 'f-coffee', name: 'Coffee', servingSizeG: 240,
  calories: 2, protein: 0.3, carbs: 0, fat: 0,
  caffeineMg: 95,
};

/** Item de log con pollo (100g) — sin snapshots */
const ITEM_CHICKEN = {
  id: 'item-1', meal: 'LUNCH', quantityG: 100,
  food: FOOD_CHICKEN, recipe: null,
};

/** Item con café (240ml = 95mg cafeína) */
const ITEM_COFFEE = {
  id: 'item-2', meal: 'OTHER', quantityG: 240,
  food: FOOD_COFFEE, recipe: null,
};

const SUPP_MOCK     = { id: 's-1', userId: 'u-1', name: 'Creatine', active: true };
const SUPP_LOG_MOCK = { id: 'sl-1', supplementId: 's-1', userId: 'u-1', takenAt: TODAY };

function buildService(overrides: any = {}) {
  const prisma: any = {
    profile:       { findUnique: jest.fn().mockResolvedValue(PROFILE_MOCK) },
    foodLog:       { findFirst:  jest.fn().mockResolvedValue(null) },
    supplementLog: { findMany:   jest.fn().mockResolvedValue([]) },
    supplement:    { findMany:   jest.fn().mockResolvedValue([]) },
    fastingConfig: { findUnique: jest.fn().mockResolvedValue(null) },
    sleepEntry:    { findFirst:  jest.fn().mockResolvedValue(null) },
    ...overrides,
  };
  return new DashboardService(prisma);
}

// =============================================================================
describe('DashboardService.getToday', () => {

  // ── targets y consumed ────────────────────────────────────────────────────
  it('retorna targets del perfil cuando no hay log del día', async () => {
    const result = await buildService().getToday('u-1');
    expect(result.targets.calories).toBe(2000);
    expect(result.consumed.calories).toBe(0);
    expect(result.remaining.calories).toBe(2000);
  });

  it('usa defaults si el perfil no existe', async () => {
    const result = await buildService({ profile: { findUnique: jest.fn().mockResolvedValue(null) } }).getToday('u-1');
    expect(result.targets.calories).toBe(2000);
  });

  it('Bug-3: calcula consumed con ratio-based (NO snapshotCalories)', async () => {
    const svc = buildService({
      foodLog: { findFirst: jest.fn().mockResolvedValue({ items: [ITEM_CHICKEN] }) },
    });
    const result = await svc.getToday('u-1');
    // 100g de pollo (servingSizeG=100) ⇒ ratio=1 ⇒ 165 kcal
    expect(result.consumed.calories).toBe(165);
    expect(result.consumed.protein).toBe(31);
    expect(result.remaining.calories).toBe(2000 - 165);
  });

  // ── insights ──────────────────────────────────────────────────────────────
  describe('insights determinísticos (Bug-2)', () => {

    it('genera PROTEIN_AVAILABLE cuando quedan >30% de protéina', async () => {
      // Sin log ⇒ consumed.protein=0 ⇒ remaining.protein=150 > 150*0.3=45 ✔
      const result = await buildService().getToday('u-1');
      const types = result.insights.map((i: any) => i.type);
      expect(types).toContain('PROTEIN_AVAILABLE');
    });

    it('genera PROTEIN_EXCEEDED cuando se supera el target', async () => {
      // Items con 200g de protéina (meta = 150g)
      const bigProtein = { ...FOOD_CHICKEN, protein: 200 };
      const item       = { id: 'i-p', meal: 'LUNCH', quantityG: 100, food: bigProtein, recipe: null };
      const svc = buildService({
        foodLog: { findFirst: jest.fn().mockResolvedValue({ items: [item] }) },
      });
      const result = await svc.getToday('u-1');
      const types = result.insights.map((i: any) => i.type);
      expect(types).toContain('PROTEIN_EXCEEDED');
    });

    it('genera CALORIE_GOAL_REACHED cuando se alcanzan las calorías', async () => {
      // 100g de alimento con 2001 kcal (supera target de 2000)
      const bigCal = { ...FOOD_CHICKEN, calories: 2001 };
      const item   = { id: 'i-c', meal: 'LUNCH', quantityG: 100, food: bigCal, recipe: null };
      const svc = buildService({
        foodLog: { findFirst: jest.fn().mockResolvedValue({ items: [item] }) },
      });
      const result = await svc.getToday('u-1');
      const types = result.insights.map((i: any) => i.type);
      expect(types).toContain('CALORIE_GOAL_REACHED');
    });

    it('genera CALORIE_BUDGET_AVAILABLE cuando queda >25% de calorías', async () => {
      // Sin log ⇒ 100% restante
      const result = await buildService().getToday('u-1');
      const types = result.insights.map((i: any) => i.type);
      expect(types).toContain('CALORIE_BUDGET_AVAILABLE');
    });

    it('insights[] siempre es un array aunque no haya nada que reportar', async () => {
      const result = await buildService().getToday('u-1');
      expect(Array.isArray(result.insights)).toBe(true);
    });
  });

  // ── suplementos ───────────────────────────────────────────────────────────
  it('calcula pendingSupplements excluyendo los ya registrados', async () => {
    const result = await buildService({
      supplement:    { findMany: jest.fn().mockResolvedValue([SUPP_MOCK]) },
      supplementLog: { findMany: jest.fn().mockResolvedValue([SUPP_LOG_MOCK]) },
    }).getToday('u-1');
    expect(result.pendingSupplements).toHaveLength(0);
  });

  it('genera SUPPLEMENTS_PENDING si hay suplementos sin tomar', async () => {
    const result = await buildService({
      supplement:    { findMany: jest.fn().mockResolvedValue([SUPP_MOCK]) },
      supplementLog: { findMany: jest.fn().mockResolvedValue([]) },
    }).getToday('u-1');
    const types = result.insights.map((i: any) => i.type);
    expect(types).toContain('SUPPLEMENTS_PENDING');
    expect(result.pendingSupplements).toHaveLength(1);
  });

  it('genera SUPPLEMENTS_DONE si todos los suplementos fueron tomados', async () => {
    const result = await buildService({
      supplement:    { findMany: jest.fn().mockResolvedValue([SUPP_MOCK]) },
      supplementLog: { findMany: jest.fn().mockResolvedValue([SUPP_LOG_MOCK]) },
    }).getToday('u-1');
    const types = result.insights.map((i: any) => i.type);
    expect(types).toContain('SUPPLEMENTS_DONE');
  });

  // ── ayuno ───────────────────────────────────────────────────────────────────
  it('fastingStatus es null si no hay config de ayuno', async () => {
    const result = await buildService().getToday('u-1');
    expect(result.fastingStatus).toBeNull();
  });

  it('fastingStatus incluye windowLabel si ayuno está activo', async () => {
    const result = await buildService({
      fastingConfig: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'fc-1', userId: 'u-1',
          fastHours: 16, eatHours: 8,
          eatStartHour: 12, active: true,
        }),
      },
    }).getToday('u-1');
    expect(result.fastingStatus?.windowLabel).toBe('16:8');
    expect(typeof result.fastingStatus?.inEatingWindow).toBe('boolean');
  });
});
