import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DashboardInsight {
  type: string;
  level: 'info' | 'warning' | 'success';
  message: string;
}

const CAFFEINE_LATE_LIMIT_MG = 200;
const CAFFEINE_LATE_HOUR     = 18;

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const profile = await this.prisma.profile.findUnique({ where: { userId } });

    const log = await this.prisma.foodLog.findFirst({
      where:   { userId, date: today },
      include: { items: { include: { food: true, recipe: { include: { items: { include: { food: true } } } } } } },
    });

    const supplementLogs = await this.prisma.supplementLog.findMany({
      where:   { userId, takenAt: { gte: today } },
      include: { supplement: true },
    });

    const supplements = await this.prisma.supplement.findMany({
      where: { userId, active: true },
    });

    const fastingConfig = await this.prisma.fastingConfig.findUnique({ where: { userId } });

    const lastSleep = await this.prisma.sleepEntry.findFirst({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
    });

    const items = log?.items ?? [];

    // Agrupar por meal
    const meals: Record<string, typeof items> = {};
    for (const item of items) {
      const key = item.meal ?? 'OTHER';
      if (!meals[key]) meals[key] = [];
      meals[key].push(item);
    }

    // Bug-3: calcular consumed con ratio-based (igual que DiaryService)
    const consumed = this.calcConsumed(items);

    const targets = {
      calories: profile?.calorieTarget ?? 2000,
      protein:  profile?.proteinTarget ?? 150,
      carbs:    profile?.carbTarget    ?? 200,
      fat:      profile?.fatTarget     ?? 65,
    };

    const remaining = {
      calories: this.round(targets.calories - consumed.calories),
      protein:  this.round(targets.protein  - consumed.protein),
      carbs:    this.round(targets.carbs    - consumed.carbs),
      fat:      this.round(targets.fat      - consumed.fat),
    };

    const takenIds           = new Set(supplementLogs.map((l: any) => l.supplementId));
    const pendingSupplements = supplements.filter((s: any) => !takenIds.has(s.id));

    // Cafeína total del día (para alerta nocturna)
    const caffeineMgToday = this.calcCaffeine(items);

    // ── Paso 8.2: Insights determinísticos ──────────────────────────────────
    const insights: DashboardInsight[] = [];
    const currentHour = new Date().getHours();

    // Macros
    if (remaining.protein < 0) {
      insights.push({ type: 'PROTEIN_EXCEEDED', level: 'warning', message: `Protein target exceeded by ${Math.abs(remaining.protein).toFixed(1)}g.` });
    } else if (targets.protein > 0 && remaining.protein > targets.protein * 0.3) {
      insights.push({ type: 'PROTEIN_AVAILABLE', level: 'info', message: `You still have ${remaining.protein.toFixed(1)}g of protein available today.` });
    }

    if (remaining.carbs < 0) {
      insights.push({ type: 'CARBS_EXCEEDED', level: 'warning', message: `Carbs target exceeded by ${Math.abs(remaining.carbs).toFixed(1)}g.` });
    } else if (targets.carbs > 0 && remaining.carbs > targets.carbs * 0.3) {
      insights.push({ type: 'CARBS_AVAILABLE', level: 'info', message: `You still have ${remaining.carbs.toFixed(1)}g of carbs available today.` });
    }

    if (remaining.fat < 0) {
      insights.push({ type: 'FAT_EXCEEDED', level: 'warning', message: `Fat target exceeded by ${Math.abs(remaining.fat).toFixed(1)}g.` });
    }

    // Calorías
    if (remaining.calories <= 0) {
      insights.push({ type: 'CALORIE_GOAL_REACHED', level: 'warning', message: `You have reached your calorie goal for today.` });
    } else if (targets.calories > 0 && remaining.calories < targets.calories * 0.1) {
      insights.push({ type: 'CALORIE_APPROACHING', level: 'warning', message: `Approaching your calorie goal — only ${Math.round(remaining.calories)} kcal left.` });
    } else if (targets.calories > 0 && remaining.calories > targets.calories * 0.25) {
      insights.push({ type: 'CALORIE_BUDGET_AVAILABLE', level: 'info', message: `${Math.round(remaining.calories)} kcal remaining for today.` });
    }

    // Cafeína nocturna
    if (caffeineMgToday > CAFFEINE_LATE_LIMIT_MG && currentHour >= CAFFEINE_LATE_HOUR) {
      insights.push({ type: 'CAFFEINE_LATE', level: 'warning', message: `You've had ${Math.round(caffeineMgToday)}mg of caffeine today. Avoid more after ${CAFFEINE_LATE_HOUR}:00 to protect your sleep.` });
    }

    // Suplementos
    if (supplements.length > 0 && pendingSupplements.length === 0) {
      insights.push({ type: 'SUPPLEMENTS_DONE', level: 'success', message: `All supplements taken for today. Great job!` });
    } else if (pendingSupplements.length > 0) {
      const names = pendingSupplements.map((s: any) => s.name).join(', ');
      insights.push({ type: 'SUPPLEMENTS_PENDING', level: 'info', message: `Pending supplements: ${names}.` });
    }
    // ────────────────────────────────────────────────────────────────────

    let fastingStatus: Record<string, unknown> | null = null;
    if (fastingConfig?.active) {
      const hour   = new Date().getHours();
      const eatEnd = (fastingConfig.eatStartHour + fastingConfig.eatHours) % 24;
      const inEatingWindow =
        fastingConfig.eatStartHour <= eatEnd
          ? hour >= fastingConfig.eatStartHour && hour < eatEnd
          : hour >= fastingConfig.eatStartHour || hour < eatEnd;

      fastingStatus = {
        active: true,
        fasting: !inEatingWindow,
        inEatingWindow,
        windowLabel:  `${fastingConfig.fastHours}:${fastingConfig.eatHours}`,
        eatStartHour: fastingConfig.eatStartHour,
        eatEndHour:   eatEnd,
        message: inEatingWindow
          ? `Eating window open until ${eatEnd}:00`
          : `Fasting — window opens at ${fastingConfig.eatStartHour}:00`,
      };
    }

    return {
      date: today,
      targets,
      consumed,
      remaining,
      meals,
      logItems: items,
      insights,
      pendingSupplements,
      takenSupplements: supplementLogs,
      fastingStatus,
      lastSleep,
    };
  }

  // ── Helpers privados ─────────────────────────────────────────────────────

  /** Calcula macros de todos los ítems del log usando ratio-based (igual que DiaryService) */
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

  private calcItemMacros(item: any) {
    const r = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    if (item.food) {
      const ratio = item.quantityG / (item.food.servingSizeG || 100);
      r.calories += item.food.calories * ratio;
      r.protein  += item.food.protein  * ratio;
      r.carbs    += item.food.carbs    * ratio;
      r.fat      += item.food.fat      * ratio;
    }
    if (item.recipe) {
      const servings = item.recipe.servings || 1;
      for (const ri of item.recipe?.items ?? []) {
        const grams = ri.quantityG * (item.quantityG / servings);
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

  /** Suma cafeína total del día desde los ítems del log */
  private calcCaffeine(items: any[]): number {
    return items.reduce((acc, item) => {
      if (item.food) {
        const ratio = item.quantityG / (item.food.servingSizeG || 100);
        return acc + (item.food.caffeineMg ?? 0) * ratio;
      }
      if (item.recipe) {
        const servings = item.recipe.servings || 1;
        for (const ri of item.recipe?.items ?? []) {
          const grams = ri.quantityG * (item.quantityG / servings);
          const ratio = grams / (ri.food.servingSizeG || 100);
          acc += (ri.food.caffeineMg ?? 0) * ratio;
        }
      }
      return acc;
    }, 0);
  }

  private round(n: number) {
    return Math.round(n * 10) / 10;
  }
}
