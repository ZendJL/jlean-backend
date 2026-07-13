"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MacroValidationPipe = void 0;
const common_1 = require("@nestjs/common");
let MacroValidationPipe = class MacroValidationPipe {
    transform(value) {
        const { calories, protein, carbs, fat } = value;
        if ([calories, protein, carbs, fat].some(v => typeof v === 'number' && v < 0)) {
            throw new common_1.BadRequestException('Macro values cannot be negative.');
        }
        if (calories !== undefined && protein !== undefined && carbs !== undefined && fat !== undefined) {
            const calculated = protein * 4 + carbs * 4 + fat * 9;
            const tolerance = calories * 0.05;
            if (Math.abs(calculated - calories) > tolerance + 10) {
                throw new common_1.BadRequestException(`Calorie/macro mismatch: declared ${calories} kcal but macros sum to ${Math.round(calculated)} kcal.`);
            }
        }
        return value;
    }
};
exports.MacroValidationPipe = MacroValidationPipe;
exports.MacroValidationPipe = MacroValidationPipe = __decorate([
    (0, common_1.Injectable)()
], MacroValidationPipe);
//# sourceMappingURL=macro-validation.pipe.js.map