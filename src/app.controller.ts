import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ExternalApiMonitorService } from './common/services/external-api-monitor.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly monitor: ExternalApiMonitorService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** GET /health — Paso 1.3 */
  @Get('health')
  health() {
    return {
      status:    'ok',
      timestamp: new Date().toISOString(),
      externalApis: this.monitor.getSummary(),
    };
  }
}
