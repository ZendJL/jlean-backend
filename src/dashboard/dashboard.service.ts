import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getToday(userId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const profile = await this.prisma.profile.findUnique({ where: { userId } })

    const log = await this.prisma.foodLog.findFirst({
      where: { userId, date: today },
      include: { items: { include: { food: true, recipe: true } } },
    })

    const supplementLogs = await this.prisma.supplementLog.findMany({
      where: { userId, takenAt: { gte: today } },
      include: { supplement: true },
    })

    const supplements = await this.prisma.supplement.findMany({
      where: { userId, active: true },
    })

    const fastingConfig = await this.prisma.fastingConfig.findUnique({ where: { userId } })

    const lastSleep = await this.prisma.sleepEntry.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const items = log?.items ?? []

    // Group items by meal (enum: BREAKFAST | LUNCH | DINNER | SNACK | OTHER)
    const meals: Record<string, typeof items> = {}
    for (const item of items) {
      const key = item.meal ?? 'OTHER'
      if (!meals[key]) meals[key] = []
      meals[key].push(item)
    }

    const consumed = items.reduce(
      (acc, item) => ({
        calories: acc.calories + (item.snapshotCalories ?? 0),
        protein:  acc.protein  + (item.snapshotProtein  ?? 0),
        carbs:    acc.carbs    + (item.snapshotCarbs    ?? 0),
        fat:      acc.fat      + (item.snapshotFat      ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )

    const targets = {
      calories: profile?.calorieTarget ?? 2000,
      protein:  profile?.proteinTarget ?? 150,
      carbs:    profile?.carbTarget    ?? 200,
      fat:      profile?.fatTarget     ?? 65,
    }

    const remaining = {
      calories: targets.calories - consumed.calories,
      protein:  targets.protein  - consumed.protein,
      carbs:    targets.carbs    - consumed.carbs,
      fat:      targets.fat      - consumed.fat,
    }

    const takenIds           = new Set(supplementLogs.map(l => l.supplementId))
    const pendingSupplements = supplements.filter(s => !takenIds.has(s.id))

    let fastingStatus: Record<string, unknown> | null = null
    if (fastingConfig?.active) {
      const hour   = new Date().getHours()
      const eatEnd = (fastingConfig.eatStartHour + fastingConfig.eatHours) % 24
      const inEatingWindow =
        fastingConfig.eatStartHour <= eatEnd
          ? hour >= fastingConfig.eatStartHour && hour < eatEnd
          : hour >= fastingConfig.eatStartHour || hour < eatEnd

      fastingStatus = {
        active: true,
        fasting: !inEatingWindow,
        inEatingWindow,
        windowLabel: `${fastingConfig.fastHours}:${fastingConfig.eatHours}`,
        eatStartHour: fastingConfig.eatStartHour,
        eatEndHour: eatEnd,
        message: inEatingWindow
          ? `Eating window open until ${eatEnd}:00`
          : `Fasting — window opens at ${fastingConfig.eatStartHour}:00`,
      }
    }

    return {
      date: today,
      targets,
      consumed,
      remaining,
      meals,           // { BREAKFAST: [...], LUNCH: [...], ... }
      logItems: items, // flat array kept for backwards compat
      pendingSupplements,
      takenSupplements: supplementLogs,
      fastingStatus,
      lastSleep,
    }
  }
}
