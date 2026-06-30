import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ActivityLevel, Goal, Gender } from '@prisma/client';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'Género inválido: MALE, FEMALE u OTHER' })
  gender?: Gender;

  @IsOptional()
  @IsNumber({}, { message: 'El peso debe ser un número' })
  @Min(20) @Max(500)
  weightKg?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La altura debe ser un número' })
  @Min(50) @Max(300)
  heightCm?: number;

  @IsOptional()
  @IsEnum(ActivityLevel, { message: 'Nivel de actividad inválido' })
  activityLevel?: ActivityLevel;

  @IsOptional()
  @IsEnum(Goal, { message: 'Objetivo inválido' })
  goal?: Goal;
}
