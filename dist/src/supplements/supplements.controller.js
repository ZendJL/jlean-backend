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
exports.SupplementsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const supplements_service_1 = require("./supplements.service");
const create_supplement_dto_1 = require("./dto/create-supplement.dto");
const log_supplement_dto_1 = require("./dto/log-supplement.dto");
let SupplementsController = class SupplementsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    findAll(req) {
        return this.svc.findAll(req.user.sub);
    }
    create(req, dto) {
        return this.svc.create(req.user.sub, dto);
    }
    update(req, id, dto) {
        return this.svc.update(req.user.sub, id, dto);
    }
    remove(req, id) {
        return this.svc.remove(req.user.sub, id);
    }
    log(req, dto) {
        return this.svc.logIntake(req.user.sub, dto.supplementId);
    }
    todayLogs(req) {
        return this.svc.getTodayLogs(req.user.sub);
    }
};
exports.SupplementsController = SupplementsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SupplementsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_supplement_dto_1.CreateSupplementDto]),
    __metadata("design:returntype", void 0)
], SupplementsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], SupplementsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SupplementsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('log'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, log_supplement_dto_1.LogSupplementDto]),
    __metadata("design:returntype", void 0)
], SupplementsController.prototype, "log", null);
__decorate([
    (0, common_1.Get)('log/today'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SupplementsController.prototype, "todayLogs", null);
exports.SupplementsController = SupplementsController = __decorate([
    (0, common_1.Controller)('supplements'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [supplements_service_1.SupplementsService])
], SupplementsController);
//# sourceMappingURL=supplements.controller.js.map