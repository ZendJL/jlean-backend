import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfileModule } from './profile/profile.module';
import { FoodsModule } from './foods/foods.module';
import { RecipesModule } from './recipes/recipes.module';
import { DiaryModule } from './diary/diary.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DayTypesModule } from './day-types/day-types.module';
import { SupplementsModule } from './supplements/supplements.module';
import { SleepModule } from './sleep/sleep.module';
import { FastingModule } from './fasting/fasting.module';
import { WeightModule } from './weight/weight.module';
import { MealPlanModule } from './meal-plan/meal-plan.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProfileModule,
    FoodsModule,
    RecipesModule,
    DiaryModule,
    DashboardModule,
    DayTypesModule,
    SupplementsModule,
    SleepModule,
    FastingModule,
    WeightModule,
    MealPlanModule,
  ],
})
export class AppModule {}