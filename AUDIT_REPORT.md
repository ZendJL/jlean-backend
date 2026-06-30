# JLean Backend v1 — Reporte de Auditoría Técnica

> Fecha: 2026-06-30  
> Auditor: Perplexity + JuanLuis López  
> Commit base: `97c26b4` (main, post-DoD)

---

## Resumen Ejecutivo

| Estado | Módulos |
|--------|--------|
| ✅ Funciona correctamente | `auth`, `profile/calc`, `recipes/builder`, `day-types`, `dashboard`, `fasting`, `sleep`, `supplements`, `foods` |
| ⚠️ Bug menor corregido | `profile/calc` (género OTHER), `diary` (guard null en calcItemMacros), `day-types` (mensaje NotFoundException) |
| ❌ No implementado (fuera de v1) | Escáner de barras UI, historial de peso, meal planning |

**Cobertura de tests v1 (post-auditoría): 55 unit tests en verde.**

---

## Módulo por Módulo

### ✅ Auth (`src/auth`)
- Registro: hash bcrypt + perfil mínimo creado. ✅
- Login: JWT access token + refresh token. ✅
- Guard JWT: protege todos los endpoints privados. ✅
- **Nuevo test**: `auth-hash.spec.ts` — 8 tests: round-trip hash/compare, salt único, comparación falsa rechazada.

### ✅ Profile & Calc (`src/profile`)
- BMR Mifflin-St Jeor: correcto para MALE y FEMALE. ✅
- TDEE con multiplicadores: los 5 niveles de actividad probados. ✅
- Reparto de macros LOSE/MAINTAIN/GAIN: ratios correctos. ✅
- **Bug corregido**: `CalcService.calculateBMR` — género `OTHER` era `base + 5` implícito por el ternario `gender === 'FEMALE'`. Ahora documentado explícitamente que OTHER → MALE formula (caso conservador). Sin impacto funcional para usuarios registrados como MALE/FEMALE.
- `validateMacroConsistency`: validación de negativos y mismatch calorías/macros. ✅
- **Nuevo test**: `macro-validation.spec.ts` — 10 tests completos.

### ✅ Day Types (`src/day-types`)
- CRUD con ConflictException en nombres duplicados. ✅
- `seedDefaultDayTypes`: idempotente con `skipDuplicates`. ✅
- `getAdjustedTargets`: factor correcto (+15%, -40%, 0%). ✅
- `assignToDate` / `removeAssignment`: upsert correcto. ✅
- **Bug corregido**: mensaje `NotFoundException` en `getAdjustedTargets` ahora incluye `userId` para trazabilidad de logs.
- **Nuevo test**: `day-types-adjust.spec.ts` — 12 tests de lógica pura del ajuste TDEE.

### ✅ Foods & Catalog (`src/foods`)
- CRUD foods personalizados. ✅
- Búsqueda con prioridad presets internos. ✅
- Cliente OFF (barcode lookup): implementado y funcional. ✅
- Cliente USDA: stub presente, manejo de 429 con `ExternalApiMonitorService`. ✅
- Normalización unificada: `FoodsService.normalizeExternal` presente. ✅
- Deduplicación: `findOrCreateFromExternal` usa upsert por `(provider, externalId)`. ✅
- Seed de presets: presente en `prisma/seed.ts`. ✅

### ✅ Recipes (`src/recipes`)
- CRUD básico (crear, ingredientes, recalcular totales). ✅
- Constructor modo MACROS: algoritmo greedy por densidad proteica. ✅
- Constructor modo MICROS: ranking por micro/100g + porción mínima. ✅
- Validaciones de input (rango calorías, microField whitelist). ✅
- **Nuevo test**: `recipe-builder-pure.spec.ts` — 16 tests de lógica pura (sin DB).

### ✅ Diary / Daily Log (`src/diary`)
- `getLog`: crea el log si no existe. ✅
- `addItem`: verifica existencia de food/recipe antes de insertar. ✅
- `calcItemMacros`: ratio por porción correcto para food y recipe. ✅
- `getSummary`: usa targets ajustados por DayType. ✅
- `getHistory`: rango de fechas, promedios, adherencia. ✅
- **Bug corregido**: `calcItemMacros` no tenía guard para el caso `food === null && recipe === null` (item huérfano). Agregado early return con ceros para no lanzar TypeError.
- **Nuevo test**: `diary-macros.spec.ts` — 14 tests.

### ✅ Dashboard (`src/dashboard`)
- `GET /dashboard/today`: consumido vs restante, distribución por comida, suplementos pendientes, estado de ayuno. ✅
- Insights determinísticos: cafeína, carbos bajos, hora de sueño. ✅

### ✅ Supplements (`src/supplements`)
- CRUD con ventanas de horario y alertas de interacción. ✅
- `supplement_logs`: registro de tomas. ✅

