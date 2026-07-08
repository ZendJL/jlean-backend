import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMealPlanDto } from './dto/create-meal-plan.dto'
import { AddMealPlanItemDto } from './dto/add-meal-plan-item.dto'
import { Meal } from '@prisma/client'

@Injectable()
export class MealPlanService {
  constructor(private prisma: PrismaService) {}

  // ─── CRUD Plan ────────────────────────────────────────────────────────

  findAll(userId: string) {
    return this.prisma.mealPlan.findMany({
      where:   { userId },
      orderBy: { weekStart: 'desc' },
      include: { items: { include: { food: true, recipe: true } } },
    })
  }

  async findOne(userId: string, id: string) {
    const plan = await this.prisma.mealPlan.findUnique({
      where:   { id },
      include: { items: { include: { food: true, recipe: true }, orderBy: { date: 'asc' } } },
    })
    if (!plan) throw new NotFoundException('Meal plan not found')
    if (plan.userId !== userId) throw new ForbiddenException()
    return plan
  }

  async create(userId: string, dto: CreateMealPlanDto) {
    return this.prisma.mealPlan.create({
      data: {
        userId,
        name:      dto.name,
        weekStart: new Date(dto.weekStart),
      },
      include: { items: true },
    })
  }

  async remove(userId: string, id: string) {
    const plan = await this.prisma.mealPlan.findUnique({ where: { id } })
    if (!plan) throw new NotFoundException('Meal plan not found')
    if (plan.userId !== userId) throw new ForbiddenException()
    return this.prisma.mealPlan.delete({ where: { id } })
  }

  // ─── Items ────────────────────────────────────────────────────────────

  async addItem(userId: string, planId: string, dto: AddMealPlanItemDto) {
    const plan = await this.prisma.mealPlan.findUnique({ where: { id: planId } })
    if (!plan) throw new NotFoundException('Meal plan not found')
    if (plan.userId !== userId) throw new ForbiddenException()
    if (!dto.foodId && !dto.recipeId) throw new BadRequestException('foodId or recipeId required')

    return this.prisma.mealPlanItem.create({
      data: {
        planId,
        date:      new Date(dto.date),
        meal:      dto.meal,
        foodId:    dto.foodId,
        recipeId:  dto.recipeId,
        quantityG: dto.quantityG,
      },
      include: { food: true, recipe: true },
    })
  }

  async removeItem(userId: string, planId: string, itemId: string) {
    const plan = await this.prisma.mealPlan.findUnique({ where: { id: planId } })
    if (!plan) throw new NotFoundException('Meal plan not found')
    if (plan.userId !== userId) throw new ForbiddenException()
    const item = await this.prisma.mealPlanItem.findUnique({ where: { id: itemId } })
    if (!item || item.planId !== planId) throw new NotFoundException('Item not found')
    return this.prisma.mealPlanItem.delete({ where: { id: itemId } })
  }

  // ─── Apply plan week to diary ─────────────────────────────────────────
  // Copia todos los items del plan al daily log real (FoodLog/FoodLogItem)

  async applyToLog(userId: string, planId: string) {
    const plan = await this.findOne(userId, planId)
    const results: { date: string; itemsAdded: number }[] = []

    // Agrupa items por fecha
    const byDate = new Map<string, typeof plan.items>()
    for (const item of plan.items) {
      const key = item.date.toISOString().split('T')[0]
      if (!byDate.has(key)) byDate.set(key, [])
      byDate.get(key)!.push(item)
    }

    for (const [dateStr, items] of byDate) {
      const date = new Date(dateStr)

      // Obtener o crear el FoodLog del día
      let log = await this.prisma.foodLog.findUnique({
        where: { userId_date: { userId, date } },
      })
      if (!log) {
        log = await this.prisma.foodLog.create({ data: { userId, date } })
      }

      // Crear snapshot de cada item del plan
      for (const item of items) {
        const food = item.food
        const factor = item.quantityG / (food?.servingSizeG ?? 100)
        await this.prisma.foodLogItem.create({
          data: {
            logId:           log.id,
            foodId:          item.foodId,
            recipeId:        item.recipeId,
            meal:            item.meal as Meal,
            quantityG:       item.quantityG,
            snapshotName:    food?.name ?? item.recipe?.name,
            snapshotCalories: food ? parseFloat((food.calories * factor).toFixed(1)) : null,
            snapshotProtein:  food ? parseFloat((food.protein  * factor).toFixed(1)) : null,
            snapshotCarbs:    food ? parseFloat((food.carbs    * factor).toFixed(1)) : null,
            snapshotFat:      food ? parseFloat((food.fat      * factor).toFixed(1)) : null,
          },
        })
      }
      results.push({ date: dateStr, itemsAdded: items.length })
    }

    return { planId, applied: results }
  }
}
