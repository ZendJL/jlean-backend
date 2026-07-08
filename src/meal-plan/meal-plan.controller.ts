import { Controller, Get, Post, Delete, Body, Param, Request, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { MealPlanService } from './meal-plan.service'
import { CreateMealPlanDto } from './dto/create-meal-plan.dto'
import { AddMealPlanItemDto } from './dto/add-meal-plan-item.dto'

@Controller('meal-plans')
@UseGuards(JwtAuthGuard)
export class MealPlanController {
  constructor(private readonly svc: MealPlanService) {}

  // Plans
  @Get()                    list    (@Request() req: any)                               { return this.svc.findAll(req.user.sub) }
  @Get(':id')               getOne  (@Request() req: any, @Param('id') id: string)     { return this.svc.findOne(req.user.sub, id) }
  @Post()                   create  (@Request() req: any, @Body() dto: CreateMealPlanDto) { return this.svc.create(req.user.sub, dto) }
  @Delete(':id')            remove  (@Request() req: any, @Param('id') id: string)     { return this.svc.remove(req.user.sub, id) }

  // Items
  @Post(':id/items')        addItem (@Request() req: any, @Param('id') id: string, @Body() dto: AddMealPlanItemDto) {
    return this.svc.addItem(req.user.sub, id, dto)
  }
  @Delete(':id/items/:itemId') removeItem(@Request() req: any, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.svc.removeItem(req.user.sub, id, itemId)
  }

  // Apply whole plan week to the actual daily log
  @Post(':id/apply-to-log') applyToLog(@Request() req: any, @Param('id') id: string) {
    return this.svc.applyToLog(req.user.sub, id)
  }
}
