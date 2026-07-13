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
exports.BuildMacrosDto = void 0;
const class_validator_1 = require("class-validator");
class BuildMacrosDto {
    targetCalories;
    targetProtein;
    carbFatBalance;
    presetsOnly;
}
exports.BuildMacrosDto = BuildMacrosDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(50),
    (0, class_validator_1.Max)(5000),
    __metadata("design:type", Number)
], BuildMacrosDto.prototype, "targetCalories", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(500),
    __metadata("design:type", Number)
], BuildMacrosDto.prototype, "targetProtein", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['balanced', 'low_carb', 'low_fat']),
    __metadata("design:type", String)
], BuildMacrosDto.prototype, "carbFatBalance", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BuildMacrosDto.prototype, "presetsOnly", void 0);
//# sourceMappingURL=build-macros.dto.js.map