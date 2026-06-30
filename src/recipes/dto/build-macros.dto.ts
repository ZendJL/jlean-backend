import { IsNumber, IsOptional, IsBoolean, IsIn, Min, Max } from 'class-validator';

export class BuildMacrosDto {
  @IsNumber()
  @Min(50)
  @Max(5000)
  targetCalories: number;

  @IsNumber()
  @Min(1)
  @Max(500)
  targetProtein: number;

  @IsOptional()
  @IsIn(['balanced', 'low_carb', 'low_fat'])
  carbFatBalance?: 'balanced' | 'low_carb' | 'low_fat';

  @IsOptional()
  @IsBoolean()
  presetsOnly?: boolean;
}
