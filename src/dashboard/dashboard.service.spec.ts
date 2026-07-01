import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

// DashboardService usa PrismaService directamente (sin inyectar DiaryService)
const prismaMock = {
  profile: {
    findUnique: jest.fn(),
  },
  foodLog: {
    findFirst: jest.fn(),
  },
  supplementLog: {
    findMany: jest.fn(),
  },
  supplement: {
    findMany: jest.fn(),
  },
  fastingConfig: {
    findUnique: jest.fn(),
  },
  sleepEntry: {
    findFirst: jest.fn(),
  },
};

describe('DashboardService', () => {
  let service: DashboardService;

  const TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);

  const setupDefaults = () => {
    prismaMock.profile.findUnique.mockResolvedValue({
      userId: 'user-1',
      calorieTarget: 2000,
      proteinTarget: 150,
      carbTarget:    200,
      fatTarget:      65,
    });
    prismaMock.foodLog.findFirst.mockResolvedValue(null);       // sin items hoy
    prismaMock.supplementLog.findMany.mockResolvedValue([]);
    prismaMock.supplement.findMany.mockResolvedValue([]);
    prismaMock.fastingConfig.findUnique.mockResolvedValue(null);
    prismaMock.sleepEntry.findFirst.mockResolvedValue(null);
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  it('se instancia correctamente', () => {
    expect(service).toBeDefined();
  });

  // ─ getToday: estructura básica ─────────────────────────────────────────
  describe('getToday()', () => {
    it('retorna estructura completa con campos obligatorios', async () => {
      setupDefaults();

      const result = await service.getToday('user-1');

      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('targets');
      expect(result).toHaveProperty('consumed');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('meals');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('pendingSupplements');
      expect(result).toHaveProperty('fastingStatus');
      expect(result).toHaveProperty('lastSleep');
    });

    it('consumed es 0 cuando no hay items en el log', async () => {
      setupDefaults();

      const result = await service.getToday('user-1');

      expect(result.consumed.calories).toBe(0);
      expect(result.consumed.protein).toBe(0);
    });

    it('remaining = targets cuando consumed = 0', async () => {
      setupDefaults();

      const result = await service.getToday('user-1');

      expect(result.remaining.calories).toBe(2000);
      expect(result.remaining.protein).toBe(150);
    });

    it('usa valores por defecto si no hay perfil', async () => {
      setupDefaults();
      prismaMock.profile.findUnique.mockResolvedValue(null); // sin perfil

      const result = await service.getToday('user-1');

      expect(result.targets.calories).toBe(2000); // fallback default
    });

    it('genera insight SUPPLEMENTS_PENDING si hay suplementos sin tomar', async () => {
      setupDefaults();
      prismaMock.supplement.findMany.mockResolvedValue([
        { id: 'sup-1', userId: 'user-1', name: 'Whey Protein', active: true },
      ]);
      // supplementLog vacío → no se tomó ningún suplemento

      const result = await service.getToday('user-1');
      const types  = result.insights.map((i: any) => i.type);

      expect(types).toContain('SUPPLEMENTS_PENDING');
    });

    it('genera insight SUPPLEMENTS_DONE si todos los suplementos fueron tomados', async () => {
      setupDefaults();
      prismaMock.supplement.findMany.mockResolvedValue([
        { id: 'sup-1', userId: 'user-1', name: 'Creatine', active: true },
      ]);
      prismaMock.supplementLog.findMany.mockResolvedValue([
        { supplementId: 'sup-1', supplement: { name: 'Creatine' } },
      ]);

      const result = await service.getToday('user-1');
      const types  = result.insights.map((i: any) => i.type);

      expect(types).toContain('SUPPLEMENTS_DONE');
    });

    it('fastingStatus es null cuando no hay config de ayuno', async () => {
      setupDefaults();

      const result = await service.getToday('user-1');
      expect(result.fastingStatus).toBeNull();
    });

    it('fastingStatus tiene datos cuando hay config activa', async () => {
      setupDefaults();
      prismaMock.fastingConfig.findUnique.mockResolvedValue({
        userId: 'user-1', fastHours: 16, eatHours: 8, eatStartHour: 12, active: true,
      });

      const result = await service.getToday('user-1');
      expect(result.fastingStatus).not.toBeNull();
      expect(result.fastingStatus).toHaveProperty('windowLabel', '16:8');
    });

    it('calcula consumed correctamente con un item de alimento', async () => {
      setupDefaults();
      prismaMock.foodLog.findFirst.mockResolvedValue({
        id: 'log-1',
        items: [
          {
            id: 'item-1',
            meal: 'BREAKFAST',
            quantityG: 100,
            food: {
              id: 'food-1',
              calories: 165,
              protein: 31,
              carbs: 0,
              fat: 3.6,
              servingSizeG: 100,
              caffeineMg: 0,
            },
            recipe: null,
          },
        ],
      });

      const result = await service.getToday('user-1');
      expect(result.consumed.calories).toBe(165);
      expect(result.consumed.protein).toBe(31);
      expect(result.remaining.calories).toBe(1835); // 2000 - 165
    });
  });
});
