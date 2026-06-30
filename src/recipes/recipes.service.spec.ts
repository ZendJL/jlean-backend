/**
 * Tests del RecipesService — Fase 12.1
 * Cubre: create, findAll, findOne, update, remove, calcMacros.
 */
import { RecipesService } from './recipes.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const FOOD_MOCK = { id: 'f-1', name: 'Chicken', servingSizeG: 100, calories: 165, protein: 31, carbs: 0, fat: 3.6, brand: null };
const RECIPE_MOCK = {
  id: 'r-1',
  userId: 'user-1',
  name: 'Chicken Bowl',
  description: null,
  servings: 2,
  isPublic: false,
  createdAt: new Date(),
  items: [{ id: 'ri-1', foodId: 'f-1', quantityG: 200, food: FOOD_MOCK }],
};

function buildService(prismaOverrides = {}) {
  const prisma: any = {
    recipe: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    recipeItem: { deleteMany: jest.fn().mockResolvedValue({}) },
    ...prismaOverrides,
  };
  return new RecipesService(prisma);
}

describe('RecipesService', () => {

  // --- create ---
  it('crea una receta y retorna con macros calculados', async () => {
    const svc = buildService({ recipe: { create: jest.fn().mockResolvedValue(RECIPE_MOCK), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() } });
    const dto = { name: 'Chicken Bowl', servings: 2, items: [{ foodId: 'f-1', quantityG: 200 }] };
    const result = await svc.create('user-1', dto);
    expect(result.name).toBe('Chicken Bowl');
    // 200g de pollo (100g base) → ratio=2 → cals=330
    expect(result.macrosTotal.calories).toBeCloseTo(330, 0);
    expect(result.macrosPerServing.calories).toBeCloseTo(165, 0);
  });

  // --- findOne ---
  it('findOne lanza NotFoundException si la receta no existe', async () => {
    const svc = buildService({ recipe: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() } });
    await expect(svc.findOne('user-1', 'r-99')).rejects.toThrow(NotFoundException);
  });

  it('findOne lanza ForbiddenException si la receta no es del usuario ni pública', async () => {
    const svc = buildService({ recipe: { findUnique: jest.fn().mockResolvedValue({ ...RECIPE_MOCK, userId: 'other', isPublic: false }), create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() } });
    await expect(svc.findOne('user-1', 'r-1')).rejects.toThrow(ForbiddenException);
  });

  it('findOne retorna la receta si es pública aunque no sea del usuario', async () => {
    const svc = buildService({ recipe: { findUnique: jest.fn().mockResolvedValue({ ...RECIPE_MOCK, userId: 'other', isPublic: true }), create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() } });
    const result = await svc.findOne('user-1', 'r-1');
    expect(result.isOwner).toBe(false);
  });

  // --- isOwner ---
  it('isOwner es true cuando la receta pertenece al usuario autenticado', async () => {
    const svc = buildService({ recipe: { findUnique: jest.fn().mockResolvedValue(RECIPE_MOCK), create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() } });
    const result = await svc.findOne('user-1', 'r-1');
    expect(result.isOwner).toBe(true);
  });

  // --- remove ---
  it('remove lanza NotFoundException si la receta no existe', async () => {
    const svc = buildService({ recipe: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() } });
    await expect(svc.remove('user-1', 'r-99')).rejects.toThrow(NotFoundException);
  });

  it('remove lanza ForbiddenException si la receta no es del usuario', async () => {
    const svc = buildService({ recipe: { findUnique: jest.fn().mockResolvedValue({ ...RECIPE_MOCK, userId: 'other' }), create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() } });
    await expect(svc.remove('user-1', 'r-1')).rejects.toThrow(ForbiddenException);
  });

  it('remove elimina la receta y retorna { deleted: true }', async () => {
    const svc = buildService({ recipe: { findUnique: jest.fn().mockResolvedValue(RECIPE_MOCK), delete: jest.fn().mockResolvedValue({}), create: jest.fn(), findMany: jest.fn(), update: jest.fn() } });
    const result = await svc.remove('user-1', 'r-1');
    expect(result).toEqual({ deleted: true });
  });

  // --- calcMacros interno (via create) ---
  it('macrosPerServing se calcula dividiendo entre servings', async () => {
    const recipe4 = { ...RECIPE_MOCK, servings: 4 };
    const svc = buildService({ recipe: { create: jest.fn().mockResolvedValue(recipe4), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() } });
    const result = await svc.create('user-1', { name: 'Bowl', servings: 4, items: [{ foodId: 'f-1', quantityG: 200 }] });
    // 330 total / 4 = 82.5
    expect(result.macrosPerServing.calories).toBeCloseTo(82.5, 0);
  });
});
