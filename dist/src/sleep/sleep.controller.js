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
exports.SleepController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const sleep_service_1 = require("./sleep.service");
const create_sleep_dto_1 = require("./dto/create-sleep.dto");
let SleepController = class SleepController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    findAll(req, limit) {
        return this.svc.findAll(req.user.sub, limit ? parseInt(limit) : 30);
    }
    create(req, dto) {
        return this.svc.create(req.user.sub, dto);
    }
    remove(req, id) {
        return this.svc.remove(req.user.sub, id);
    }
    getLast(req) {
        return this.svc.getLast(req.user.sub);
    }
};
exports.SleepController = SleepController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SleepController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_sleep_dto_1.CreateSleepDto]),
    __metadata("design:returntype", void 0)
], SleepController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SleepController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('last'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SleepController.prototype, "getLast", null);
exports.SleepController = SleepController = __decorate([
    (0, common_1.Controller)('sleep'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [sleep_service_1.SleepService])
], SleepController);
//# sourceMappingURL=sleep.controller.js.map