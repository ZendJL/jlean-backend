import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DayTypesService } from '../day-types/day-types.service';
import { Meal } from '@prisma/client';

interface AddItemDto {
  foodId?: string;
  recipeId?: string;
  quantityG: number;
  meal?: Meal;
}

interface UpdateItemDto {
  quantityG?: number;
  meal?: Meal;
}

@Injectable()
export class DiaryService {
  private readonly logger = new Logger(DiaryService.name);

  constructor(
    private prisma: PrismaService,
    private dayTypes: DayTypesService,
  ) {}

  async getLog(userId: string, dateStr?: string) {
    const date = this.parseDate(dateStr);
    let log = await this.prisma.foodLog.findUnique({
      where: { userId_date: { userId, date } },
      include: this.logInclude(),
    });
    if (!log) {
      this.logger.log(`Creando log del día ${date.toISOString().split('T')[0]} para userId=${userId}`);
      log = await this.prisma.foodLog.create({
        data: { userId, date },
        include: this.logInclude(),
      });
    }
    return this.formatLog(log);
  }

  async addItem(userId: string, dto: AddItemDto, dateStr?: string) {
    if (!dto.foodId && !dto.recipeId)
      throw new BadRequestException('Se requiere foodId o recipeId');

    // B-04: verificar que la referencia existe antes de insertar
    if (dto.foodId) {
      const food = await this.prisma.food.findUnique({ where: { id: dto.foodId } });
      if (!food)
        throw new NotFoundException(`Alimento con id=${dto.foodId} no encontrado`);
    }
    if (dto.recipeId) {
      const recipe = await this.prisma.recipe.findUnique({ where: { id: dto.recipeId } });
      if (!recipe)
        throw new NotFoundException(`Receta con id=${dto.recipeId} no encontrada`);
    }

    const date = this.parseDate(dateStr);
    let log = await this.prisma.foodLog.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (!log) log = await this.prisma.foodLog.create({ data: { userId, date } });

    this.logger.log(
      `Agregando item al log ${date.toISOString().split('T')[0]} ` +
      `(userId=${userId}, foodId=${dto.foodId ?? '-'}, recipeId=${dto.recipeId ?? '-'}, ` +
      `quantityG=${dto.quantityG}, meal=${dto.meal ?? 'OTHER'})`,
    );

    return this.prisma.foodLogItem.create({
      data: {
        logId:     log.id,
        foodId:    dto.foodId   ?? null,
        recipeId:  dto.recipeId ?? null,
        quantityG: dto.quantityG,
        meal:      dto.meal ?? 'OTHER',
      },
      include: this.itemInclude(),
    });
  }

  async updateItem(userId: string, itemId: string, dto: UpdateItemDto) {
    const item = await this.prisma.foodLogItem.findUnique({
      where: { id: itemId },
      include: { log: true },
    });
    if (!item || item.log.userId !== userId)
      throw new NotFoundException('Item no encontrado');

    this.logger.log(`Actualizando item id=${itemId} para userId=${userId}`);
    return this.prisma.foodLogItem.update({
      where: { id: itemId },
      data: {
        ...(dto.quantityG !== undefined && { quantityG: dto.quantityG }),
        ...(dto.meal      !== undefined && { meal:      dto.meal }),
      },
      include: this.itemInclude(),
    });
  }

  async deleteItem(userId: string, itemId: string) {
    const item = await this.prisma.foodLogItem.findUnique({
      where: { id: itemId },
      include: { log: true },
    });
    if (!item || item.log.userId !== userId)
      throw new NotFoundException('Item no encontrado');
    this.logger.log(`Eliminando item id=${itemId} para userId=${userId}`);
    await this.prisma.foodLogItem.delete({ where: { id: itemId } });
    return { deleted: true };
  }

  // Paso 3.4: getSummary ahora usa targets ajustados por DayType
  async getSummary(userId: string, dateStr?: string) {
    const date = this.parseDate(dateStr);

    // Obtener targets ajustados (considera tipo de día si hay uno asignado)
    const adjusted = await this.dayTypes.getAdjustedTargets(userId, date);

    const log = await this.prisma.foodLog.findUnique({
      where:   { userId_date: { userId, date } },
      include: this.logInclude(),
    });

    const consumed = this.calcConsumed(log?.items ?? []);
    const targets  = adjusted.adjusted;

    return {
      date: date.toISOString().split('T')[0],
      // Targets ajustados al tipo de día (o base si no hay asignación)
      targets,
      // Contexto del ajuste para que el frontend muestre "Training Day +15%"
      dayType: adjusted.dayType
        ? {
            name:          adjusted.dayType.name,
            color:         adjusted.dayType.color,
            tdeAdjustPct:  adjusted.dayType.tdeAdjustPct,
            adjustFactor:  adjusted.factor,
          }
        : null,
      consumed,
      remaining: {
        calories: this.round(targets.calories - consumed.calories),
        protein:  this.round(targets.protein  - consumed.protein),
        carbs:    this.round(targets.carbs    - consumed.carbs),
        fat:      this.round(targets.fat      - consumed.fat),
      },
    };
  }

