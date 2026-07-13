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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoodsController = void 0;
const common_1 = require("@nestjs/common");
const foods_service_1 = require("./foods.service");
const import_food_dto_1 = require("./dto/import-food.dto");
const jwt_guard_1 = require("../auth/jwt.guard");
let FoodsController = class FoodsController {
    foods;
    constructor(foods) {
        this.foods = foods;
    }
    search(q, source = 'local') {
        return this.foods.search(q, source);
    }
    barcode(code) {
        return this.foods.getByBarcode(code);
    }
    import(dto) {
        if (dto.source === import_food_dto_1.ImportSource.USDA && dto.externalId) {
            return this.foods.importFromUsda(dto.externalId);
        }
        if (dto.source === import_food_dto_1.ImportSource.CUSTOM) {
            return this.foods.createCustomFood({
                name: dto.name ?? 'Custom Food',
                calories: dto.calories ?? 0,
                protein: dto.protein ?? 0,
                carbs: dto.carbs ?? 0,
                fat: dto.fat ?? 0,
            });
        }
        return { error: 'Para OFF usa GET /foods/barcode/:code' };
    }
    getById(id) {
        return this.foods.getById(id);
    }
};
exports.FoodsController = FoodsController;
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('source')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FoodsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('barcode/:code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FoodsController.prototype, "barcode", null);
__decorate([
    (0, common_1.Post)('import'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [import_food_dto_1.ImportFoodDto]),
    __metadata("design:returntype", void 0)
], FoodsController.prototype, "import", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FoodsController.prototype, "getById", null);
exports.FoodsController = FoodsController = __decorate([
    (0, common_1.Controller)('foods'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    __metadata("design:paramtypes", [foods_service_1.FoodsService])
], FoodsController);
//# sourceMappingURL=foods.controller.js.map