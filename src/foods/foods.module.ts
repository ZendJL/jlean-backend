import { Module } from '@nestjs/common';
import { FoodsController } from './foods.controller';
import { FoodsService } from './foods.service';
import { UsdaClient } from './usda.client';
import { OffClient } from './off.client';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ExternalApiMonitorService } from '../common/services/external-api-monitor.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [FoodsController],
  providers: [FoodsService, UsdaClient, OffClient, ExternalApiMonitorService],
  exports: [FoodsService],
})
export class FoodsModule {}