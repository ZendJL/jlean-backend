import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class FastingService {
  constructor(private prisma: PrismaService) {}

  getConfig(userId: string) {
    return this.prisma.fastingConfig.findUnique({ where: { userId } })
  }

  setConfig(userId: string, dto: { fastHours: number; eatHours: number; eatStartHour: number; active: boolean }) {
    return this.prisma.fastingConfig.upsert({
      where:  { userId },
      create: { userId, ...dto },
      update: { ...dto },
    })
  }

  async getStatus(userId: string) {
    const config = await this.prisma.fastingConfig.findUnique({ where: { userId } })

    if (!config || !config.active) {
      return { active: false, fasting: false, inEatingWindow: false, windowLabel: '', eatStartHour: 0, eatEndHour: 0, message: 'No fasting config set' }
    }

    const now  = new Date()
    const hour = now.getHours()
    const eatEnd = (config.eatStartHour + config.eatHours) % 24

    const inEatingWindow =
      config.eatStartHour <= eatEnd
        ? hour >= config.eatStartHour && hour < eatEnd
        : hour >= config.eatStartHour || hour < eatEnd

    return {
      active: true,
      fasting: !inEatingWindow,
      inEatingWindow,
      windowLabel: `${config.fastHours}:${config.eatHours}`,
      eatStartHour: config.eatStartHour,
      eatEndHour: eatEnd,
      message: inEatingWindow
        ? `Eating window open until ${eatEnd}:00`
        : `Fasting — window opens at ${config.eatStartHour}:00`,
    }
  }
}
