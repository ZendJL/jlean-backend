import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DayTypesController } from './day-types.controller';
import { DayTypesService } from './day-types.service';

@Module({
  imports: [PrismaModule],
  controllers: [DayTypesController],
  providers: [DayTypesService],
  exports: [DayTypesService],
})
export class DayTypesModule {}
