import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class RateLimitFallbackGuard implements CanActivate {
    private readonly logger;
    private usdaBackoff;
    private offBackoff;
    markBackoff(provider: 'USDA' | 'OFF', ms?: number): void;
    isBackingOff(provider: 'USDA' | 'OFF'): boolean;
    canActivate(_ctx: ExecutionContext): boolean;
}
