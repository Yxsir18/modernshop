import { getMongoDb } from '../config/mongodb';
import { sha256Base64Url } from './tokens';

export interface RefreshSessionRecord {
  userId: string;
  jtiHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  replacedByJtiHash?: string;
  userAgent?: string;
  ipAddress?: string;
}

const COLLECTION = 'refresh_tokens';

function ttlToMs(ttl: string): number {
  // Supports simple forms: "15m", "1h", "7d", "30d"
  const m = ttl.trim().match(/^(\d+)\s*([smhd])$/i);
  if (!m) return 30 * 24 * 60 * 60 * 1000; // 30d default
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const mult =
    unit === 's' ? 1000 :
    unit === 'm' ? 60 * 1000 :
    unit === 'h' ? 60 * 60 * 1000 :
    24 * 60 * 60 * 1000;
  return n * mult;
}

export async function initRefreshTokenIndexes(): Promise<void> {
  const db = await getMongoDb();
  if (!db) return;
  const col = db.collection(COLLECTION);
  await col.createIndex({ jtiHash: 1 }, { unique: true });
  await col.createIndex({ userId: 1, revokedAt: 1 });
  await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
}

export async function storeRefreshSession(args: {
  userId: string;
  jti: string;
  userAgent?: string;
  ipAddress?: string;
}): Promise<{ jtiHash: string; expiresAt: Date }> {
  const db = await getMongoDb();
  if (!db) {
    // If MongoDB is down, treat as no-persist (forces login again)
    throw new Error('MongoDB not available for refresh token storage');
  }

  const refreshTtl = process.env.JWT_REFRESH_TTL || '30d';
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlToMs(refreshTtl));
  const jtiHash = sha256Base64Url(args.jti);

  await db.collection(COLLECTION).insertOne({
    userId: args.userId,
    jtiHash,
    createdAt: now,
    expiresAt,
    revokedAt: null,
    replacedByJtiHash: null,
    userAgent: args.userAgent,
    ipAddress: args.ipAddress
  });

  return { jtiHash, expiresAt };
}

export async function getRefreshSessionByJti(jti: string): Promise<RefreshSessionRecord | null> {
  const db = await getMongoDb();
  if (!db) return null;
  const jtiHash = sha256Base64Url(jti);
  const doc = await db.collection(COLLECTION).findOne({ jtiHash });
  if (!doc) return null;
  return {
    userId: doc.userId,
    jtiHash: doc.jtiHash,
    createdAt: doc.createdAt,
    expiresAt: doc.expiresAt,
    revokedAt: doc.revokedAt || undefined,
    replacedByJtiHash: doc.replacedByJtiHash || undefined,
    userAgent: doc.userAgent || undefined,
    ipAddress: doc.ipAddress || undefined
  };
}

export async function revokeRefreshSession(args: { jti: string; replacedByJti?: string }): Promise<void> {
  const db = await getMongoDb();
  if (!db) return;
  const jtiHash = sha256Base64Url(args.jti);
  const replacedByJtiHash = args.replacedByJti ? sha256Base64Url(args.replacedByJti) : null;
  await db.collection(COLLECTION).updateOne(
    { jtiHash, revokedAt: null },
    { $set: { revokedAt: new Date(), replacedByJtiHash } }
  );
}

export async function revokeAllUserRefreshSessions(userId: string): Promise<void> {
  const db = await getMongoDb();
  if (!db) return;
  await db.collection(COLLECTION).updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

