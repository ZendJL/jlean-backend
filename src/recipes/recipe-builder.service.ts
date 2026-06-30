/**
 * RecipeBuilderService — Paso 5.3
 * Constructor avanzado de recetas con dos modos:
 *   - Modo Macros: dado un target de calorías + proteína, sugiere combinación de alimentos
 *     del catálogo que se aproxime a esos objetivos.
 *   - Modo Micros: dado un micronutriente deficiente, sugiere alimentos que cubran el gap.
 *
 * Algoritmo:
 *   Modo Macros → greedy por densidad proteica (kcal/g proteína) + ajuste calórico.
 *   Modo Micros → ranking por contenido del micronutriente por 100g, toma top-5 y sugiere
 *                 la porción necesaria para cubrir el gap.
 */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ─── DTOs internos ────────────────────────────────────────────────────────────

export interface MacrosTargetDto {
  /** Calorías objetivo para la receta completa */
  targetCalories: number;
  /** Proteína objetivo en gramos */
  targetProtein: number;
  /** Relación carbs/fat preferida: 'balanced' | 'low_carb' | 'low_fat' */
  carbFatBalance?: 'balanced' | 'low_carb' | 'low_fat';
  /** Si se restringe a presets del catálogo o incluye todos los alimentos */
  presetsOnly?: boolean;
}

export interface MicrosTargetDto {
  /** Nombre del campo micro en la tabla Food: 'vitaminC', 'iron', 'calcium', etc. */
  microField: keyof MicroFields;
  /** Cantidad que falta cubrir (en la unidad del campo: mg, mcg, IU) */
  gapAmount: number;
  /** Calorías máximas que puede añadir la sugerencia */
  maxCalories?: number;
}

/** Campos de micronutrientes disponibles en el modelo Food */
export interface MicroFields {
  vitaminA?: number | null;
  vitaminC?: number | null;
  vitaminD?: number | null;
  vitaminE?: number | null;
  vitaminK?: number | null;
  vitaminB1?: number | null;
  vitaminB2?: number | null;
  vitaminB3?: number | null;
  vitaminB6?: number | null;
  vitaminB12?: number | null;
  folate?: number | null;
  calcium?: number | null;
  iron?: number | null;
  magnesium?: number | null;
  phosphorus?: number | null;
  potassium?: number | null;
  sodium?: number | null;
  zinc?: number | null;
  selenium?: number | null;
  fiber?: number | null;
}

/** Alimento sugerido con la porción recomendada */
export interface SuggestedIngredient {
  foodId: string;
  foodName: string;
  brand: string | null;
  suggestedQuantityG: number;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  microContribution?: number; // solo en modo micros
}

export interface MacrosBuildResult {
  mode: 'MACROS';
  targetCalories: number;
  targetProtein: number;
  achievedCalories: number;
  achievedProtein: number;
  calorieAccuracy: number;  // % de cobertura del target
  proteinAccuracy: number;
  ingredients: SuggestedIngredient[];
}

export interface MicrosBuildResult {
  mode: 'MICROS';
  microField: string;
  gapAmount: number;
  coveredAmount: number;
  coveragePercent: number;
  ingredients: SuggestedIngredient[];
}

// ─── Campos de micro válidos (whitelist) ─────────────────────────────────────

const VALID_MICRO_FIELDS: (keyof MicroFields)[] = [
  'vitaminA', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK',
  'vitaminB1', 'vitaminB2', 'vitaminB3', 'vitaminB6', 'vitaminB12',
  'folate', 'calcium', 'iron', 'magnesium', 'phosphorus',
  'potassium', 'sodium', 'zinc', 'selenium', 'fiber',
];

