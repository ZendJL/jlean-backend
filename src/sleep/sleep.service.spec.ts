import { Test, TestingModule } from '@nestjs/testing';
import { SleepService } from './sleep.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

const prismaMock = {
  sleepEntry: {
    create:   jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    delete:   jest.fn(),
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

  it('create registra una entrada de sueño', async () => {
    const dto = {
      bedtime:  '2026-01-15T23:00:00.000Z',
      wakeTime: '2026-01-16T07:00:00.000Z',
    };
    const entry = {
      id: 'sleep-1',
      userId: 'user-1',
      bedtime: new Date(dto.bedtime),
      wakeTime: new Date(dto.wakeTime),
      durationMinutes: 480,
      quality: null,
    };
    prismaMock.sleepEntry.create.mockResolvedValue(entry);

    const result = await service.create('user-1', dto as any);
    expect(result.durationMinutes).toBe(480);
  });

  it('findRecent retorna entradas del usuario', async () => {
    prismaMock.sleepEntry.findMany.mockResolvedValue([
      { id: 'sleep-1', durationMinutes: 480 },
      { id: 'sleep-2', durationMinutes: 420 },
    ]);

    const result = await service.findRecent('user-1');
    expect(result).toHaveLength(2);
  });

  it('lanza BadRequestException si wakeTime es anterior a bedtime', async () => {
    const dto = {
      bedtime:  '2026-01-16T07:00:00.000Z',
      wakeTime: '2026-01-15T23:00:00.000Z', // invertido
    };

    await expect(
      service.create('user-1', dto as any),
    ).rejects.toThrow(BadRequestException);
  });
});
