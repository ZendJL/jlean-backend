import { Module } from '@nestjs/common'
import { FoodsController } from './foods.controller'
import { FoodsService } from './foods.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports:     [PrismaModule],
  controllers: [FoodsController],
  providers:   [FoodsService],
  exports:     [FoodsService],
})
export class FoodsModule {}
