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
exports.MealPlanController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const meal_plan_service_1 = require("./meal-plan.service");
const create_meal_plan_dto_1 = require("./dto/create-meal-plan.dto");
const add_meal_plan_item_dto_1 = require("./dto/add-meal-plan-item.dto");
let MealPlanController = class MealPlanController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list(req) { return this.svc.findAll(req.user.sub); }
    getOne(req, id) { return this.svc.findOne(req.user.sub, id); }
    create(req, dto) { return this.svc.create(req.user.sub, dto); }
    remove(req, id) { return this.svc.remove(req.user.sub, id); }
    addItem(req, id, dto) {
        return this.svc.addItem(req.user.sub, id, dto);
    }
    removeItem(req, id, itemId) {
        return this.svc.removeItem(req.user.sub, id, itemId);
    }
    applyToLog(req, id) {
        return this.svc.applyToLog(req.user.sub, id);
    }
};
exports.MealPlanController = MealPlanController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MealPlanController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MealPlanController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_meal_plan_dto_1.CreateMealPlanDto]),
    __metadata("design:returntype", void 0)
], MealPlanController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MealPlanController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/items'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, add_meal_plan_item_dto_1.AddMealPlanItemDto]),
    __metadata("design:returntype", void 0)
], MealPlanController.prototype, "addItem", null);
__decorate([
    (0, common_1.Delete)(':id/items/:itemId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], MealPlanController.prototype, "removeItem", null);
__decorate([
    (0, common_1.Post)(':id/apply-to-log'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MealPlanController.prototype, "applyToLog", null);
exports.MealPlanController = MealPlanController = __decorate([
    (0, common_1.Controller)('meal-plans'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [meal_plan_service_1.MealPlanService])
], MealPlanController);
//# sourceMappingURL=meal-plan.controller.js.map