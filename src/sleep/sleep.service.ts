import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SleepService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string, limit = 14) {
    return this.prisma.sleepEntry.findMany({
      where:   { userId },
      orderBy: { bedtime: 'desc' },
      take:    limit,
    })
  }

  async create(userId: string, dto: { bedtime: string; wakeTime: string; qualityScore?: number }) {
    const bedtime  = new Date(dto.bedtime)
    const wakeTime = new Date(dto.wakeTime)
    const durationMin = Math.round((wakeTime.getTime() - bedtime.getTime()) / 60000)

    return this.prisma.sleepEntry.create({
      data: {
        userId,
        bedtime,
        wakeTime,
        durationMin,
        qualityScore: dto.qualityScore,
      },
    })
  }

  async remove(userId: string, id: string) {
    const entry = await this.prisma.sleepEntry.findUnique({ where: { id } })
    if (!entry)            throw new NotFoundException('Sleep entry not found')
    if (entry.userId !== userId) throw new ForbiddenException()
    return this.prisma.sleepEntry.delete({ where: { id } })
  }

  async getLast(userId: string) {
    const entry = await this.prisma.sleepEntry.findFirst({
      where:   { userId },
      orderBy: { bedtime: 'desc' },
    })
    if (!entry) return null

    const hoursSlept = Math.round(entry.durationMin / 6) / 10
    let recommendation = 'Good rest!'
    if (hoursSlept < 6)      recommendation = 'Short sleep — prioritize rest tonight.'
    else if (hoursSlept < 7) recommendation = 'Slightly under 7h — aim for more tonight.'
    else if (hoursSlept > 9) recommendation = 'Long sleep — check if you feel rested.'

    return { ...entry, hoursSlept, recommendation }
  }
}
