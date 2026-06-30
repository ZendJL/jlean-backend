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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRecipeDto = exports.RecipeItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class RecipeItemDto {
    foodId;
    quantityG;
}
exports.RecipeItemDto = RecipeItemDto;
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'foodId debe ser un UUID válido' }),
    __metadata("design:type", String)
], RecipeItemDto.prototype, "foodId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.1, { message: 'La cantidad debe ser mayor a 0' }),
    __metadata("design:type", Number)
], RecipeItemDto.prototype, "quantityG", void 0);
class CreateRecipeDto {
    name;
    description;
    servings;
    isPublic;
    items;
}
exports.CreateRecipeDto = CreateRecipeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre es obligatorio' }),
    __metadata("design:type", String)
], CreateRecipeDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRecipeDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: 'Las porciones deben ser al menos 1' }),
    __metadata("design:type", Number)
], CreateRecipeDto.prototype, "servings", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateRecipeDto.prototype, "isPublic", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RecipeItemDto),
    __metadata("design:type", Array)
], CreateRecipeDto.prototype, "items", void 0);
//# sourceMappingURL=create-recipe.dto.js.map