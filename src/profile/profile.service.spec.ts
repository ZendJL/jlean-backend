/**
 * Tests del ProfileService — Fase 12.1
 * Cubre: getProfile, updateProfile (cálculo Mifflin-St Jeor, historial de metas),
 *        getGoalHistory, getDaily y validaciones de edge cases.
 */
import { ProfileService } from './profile.service'
import { NotFoundException, BadRequestException } from '@nestjs/common'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildPrismaMock(overrides: Record<string, any> = {}) {
  return {
    profile: {
      findUnique: jest.fn(),
      update:     jest.fn(),
      upsert:     jest.fn(),
    },
    userGoal: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      create:     jest.fn().mockResolvedValue({}),
      findMany:   jest.fn().mockResolvedValue([]),
    },
    foodLog: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    ...overrides,
  }
}

function buildService(prismaOverrides: Record<string, any> = {}) {
  const prisma = buildPrismaMock(prismaOverrides)
  return { svc: new ProfileService(prisma as any), prisma }
}

// Perfil completo que genera macros válidos (hombre, 30 años, 80kg, 175cm)
const BASE_PROFILE = {
  userId: 'u-1',
  gender: 'MALE',
  birthDate: new Date('1994-01-01'), // ~30 años en 2024
  weightKg: 80,
  heightCm: 175,
  activityLevel: 'MODERATELY_ACTIVE',
  goal: 'MAINTAIN',
  calorieTarget: null,
  proteinTarget: null,
  carbTarget: null,
  fatTarget: null,
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ProfileService', () => {

  // ─── getProfile ────────────────────────────────────────────────────────────
  describe('getProfile', () => {
    it('retorna el perfil si existe', async () => {
      const { svc, prisma } = buildService()
      prisma.profile.findUnique.mockResolvedValue(BASE_PROFILE)
      const result = await svc.getProfile('u-1')
      expect(result.userId).toBe('u-1')
    })

    it('lanza NotFoundException si el perfil no existe', async () => {
      const { svc, prisma } = buildService()
      prisma.profile.findUnique.mockResolvedValue(null)
      await expect(svc.getProfile('u-999')).rejects.toThrow(NotFoundException)
    })
  })

  // ─── updateProfile — cálculo Mifflin-St Jeor ──────────────────────────────
  describe('updateProfile — cálculo Mifflin-St Jeor', () => {
    it('calcula calorías correctas para hombre MODERATELY_ACTIVE MAINTAIN', async () => {
      // BMR hombre: (10×80)+(6.25×175)-(5×30)+5 = 800+1093.75-150+5 = 1748.75
      // TDEE: 1748.75 × 1.55 = 2710.56 → target MAINTAIN = 2711
      const updatedProfile = {
        ...BASE_PROFILE,
        calorieTarget: 2711,
        proteinTarget: 203, // 2711×0.30/4
        carbTarget:    305, // 2711×0.45/4
        fatTarget:      75, // 2711×0.25/9
      }
      const { svc, prisma } = buildService()
      prisma.profile.upsert.mockResolvedValue(updatedProfile)
      prisma.profile.update.mockResolvedValue(updatedProfile)

      const result = await svc.updateProfile('u-1', {
        gender: 'MALE' as any,
        birthDate: '1994-01-01',
        weightKg: 80,
        heightCm: 175,
        activityLevel: 'MODERATELY_ACTIVE' as any,
        goal: 'MAINTAIN' as any,
      })

      expect(result.calorieTarget).toBeGreaterThan(2500)
      expect(result.calorieTarget).toBeLessThan(3000)
    })

    it('aplica factor LOSE (-20%) correctamente', async () => {
      const updatedProfile = { ...BASE_PROFILE, goal: 'LOSE', calorieTarget: 2169, proteinTarget: 190, carbTarget: 217, fatTarget: 60 }
      const { svc, prisma } = buildService()
      prisma.profile.upsert.mockResolvedValue(updatedProfile)
      prisma.profile.update.mockResolvedValue(updatedProfile)

      const result = await svc.updateProfile('u-1', { goal: 'LOSE' as any })
      expect(result.calorieTarget).toBeLessThan(2711)
    })

    it('aplica factor GAIN (+15%) correctamente', async () => {
      const updatedProfile = { ...BASE_PROFILE, goal: 'GAIN', calorieTarget: 3118, proteinTarget: 234, carbTarget: 390, fatTarget: 69 }
      const { svc, prisma } = buildService()
      prisma.profile.upsert.mockResolvedValue(updatedProfile)
      prisma.profile.update.mockResolvedValue(updatedProfile)

      const result = await svc.updateProfile('u-1', { goal: 'GAIN' as any })
      expect(result.calorieTarget).toBeGreaterThan(2711)
    })

    it('retorna perfil sin calcular macros si faltan datos biométricos', async () => {
      const incompleteProfile = { userId: 'u-2', gender: null, weightKg: null, heightCm: null, birthDate: null, goal: 'MAINTAIN', activityLevel: 'SEDENTARY', calorieTarget: null }
      const { svc, prisma } = buildService()
      prisma.profile.upsert.mockResolvedValue(incompleteProfile)

      const result = await svc.updateProfile('u-2', { activityLevel: 'SEDENTARY' as any })
      // Sin datos completos no debe llamar a .update() para guardar macros
      expect(prisma.profile.update).not.toHaveBeenCalled()
      expect(result.calorieTarget).toBeNull()
    })

    it('lanza BadRequestException si birthDate tiene formato inválido', async () => {
      const { svc, prisma } = buildService()
      prisma.profile.upsert.mockResolvedValue({ ...BASE_PROFILE, birthDate: null })
      await expect(
        svc.updateProfile('u-1', { birthDate: 'not-a-date' }),
      ).rejects.toThrow(BadRequestException)
    })
  })

  // ─── Historial de metas (Paso 3.3) ────────────────────────────────────────
  describe('saveGoalHistory (Paso 3.3)', () => {
    it('cierra el registro activo anterior al actualizar el perfil', async () => {
      const updatedProfile = { ...BASE_PROFILE, calorieTarget: 2711, proteinTarget: 203, carbTarget: 305, fatTarget: 75 }
      const { svc, prisma } = buildService()
      prisma.profile.upsert.mockResolvedValue(updatedProfile)
      prisma.profile.update.mockResolvedValue(updatedProfile)

      await svc.updateProfile('u-1', {
        gender: 'MALE' as any,
        birthDate: '1994-01-01',
        weightKg: 80,
        heightCm: 175,
        activityLevel: 'MODERATELY_ACTIVE' as any,
        goal: 'MAINTAIN' as any,
      })

      // Debe cerrar el goal activo anterior (effectiveTo = null)
      expect(prisma.userGoal.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'u-1', effectiveTo: null }),
        }),
      )
    })

    it('crea un nuevo registro de meta con effectiveFrom = now', async () => {
      const updatedProfile = { ...BASE_PROFILE, calorieTarget: 2711, proteinTarget: 203, carbTarget: 305, fatTarget: 75 }
      const { svc, prisma } = buildService()
      prisma.profile.upsert.mockResolvedValue(updatedProfile)
      prisma.profile.update.mockResolvedValue(updatedProfile)

      await svc.updateProfile('u-1', {
        gender: 'MALE' as any,
        birthDate: '1994-01-01',
        weightKg: 80,
        heightCm: 175,
        activityLevel: 'MODERATELY_ACTIVE' as any,
        goal: 'MAINTAIN' as any,
      })

      expect(prisma.userGoal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'u-1',
            effectiveTo: null,
          }),
        }),
      )
    })
  })

  // ─── getGoalHistory ────────────────────────────────────────────────────────
  describe('getGoalHistory', () => {
    it('retorna el historial de metas ordenado por fecha descendente', async () => {
      const goals = [
        { id: 'g-2', userId: 'u-1', calorieTarget: 2800, effectiveFrom: new Date('2024-06-01'), effectiveTo: null },
        { id: 'g-1', userId: 'u-1', calorieTarget: 2500, effectiveFrom: new Date('2024-01-01'), effectiveTo: new Date('2024-06-01') },
      ]
      const { svc, prisma } = buildService()
      prisma.userGoal.findMany.mockResolvedValue(goals)

      const result = await svc.getGoalHistory('u-1')
      expect(result).toHaveLength(2)
      expect(result[0].calorieTarget).toBe(2800) // más reciente primero
    })

    it('retorna lista vacía si no hay historial', async () => {
      const { svc, prisma } = buildService()
      prisma.userGoal.findMany.mockResolvedValue([])
      const result = await svc.getGoalHistory('u-1')
      expect(result).toHaveLength(0)
    })
  })

  // ─── getDaily ──────────────────────────────────────────────────────────────
  describe('getDaily', () => {
    it('retorna totales en cero si no hay foodLog para el día', async () => {
      const { svc, prisma } = buildService()
      prisma.profile.findUnique.mockResolvedValue({ ...BASE_PROFILE, calorieTarget: 2711, proteinTarget: 203, carbTarget: 305, fatTarget: 75 })
      prisma.foodLog.findUnique.mockResolvedValue(null)

      const result = await svc.getDaily('u-1')
      expect(result.consumed.calories).toBe(0)
      expect(result.consumed.protein).toBe(0)
      expect(result.remaining.calories).toBe(2711)
    })

    it('calcula consumido y restante correctamente con items en el log', async () => {
      const { svc, prisma } = buildService()
      prisma.profile.findUnique.mockResolvedValue({ ...BASE_PROFILE, calorieTarget: 2000, proteinTarget: 150, carbTarget: 225, fatTarget: 56 })
      prisma.foodLog.findUnique.mockResolvedValue({
        items: [
          { snapshotCalories: 400, snapshotProtein: 30, snapshotCarbs: 50, snapshotFat: 10, food: {}, recipe: null },
          { snapshotCalories: 300, snapshotProtein: 25, snapshotCarbs: 35, snapshotFat:  8, food: {}, recipe: null },
        ],
      })

      const result = await svc.getDaily('u-1')
      expect(result.consumed.calories).toBe(700)
      expect(result.consumed.protein).toBe(55)
      expect(result.remaining.calories).toBe(1300)
    })

    it('lanza NotFoundException si no existe perfil al llamar getDaily', async () => {
      const { svc, prisma } = buildService()
      prisma.profile.findUnique.mockResolvedValue(null)
      await expect(svc.getDaily('u-999')).rejects.toThrow(NotFoundException)
    })
  })
})
