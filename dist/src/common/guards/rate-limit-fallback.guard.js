"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RateLimitFallbackGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitFallbackGuard = void 0;
const common_1 = require("@nestjs/common");
let RateLimitFallbackGuard = RateLimitFallbackGuard_1 = class RateLimitFallbackGuard {
    logger = new common_1.Logger(RateLimitFallbackGuard_1.name);
    usdaBackoff = 0;
    offBackoff = 0;
    markBackoff(provider, ms = 60_000) {
        this.logger.warn(`${provider} rate-limited — activating fallback for ${ms}ms`);
        if (provider === 'USDA')
            this.usdaBackoff = Date.now() + ms;
        else
            this.offBackoff = Date.now() + ms;
    }
    isBackingOff(provider) {
        return provider === 'USDA'
            ? Date.now() < this.usdaBackoff
            : Date.now() < this.offBackoff;
    }
    canActivate(_ctx) {
        return true;
    }
};
exports.RateLimitFallbackGuard = RateLimitFallbackGuard;
exports.RateLimitFallbackGuard = RateLimitFallbackGuard = RateLimitFallbackGuard_1 = __decorate([
    (0, common_1.Injectable)()
], RateLimitFallbackGuard);
//# sourceMappingURL=rate-limit-fallback.guard.js.map