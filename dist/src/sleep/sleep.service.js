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
exports.SleepService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SleepService = class SleepService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(userId, limit = 14) {
        return this.prisma.sleepEntry.findMany({
            where: { userId },
            orderBy: { bedtime: 'desc' },
            take: limit,
        });
    }
    async create(userId, dto) {
        const bedtime = new Date(dto.bedtime);
        const wakeTime = new Date(dto.wakeTime);
        const durationMin = Math.round((wakeTime.getTime() - bedtime.getTime()) / 60000);
        return this.prisma.sleepEntry.create({
            data: {
                userId,
                bedtime,
                wakeTime,
                durationMin,
                qualityScore: dto.qualityScore,
            },
        });
    }
    async remove(userId, id) {
        const entry = await this.prisma.sleepEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Sleep entry not found');
        if (entry.userId !== userId)
            throw new common_1.ForbiddenException();
        return this.prisma.sleepEntry.delete({ where: { id } });
    }
    async getLast(userId) {
        const entry = await this.prisma.sleepEntry.findFirst({
            where: { userId },
            orderBy: { bedtime: 'desc' },
        });
        if (!entry)
            return null;
        const hoursSlept = Math.round(entry.durationMin / 6) / 10;
        let recommendation = 'Good rest!';
        if (hoursSlept < 6)
            recommendation = 'Short sleep — prioritize rest tonight.';
        else if (hoursSlept < 7)
            recommendation = 'Slightly under 7h — aim for more tonight.';
        else if (hoursSlept > 9)
            recommendation = 'Long sleep — check if you feel rested.';
        return { ...entry, hoursSlept, recommendation };
    }
};
exports.SleepService = SleepService;
exports.SleepService = SleepService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SleepService);
//# sourceMappingURL=sleep.service.js.map