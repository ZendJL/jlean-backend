import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';

/**
 * Fase 11.2 — Guard que marca en el request si las APIs externas (USDA/OFF)
 * están bajo presión de rate-limit, para que el servicio pueda hacer fallback
 * al catálogo interno sin lanzar error al usuario.
 */
@Injectable()
export class RateLimitFallbackGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitFallbackGuard.name);
  // Estado compartido en memoria (suficiente para instancia única)
  private usdaBackoff   = 0;
  private offBackoff    = 0;

  markBackoff(provider: 'USDA' | 'OFF', ms = 60_000) {
    this.logger.warn(`${provider} rate-limited — activating fallback for ${ms}ms`);
    if (provider === 'USDA') this.usdaBackoff = Date.now() + ms;
    else                     this.offBackoff  = Date.now() + ms;
  }

  isBackingOff(provider: 'USDA' | 'OFF'): boolean {
    return provider === 'USDA'
      ? Date.now() < this.usdaBackoff
      : Date.now() < this.offBackoff;
  }

  canActivate(_ctx: ExecutionContext): boolean {
    return true; // este guard se usa programáticamente, no como decorador de ruta
  }
}
