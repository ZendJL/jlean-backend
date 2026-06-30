import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { FoodsService } from './foods.service';
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
  import(@Body() body: any) {
    return this.foods.importFood(body);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.foods.getById(id);
  }
}
