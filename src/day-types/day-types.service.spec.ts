/**
 * Tests del DayTypesService — Fase 12.1
 * Cubre: CRUD, presets seed, assignToDate, getAdjustedTargets.
 */
import { DayTypesService, DEFAULT_DAY_TYPES } from './day-types.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

const PROFILE_MOCK = {
  calorieTarget: 2000,
  proteinTarget: 150,
  carbTarget: 225,
  fatTarget: 56,
};

const DAY_TYPE_MOCK = {
  id: 'dt-1',
  userId: 'user-1',
  name: 'Training',
  tdeAdjustPct: 15,
  color: '#16a34a',
  isDefault: false,
};

describe('DayTypesService', () => {
  let service: DayTypesService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      dayType: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        createMany: jest.fn().mockResolvedValue({ count: 5 }),
      },
      dayAssignment: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      profile: { findUnique: jest.fn() },
    };
    service = new DayTypesService(prisma);
  });

  // --- findAll ---
  it('findAll retorna todos los tipos del usuario', async () => {
    prisma.dayType.findMany.mockResolvedValue([DAY_TYPE_MOCK]);
    const result = await service.findAll('user-1');
    expect(result).toHaveLength(1);
    expect(prisma.dayType.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { name: 'asc' },
    });
  });

  // --- create ---
  it('create crea un day type nuevo', async () => {
    prisma.dayType.create.mockResolvedValue(DAY_TYPE_MOCK);
    const result = await service.create('user-1', { name: 'Training', tdeAdjustPct: 15 });
    expect(result.name).toBe('Training');
  });

  it('create lanza ConflictException si el nombre ya existe (P2002)', async () => {
    prisma.dayType.create.mockRejectedValue({ code: 'P2002' });
    await expect(service.create('user-1', { name: 'Training', tdeAdjustPct: 15 }))
      .rejects.toThrow(ConflictException);
  });

  // --- update ---
  it('update lanza NotFoundException si el tipo no pertenece al usuario', async () => {
    prisma.dayType.findFirst.mockResolvedValue(null);
    await expect(service.update('user-1', 'dt-99', { name: 'X' }))
      .rejects.toThrow(NotFoundException);
  });

  // --- remove ---
  it('remove lanza NotFoundException si el tipo no existe', async () => {
    prisma.dayType.findFirst.mockResolvedValue(null);
    await expect(service.remove('user-1', 'dt-99')).rejects.toThrow(NotFoundException);
  });

  it('remove elimina el tipo si existe', async () => {
    prisma.dayType.findFirst.mockResolvedValue(DAY_TYPE_MOCK);
    prisma.dayType.delete.mockResolvedValue(DAY_TYPE_MOCK);
    const result = await service.remove('user-1', 'dt-1');
    expect(result).toEqual({ deleted: true });
  });

  // --- seedDefaultDayTypes ---
  it('seedDefaultDayTypes llama createMany con los 5 presets por defecto', async () => {
    await service.seedDefaultDayTypes('user-1');
    expect(prisma.dayType.createMany).toHaveBeenCalledWith({
      data: DEFAULT_DAY_TYPES.map((dt) => ({ userId: 'user-1', ...dt, isDefault: true })),
      skipDuplicates: true,
    });
  });

  // --- assignToDate ---
  it('assignToDate lanza NotFoundException si el dayType no existe', async () => {
    prisma.dayType.findFirst.mockResolvedValue(null);
    await expect(service.assignToDate('user-1', 'dt-99', '2026-06-30'))
      .rejects.toThrow(NotFoundException);
  });

  it('assignToDate lanza BadRequestException si la fecha es inválida', async () => {
    prisma.dayType.findFirst.mockResolvedValue(DAY_TYPE_MOCK);
    await expect(service.assignToDate('user-1', 'dt-1', 'not-a-date'))
      .rejects.toThrow(BadRequestException);
  });

  it('assignToDate llama upsert con la fecha correcta', async () => {
    prisma.dayType.findFirst.mockResolvedValue(DAY_TYPE_MOCK);
    prisma.dayAssignment.upsert.mockResolvedValue({});
    await service.assignToDate('user-1', 'dt-1', '2026-06-30');
    expect(prisma.dayAssignment.upsert).toHaveBeenCalled();
  });

  // --- getAdjustedTargets ---
  it('getAdjustedTargets lanza NotFoundException si no hay perfil', async () => {
    prisma.profile.findUnique.mockResolvedValue(null);
    await expect(service.getAdjustedTargets('user-1', new Date()))
      .rejects.toThrow(NotFoundException);
  });

  it('getAdjustedTargets retorna targets base si no hay asignación de día', async () => {
    prisma.profile.findUnique.mockResolvedValue(PROFILE_MOCK);
    prisma.dayAssignment.findUnique.mockResolvedValue(null);
    const result = await service.getAdjustedTargets('user-1', new Date());
    expect(result.factor).toBe(1);
    expect(result.adjusted.calories).toBe(2000);
    expect(result.dayType).toBeNull();
  });

  it('getAdjustedTargets aplica el ajuste del tipo de día (+15%)', async () => {
    prisma.profile.findUnique.mockResolvedValue(PROFILE_MOCK);
    prisma.dayAssignment.findUnique.mockResolvedValue({
      dayType: { ...DAY_TYPE_MOCK, tdeAdjustPct: 15 },
    });
    const result = await service.getAdjustedTargets('user-1', new Date());
    expect(result.factor).toBeCloseTo(1.15);
    expect(result.adjusted.calories).toBe(2300);
  });

  it('getAdjustedTargets aplica ajuste negativo (-15%) para Rest', async () => {
    prisma.profile.findUnique.mockResolvedValue(PROFILE_MOCK);
    prisma.dayAssignment.findUnique.mockResolvedValue({
      dayType: { id: 'dt-2', name: 'Rest', tdeAdjustPct: -15, color: '#64748b' },
    });
    const result = await service.getAdjustedTargets('user-1', new Date());
    expect(result.factor).toBeCloseTo(0.85);
    expect(result.adjusted.calories).toBe(1700);
  });
});
