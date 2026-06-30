import { IsString, IsOptional, IsDateString } from 'class-validator';

export class LogSupplementDto {
  @IsString()
  supplementId: string;

  @IsOptional() @IsDateString()
  takenAt?: string;

  @IsOptional() @IsString()
  notes?: string;
}
