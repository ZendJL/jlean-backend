# Changelog — JLean Backend

Todos los cambios notables de este proyecto siguen [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [1.0.0] — 2026-06-30

### Added
- Auth completo: registro, login, refresh token, logout, JWT Guard
- Motor nutricional: BMR (Mifflin-St Jeor), TDEE, partición automática de macros (cut / maintain / bulk)
- Rangos automáticos de micronutrientes (RDA/AI + UL) según perfil
- Tipos de día con ajuste dinámico de TDEE (Rest, Office, Training, Race, Fasting, Refeed)
- Historial de metas trazable (`user_goals` con `effective_from`)
- Catálogo de alimentos: presets internos, CRUD personalizado, USDA FoodData Central, Open Food Facts
- Servicio unificado normalizador con deduplicación por proveedor
- Recetas: CRUD, ingredientes, cálculo en tiempo real
- Constructor avanzado de recetas: modo macros (greedy) y modo micros (densidad)
- Bienestar: suplementos/medicamentos, registro de sueño, ayuno intermitente
- Log diario con snapshots inmutables por item
- Motor de alertas: cafeína >400mg, alcohol, sodio, alérgenos
- Dashboard API: consumido vs restante, insights determinísticos
- `GET /health` con resumen de estado de APIs externas
- `ExternalApiMonitorService`: observabilidad de USDA y OFF
- Fallback automático a catálogo interno cuando USDA devuelve HTTP 429
- 11 unit tests en `recipe-builder.service.spec.ts`
- Seed de 10 presets básicos

### Technical stack
- NestJS 10 + TypeScript 5
- Prisma ORM + PostgreSQL
- JWT con refresh tokens
- class-validator + class-transformer
- Global exception filter (JSON unificado)
