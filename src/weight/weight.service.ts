import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateWeightDto } from './dto/create-weight.dto'

@Injectable()
export class WeightService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, opts: { from?: string; to?: string; limit?: number }) {
    const { from, to, limit = 90 } = opts
    const entries = await this.prisma.weightLog.findMany({
      where: {
        userId,
        ...(from || to ? {
          recordedAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to   ? { lte: new Date(to)   } : {}),
          },
        } : {}),
      },
      orderBy: { recordedAt: 'asc' },
      take:    limit,
    })
    if (entries.length === 0) return { entries, stats: null }

    const weights   = entries.map(e => e.weightKg)
    const minWeight = Math.min(...weights)
    const maxWeight = Math.max(...weights)
    const delta     = parseFloat((weights[weights.length - 1] - weights[0]).toFixed(2))
    return {
      entries,
      stats: { minWeight, maxWeight, delta, count: entries.length },
    }
  }

  async create(userId: string, dto: CreateWeightDto) {
    const entry = await this.prisma.weightLog.create({
      data: {
        userId,
        weightKg:   dto.weightKg,
        note:       dto.note,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
      },
    })
    // Actualizar el perfil con el peso más reciente
    await this.prisma.profile.updateMany({
      where: { userId },
      data:  { weightKg: dto.weightKg },
    })
    return entry
  }

  async remove(userId: string, id: string) {
    const entry = await this.prisma.weightLog.findUnique({ where: { id } })
    if (!entry)            throw new NotFoundException('Weight entry not found')
    if (entry.userId !== userId) throw new ForbiddenException()
    return this.prisma.weightLog.delete({ where: { id } })
  }

  async getLast(userId: string) {
    return this.prisma.weightLog.findFirst({
      where:   { userId },
      orderBy: { recordedAt: 'desc' },
    })
  }
}
