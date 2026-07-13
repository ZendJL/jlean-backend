"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FastingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FastingService = class FastingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getConfig(userId) {
        return this.prisma.fastingConfig.findUnique({ where: { userId } });
    }
    setConfig(userId, dto) {
        const data = { ...dto, active: dto.active ?? true };
        return this.prisma.fastingConfig.upsert({
            where: { userId },
            create: { userId, ...data },
            update: { ...data },
        });
    }
    async getStatus(userId) {
        const config = await this.prisma.fastingConfig.findUnique({ where: { userId } });
        if (!config?.active) {
            return { active: false, fasting: false, inEatingWindow: false, windowLabel: '', eatStartHour: 0, eatEndHour: 0, message: 'No fasting config set' };
        }
        const hour = new Date().getHours();
        const eatEnd = (config.eatStartHour + config.eatHours) % 24;
        const inEatingWindow = config.eatStartHour <= eatEnd
            ? hour >= config.eatStartHour && hour < eatEnd
            : hour >= config.eatStartHour || hour < eatEnd;
        return {
            active: true,
            fasting: !inEatingWindow,
            inEatingWindow,
            windowLabel: `${config.fastHours}:${config.eatHours}`,
            eatStartHour: config.eatStartHour,
            eatEndHour: eatEnd,
            message: inEatingWindow
                ? `Eating window open until ${eatEnd}:00`
                : `Fasting — window opens at ${config.eatStartHour}:00`,
        };
    }
};
exports.FastingService = FastingService;
exports.FastingService = FastingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FastingService);
//# sourceMappingURL=fasting.service.js.map