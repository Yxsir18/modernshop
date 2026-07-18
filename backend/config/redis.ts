import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | null = null;
let connecting: Promise<RedisClient | null> | null = null;

export async function getRedisClient(): Promise<RedisClient | null> {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (client) return client;
  if (connecting) return connecting;

  connecting = (async () => {
    try {
      const c = createClient({ url });
      c.on('error', (err) => {
        // Avoid crashing the process due to transient redis issues
        console.warn('[REDIS] Client error:', err?.message || err);
      });
      await c.connect();
      console.log('[REDIS] Connected successfully.');
      client = c as RedisClient;
      return client;
    } catch (e: any) {
      console.warn('[REDIS] Connection failed. Falling back to in-memory cache.', e?.message || e);
      client = null;
      return null;
    } finally {
      connecting = null;
    }
  })();

  return connecting;
}

export function isRedisConnected(): boolean {
  return Boolean(client && (client as any).isReady);
}
