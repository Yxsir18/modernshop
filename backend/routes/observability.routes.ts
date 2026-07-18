import { Router, Request, Response } from 'express';
import { isMongoConnected } from '../config/mongodb';
import { getActiveSocketCount } from '../sockets/socketService';
import { metricsStorage } from '../middleware/observability.middleware';

const router = Router();
const systemStartTime = Date.now();

// 1. HEALTHCHECK ENDPOINT (/api/health or registered centrally)
router.get('/health', (req: Request, res: Response) => {
  const isDbActive = isMongoConnected();
  const uptimeSeconds = Math.floor((Date.now() - systemStartTime) / 1000);
  
  const healthReport = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: `${uptimeSeconds}s`,
    database: {
      status: isDbActive ? 'CONNECTED' : 'FALLBACK_ACTIVE',
      engine: isDbActive ? 'MongoDB Atlas Cloud' : 'High-Fidelity Offline JSON'
    },
    sockets: {
      activeClients: getActiveSocketCount()
    },
    system: {
      nodeVersion: process.version,
      memoryUsage: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
      }
    }
  };

  res.status(200).json(healthReport);
});

// 2. METRICS TELEMETRY ENDPOINT
router.get('/metrics', (req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - systemStartTime) / 1000);
  const avgResponseTime = metricsStorage.responseTimeCount > 0 
    ? (metricsStorage.responseTimeAccumulator / metricsStorage.responseTimeCount)
    : 0;

  // Prometheus compatible format + elegant JSON dual-support
  if (req.headers.accept?.includes('text/plain') || req.query.format === 'prometheus') {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    const prometheusFormat = `
# HELP modernshop_uptime_seconds System boot uptime in seconds.
# TYPE modernshop_uptime_seconds counter
modernshop_uptime_seconds ${uptimeSeconds}

# HELP modernshop_requests_total Total HTTP request count.
# TYPE modernshop_requests_total counter
modernshop_requests_total ${metricsStorage.totalRequests}

# HELP modernshop_requests_successful Successful query count.
# TYPE modernshop_requests_successful counter
modernshop_requests_successful ${metricsStorage.successfulRequests}

# HELP modernshop_requests_failed Failed query count.
# TYPE modernshop_requests_failed counter
modernshop_requests_failed ${metricsStorage.failedRequests}

# HELP modernshop_response_time_ms_avg Average REST response duration.
# TYPE modernshop_response_time_ms_avg gauge
modernshop_response_time_ms_avg ${avgResponseTime.toFixed(4)}

# HELP modernshop_active_sockets Active WebSocket connections.
# TYPE modernshop_active_sockets gauge
modernshop_active_sockets ${getActiveSocketCount()}

# HELP modernshop_active_http_connections Concurrent request lines.
# TYPE modernshop_active_http_connections gauge
modernshop_active_http_connections ${metricsStorage.activeConnections}
    `.trim();
    return res.status(200).send(prometheusFormat);
  }

  // Fallback to beautiful structured JSON Metrics for easy monitoring dashboards
  res.status(200).json({
    metricsVersion: '1.0.0',
    uptimeSeconds,
    totals: {
      requests: metricsStorage.totalRequests,
      successful: metricsStorage.successfulRequests,
      failed: metricsStorage.failedRequests
    },
    performance: {
      averageResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      slidingLatencyHistogram: metricsStorage.latencyHistogram.map(l => parseFloat(l.toFixed(2)))
    },
    routing: {
      hits: metricsStorage.routeHitCounter
    },
    networking: {
      concurrentHttpConnections: metricsStorage.activeConnections,
      activeWebSocketConnections: getActiveSocketCount()
    },
    responses: {
      statusCodes: metricsStorage.statusCodes
    }
  });
});

export default router;
