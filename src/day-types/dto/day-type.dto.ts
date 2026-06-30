import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class CreateDayTypeDto {
  @IsString()
  name: string;

  /** Porcentaje de ajuste sobre TDEE base. Ej: -15 = Rest, +10 = Training */
  @IsNumber()
  @Min(-70)
  @Max(100)
  tdeAdjustPct: number;

  /** Color hex para la UI. Ej: "#4f98a3" */
  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateDayTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(-70)
  @Max(100)
  tdeAdjustPct?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
