import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Request, Query, UseGuards,
} from '@nestjs/common';
import { DayTypesService } from './day-types.service';
import { CreateDayTypeDto, UpdateDayTypeDto } from './dto/day-type.dto';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('day-types')
@UseGuards(JwtGuard)
export class DayTypesController {
  constructor(private service: DayTypesService) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  @Get()
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateDayTypeDto) {
    return this.service.create(req.user.id, dto);
  }

  @Put(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateDayTypeDto) {
    return this.service.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }

  // ─── Asignacion de fecha ──────────────────────────────────────────────────
  // POST /day-types/assign?date=2026-06-30  { dayTypeId: "..." }

  @Post('assign')
  assign(
    @Request() req: any,
    @Query('date') date: string,
    @Body() body: { dayTypeId: string },
  ) {
    const d = date ?? new Date().toISOString().split('T')[0];
    return this.service.assignToDate(req.user.id, body.dayTypeId, d);
  }

  @Delete('assign')
  removeAssignment(@Request() req: any, @Query('date') date: string) {
    const d = date ?? new Date().toISOString().split('T')[0];
    return this.service.removeAssignment(req.user.id, d);
  }

  // ─── Consultas ────────────────────────────────────────────────────────────

  // GET /day-types/today — tipo asignado hoy
  @Get('today')
  today(@Request() req: any) {
    return this.service.getTodayAssignment(req.user.id);
  }

  // GET /day-types/targets?date=2026-06-30 — TDEE ajustado para una fecha
  @Get('targets')
  targets(@Request() req: any, @Query('date') date: string) {
    const d = date ? new Date(date) : new Date();
    return this.service.getAdjustedTargets(req.user.id, d);
  }
}
