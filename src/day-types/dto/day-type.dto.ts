import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateDayTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  /** Multiplicador sobre el TDEE base. Ej: 0.85 = -15%, 1.1 = +10% */
  @IsNumber()
  @Min(0.3)
  @Max(2.0)
  tdeeMultiplier: number;

  /** Color hex para UI. Ej: "#4f98a3" */
  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateDayTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.3)
  @Max(2.0)
  tdeeMultiplier?: number;

  @IsOptional()
  @IsString()
  color?: string;
}
