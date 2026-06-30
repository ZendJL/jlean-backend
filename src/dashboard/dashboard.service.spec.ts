/**
 * Tests del DashboardService — Fase 12.1
 * Cubre: getToday — targets, consumed, pendingSupplements, fastingStatus.
 */
import { DashboardService } from './dashboard.service';

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const PROFILE_MOCK = { calorieTarget: 2000, proteinTarget: 150, carbTarget: 225, fatTarget: 56 };

const ITEM_MOCK = {
  id: 'item-1', meal: 'LUNCH', quantityG: 100,
  snapshotCalories: 165, snapshotProtein: 31, snapshotCarbs: 0, snapshotFat: 3.6,
  food: { id: 'f-1', name: 'Chicken' }, recipe: null,
};

const SUPP_MOCK    = { id: 's-1', userId: 'user-1', name: 'Creatine', active: true };
const SUPP_LOG_MOCK = { id: 'sl-1', supplementId: 's-1', userId: 'user-1', takenAt: TODAY };

function buildService(overrides: any = {}) {
  const prisma: any = {
    profile: { findUnique: jest.fn().mockResolvedValue(PROFILE_MOCK) },
    foodLog: { findFirst: jest.fn().mockResolvedValue(null) },
    supplementLog: { findMany: jest.fn().mockResolvedValue([]) },
    supplement: { findMany: jest.fn().mockResolvedValue([]) },
    fastingConfig: { findUnique: jest.fn().mockResolvedValue(null) },
    sleepEntry: { findFirst: jest.fn().mockResolvedValue(null) },
    ...overrides,
  };
  return new DashboardService(prisma);
}

describe('DashboardService.getToday', () => {

  it('retorna targets del perfil cuando no hay log del día', async () => {
    const svc = buildService();
    const result = await svc.getToday('user-1');
    expect(result.targets.calories).toBe(2000);
    expect(result.consumed.calories).toBe(0);
    expect(result.remaining.calories).toBe(2000);
  });

  it('usa defaults si el perfil no existe', async () => {
    const svc = buildService({ profile: { findUnique: jest.fn().mockResolvedValue(null) } });
    const result = await svc.getToday('user-1');
    expect(result.targets.calories).toBe(2000); // default hardcodeado en el servicio
  });

  it('suma consumed correctamente desde los snapshots de los items', async () => {
    const svc = buildService({
      foodLog: { findFirst: jest.fn().mockResolvedValue({ items: [ITEM_MOCK] }) },
    });
    const result = await svc.getToday('user-1');
    expect(result.consumed.calories).toBe(165);
    expect(result.consumed.protein).toBe(31);
    expect(result.remaining.calories).toBe(2000 - 165);
  });

  it('calcula pendingSupplements excluyendo los ya registrados', async () => {
    const svc = buildService({
      supplement: { findMany: jest.fn().mockResolvedValue([SUPP_MOCK]) },
      supplementLog: { findMany: jest.fn().mockResolvedValue([SUPP_LOG_MOCK]) },
    });
    const result = await svc.getToday('user-1');
    // El suplemento ya fue tomado → pendiente = 0
    expect(result.pendingSupplements).toHaveLength(0);
  });

  it('incluye suplementos pendientes si no fueron registrados hoy', async () => {
    const svc = buildService({
      supplement: { findMany: jest.fn().mockResolvedValue([SUPP_MOCK]) },
      supplementLog: { findMany: jest.fn().mockResolvedValue([]) }, // sin logs
    });
    const result = await svc.getToday('user-1');
    expect(result.pendingSupplements).toHaveLength(1);
    expect(result.pendingSupplements[0].name).toBe('Creatine');
  });

  it('fastingStatus es null si no hay configuración de ayuno', async () => {
    const svc = buildService();
    const result = await svc.getToday('user-1');
    expect(result.fastingStatus).toBeNull();
  });

  it('fastingStatus incluye estado de ventana si ayuno está activo', async () => {
    const svc = buildService({
      fastingConfig: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'fc-1', userId: 'user-1',
          fastHours: 16, eatHours: 8,
          eatStartHour: 12, active: true,
        }),
      },
    });
    const result = await svc.getToday('user-1');
    expect(result.fastingStatus).not.toBeNull();
    expect(result.fastingStatus?.windowLabel).toBe('16:8');
    expect(typeof result.fastingStatus?.inEatingWindow).toBe('boolean');
  });
});
