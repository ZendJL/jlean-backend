import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { FoodSource } from '@prisma/client';

export class ImportFoodDto {
  @IsString()
  @IsNotEmpty()
  externalId: string;

  @IsEnum(FoodSource, { message: 'source debe ser USDA, OFF o CUSTOM' })
  source: FoodSource;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsNumber()
  @Min(0)
  calories: number;

  @IsNumber()
  @Min(0)
  protein: number;

  @IsNumber()
  @Min(0)
  carbs: number;

  @IsNumber()
  @Min(0)
  fat: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  servingSizeG?: number;
}
