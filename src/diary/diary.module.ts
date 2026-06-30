import { Module } from '@nestjs/common';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DayTypesModule } from '../day-types/day-types.module';

@Module({
  imports:     [PrismaModule, DayTypesModule],
  controllers: [DiaryController],
  providers:   [DiaryService],
  exports:     [DiaryService],
})
export class DiaryModule {}
