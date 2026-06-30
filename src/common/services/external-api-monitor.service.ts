/**
 * ExternalApiMonitorService — Paso 12.2
 * Registra métricas de llamadas a APIs externas (USDA, OFF).
 * En memoria (suficiente para v1); reemplazar por Prometheus/Datadog en producción.
 */
import { Injectable, Logger } from '@nestjs/common';

export type ExternalSource = 'USDA' | 'OFF';

interface CallRecord {
  source:      ExternalSource;
  endpoint:    string;
  success:     boolean;
  statusCode?: number;
  durationMs:  number;
  timestamp:   string;
  rateLimited: boolean;
}

// Ventana de retención: últimas 500 llamadas
const MAX_RECORDS = 500;

@Injectable()
export class ExternalApiMonitorService {
  private readonly logger = new Logger('ExternalAPI');
  private readonly records: CallRecord[] = [];

  record(entry: Omit<CallRecord, 'timestamp'>) {
    const record: CallRecord = { ...entry, timestamp: new Date().toISOString() };
    this.records.push(record);
    if (this.records.length > MAX_RECORDS) this.records.shift();

    const level = entry.rateLimited ? 'warn' : entry.success ? 'log' : 'error';
    this.logger[level](
      JSON.stringify({
        type:       'external_api',
        source:     entry.source,
        endpoint:   entry.endpoint,
        success:    entry.success,
        statusCode: entry.statusCode,
        durationMs: entry.durationMs,
        rateLimited: entry.rateLimited,
      }),
    );
  }

  /** Stats útiles para el endpoint /health o un dashboard de admin */
  getSummary() {
    const now = Date.now();
    const last1h = this.records.filter(
      (r) => now - new Date(r.timestamp).getTime() < 60 * 60 * 1000,
    );

    const bySource = (src: ExternalSource) => {
      const calls = last1h.filter((r) => r.source === src);
      return {
        total:       calls.length,
        success:     calls.filter((r) => r.success).length,
        rateLimited: calls.filter((r) => r.rateLimited).length,
        errors:      calls.filter((r) => !r.success && !r.rateLimited).length,
        avgMs:
          calls.length > 0
            ? Math.round(calls.reduce((s, r) => s + r.durationMs, 0) / calls.length)
            : 0,
      };
    };

    return {
      window: 'last_1h',
      USDA:   bySource('USDA'),
      OFF:    bySource('OFF'),
    };
  }
}
