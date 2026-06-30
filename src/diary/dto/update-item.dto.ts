import { IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { Meal } from '@prisma/client';

export class UpdateDiaryItemDto {
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  quantityG?: number;

  @IsOptional()
  @IsEnum(Meal, { message: 'meal debe ser BREAKFAST, LUNCH, DINNER, SNACK u OTHER' })
  meal?: Meal;
}
