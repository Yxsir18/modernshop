import { createServer } from 'http';
import { handler } from '../server';

export default async function handler(req: any, res: any) {
  // This is a placeholder - we need to properly set up Vercel serverless functions
  // The current architecture with a monolithic server.ts doesn't work well with Vercel
  res.status(503).json({ error: 'Serverless functions not configured. This application needs to be refactored for Vercel deployment.' });
}
