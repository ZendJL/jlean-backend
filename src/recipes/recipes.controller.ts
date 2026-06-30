import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Request, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { RecipeBuilderService } from './recipe-builder.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { BuildMacrosDto } from './dto/build-macros.dto';
import { BuildMicrosDto } from './dto/build-micros.dto';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('recipes')
@UseGuards(JwtGuard)
export class RecipesController {
  constructor(
    private recipes: RecipesService,
    private builder: RecipeBuilderService,
  ) {}

  // ─── CRUD ────────────────────────────────────────────────────────────────

  @Post()
  create(@Request() req: any, @Body() dto: CreateRecipeDto) {
    return this.recipes.create(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.recipes.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.recipes.findOne(req.user.id, id);
  }

  @Put(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateRecipeDto) {
    return this.recipes.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.recipes.remove(req.user.id, id);
  }

  // ─── Constructor avanzado (Paso 5.3) ─────────────────────────────────────

  /**
   * POST /recipes/build/macros
   * Sugiere ingredientes para alcanzar un target de calorías + proteína.
   * Body: { targetCalories, targetProtein, carbFatBalance?, presetsOnly? }
   */
  @Post('build/macros')
  buildByMacros(@Body() dto: BuildMacrosDto) {
    return this.builder.buildByMacros(dto);
  }

  /**
   * POST /recipes/build/micros
   * Sugiere alimentos para cubrir un déficit de micronutriente.
   * Body: { microField, gapAmount, maxCalories? }
   */
  @Post('build/micros')
  buildByMicros(@Body() dto: BuildMicrosDto) {
    return this.builder.buildByMicros(dto);
  }
}
