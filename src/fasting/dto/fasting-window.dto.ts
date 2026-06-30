import { IsNumber, Min, Max } from 'class-validator';

export class FastingWindowDto {
  @IsNumber() @Min(1) @Max(23)
  fastHours: number;

  @IsNumber() @Min(1) @Max(23)
  eatHours: number;

  @IsNumber() @Min(0) @Max(23)
  eatStartHour: number;
}
