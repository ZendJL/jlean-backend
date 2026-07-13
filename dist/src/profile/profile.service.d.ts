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
export declare class ProfileService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<{
        id: string;
        updatedAt: Date;
        userId: string;
        birthDate: Date | null;
        gender: import("@prisma/client").$Enums.Gender | null;
        heightCm: number | null;
        weightKg: number | null;
        activityLevel: import("@prisma/client").$Enums.ActivityLevel;
        goal: import("@prisma/client").$Enums.Goal;
        calorieTarget: number | null;
        proteinTarget: number | null;
        carbTarget: number | null;
        fatTarget: number | null;
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        updatedAt: Date;
        userId: string;
        birthDate: Date | null;
        gender: import("@prisma/client").$Enums.Gender | null;
        heightCm: number | null;
        weightKg: number | null;
        activityLevel: import("@prisma/client").$Enums.ActivityLevel;
        goal: import("@prisma/client").$Enums.Goal;
        calorieTarget: number | null;
        proteinTarget: number | null;
        carbTarget: number | null;
        fatTarget: number | null;
    }>;
    private saveGoalHistory;
    getGoalHistory(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        activityLevel: import("@prisma/client").$Enums.ActivityLevel;
        goal: import("@prisma/client").$Enums.Goal;
        calorieTarget: number;
        proteinTarget: number;
        carbTarget: number;
        fatTarget: number;
        effectiveTo: Date | null;
        effectiveFrom: Date;
    }[]>;
    private calculateMacros;
    private getAge;
    getDaily(userId: string): Promise<{
        date: string;
        targets: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
        consumed: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
        remaining: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
    }>;
}
export {};
