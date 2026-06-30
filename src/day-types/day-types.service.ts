import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateDayTypeDto {
  name: string;
  tdeAdjustPct: number;  // ej: -15 para Rest, +15 para Training
  color?: string;         // hex color para la UI
  isDefault?: boolean;
}

export interface UpdateDayTypeDto {
  name?: string;
  tdeAdjustPct?: number;
  color?: string;
  isDefault?: boolean;
}

// Presets de tipos de día que se crean al registrar un usuario nuevo
export const DEFAULT_DAY_TYPES: Omit<CreateDayTypeDto, 'isDefault'>[] = [
  { name: 'Rest',     tdeAdjustPct: -15, color: '#64748b' },  // gris pizarra
  { name: 'Office',  tdeAdjustPct:   0, color: '#0891b2' },  // cyan
  { name: 'Training',tdeAdjustPct:  15, color: '#16a34a' },  // verde
  { name: 'Race',    tdeAdjustPct:  35, color: '#d97706' },  // naranja
  { name: 'Fasting', tdeAdjustPct: -40, color: '#7c3aed' },  // violeta
];

@Injectable()
export class DayTypesService {
  private readonly logger = new Logger(DayTypesService.name);

  constructor(private prisma: PrismaService) {}

  // ─── CRUD de DayType ─────────────────────────────────────────────────────

  async findAll(userId: string) {
    return this.prisma.dayType.findMany({
      where:   { userId },
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, dto: CreateDayTypeDto) {
    try {
      return await this.prisma.dayType.create({
        data: { userId, ...dto },
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException(`Day type "${dto.name}" already exists`);
      throw e;
    }
  }

  async update(userId: string, id: string, dto: UpdateDayTypeDto) {
    const existing = await this.prisma.dayType.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Day type not found');
    return this.prisma.dayType.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.dayType.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Day type not found');
    await this.prisma.dayType.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Presets al registrar usuario ────────────────────────────────────────

  // Paso 3.4: crea los tipos de día predeterminados para un usuario nuevo.
  // Usa createMany con skipDuplicates para ser idempotente.
  async seedDefaultDayTypes(userId: string) {
    const data = DEFAULT_DAY_TYPES.map((dt) => ({ userId, ...dt, isDefault: true }));
    await this.prisma.dayType.createMany({ data, skipDuplicates: true });
    this.logger.log(`Presets de tipos de día creados para userId=${userId}`);
  }

  // ─── Asignacion de tipo de dia a una fecha ───────────────────────────────

  async assignToDate(userId: string, dayTypeId: string, date: string) {
    const dayType = await this.prisma.dayType.findFirst({ where: { id: dayTypeId, userId } });
    if (!dayType) throw new NotFoundException('Day type not found');

    const d = this.parseDate(date);
    return this.prisma.dayAssignment.upsert({
      where:  { userId_date: { userId, date: d } },
      update: { dayTypeId },
      create: { userId, dayTypeId, date: d },
    });
  }

  async removeAssignment(userId: string, date: string) {
    const d = this.parseDate(date);
    try {
      await this.prisma.dayAssignment.delete({ where: { userId_date: { userId, date: d } } });
    } catch {
      // si no existe, no es error
    }
    return { deleted: true };
  }

  // ─── Cálculo del TDEE ajustado según tipo de día ─────────────────────────

  /**
   * Dado un userId y una fecha, retorna el TDEE base del perfil ajustado
   * por el tipo de día asignado a esa fecha (si existe).
   * ej: tdeAdjustPct = -15 → multiply por 0.85
   */
  async getAdjustedTargets(userId: string, date: Date) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Perfil no encontrado');

    const d = this.parseDate(date.toISOString().split('T')[0]);

    const assignment = await this.prisma.dayAssignment.findUnique({
      where:   { userId_date: { userId, date: d } },
      include: { dayType: true },
    });

    const factor = assignment
      ? 1 + (assignment.dayType.tdeAdjustPct / 100)
      : 1;

    const base = {
      calories: profile.calorieTarget ?? 0,
      protein:  profile.proteinTarget ?? 0,
      carbs:    profile.carbTarget    ?? 0,
      fat:      profile.fatTarget     ?? 0,
    };

    const round1 = (n: number) => Math.round(n * 10) / 10;

    return {
      base,
      dayType: assignment?.dayType ?? null,
      factor,
      adjusted: {
        calories: Math.round(base.calories * factor),
        protein:  round1(base.protein  * factor),
        carbs:    round1(base.carbs    * factor),
        fat:      round1(base.fat      * factor),
      },
    };
  }

  async getTodayAssignment(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return this.prisma.dayAssignment.findUnique({
      where:   { userId_date: { userId, date: today } },
      include: { dayType: true },
    });
  }

  private parseDate(dateStr: string): Date {
    const d = new Date(dateStr);
    if (isNaN(d.getTime()))
      throw new BadRequestException(`Fecha inválida: "${dateStr}". Usa formato YYYY-MM-DD.`);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
}
