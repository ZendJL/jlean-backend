import { Controller, Get, Post, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SleepService } from './sleep.service';
import { CreateSleepDto } from './dto/create-sleep.dto';

@Controller('sleep')
@UseGuards(JwtAuthGuard)
export class SleepController {
  constructor(private readonly svc: SleepService) {}

  @Get()
  findAll(@Request() req: any, @Query('limit') limit?: string) {
    return this.svc.findAll(req.user.sub, limit ? parseInt(limit) : 30);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateSleepDto) {
    return this.svc.create(req.user.sub, dto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.svc.remove(req.user.sub, id);
  }

  @Get('last')
  getLast(@Request() req: any) {
    return this.svc.getLast(req.user.sub);
  }
}
