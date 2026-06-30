import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfileModule } from './profile/profile.module';
import { FoodsModule } from './foods/foods.module';
import { DiaryModule } from './diary/diary.module';
import { RecipesModule } from './recipes/recipes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SupplementsModule } from './supplements/supplements.module';
import { SleepModule } from './sleep/sleep.module';
import { FastingModule } from './fasting/fasting.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    ProfileModule,
    FoodsModule,
    DiaryModule,
    RecipesModule,
    DashboardModule,
    SupplementsModule,
    SleepModule,
    FastingModule,
  ],
})
export class AppModule {}
