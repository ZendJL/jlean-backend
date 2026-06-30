import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FastingWindowDto } from './dto/fasting-window.dto';

@Injectable()
export class FastingService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(userId: string) {
    return this.prisma.fastingConfig.findUnique({ where: { userId } });
  }

  async setConfig(userId: string, dto: FastingWindowDto) {
    return this.prisma.fastingConfig.upsert({
      where:  { userId },
      create: { userId, ...dto, active: true },
      update: { ...dto, active: true },
    });
  }

  async getStatus(userId: string) {
    const config = await this.prisma.fastingConfig.findUnique({ where: { userId } });
    if (!config || !config.active) {
      return { active: false, fasting: false, message: 'No fasting window configured.' };
    }

    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const eatEnd = (config.eatStartHour + config.eatHours) % 24;
    const inEatingWindow =
      config.eatStartHour < eatEnd
        ? currentHour >= config.eatStartHour && currentHour < eatEnd
        : currentHour >= config.eatStartHour || currentHour < eatEnd;

    const fastingNow = !inEatingWindow;
    const windowLabel = `${config.fastHours}:${config.eatHours}`;

    let message: string;
    if (fastingNow) {
      const hoursUntilEat = config.eatStartHour > currentHour
        ? config.eatStartHour - currentHour
        : 24 - currentHour + config.eatStartHour;
      message = `Fasting window active (${windowLabel}). Eating window opens in ${Math.round(hoursUntilEat * 10) / 10}h.`;
    } else {
      const hoursUntilFast = eatEnd > currentHour ? eatEnd - currentHour : 24 - currentHour + eatEnd;
      message = `Eating window open (${windowLabel}). Fasting starts in ${Math.round(hoursUntilFast * 10) / 10}h.`;
    }

    return {
      active: true,
      fasting: fastingNow,
      inEatingWindow,
      windowLabel,
      eatStartHour: config.eatStartHour,
      eatEndHour: eatEnd,
      message,
    };
  }
}
