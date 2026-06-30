# JLean Backend — Definition of Done v1

> Generado: 2026-06-30 | Rama: `main` | Último commit: `021c2ec`

---

## ✅ Checklist de Cierre

### Fase 1 — Base
- [x] 1.1 NestJS + TypeScript + ESLint + Prettier + `.env` configurados
- [x] 1.2 PostgreSQL + Prisma: schema completo con todas las entidades del dominio
- [x] 1.3 Manejo de errores global (JSON unificado) + `GET /health` con resumen de APIs externas

### Fase 2 — Autenticación
- [x] 2.1 `POST /auth/register` con hash bcrypt + creación de perfil mínimo
- [x] 2.2 `POST /auth/login`, refresh token, logout
- [x] 2.3 JWT Guard aplicado a todos los endpoints protegidos

### Fase 3 — Perfil, Metas y Tipos de Día
- [x] 3.1 `GET/PUT /me/profile` con validación de métricas biompétricas
- [x] 3.2 Motor de cálculo: BMR (Mifflin-St Jeor), TDEE, partición de macros, rangos de micronutrientes
- [x] 3.3 Historial de metas en `user_goals` con `effective_from`
- [x] 3.4 CRUD de Tipos de Día + ajuste dinámico de TDEE

### Fase 4 — Catálogo e Integraciones
- [x] 4.1 Seed de presets básicos (pollo, arroz, avena, whey, huevo, leche, atún, plátano, brócoli, aceite oliva)
- [x] 4.2 CRUD de alimentos personalizados + búsqueda con prioridad interna
- [x] 4.3 Cliente USDA: API key en backend, debounce, caché TTL, manejo HTTP 429
- [x] 4.4 Cliente OFF: User-Agent personalizado, lookup por barcode, calidad `data_quality_status`
- [x] 4.5 Servicio unificado normalizador con deduplicación por `(provider, external_id)`

### Fase 5 — Recetas
- [x] 5.1 `POST /recipes` con nombre y porciones
- [x] 5.2 Agregar/eliminar ingredientes + recalcular totales y por porción
- [x] 5.3 Constructor avanzado:
  - `POST /recipes/build/macros` — modo greedy por calorías + proteína
  - `POST /recipes/build/micros` — modo densidad de micronutriente + barra de progreso

### Fase 6 — Bienestar
- [x] 6.1 CRUD suplementos/medicamentos + ventanas horarias + interacciones
- [x] 6.2 Registro de sueño + cruce con recomendaciones de recuperación
- [x] 6.3 Ayuno intermitente: ventanas configurables, estado activo/inactivo

### Fase 7 — Log Diario y Motor de Alertas
- [x] 7.1 Abrir log del día copiando targets actuales + tipo de día
- [x] 7.2 Agregar items (food o recipe) como snapshot inmutable
- [x] 7.3 Resumen por comida y totales (remaining macros + micros)
- [x] 7.4 Motor de alertas: cafeína >400mg, alcohol, sodio alto, alérgenos

### Fase 8 — Dashboard API
- [x] 8.1 `GET /dashboard/today` — consumido vs restante, distribución por comida, suplementos pendientes, estado de ayuno
- [x] 8.2 Mensajes e insights determinísticos

### Fase 11 — Validaciones y Resiliencia
- [x] 11.1 Validación de reglas de negocio: macros no negativos, discrepancias calorías vs macros
- [x] 11.2 Fallback: si USDA falla → catálogo interno; rate-limit expuesto en `/health`

### Fase 12 — Testing y Observabilidad
- [x] 12.1 Unit tests motores de cálculo (BMR, partición de macros, constructores de recetas — 11 casos)
- [x] 12.2 Logs estructurados + `ExternalApiMonitorService` rastreando USDA y OFF
- [x] 12.3 **Este documento** — revisión final DoD, CHANGELOG y notas de despliegue

---

## 📝 CHANGELOG v1.0.0

### Breaking changes
_Ninguno — primera versión estable._

### Features
- Auth completo con JWT + refresh tokens
- Motor nutricional: BMR Mifflin-St Jeor, TDEE, partición automática de macros por objetivo (cut/maintain/bulk)
- Catálogo unificado: presets internos + USDA FoodData Central + Open Food Facts
- Recetas CRUD + constructor avanzado (modo macros, modo micros)
- Bienestar: suplementos, sueño, ayuno intermitente
- Log diario con snapshots inmutables + motor de alertas (cafeína, alcohol, alérgenos)
- Dashboard API con insights determinísticos
- Tipos de día con ajuste dinámico de TDEE
- Historial de metas trazable con `effective_from`

### Technical
- NestJS + TypeScript + Prisma + PostgreSQL
- Global exception filter con JSON unificado
- `ExternalApiMonitorService` para observabilidad de APIs externas
- Rate-limit handling (HTTP 429) con fallback automático a catálogo interno
- 11 unit tests en `recipe-builder.service.spec.ts`

---

## 🚀 Notas de Despliegue

### Variables de entorno requeridas

```env
# Base de datos
DATABASE_URL="postgresql://user:pass@host:5432/jlean"

# JWT
JWT_SECRET="<secret-largo-aleatorio>"
JWT_REFRESH_SECRET="<otro-secret-largo>"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# APIs externas
USDA_API_KEY="<tu-api-key-de-usda-fooddata>"

# App
PORT=3000
NODE_ENV=production
```

### Comandos de despliegue

```bash
# 1. Instalar dependencias
npm ci

# 2. Ejecutar migraciones
npx prisma migrate deploy

# 3. Ejecutar seed de presets
npx prisma db seed

# 4. Build de producción
npm run build

# 5. Iniciar
npm run start:prod
```

### Verificación post-despliegue

```bash
# Health check
curl https://api.jlean.app/health
# Esperado: { "status": "ok", "timestamp": "...", "externalApis": { ... } }

# Registro de usuario
curl -X POST https://api.jlean.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@jlean.app", "password": "Test1234!" }'
```

---

## 🚧 Alcance v2+ (pendiente)

- [ ] Escáner de código de barras (integración móvil)
- [ ] Historial de peso con gráficas
- [ ] Meal planning semanal
- [ ] Recomendaciones IA
- [ ] Comunidad / perfiles públicos
- [ ] App móvil nativa (React Native)
- [ ] Integración con wearables (Garmin, Apple Health, Google Fit)
