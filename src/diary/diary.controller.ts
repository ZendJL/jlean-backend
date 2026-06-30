import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, Request, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { DiaryService } from './diary.service';
import { JwtGuard } from '../auth/jwt.guard';
import { Meal } from '@prisma/client';

@Controller('diary')
@UseGuards(JwtGuard)
export class DiaryController {
  constructor(private diary: DiaryService) {}

  @Get()
  getLog(@Request() req: any, @Query('date') date?: string) {
    return this.diary.getLog(req.user.id, date);
  }

  @Get('summary')
  getSummary(@Request() req: any, @Query('date') date?: string) {
    return this.diary.getSummary(req.user.id, date);
  }

  @Post('items')
  addItem(
    @Request() req: any,
    @Body() body: { foodId?: string; recipeId?: string; quantityG: number; meal?: Meal; date?: string },
  ) {
    const { date, ...dto } = body;
    return this.diary.addItem(req.user.id, dto, date);
  }

  @Put('items/:id')
  updateItem(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { quantityG?: number; meal?: Meal },
  ) {
    return this.diary.updateItem(req.user.id, id, body);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  deleteItem(@Request() req: any, @Param('id') id: string) {
    return this.diary.deleteItem(req.user.id, id);
  }
}
