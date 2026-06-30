import { IsOptional, IsDateString } from 'class-validator';

export class HistoryQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'from debe ser una fecha válida (YYYY-MM-DD)' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to debe ser una fecha válida (YYYY-MM-DD)' })
  to?: string;
}
