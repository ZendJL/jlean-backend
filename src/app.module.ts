import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { FoodsModule } from './foods/foods.module';
import { RecipesModule } from './recipes/recipes.module';
import { DiaryModule } from './diary/diary.module';
import { DayTypesModule } from './day-types/day-types.module';
import { SupplementsModule } from './supplements/supplements.module';
import { SleepModule } from './sleep/sleep.module';
import { FastingModule } from './fasting/fasting.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    AuthModule,
    ProfileModule,
    FoodsModule,
    RecipesModule,
    DiaryModule,
    DayTypesModule,
    SupplementsModule,
    SleepModule,
    FastingModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers:   [AppService],
})
export class AppModule {}
