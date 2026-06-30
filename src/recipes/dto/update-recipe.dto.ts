import {
  IsString, IsOptional, IsBoolean, IsInt,
  IsArray, ValidateNested, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecipeItemDto } from './create-recipe.dto';

export class UpdateRecipeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  servings?: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  items?: RecipeItemDto[];
}
