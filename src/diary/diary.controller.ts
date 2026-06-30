import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, Request, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { DiaryService } from './diary.service';
import { AddDiaryItemDto } from './dto/add-item.dto';
import { UpdateDiaryItemDto } from './dto/update-item.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('diary')
@UseGuards(JwtGuard)
export class DiaryController {
  constructor(private diary: DiaryService) {}

  /** GET /diary?date=YYYY-MM-DD */
  @Get()
  getLog(@Request() req: any, @Query('date') date?: string) {
    return this.diary.getLog(req.user.id, date);
  }

  /** GET /diary/summary?date=YYYY-MM-DD */
  @Get('summary')
  getSummary(@Request() req: any, @Query('date') date?: string) {
    return this.diary.getSummary(req.user.id, date);
  }

  /** GET /diary/history?from=YYYY-MM-DD&to=YYYY-MM-DD */
  @Get('history')
  getHistory(@Request() req: any, @Query() query: HistoryQueryDto) {
    return this.diary.getHistory(req.user.id, query.from, query.to);
  }

  @Post('items')
  addItem(@Request() req: any, @Body() dto: AddDiaryItemDto) {
    const { date, ...rest } = dto;
    return this.diary.addItem(req.user.id, rest, date);
  }

  @Put('items/:id')
  updateItem(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateDiaryItemDto,
  ) {
    return this.diary.updateItem(req.user.id, id, dto);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  deleteItem(@Request() req: any, @Param('id') id: string) {
    return this.diary.deleteItem(req.user.id, id);
  }
}
