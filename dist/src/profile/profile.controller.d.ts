import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class ProfileController {
    private profile;
    constructor(profile: ProfileService);
    get(req: any): Promise<{
        id: string;
        updatedAt: Date;
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
        userId: string;
    }>;
    update(req: any, dto: UpdateProfileDto): Promise<{
        id: string;
        updatedAt: Date;
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
        userId: string;
    }>;
    daily(req: any): Promise<{
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
