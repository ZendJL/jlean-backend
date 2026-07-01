import { Test, TestingModule } from '@nestjs/testing';
import { FastingService } from './fasting.service';
import { PrismaService } from '../prisma/prisma.service';

const prismaMock = {
  fastingConfig: {
    findUnique: jest.fn(),
    upsert:     jest.fn(),
  },
};

describe('FastingService', () => {
  let service: FastingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FastingService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<FastingService>(FastingService);
    jest.clearAllMocks();
  });

  // ─ getConfig ─────────────────────────────────────────────────
  describe('getConfig()', () => {
    it('retorna la configuración de ayuno del usuario', async () => {
      const config = { id: 'fc-1', userId: 'user-1', fastHours: 16, eatHours: 8, eatStartHour: 12, active: true };
      prismaMock.fastingConfig.findUnique.mockResolvedValue(config);

      const result = await service.getConfig('user-1');
      expect(result?.fastHours).toBe(16);
      expect(result?.eatStartHour).toBe(12);
    });

    it('retorna null si no hay configuración', async () => {
      prismaMock.fastingConfig.findUnique.mockResolvedValue(null);

      const result = await service.getConfig('user-1');
      expect(result).toBeNull();
    });
  });

  // ─ setConfig ─────────────────────────────────────────────────
  describe('setConfig()', () => {
    it('crea o actualiza la configuración de ayuno con upsert', async () => {
      const dto    = { fastHours: 16, eatHours: 8, eatStartHour: 12 };
      const upserted = { id: 'fc-1', userId: 'user-1', ...dto, active: true };
      prismaMock.fastingConfig.upsert.mockResolvedValue(upserted);

      const result = await service.setConfig('user-1', dto);
      expect(result.fastHours).toBe(16);
      expect(result.eatStartHour).toBe(12);
      expect(prismaMock.fastingConfig.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });

    it('activa la configuración por defecto si active no se especifica', async () => {
      const dto = { fastHours: 14, eatHours: 10, eatStartHour: 10 };
      prismaMock.fastingConfig.upsert.mockResolvedValue({ ...dto, active: true, userId: 'user-1' });

      await service.setConfig('user-1', dto);
      const upsertArg = prismaMock.fastingConfig.upsert.mock.calls[0][0];
      expect(upsertArg.create.active).toBe(true);
    });
  });

  // ─ getStatus ─────────────────────────────────────────────────
  describe('getStatus()', () => {
    it('retorna status inactive si no hay config', async () => {
      prismaMock.fastingConfig.findUnique.mockResolvedValue(null);

      const result = await service.getStatus('user-1');
      expect(result.active).toBe(false);
      expect(result.message).toContain('No fasting config');
    });

    it('retorna status inactive si active=false', async () => {
      prismaMock.fastingConfig.findUnique.mockResolvedValue({
        id: 'fc-1', userId: 'user-1', fastHours: 16, eatHours: 8, eatStartHour: 12, active: false,
      });

      const result = await service.getStatus('user-1');
      expect(result.active).toBe(false);
    });

    it('retorna estructura completa cuando la config está activa', async () => {
      prismaMock.fastingConfig.findUnique.mockResolvedValue({
        id: 'fc-1', userId: 'user-1', fastHours: 16, eatHours: 8, eatStartHour: 12, active: true,
      });

      const result = await service.getStatus('user-1');
      expect(result.active).toBe(true);
      expect(result).toHaveProperty('fasting');
      expect(result).toHaveProperty('inEatingWindow');
      expect(result).toHaveProperty('windowLabel');
      expect(result).toHaveProperty('eatStartHour', 12);
      expect(result.eatEndHour).toBe(20); // 12 + 8 = 20
    });

    it('calcula windowLabel correctamente (16:8)', async () => {
      prismaMock.fastingConfig.findUnique.mockResolvedValue({
        id: 'fc-1', userId: 'user-1', fastHours: 16, eatHours: 8, eatStartHour: 12, active: true,
      });

      const result = await service.getStatus('user-1');
      expect(result.windowLabel).toBe('16:8');
    });
  });
});
