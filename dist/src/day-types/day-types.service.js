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
var DayTypesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DayTypesService = exports.DEFAULT_DAY_TYPES = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
exports.DEFAULT_DAY_TYPES = [
    { name: 'Rest', tdeAdjustPct: -15, color: '#64748b' },
    { name: 'Office', tdeAdjustPct: 0, color: '#0891b2' },
    { name: 'Training', tdeAdjustPct: 15, color: '#16a34a' },
    { name: 'Race', tdeAdjustPct: 35, color: '#d97706' },
    { name: 'Fasting', tdeAdjustPct: -40, color: '#7c3aed' },
];
let DayTypesService = DayTypesService_1 = class DayTypesService {
    prisma;
    logger = new common_1.Logger(DayTypesService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId) {
        return this.prisma.dayType.findMany({
            where: { userId },
            orderBy: { name: 'asc' },
        });
    }
    async create(userId, dto) {
        try {
            return await this.prisma.dayType.create({
                data: { userId, ...dto },
            });
        }
        catch (e) {
            if (e.code === 'P2002')
                throw new common_1.ConflictException(`Day type "${dto.name}" already exists`);
            throw e;
        }
    }
    async update(userId, id, dto) {
        const existing = await this.prisma.dayType.findFirst({ where: { id, userId } });
        if (!existing)
            throw new common_1.NotFoundException('Day type not found');
        return this.prisma.dayType.update({ where: { id }, data: dto });
    }
    async remove(userId, id) {
        const existing = await this.prisma.dayType.findFirst({ where: { id, userId } });
        if (!existing)
            throw new common_1.NotFoundException('Day type not found');
        await this.prisma.dayType.delete({ where: { id } });
        return { deleted: true };
    }
    async seedDefaultDayTypes(userId) {
        const data = exports.DEFAULT_DAY_TYPES.map((dt) => ({ userId, ...dt, isDefault: true }));
        await this.prisma.dayType.createMany({ data, skipDuplicates: true });
        this.logger.log(`Presets de tipos de día creados para userId=${userId}`);
    }
    async assignToDate(userId, dayTypeId, date) {
        const dayType = await this.prisma.dayType.findFirst({ where: { id: dayTypeId, userId } });
        if (!dayType)
            throw new common_1.NotFoundException('Day type not found');
        const d = this.parseDate(date);
        return this.prisma.dayAssignment.upsert({
            where: { userId_date: { userId, date: d } },
            update: { dayTypeId },
            create: { userId, dayTypeId, date: d },
        });
    }
    async removeAssignment(userId, date) {
        const d = this.parseDate(date);
        try {
            await this.prisma.dayAssignment.delete({ where: { userId_date: { userId, date: d } } });
        }
        catch {
        }
        return { deleted: true };
    }
    async getAdjustedTargets(userId, date) {
        const profile = await this.prisma.profile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Perfil no encontrado');
        const d = this.parseDate(date.toISOString().split('T')[0]);
        const assignment = await this.prisma.dayAssignment.findUnique({
            where: { userId_date: { userId, date: d } },
            include: { dayType: true },
        });
        const factor = assignment
            ? 1 + (assignment.dayType.tdeAdjustPct / 100)
            : 1;
        const base = {
            calories: profile.calorieTarget ?? 0,
            protein: profile.proteinTarget ?? 0,
            carbs: profile.carbTarget ?? 0,
            fat: profile.fatTarget ?? 0,
        };
        const round1 = (n) => Math.round(n * 10) / 10;
        return {
            base,
            dayType: assignment?.dayType ?? null,
            factor,
            adjusted: {
                calories: Math.round(base.calories * factor),
                protein: round1(base.protein * factor),
                carbs: round1(base.carbs * factor),
                fat: round1(base.fat * factor),
            },
        };
    }
    async getTodayAssignment(userId) {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        return this.prisma.dayAssignment.findUnique({
            where: { userId_date: { userId, date: today } },
            include: { dayType: true },
        });
    }
    parseDate(dateStr) {
        const d = new Date(dateStr);
        if (isNaN(d.getTime()))
            throw new common_1.BadRequestException(`Fecha inválida: "${dateStr}". Usa formato YYYY-MM-DD.`);
        d.setUTCHours(0, 0, 0, 0);
        return d;
    }
};
exports.DayTypesService = DayTypesService;
exports.DayTypesService = DayTypesService = DayTypesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DayTypesService);
//# sourceMappingURL=day-types.service.js.map