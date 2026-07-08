import { IsNumber, IsOptional, IsString, IsDateString, Min, Max } from 'class-validator'

export class CreateWeightDto {
  @IsNumber()
  @Min(20)
  @Max(500)
  weightKg: number

  @IsOptional()
  @IsString()
  note?: string

  @IsOptional()
  @IsDateString()
  recordedAt?: string
}
