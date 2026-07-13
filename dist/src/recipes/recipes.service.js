"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RecipesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RecipesService = RecipesService_1 = class RecipesService {
    prisma;
    logger = new common_1.Logger(RecipesService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        this.logger.log(`Creando receta "${dto.name}" para userId=${userId}`);
        const recipe = await this.prisma.recipe.create({
            data: {
                userId,
                name: dto.name,
                description: dto.description,
                servings: dto.servings ?? 1,
                isPublic: dto.isPublic ?? false,
                items: {
                    create: dto.items.map((i) => ({
                        foodId: i.foodId,
                        quantityG: i.quantityG,
                    })),
                },
            },
            include: this.recipeInclude(),
        });
        this.logger.log(`Receta creada id=${recipe.id}`);
        return this.formatRecipe(recipe, userId);
    }
    async findAll(userId) {
        const recipes = await this.prisma.recipe.findMany({
            where: { OR: [{ userId }, { isPublic: true }] },
            include: this.recipeInclude(),
            orderBy: { createdAt: 'desc' },
        });
        return recipes.map((r) => this.formatRecipe(r, userId));
    }
    async findOne(userId, id) {
        const recipe = await this.prisma.recipe.findUnique({
            where: { id },
            include: this.recipeInclude(),
        });
        if (!recipe)
            throw new common_1.NotFoundException('Receta no encontrada');
        if (recipe.userId !== userId && !recipe.isPublic)
            throw new common_1.ForbiddenException('Sin acceso a esta receta');
        return this.formatRecipe(recipe, userId);
    }
    async update(userId, id, dto) {
        const recipe = await this.prisma.recipe.findUnique({ where: { id } });
        if (!recipe)
            throw new common_1.NotFoundException('Receta no encontrada');
        if (recipe.userId !== userId)
            throw new common_1.ForbiddenException('No es tu receta');
        if (dto.items) {
            await this.prisma.recipeItem.deleteMany({ where: { recipeId: id } });
        }
        this.logger.log(`Actualizando receta id=${id} para userId=${userId}`);
        const updated = await this.prisma.recipe.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.servings !== undefined && { servings: dto.servings }),
                ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
                ...(dto.items && {
                    items: {
                        create: dto.items.map((i) => ({
                            foodId: i.foodId,
                            quantityG: i.quantityG,
                        })),
                    },
                }),
            },
            include: this.recipeInclude(),
        });
        return this.formatRecipe(updated, userId);
    }
    async remove(userId, id) {
        const recipe = await this.prisma.recipe.findUnique({ where: { id } });
        if (!recipe)
            throw new common_1.NotFoundException('Receta no encontrada');
        if (recipe.userId !== userId)
            throw new common_1.ForbiddenException('No es tu receta');
        this.logger.log(`Eliminando receta id=${id} para userId=${userId}`);
        await this.prisma.recipe.delete({ where: { id } });
        return { deleted: true };
    }
    recipeInclude() {
        return {
            items: {
                include: { food: true },
                orderBy: { id: 'asc' },
            },
        };
    }
    formatRecipe(recipe, userId) {
        const macros = this.calcMacros(recipe.items, recipe.servings);
        return {
            id: recipe.id,
            name: recipe.name,
            description: recipe.description,
            servings: recipe.servings,
            isPublic: recipe.isPublic,
            isOwner: recipe.userId === userId,
            createdAt: recipe.createdAt,
            items: recipe.items.map((item) => ({
                id: item.id,
                foodId: item.foodId,
                foodName: item.food.name,
                foodBrand: item.food.brand,
                quantityG: item.quantityG,
                macros: {
                    calories: this.round(item.food.calories * item.quantityG / (item.food.servingSizeG || 100)),
                    protein: this.round(item.food.protein * item.quantityG / (item.food.servingSizeG || 100)),
                    carbs: this.round(item.food.carbs * item.quantityG / (item.food.servingSizeG || 100)),
                    fat: this.round(item.food.fat * item.quantityG / (item.food.servingSizeG || 100)),
                },
            })),
            macrosTotal: macros.total,
            macrosPerServing: macros.perServing,
        };
    }
    calcMacros(items, servings) {
        const total = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        for (const item of items) {
            const ratio = item.quantityG / (item.food.servingSizeG || 100);
            total.calories += item.food.calories * ratio;
            total.protein += item.food.protein * ratio;
            total.carbs += item.food.carbs * ratio;
            total.fat += item.food.fat * ratio;
        }
        const srv = servings || 1;
        return {
            total: {
                calories: this.round(total.calories),
                protein: this.round(total.protein),
                carbs: this.round(total.carbs),
                fat: this.round(total.fat),
            },
            perServing: {
                calories: this.round(total.calories / srv),
                protein: this.round(total.protein / srv),
                carbs: this.round(total.carbs / srv),
                fat: this.round(total.fat / srv),
            },
        };
    }
    round(n) {
        return Math.round(n * 10) / 10;
    }
};
exports.RecipesService = RecipesService;
exports.RecipesService = RecipesService = RecipesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecipesService);
//# sourceMappingURL=recipes.service.js.map