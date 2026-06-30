import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { FoodsService } from './foods.service';
import { ImportFoodDto } from './dto/import-food.dto';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('foods')
@UseGuards(JwtGuard)
export class FoodsController {
  constructor(private foods: FoodsService) {}

  /** GET /foods/search?q=...&source=local|usda|off */
  @Get('search')
  search(
    @Query('q') q: string,
    @Query('source') source: 'local' | 'usda' | 'off' = 'local',
  ) {
    return this.foods.search(q, source);
  }

  /** GET /foods/barcode/:code — lookup por código de barras (EAN/UPC) */
  @Get('barcode/:code')
  barcode(@Param('code') code: string) {
    return this.foods.getByBarcode(code);
  }

  /** POST /foods/import — guardar alimento externo en DB local */
  @Post('import')
  import(@Body() dto: ImportFoodDto) {
    return this.foods.importFood(dto);
  }

  /** GET /foods/:id */
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.foods.getById(id);
  }
}
