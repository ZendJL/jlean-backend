import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, Min } from 'class-validator'
import { Meal } from '@prisma/client'

export class AddMealPlanItemDto {
  @IsDateString()
  date: string

  @IsEnum(Meal)
  meal: Meal

  @IsOptional()
  @IsString()
  foodId?: string

  @IsOptional()
  @IsString()
  recipeId?: string

  @IsNumber()
  @Min(1)
  quantityG: number
}
