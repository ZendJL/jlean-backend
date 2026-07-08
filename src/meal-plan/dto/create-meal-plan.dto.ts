import { IsString, IsDateString, MinLength } from 'class-validator'

export class CreateMealPlanDto {
  @IsString()
  @MinLength(1)
  name: string

  @IsDateString()
  weekStart: string // ISO date string (Monday of the week)
}
