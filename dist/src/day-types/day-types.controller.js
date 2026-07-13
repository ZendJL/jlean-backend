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
exports.DayTypesController = void 0;
const common_1 = require("@nestjs/common");
const day_types_service_1 = require("./day-types.service");
const day_type_dto_1 = require("./dto/day-type.dto");
const jwt_guard_1 = require("../auth/jwt.guard");
let DayTypesController = class DayTypesController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(req) {
        return this.service.findAll(req.user.id);
    }
    create(req, dto) {
        return this.service.create(req.user.id, dto);
    }
    update(req, id, dto) {
        return this.service.update(req.user.id, id, dto);
    }
    remove(req, id) {
        return this.service.remove(req.user.id, id);
    }
    assign(req, date, body) {
        const d = date ?? new Date().toISOString().split('T')[0];
        return this.service.assignToDate(req.user.id, body.dayTypeId, d);
    }
    removeAssignment(req, date) {
        const d = date ?? new Date().toISOString().split('T')[0];
        return this.service.removeAssignment(req.user.id, d);
    }
    today(req) {
        return this.service.getTodayAssignment(req.user.id);
    }
    targets(req, date) {
        const d = date ? new Date(date) : new Date();
        return this.service.getAdjustedTargets(req.user.id, d);
    }
};
exports.DayTypesController = DayTypesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DayTypesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, day_type_dto_1.CreateDayTypeDto]),
    __metadata("design:returntype", void 0)
], DayTypesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, day_type_dto_1.UpdateDayTypeDto]),
    __metadata("design:returntype", void 0)
], DayTypesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DayTypesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('assign'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], DayTypesController.prototype, "assign", null);
__decorate([
    (0, common_1.Delete)('assign'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DayTypesController.prototype, "removeAssignment", null);
__decorate([
    (0, common_1.Get)('today'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DayTypesController.prototype, "today", null);
__decorate([
    (0, common_1.Get)('targets'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DayTypesController.prototype, "targets", null);
exports.DayTypesController = DayTypesController = __decorate([
    (0, common_1.Controller)('day-types'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    __metadata("design:paramtypes", [day_types_service_1.DayTypesService])
], DayTypesController);
//# sourceMappingURL=day-types.controller.js.map