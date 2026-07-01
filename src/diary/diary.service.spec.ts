import { Test, TestingModule } from '@nestjs/testing';
import { DiaryService } from './diary.service';
import { PrismaService } from '../prisma/prisma.service';
import { DayTypesService } from '../day-types/day-types.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

// ── Helpers de datos de prueba ────────────────────────────────────────────────
const makeFoodBase = (overrides = {}) => ({
  id: 'food-1',
  name: 'Chicken Breast',
  calories: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
  servingSizeG: 100,
  caffeineMg: 0,
  alcoholG: 0,
  sodiumMg: 74,
  allergens: [],
  sourceType: 'PRESET',
  qualityStatus: 'COMPLETE',
  ...overrides,
});

const makeItem = (food: any, quantityG = 100, meal = 'LUNCH') => ({
  id: 'item-1',
  foodId: food.id,
  recipeId: null,
  quantityG,
  meal,
  food,
  recipe: null,
  createdAt: new Date(),
});

const makeLog = (items: any[] = []) => ({
  id: 'log-1',
  userId: 'user-1',
  date: new Date('2026-01-15'),
  items,
});

// ── Mock de Prisma ────────────────────────────────────────────────────────────
const prismaMock = {
  foodLog: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  foodLogItem: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  food: { findUnique: jest.fn() },
  recipe: { findUnique: jest.fn() },
  profile: { findUnique: jest.fn() },
};

// ── Mock de DayTypesService ───────────────────────────────────────────────────
const dayTypesMock = {
  getAdjustedTargets: jest.fn().mockResolvedValue({
    adjusted: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
    dayType: null,
    factor: 1,
  }),
};

// ─────────────────────────────────────────────────────────────────────────────

