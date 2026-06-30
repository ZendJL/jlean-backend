import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AddItemDto {
  foodId?: string;
  recipeId?: string;
  quantityG: number;
  mealType?: string;
}

interface UpdateItemDto {
  quantityG?: number;
  mealType?: string;
}

@Injectable()
export class DiaryService {
  constructor(private prisma: PrismaService) {}

  // ─── Obtener o crear el log del día ───────────────────────────────────────
  async getLog(userId: string, dateStr?: string) {
    const date = this.parseDate(dateStr);

    let log = await this.prisma.foodLog.findUnique({
      where: { userId_date: { userId, date } },
      include: this.logInclude(),
    });

    if (!log) {
      log = await this.prisma.foodLog.create({
        data: { userId, date },
        include: this.logInclude(),
      });
    }

    return this.formatLog(log);
  }

  // ─── Agregar item al log ──────────────────────────────────────────────────
  async addItem(userId: string, dto: AddItemDto, dateStr?: string) {
    if (!dto.foodId && !dto.recipeId) {
      throw new BadRequestException('Se requiere foodId o recipeId');
    }

    const date = this.parseDate(dateStr);

    // Obtener o crear el log del día
    let log = await this.prisma.foodLog.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (!log) {
      log = await this.prisma.foodLog.create({ data: { userId, date } });
    }

    const item = await this.prisma.foodLogItem.create({
      data: {
        logId:     log.id,
        foodId:    dto.foodId   ?? null,
        recipeId:  dto.recipeId ?? null,
        quantityG: dto.quantityG,
        mealType:  dto.mealType ?? 'OTHER',
      },
      include: { food: true, recipe: true },
    });

    return item;
  }

  // ─── Editar item ──────────────────────────────────────────────────────────
  async updateItem(userId: string, itemId: string, dto: UpdateItemDto) {
    const item = await this.prisma.foodLogItem.findUnique({
      where: { id: itemId },
      include: { log: true },
    });
    if (!item || item.log.userId !== userId) {
      throw new NotFoundException('Item no encontrado');
    }

    return this.prisma.foodLogItem.update({
      where: { id: itemId },
      data: {
        ...(dto.quantityG !== undefined && { quantityG: dto.quantityG }),
        ...(dto.mealType  !== undefined && { mealType:  dto.mealType }),
      },
      include: { food: true, recipe: true },
    });
  }

  // ─── Eliminar item ────────────────────────────────────────────────────────
  async deleteItem(userId: string, itemId: string) {
    const item = await this.prisma.foodLogItem.findUnique({
      where: { id: itemId },
      include: { log: true },
    });
    if (!item || item.log.userId !== userId) {
      throw new NotFoundException('Item no encontrado');
    }

    await this.prisma.foodLogItem.delete({ where: { id: itemId } });
    return { deleted: true };
  }

  // ─── Resumen del día ──────────────────────────────────────────────────────
  async getSummary(userId: string, dateStr?: string) {
    const date = this.parseDate(dateStr);

    const profile = await this.prisma.profile.findUnique({ where: { userId } });

    const log = await this.prisma.foodLog.findUnique({
      where: { userId_date: { userId, date } },
      include: this.logInclude(),
    });

    const consumed = this.calcConsumed(log?.items ?? []);
    const round = (n: number) => Math.round(n * 10) / 10;

    return {
      date: date.toISOString().split('T')[0],
      targets: {
        calories: profile?.calorieTarget ?? 0,
        protein:  profile?.proteinTarget ?? 0,
        carbs:    profile?.carbTarget    ?? 0,
        fat:      profile?.fatTarget     ?? 0,
      },
      consumed: {
        calories: round(consumed.calories),
        protein:  round(consumed.protein),
        carbs:    round(consumed.carbs),
        fat:      round(consumed.fat),
      },
      remaining: {
        calories: round((profile?.calorieTarget ?? 0) - consumed.calories),
        protein:  round((profile?.proteinTarget ?? 0) - consumed.protein),
        carbs:    round((profile?.carbTarget    ?? 0) - consumed.carbs),
        fat:      round((profile?.fatTarget     ?? 0) - consumed.fat),
      },
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private parseDate(dateStr?: string): Date {
    const d = dateStr ? new Date(dateStr) : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private logInclude() {
    return {
      items: {
        include: {
          food: true,
          recipe: {
            include: { items: { include: { food: true } } },
          },
        },
        orderBy: { createdAt: 'asc' as const },
      },
    };
  }

  private formatLog(log: any) {
    const items = (log.items ?? []).map((item: any) => ({
      id:        item.id,
      mealType:  item.mealType,
      quantityG: item.quantityG,
      food:      item.food   ? this.formatFood(item.food, item.quantityG)   : null,
      recipe:    item.recipe ? { id: item.recipe.id, name: item.recipe.name } : null,
      macros:    this.calcItemMacros(item),
    }));

    return {
      id:   log.id,
      date: log.date.toISOString().split('T')[0],
      items,
    };
  }

  private formatFood(food: any, quantityG: number) {
    const ratio = quantityG / (food.servingSizeG || 100);
    return {
      id:       food.id,
      name:     food.name,
      brand:    food.brand,
      per100g: {
        calories: food.calories,
        protein:  food.protein,
        carbs:    food.carbs,
        fat:      food.fat,
      },
      forQuantity: {
        calories: Math.round(food.calories * ratio * 10) / 10,
        protein:  Math.round(food.protein  * ratio * 10) / 10,
        carbs:    Math.round(food.carbs    * ratio * 10) / 10,
        fat:      Math.round(food.fat      * ratio * 10) / 10,
      },
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
      for (const ri of item.recipe.items ?? []) {
        const ratio = (item.quantityG / (item.recipe.servings || 1)) / (ri.food.servingSizeG || 100) * ri.quantityG;
        r.calories += ri.food.calories * ratio / ri.quantityG;
        r.protein  += ri.food.protein  * ratio / ri.quantityG;
        r.carbs    += ri.food.carbs    * ratio / ri.quantityG;
        r.fat      += ri.food.fat      * ratio / ri.quantityG;
      }
    }
    const round = (n: number) => Math.round(n * 10) / 10;
    return { calories: round(r.calories), protein: round(r.protein), carbs: round(r.carbs), fat: round(r.fat) };
  }

  private calcConsumed(items: any[]) {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const item of items) {
      const m = this.calcItemMacros(item);
      totals.calories += m.calories;
      totals.protein  += m.protein;
      totals.carbs    += m.carbs;
      totals.fat      += m.fat;
    }
    return totals;
  }
}
