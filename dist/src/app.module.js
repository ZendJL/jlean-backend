"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const profile_module_1 = require("./profile/profile.module");
const foods_module_1 = require("./foods/foods.module");
const recipes_module_1 = require("./recipes/recipes.module");
const diary_module_1 = require("./diary/diary.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const day_types_module_1 = require("./day-types/day-types.module");
const supplements_module_1 = require("./supplements/supplements.module");
const sleep_module_1 = require("./sleep/sleep.module");
const fasting_module_1 = require("./fasting/fasting.module");
const weight_module_1 = require("./weight/weight.module");
const meal_plan_module_1 = require("./meal-plan/meal-plan.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            profile_module_1.ProfileModule,
            foods_module_1.FoodsModule,
            recipes_module_1.RecipesModule,
            diary_module_1.DiaryModule,
            dashboard_module_1.DashboardModule,
            day_types_module_1.DayTypesModule,
            supplements_module_1.SupplementsModule,
            sleep_module_1.SleepModule,
            fasting_module_1.FastingModule,
            weight_module_1.WeightModule,
            meal_plan_module_1.MealPlanModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map