import { ActivityLevel, Goal, Gender } from '@prisma/client';
export declare class UpdateProfileDto {
    name?: string;
    birthDate?: string;
    gender?: Gender;
    weightKg?: number;
    heightCm?: number;
    activityLevel?: ActivityLevel;
    goal?: Goal;
}
