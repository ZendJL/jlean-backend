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
exports.FastingController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const fasting_service_1 = require("./fasting.service");
const fasting_window_dto_1 = require("./dto/fasting-window.dto");
let FastingController = class FastingController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    getConfig(req) {
        return this.svc.getConfig(req.user.sub);
    }
    setConfig(req, dto) {
        return this.svc.setConfig(req.user.sub, dto);
    }
    getStatus(req) {
        return this.svc.getStatus(req.user.sub);
    }
};
exports.FastingController = FastingController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FastingController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, fasting_window_dto_1.FastingWindowDto]),
    __metadata("design:returntype", void 0)
], FastingController.prototype, "setConfig", null);
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FastingController.prototype, "getStatus", null);
exports.FastingController = FastingController = __decorate([
    (0, common_1.Controller)('fasting'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [fasting_service_1.FastingService])
], FastingController);
//# sourceMappingURL=fasting.controller.js.map