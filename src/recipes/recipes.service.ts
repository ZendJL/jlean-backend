import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateRecipeDto {
  name: string;
  description?: string;
  servings?: number;
  isPublic?: boolean;
  items: { foodId: string; quantityG: number }[];
}

interface UpdateRecipeDto {
  name?: string;
  description?: string;
  servings?: number;
  isPublic?: boolean;
  items?: { foodId: string; quantityG: number }[];
}

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateRecipeDto) {
    this.logger.log(`Creando receta "${dto.name}" para userId=${userId}`);
    const recipe = await this.prisma.recipe.create({
      data: {
        userId,
        name:        dto.name,
        description: dto.description,
        servings:    dto.servings ?? 1,
        isPublic:    dto.isPublic ?? false,
        items: {
          create: dto.items.map((i) => ({
            foodId:    i.foodId,
            quantityG: i.quantityG,
          })),
        },
      },
      include: this.recipeInclude(),
    });
    this.logger.log(`Receta creada id=${recipe.id}`);
    return this.formatRecipe(recipe, userId);
  }

  async findAll(userId: string) {
    const recipes = await this.prisma.recipe.findMany({
      where: { OR: [{ userId }, { isPublic: true }] },
      include: this.recipeInclude(),
      orderBy: { createdAt: 'desc' },
    });
    // B-06 FIX: pasar userId para calcular isOwner correctamente
    return recipes.map((r) => this.formatRecipe(r, userId));
  }

  async findOne(userId: string, id: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: this.recipeInclude(),
    });
    if (!recipe) throw new NotFoundException('Receta no encontrada');
    if (recipe.userId !== userId && !recipe.isPublic)
      throw new ForbiddenException('Sin acceso a esta receta');
    // B-06 FIX: pasar userId
    return this.formatRecipe(recipe, userId);
  }

  async update(userId: string, id: string, dto: UpdateRecipeDto) {
    const recipe = await this.prisma.recipe.findUnique({ where: { id } });
    if (!recipe) throw new NotFoundException('Receta no encontrada');
    if (recipe.userId !== userId) throw new ForbiddenException('No es tu receta');

    if (dto.items) {
      await this.prisma.recipeItem.deleteMany({ where: { recipeId: id } });
    }

    this.logger.log(`Actualizando receta id=${id} para userId=${userId}`);
    const updated = await this.prisma.recipe.update({
      where: { id },
      data: {
        ...(dto.name        !== undefined && { name:        dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.servings    !== undefined && { servings:    dto.servings }),
        ...(dto.isPublic    !== undefined && { isPublic:    dto.isPublic }),
        ...(dto.items && {
          items: {
            create: dto.items.map((i) => ({
              foodId:    i.foodId,
              quantityG: i.quantityG,
            })),
          },
        }),
      },
      include: this.recipeInclude(),
    });
    return this.formatRecipe(updated, userId);
  }

  async remove(userId: string, id: string) {
    const recipe = await this.prisma.recipe.findUnique({ where: { id } });
    if (!recipe) throw new NotFoundException('Receta no encontrada');
    if (recipe.userId !== userId) throw new ForbiddenException('No es tu receta');
    this.logger.log(`Eliminando receta id=${id} para userId=${userId}`);
    await this.prisma.recipe.delete({ where: { id } });
    return { deleted: true };
  }

  private recipeInclude() {
    return {
      items: {
        include: { food: true },
        orderBy: { id: 'asc' as const },
      },
    };
  }

  // B-06 FIX: recibe userId para calcular isOwner correctamente
  private formatRecipe(recipe: any, userId: string) {
    const macros = this.calcMacros(recipe.items, recipe.servings);
    return {
      id:          recipe.id,
      name:        recipe.name,
      description: recipe.description,
      servings:    recipe.servings,
      isPublic:    recipe.isPublic,
      isOwner:     recipe.userId === userId,  // FIX: antes era siempre true
      createdAt:   recipe.createdAt,
      items: recipe.items.map((item: any) => ({
        id:        item.id,
        foodId:    item.foodId,
        foodName:  item.food.name,
        foodBrand: item.food.brand,
        quantityG: item.quantityG,
        macros: {
          calories: this.round(item.food.calories * item.quantityG / (item.food.servingSizeG || 100)),
          protein:  this.round(item.food.protein  * item.quantityG / (item.food.servingSizeG || 100)),
          carbs:    this.round(item.food.carbs    * item.quantityG / (item.food.servingSizeG || 100)),
          fat:      this.round(item.food.fat      * item.quantityG / (item.food.servingSizeG || 100)),
        },
      })),
      macrosTotal:      macros.total,
      macrosPerServing: macros.perServing,
    };
  }

  private calcMacros(items: any[], servings: number) {
    const total = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const item of items) {
      const ratio = item.quantityG / (item.food.servingSizeG || 100);
      total.calories += item.food.calories * ratio;
      total.protein  += item.food.protein  * ratio;
      total.carbs    += item.food.carbs    * ratio;
      total.fat      += item.food.fat      * ratio;
    }
    const srv = servings || 1;
    return {
      total: {
        calories: this.round(total.calories),
        protein:  this.round(total.protein),
        carbs:    this.round(total.carbs),
        fat:      this.round(total.fat),
      },
      perServing: {
        calories: this.round(total.calories / srv),
        protein:  this.round(total.protein  / srv),
        carbs:    this.round(total.carbs    / srv),
        fat:      this.round(total.fat      / srv),
      },
    };
  }

  private round(n: number) {
    return Math.round(n * 10) / 10;
  }
}
