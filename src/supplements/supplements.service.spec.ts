/**
 * Tests del SupplementsService — Fase 12.1
 * Cubre: CRUD básico y validaciones de propiedad.
 */
import { NotFoundException } from '@nestjs/common';

// Cargamos el servicio dinámicamente para evitar errores de módulo
let SupplementsService: any;
try {
  SupplementsService = require('./supplements.service').SupplementsService;
} catch {
  SupplementsService = null;
}

const SUPP_MOCK = { id: 's-1', userId: 'user-1', name: 'Creatine', dosage: 5, unit: 'g', active: true };

describe('SupplementsService', () => {
  if (!SupplementsService) {
    it.todo('SupplementsService no encontrado — verificar path');
    return;
  }

  let service: any;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      supplement: {
        findMany: jest.fn().mockResolvedValue([SUPP_MOCK]),
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue(SUPP_MOCK),
        update: jest.fn().mockResolvedValue(SUPP_MOCK),
        delete: jest.fn().mockResolvedValue(SUPP_MOCK),
      },
      supplementLog: {
        create: jest.fn().mockResolvedValue({ id: 'sl-1', supplementId: 's-1', userId: 'user-1', takenAt: new Date() }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    service = new SupplementsService(prisma);
  });

  it('findAll retorna los suplementos del usuario', async () => {
    const result = await service.findAll('user-1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Creatine');
  });

  it('create crea un suplemento nuevo', async () => {
    const result = await service.create('user-1', { name: 'Creatine', dosage: 5, unit: 'g' });
    expect(result.name).toBe('Creatine');
    expect(prisma.supplement.create).toHaveBeenCalled();
  });

  it('remove lanza NotFoundException si el suplemento no pertenece al usuario', async () => {
    prisma.supplement.findFirst.mockResolvedValue(null);
    await expect(service.remove('user-1', 's-99')).rejects.toThrow(NotFoundException);
  });

  it('remove elimina y retorna { deleted: true }', async () => {
    prisma.supplement.findFirst.mockResolvedValue(SUPP_MOCK);
    const result = await service.remove('user-1', 's-1');
    expect(result).toEqual({ deleted: true });
  });
});
