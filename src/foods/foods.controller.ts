import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { FoodsService } from './foods.service';
import { ImportFoodDto } from './dto/import-food.dto';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('foods')
@UseGuards(JwtGuard)
export class FoodsController {
  constructor(private foods: FoodsService) {}

  @Get('search')
  search(
    @Query('q') q: string,
    @Query('source') source: 'local' | 'usda' | 'off' = 'local',
  ) {
    return this.foods.search(q, source);
  }

  @Post('import')
  import(@Body() dto: ImportFoodDto) {
    return this.foods.importFood(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.foods.getById(id);
  }
}
