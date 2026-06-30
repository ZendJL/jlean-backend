import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  constructor(private prisma: PrismaService) {}

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

  async addItem(userId: string, dto: AddItemDto, dateStr?: string) {
    if (!dto.foodId && !dto.recipeId)
      throw new BadRequestException('Se requiere foodId o recipeId');

    const date = this.parseDate(dateStr);
    let log = await this.prisma.foodLog.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (!log) log = await this.prisma.foodLog.create({ data: { userId, date } });

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
    await this.prisma.foodLogItem.delete({ where: { id: itemId } });
    return { deleted: true };
  }

  async getSummary(userId: string, dateStr?: string) {
    const date = this.parseDate(dateStr);
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    const log = await this.prisma.foodLog.findUnique({
      where: { userId_date: { userId, date } },
      include: this.logInclude(),
    });

    const consumed = this.calcConsumed(log?.items ?? []);
    return {
      date: date.toISOString().split('T')[0],
      targets: {
        calories: profile?.calorieTarget ?? 0,
        protein:  profile?.proteinTarget ?? 0,
        carbs:    profile?.carbTarget    ?? 0,
        fat:      profile?.fatTarget     ?? 0,
      },
      consumed,
      remaining: {
        calories: this.round((profile?.calorieTarget ?? 0) - consumed.calories),
        protein:  this.round((profile?.proteinTarget ?? 0) - consumed.protein),
        carbs:    this.round((profile?.carbTarget    ?? 0) - consumed.carbs),
        fat:      this.round((profile?.fatTarget     ?? 0) - consumed.fat),
      },
    };
  }

  private parseDate(dateStr?: string): Date {
    const d = dateStr ? new Date(dateStr) : new Date();
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
