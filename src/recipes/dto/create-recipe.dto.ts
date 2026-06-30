import {
  IsString, IsNotEmpty, IsOptional, IsBoolean,
  IsInt, IsArray, ValidateNested, IsUUID, IsNumber, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecipeItemDto {
  @IsUUID('4', { message: 'foodId debe ser un UUID válido' })
  foodId: string;

  @IsNumber()
  @Min(0.1, { message: 'La cantidad debe ser mayor a 0' })
  quantityG: number;
}

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Las porciones deben ser al menos 1' })
  servings?: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  items: RecipeItemDto[];
}
