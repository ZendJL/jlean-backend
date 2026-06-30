import { Module } from '@nestjs/common';
import { DayTypesController } from './day-types.controller';
import { DayTypesService } from './day-types.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DayTypesController],
  providers: [DayTypesService],
  exports: [DayTypesService],
})
export class DayTypesModule {}