  async getHistory(userId: string, from?: string, to?: string) {
    const toDate   = this.parseDate(to);
    const fromDate = from
      ? this.parseDate(from)
      : new Date(toDate.getTime() - 6 * 24 * 60 * 60 * 1000);

    if (fromDate > toDate)
      throw new BadRequestException('from debe ser anterior a to');

    const profile = await this.prisma.profile.findUnique({ where: { userId } });

    const logs = await this.prisma.foodLog.findMany({
      where: {
        userId,
        date: { gte: fromDate, lte: toDate },
      },
      include: this.logInclude(),
      orderBy: { date: 'asc' },
    });

    const logMap = new Map(
      logs.map((l) => [l.date.toISOString().split('T')[0], l]),
    );

    const days: any[] = [];
    const cursor = new Date(fromDate);

    while (cursor <= toDate) {
      const key = cursor.toISOString().split('T')[0];
      const log = logMap.get(key);
      const consumed = log
        ? this.calcConsumed(log.items)
        : { calories: 0, protein: 0, carbs: 0, fat: 0 };

      days.push({
        date: key,
        consumed,
        target: profile?.calorieTarget ?? 0,
        adherence: profile?.calorieTarget
          ? Math.min(100, this.round((consumed.calories / profile.calorieTarget) * 100))
          : null,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    const totals = days.reduce(
      (acc, d) => ({
        calories: this.round(acc.calories + d.consumed.calories),
        protein:  this.round(acc.protein  + d.consumed.protein),
        carbs:    this.round(acc.carbs    + d.consumed.carbs),
        fat:      this.round(acc.fat      + d.consumed.fat),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    const count = days.length;
    const averages = {
      calories: this.round(totals.calories / count),
      protein:  this.round(totals.protein  / count),
      carbs:    this.round(totals.carbs    / count),
      fat:      this.round(totals.fat      / count),
    };

    return {
      from:     fromDate.toISOString().split('T')[0],
      to:       toDate.toISOString().split('T')[0],
      days,
      totals,
      averages,
      targets: {
        calories: profile?.calorieTarget ?? 0,
        protein:  profile?.proteinTarget ?? 0,
        carbs:    profile?.carbTarget    ?? 0,
        fat:      profile?.fatTarget     ?? 0,
      },
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  // B-03: validar que la fecha sea válida antes de usarla
  private parseDate(dateStr?: string): Date {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime()))
      throw new BadRequestException(`Fecha inválida: "${dateStr}". Usa formato YYYY-MM-DD.`);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private itemInclude() {
    return {
      food: true,
      recipe: {
        include: { items: { include: { food: true } } },
      },
    };
  }

  private logInclude() {
    return {
      items: {
        include: this.itemInclude(),
        orderBy: { createdAt: 'asc' as const },
      },
    };
  }

  private formatLog(log: any) {
    return {
      id:   log.id,
      date: log.date.toISOString().split('T')[0],
      items: log.items.map((item: any) => ({
        id:        item.id,
        meal:      item.meal,
        quantityG: item.quantityG,
        food:      item.food   ?? null,
        recipe:    item.recipe ? { id: item.recipe.id, name: item.recipe.name } : null,
        macros:    this.calcItemMacros(item),
      })),
    };
  }

  private calcItemMacros(item: any) {
    const r = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    if (item.food) {
      const ratio = item.quantityG / (item.food.servingSizeG || 100);
      r.calories = item.food.calories * ratio;
      r.protein  = item.food.protein  * ratio;
      r.carbs    = item.food.carbs    * ratio;
      r.fat      = item.food.fat      * ratio;
    }

    if (item.recipe) {
      const portions = item.quantityG;
      const servings = item.recipe.servings || 1;
      for (const ri of item.recipe.items ?? []) {
        const grams = ri.quantityG * (portions / servings);
        const ratio = grams / (ri.food.servingSizeG || 100);
        r.calories += ri.food.calories * ratio;
        r.protein  += ri.food.protein  * ratio;
        r.carbs    += ri.food.carbs    * ratio;
        r.fat      += ri.food.fat      * ratio;
      }
    }

    return {
      calories: this.round(r.calories),
      protein:  this.round(r.protein),
      carbs:    this.round(r.carbs),
      fat:      this.round(r.fat),
    };
  }

  private calcConsumed(items: any[]) {
    const t = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const item of items) {
      const m = this.calcItemMacros(item);
      t.calories += m.calories;
      t.protein  += m.protein;
      t.carbs    += m.carbs;
      t.fat      += m.fat;
    }
    return {
      calories: this.round(t.calories),
      protein:  this.round(t.protein),
      carbs:    this.round(t.carbs),
      fat:      this.round(t.fat),
    };
  }

  private round(n: number) {
    return Math.round(n * 10) / 10;
  }
}
