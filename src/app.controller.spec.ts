/**
 * Tests del AppController — Fase 12.1
 * Cubre: GET / (hello) y GET /health con monitor mock.
 */
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ExternalApiMonitorService } from './common/services/external-api-monitor.service'

function buildController(monitorOverrides: any = {}) {
  const appService = new AppService()
  const monitor: any = {
    getSummary: jest.fn().mockReturnValue({ USDA: { success: 10, rateLimited: 0 }, OFF: { success: 5, rateLimited: 1 } }),
    record: jest.fn(),
    ...monitorOverrides,
  }
  return new AppController(appService, monitor as ExternalApiMonitorService)
}

describe('AppController', () => {

  it('está definido', () => {
    expect(buildController()).toBeDefined()
  })

  describe('GET / (getHello)', () => {
    it('retorna el string de bienvenida', () => {
      const ctrl = buildController()
      expect(ctrl.getHello()).toBe('Hello World!')
    })
  })

  describe('GET /health', () => {
    it('retorna status ok y timestamp ISO', () => {
      const ctrl = buildController()
      const result = ctrl.health()
      expect(result.status).toBe('ok')
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('incluye resumen de APIs externas del monitor', () => {
      const ctrl = buildController()
      const result = ctrl.health()
      expect(result.externalApis).toBeDefined()
      expect(result.externalApis).toHaveProperty('USDA')
      expect(result.externalApis).toHaveProperty('OFF')
    })

    it('llama a monitor.getSummary exactamente una vez', () => {
      const getSummaryMock = jest.fn().mockReturnValue({})
      const ctrl = buildController({ getSummary: getSummaryMock })
      ctrl.health()
      expect(getSummaryMock).toHaveBeenCalledTimes(1)
    })
  })
})
