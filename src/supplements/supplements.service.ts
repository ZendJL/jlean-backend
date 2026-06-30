import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SupplementsService {
  private readonly logger = new Logger(SupplementsService.name)

  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.supplement.findMany({
      where:   { userId, active: true },
      orderBy: { createdAt: 'asc' },
    })
  }

  create(userId: string, dto: any) {
    this.logger.log(`Creando suplemento para userId=${userId}: ${dto.name}`)
    return this.prisma.supplement.create({ data: { userId, ...dto } })
  }

  // B-02 FIX: verificar ownership antes de actualizar
  async update(userId: string, id: string, dto: any) {
    const supp = await this.prisma.supplement.findUnique({ where: { id } })
    if (!supp) throw new NotFoundException('Suplemento no encontrado')
    if (supp.userId !== userId)
      throw new ForbiddenException('No tienes permiso para modificar este suplemento')
    this.logger.log(`Actualizando suplemento id=${id} para userId=${userId}`)
    return this.prisma.supplement.update({ where: { id }, data: dto })
  }

  // B-02 FIX: verificar ownership antes de borrar
  async remove(userId: string, id: string) {
    const supp = await this.prisma.supplement.findUnique({ where: { id } })
    if (!supp) throw new NotFoundException('Suplemento no encontrado')
    if (supp.userId !== userId)
      throw new ForbiddenException('No tienes permiso para eliminar este suplemento')
    this.logger.log(`Eliminando suplemento id=${id} para userId=${userId}`)
    return this.prisma.supplement.delete({ where: { id } })
  }

  async logIntake(userId: string, supplementId: string) {
    // Verificar que el suplemento existe y pertenece al usuario
    const supp = await this.prisma.supplement.findUnique({ where: { id: supplementId } })
    if (!supp) throw new NotFoundException('Suplemento no encontrado')
    if (supp.userId !== userId)
      throw new ForbiddenException('No tienes permiso para registrar este suplemento')
    this.logger.log(`Registrando ingesta de suplemento id=${supplementId} para userId=${userId}`)
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
