import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, Request, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { DiaryService } from './diary.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('diary')
@UseGuards(JwtGuard)
export class DiaryController {
  constructor(private diary: DiaryService) {}

  /** GET /diary?date=2026-06-29  — log del día (crea si no existe) */
  @Get()
  getLog(
    @Request() req: any,
    @Query('date') date?: string,
  ) {
    return this.diary.getLog(req.user.id, date);
  }

  /** GET /diary/summary?date=2026-06-29  — totales vs targets */
  @Get('summary')
  getSummary(
    @Request() req: any,
    @Query('date') date?: string,
  ) {
    return this.diary.getSummary(req.user.id, date);
  }

  /** POST /diary/items  — agregar alimento o receta al día */
  @Post('items')
  addItem(
    @Request() req: any,
    @Body() body: { foodId?: string; recipeId?: string; quantityG: number; mealType?: string; date?: string },
  ) {
    const { date, ...dto } = body;
    return this.diary.addItem(req.user.id, dto, date);
  }

  /** PUT /diary/items/:id  — editar cantidad o meal type */
  @Put('items/:id')
  updateItem(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { quantityG?: number; mealType?: string },
  ) {
    return this.diary.updateItem(req.user.id, id, body);
  }

  /** DELETE /diary/items/:id */
  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  deleteItem(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    return this.diary.deleteItem(req.user.id, id);
  }
}
