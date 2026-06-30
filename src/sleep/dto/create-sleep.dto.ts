import { IsDateString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateSleepDto {
  @IsDateString()
  bedtime: string;

  @IsDateString()
  wakeTime: string;

  @IsOptional() @IsNumber() @Min(0) @Max(10)
  qualityScore?: number;

  @IsOptional() @IsNumber() @Min(0)
  deepSleepMin?: number;

  @IsOptional() @IsNumber() @Min(0)
  remSleepMin?: number;

  @IsOptional() @IsNumber() @Min(0)
  awakensCount?: number;
}
