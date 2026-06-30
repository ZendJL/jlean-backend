import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplementDto } from './dto/create-supplement.dto';
import { LogSupplementDto } from './dto/log-supplement.dto';

@Injectable()
export class SupplementsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.supplement.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  create(userId: string, dto: CreateSupplementDto) {
    return this.prisma.supplement.create({
      data: { ...dto, userId },
    });
  }

  async update(userId: string, id: string, dto: Partial<CreateSupplementDto>) {
    await this.assertOwner(userId, id);
    return this.prisma.supplement.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.assertOwner(userId, id);
    return this.prisma.supplement.delete({ where: { id } });
  }

  logIntake(userId: string, dto: LogSupplementDto) {
    return this.prisma.supplementLog.create({
      data: {
        userId,
        supplementId: dto.supplementId,
        takenAt: dto.takenAt ? new Date(dto.takenAt) : new Date(),
        notes: dto.notes,
      },
    });
  }

  async todayLogs(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.supplementLog.findMany({
      where: {
        userId,
        takenAt: { gte: today, lt: tomorrow },
      },
      include: { supplement: true },
      orderBy: { takenAt: 'asc' },
    });
  }

  private async assertOwner(userId: string, id: string) {
    const s = await this.prisma.supplement.findUnique({ where: { id } });
    if (!s) throw new NotFoundException();
    if (s.userId !== userId) throw new ForbiddenException();
  }
}
