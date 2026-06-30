import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SupplementsService } from './supplements.service';
import { CreateSupplementDto } from './dto/create-supplement.dto';
import { LogSupplementDto } from './dto/log-supplement.dto';

@Controller('supplements')
@UseGuards(JwtAuthGuard)
export class SupplementsController {
  constructor(private readonly svc: SupplementsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.svc.findAll(req.user.sub);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateSupplementDto) {
    return this.svc.create(req.user.sub, dto);
  }

  @Put(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: Partial<CreateSupplementDto>) {
    return this.svc.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.svc.remove(req.user.sub, id);
  }

  @Post('log')
  log(@Request() req: any, @Body() dto: LogSupplementDto) {
    return this.svc.logIntake(req.user.sub, dto);
  }

  @Get('log/today')
  todayLogs(@Request() req: any) {
    return this.svc.todayLogs(req.user.sub);
  }
}
