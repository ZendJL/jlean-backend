import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FoodsService } from './foods.service';
import { FoodsController } from './foods.controller';

@Module({
  imports: [HttpModule],
  providers: [FoodsService],
  controllers: [FoodsController],
  exports: [FoodsService],
})
export class FoodsModule {}
