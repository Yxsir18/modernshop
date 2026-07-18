import fs from 'fs';
import path from 'path';
import { User, Product, Category, Review, Coupon, Order, AppNotification, HeaderConfig, Newsletter, SupportTicket, ChatMessage, CustomerNote, TimerConfig, WarrantyConfig } from '../../src/types';
import { syncDatabaseWithMongo, saveCollectionToMongo, getMongoDb, isMongoConnected } from './mongodb';

// Let's load the seeds or read from db.json
const DB_FILE_PATH = path.join(process.cwd(), 'db.json');


export interface DatabaseState {
  users: User[];
  categories: Category[];
  products: Product[];
  reviews: Review[];
  coupons: Coupon[];
  orders: Order[];
  notifications: AppNotification[];
  newsletters: Newsletter[];
  auditLogs: Array<{
    id: string;
    userId?: string;
    email?: string;
    action: string;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
  }>;
  chatMessages: ChatMessage[];
  headerConfig: HeaderConfig[];
  supportTickets: SupportTicket[];
  customerNotes: CustomerNote[];
  timers: TimerConfig[];
  warranties: WarrantyConfig[];
}

class DatabaseService {
  private state!: DatabaseState;
  private useMongo: boolean = false;
  private initialized: boolean = false;

  constructor() {
    // Don't call async connect in constructor
    this.state = {
      users: [],
      categories: [],
      products: [],
      reviews: [],
      coupons: [],
      orders: [],
      notifications: [],
      newsletters: [],
      auditLogs: [],
      chatMessages: [],
      headerConfig: [],
      supportTickets: [],
      customerNotes: [],
      timers: [],
      warranties: []
    };
  }

  public async connect() {
    if (this.initialized) {
      return;
    }

    try {
      // Try to connect to MongoDB first
      const mongoDb = await getMongoDb();
      this.useMongo = isMongoConnected();

      if (this.useMongo) {
        console.log('[DATABASE] Using MongoDB as primary data source');
        // Load data from MongoDB
        this.state = await this.loadFromMongo();
      } else {
        console.log('[DATABASE] MongoDB not available, falling back to local db.json');
        // Load from local JSON file
        if (fs.existsSync(DB_FILE_PATH)) {
          const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
          const parsed = JSON.parse(raw);
          this.state = {
            users: parsed.users || [],
            categories: parsed.categories || [],
            products: parsed.products || [],
            reviews: parsed.reviews || [],
            coupons: parsed.coupons || [],
            orders: parsed.orders || [],
            notifications: parsed.notifications || [],
            newsletters: parsed.newsletters || [],
            auditLogs: parsed.auditLogs || [],
            chatMessages: parsed.chatMessages || [],
            headerConfig: parsed.headerConfig || [],
            supportTickets: parsed.supportTickets || [],
            customerNotes: parsed.customerNotes || [],
            timers: parsed.timers || [],
            warranties: parsed.warranties || []
          };
        } else {
          console.log('[DATABASE] db.json not found, initializing with empty state');
          this.state = {
            users: [],
            categories: [],
            products: [],
            reviews: [],
            coupons: [],
            orders: [],
            notifications: [],
            newsletters: [],
            auditLogs: [],
            chatMessages: [],
            headerConfig: [],
            supportTickets: [],
            customerNotes: [],
            timers: [],
            warranties: []
          };
          // Don't save in production if file doesn't exist
          if (process.env.NODE_ENV !== 'production') {
            this.save();
          }
        }
      }
      this.initialized = true;
      console.log('Database Connection established successfully.');
    } catch (err) {
      console.error('Failed to connect to Database:', err);
      // Fallback to empty state in production
      this.useMongo = false;
      console.log('[DATABASE] Initializing with empty state due to connection failure');
      this.state = {
        users: [],
        categories: [],
        products: [],
        reviews: [],
        coupons: [],
        orders: [],
        notifications: [],
        newsletters: [],
        auditLogs: [],
        chatMessages: [],
        headerConfig: [],
        supportTickets: [],
        customerNotes: [],
        timers: [],
        warranties: []
      };
      this.initialized = true;
    }
  }

