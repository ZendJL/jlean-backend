import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSleepDto } from './dto/create-sleep.dto';

@Injectable()
export class SleepService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string, limit = 30) {
    return this.prisma.sleepEntry.findMany({
      where: { userId },
      orderBy: { bedtime: 'desc' },
      take: limit,
    });
  }

  async create(userId: string, dto: CreateSleepDto) {
    const bedtime  = new Date(dto.bedtime);
    const wakeTime = new Date(dto.wakeTime);
    const durationMin = Math.round((wakeTime.getTime() - bedtime.getTime()) / 60000);

    return this.prisma.sleepEntry.create({
      data: {
        userId,
        bedtime,
        wakeTime,
        durationMin,
        qualityScore:  dto.qualityScore,
        deepSleepMin:  dto.deepSleepMin,
        remSleepMin:   dto.remSleepMin,
        awakensCount:  dto.awakensCount,
      },
    });
  }

  async remove(userId: string, id: string) {
    const entry = await this.prisma.sleepEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException();
    if (entry.userId !== userId) throw new ForbiddenException();
    return this.prisma.sleepEntry.delete({ where: { id } });
  }

  async getLast(userId: string) {
    const entry = await this.prisma.sleepEntry.findFirst({
      where: { userId },
      orderBy: { bedtime: 'desc' },
    });

    if (!entry) return null;

    const hoursSlept = entry.durationMin / 60;
    const recommendation = hoursSlept < 6
      ? 'Sleep debt detected. Prioritize recovery today.'
      : hoursSlept < 7
      ? 'Below optimal sleep. Consider an earlier bedtime.'
      : 'Good sleep. Recovery looks solid.';

    return { ...entry, hoursSlept: Math.round(hoursSlept * 10) / 10, recommendation };
  }
}
