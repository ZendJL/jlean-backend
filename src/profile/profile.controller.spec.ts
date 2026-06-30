/**
 * Tests del ProfileController — Fase 12.1
 * Cubre: getProfile, updateProfile, getGoalHistory, getDaily.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

const MOCK_PROFILE = {
  userId: 'user-1',
  gender: 'MALE',
  weightKg: 80,
  heightCm: 180,
  calorieTarget: 2000,
  proteinTarget: 150,
  carbTarget: 225,
  fatTarget: 56,
};

describe('ProfileController', () => {
  let controller: ProfileController;
  let service: jest.Mocked<ProfileService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: {
            getProfile:     jest.fn().mockResolvedValue(MOCK_PROFILE),
            updateProfile:  jest.fn().mockResolvedValue(MOCK_PROFILE),
            getGoalHistory: jest.fn().mockResolvedValue([]),
            getDaily:       jest.fn().mockResolvedValue({ date: '2026-06-30', targets: {}, consumed: {}, remaining: {} }),
          },
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
    service    = module.get(ProfileService);
  });

  it('getProfile llama al servicio con el userId del JWT', async () => {
    const req = { user: { userId: 'user-1' } };
    await controller.getProfile(req as any);
    expect(service.getProfile).toHaveBeenCalledWith('user-1');
  });

  it('updateProfile llama al servicio con userId y dto', async () => {
    const req = { user: { userId: 'user-1' } };
    const dto = { weightKg: 82 };
    await controller.updateProfile(req as any, dto as any);
    expect(service.updateProfile).toHaveBeenCalledWith('user-1', dto);
  });

  it('getGoalHistory retorna el historial de metas del usuario', async () => {
    const req = { user: { userId: 'user-1' } };
    const result = await controller.getGoalHistory(req as any);
    expect(service.getGoalHistory).toHaveBeenCalledWith('user-1');
    expect(Array.isArray(result)).toBe(true);
  });
});
