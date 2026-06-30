import { Module } from '@nestjs/common';
import { FastingController } from './fasting.controller';
import { FastingService } from './fasting.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FastingController],
  providers: [FastingService],
})
export class FastingModule {}
