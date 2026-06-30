import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator'

export enum ImportSource {
  USDA   = 'USDA',
  OFF    = 'OFF',
  CUSTOM = 'CUSTOM',
}

export class ImportFoodDto {
  @IsEnum(ImportSource)
  source: ImportSource

  @IsOptional()
  @IsString()
  externalId?: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsNumber()
  calories?: number

  @IsOptional()
  @IsNumber()
  protein?: number

  @IsOptional()
  @IsNumber()
  carbs?: number

  @IsOptional()
  @IsNumber()
  fat?: number
}
