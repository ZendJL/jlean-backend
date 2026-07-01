import { Test, TestingModule } from '@nestjs/testing';
import { SleepService } from './sleep.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

const prismaMock = {
  sleepEntry: {
    create:    jest.fn(),
    findMany:  jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    delete:    jest.fn(),
  },
};

describe('SleepService', () => {
  let service: SleepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SleepService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<SleepService>(SleepService);
    jest.clearAllMocks();
  });

  // ─ create ───────────────────────────────────────────────────────
  describe('create()', () => {
    it('registra una entrada de sueño y calcula durationMin correctamente', async () => {
      const dto = {
        bedtime:  '2026-01-15T23:00:00.000Z',
        wakeTime: '2026-01-16T07:00:00.000Z',  // 8h = 480 min
      };
      prismaMock.sleepEntry.create.mockResolvedValue({
        id: 'sleep-1',
        userId: 'user-1',
        bedtime:     new Date(dto.bedtime),
        wakeTime:    new Date(dto.wakeTime),
        durationMin: 480,
        qualityScore: null,
      });

      const result = await service.create('user-1', dto);
      expect(prismaMock.sleepEntry.create).toHaveBeenCalledTimes(1);
      // Verificar que se calculó durationMin = 480
      const createArg = prismaMock.sleepEntry.create.mock.calls[0][0];
      expect(createArg.data.durationMin).toBe(480);
      expect(result).toHaveProperty('id', 'sleep-1');
    });

    it('calcula durationMin correctamente para 6h de sueño', async () => {
      const dto = {
        bedtime:  '2026-01-15T00:00:00.000Z',
        wakeTime: '2026-01-15T06:00:00.000Z',  // 6h = 360 min
      };
      prismaMock.sleepEntry.create.mockResolvedValue({
        id: 'sleep-2', userId: 'user-1',
        bedtime: new Date(dto.bedtime), wakeTime: new Date(dto.wakeTime),
        durationMin: 360, qualityScore: null,
      });

      await service.create('user-1', dto);
      const createArg = prismaMock.sleepEntry.create.mock.calls[0][0];
      expect(createArg.data.durationMin).toBe(360);
    });
  });

  // ─ findAll ────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('retorna entradas del usuario ordenadas por bedtime desc', async () => {
      prismaMock.sleepEntry.findMany.mockResolvedValue([
        { id: 'sleep-1', durationMin: 480 },
        { id: 'sleep-2', durationMin: 360 },
      ]);

      const result = await service.findAll('user-1');
      expect(result).toHaveLength(2);
      expect(prismaMock.sleepEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });

    it('respeta el parámetro limit', async () => {
      prismaMock.sleepEntry.findMany.mockResolvedValue([{ id: 'sleep-1', durationMin: 480 }]);

      await service.findAll('user-1', 7);
      const callArg = prismaMock.sleepEntry.findMany.mock.calls[0][0];
      expect(callArg.take).toBe(7);
    });
  });

  // ─ getLast ────────────────────────────────────────────────────
  describe('getLast()', () => {
    it('retorna recomendación correcta para 8h de sueño', async () => {
      prismaMock.sleepEntry.findFirst.mockResolvedValue({
        id: 'sleep-1', userId: 'user-1',
        bedtime: new Date(), wakeTime: new Date(),
        durationMin: 480, qualityScore: null,
      });

      const result = await service.getLast('user-1');
      expect(result).not.toBeNull();
      expect(result!.hoursSlept).toBe(8);
      expect(result!.recommendation).toBe('Good rest!');
    });

    it('retorna recomendación de poco sueño para < 6h', async () => {
      prismaMock.sleepEntry.findFirst.mockResolvedValue({
        id: 'sleep-1', userId: 'user-1',
        bedtime: new Date(), wakeTime: new Date(),
        durationMin: 300, qualityScore: null, // 5h
      });

      const result = await service.getLast('user-1');
      expect(result!.hoursSlept).toBe(5);
      expect(result!.recommendation).toContain('Short sleep');
    });

    it('retorna null si no hay entradas', async () => {
      prismaMock.sleepEntry.findFirst.mockResolvedValue(null);

      const result = await service.getLast('user-1');
      expect(result).toBeNull();
    });
  });

  // ─ remove ────────────────────────────────────────────────────
  describe('remove()', () => {
    it('lanza NotFoundException si la entrada no existe', async () => {
      prismaMock.sleepEntry.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('user-1', 'no-existe'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza ForbiddenException si la entrada pertenece a otro usuario', async () => {
      prismaMock.sleepEntry.findUnique.mockResolvedValue({ id: 'sleep-1', userId: 'otro-usuario' });

      await expect(
        service.remove('user-1', 'sleep-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('elimina correctamente si pertenece al usuario', async () => {
      prismaMock.sleepEntry.findUnique.mockResolvedValue({ id: 'sleep-1', userId: 'user-1' });
      prismaMock.sleepEntry.delete.mockResolvedValue({ id: 'sleep-1' });

      const result = await service.remove('user-1', 'sleep-1');
      expect(result).toHaveProperty('id', 'sleep-1');
    });
  });
});
