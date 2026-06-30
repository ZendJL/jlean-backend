import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

/**
 * Fase 11.1 — Valida que los macros declarados sean coherentes con las calorías.
 * Tolerancia: ±5% entre calorías declaradas y las calculadas desde macros.
 */
@Injectable()
export class MacroValidationPipe implements PipeTransform {
  transform(value: any) {
    const { calories, protein, carbs, fat } = value;

    if ([calories, protein, carbs, fat].some(v => typeof v === 'number' && v < 0)) {
      throw new BadRequestException('Macro values cannot be negative.');
    }

    if (calories !== undefined && protein !== undefined && carbs !== undefined && fat !== undefined) {
      const calculated = protein * 4 + carbs * 4 + fat * 9;
      const tolerance  = calories * 0.05;
      if (Math.abs(calculated - calories) > tolerance + 10) {
        throw new BadRequestException(
          `Calorie/macro mismatch: declared ${calories} kcal but macros sum to ${Math.round(calculated)} kcal.`,
        );
      }
    }

    return value;
  }
}
