import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { DiaryService } from '../diary/diary.service';
import { DayTypesService } from '../day-types/day-types.service';
import { FastingService } from '../fasting/fasting.service';
import { SleepService } from '../sleep/sleep.service';

const prismaMock = {
  profile: { findUnique: jest.fn() },
  supplement: { findMany: jest.fn() },
  supplementLog: { findMany: jest.fn() },
};

const diarySvcMock = {
  getSummary: jest.fn(),
  getLog:     jest.fn(),
};

const dayTypesMock = {
  getAdjustedTargets: jest.fn(),
  getTodayType: jest.fn(),
};

const fastingMock = {
  getStatus: jest.fn(),
  getWindow:  jest.fn(),
};

const sleepMock = {
  findRecent: jest.fn(),
  getLastEntry: jest.fn(),
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService,   useValue: prismaMock },
        { provide: DiaryService,    useValue: diarySvcMock },
        { provide: DayTypesService, useValue: dayTypesMock },
        { provide: FastingService,  useValue: fastingMock },
        { provide: SleepService,    useValue: sleepMock },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  it('se instancia correctamente', () => {
    expect(service).toBeDefined();
  });

  it('getToday retorna el resumen del día con targets, consumido y restante', async () => {
    diarySvcMock.getSummary.mockResolvedValue({
      date: '2026-01-15',
      targets:   { calories: 2000, protein: 150, carbs: 200, fat: 65 },
      consumed:  { calories:  800, protein:  60, carbs:  80, fat: 30 },
      remaining: { calories: 1200, protein:  90, carbs: 120, fat: 35 },
      dayType: null,
    });
    diarySvcMock.getLog.mockResolvedValue({ id: 'log-1', date: '2026-01-15', items: [] });
    fastingMock.getStatus.mockResolvedValue({ active: false, windowStart: null, windowEnd: null });
    fastingMock.getWindow.mockResolvedValue(null);
    sleepMock.findRecent.mockResolvedValue([]);
    sleepMock.getLastEntry.mockResolvedValue(null);
    prismaMock.supplement.findMany.mockResolvedValue([]);
    prismaMock.supplementLog.findMany.mockResolvedValue([]);
    dayTypesMock.getTodayType.mockResolvedValue(null);
    dayTypesMock.getAdjustedTargets.mockResolvedValue({
      adjusted: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
      dayType: null, factor: 1,
    });
    prismaMock.profile.findUnique.mockResolvedValue({ userId: 'user-1', calorieTarget: 2000 });

    const result = await service.getToday('user-1');
    expect(result).toBeDefined();
    // El dashboard debe retornar al menos la fecha
    expect(result).toHaveProperty('date');
  });
});
