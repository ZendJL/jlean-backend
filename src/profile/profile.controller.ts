import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('profile')
@UseGuards(JwtGuard)
export class ProfileController {
  constructor(private profile: ProfileService) {}

  @Get()
  getProfile(@Request() req: any) {
    return this.profile.getProfile(req.user.id);
  }

  @Put()
  updateProfile(@Request() req: any, @Body() body: any) {
    return this.profile.updateProfile(req.user.id, body);
  }

  @Get('daily')
  getDaily(@Request() req: any) {
    return this.profile.getDaily(req.user.id);
  }
}
