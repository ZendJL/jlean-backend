import { Controller, Get, Put, Body, Request, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('profile')
@UseGuards(JwtGuard)
export class ProfileController {
  constructor(private profile: ProfileService) {}

  @Get()
  get(@Request() req: any) {
    return this.profile.getProfile(req.user.id);
  }

  @Put()
  update(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.profile.updateProfile(req.user.id, dto);
  }

  @Get('daily')
  daily(@Request() req: any) {
    return this.profile.getDaily(req.user.id);
  }
}
