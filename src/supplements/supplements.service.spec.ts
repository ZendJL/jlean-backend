import { Test, TestingModule } from '@nestjs/testing';
import { SupplementsService } from './supplements.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const prismaMock = {
  supplement: {
    findMany:  jest.fn(),
    findFirst: jest.fn(),
    create:    jest.fn(),
    update:    jest.fn(),
    delete:    jest.fn(),
  },
  supplementLog: {
    create:   jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
};

describe('SupplementsService', () => {
  let service: SupplementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplementsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<SupplementsService>(SupplementsService);
    jest.clearAllMocks();
  });

  it('findAll retorna los suplementos del usuario', async () => {
    const supplements = [
      { id: 's-1', userId: 'user-1', name: 'Whey Protein', doseMg: 25000 },
      { id: 's-2', userId: 'user-1', name: 'Creatine',    doseMg: 5000 },
    ];
    prismaMock.supplement.findMany.mockResolvedValue(supplements);

    const result = await service.findAll('user-1');
    expect(result).toHaveLength(2);
    expect(prismaMock.supplement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
  });

  it('create agrega un suplemento nuevo', async () => {
    const dto = { name: 'Vitamin D', doseMg: 2000, frequency: 'DAILY' };
    const created = { id: 's-3', userId: 'user-1', ...dto };
    prismaMock.supplement.create.mockResolvedValue(created);

    const result = await service.create('user-1', dto as any);
    expect(result.name).toBe('Vitamin D');
  });

  it('remove lanza NotFoundException si el suplemento no pertenece al usuario', async () => {
    prismaMock.supplement.findFirst.mockResolvedValue(null);

    await expect(
      service.remove('user-1', 'supplement-inexistente'),
    ).rejects.toThrow(NotFoundException);
  });

  it('logTaken registra la toma de un suplemento', async () => {
    prismaMock.supplement.findFirst.mockResolvedValue({ id: 's-1', userId: 'user-1', name: 'Whey' });
    prismaMock.supplementLog.create.mockResolvedValue({ id: 'log-1', supplementId: 's-1', takenAt: new Date() });

    const result = await service.logTaken('user-1', 's-1');
    expect(result).toHaveProperty('id', 'log-1');
  });
});
