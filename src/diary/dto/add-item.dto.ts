import { IsOptional, IsUUID, IsNumber, IsEnum, IsString, Min } from 'class-validator';
import { Meal } from '@prisma/client';

export class AddDiaryItemDto {
  @IsOptional()
  @IsUUID('4', { message: 'foodId debe ser un UUID válido' })
  foodId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'recipeId debe ser un UUID válido' })
  recipeId?: string;

  @IsNumber({}, { message: 'quantityG debe ser un número' })
  @Min(0.1, { message: 'La cantidad debe ser mayor a 0' })
  quantityG: number;

  @IsOptional()
  @IsEnum(Meal, { message: 'meal debe ser BREAKFAST, LUNCH, DINNER, SNACK u OTHER' })
  meal?: Meal;

  @IsOptional()
  @IsString()
  date?: string;
}
