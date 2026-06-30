import { Module } from '@nestjs/common';
import { FoodsController } from './foods.controller';
import { FoodsService } from './foods.service';
import { UsdaClient } from './usda.client';
import { OffClient } from './off.client';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [FoodsController],
  providers: [FoodsService, UsdaClient, OffClient],
  exports: [FoodsService],
})
export class FoodsModule {}
