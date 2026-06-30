import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLevel, Goal, Gender } from '@prisma/client';

interface UpdateProfileDto {
  birthDate?: string;
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: ActivityLevel;
  goal?: Goal;
}

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: any = { ...dto };
    if (dto.birthDate) data.birthDate = new Date(dto.birthDate);

    const updated = await this.prisma.profile.update({
      where: { userId },
      data,
    });

    if (updated.weightKg && updated.heightCm && updated.birthDate && updated.gender) {
      const macros = this.calculateMacros(updated);
      const final = await this.prisma.profile.update({
        where: { userId },
        data: macros,
      });

      // Guardar snapshot en historial de metas
      await this.saveGoalHistory(userId, final);

      return final;
    }
    return updated;
  }

  // Guarda el estado actual de metas en user_goals con effectiveTo = null (activo)
  private async saveGoalHistory(userId: string, profile: any) {
    // Cerrar el registro activo anterior
    await this.prisma.userGoal.updateMany({
      where: { userId, effectiveTo: null },
      data: { effectiveTo: new Date() },
    });

    // Crear nuevo registro activo
    await this.prisma.userGoal.create({
      data: {
        userId,
        calorieTarget: profile.calorieTarget ?? 0,
        proteinTarget: profile.proteinTarget ?? 0,
        carbTarget:    profile.carbTarget    ?? 0,
        fatTarget:     profile.fatTarget     ?? 0,
        goal:          profile.goal,
        activityLevel: profile.activityLevel,
        effectiveFrom: new Date(),
        effectiveTo:   null,
      },
    });
  }

  async getGoalHistory(userId: string) {
    return this.prisma.userGoal.findMany({
      where:   { userId },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  private calculateMacros(profile: any) {
    const age = this.getAge(profile.birthDate);

    // Fórmula Mifflin-St Jeor
    let bmr: number;
    if (profile.gender === 'MALE') {
      bmr = (10 * profile.weightKg) + (6.25 * profile.heightCm) - (5 * age) + 5;
    } else {
      bmr = (10 * profile.weightKg) + (6.25 * profile.heightCm) - (5 * age) - 161;
    }

    const activityMultipliers: Record<string, number> = {
      SEDENTARY:         1.2,
      LIGHTLY_ACTIVE:    1.375,
      MODERATELY_ACTIVE: 1.55,
      VERY_ACTIVE:       1.725,
      EXTRA_ACTIVE:      1.9,
    };
    const tdee = bmr * (activityMultipliers[profile.activityLevel] ?? 1.2);

    // Ajuste por objetivo segun doc: Cut -20%, Maintain 0%, Bulk +15%
    const goalFactors: Record<string, number> = {
      LOSE:     0.80,
      MAINTAIN: 1.00,
      GAIN:     1.15,
    };
    const calorieTarget = Math.round(tdee * (goalFactors[profile.goal] ?? 1.0));

    // Reparto de macros segun objetivo (doc seccion 4)
    const ratios: Record<string, { p: number; c: number; f: number }> = {
      LOSE:     { p: 0.35, c: 0.40, f: 0.25 },
      MAINTAIN: { p: 0.30, c: 0.45, f: 0.25 },
      GAIN:     { p: 0.30, c: 0.50, f: 0.20 },
    };
    const r = ratios[profile.goal] ?? ratios.MAINTAIN;

    const proteinTarget = Math.round((calorieTarget * r.p) / 4);
    const carbTarget    = Math.round((calorieTarget * r.c) / 4);
    const fatTarget     = Math.round((calorieTarget * r.f) / 9);

    return { calorieTarget, proteinTarget, carbTarget, fatTarget };
  }

  private getAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }

  async getDaily(userId: string) {
    const profile = await this.getProfile(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await this.prisma.foodLog.findUnique({
      where: { userId_date: { userId, date: today } },
      include: {
        items: {
          include: { food: true, recipe: { include: { items: { include: { food: true } } } } },
        },
      },
    });

    const consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    if (log) {
      for (const item of log.items) {
        if (item.snapshotCalories != null) {
          consumed.calories += item.snapshotCalories;
          consumed.protein  += item.snapshotProtein  ?? 0;
          consumed.carbs    += item.snapshotCarbs    ?? 0;
          consumed.fat      += item.snapshotFat      ?? 0;
        }
      }
    }

    const round = (n: number) => Math.round(n * 10) / 10;

    return {
      date: today.toISOString().split('T')[0],
      targets: {
        calories: profile.calorieTarget ?? 0,
        protein:  profile.proteinTarget ?? 0,
        carbs:    profile.carbTarget    ?? 0,
        fat:      profile.fatTarget     ?? 0,
      },
      consumed: {
        calories: round(consumed.calories),
        protein:  round(consumed.protein),
        carbs:    round(consumed.carbs),
        fat:      round(consumed.fat),
      },
      remaining: {
        calories: round((profile.calorieTarget ?? 0) - consumed.calories),
        protein:  round((profile.proteinTarget ?? 0) - consumed.protein),
        carbs:    round((profile.carbTarget    ?? 0) - consumed.carbs),
        fat:      round((profile.fatTarget     ?? 0) - consumed.fat),
      },
    };
  }
}
