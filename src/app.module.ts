import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfileModule } from './profile/profile.module';
import { FoodsModule } from './foods/foods.module';
import { DiaryModule } from './diary/diary.module';
import { RecipesModule } from './recipes/recipes.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProfileModule,
    FoodsModule,
    DiaryModule,
    RecipesModule,
    DashboardModule,
  ],
})
export class AppModule {}
