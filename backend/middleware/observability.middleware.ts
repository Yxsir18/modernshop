import { Request, Response, NextFunction } from 'express';

// Live telemetry cache for Phase 16 observability metrics
export const metricsStorage = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  activeConnections: 0,
  routeHitCounter: {} as Record<string, number>,
  responseTimeAccumulator: 0,
  responseTimeCount: 0,
  latencyHistogram: [] as number[], // sliding window of last 100 response times
  statusCodes: {} as Record<number, number>
};

export const observabilityTracker = (req: Request, res: Response, next: NextFunction) => {
  metricsStorage.totalRequests += 1;
  metricsStorage.activeConnections += 1;

  // 1. Generate elegant tracing traceId
  const traceId = `tr-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`;
  (req as any).traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);

  // 2. Map route hit counter
  const routeKey = `${req.method} ${req.baseUrl || ''}${req.path}`;
  metricsStorage.routeHitCounter[routeKey] = (metricsStorage.routeHitCounter[routeKey] || 0) + 1;

  const startHrTime = process.hrtime();

  res.on('finish', () => {
    metricsStorage.activeConnections = Math.max(0, metricsStorage.activeConnections - 1);
    const elapsedHrTime = process.hrtime(startHrTime);
    const durationMs = (elapsedHrTime[0] * 1000) + (elapsedHrTime[1] / 1000000);
    
    // Accumulate for average response time metric
    metricsStorage.responseTimeAccumulator += durationMs;
    metricsStorage.responseTimeCount += 1;
    
    // Sliding window of latency
    metricsStorage.latencyHistogram.push(durationMs);
    if (metricsStorage.latencyHistogram.length > 100) {
      metricsStorage.latencyHistogram.shift();
    }

    // Status code count
    const status = res.statusCode;
    metricsStorage.statusCodes[status] = (metricsStorage.statusCodes[status] || 0) + 1;

    if (status >= 200 && status < 400) {
      metricsStorage.successfulRequests += 1;
    } else {
      metricsStorage.failedRequests += 1;
    }

    // 3. Output beautifully structured JSON-like log to standard out
    const logObject = {
      timestamp: new Date().toISOString(),
      level: status >= 500 ? 'ERROR' : (status >= 400 ? 'WARN' : 'INFO'),
      traceId,
      method: req.method,
      path: req.path,
      statusCode: status,
      durationMs: durationMs.toFixed(2) + 'ms',
      userAgent: req.headers['user-agent'] || 'Unknown'
    };

    console.log(`[${logObject.timestamp}] [${logObject.level}] [TR-ID: ${logObject.traceId}] ${logObject.method} ${logObject.path} -> Status ${logObject.statusCode} (${logObject.durationMs})`);
  });

  next();
};
