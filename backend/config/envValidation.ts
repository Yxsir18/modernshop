import dotenv from 'dotenv';
dotenv.config();

export interface EnvironmentStatus {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export function validateProductionEnvironment(): EnvironmentStatus {
  const status: EnvironmentStatus = {
    valid: true,
    warnings: [],
    errors: []
  };

  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Core Secret Validation
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri || mongoUri.includes('mongodb+srv://...')) {
    if (isProduction) {
      status.errors.push('MONGODB_URI is not set or has placeholder values. Cloud database operations will fail.');
      status.valid = false;
    } else {
      status.warnings.push('MONGODB_URI is using local database fallbacks. This is fine for development.');
    }
  }

  // 2. AI Capabilities Validation
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey === 'MY_GEMINI_API_KEY') {
    status.warnings.push('GEMINI_API_KEY is not defined. The app will fall back to static e-commerce recommendations.');
  }

  // 3. Cache Validation
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    status.warnings.push('REDIS_URL is empty. Memory optimization falls back to local NodeJS memory caching.');
  }

  // 4. Cloudinary upload support
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) {
    status.warnings.push('CLOUDINARY_URL CDN is disabled. Product uploads will fallback to local folder writes.');
  }

  // 5. Auth secrets (required for real JWT auth)
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!accessSecret || accessSecret.trim().length < 32) {
    if (isProduction) {
      status.errors.push('JWT_ACCESS_SECRET is missing/too short. Refusing to start in production.');
      status.valid = false;
    } else {
      status.warnings.push('JWT_ACCESS_SECRET is missing/too short. Dev will fall back to an ephemeral secret (tokens will invalidate on restart).');
    }
  }
  if (!refreshSecret || refreshSecret.trim().length < 32) {
    if (isProduction) {
      status.errors.push('JWT_REFRESH_SECRET is missing/too short. Refusing to start in production.');
      status.valid = false;
    } else {
      status.warnings.push('JWT_REFRESH_SECRET is missing/too short. Dev will fall back to an ephemeral secret (sessions will invalidate on restart).');
    }
  }

  // Display report nicely
  console.log('\n======================================================');
  console.log('🛡️  MODERNSHOP ENTERPRISE ENVIRONMENT PRE-FLIGHT VERIFIER');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (status.valid) {
    console.log('Status: ACTIVE & COMPLIANT');
  } else {
    console.log('Status: SYSTEM INCOMPLIANT / ERROR BLOCKED');
  }

  status.warnings.forEach(w => console.log(`[WARNING] ⚠️  ${w}`));
  status.errors.forEach(e => console.error(`[CRITICAL] 🚨  ${e}`));
  console.log('======================================================\n');

  return status;
}
