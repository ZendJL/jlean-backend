import { Module } from '@nestjs/common';
import { DayTypesController } from './day-types.controller';
import { DayTypesService } from './day-types.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports:     [PrismaModule],
  controllers: [DayTypesController],
  providers:   [DayTypesService],
  exports:     [DayTypesService],   // exportado para DiaryModule y AuthService
})
export class DayTypesModule {}
