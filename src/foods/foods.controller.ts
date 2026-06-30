import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { FoodsService } from './foods.service';
import { ImportFoodDto, ImportSource } from './dto/import-food.dto';
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

  /**
   * POST /foods/import
   * Body: { source: 'USDA', externalId: '534358' }
   *    o: { source: 'CUSTOM', name: '...', calories: 0, protein: 0, carbs: 0, fat: 0 }
   */
  @Post('import')
  import(@Body() dto: ImportFoodDto) {
    if (dto.source === ImportSource.USDA && dto.externalId) {
      return this.foods.importFromUsda(dto.externalId);
    }
    if (dto.source === ImportSource.CUSTOM) {
      return this.foods.createCustomFood({
        name:     dto.name ?? 'Custom Food',
        calories: dto.calories ?? 0,
        protein:  dto.protein  ?? 0,
        carbs:    dto.carbs    ?? 0,
        fat:      dto.fat      ?? 0,
      });
    }
    // OFF: el import se hace por barcode, no por este endpoint
    return { error: 'Para OFF usa GET /foods/barcode/:code' };
  }

  /** GET /foods/:id */
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.foods.getById(id);
  }
}
