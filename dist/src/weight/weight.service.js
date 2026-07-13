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
exports.WeightService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WeightService = class WeightService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId, opts) {
        const { from, to, limit = 90 } = opts;
        const entries = await this.prisma.weightLog.findMany({
            where: {
                userId,
                ...(from || to ? {
                    recordedAt: {
                        ...(from ? { gte: new Date(from) } : {}),
                        ...(to ? { lte: new Date(to) } : {}),
                    },
                } : {}),
            },
            orderBy: { recordedAt: 'asc' },
            take: limit,
        });
        if (entries.length === 0)
            return { entries, stats: null };
        const weights = entries.map(e => e.weightKg);
        const minWeight = Math.min(...weights);
        const maxWeight = Math.max(...weights);
        const delta = parseFloat((weights[weights.length - 1] - weights[0]).toFixed(2));
        return {
            entries,
            stats: { minWeight, maxWeight, delta, count: entries.length },
        };
    }
    async create(userId, dto) {
        const entry = await this.prisma.weightLog.create({
            data: {
                userId,
                weightKg: dto.weightKg,
                note: dto.note,
                recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
            },
        });
        await this.prisma.profile.updateMany({
            where: { userId },
            data: { weightKg: dto.weightKg },
        });
        return entry;
    }
    async remove(userId, id) {
        const entry = await this.prisma.weightLog.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Weight entry not found');
        if (entry.userId !== userId)
            throw new common_1.ForbiddenException();
        return this.prisma.weightLog.delete({ where: { id } });
    }
    async getLast(userId) {
        return this.prisma.weightLog.findFirst({
            where: { userId },
            orderBy: { recordedAt: 'desc' },
        });
    }
};
exports.WeightService = WeightService;
exports.WeightService = WeightService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WeightService);
//# sourceMappingURL=weight.service.js.map