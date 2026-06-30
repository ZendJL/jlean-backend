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
exports.DiaryController = void 0;
const common_1 = require("@nestjs/common");
const diary_service_1 = require("./diary.service");
const add_item_dto_1 = require("./dto/add-item.dto");
const update_item_dto_1 = require("./dto/update-item.dto");
const history_query_dto_1 = require("./dto/history-query.dto");
const jwt_guard_1 = require("../auth/jwt.guard");
let DiaryController = class DiaryController {
    diary;
    constructor(diary) {
        this.diary = diary;
    }
    getLog(req, date) {
        return this.diary.getLog(req.user.id, date);
    }
    getSummary(req, date) {
        return this.diary.getSummary(req.user.id, date);
    }
    getHistory(req, query) {
        return this.diary.getHistory(req.user.id, query.from, query.to);
    }
    addItem(req, dto) {
        const { date, ...rest } = dto;
        return this.diary.addItem(req.user.id, rest, date);
    }
    updateItem(req, id, dto) {
        return this.diary.updateItem(req.user.id, id, dto);
    }
    deleteItem(req, id) {
        return this.diary.deleteItem(req.user.id, id);
    }
};
exports.DiaryController = DiaryController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DiaryController.prototype, "getLog", null);
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DiaryController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, history_query_dto_1.HistoryQueryDto]),
    __metadata("design:returntype", void 0)
], DiaryController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Post)('items'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, add_item_dto_1.AddDiaryItemDto]),
    __metadata("design:returntype", void 0)
], DiaryController.prototype, "addItem", null);
__decorate([
    (0, common_1.Put)('items/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_item_dto_1.UpdateDiaryItemDto]),
    __metadata("design:returntype", void 0)
], DiaryController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Delete)('items/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DiaryController.prototype, "deleteItem", null);
exports.DiaryController = DiaryController = __decorate([
    (0, common_1.Controller)('diary'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    __metadata("design:paramtypes", [diary_service_1.DiaryService])
], DiaryController);
//# sourceMappingURL=diary.controller.js.map