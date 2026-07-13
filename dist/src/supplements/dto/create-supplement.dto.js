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
exports.CreateSupplementDto = exports.SupplementUnit = void 0;
const class_validator_1 = require("class-validator");
var SupplementUnit;
(function (SupplementUnit) {
    SupplementUnit["MG"] = "MG";
    SupplementUnit["G"] = "G";
    SupplementUnit["ML"] = "ML";
    SupplementUnit["IU"] = "IU";
    SupplementUnit["MCGG"] = "MCGG";
    SupplementUnit["TABLET"] = "TABLET";
    SupplementUnit["CAPSULE"] = "CAPSULE";
    SupplementUnit["SCOOP"] = "SCOOP";
    SupplementUnit["DROP"] = "DROP";
})(SupplementUnit || (exports.SupplementUnit = SupplementUnit = {}));
class CreateSupplementDto {
    name;
    doseAmount;
    doseUnit;
    frequency;
    timing;
    notes;
    caffeinePerDoseMg;
}
exports.CreateSupplementDto = CreateSupplementDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplementDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSupplementDto.prototype, "doseAmount", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(SupplementUnit),
    __metadata("design:type", String)
], CreateSupplementDto.prototype, "doseUnit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplementDto.prototype, "frequency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplementDto.prototype, "timing", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplementDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSupplementDto.prototype, "caffeinePerDoseMg", void 0);
//# sourceMappingURL=create-supplement.dto.js.map