describe('DiaryService', () => {
  let service: DiaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiaryService,
        { provide: PrismaService,   useValue: prismaMock },
        { provide: DayTypesService, useValue: dayTypesMock },
      ],
    }).compile();

    service = module.get<DiaryService>(DiaryService);
    jest.clearAllMocks();
  });

  // ── calcItemMacros ──────────────────────────────────────────────────────────
  describe('calcItemMacros()', () => {
    it('calcula macros correctamente para un alimento a 200g (ratio 2x)', () => {
      const food = makeFoodBase(); // servingSizeG=100
      const item = makeItem(food, 200);
      const result = service.calcItemMacros(item);

      expect(result.calories).toBe(330);  // 165 * 2
      expect(result.protein).toBe(62);    // 31 * 2
      expect(result.carbs).toBe(0);
      expect(result.fat).toBe(7.2);       // 3.6 * 2
    });

    it('calcula macros para 50g (ratio 0.5x)', () => {
      const food = makeFoodBase();
      const item = makeItem(food, 50);
      const result = service.calcItemMacros(item);

      expect(result.calories).toBe(82.5);
      expect(result.protein).toBe(15.5);
    });

    it('retorna ceros si no hay food ni recipe', () => {
      const item = { food: null, recipe: null, quantityG: 100, meal: 'LUNCH' };
      const result = service.calcItemMacros(item);

      expect(result).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    });

    it('usa servingSizeG=100 como fallback si es 0', () => {
      const food = makeFoodBase({ servingSizeG: 0 });
      const item = makeItem(food, 100);
      const result = service.calcItemMacros(item);

      expect(result.calories).toBe(165);
    });

    it('calcula macros de una receta por porciones', () => {
      const food = makeFoodBase();
      const recipe = {
        id: 'recipe-1',
        name: 'Ensalada de Pollo',
        servings: 2,
        items: [
          { food, quantityG: 200 }, // 200g total para 2 porciones → 100g/porción
        ],
      };
      // Pedimos 1 porción
      const item = { food: null, recipe, quantityG: 1, meal: 'LUNCH' };
      const result = service.calcItemMacros(item);

      // 200g * (1/2) / 100 * 165 = 165
      expect(result.calories).toBe(165);
      expect(result.protein).toBe(31);
    });
  });

  // ── calcConsumed ─────────────────────────────────────────────────────────────
  describe('calcConsumed()', () => {
    it('suma macros de múltiples items', () => {
      const food = makeFoodBase();
      const items = [
        makeItem(food, 100),
        makeItem(food, 200),
      ];
      const result = service.calcConsumed(items);

      expect(result.calories).toBe(495); // 165 + 330
      expect(result.protein).toBe(93);   // 31 + 62
    });

    it('retorna ceros para lista vacía', () => {
      const result = service.calcConsumed([]);
      expect(result).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    });
  });

  // ── addItem — motor de alertas ────────────────────────────────────────────
  describe('addItem() — motor de alertas', () => {
    const setupAddItem = (foodOverrides = {}, existingItems: any[] = [], profileOverrides = {}) => {
      const food = makeFoodBase(foodOverrides);
      const log  = makeLog(existingItems);

      prismaMock.food.findUnique.mockResolvedValue(food);
      prismaMock.foodLog.findUnique.mockResolvedValue(log);
      prismaMock.profile.findUnique.mockResolvedValue({
        userId: 'user-1',
        allergens: [],
        ...profileOverrides,
      });
      prismaMock.foodLogItem.create.mockResolvedValue({
        id: 'new-item',
        foodId: food.id,
        recipeId: null,
        quantityG: 100,
        meal: 'LUNCH',
        food,
        recipe: null,
        createdAt: new Date(),
      });

      return food;
    };

    it('agrega item sin alertas para alimento normal', async () => {
      setupAddItem();
      const result = await service.addItem('user-1', { foodId: 'food-1', quantityG: 100 });

      expect(result.alerts).toHaveLength(0);
      expect(prismaMock.foodLogItem.create).toHaveBeenCalledTimes(1);
    });

    it('genera alerta CAFFEINE_LIMIT al superar 400mg de cafeína', async () => {
      // Item nuevo: 350mg cafeína, items previos: 100mg → total 450mg
      const prevFood  = makeFoodBase({ id: 'prev-food', caffeineMg: 100 });
      const prevItems = [makeItem(prevFood, 100)];
      setupAddItem({ caffeineMg: 350 }, prevItems);

      const result = await service.addItem('user-1', { foodId: 'food-1', quantityG: 100 });
      const types = result.alerts.map((a: any) => a.type);

      expect(types).toContain('CAFFEINE_LIMIT');
    });

    it('genera alerta SODIUM_HIGH al superar 2300mg de sodio', async () => {
      // sodioMg por 100g = 2400mg → ratio 1 → total 2400mg
      setupAddItem({ sodiumMg: 2400 });

      const result = await service.addItem('user-1', { foodId: 'food-1', quantityG: 100 });
      const types = result.alerts.map((a: any) => a.type);

      expect(types).toContain('SODIUM_HIGH');
    });

    it('genera alerta ALCOHOL_DETECTED si el alimento contiene alcohol', async () => {
      setupAddItem({ alcoholG: 14 }); // 14g de alcohol

      const result = await service.addItem('user-1', { foodId: 'food-1', quantityG: 100 });
      const types = result.alerts.map((a: any) => a.type);

      expect(types).toContain('ALCOHOL_DETECTED');
    });

    it('lanza ForbiddenException si el alimento tiene un alérgeno declarado por el usuario', async () => {
      setupAddItem({ allergens: ['GLUTEN'] }, [], { allergens: ['gluten'] });

      await expect(
        service.addItem('user-1', { foodId: 'food-1', quantityG: 100 }),
      ).rejects.toThrow(ForbiddenException);

      expect(prismaMock.foodLogItem.create).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si foodId no existe', async () => {
      prismaMock.food.findUnique.mockResolvedValue(null);

      await expect(
        service.addItem('user-1', { foodId: 'non-existent', quantityG: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException si no se pasa foodId ni recipeId', async () => {
      await expect(
        service.addItem('user-1', { quantityG: 100 } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── updateItem ─────────────────────────────────────────────────────────────
  describe('updateItem()', () => {
    it('actualiza cantidad correctamente', async () => {
      const food = makeFoodBase();
      const existingItem = {
        id: 'item-1',
        log: { userId: 'user-1' },
        food,
        recipe: null,
        quantityG: 100,
        meal: 'LUNCH',
      };
      prismaMock.foodLogItem.findUnique.mockResolvedValue(existingItem);
      prismaMock.foodLogItem.update.mockResolvedValue({ ...existingItem, quantityG: 200 });

      const result = await service.updateItem('user-1', 'item-1', { quantityG: 200 });
      expect(result.quantityG).toBe(200);
    });

    it('lanza NotFoundException si el item no pertenece al usuario', async () => {
      prismaMock.foodLogItem.findUnique.mockResolvedValue({
        id: 'item-1',
        log: { userId: 'otro-usuario' },
      });

      await expect(
        service.updateItem('user-1', 'item-1', { quantityG: 200 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── deleteItem ─────────────────────────────────────────────────────────────
  describe('deleteItem()', () => {
    it('elimina el item y retorna { deleted: true }', async () => {
      prismaMock.foodLogItem.findUnique.mockResolvedValue({
        id: 'item-1',
        log: { userId: 'user-1' },
      });
      prismaMock.foodLogItem.delete.mockResolvedValue({});

      const result = await service.deleteItem('user-1', 'item-1');
      expect(result).toEqual({ deleted: true });
    });
  });

  // ── getSummary ─────────────────────────────────────────────────────────────
  describe('getSummary()', () => {
    it('retorna remaining correcto con consumo parcial', async () => {
      const food = makeFoodBase();
      const items = [makeItem(food, 100)]; // 165 cal consumidas
      prismaMock.foodLog.findUnique.mockResolvedValue(makeLog(items));
      dayTypesMock.getAdjustedTargets.mockResolvedValue({
        adjusted: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
        dayType: null,
        factor: 1,
      });

      const result = await service.getSummary('user-1', '2026-01-15');

      expect(result.consumed.calories).toBe(165);
      expect(result.remaining.calories).toBe(1835); // 2000 - 165
      expect(result.remaining.protein).toBeCloseTo(119, 0); // 150 - 31
    });

    it('lanza BadRequestException para fecha inválida', async () => {
      await expect(
        service.getSummary('user-1', 'no-es-fecha'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
