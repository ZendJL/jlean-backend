import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class BuildMicrosDto {
  @IsString()
  microField: string;

  @IsNumber()
  @Min(0.001)
  gapAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(2000)
  maxCalories?: number;
}
