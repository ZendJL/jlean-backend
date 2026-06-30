import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Perfil y metas
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    const goals = await this.prisma.userGoal.findFirst({
      where: { userId },
      orderBy: { effectiveFrom: 'desc' },
    });

    // Log del día
    const dailyLog = await this.prisma.dailyLog.findFirst({
      where: {
        userId,
        date: { gte: today, lt: tomorrow },
      },
      include: {
        items: {
          include: { food: true },
        },
      },
    });

    // Calcular consumo total
    const consumed = {
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
    };

    // Agrupar por meal type
    const mealMap: Record<string, { calories: number; proteinG: number; carbsG: number; fatG: number; items: any[] }> = {};

    if (dailyLog?.items) {
      for (const item of dailyLog.items) {
        const factor = item.quantityG / 100;
        const cal  = (item.food?.caloriesPer100g ?? 0) * factor;
        const prot = (item.food?.proteinPer100g  ?? 0) * factor;
        const carb = (item.food?.carbsPer100g    ?? 0) * factor;
        const fat  = (item.food?.fatPer100g      ?? 0) * factor;
        const fib  = (item.food?.fiberPer100g    ?? 0) * factor;

        consumed.calories  += cal;
        consumed.proteinG  += prot;
        consumed.carbsG    += carb;
        consumed.fatG      += fat;
        consumed.fiberG    += fib;

        const meal = item.mealType ?? 'OTHER';
        if (!mealMap[meal]) {
          mealMap[meal] = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, items: [] };
        }
        mealMap[meal].calories  += cal;
        mealMap[meal].proteinG  += prot;
        mealMap[meal].carbsG    += carb;
        mealMap[meal].fatG      += fat;
        mealMap[meal].items.push({
          id:        item.id,
          foodName:  item.food?.name ?? 'Unknown',
          quantityG: item.quantityG,
          calories:  Math.round(cal),
          proteinG:  Math.round(prot * 10) / 10,
          carbsG:    Math.round(carb * 10) / 10,
          fatG:      Math.round(fat  * 10) / 10,
          mealType:  meal,
        });
      }
    }

    // Targets
    const targets = {
      calories:  goals?.targetCalories  ?? 2000,
      proteinG:  goals?.targetProteinG  ?? 150,
      carbsG:    goals?.targetCarbsG    ?? 200,
      fatG:      goals?.targetFatG      ?? 65,
    };

    // Remaining
    const remaining = {
      calories: Math.max(0, targets.calories  - Math.round(consumed.calories)),
      proteinG: Math.max(0, targets.proteinG  - Math.round(consumed.proteinG * 10) / 10),
      carbsG:   Math.max(0, targets.carbsG    - Math.round(consumed.carbsG   * 10) / 10),
      fatG:     Math.max(0, targets.fatG      - Math.round(consumed.fatG     * 10) / 10),
    };

    // Porcentajes
    const progress = {
      calories: targets.calories > 0 ? Math.min(100, Math.round((consumed.calories  / targets.calories)  * 100)) : 0,
      proteinG: targets.proteinG > 0 ? Math.min(100, Math.round((consumed.proteinG  / targets.proteinG)  * 100)) : 0,
      carbsG:   targets.carbsG   > 0 ? Math.min(100, Math.round((consumed.carbsG    / targets.carbsG)    * 100)) : 0,
      fatG:     targets.fatG     > 0 ? Math.min(100, Math.round((consumed.fatG      / targets.fatG)      * 100)) : 0,
    };

    // Insights determinísticos
    const insights: string[] = [];
    const hour = new Date().getHours();

    if (progress.calories < 30 && hour >= 14) {
      insights.push('You\'ve consumed less than 30% of your calories. Consider a larger meal.');
    }
    if (progress.proteinG < 50 && hour >= 18) {
      insights.push(`You still need ${remaining.proteinG}g of protein. Consider a high-protein snack.`);
    }
    if (consumed.carbsG > targets.carbsG) {
      insights.push('You\'ve exceeded your carb target for today.');
    }
    if (progress.calories >= 95) {
      insights.push('You\'ve reached your calorie goal for today. Great job!');
    }

    return {
      date: today.toISOString().split('T')[0],
      targets,
      consumed: {
        calories: Math.round(consumed.calories),
        proteinG: Math.round(consumed.proteinG * 10) / 10,
        carbsG:   Math.round(consumed.carbsG   * 10) / 10,
        fatG:     Math.round(consumed.fatG     * 10) / 10,
        fiberG:   Math.round(consumed.fiberG   * 10) / 10,
      },
      remaining,
      progress,
      meals: mealMap,
      insights,
      profile: profile ? {
        weightKg:      profile.weightKg,
        heightCm:      profile.heightCm,
        activityLevel: profile.activityLevel,
        goal:          profile.goal,
      } : null,
    };
  }
}
