import {
  Controller, Get, Put, Body, Request, UseGuards,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('me')
@UseGuards(JwtGuard)
export class ProfileController {
  constructor(private service: ProfileService) {}

  @Get('profile')
  getProfile(@Request() req: any) {
    return this.service.getProfile(req.user.id);
  }

  @Put('profile')
  updateProfile(@Request() req: any, @Body() body: any) {
    return this.service.updateProfile(req.user.id, body);
  }

  @Get('daily')
  getDaily(@Request() req: any) {
    return this.service.getDaily(req.user.id);
  }

  // Paso 3.3 — Historial de metas
  @Get('goals')
  getGoalHistory(@Request() req: any) {
    return this.service.getGoalHistory(req.user.id);
  }
}
