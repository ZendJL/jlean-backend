"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DayTypesModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const day_types_controller_1 = require("./day-types.controller");
const day_types_service_1 = require("./day-types.service");
let DayTypesModule = class DayTypesModule {
};
exports.DayTypesModule = DayTypesModule;
exports.DayTypesModule = DayTypesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [day_types_controller_1.DayTypesController],
        providers: [day_types_service_1.DayTypesService],
        exports: [day_types_service_1.DayTypesService],
    })
], DayTypesModule);
//# sourceMappingURL=day-types.module.js.map