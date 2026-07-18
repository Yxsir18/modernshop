import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;

// We will use "ModernShop" as our database name to keep it neat
const DB_NAME = 'ModernShop';

export async function connectToMongoDB(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('mongodb+srv://...')) {
    console.warn('[MONGODB] Connection string MONGODB_URI is not set or is still a placeholder. Falling back to local db.json.');
    return null;
  }

  if (db) {
    return db;
  }

  try {
    console.log('[MONGODB] Initializing connection to MongoDB Atlas...');
    const maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10');
    const minPoolSize = parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2');
    const serverSelectionTimeoutMS = parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000');
    const socketTimeoutMS = parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000');
    
    client = new MongoClient(uri, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: serverSelectionTimeoutMS,
      socketTimeoutMS: socketTimeoutMS,
      maxPoolSize: maxPoolSize,
      minPoolSize: minPoolSize,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 5000,
    });
    await client.connect();
    db = client.db(DB_NAME);
    isConnected = true;
    console.log('[MONGODB] Connected successfully to MongoDB Atlas Database:', DB_NAME);
    console.log(`[MONGODB] Connection pool configured: min=${minPoolSize}, max=${maxPoolSize}`);
    return db;
  } catch (error: any) {
    const errorMsg = error?.message || '';
    const isSslAlert = errorMsg.includes('SSL routines') || errorMsg.includes('tlsv1 alert') || errorMsg.includes('ALERT_INTERNAL_ERROR') || errorMsg.includes('Server selection timed out');
    
    console.warn('\n======================================================================');
    console.warn('[MONGODB] COULD NOT CONNECT TO YOUR MONGODB ATLAS INSTANCE');
    if (isSslAlert) {
      console.warn('Reason: SSL Alert / Connection Blocked (IP Whitelist Issue)');
      console.warn('Since Cloud Run uses dynamic container IPs, your Atlas firewall is rejecting the handshake.');
      console.warn('\n👉 HOW TO FIX THIS IN MONGODB ATLAS:');
      console.warn('1. Log into your MongoDB Atlas Dashboard (https://cloud.mongodb.com)');
      console.warn('2. In the left sidebar, click "Network Access" under Security.');
      console.warn('3. Click the "Add IP Address" button.');
      console.warn('4. Click "Allow Access From Anywhere" (which adds 0.0.0.0/0) and click Confirm.');
      console.warn('5. Wait 1-2 minutes for the changes to apply, then refresh this page.');
    } else {
      console.warn('Details:', errorMsg);
    }
    console.warn('Action: Seamlessly falling back to high-fidelity JSON local database db.json.');
    console.warn('======================================================================\n');
    
    isConnected = false;
    return null;
  }
}

export function isMongoConnected(): boolean {
  return isConnected;
}

export async function getMongoDb(): Promise<Db | null> {
  if (!isConnected) {
    return await connectToMongoDB();
  }
  return db;
}

/**
 * Sync entire local state to/from MongoDB.
 * Ensures MongoDB is the ultimate source of truth, but if MongoDB is completely empty,
 * it will seed MongoDB with our high-quality local JSON data.
 */
export async function syncDatabaseWithMongo(localState: any): Promise<any> {
  const mongoDb = await getMongoDb();
  if (!mongoDb) {
    return localState;
  }

  try {
    const collectionsToSync = [
      'users',
      'categories',
      'products',
      'reviews',
      'coupons',
      'orders',
      'notifications',
      'auditLogs',
      'chatMessages',
      'headerConfig',
      'supportTickets',
      'customerNotes',
      'timers',
      'warranties',
      'newsletters'
    ];

    const syncedState = { ...localState };

    for (const colName of collectionsToSync) {
      const collection = mongoDb.collection(colName);
      const count = await collection.countDocuments();

      if (count === 0) {
        // MongoDB is empty
        if (localState[colName] && Array.isArray(localState[colName]) && localState[colName].length > 0) {
          // We have local seeded data. Seed MongoDB!
          console.log(`[MONGODB] Seeding empty MongoDB collection "${colName}" with ${localState[colName].length} items...`);
          const seedItems = localState[colName].map((item: any) => {
            const { _id, ...rest } = item;
            return rest;
          });
          const ops = seedItems
            .filter((it: any) => it && it.id)
            .map((it: any) => ({
              updateOne: {
                filter: { id: it.id },
                update: { $set: it },
                upsert: true
              }
            }));
          if (ops.length) {
            await collection.bulkWrite(ops, { ordered: false });
          }
        } else {
          // No local data either, initialize empty array
          syncedState[colName] = [];
        }
      } else {
        // MongoDB has data. Pull it and overwrite/update our local state to match MongoDB.
        const mongoItems = await collection.find({}).toArray();
        console.log(`[MONGODB] Loaded ${mongoItems.length} items from collection "${colName}".`);
        // Convert MongoDB _id to string or strip it to keep TypeScript-safe local types
        syncedState[colName] = mongoItems.map((item: any) => {
          const { _id, ...rest } = item;
          return { id: item.id || _id?.toString(), ...rest };
        });
      }
    }

    return syncedState;
  } catch (error) {
    console.error('[MONGODB] Sync cycle failure. Preserving current state.', error);
    return localState;
  }
}

/**
 * Asynchronously save a collection's state directly to MongoDB.
 * Runs in the background to ensure Zero Lag on client API operations.
 */
export async function saveCollectionToMongo(colName: string, items: any[]): Promise<void> {
  const mongoDb = await getMongoDb();
  if (!mongoDb) return;

  try {
    const collection = mongoDb.collection(colName);
    // Production-grade sync:
    // - upsert each doc by "id" (bulkWrite)
    // - delete only removed docs (bulk deleteOne ops), no full deleteMany+insertMany rewrite

    const sanitizedItems = (items || []).map((item: any) => {
      const { _id, ...rest } = item || {};
      return rest;
    });

    // If there is no "id" field we cannot safely sync; fall back to no-op.
    const incoming = sanitizedItems.filter((it: any) => it && it.id);
    const incomingIds = new Set(incoming.map((it: any) => String(it.id)));

    // Fetch existing ids for targeted deletions
    const existingDocs = await collection.find({}, { projection: { id: 1 } }).toArray();
    const deleteOps = existingDocs
      .map((d: any) => d?.id)
      .filter((id: any) => id && !incomingIds.has(String(id)))
      .map((id: any) => ({ deleteOne: { filter: { id } } }));

    const upsertOps = incoming.map((it: any) => ({
      updateOne: {
        filter: { id: it.id },
        update: { $set: it },
        upsert: true
      }
    }));

    const ops = [...upsertOps, ...deleteOps];
    if (ops.length > 0) {
      await collection.bulkWrite(ops, { ordered: false });
    }

    console.log(
      `[MONGODB] Synchronized collection "${colName}" to cloud (upserts=${upsertOps.length}, deletes=${deleteOps.length}).`
    );
  } catch (error) {
    console.error(`[MONGODB] Failed to synchronize collection "${colName}" to cloud:`, error);
  }
}
