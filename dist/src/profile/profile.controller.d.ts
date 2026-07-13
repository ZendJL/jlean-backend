import { ProfileService } from './profile.service';
export declare class ProfileController {
    private service;
    constructor(service: ProfileService);
    getProfile(req: any): Promise<{
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
    updateProfile(req: any, body: any): Promise<{
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
    getDaily(req: any): Promise<{
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
    getGoalHistory(req: any): Promise<{
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
}
