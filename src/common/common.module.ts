import { Module, Global } from '@nestjs/common';
import { ExternalApiMonitorService } from './services/external-api-monitor.service';

@Global()
@Module({
  providers: [ExternalApiMonitorService],
  exports:   [ExternalApiMonitorService],
})
export class CommonModule {}
