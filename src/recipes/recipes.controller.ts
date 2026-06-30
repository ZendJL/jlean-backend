import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Request, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('recipes')
@UseGuards(JwtGuard)
export class RecipesController {
  constructor(private recipes: RecipesService) {}

  @Post()
  create(
    @Request() req: any,
    @Body() body: {
      name: string;
      description?: string;
      servings?: number;
      isPublic?: boolean;
      items: { foodId: string; quantityG: number }[];
    },
  ) {
    return this.recipes.create(req.user.id, body);
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
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      description?: string;
      servings?: number;
      isPublic?: boolean;
      items?: { foodId: string; quantityG: number }[];
    },
  ) {
    return this.recipes.update(req.user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.recipes.remove(req.user.id, id);
  }
}
