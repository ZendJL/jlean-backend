import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';

export enum SupplementUnit {
  MG   = 'MG',
  G    = 'G',
  ML   = 'ML',
  IU   = 'IU',
  MCGG = 'MCGG',
  TABLET = 'TABLET',
  CAPSULE = 'CAPSULE',
  SCOOP = 'SCOOP',
  DROP  = 'DROP',
}

export class CreateSupplementDto {
  @IsString()
  name: string;

  @IsNumber() @Min(0)
  doseAmount: number;

  @IsEnum(SupplementUnit)
  doseUnit: SupplementUnit;

  @IsOptional() @IsString()
  frequency?: string;

  @IsOptional() @IsString()
  timing?: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsNumber() @Min(0)
  caffeinePerDoseMg?: number;
}
