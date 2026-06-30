/**
 * Tests unitarios — RecipeBuilderService (Paso 5.3)
 * Cubre: buildByMacros y buildByMicros con datos mock del catálogo.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { RecipeBuilderService } from './recipe-builder.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

const MOCK_FOODS = [
  // Fuente proteica
  {
    id: 'food-1', name: 'Chicken Breast', brand: null,
    servingSizeG: 100, calories: 165, protein: 31, carbs: 0, fat: 3.6,
    source: 'PRESET',
    vitaminC: 0, iron: 1.0, calcium: 15,
  },
  // Fuente de carbohidratos
  {
    id: 'food-2', name: 'White Rice', brand: null,
    servingSizeG: 100, calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3,
    source: 'PRESET',
    vitaminC: 0, iron: 0.2, calcium: 10,
  },
  // Fuente de grasa
  {
    id: 'food-3', name: 'Olive Oil', brand: null,
    servingSizeG: 13.5, calories: 119, protein: 0, carbs: 0, fat: 13.5,
    source: 'PRESET',
    vitaminC: 0, iron: 0.1, calcium: 1,
  },
  // Alta en vitamina C
  {
    id: 'food-4', name: 'Broccoli', brand: null,
    servingSizeG: 100, calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4,
    source: 'PRESET',
    vitaminC: 89.2, iron: 0.7, calcium: 47,
  },
  // Alta en hierro
  {
    id: 'food-5', name: 'Spinach', brand: null,
    servingSizeG: 100, calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4,
    source: 'PRESET',
    vitaminC: 28.1, iron: 2.7, calcium: 99,
  },
];

const mockPrisma = {
  food: {
    findMany: jest.fn(),
  },
};

describe('RecipeBuilderService', () => {
  let service: RecipeBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeBuilderService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RecipeBuilderService>(RecipeBuilderService);
    jest.clearAllMocks();
  });

  // ─── buildByMacros ───────────────────────────────────────────────────────

  describe('buildByMacros', () => {
    it('retorna resultado con mode=MACROS y ingredients no vacío', async () => {
      mockPrisma.food.findMany.mockResolvedValue(MOCK_FOODS);

      const result = await service.buildByMacros({
        targetCalories: 500,
        targetProtein:  40,
        carbFatBalance: 'balanced',
        presetsOnly:    true,
      });

      expect(result.mode).toBe('MACROS');
      expect(result.targetCalories).toBe(500);
      expect(result.targetProtein).toBe(40);
      expect(result.ingredients.length).toBeGreaterThan(0);
      // La fuente proteica principal debe ser pollo (mayor densidad proteica)
      expect(result.ingredients[0].foodName).toBe('Chicken Breast');
    });

    it('calorieAccuracy y proteinAccuracy están entre 0 y 100', async () => {
      mockPrisma.food.findMany.mockResolvedValue(MOCK_FOODS);
      const result = await service.buildByMacros({
        targetCalories: 600,
        targetProtein:  50,
      });
      expect(result.calorieAccuracy).toBeGreaterThanOrEqual(0);
      expect(result.calorieAccuracy).toBeLessThanOrEqual(100);
      expect(result.proteinAccuracy).toBeGreaterThanOrEqual(0);
      expect(result.proteinAccuracy).toBeLessThanOrEqual(100);
    });

    it('lanza BadRequestException si targetCalories es inválido', async () => {
      await expect(
        service.buildByMacros({ targetCalories: 10, targetProtein: 40 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si targetProtein es inválido', async () => {
      await expect(
        service.buildByMacros({ targetCalories: 500, targetProtein: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si catálogo está vacío', async () => {
      mockPrisma.food.findMany.mockResolvedValue([]);
      await expect(
        service.buildByMacros({ targetCalories: 500, targetProtein: 40 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('modo low_carb prioriza grasas en el complemento', async () => {
      mockPrisma.food.findMany.mockResolvedValue(MOCK_FOODS);
      const result = await service.buildByMacros({
        targetCalories: 600,
        targetProtein:  30,
        carbFatBalance: 'low_carb',
      });
      // El segundo ingrediente (complemento) no debe ser arroz
      const names = result.ingredients.map((i) => i.foodName);
      expect(names).not.toContain('White Rice');
    });
  });

  // ─── buildByMicros ───────────────────────────────────────────────────────

  describe('buildByMicros', () => {
    it('retorna resultado con mode=MICROS para vitaminC', async () => {
      mockPrisma.food.findMany.mockResolvedValue(MOCK_FOODS);

      const result = await service.buildByMicros({
        microField:  'vitaminC',
        gapAmount:   60,
        maxCalories: 300,
      });

      expect(result.mode).toBe('MICROS');
      expect(result.microField).toBe('vitaminC');
      expect(result.coveredAmount).toBeGreaterThan(0);
      expect(result.coveragePercent).toBeGreaterThan(0);
      // Brócoli tiene más vitC por 100g → debe salir primero
      expect(result.ingredients[0].foodName).toBe('Broccoli');
    });

    it('retorna ingredientes ordenados por densidad del micro DESC', async () => {
      mockPrisma.food.findMany.mockResolvedValue(MOCK_FOODS);
      const result = await service.buildByMicros({
        microField: 'iron',
        gapAmount:  5,
      });
      // Spinach (2.7mg/100g) > Chicken (1.0mg) > ...
      expect(result.ingredients[0].foodName).toBe('Spinach');
    });

    it('retorna coveragePercent=0 si no hay alimentos con ese micro', async () => {
      mockPrisma.food.findMany.mockResolvedValue([]);
      const result = await service.buildByMicros({
        microField: 'vitaminC',
        gapAmount:  60,
      });
      expect(result.coveredAmount).toBe(0);
      expect(result.coveragePercent).toBe(0);
    });

    it('lanza BadRequestException para microField inválido', async () => {
      await expect(
        service.buildByMicros({ microField: 'caffeineMg' as any, gapAmount: 50 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si gapAmount <= 0', async () => {
      await expect(
        service.buildByMicros({ microField: 'vitaminC', gapAmount: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('microContribution en cada ingrediente es un número positivo', async () => {
      mockPrisma.food.findMany.mockResolvedValue(MOCK_FOODS);
      const result = await service.buildByMicros({
        microField: 'calcium',
        gapAmount:  500,
      });
      for (const ing of result.ingredients) {
        expect(ing.microContribution).toBeGreaterThan(0);
      }
    });
  });
});