@Injectable()
export class RecipeBuilderService {
  private readonly logger = new Logger(RecipeBuilderService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Modo Macros ──────────────────────────────────────────────────────────

  /**
   * Sugiere ingredientes para alcanzar un target de calorías + proteína.
   *
   * Algoritmo greedy:
   * 1. Obtiene alimentos del catálogo con macros completos.
   * 2. Clasifica en proteínas (protein ≥ 15g/100g) y carbohidratos/grasas.
   * 3. Asigna primero la fuente proteica principal para cubrir targetProtein.
   * 4. Completa las calorías restantes con una fuente de carbs o grasa según
   *    carbFatBalance.
   * 5. Ajusta porciones para no exceder ±10% del target calórico.
   */
  async buildByMacros(dto: MacrosTargetDto): Promise<MacrosBuildResult> {
    if (dto.targetCalories < 50 || dto.targetCalories > 5000) {
      throw new BadRequestException('targetCalories debe estar entre 50 y 5000 kcal');
    }
    if (dto.targetProtein < 1 || dto.targetProtein > 500) {
      throw new BadRequestException('targetProtein debe estar entre 1 y 500 g');
    }

    const where = dto.presetsOnly ? { source: 'PRESET' as const } : {};

    // Traer alimentos con macros
    const foods = await this.prisma.food.findMany({
      where: {
        ...where,
        calories: { gt: 0 },
        protein:  { gt: 0 },
      },
      select: {
        id: true, name: true, brand: true,
        servingSizeG: true,
        calories: true, protein: true, carbs: true, fat: true,
        source: true,
      },
      take: 200,
    });

    if (foods.length === 0) {
      throw new BadRequestException('No hay alimentos en el catálogo para construir la receta');
    }

    // Normalizar todo a per-100g
    const normalized = foods.map((f) => {
      const base = f.servingSizeG > 0 ? f.servingSizeG : 100;
      return {
        id:       f.id,
        name:     f.name,
        brand:    f.brand,
        cal100:   (f.calories / base) * 100,
        prot100:  (f.protein  / base) * 100,
        carbs100: (f.carbs    / base) * 100,
        fat100:   (f.fat      / base) * 100,
      };
    });

    // Separar proteínas de carbos/grasas
    const proteinSources = normalized
      .filter((f) => f.prot100 >= 15)
      .sort((a, b) => {
        // densidad proteica: más proteína por caloría primero
        return (b.prot100 / b.cal100) - (a.prot100 / a.cal100);
      });

    const carbSources = normalized
      .filter((f) => f.prot100 < 15 && f.carbs100 > f.fat100)
      .sort((a, b) => a.cal100 - b.cal100); // menos calórico primero

    const fatSources = normalized
      .filter((f) => f.prot100 < 15 && f.fat100 >= f.carbs100)
      .sort((a, b) => b.fat100 - a.fat100);

    const ingredients: SuggestedIngredient[] = [];
    let usedCalories = 0;
    let usedProtein  = 0;

    // Paso 1: cubrir proteína con la mejor fuente proteica
    if (proteinSources.length > 0) {
      const bestProtein = proteinSources[0];
      // gramos necesarios para alcanzar targetProtein
      const gNeeded = (dto.targetProtein / bestProtein.prot100) * 100;
      // no exceder el 70% de las calorías target con solo la proteína
      const maxGByCal = (dto.targetCalories * 0.70) / (bestProtein.cal100 / 100);
      const quantityG = Math.min(gNeeded, maxGByCal);
      const ratio = quantityG / 100;

      ingredients.push({
        foodId:             bestProtein.id,
        foodName:           bestProtein.name,
        brand:              bestProtein.brand,
        suggestedQuantityG: Math.round(quantityG),
        macros: {
          calories: this.round(bestProtein.cal100  * ratio),
          protein:  this.round(bestProtein.prot100 * ratio),
          carbs:    this.round(bestProtein.carbs100 * ratio),
          fat:      this.round(bestProtein.fat100  * ratio),
        },
      });

      usedCalories += bestProtein.cal100 * ratio;
      usedProtein  += bestProtein.prot100 * ratio;
    }

    // Paso 2: completar calorías con carbs o grasas según balance
    const remainingCal = dto.targetCalories - usedCalories;
    if (remainingCal > 30) {
      const pool = dto.carbFatBalance === 'low_fat'
        ? [...carbSources]
        : dto.carbFatBalance === 'low_carb'
          ? [...fatSources]
          : [...carbSources, ...fatSources].sort(() => 0.5 - Math.random()).slice(0, 10);

      // Tomar hasta 2 complementos
      let remaining = remainingCal;
      for (const food of pool.slice(0, 2)) {
        if (remaining <= 20) break;
        if (food.cal100 <= 0) continue;

        const quantityG = Math.min((remaining / food.cal100) * 100, 300);
        const ratio = quantityG / 100;

        ingredients.push({
          foodId:             food.id,
          foodName:           food.name,
          brand:              food.brand,
          suggestedQuantityG: Math.round(quantityG),
          macros: {
            calories: this.round(food.cal100   * ratio),
            protein:  this.round(food.prot100  * ratio),
            carbs:    this.round(food.carbs100 * ratio),
            fat:      this.round(food.fat100   * ratio),
          },
        });

        usedCalories += food.cal100 * ratio;
        usedProtein  += food.prot100 * ratio;
        remaining    -= food.cal100 * ratio;
      }
    }

    const calorieAccuracy = dto.targetCalories > 0
      ? Math.min(100, Math.round((usedCalories / dto.targetCalories) * 100))
      : 0;
    const proteinAccuracy = dto.targetProtein > 0
      ? Math.min(100, Math.round((usedProtein  / dto.targetProtein)  * 100))
      : 0;

    this.logger.log(
      `buildByMacros: target=${dto.targetCalories}kcal/${dto.targetProtein}g → ` +
      `achieved=${this.round(usedCalories)}kcal/${this.round(usedProtein)}g ` +
      `(cal=${calorieAccuracy}%, prot=${proteinAccuracy}%)`,
    );

    return {
      mode:             'MACROS',
      targetCalories:   dto.targetCalories,
      targetProtein:    dto.targetProtein,
      achievedCalories: this.round(usedCalories),
      achievedProtein:  this.round(usedProtein),
      calorieAccuracy,
      proteinAccuracy,
      ingredients,
    };
  }

  // ─── Modo Micros ──────────────────────────────────────────────────────────

  /**
   * Sugiere alimentos para cubrir un déficit de micronutriente.
   *
   * Algoritmo:
   * 1. Valida que el microField sea uno de los campos permitidos.
   * 2. Busca alimentos con valor > 0 para ese micro, ordenados DESC.
   * 3. Construye lista greedy acumulando hasta cubrir gapAmount o alcanzar
   *    maxCalories.
   * 4. Para cada alimento calcula la porción mínima para aportar su
   *    contribución al gap, sin exceder 300g ni maxCalories restantes.
   */
  async buildByMicros(dto: MicrosTargetDto): Promise<MicrosBuildResult> {
    if (!VALID_MICRO_FIELDS.includes(dto.microField)) {
      throw new BadRequestException(
        `microField inválido. Valores permitidos: ${VALID_MICRO_FIELDS.join(', ')}`,
      );
    }
    if (dto.gapAmount <= 0) {
      throw new BadRequestException('gapAmount debe ser mayor a 0');
    }

    const maxCal = dto.maxCalories ?? 500;

    // Prisma no permite orderBy por campo dinámico, así que traemos y ordenamos en JS
    const foods = await this.prisma.food.findMany({
      where: {
        calories: { gt: 0 },
        // Solo alimentos con el micro definido (no null, no 0)
        [dto.microField]: { gt: 0 },
      },
      select: {
        id:          true,
        name:        true,
        brand:       true,
        servingSizeG: true,
        calories:    true,
        protein:     true,
        carbs:       true,
        fat:         true,
        [dto.microField]: true,
      },
      take: 100,
    });

    if (foods.length === 0) {
      return {
        mode:            'MICROS',
        microField:      dto.microField,
        gapAmount:       dto.gapAmount,
        coveredAmount:   0,
        coveragePercent: 0,
        ingredients:     [],
      };
    }

    // Ordenar por densidad del micro (valor por 100g) DESC
    const ranked = foods
      .map((f) => {
        const base    = f.servingSizeG > 0 ? f.servingSizeG : 100;
        const microVal = (f as any)[dto.microField] as number ?? 0;
        return {
          id:       f.id,
          name:     f.name,
          brand:    f.brand,
          servingSizeG: base,
          cal100:    (f.calories / base) * 100,
          prot100:   (f.protein  / base) * 100,
          carbs100:  (f.carbs    / base) * 100,
          fat100:    (f.fat      / base) * 100,
          micro100:  (microVal   / base) * 100,  // unidades del micro por 100g
        };
      })
      .filter((f) => f.micro100 > 0)
      .sort((a, b) => b.micro100 - a.micro100);

    const ingredients: SuggestedIngredient[] = [];
    let coveredAmount  = 0;
    let usedCalories   = 0;

    for (const food of ranked.slice(0, 5)) {
      if (coveredAmount >= dto.gapAmount) break;
      const calRemaining = maxCal - usedCalories;
      if (calRemaining <= 10) break;

      const microRemaining = dto.gapAmount - coveredAmount;

      // Gramos necesarios para aportar microRemaining
      const gByMicro = (microRemaining / food.micro100) * 100;
      // Gramos posibles por calorías restantes
      const gByCal   = food.cal100 > 0 ? (calRemaining / food.cal100) * 100 : 300;
      // Cap duro de 300g por ingrediente
      const quantityG = Math.min(gByMicro, gByCal, 300);
      const ratio     = quantityG / 100;

      const microContribution = this.round(food.micro100 * ratio);

      ingredients.push({
        foodId:             food.id,
        foodName:           food.name,
        brand:              food.brand,
        suggestedQuantityG: Math.round(quantityG),
        macros: {
          calories: this.round(food.cal100   * ratio),
          protein:  this.round(food.prot100  * ratio),
          carbs:    this.round(food.carbs100 * ratio),
          fat:      this.round(food.fat100   * ratio),
        },
        microContribution,
      });

      coveredAmount += microContribution;
      usedCalories  += food.cal100 * ratio;
    }

    const coveragePercent = dto.gapAmount > 0
      ? Math.min(100, Math.round((coveredAmount / dto.gapAmount) * 100))
      : 0;

    this.logger.log(
      `buildByMicros: ${dto.microField} gap=${dto.gapAmount} → ` +
      `covered=${this.round(coveredAmount)} (${coveragePercent}%)`,
    );

    return {
      mode:            'MICROS',
      microField:      dto.microField,
      gapAmount:       dto.gapAmount,
      coveredAmount:   this.round(coveredAmount),
      coveragePercent,
      ingredients,
    };
  }

  private round(n: number): number {
    return Math.round(n * 10) / 10;
  }
}
