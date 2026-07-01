import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DayTypesService } from '../day-types/day-types.service';
import { Meal } from '@prisma/client';

export interface DiaryAlert {
  type:
    | 'CAFFEINE_LIMIT'
    | 'CAFFEINE_LATE'
    | 'ALCOHOL_DETECTED'
    | 'SODIUM_HIGH'
    | 'ALLERGEN_DETECTED';
  message: string;
}

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

/** Constantes de alertas nutricionales (Paso 7.4) */
const CAFFEINE_DAILY_LIMIT_MG  = 400;
const CAFFEINE_LATE_LIMIT_MG   = 200;  // por encima de esto es tarde
const CAFFEINE_LATE_HOUR       = 18;   // >= 18:00 → alerta "too late for caffeine"
const SODIUM_HIGH_MG           = 2300;

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
    let food: any = null;
    let recipe: any = null;

    if (dto.foodId) {
      food = await this.prisma.food.findUnique({ where: { id: dto.foodId } });
      if (!food)
        throw new NotFoundException(`Alimento con id=${dto.foodId} no encontrado`);
    }
    if (dto.recipeId) {
      recipe = await this.prisma.recipe.findUnique({
        where:   { id: dto.recipeId },
        include: { items: { include: { food: true } } },
      });
      if (!recipe)
        throw new NotFoundException(`Receta con id=${dto.recipeId} no encontrada`);
    }

    const date = this.parseDate(dateStr);
    let log = await this.prisma.foodLog.findUnique({
      where:   { userId_date: { userId, date } },
      include: this.logInclude(),
    });
    if (!log) {
      log = await this.prisma.foodLog.create({
        data:    { userId, date },
        include: this.logInclude(),
      });
    }

    // ── Paso 7.4: Motor de alertas ────────────────────────────────────────
    const newItemMock = { food, recipe, quantityG: dto.quantityG, meal: dto.meal ?? 'OTHER' };
    const newMacros   = this.calcItemMacros(newItemMock);
    const newNutrients = this.calcItemNutrients(newItemMock);

    // Consumo previo del día (suma de todos los ítems ya en el log)
    const prevNutrients = this.calcConsumedNutrients(log?.items ?? []);

    const totalCaffeine = (prevNutrients.caffeineMg ?? 0) + (newNutrients.caffeineMg ?? 0);
    const totalAlcohol  = (prevNutrients.alcoholG   ?? 0) + (newNutrients.alcoholG   ?? 0);
    const totalSodium   = (prevNutrients.sodiumMg   ?? 0) + (newNutrients.sodiumMg   ?? 0);

    const currentHour = new Date().getHours();
    const alerts: DiaryAlert[] = [];

    // Cafeína > 400mg/día
    if (totalCaffeine > CAFFEINE_DAILY_LIMIT_MG) {
      alerts.push({
        type: 'CAFFEINE_LIMIT',
        message: `Daily caffeine limit exceeded (${Math.round(totalCaffeine)}mg / ${CAFFEINE_DAILY_LIMIT_MG}mg recommended).`,
      });
    }

    // Cafeína > 200mg después de las 18:00
    if (totalCaffeine > CAFFEINE_LATE_LIMIT_MG && currentHour >= CAFFEINE_LATE_HOUR) {
      alerts.push({
        type: 'CAFFEINE_LATE',
        message: `Consuming caffeine after ${CAFFEINE_LATE_HOUR}:00 may affect your sleep quality.`,
      });
    }

    // Alcohol detectado
    if (totalAlcohol > 0) {
      alerts.push({
        type: 'ALCOHOL_DETECTED',
        message: `This item contains alcohol (${newNutrients.alcoholG?.toFixed(1)}g). Total today: ${totalAlcohol.toFixed(1)}g.`,
      });
    }

    // Sodio alto (> 2300mg/día)
    if (totalSodium > SODIUM_HIGH_MG) {
      alerts.push({
        type: 'SODIUM_HIGH',
        message: `Daily sodium is high (${Math.round(totalSodium)}mg). Recommended max: ${SODIUM_HIGH_MG}mg.`,
      });
    }

    // Alérgenos: si el alimento tiene un alérgeno que el perfil del usuario declara
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    const userAllergens: string[] = (profile as any)?.allergens ?? [];
    const foodAllergens: string[] = [
      ...(food?.allergens ?? []),
      ...(recipe?.items?.flatMap((ri: any) => ri.food?.allergens ?? []) ?? []),
    ];
    const matched = foodAllergens.filter((a: string) =>
      userAllergens.some((ua) => ua.toLowerCase() === a.toLowerCase()),
    );
    if (matched.length > 0) {
      // Los alérgenos BLOQUEAN la inserción (spec: "Alergias bloquean el alimento")
      throw new ForbiddenException(
        `This item contains allergens you've declared: ${matched.join(', ')}. Item not added.`,
      );
    }
    // ─────────────────────────────────────────────────────────────────────

    this.logger.log(
      `Agregando item al log ${date.toISOString().split('T')[0]} ` +
      `(userId=${userId}, foodId=${dto.foodId ?? '-'}, recipeId=${dto.recipeId ?? '-'}, ` +
      `quantityG=${dto.quantityG}, meal=${dto.meal ?? 'OTHER'}, alerts=${alerts.length})`,
    );

    const item = await this.prisma.foodLogItem.create({
      data: {
        logId:     log.id,
        foodId:    dto.foodId   ?? null,
        recipeId:  dto.recipeId ?? null,
        quantityG: dto.quantityG,
        meal:      dto.meal ?? 'OTHER',
      },
      include: this.itemInclude(),
    });

    return { item, macros: newMacros, alerts };
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

    const adjusted = await this.dayTypes.getAdjustedTargets(userId, date);

    const log = await this.prisma.foodLog.findUnique({
      where:   { userId_date: { userId, date } },
      include: this.logInclude(),
    });

    const consumed = this.calcConsumed(log?.items ?? []);
    const targets  = adjusted.adjusted;

    return {
      date: date.toISOString().split('T')[0],
      targets,
      dayType: adjusted.dayType
        ? {
            name:         adjusted.dayType.name,
            color:        adjusted.dayType.color,
            tdeAdjustPct: adjusted.dayType.tdeAdjustPct,
            adjustFactor: adjusted.factor,
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

    const count    = days.length;
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

  /** Calcula macros (cal/prot/carbs/fat) de un ítem usando ratio de gramos */
  calcItemMacros(item: any) {
    const r = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    if (item.food) {
      const ratio  = item.quantityG / (item.food.servingSizeG || 100);
      r.calories  += item.food.calories * ratio;
      r.protein   += item.food.protein  * ratio;
      r.carbs     += item.food.carbs    * ratio;
      r.fat       += item.food.fat      * ratio;
    }

    if (item.recipe) {
      const portions = item.quantityG;
      const servings = item.recipe.servings || 1;
      for (const ri of item.recipe.items ?? []) {
        const grams  = ri.quantityG * (portions / servings);
        const ratio  = grams / (ri.food.servingSizeG || 100);
        r.calories  += ri.food.calories * ratio;
        r.protein   += ri.food.protein  * ratio;
        r.carbs     += ri.food.carbs    * ratio;
        r.fat       += ri.food.fat      * ratio;
      }
    }

    return {
      calories: this.round(r.calories),
      protein:  this.round(r.protein),
      carbs:    this.round(r.carbs),
      fat:      this.round(r.fat),
    };
  }

  /** Extrae nutrientes relevantes para alertas (cafeína, alcohol, sodio) */
  private calcItemNutrients(item: any): { caffeineMg: number; alcoholG: number; sodiumMg: number } {
    const r = { caffeineMg: 0, alcoholG: 0, sodiumMg: 0 };

    const extractFromFood = (food: any, ratio: number) => {
      if (!food) return;
      r.caffeineMg += (food.caffeineMg ?? 0) * ratio;
      r.alcoholG   += (food.alcoholG   ?? 0) * ratio;
      r.sodiumMg   += (food.sodiumMg   ?? 0) * ratio;
    };

    if (item.food) {
      const ratio = item.quantityG / (item.food.servingSizeG || 100);
      extractFromFood(item.food, ratio);
    }

    if (item.recipe) {
      const servings = item.recipe.servings || 1;
      for (const ri of item.recipe.items ?? []) {
        const grams = ri.quantityG * (item.quantityG / servings);
        const ratio = grams / (ri.food.servingSizeG || 100);
        extractFromFood(ri.food, ratio);
      }
    }

    return r;
  }

  /** Suma los nutrientes de alerta de todos los ítems previos del log */
  private calcConsumedNutrients(items: any[]): { caffeineMg: number; alcoholG: number; sodiumMg: number } {
    return items.reduce(
      (acc, item) => {
        const n = this.calcItemNutrients(item);
        return {
          caffeineMg: acc.caffeineMg + n.caffeineMg,
          alcoholG:   acc.alcoholG   + n.alcoholG,
          sodiumMg:   acc.sodiumMg   + n.sodiumMg,
        };
      },
      { caffeineMg: 0, alcoholG: 0, sodiumMg: 0 },
    );
  }

  calcConsumed(items: any[]) {
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
