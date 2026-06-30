/**
 * Tests del AppController — Fase 12.1
 * Cubre: GET / y GET /health.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExternalApiMonitorService } from './common/services/external-api-monitor.service';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ExternalApiMonitorService,
          useValue: {
            getSummary: jest.fn().mockReturnValue({ USDA: { total: 0, errors: 0 }, OFF: { total: 0, errors: 0 } }),
            record: jest.fn(),
          },
        },
      ],
    }).compile();
    controller = module.get<AppController>(AppController);
  });

  it('GET / retorna el mensaje de bienvenida', () => {
    expect(controller.getHello()).toBeTruthy();
  });

  it('GET /health retorna status ok con timestamp válido', () => {
    const result = controller.health();
    expect(result.status).toBe('ok');
    expect(new Date(result.timestamp).getTime()).not.toBeNaN();
  });

  it('GET /health incluye resumen de APIs externas', () => {
    const result = controller.health();
    expect(result.externalApis).toBeDefined();
    expect(result.externalApis).toHaveProperty('USDA');
    expect(result.externalApis).toHaveProperty('OFF');
  });
});
