import { Module, Global } from '@nestjs/common';
import { RateLimitFallbackGuard } from './guards/rate-limit-fallback.guard';

@Global()
@Module({
  providers: [RateLimitFallbackGuard],
  exports:   [RateLimitFallbackGuard],
})
export class CommonModule {}
