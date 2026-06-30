import { Module } from '@nestjs/common';
import { SupplementsController } from './supplements.controller';
import { SupplementsService } from './supplements.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SupplementsController],
  providers: [SupplementsService],
  exports: [SupplementsService],
})
export class SupplementsModule {}