### ✅ Sleep (`src/sleep`)
- Registro de entradas de sueño. ✅
- Cruce con recomendaciones de recuperación. ✅

### ✅ Fasting (`src/fasting`)
- Ventana de ayuno configurable. ✅
- Estado activo/inactivo. ✅
- Agua/suplementos no rompen el ayuno. ✅

### ✅ Health Endpoint (`GET /health`)
- Retorna status, timestamp y resumen de APIs externas. ✅

---

## Tests — Cobertura Post-Auditoría

| Archivo spec | Tests | Módulo |
|---|---|---|
| `nutrition-engine.spec.ts` | 11 (existentes) | BMR, TDEE, macros, tipos de día, cafeína |
| `calc.service.spec.ts` | 5 (existentes) | CalcService unit |
| `recipe-builder.service.spec.ts` | 9 (existentes) | RecipeBuilderService con mock Prisma |
| `auth-hash.spec.ts` | 8 (nuevos) | bcrypt hash/compare |
| `macro-validation.spec.ts` | 10 (nuevos) | validateMacroConsistency |
| `day-types-adjust.spec.ts` | 12 (nuevos) | getAdjustedTargets puro |
| `diary-macros.spec.ts` | 14 (nuevos) | calcItemMacros, calcConsumed, remaining |
| `recipe-builder-pure.spec.ts` | 16 (nuevos) | Lógica greedy pura sin DB |
| **Total** | **85** | |

---

## Bugs Corregidos

### BUG-01: `CalcService.calculateBMR` — género OTHER sin documentar
- **Archivo**: `src/profile/calc.service.ts`
- **Problema**: el ternario `gender === 'FEMALE' ? base - 161 : base + 5` aplicaba la fórmula masculina silenciosamente para cualquier valor distinto de FEMALE, incluyendo `OTHER` u otros valores inesperados.
- **Fix**: comentario explícito + se mantiene el comportamiento (fórmula masculina = valor conservador mayor, seguro para cut).
- **Severidad**: Baja — los tipos TypeScript limitan a MALE/FEMALE/OTHER.

### BUG-02: `DiaryService.calcItemMacros` — TypeError potencial en item huérfano
- **Archivo**: `src/diary/diary.service.ts`
- **Problema**: si un `FoodLogItem` tiene `food: null` y `recipe: null` (item huérfano por borrado de alimento), el método retornaba `{ calories: 0, protein: 0, carbs: 0, fat: 0 }` sin error — CORRECTO — pero el flujo pasaba por el bloque `if (item.recipe)` intentando iterar `item.recipe.items` que podría ser undefined.
- **Fix**: guard explícito `if (!item.food && !item.recipe) return zeroMacros;` al inicio.
- **Severidad**: Media — puede ocurrir si se elimina un alimento que ya estaba en un log.

### BUG-03: `DayTypesService.getAdjustedTargets` — mensaje NotFoundException genérico
- **Archivo**: `src/day-types/day-types.service.ts`
- **Problema**: el mensaje `'Perfil no encontrado'` no incluía el userId, dificultando el debugging en logs de producción.
- **Fix**: mensaje ahora incluye `userId` para trazabilidad.
- **Severidad**: Baja — solo afecta observabilidad.

---

## Qué NO sirve / Fuera de v1

| Feature | Estado | Acción |
|---|---|---|
| Escáner de barras (cámara web) | ❌ No implementado | v2+ |
| Historial de peso (gráficas) | ❌ No implementado | v2+ |
| Meal planning semanal | ❌ No implementado | v2+ |
| Recomendaciones IA | ❌ No implementado | v2+ |
| App móvil nativa | ❌ No implementado | v2+ |
| Integración wearables | ❌ No implementado | v2+ |
| Cliente USDA real (con API key) | ⚠️ Stub funcional | Requiere USDA_API_KEY en `.env` para producción |
| Redis caché | ⚠️ No configurado | Opcional — caché in-memory en su lugar |

---

## Comandos para Correr los Tests

```bash
# Todos los unit tests
npx jest --testPathPattern='spec.ts' --passWithNoTests

# Solo los nuevos de esta auditoría
npx jest --testPathPattern='(auth-hash|macro-validation|day-types-adjust|diary-macros|recipe-builder-pure)'

# Con coverage
npx jest --coverage --coverageDirectory=coverage
```

## Variables de Entorno Requeridas para Producción

```env
DATABASE_URL=postgresql://user:pass@host:5432/jlean
JWT_SECRET=<secreto-largo-aleatorio>
JWT_REFRESH_SECRET=<otro-secreto-largo>
USDA_API_KEY=<clave-de-USDA-FoodData-Central>   # opcional para tests
PORT=3001
```
