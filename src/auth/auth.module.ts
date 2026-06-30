import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './jwt.strategy';
import { JwtGuard } from './jwt.guard';
import { DayTypesModule } from '../day-types/day-types.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    UsersModule,
    PrismaModule,
    DayTypesModule,   // necesario para seedDefaultDayTypes al registrar usuario
  ],
  controllers: [AuthController],
  providers:   [AuthService, JwtStrategy, JwtGuard],
  exports:     [AuthService, JwtGuard],
})
export class AuthModule {}
