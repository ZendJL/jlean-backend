import { Controller, Get, Post, Put, Body, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FastingService } from './fasting.service';
import { FastingWindowDto } from './dto/fasting-window.dto';

@Controller('fasting')
@UseGuards(JwtAuthGuard)
export class FastingController {
  constructor(private readonly svc: FastingService) {}

  @Get()
  getConfig(@Request() req: any) {
    return this.svc.getConfig(req.user.sub);
  }

  @Post()
  setConfig(@Request() req: any, @Body() dto: FastingWindowDto) {
    return this.svc.setConfig(req.user.sub, dto);
  }

  @Get('status')
  getStatus(@Request() req: any) {
    return this.svc.getStatus(req.user.sub);
  }
}