  private async loadFromMongo(): Promise<DatabaseState> {
    const mongoDb = await getMongoDb();
    if (!mongoDb) {
      throw new Error('MongoDB not connected');
    }

    const collectionsToSync = [
      'users',
      'categories',
      'products',
      'reviews',
      'coupons',
      'orders',
      'notifications',
      'newsletters',
      'auditLogs',
      'chatMessages',
      'headerConfig',
      'supportTickets',
      'customerNotes',
      'timers',
      'warranties'
    ];

    const state: DatabaseState = {
      users: [],
      categories: [],
      products: [],
      reviews: [],
      coupons: [],
      orders: [],
      notifications: [],
      newsletters: [],
      auditLogs: [],
      chatMessages: [],
      headerConfig: [],
      supportTickets: [],
      customerNotes: [],
      timers: [],
      warranties: []
    };

    for (const colName of collectionsToSync) {
      try {
        const collection = mongoDb.collection(colName);
        const items = await collection.find({}).toArray();
        console.log(`[DATABASE] Loaded ${items.length} items from MongoDB collection "${colName}"`);
        
        // Convert MongoDB _id to string or strip it to keep TypeScript-safe local types
        state[colName as keyof DatabaseState] = items.map((item: any) => {
          const { _id, ...rest } = item;
          return { id: item.id || _id?.toString(), ...rest };
        }) as any;
      } catch (err) {
        console.error(`[DATABASE] Failed to load collection "${colName}":`, err);
      }
    }

    // If MongoDB is empty, seed from local db.json
    if (state.users.length === 0 && state.products.length === 0 && fs.existsSync(DB_FILE_PATH)) {
      console.log('[DATABASE] MongoDB is empty, seeding from local db.json');
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      this.state = {
        users: parsed.users || [],
        categories: parsed.categories || [],
        products: parsed.products || [],
        reviews: parsed.reviews || [],
        coupons: parsed.coupons || [],
        orders: parsed.orders || [],
        notifications: parsed.notifications || [],
        newsletters: parsed.newsletters || [],
        auditLogs: parsed.auditLogs || [],
        chatMessages: parsed.chatMessages || [],
        headerConfig: parsed.headerConfig || [],
        supportTickets: parsed.supportTickets || [],
        customerNotes: parsed.customerNotes || [],
        timers: parsed.timers || [],
        warranties: parsed.warranties || []
      };
      // Sync to MongoDB
      await syncDatabaseWithMongo(this.state);
    } else {
      this.state = state;
    }

    return this.state;
  }

  public async initMongoSync() {
    if (this.useMongo) {
      console.log('[DATABASE] MongoDB is already primary, skipping sync');
      return;
    }
    
    try {
      console.log('[MONGODB] Performing initial boot synchronization cycle...');
      const synced = await syncDatabaseWithMongo(this.state);
      this.state = synced;
      this.save();
      console.log('[MONGODB] Initial database synchronization complete.');
    } catch (err) {
      console.error('[MONGODB] Initial database synchronization failed:', err);
    }
  }

  public save() {
    try {
      if (this.useMongo) {
        // Don't save to local JSON when using MongoDB
        return;
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Critical database flushing failure:', err);
    }
  }

  // Mongoose Collection helpers
  public getCollection<K extends keyof DatabaseState>(col: K): DatabaseState[K] {
    return this.state[col];
  }

  public async updateCollection<K extends keyof DatabaseState>(col: K, data: DatabaseState[K]) {
    this.state[col] = data;
    
    if (this.useMongo) {
      // Save to MongoDB directly
      await saveCollectionToMongo(col, data);
    } else {
      // Save to local JSON and sync to MongoDB in background
      this.save();
      saveCollectionToMongo(col, data).catch(err => {
        console.error(`[MONGODB] Background save failed for collection "${col}":`, err);
      });
    }
  }

  // Audit Logger
  public async logAudit(userId: string | undefined, email: string | undefined, action: string, ip: string, userAgent: string) {
    const logs = this.state.auditLogs;
    logs.push({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      email,
      action,
      ipAddress: ip || '127.0.0.1',
      userAgent: userAgent || 'Sovereign Core Client',
      timestamp: new Date().toISOString()
    });
    this.state.auditLogs = logs.slice(-200); // Caps last 200 items for memory stability
    
    if (this.useMongo) {
      await saveCollectionToMongo('auditLogs', this.state.auditLogs);
    } else {
      this.save();
      saveCollectionToMongo('auditLogs', this.state.auditLogs).catch(err => {
        console.error('[MONGODB] Background save failed for auditLogs:', err);
      });
    }
  }
}

export const dbConnection = new DatabaseService();
