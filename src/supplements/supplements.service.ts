import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SupplementsService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.supplement.findMany({
      where:   { userId, active: true },
      orderBy: { createdAt: 'asc' },
    })
  }

  create(userId: string, dto: any) {
    return this.prisma.supplement.create({ data: { userId, ...dto } })
  }

  update(userId: string, id: string, dto: any) {
    return this.prisma.supplement.update({ where: { id }, data: dto })
  }

  async remove(userId: string, id: string) {
    return this.prisma.supplement.delete({ where: { id } })
  }

  async logIntake(userId: string, supplementId: string) {
    return this.prisma.supplementLog.create({
      data: { userId, supplementId },
      include: { supplement: true },
    })
  }

  getTodayLogs(userId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return this.prisma.supplementLog.findMany({
      where: {
        userId,
        takenAt: { gte: today },
      },
      include: { supplement: true },
      orderBy: { takenAt: 'desc' },
    })
  }

  async getCaffeineToday(userId: string): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const logs = await this.prisma.supplementLog.findMany({
      where:   { userId, takenAt: { gte: today } },
      include: { supplement: true },
    })
    return logs.reduce((sum, l) => sum + (l.supplement.caffeinePerDoseMg ?? 0), 0)
  }
}
